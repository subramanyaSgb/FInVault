import { create } from 'zustand'
import { db } from '@/lib/db'
import {
  encryptBlob,
  decryptBlob,
  serializeEncryptedBlob,
  deserializeEncryptedBlob,
  retrieveMasterKey,
} from '@/lib/crypto'
import type { Document, DocumentCategory } from '@/types'

interface DocumentState {
  documents: Document[]
  isLoading: boolean

  // Actions
  loadDocuments: (profileId: string) => Promise<void>
  addDocument: (
    profileId: string,
    file: File,
    metadata: {
      category: DocumentCategory
      name: string
      documentNumber?: string
      issueDate?: Date
      expiryDate?: Date
      issuingAuthority?: string
      notes?: string
      tags: string[]
    }
  ) => Promise<Document>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  viewDocument: (document: Document) => Promise<Blob | null>

  // Search & Filter
  searchDocuments: (profileId: string, query: string) => Promise<Document[]>
  getDocumentsByCategory: (profileId: string, category: DocumentCategory) => Promise<Document[]>
  getExpiringDocuments: (profileId: string, days: number) => Promise<Document[]>

  // OCR
  extractDocumentText: (file: File) => Promise<string>
}

export const useDocumentStore = create<DocumentState>()((set, get) => ({
  documents: [],
  isLoading: false,

  loadDocuments: async (profileId: string) => {
    const documents = await db.documents.where('profileId').equals(profileId).sortBy('createdAt')
    set({ documents })
  },

  addDocument: async (profileId, file, metadata) => {
    // Get encryption key
    const keyId = `profile_${profileId}`
    const masterKey = await retrieveMasterKey(keyId)

    if (!masterKey) {
      throw new Error('Encryption key not found. Please login again.')
    }

    // Encrypt file
    const encryptedBlob = await encryptBlob(file, masterKey)
    const serializedData = serializeEncryptedBlob(encryptedBlob)
    const fileBlob = new Blob([serializedData], { type: 'application/json' })

    // Create thumbnail (simplified - in production would generate actual thumbnail)
    const thumbnail = await generateThumbnail(file)

    // Extract OCR text if possible
    let ocrText: string | undefined
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      try {
        ocrText = await get().extractDocumentText(file)
      } catch {
        // OCR failed, continue without
      }
    }

    const document: Document = {
      id: generateId(),
      profileId,
      category: metadata.category,
      name: metadata.name,
      file: fileBlob,
      fileType: file.type,
      fileSize: file.size,
      tags: metadata.tags,
      version: 1,
      reminderDays: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (metadata.documentNumber) document.documentNumber = metadata.documentNumber
    if (metadata.issueDate) document.issueDate = metadata.issueDate
    if (metadata.expiryDate) document.expiryDate = metadata.expiryDate
    if (metadata.issuingAuthority) document.issuingAuthority = metadata.issuingAuthority
    if (thumbnail) document.thumbnail = thumbnail
    if (ocrText) document.ocrText = ocrText
    if (metadata.notes) document.notes = metadata.notes

    await db.documents.add(document)
    await get().loadDocuments(profileId)

    return document
  },

  updateDocument: async (id, updates) => {
    await db.documents.update(id, {
      ...updates,
      updatedAt: new Date(),
    })
    const document = await db.documents.get(id)
    if (document) {
      await get().loadDocuments(document.profileId)
    }
  },

  deleteDocument: async id => {
    const document = await db.documents.get(id)
    if (document) {
      await db.documents.delete(id)
      await get().loadDocuments(document.profileId)
    }
  },

  viewDocument: async document => {
    try {
      // Get encryption key
      const keyId = `profile_${document.profileId}`
      const masterKey = await retrieveMasterKey(keyId)

      if (!masterKey) {
        throw new Error('Encryption key not found')
      }

      // Read the blob
      const serializedData = await document.file.text()
      const encryptedBlob = deserializeEncryptedBlob(serializedData)

      // Decrypt
      const decryptedBlob = await decryptBlob(encryptedBlob, masterKey)
      return decryptedBlob
    } catch (error) {
      console.error('Failed to decrypt document:', error)
      return null
    }
  },

  searchDocuments: async (profileId, query) => {
    const documents = await db.documents.where('profileId').equals(profileId).toArray()

    const lowerQuery = query.toLowerCase()
    return documents.filter(
      doc =>
        doc.name.toLowerCase().includes(lowerQuery) ||
        doc.category.toLowerCase().includes(lowerQuery) ||
        doc.documentNumber?.toLowerCase().includes(lowerQuery) ||
        doc.ocrText?.toLowerCase().includes(lowerQuery) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  },

  getDocumentsByCategory: async (profileId, category) => {
    return db.documents
      .where('profileId')
      .equals(profileId)
      .and(d => d.category === category)
      .toArray()
  },

  getExpiringDocuments: async (profileId, days) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    return db.documents
      .where('profileId')
      .equals(profileId)
      .and(d => d.expiryDate !== undefined && new Date(d.expiryDate) <= cutoffDate)
      .toArray()
  },

  extractDocumentText: async _file => {
    // This would integrate with Tesseract.js in production
    // For now, return empty string
    return ''
  },
}))

async function generateThumbnail(file: File): Promise<Blob | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined
  }

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, 200, 200)
        canvas.toBlob(blob => resolve(blob || undefined), 'image/jpeg', 0.7)
      } else {
        resolve(undefined)
      }
    }
    img.onerror = () => resolve(undefined)
    img.src = URL.createObjectURL(file)
  })
}

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
