'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Upload,
  X,
  Check,
  RefreshCw,
  ArrowLeft,
  Zap,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { scanReceipt, fileToDataURL, compressImage, enhanceImage, ReceiptData } from '@/lib/ocr'
import { useTransactionStore } from '@/stores/transactionStore'
import { useAuthStore } from '@/stores/authStore'

type ScanStep = 'capture' | 'processing' | 'review' | 'error'

export default function ScanReceiptPage() {
  const router = useRouter()
  const { currentProfile } = useAuthStore()
  const { addTransaction } = useTransactionStore()

  const [step, setStep] = useState<ScanStep>('capture')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0] ?? '',
    category: 'other',
    notes: '',
  })

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch {
      setError('Could not access camera. Please allow camera permissions or upload an image.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setImageUrl(dataUrl)
    stopCamera()
    processImage(dataUrl)
  }, [stopCamera])

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const dataUrl = await fileToDataURL(file)
      setImageUrl(dataUrl)
      processImage(dataUrl)
    } catch {
      setError('Could not read the image file.')
    }
  }, [])

  // Process image with OCR
  const processImage = async (dataUrl: string) => {
    setStep('processing')
    setProgress(0)
    setError(null)

    try {
      // Compress and enhance the image
      const compressed = await compressImage(dataUrl)
      const enhanced = await enhanceImage(compressed)

      // Run OCR
      const result = await scanReceipt(enhanced, p => setProgress(p))
      setReceiptData(result)

      // Pre-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        amount: result.amount?.toString() ?? '',
        merchant: result.merchant ?? '',
        date: result.date ?? prev.date,
      }))

      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the receipt.')
      setStep('error')
    }
  }

  // Save transaction
  const handleSave = async () => {
    if (!currentProfile || !formData.amount) return

    try {
      const transactionData: Parameters<typeof addTransaction>[0] = {
        profileId: currentProfile.id,
        type: 'expense',
        amount: parseFloat(formData.amount),
        currency: 'INR',
        category: formData.category,
        description: formData.merchant || 'Receipt scan',
        date: new Date(formData.date),
        paymentMethod: 'cash',
        accountId: 'default',
        tags: ['receipt-scan'],
        attachments: [],
        isRecurring: false,
        aiCategorized: false,
        isSplit: false,
        isTemplate: false,
        isDuplicate: false,
      }

      // Only add optional properties if they have values
      if (formData.notes) {
        transactionData.notes = formData.notes
      } else if (receiptData?.rawText) {
        transactionData.notes = `OCR Text:\n${receiptData.rawText}`
      }

      if (formData.merchant) {
        transactionData.merchant = formData.merchant
      }

      await addTransaction(transactionData)

      router.push('/transactions')
    } catch {
      setError('Failed to save transaction.')
    }
  }

  // Reset and try again
  const handleReset = () => {
    setStep('capture')
    setImageUrl(null)
    setReceiptData(null)
    setError(null)
    setProgress(0)
    setFormData({
      amount: '',
      merchant: '',
      date: new Date().toISOString().split('T')[0] ?? '',
      category: 'other',
      notes: '',
    })
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopCamera()
                router.back()
              }}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-primary" />
            </button>
            <h1 className="text-xl font-bold text-text-primary">Scan Receipt</h1>
          </div>
        </div>
      </header>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Capture Step */}
          {step === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Camera View */}
              {isCameraActive ? (
                <div className="relative aspect-[3/4] bg-black rounded-card overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Capture overlay */}
                  <div className="absolute inset-0 border-2 border-dashed border-accent-primary/50 m-8 rounded-lg pointer-events-none" />

                  {/* Capture button */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-bg-secondary/80 rounded-full"
                    >
                      <X className="w-6 h-6 text-text-primary" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="p-4 bg-accent-primary rounded-full"
                    >
                      <Camera className="w-8 h-8 text-bg-primary" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview or placeholder */}
                  <div className="aspect-[3/4] bg-bg-secondary rounded-card flex items-center justify-center border border-dashed border-white/10">
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                      <p className="text-text-secondary mb-2">Take a photo or upload a receipt</p>
                      <p className="text-xs text-text-tertiary">
                        We&apos;ll extract the amount, merchant, and date automatically
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 p-4 bg-accent-primary text-bg-primary rounded-button font-medium"
                    >
                      <Camera className="w-5 h-5" />
                      Take Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 p-4 bg-bg-secondary text-text-primary rounded-button font-medium border border-white/10"
                    >
                      <Upload className="w-5 h-5" />
                      Upload
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {imageUrl && (
                <div className="aspect-[3/4] bg-bg-secondary rounded-card overflow-hidden">
                  <img src={imageUrl} alt="Receipt" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="bg-bg-secondary rounded-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-accent-primary animate-pulse" />
                  <span className="text-text-primary font-medium">Processing receipt...</span>
                </div>

                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-accent-primary"
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2">{Math.round(progress)}% complete</p>
              </div>
            </motion.div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Image preview */}
              {imageUrl && (
                <div className="aspect-video bg-bg-secondary rounded-card overflow-hidden">
                  <img src={imageUrl} alt="Receipt" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Confidence indicator */}
              {receiptData && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-tertiary">OCR Confidence:</span>
                  <span
                    className={`font-medium ${
                      receiptData.confidence >= 80
                        ? 'text-success'
                        : receiptData.confidence >= 50
                          ? 'text-warning'
                          : 'text-error'
                    }`}
                  >
                    {Math.round(receiptData.confidence)}%
                  </span>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4 bg-bg-secondary rounded-card p-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-white/10 rounded-input pl-8 pr-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Merchant</label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={e => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                    placeholder="Store name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none"
                  >
                    <option value="food">Food & Dining</option>
                    <option value="shopping">Shopping</option>
                    <option value="transport">Transport</option>
                    <option value="utilities">Utilities</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="health">Health</option>
                    <option value="groceries">Groceries</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-input px-4 py-3 text-text-primary focus:border-accent-primary focus:outline-none resize-none"
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 p-4 bg-bg-secondary text-text-primary rounded-button font-medium border border-white/10"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.amount}
                  className="flex items-center justify-center gap-2 p-4 bg-accent-primary text-bg-primary rounded-button font-medium disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  Save
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-error/10 border border-error/30 rounded-card p-6 text-center">
                <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Processing Failed</h3>
                <p className="text-text-secondary">{error}</p>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 p-4 bg-accent-primary text-bg-primary rounded-button font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
