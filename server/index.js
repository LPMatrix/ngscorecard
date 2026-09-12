import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync } from 'fs'
import { createApiApp } from './apiApp.js'
import { renderHtml } from './render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const CLIENT_DIR = path.join(__dirname, '../dist/client')
// The build moves index.html out of the static dir (dist/ssr-template.html)
// so "/" is served by SSR, not as a raw shell; fall back to dist/client for a
// plain `vite build` that didn't run that step.
const template = [
  path.join(__dirname, '../dist/ssr-template.html'),
  path.join(CLIENT_DIR, 'index.html'),
].map((p) => { try { return readFileSync(p, 'utf-8') } catch { return null } }).find(Boolean)
const loadEntryServer = () => import('../dist/server/entry-server.js')

// Same API app used by the Vercel serverless entrypoint (api/index.js) — see
// server/apiApp.js for why this must stay a single shared factory.
app.use(createApiApp())
app.use(express.static(CLIENT_DIR, { index: false }))

// The one remaining static page (/admin) comes back from renderHtml as
// `staticFile` — served here from dist/client. Everything else — including
// /guide, /press, /developers — is a real SSR route (see src/routes.js).
app.use(async (req, res) => {
  try {
    const { status, redirect, staticFile, html } = await renderHtml(req.originalUrl, template, loadEntryServer)
    if (redirect) { res.redirect(status, redirect); return }
    if (staticFile) { res.sendFile(path.join(CLIENT_DIR, staticFile)); return }
    res.status(status).set('Content-Type', 'text/html').end(html)
  } catch (e) {
    console.error(e)
    res.status(500).end('Internal Server Error')
  }
})

app.listen(PORT, () => console.log(`NGScorecard running on http://localhost:${PORT}`))
