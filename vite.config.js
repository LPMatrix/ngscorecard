import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    vue(),
    // Only the client build produces an installable app shell — the SSR
    // build (src/entry-server.js) never touches index.html or a browser.
    !isSsrBuild && VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // We keep our own hand-authored public/site.webmanifest (already
      // linked in index.html) instead of having the plugin generate one.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
  },
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
