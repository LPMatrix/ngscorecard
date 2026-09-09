import express from 'express'
import { createServer as createViteServer } from 'vite'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createApiApp } from './apiApp.js'
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

  // Same API app used by the Vercel serverless entrypoint (api/index.js) —
  // see server/apiApp.js for why this must stay a single shared factory.
  app.use(createApiApp())
  app.use(vite.middlewares)

  // The hand-authored static pages (/guide, /developers, …) are routed by
  // src/routes.js and returned by renderHtml as `staticFile`; served here
  // from public/. No per-page route registration.
  app.use(async (req, res) => {
    const url = req.originalUrl
    try {
      const rawHtml = readFileSync(path.join(root, 'index.html'), 'utf-8')
      const template = await vite.transformIndexHtml(url, rawHtml)
      const { status, redirect, staticFile, html } = await renderHtml(url, template, () => vite.ssrLoadModule('/src/entry-server.js'))
      if (redirect) { res.redirect(status, redirect); return }
      if (staticFile) { res.sendFile(path.join(root, 'public', staticFile)); return }
      res.status(status).set({ 'Content-Type': 'text/html' }).end(html)
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
