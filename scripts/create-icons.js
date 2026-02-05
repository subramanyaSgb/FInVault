const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Colors
const DARK_BG = { r: 10, g: 10, b: 10 }       // #0a0a0a
const GOLD = { r: 212, g: 175, b: 55 }         // #D4AF37
const GOLD_LIGHT = { r: 230, g: 200, b: 100 }  // lighter gold for highlights

function createIconPNG(size) {
  const width = size
  const height = size

  // Create pixel data
  const rawData = []
  const centerX = width / 2
  const centerY = height / 2
  const padding = size * 0.1 // 10% padding for maskable safe zone

  for (let y = 0; y < height; y++) {
    rawData.push(0) // filter byte
    for (let x = 0; x < width; x++) {
      const pixel = getPixelColor(x, y, width, height, centerX, centerY, padding)
      rawData.push(pixel.r, pixel.g, pixel.b)
    }
  }

  return createPNG(width, height, rawData)
}

function getPixelColor(x, y, width, height, centerX, centerY, padding) {
  // Create a stylized "F" with vault-like design
  const scale = width / 512 // Scale based on 512 base size

  // Background - dark with subtle gradient
  const bgGradient = Math.floor((y / height) * 15)
  const bg = { r: DARK_BG.r + bgGradient, g: DARK_BG.g + bgGradient, b: DARK_BG.b + bgGradient }

  // Safe zone for maskable icons (inner area)
  const safeZone = width * 0.15
  const innerLeft = safeZone
  const innerRight = width - safeZone
  const innerTop = safeZone
  const innerBottom = height - safeZone

  // "F" letter dimensions within safe zone
  const letterLeft = innerLeft + (innerRight - innerLeft) * 0.25
  const letterRight = innerLeft + (innerRight - innerLeft) * 0.75
  const letterTop = innerTop + (innerBottom - innerTop) * 0.15
  const letterBottom = innerTop + (innerBottom - innerTop) * 0.85

  const strokeWidth = Math.max(2, Math.floor(width * 0.08))
  const crossbarY = letterTop + (letterBottom - letterTop) * 0.45

  // Draw the "F" shape
  // Vertical stem
  if (x >= letterLeft && x <= letterLeft + strokeWidth &&
      y >= letterTop && y <= letterBottom) {
    return getGoldWithShading(x, y, letterLeft, letterTop, strokeWidth, letterBottom - letterTop)
  }

  // Top horizontal bar
  if (x >= letterLeft && x <= letterRight &&
      y >= letterTop && y <= letterTop + strokeWidth) {
    return getGoldWithShading(x, y, letterLeft, letterTop, letterRight - letterLeft, strokeWidth)
  }

  // Middle horizontal bar (shorter)
  const middleBarRight = letterLeft + (letterRight - letterLeft) * 0.7
  if (x >= letterLeft && x <= middleBarRight &&
      y >= crossbarY && y <= crossbarY + strokeWidth) {
    return getGoldWithShading(x, y, letterLeft, crossbarY, middleBarRight - letterLeft, strokeWidth)
  }

  // Decorative vault circle behind the F
  const circleRadius = (innerRight - innerLeft) * 0.45
  const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
  const ringWidth = Math.max(2, width * 0.02)

  // Outer ring
  if (dist >= circleRadius - ringWidth && dist <= circleRadius) {
    const alpha = 0.3
    return blendColors(bg, GOLD, alpha)
  }

  // Inner decorative ring
  const innerRingRadius = circleRadius * 0.85
  if (dist >= innerRingRadius - ringWidth / 2 && dist <= innerRingRadius + ringWidth / 2) {
    const alpha = 0.15
    return blendColors(bg, GOLD, alpha)
  }

  return bg
}

function getGoldWithShading(x, y, startX, startY, width, height) {
  // Add subtle 3D effect
  const relX = (x - startX) / width
  const relY = (y - startY) / height

  // Top-left lighter, bottom-right darker
  const lightFactor = (1 - relX * 0.3) * (1 - relY * 0.3)

  return {
    r: Math.min(255, Math.floor(GOLD.r * (0.8 + lightFactor * 0.4))),
    g: Math.min(255, Math.floor(GOLD.g * (0.8 + lightFactor * 0.4))),
    b: Math.min(255, Math.floor(GOLD.b * (0.8 + lightFactor * 0.4)))
  }
}

function blendColors(bg, fg, alpha) {
  return {
    r: Math.floor(bg.r * (1 - alpha) + fg.r * alpha),
    g: Math.floor(bg.g * (1 - alpha) + fg.g * alpha),
    b: Math.floor(bg.b * (1 - alpha) + fg.b * alpha)
  }
}

function createPNG(width, height, rawData) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData.writeUInt8(8, 8)   // bit depth
  ihdrData.writeUInt8(2, 9)   // color type (RGB)
  ihdrData.writeUInt8(0, 10)  // compression
  ihdrData.writeUInt8(0, 11)  // filter
  ihdrData.writeUInt8(0, 12)  // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData)

  // IDAT chunk
  const compressed = zlib.deflateSync(Buffer.from(rawData), { level: 9 })
  const idatChunk = createChunk('IDAT', compressed)

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)

  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

function crc32(data) {
  let crc = 0xffffffff
  const table = makeCRCTable()

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff]
  }

  return (crc ^ 0xffffffff) >>> 0
}

function makeCRCTable() {
  const table = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Generate icons
sizes.forEach(size => {
  const pngData = createIconPNG(size)
  const filePath = path.join(iconsDir, `icon-${size}.png`)
  fs.writeFileSync(filePath, pngData)
  console.log(`Created: icon-${size}.png (${size}x${size})`)
})

console.log('\nAll FinVault icons created successfully!')
console.log('Icons feature: Gold "F" logo on dark background with vault ring design')
