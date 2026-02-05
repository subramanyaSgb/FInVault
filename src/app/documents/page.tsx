'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Search, Folder, AlertCircle, Upload, X, ArrowLeft, Trash2, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDocumentStore } from '@/stores/documentStore'
import type { Document, DocumentCategory } from '@/types'

interface DocumentFormData {
  name: string
  category: DocumentCategory
  documentNumber: string
  issueDate: string
  expiryDate: string
  issuingAuthority: string
  notes: string
  tags: string
}

// Component to handle thumbnail with proper cleanup
function DocumentThumbnail({ doc }: { doc: Document }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (doc.thumbnail) {
      const url = URL.createObjectURL(doc.thumbnail)
      objectUrlRef.current = url
      setThumbnailUrl(url)
    }

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [doc.thumbnail])

  if (!thumbnailUrl) {
    return <FileText className="w-8 h-8 text-text-tertiary" />
  }

  return <img src={thumbnailUrl} alt={doc.name} className="w-full h-full object-cover" />
}

const categories: { id: DocumentCategory; label: string; icon: string }[] = [
  { id: 'identity', label: 'Identity', icon: '🆔' },
  { id: 'financial', label: 'Financial', icon: '💰' },
  { id: 'property', label: 'Property', icon: '🏠' },
  { id: 'vehicle', label: 'Vehicle', icon: '🚗' },
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'legal', label: 'Legal', icon: '⚖️' },
  { id: 'employment', label: 'Employment', icon: '💼' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'other', label: 'Other', icon: '📁' },
]

const initialFormData: DocumentFormData = {
  name: '',
  category: 'other',
  documentNumber: '',
  issueDate: '',
  expiryDate: '',
  issuingAuthority: '',
  notes: '',
  tags: '',
}

export default function DocumentsPage() {
  const { currentProfile } = useAuthStore()
  const { documents, loadDocuments, searchDocuments, addDocument, deleteDocument, viewDocument, getExpiringDocuments } = useDocumentStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all')
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([])
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [viewingDocBlob, setViewingDocBlob] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [formData, setFormData] = useState<DocumentFormData>(initialFormData)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadExpiring = useCallback(async () => {
    if (!currentProfile) return
    const docs = await getExpiringDocuments(currentProfile.id, 60)
    setExpiringDocs(docs)
  }, [currentProfile, getExpiringDocuments])

  useEffect(() => {
    if (currentProfile) {
      loadDocuments(currentProfile.id)
      loadExpiring()
    }
  }, [currentProfile, loadDocuments, loadExpiring])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (currentProfile && query) {
      await searchDocuments(currentProfile.id, query)
    } else if (currentProfile) {
      await loadDocuments(currentProfile.id)
    }
  }

  const filteredDocs =
    selectedCategory === 'all' ? documents : documents.filter(d => d.category === selectedCategory)

  const resetForm = () => {
    setFormData(initialFormData)
    setSelectedFile(null)
    setFilePreview(null)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    resetForm()
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setFilePreview(url)
    } else {
      setFilePreview(null)
    }
    // Auto-fill name from file name
    if (!formData.name) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setFormData({ ...formData, name: nameWithoutExt })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    const firstFile = files[0]
    if (files.length > 0 && firstFile) {
      handleFileSelect(firstFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    const firstFile = files?.[0]
    if (files && files.length > 0 && firstFile) {
      handleFileSelect(firstFile)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProfile || !selectedFile) return

    setIsUploading(true)
    try {
      const metadata: {
        category: DocumentCategory
        name: string
        documentNumber?: string
        issueDate?: Date
        expiryDate?: Date
        issuingAuthority?: string
        notes?: string
        tags: string[]
      } = {
        category: formData.category,
        name: formData.name,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (formData.documentNumber) metadata.documentNumber = formData.documentNumber
      if (formData.issueDate) metadata.issueDate = new Date(formData.issueDate)
      if (formData.expiryDate) metadata.expiryDate = new Date(formData.expiryDate)
      if (formData.issuingAuthority) metadata.issuingAuthority = formData.issuingAuthority
      if (formData.notes) metadata.notes = formData.notes

      await addDocument(currentProfile.id, selectedFile, metadata)
      handleCloseUploadModal()
      loadExpiring()
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewDocument = async (doc: Document) => {
    setViewingDoc(doc)
    const blob = await viewDocument(doc)
    if (blob) {
      const url = URL.createObjectURL(blob)
      setViewingDocBlob(url)
    }
  }

  const handleCloseViewer = () => {
    if (viewingDocBlob) {
      URL.revokeObjectURL(viewingDocBlob)
    }
    setViewingDoc(null)
    setViewingDocBlob(null)
  }

  const handleDeleteDocument = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id)
      loadExpiring()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-bg-secondary rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Documents</p>
              <h1 className="text-lg font-semibold text-text-primary">Document Vault</h1>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="p-2 bg-accent-alpha rounded-full"
          >
            <Plus className="w-5 h-5 text-accent-primary" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-white/10 rounded-button text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none"
          />
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Expiring Alert */}
        {expiringDocs.length > 0 && (
          <div className="bg-error-bg rounded-card p-4 border border-error/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-error" />
              <h3 className="font-semibold text-error">Expiring Soon</h3>
            </div>
            <p className="text-sm text-text-secondary">
              {expiringDocs.length} document(s) expiring within 60 days
            </p>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent-primary text-bg-primary'
                : 'bg-bg-secondary text-text-secondary'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        <div>
          <h3 className="text-h4 font-semibold text-text-primary mb-4">
            {selectedCategory === 'all'
              ? 'All Documents'
              : categories.find(c => c.id === selectedCategory)?.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredDocs.length === 0 ? (
              <div className="col-span-2 text-center py-8 bg-bg-secondary rounded-card">
                <Folder className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary">No documents found</p>
              </div>
            ) : (
              filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-bg-secondary rounded-card p-4 border border-white/5 group relative"
                >
                  <div className="aspect-square bg-bg-tertiary rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                    <DocumentThumbnail doc={doc} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 bg-accent-primary rounded-full"
                      >
                        <Eye className="w-4 h-4 text-bg-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 bg-error rounded-full"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-medium text-text-primary truncate">{doc.name}</h4>
                  <p className="text-xs text-text-secondary">
                    {categories.find(c => c.id === doc.category)?.label}
                  </p>
                  <p className="text-xs text-text-tertiary">{formatFileSize(doc.fileSize)}</p>
                  {doc.expiryDate && (
                    <p
                      className={`text-xs mt-1 ${
                        new Date(doc.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                          ? 'text-error'
                          : 'text-text-tertiary'
                      }`}
                    >
                      Exp:{' '}
                      {new Date(doc.expiryDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: '2-digit',
                      })}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary rounded-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{viewingDoc.name}</h3>
                <button
                  onClick={handleCloseViewer}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Document Preview */}
              {viewingDocBlob && (
                <div className="mb-4 bg-bg-tertiary rounded-lg overflow-hidden">
                  {viewingDoc.fileType.startsWith('image/') ? (
                    <img src={viewingDocBlob} alt={viewingDoc.name} className="w-full h-auto" />
                  ) : viewingDoc.fileType === 'application/pdf' ? (
                    <iframe src={viewingDocBlob} className="w-full h-96" title={viewingDoc.name} />
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <p className="text-text-secondary">Preview not available</p>
                      <a
                        href={viewingDocBlob}
                        download={viewingDoc.name}
                        className="inline-block mt-4 px-4 py-2 bg-accent-primary text-bg-primary rounded-button"
                      >
                        Download File
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Document Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Category</span>
                  <span className="text-text-primary">
                    {categories.find(c => c.id === viewingDoc.category)?.icon}{' '}
                    {categories.find(c => c.id === viewingDoc.category)?.label}
                  </span>
                </div>
                {viewingDoc.documentNumber && (
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Document Number</span>
                    <span className="text-text-primary">{viewingDoc.documentNumber}</span>
                  </div>
                )}
                {viewingDoc.issueDate && (
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Issue Date</span>
                    <span className="text-text-primary">
                      {new Date(viewingDoc.issueDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                {viewingDoc.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Expiry Date</span>
                    <span className={`${new Date(viewingDoc.expiryDate) < new Date() ? 'text-error' : 'text-text-primary'}`}>
                      {new Date(viewingDoc.expiryDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-tertiary">File Size</span>
                  <span className="text-text-primary">{formatFileSize(viewingDoc.fileSize)}</span>
                </div>
                {viewingDoc.notes && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-text-tertiary block mb-1">Notes</span>
                    <p className="text-text-primary">{viewingDoc.notes}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleCloseViewer}
                className="w-full mt-6 py-3 border border-white/10 text-text-primary rounded-button hover:bg-bg-tertiary transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-secondary rounded-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 font-semibold text-text-primary">Upload Document</h2>
                <button
                  onClick={handleCloseUploadModal}
                  className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-accent-primary bg-accent-alpha'
                      : selectedFile
                        ? 'border-success bg-success-bg'
                        : 'border-white/20 hover:border-accent-primary/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  {selectedFile ? (
                    <div>
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-20 h-20 mx-auto rounded-lg object-cover mb-3" />
                      ) : (
                        <FileText className="w-12 h-12 text-success mx-auto mb-3" />
                      )}
                      <p className="text-sm text-text-primary font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-text-tertiary">{formatFileSize(selectedFile.size)}</p>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setFilePreview(null)
                        }}
                        className="mt-2 text-xs text-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                      <p className="text-sm text-text-primary">
                        Drag & drop or <span className="text-accent-primary">browse</span>
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        Supports images, PDFs, and documents
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Name */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Document Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Passport, Aadhaar Card"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        className={`p-2 text-center rounded-lg border transition-colors ${
                          formData.category === cat.id
                            ? 'border-accent-primary bg-accent-alpha'
                            : 'border-white/10 hover:bg-bg-tertiary'
                        }`}
                        title={cat.label}
                      >
                        <span className="text-lg">{cat.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Number */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Document Number (optional)</label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., A12345678"
                  />
                </div>

                {/* Issue & Expiry Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Issue Date</label>
                    <input
                      type="date"
                      value={formData.issueDate}
                      onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Issuing Authority */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Issuing Authority (optional)</label>
                  <input
                    type="text"
                    value={formData.issuingAuthority}
                    onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., Government of India"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="e.g., important, travel, id"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-text-secondary block mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none resize-none"
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!selectedFile || !formData.name || isUploading}
                  className="w-full py-3 bg-accent-primary text-bg-primary font-semibold rounded-button hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
