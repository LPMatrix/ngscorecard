import express from 'express'
import { createServer as createViteServer } from 'vite'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createApiRouter } from './api.js'
import { createPublicApiRouter } from './publicApi.js'
import { createAdminRouter } from './adminRoutes.js'
import { renderHtml } from './render.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function argPort() {
  const i = process.argv.indexOf('--port')
  return i !== -1 ? Number(process.argv[i + 1]) : (process.env.PORT || 5174)
}

async function createDevServer() {
  const app = express()

  const vite = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  })

  // /api/v1 must be mounted before the more general /api — see the comment
  // in server/index.js for why.
  app.use('/api/v1', createPublicApiRouter())
  app.use('/api/admin', createAdminRouter())
  app.use('/api', createApiRouter())
  app.get('/developers', (_req, res) => {
    res.sendFile(path.join(root, 'public/developers.html'))
  })
  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(root, 'public/admin.html'))
  })
  app.use(vite.middlewares)

  app.use(async (req, res) => {
    const url = req.originalUrl
    try {
      const rawHtml = readFileSync(path.join(root, 'index.html'), 'utf-8')
      const template = await vite.transformIndexHtml(url, rawHtml)
      const html = await renderHtml(url, template, () => vite.ssrLoadModule('/src/entry-server.js'))
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      console.error(e)
      res.status(500).end(e.stack)
    }
  })

  const PORT = argPort()
  app.listen(PORT, () => console.log(`NGScorecard (dev SSR) running on http://localhost:${PORT}`))
}

createDevServer()
