import { create } from 'zustand'
import { db } from '@/lib/db'
import type { Contact } from '@/types'

interface ContactState {
  contacts: Contact[]
  isLoading: boolean
  error: string | null

  // Actions
  loadContacts: (profileId: string) => Promise<void>
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'totalOwed' | 'totalOwing' | 'transactionCount'>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  updateContactStats: (id: string, transactionAmount: number, type: 'owed' | 'owing') => Promise<void>

  // Getters
  getContactById: (id: string) => Contact | undefined
  getContactByName: (name: string) => Contact | undefined
  getActiveContacts: () => Contact[]
  searchContacts: (query: string) => Contact[]
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  loadContacts: async (profileId: string) => {
    set({ isLoading: true, error: null })
    try {
      const contacts = await db.contacts
        .where('profileId')
        .equals(profileId)
        .and(c => c.isActive)
        .sortBy('name')
      set({ contacts, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  createContact: async (contactData) => {
    try {
      const now = new Date()
      const newContact: Contact = {
        ...contactData,
        id: crypto.randomUUID(),
        totalOwed: 0,
        totalOwing: 0,
        transactionCount: 0,
        createdAt: now,
        updatedAt: now,
      }

      await db.contacts.add(newContact)

      set(state => ({
        contacts: [...state.contacts, newContact].sort((a, b) => a.name.localeCompare(b.name)),
      }))

      return newContact
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  updateContact: async (id: string, updates: Partial<Contact>) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      }

      await db.contacts.update(id, updatedData)

      set(state => ({
        contacts: state.contacts.map(c =>
          c.id === id ? { ...c, ...updatedData } : c
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  deleteContact: async (id: string) => {
    try {
      // Soft delete by setting isActive to false
      await db.contacts.update(id, { isActive: false, updatedAt: new Date() })

      set(state => ({
        contacts: state.contacts.filter(c => c.id !== id),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  updateContactStats: async (id: string, transactionAmount: number, type: 'owed' | 'owing') => {
    try {
      const contact = get().contacts.find(c => c.id === id)
      if (!contact) return

      const updates: Partial<Contact> = {
        transactionCount: contact.transactionCount + 1,
        lastTransactionDate: new Date(),
        updatedAt: new Date(),
      }

      if (type === 'owed') {
        updates.totalOwed = contact.totalOwed + transactionAmount
      } else {
        updates.totalOwing = contact.totalOwing + transactionAmount
      }

      await db.contacts.update(id, updates)

      set(state => ({
        contacts: state.contacts.map(c =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  getContactById: (id: string) => {
    return get().contacts.find(c => c.id === id)
  },

  getContactByName: (name: string) => {
    const normalizedName = name.toLowerCase().trim()
    return get().contacts.find(
      c => c.name.toLowerCase() === normalizedName ||
           c.nickname?.toLowerCase() === normalizedName
    )
  },

  getActiveContacts: () => {
    return get().contacts.filter(c => c.isActive)
  },

  searchContacts: (query: string) => {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return get().contacts

    return get().contacts.filter(
      c =>
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.nickname?.toLowerCase().includes(normalizedQuery) ||
        c.email?.toLowerCase().includes(normalizedQuery) ||
        c.phone?.includes(normalizedQuery)
    )
  },
}))
