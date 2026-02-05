import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdir } from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="108" fill="#0A0A0A"/>
  <circle cx="256" cy="256" r="144" stroke="#C9A55C" stroke-width="12" fill="none"/>
  <circle cx="256" cy="256" r="80" stroke="#C9A55C" stroke-width="8" fill="none" opacity="0.5"/>
  <circle cx="256" cy="256" r="24" fill="#C9A55C"/>
  <path d="M256 48v64M256 400v64M48 256h64M400 256h64" stroke="#C9A55C" stroke-width="12" stroke-linecap="round"/>
</svg>`

async function generateIcons() {
  const outputDir = join(__dirname, '..', 'public', 'icons')

  try {
    await mkdir(outputDir, { recursive: true })
  } catch (e) {
    // Directory exists
  }

  const svgBuffer = Buffer.from(svgContent)

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}.png`)

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath)

    console.log(`Generated: icon-${size}.png`)
  }

  console.log('All icons generated successfully!')
}

generateIcons().catch(console.error)
