import { LOCALES, LOCALE_CODES, READY_LOCALES, DEFAULT_LOCALE } from '../src/i18n/index.js'
import { matchRoute, routePath, buildPath, withLocale, staticFileFor, legacyRedirectFor } from '../src/routes.js'

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

const SITE_ORIGIN = 'https://ngscorecard.com'
const HTML_LANG = Object.fromEntries(LOCALES.map((l) => [l.code, l.htmlLang]))
const OG_LOCALE = Object.fromEntries(LOCALE_CODES.map((c) => [c, `${c === 'en' ? 'en' : c}_NG`]))

// "Month YYYY" / "YYYY" → "YYYY-MM-DD" (day 01), or null. Used for the
// per-page schema.org dateModified from an administration's `reviewed` date.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
function isoFromReviewed(s) {
  const m = String(s ?? '').trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/)
  if (!m) return null
  const mi = m[1] ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) : 0
  if (mi < 0) return null
  return `${m[2]}-${String(mi + 1).padStart(2, '0')}-01`
}

// Renders one HTML response for a request URL. `template` is a complete HTML
// document (Vite's dev transform or its build output); `loadEntryServer` is a
// loader for the isomorphic entry-server module. Shared by server/dev.js,
// server/index.js and api/ssr.js so all three route identically.
//
// Returns { status, redirect, staticFile, html }:
//   - `redirect` (string) → 301 to that path (trailing slash, legacy links); html null.
//   - `staticFile` (string) → the caller serves public/<staticFile> (or
//     dist/client/<staticFile>); html null. Only /admin uses this now.
//   - otherwise `html` is the full document; `status` is 404 for an unknown
//     administration / unmatched path, 200 otherwise.
export async function renderHtml(url, template, loadEntryServer) {
  const parsed = new URL(url, 'http://localhost')

  // Canonicalise: a trailing slash on anything but the root 301s to the
  // slashless form so a page is never crawlable under two URLs.
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    return { status: 301, redirect: parsed.pathname.replace(/\/+$/, '') + parsed.search, staticFile: null, html: null }
  }

  // Legacy per-locale guide files (public/guide.ha.html etc., retired when
  // guide/press/developers were unified into the SSR route table) — anything
  // that linked or indexed those URLs lands on the new route instead of 404.
  const legacyDest = legacyRedirectFor(parsed.pathname)
  if (legacyDest) {
    return { status: 301, redirect: legacyDest + parsed.search, staticFile: null, html: null }
  }

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

  // The one remaining hand-authored static page (/admin) — the caller serves
  // the file from its own directory layout.
  if (route.name === 'static') {
    return { status: 200, redirect: null, staticFile: staticFileFor(route.params.page, loc), html: null }
  }

  const id = parseInt(parsed.searchParams.get('id'))
  const { render } = await loadEntryServer()
  const { html, initialData, meta, notFound, canonical, reviewed } = await render({ route, id })

  const langTag = HTML_LANG[initialData.locale] || 'en'
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const cRest = canonical || routePath(route.name, route.params)
  const canonicalUrl = `${SITE_ORIGIN}${withLocale(cRest, loc)}`

  // hreflang cluster only for locales whose catalogue is actually translated
  // (READY_LOCALES). With one ready locale there's nothing to alternate to,
  // so emit nothing rather than a pointless self-referential cluster.
  const hreflang = READY_LOCALES.length > 1
    ? [
        ...READY_LOCALES.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE_ORIGIN}${withLocale(cRest, l.code)}" />`),
        `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${withLocale(cRest, DEFAULT_LOCALE)}" />`,
      ].join('\n    ')
    : ''

  // Per-page schema.org WebPage — carries a real dateModified (from the
  // administration's review date) so freshness isn't guessed from the crawl.
  const dateModified = isoFromReviewed(reviewed)
  const jsonLd = notFound ? '' : `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: canonicalUrl,
    inLanguage: langTag,
    ...(dateModified ? { dateModified } : {}),
    isPartOf: { '@type': 'WebSite', name: 'NGScorecard', url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: 'NGScorecard', url: SITE_ORIGIN },
  }).replace(/</g, '\\u003c')}</script>`

  const stateScript = `<script>window.__INITIAL_STATE__=${JSON.stringify(initialData).replace(/</g, '\\u003c')}</script>`

  const finalHtml = template
    .replace('<html lang="en">', `<html lang="${langTag}">`)
    .replace('<!--ssr-hreflang-->', [hreflang, jsonLd].filter(Boolean).join('\n    '))
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
