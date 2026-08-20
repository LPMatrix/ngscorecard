import { Router } from 'express'
import { registerDataRoutes } from './dataRoutes.js'

// Internal, unauthenticated, unlimited — this is what the frontend itself
// calls for SSR/CSR. Not the public API; see publicApi.js for that.
export function createApiRouter() {
  const router = Router()

  // Patch res.json for environments (e.g. Vite's connect server) that
  // don't wrap the native ServerResponse in an Express Response.
  router.use((_req, res, next) => {
    if (!res.json) {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      }
    }
    next()
  })

  registerDataRoutes(router)

  return router
}
