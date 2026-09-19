import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '../public/logo-mark.svg'))
const maskable = readFileSync(join(__dirname, '../public/logo-mark-maskable.svg'))
const publicDir = join(__dirname, '../public')

const targets = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'pwa-maskable-512x512.png', size: 512, src: 'maskable' },
]

for (const { file, size, src } of targets) {
  await sharp(src === 'maskable' ? maskable : svg, { density: 384 }).resize(size, size).png().toFile(join(publicDir, file))
  console.log(`✓ ${file} generated (${size}×${size})`)
}
