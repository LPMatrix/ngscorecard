import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync, existsSync } from 'fs'
import { renderHtml } from '../server/render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The client build's index.html is the SSR template. On Vercel this file
// lives in the build output (dist/), which is bundled into this function via
// `functions["api/ssr.js"].includeFiles = "dist/**"` in vercel.json, plus a
// copy at dist/ssr-template.html made by the build command as a fallback.
// Read it lazily and try several locations so a path mismatch can't take the
// whole function down at cold start (which would make every route 404).
const TEMPLATE_PATHS = [
  path.join(__dirname, '../dist/ssr-template.html'),
  path.join(__dirname, '../dist/client/index.html'),
  path.join(process.cwd(), 'dist/ssr-template.html'),
  path.join(process.cwd(), 'dist/client/index.html'),
]

let cachedTemplate = null
function getTemplate() {
  if (cachedTemplate != null) return cachedTemplate
  for (const p of TEMPLATE_PATHS) {
    try {
      if (existsSync(p)) {
        cachedTemplate = readFileSync(p, 'utf-8')
        return cachedTemplate
      }
    } catch { /* try next */ }
  }
  throw new Error(`SSR template not found. Tried:\n  ${TEMPLATE_PATHS.join('\n  ')}`)
}

// Static string so @vercel/nft traces and bundles dist/server/entry-server.js
// (+ its dependency tree) into the function. Loaded once, on first request.
let cachedEntry = null
async function loadEntryServer() {
  if (cachedEntry) return cachedEntry
  cachedEntry = await import('../dist/server/entry-server.js')
  return cachedEntry
}

const CLIENT_DIR = path.join(__dirname, '../dist/client')

const app = express()

app.use(async (req, res) => {
  try {
    const { status, redirect, staticFile, html } = await renderHtml(req.originalUrl, getTemplate(), loadEntryServer)
    if (redirect) {
      res.redirect(status, redirect)
      return
    }
    // Only /admin is left as a raw static file (see src/routes.js
    // STATIC_PAGES) — Vercel's static handler normally serves it (cleanUrls);
    // this is the fallback if the request reaches the function instead.
    if (staticFile) {
      res.sendFile(path.join(CLIENT_DIR, staticFile))
      return
    }
    res.status(status).set('Content-Type', 'text/html; charset=utf-8').send(html)
  } catch (e) {
    console.error('[ssr]', e)
    res.status(500).set('Content-Type', 'text/plain; charset=utf-8')
      .send(`SSR error: ${(e && e.message) || 'unknown'}`)
  }
})

export default app
