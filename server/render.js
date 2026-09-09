import { LOCALES, LOCALE_CODES, DEFAULT_LOCALE } from '../src/i18n/index.js'
import { matchRoute, routePath, buildPath, withLocale, staticFileFor } from '../src/routes.js'

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

const SITE_ORIGIN = 'https://ngscorecard.com'
const HTML_LANG = Object.fromEntries(LOCALES.map((l) => [l.code, l.htmlLang]))
const OG_LOCALE = Object.fromEntries(LOCALE_CODES.map((c) => [c, `${c === 'en' ? 'en' : c}_NG`]))

// Renders one HTML response for a request URL. `template` is a complete HTML
// document (Vite's dev transform or its build output); `loadEntryServer` is a
// loader for the isomorphic entry-server module. Shared by server/dev.js,
// server/index.js and api/ssr.js so all three route identically.
//
// Returns { status, redirect, staticFile, html }:
//   - `redirect` (string) → 301 to that path (legacy `?admin=&tab=` links); html null.
//   - `staticFile` (string) → the caller should serve public/<staticFile>
//     (or dist/client/<staticFile>); html null. For /guide, /developers, …
//   - otherwise `html` is the full document; `status` is 404 for an unknown
//     administration / unmatched path, 200 otherwise.
export async function renderHtml(url, template, loadEntryServer) {
  const parsed = new URL(url, 'http://localhost')
  const route = matchRoute(parsed.pathname) // { name, params, locale, path }
  const loc = route.locale

  // Backward compat: old `?admin=&tab=` links 301 to the new path form. Other
  // query params (id, status, cat, q, response) ride along.
  const legacyAdmin = parsed.searchParams.get('admin')
  if (legacyAdmin) {
    const dest = new URL(parsed.toString())
    dest.searchParams.delete('admin')
    dest.searchParams.delete('tab')
    dest.pathname = buildPath('scorecard', { admin: legacyAdmin, tab: parsed.searchParams.get('tab') }, loc)
    return { status: 301, redirect: dest.pathname + dest.search, staticFile: null, html: null }
  }

  // Hand-authored static pages (/guide, /developers, /press, /admin) — the
  // caller serves the file from its own directory layout.
  if (route.name === 'static') {
    return { status: 200, redirect: null, staticFile: staticFileFor(route.params.page, loc), html: null }
  }

  const id = parseInt(parsed.searchParams.get('id'))
  const { render } = await loadEntryServer()
  const { html, initialData, meta, notFound, canonical } = await render({ route, id })

  const langTag = HTML_LANG[initialData.locale] || 'en'
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const cRest = canonical || routePath(route.name, route.params)
  const canonicalUrl = `${SITE_ORIGIN}${withLocale(cRest, loc)}`

  const hreflang = [
    ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE_ORIGIN}${withLocale(cRest, l.code)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${withLocale(cRest, DEFAULT_LOCALE)}" />`,
  ].join('\n    ')

  const stateScript = `<script>window.__INITIAL_STATE__=${JSON.stringify(initialData).replace(/</g, '\\u003c')}</script>`

  const finalHtml = template
    .replace('<html lang="en">', `<html lang="${langTag}">`)
    .replace('<!--ssr-hreflang-->', hreflang)
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${OG_LOCALE[initialData.locale] || 'en_NG'}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace('<!--ssr-outlet-->', html)
    .replace('<!--ssr-state-->', stateScript)

  return { status: notFound ? 404 : 200, redirect: null, staticFile: null, html: finalHtml }
}
