import express from 'express'
import { createApiRouter } from './api.js'
import { createPublicApiRouter } from './publicApi.js'
import { createAdminRouter } from './adminRoutes.js'
import { createCorrectionsRouter } from './correctionsRoutes.js'

// Single source of truth for how the API routers are mounted, used by both
// the Vercel serverless entrypoint (api/index.js) and the standalone Express
// server (server/index.js, server/dev.js). Before this, each entrypoint
// mounted its own copy and drifted apart — api/index.js never got the
// /api/v1 or /api/admin routers added, so the public API, widget endpoint,
// and admin dashboard all silently 404'd in production despite working
// locally. Don't duplicate this mounting logic again.
export function createApiApp() {
  const app = express()

  // /api/v1 and /api/admin must be mounted before the more general /api:
  // Express checks mounts in registration order, and /api's internal routes
  // (:admin/category) would otherwise swallow a more specific request
  // whenever the next path segment happens to match one of its own category
  // names (e.g. /api/v1/governors misread as :admin="v1", category="governors").
  app.use('/api/v1', createPublicApiRouter())
  app.use('/api/admin', createAdminRouter())
  app.use('/api/corrections', createCorrectionsRouter())
  app.use('/api', createApiRouter())

  return app
}
