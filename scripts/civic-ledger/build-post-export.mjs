#!/usr/bin/env node
// Civic Ledger: pull one post's card out of the gallery HTML into a fixed-size
// standalone page, so it can be screenshotted at 1080x1080 without gallery chrome.
//
//   node scripts/civic-ledger/build-post-export.mjs <gallery.html> <postNumber> [outDir]
//
// <gallery.html> is the gallery artifact's page file (read it with the Artifact
// tool's `path: "index.html"`). Writes <outDir>/post-NN-export.html (default ./civic-ledger-export).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const [galleryPath, postArg, outDirArg] = process.argv.slice(2)
if (!galleryPath || !postArg) {
  console.error('usage: build-post-export.mjs <gallery.html> <postNumber> [outDir]')
  process.exit(1)
}

const nn = String(postArg).padStart(2, '0')
const html = readFileSync(galleryPath, 'utf8')

const style = /<style>([\s\S]*?)<\/style>/.exec(html.slice(html.indexOf('<title>')))?.[1]
const fonts = /<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/.exec(html)?.[1]
if (!style || !fonts) throw new Error('could not find the gallery style block or font link')

const numAt = html.indexOf(`<span class="num">POST ${nn}</span>`)
if (numAt === -1) throw new Error(`Post ${nn} not found in ${galleryPath}`)
const wrapAt = html.indexOf('<div class="post-canvas-wrap">', numAt)
const captionAt = html.indexOf('<p class="post-caption">', wrapAt)
const card = html.slice(wrapAt, captionAt).trim()

const out = `<!doctype html><html><head><meta charset="utf-8"><title>Post ${nn} export</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<style>${style}
/* export overrides: the card is exactly 1080px wide, no gallery chrome around it */
html, body { margin: 0; padding: 0; background: #fff; }
.post-canvas-wrap { padding: 0 !important; width: 1080px; }
.card, .m-card { width: 1080px !important; border-radius: 0 !important; }
</style></head><body>${card}</body></html>`

const outDir = path.resolve(outDirArg ?? 'civic-ledger-export')
mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, `post-${nn}-export.html`)
writeFileSync(outFile, out)
console.log(outFile)
