'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Search,
  Folder,
  AlertCircle,
  Upload,
  X,
  Trash2,
  Eye,
  Shield,
  Clock,
  FolderOpen,
} from 'lucide-react'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
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
  const {
    documents,
    loadDocuments,
    searchDocuments,
    addDocument,
    deleteDocument,
    viewDocument,
    getExpiringDocuments,
  } = useDocumentStore()
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
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map(t => t.trim())
              .filter(Boolean)
          : [],
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
    <div className="min-h-screen bg-bg-primary pb-20 relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Vault</p>
              <h1 className="text-xl font-semibold text-text-primary mt-0.5">Documents</h1>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Plus className="w-5 h-5 text-accent" />
            </motion.button>
          </div>

          {/* Premium Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
            />
          </motion.div>
        </div>
      </header>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-6"
      >
        {/* Expiring Alert */}
        {expiringDocs.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-error/20 via-error/10 to-transparent border border-error/30 p-4"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-error/20 rounded-full blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/20 border border-error/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-error mb-1">Expiring Soon</h3>
                <p className="text-sm text-text-secondary">
                  {expiringDocs.length} document(s) expiring within 60 days
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Summary Card */}
        <motion.div variants={itemVariants} className="card-elevated p-5 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
                Total Documents
              </p>
              <h2 className="text-3xl font-display font-bold text-gradient-gold">
                {documents.length}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-accent" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-3">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-info/10 rounded-full blur-xl" />
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center mb-2">
                <Folder className="w-4 h-4 text-info" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Categories</p>
              <p className="text-sm font-semibold text-text-primary">
                {new Set(documents.map(d => d.category)).size}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle p-3">
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-warning/10 rounded-full blur-xl" />
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Expiring</p>
              <p className="text-sm font-semibold text-text-primary">{expiringDocs.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Premium Category Filter */}
        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(201,165,92,0.15)]'
                : 'bg-bg-secondary text-text-secondary border border-border-subtle hover:border-accent/20'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 shadow-[0_0_15px_rgba(201,165,92,0.15)]'
                  : 'bg-bg-secondary text-text-secondary border border-border-subtle hover:border-accent/20'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Documents Grid */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-accent" />
            {selectedCategory === 'all'
              ? 'All Documents'
              : categories.find(c => c.id === selectedCategory)?.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {filteredDocs.length === 0 ? (
              <div className="col-span-2 card-elevated p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No documents found</h3>
                <p className="text-text-secondary text-sm mb-6">
                  Upload your important documents securely
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border-subtle hover:border-accent/30 hover:shadow-[0_0_15px_rgba(201,165,92,0.08)] transition-all duration-300"
                >
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-accent/0 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />

                  {/* Thumbnail */}
                  <div className="aspect-square bg-bg-tertiary flex items-center justify-center overflow-hidden relative">
                    <DocumentThumbnail doc={doc} />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Eye className="w-4 h-4 text-accent" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-error/20 to-error/10 border border-error/30 flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h4 className="font-medium text-text-primary truncate text-sm">{doc.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {categories.find(c => c.id === doc.category)?.icon}{' '}
                      {categories.find(c => c.id === doc.category)?.label}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[10px] text-text-tertiary">{formatFileSize(doc.fileSize)}</p>
                      {doc.expiryDate && (
                        <p
                          className={`text-[10px] ${
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
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.main>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="card-elevated p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">{viewingDoc.name}</h3>
                  <button
                    onClick={handleCloseViewer}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Document Preview */}
                {viewingDocBlob && (
                  <div className="mb-4 bg-bg-tertiary rounded-xl overflow-hidden border border-border-subtle">
                    {viewingDoc.fileType.startsWith('image/') ? (
                      <img src={viewingDocBlob} alt={viewingDoc.name} className="w-full h-auto" />
                    ) : viewingDoc.fileType === 'application/pdf' ? (
                      <iframe src={viewingDocBlob} className="w-full h-96" title={viewingDoc.name} />
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-text-secondary mb-4">Preview not available</p>
                        <a
                          href={viewingDocBlob}
                          download={viewingDoc.name}
                          className="inline-block px-4 py-2 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-xl font-medium"
                        >
                          Download File
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                    <span className="text-text-tertiary">Category</span>
                    <span className="text-text-primary">
                      {categories.find(c => c.id === viewingDoc.category)?.icon}{' '}
                      {categories.find(c => c.id === viewingDoc.category)?.label}
                    </span>
                  </div>
                  {viewingDoc.documentNumber && (
                    <div className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                      <span className="text-text-tertiary">Document Number</span>
                      <span className="text-text-primary">{viewingDoc.documentNumber}</span>
                    </div>
                  )}
                  {viewingDoc.issueDate && (
                    <div className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                      <span className="text-text-tertiary">Issue Date</span>
                      <span className="text-text-primary">
                        {new Date(viewingDoc.issueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                  {viewingDoc.expiryDate && (
                    <div className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                      <span className="text-text-tertiary">Expiry Date</span>
                      <span
                        className={`${new Date(viewingDoc.expiryDate) < new Date() ? 'text-error' : 'text-text-primary'}`}
                      >
                        {new Date(viewingDoc.expiryDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                    <span className="text-text-tertiary">File Size</span>
                    <span className="text-text-primary">{formatFileSize(viewingDoc.fileSize)}</span>
                  </div>
                  {viewingDoc.notes && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-bg-secondary to-bg-tertiary border border-border-subtle">
                      <span className="text-text-tertiary block mb-2">Notes</span>
                      <p className="text-text-primary">{viewingDoc.notes}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCloseViewer}
                  className="w-full mt-6 py-3 border border-border-subtle text-text-primary rounded-xl hover:bg-bg-tertiary transition-all"
                >
                  Close
                </button>
              </div>
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
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="card-elevated p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative"
            >
              {/* Glow decoration */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(201, 165, 92, 0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">Upload Document</h2>
                  <button
                    onClick={handleCloseUploadModal}
                    className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
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
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      isDragOver
                        ? 'border-accent bg-accent/10'
                        : selectedFile
                          ? 'border-success/50 bg-success/10'
                          : 'border-border-subtle hover:border-accent/50 bg-bg-tertiary'
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
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-20 h-20 mx-auto rounded-xl object-cover mb-3 border border-border-subtle"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-success/20 border border-success/30 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-8 h-8 text-success" />
                          </div>
                        )}
                        <p className="text-sm text-text-primary font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {formatFileSize(selectedFile.size)}
                        </p>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            setSelectedFile(null)
                            setFilePreview(null)
                          }}
                          className="mt-3 text-xs text-error hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-accent" />
                        </div>
                        <p className="text-sm text-text-primary">
                          Drag & drop or <span className="text-accent font-medium">browse</span>
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
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
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
                          className={`p-2 text-center rounded-xl border transition-all duration-300 ${
                            formData.category === cat.id
                              ? 'border-accent/50 bg-accent/10 shadow-[0_0_10px_rgba(201,165,92,0.1)]'
                              : 'border-border-subtle bg-bg-tertiary hover:border-accent/30'
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
                    <label className="text-sm text-text-secondary block mb-2">
                      Document Number (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="e.g., A12345678"
                    />
                  </div>

                  {/* Issue & Expiry Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Issue Date</label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary block mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Issuing Authority */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Issuing Authority (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.issuingAuthority}
                      onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="e.g., Government of India"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={e => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                      placeholder="e.g., important, travel, id"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm text-text-secondary block mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none resize-none transition-all"
                      placeholder="Any additional notes..."
                      rows={2}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!selectedFile || !formData.name || isUploading}
                    className="w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary font-semibold rounded-xl shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
