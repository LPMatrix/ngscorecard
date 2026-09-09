// Single source of truth for routing — used by the server (server/render.js,
// src/entry-server.js) and the client (src/App.vue). One flat table of named
// routes plus its inverse, so adding a page is one row here instead of edits
// spread across five files.
//
// Plain JS (no framework): the route surface is shallow (~6 routes) and the
// SSR-with-vue-router ceremony isn't worth it yet. Revisit if routes become
// hierarchical or want per-route data loading / code splitting.

import { LOCALE_CODES, DEFAULT_LOCALE, isLocale } from './i18n/index.js'

// ── Static, hand-authored pages under public/ (copied to dist/client/ by the
// build). Defined once and consumed by every server entrypoint so the
// per-file `app.get('/guide', …)` duplication goes away. `localized: true`
// pages have `<file>.<locale>.html` siblings (e.g. guide.ha.html).
export const STATIC_PAGES = {
  guide:      { file: 'guide.html',      localized: true },
  developers: { file: 'developers.html', localized: false },
  press:      { file: 'press.html',      localized: false },
  admin:      { file: 'admin.html',      localized: false },
}

// ── SSR routes, tried in order. `test(rest)` gets the locale-stripped path and
// returns params (`{}` for no params) or null.
const ROUTES = [
  { name: 'home',        test: (s) => (s === '/' ? {} : null) },
  { name: 'themesIndex', test: (s) => (s === '/themes' || s === '/themes/' ? {} : null) },
  { name: 'themeLineage', test: (s) => {
      const m = /^\/themes\/([^/]+)\/?$/.exec(s)
      return m ? { slug: decodeURIComponent(m[1]) } : null
    } },
  { name: 'scorecard', test: (s) => {
      const m = /^\/([^/]+)(?:\/([^/]+))?\/?$/.exec(s)
      return m ? { admin: decodeURIComponent(m[1]), tab: m[2] ? decodeURIComponent(m[2]) : null } : null
    } },
]

function stripLocale(pathname) {
  const clean = (pathname || '/').split('?')[0].split('#')[0] || '/'
  const m = /^\/([a-z]{2,3})(\/|$)/.exec(clean)
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) {
    return { locale: m[1], rest: clean.slice(m[1].length + 1) || '/' }
  }
  return { locale: DEFAULT_LOCALE, rest: clean }
}

// matchRoute("/ha/themes/power-supply")
//   → { name:'themeLineage', params:{slug:'power-supply'}, locale:'ha', path:'/themes/power-supply' }
// Anything unmatched → { name:'notFound', params:{}, locale, path }
export function matchRoute(pathname) {
  const { locale, rest } = stripLocale(pathname)

  // Static pages before the generic /:admin match, so /guide isn't an "admin".
  const seg = /^\/([^/]+)\/?$/.exec(rest)
  if (seg && STATIC_PAGES[seg[1]]) {
    return { name: 'static', params: { page: seg[1] }, locale, path: rest }
  }

  for (const r of ROUTES) {
    const params = r.test(rest)
    if (params) return { name: r.name, params, locale, path: rest }
  }
  return { name: 'notFound', params: {}, locale, path: rest }
}

// Inverse — the canonical, locale-less path for a named route.
export function routePath(name, params = {}) {
  switch (name) {
    case 'home':         return '/'
    case 'themesIndex':  return '/themes'
    case 'themeLineage': return `/themes/${params.slug}`
    case 'scorecard':
      return params.tab && params.tab !== 'promises'
        ? `/${params.admin}/${params.tab}`
        : `/${params.admin}`
    case 'static':       return `/${params.page}`
    default:             return params.path || '/'
  }
}

// Full path with locale prefix (DEFAULT_LOCALE carries none).
export function buildPath(name, params = {}, locale = DEFAULT_LOCALE) {
  const rest = routePath(name, params)
  if (!locale || locale === DEFAULT_LOCALE) return rest
  return `/${locale}${rest === '/' ? '' : rest}`
}

// Prefix an already-built locale-less path (used for hreflang alternates).
export function withLocale(rest, locale) {
  if (!locale || locale === DEFAULT_LOCALE) return rest
  return `/${locale}${rest === '/' ? '' : rest}`
}

// The file to serve for a static-page route, honoring locale where the page
// has translations. Returns null for an unknown page.
export function staticFileFor(page, locale = DEFAULT_LOCALE) {
  const def = STATIC_PAGES[page]
  if (!def) return null
  if (def.localized && locale && locale !== DEFAULT_LOCALE && LOCALE_CODES.includes(locale)) {
    return def.file.replace(/\.html$/, `.${locale}.html`)
  }
  return def.file
}
