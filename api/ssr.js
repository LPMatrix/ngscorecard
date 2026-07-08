import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync } from 'fs'
import { renderHtml } from '../server/render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const template = readFileSync(path.join(__dirname, '../dist/client/index.html'), 'utf-8')
const loadEntryServer = () => import('../dist/server/entry-server.js')

const app = express()

app.use(async (req, res) => {
  try {
    const html = await renderHtml(req.originalUrl, template, loadEntryServer)
    res.status(200).set('Content-Type', 'text/html').send(html)
  } catch (e) {
    console.error(e)
    res.status(500).send('Internal Server Error')
  }
})

export default app
