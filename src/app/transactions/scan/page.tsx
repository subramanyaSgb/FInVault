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
  ScanLine,
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
    <div className="min-h-screen bg-bg-primary relative z-10">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-bg-primary/60 backdrop-blur-xl border-b border-glass-border pt-safe">
        <div className="flex items-center justify-between px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => {
                stopCamera()
                router.back()
              }}
              className="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <p className="text-xs text-accent font-medium tracking-wide uppercase">Scan</p>
              <h1 className="text-lg font-semibold text-text-primary">Receipt</h1>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center"
          >
            <ScanLine className="w-5 h-5 text-accent" />
          </motion.div>
        </div>
      </header>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Capture Step */}
          {step === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Camera View */}
              {isCameraActive ? (
                <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-border-subtle">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Capture overlay */}
                  <div className="absolute inset-0 border-2 border-dashed border-accent/50 m-8 rounded-xl pointer-events-none" />

                  {/* Capture button */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-bg-secondary/80 backdrop-blur-xl rounded-full border border-border-subtle"
                    >
                      <X className="w-6 h-6 text-text-primary" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="p-4 bg-gradient-to-r from-accent to-accent-secondary rounded-full shadow-[0_0_30px_rgba(201,165,92,0.4)]"
                    >
                      <Camera className="w-8 h-8 text-bg-primary" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview or placeholder */}
                  <div className="card-elevated aspect-[3/4] flex items-center justify-center border border-dashed border-border-subtle">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-accent" />
                      </div>
                      <p className="text-text-primary font-semibold mb-2">
                        Take a photo or upload a receipt
                      </p>
                      <p className="text-sm text-text-tertiary">
                        We&apos;ll extract the amount, merchant, and date automatically
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-xl font-semibold shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      Take Photo
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-bg-secondary to-bg-tertiary text-text-primary rounded-xl font-semibold border border-border-subtle hover:border-accent/30 transition-all"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {imageUrl && (
                <div className="aspect-[3/4] bg-bg-secondary rounded-2xl overflow-hidden border border-border-subtle">
                  <img src={imageUrl} alt="Receipt" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="card-elevated p-6 relative overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(201, 165, 92, 0.15) 0%, transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent animate-pulse" />
                    </div>
                    <span className="text-text-primary font-medium">Processing receipt...</span>
                  </div>

                  <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-accent to-accent-secondary shadow-[0_0_10px_rgba(201,165,92,0.5)]"
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">{Math.round(progress)}% complete</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Image preview */}
              {imageUrl && (
                <div className="aspect-video bg-bg-secondary rounded-2xl overflow-hidden border border-border-subtle">
                  <img src={imageUrl} alt="Receipt" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Confidence indicator */}
              {receiptData && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-tertiary">OCR Confidence:</span>
                  <span
                    className={`font-semibold ${
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
              <div className="card-elevated p-5 space-y-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full bg-bg-tertiary border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
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
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                    placeholder="Store name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none transition-all"
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
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary focus:border-accent/50 focus:ring-1 focus:ring-accent/20 focus:outline-none resize-none transition-all"
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-bg-secondary to-bg-tertiary text-text-primary rounded-xl font-semibold border border-border-subtle hover:border-accent/30 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.amount}
                  className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-xl font-semibold shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="card-elevated p-6 text-center relative overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-error/20 border border-error/30 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-error" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Processing Failed</h3>
                  <p className="text-text-secondary">{error}</p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-accent to-accent-secondary text-bg-primary rounded-xl font-semibold shadow-[0_0_20px_rgba(201,165,92,0.3)] hover:shadow-[0_0_30px_rgba(201,165,92,0.4)] transition-all"
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
