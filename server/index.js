import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync } from 'fs'
import { createApiApp } from './apiApp.js'
import { renderHtml } from './render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const template = readFileSync(path.join(__dirname, '../dist/client/index.html'), 'utf-8')
const loadEntryServer = () => import('../dist/server/entry-server.js')

// Same API app used by the Vercel serverless entrypoint (api/index.js) — see
// server/apiApp.js for why this must stay a single shared factory.
app.use(createApiApp())
app.get('/developers', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/developers.html'))
})
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/admin.html'))
})
app.use(express.static(path.join(__dirname, '../dist/client'), { index: false }))

app.use(async (req, res) => {
  try {
    const html = await renderHtml(req.originalUrl, template, loadEntryServer)
    res.status(200).set('Content-Type', 'text/html').end(html)
  } catch (e) {
    console.error(e)
    res.status(500).end('Internal Server Error')
  }
})

app.listen(PORT, () => console.log(`NGScorecard running on http://localhost:${PORT}`))
