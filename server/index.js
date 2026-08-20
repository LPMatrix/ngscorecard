import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync } from 'fs'
import { createApiRouter } from './api.js'
import { createPublicApiRouter } from './publicApi.js'
import { renderHtml } from './render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

const template = readFileSync(path.join(__dirname, '../dist/client/index.html'), 'utf-8')
const loadEntryServer = () => import('../dist/server/entry-server.js')

// /api/v1 must be mounted before the more general /api: Express checks
// mounts in registration order, and /api's internal routes (:admin/category)
// would otherwise swallow /api/v1/xxx requests whenever "xxx" happens to
// match one of its own category names (e.g. /api/v1/governors getting
// misread as :admin="v1", category="governors").
app.use('/api/v1', createPublicApiRouter())
app.use('/api', createApiRouter())
app.get('/developers', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/developers.html'))
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
