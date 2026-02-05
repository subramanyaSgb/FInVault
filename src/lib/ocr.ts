import Tesseract from 'tesseract.js'

export interface ReceiptData {
  amount: number | null
  merchant: string | null
  date: string | null
  rawText: string
  confidence: number
}

// Common receipt patterns
const AMOUNT_PATTERNS = [
  /(?:total|amount|grand total|net total|subtotal)[:\s]*[₹$€£]?\s*([\d,]+\.?\d*)/gi,
  /[₹$€£]\s*([\d,]+\.?\d*)/g,
  /(?:rs\.?|inr)\s*([\d,]+\.?\d*)/gi,
  /([\d,]+\.?\d{2})\s*(?:total|paid|due)/gi,
]

const DATE_PATTERNS = [
  /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g, // DD-MM-YYYY or MM-DD-YYYY
  /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*,?\s*\d{2,4})/gi,
  /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g, // YYYY-MM-DD
]

const MERCHANT_PATTERNS = [
  /^([A-Z][A-Za-z\s&'.,-]+)$/m, // First capitalized line
  /(?:store|shop|restaurant|hotel|cafe|pvt|ltd|inc|llc)[:\s]*([A-Za-z\s&'.,-]+)/gi,
]

/**
 * Extract amount from OCR text
 */
function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const matches = [...text.matchAll(pattern)]
    if (matches.length > 0) {
      // Get the last match (usually the total)
      const lastMatch = matches[matches.length - 1]
      const amountStr = lastMatch?.[1]?.replace(/,/g, '')
      if (amountStr) {
        const amount = parseFloat(amountStr)
        if (!isNaN(amount) && amount > 0 && amount < 10000000) {
          return amount
        }
      }
    }
  }
  return null
}

/**
 * Extract date from OCR text
 */
function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[0]) {
      try {
        const dateStr = match[0]
        // Try to parse and validate the date
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0] ?? null
        }
        // Manual parsing for DD-MM-YYYY format
        const parts = dateStr.split(/[-/]/)
        if (parts.length === 3) {
          const [p0, p1, p2] = parts
          if (p0 && p1 && p2) {
            const day = parseInt(p0)
            const month = parseInt(p1) - 1
            const year = parseInt(p2.length === 2 ? '20' + p2 : p2)
            const parsedDate = new Date(year, month, day)
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().split('T')[0] ?? null
            }
          }
        }
      } catch {
        continue
      }
    }
  }
  return null
}

/**
 * Extract merchant name from OCR text
 */
function extractMerchant(text: string): string | null {
  const lines = text.split('\n').filter(l => l.trim().length > 2)

  // Try the first few lines as they often contain the merchant name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]?.trim()
    if (line && line.length > 3 && line.length < 50) {
      // Skip lines that look like dates, amounts, or addresses
      if (!/^\d/.test(line) && !/total|amount|date|time|receipt|tax|gst/i.test(line)) {
        return line.replace(/[^\w\s&'.,-]/g, '').trim()
      }
    }
  }

  // Try patterns
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Process image and extract receipt data using Tesseract.js
 */
export async function scanReceipt(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<ReceiptData> {
  const result = await Tesseract.recognize(imageSource, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress * 100)
      }
    },
  })

  const text = result.data.text
  const confidence = result.data.confidence

  return {
    amount: extractAmount(text),
    merchant: extractMerchant(text),
    date: extractDate(text),
    rawText: text,
    confidence,
  }
}

/**
 * Convert image file to data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Compress image for faster processing
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Enhance image for better OCR results
 */
export function enhanceImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] ?? 0
        const g = data[i + 1] ?? 0
        const b = data[i + 2] ?? 0

        // Grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b

        // Increase contrast
        const contrast = 1.5
        const adjusted = ((gray / 255 - 0.5) * contrast + 0.5) * 255

        // Threshold for sharper text
        const final = adjusted > 128 ? 255 : adjusted < 64 ? 0 : adjusted

        data[i] = final
        data[i + 1] = final
        data[i + 2] = final
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
