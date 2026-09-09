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
const template = readFileSync(path.join(CLIENT_DIR, 'index.html'), 'utf-8')
const loadEntryServer = () => import('../dist/server/entry-server.js')

// Same API app used by the Vercel serverless entrypoint (api/index.js) — see
// server/apiApp.js for why this must stay a single shared factory.
app.use(createApiApp())
app.use(express.static(CLIENT_DIR, { index: false }))

// Static pages (/guide, /developers, …) come back from renderHtml as
// `staticFile` — served here from dist/client. No per-page route registration.
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
