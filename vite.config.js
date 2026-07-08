import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [vue()],
  build: {
    // Overridden to dist/server for the SSR build (see package.json's
    // build:server script). /api is served by server/dev.js in dev and
    // by api/index.js + api/ssr.js on Vercel, not by Vite's dev middleware.
    outDir: 'dist/client',
    // The SSR bundle runs in Node (which supports top-level await, used by
    // server/db.js) — only the client bundle needs the browser-safe default.
    target: isSsrBuild ? 'node18' : undefined,
  },
}))
