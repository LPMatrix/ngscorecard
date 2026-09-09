import { splitLocalePath, localizePath, LOCALES, LOCALE_CODES, DEFAULT_LOCALE } from '../src/i18n/index.js'

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

const SITE_ORIGIN = 'https://ngscorecard.com'
const HTML_LANG = Object.fromEntries(LOCALES.map((l) => [l.code, l.htmlLang]))
const OG_LOCALE = Object.fromEntries(LOCALE_CODES.map((c) => [c, `${c === 'en' ? 'en' : c}_NG`]))

// The canonical shareable path for a resolved admin/tab, WITHOUT any locale
// prefix — `localizePath()` adds that per locale. Deliberately ignores
// filters (?status=&cat=&q=&response=) and ?id= (a highlighted card within
// the tab, not its own page — see FEATURES.md's "not doing /promise/N" note)
// so every filtered/deep-linked view declares the same canonical as its
// plain tab page.
function canonicalRest(admin, tab) {
  if (!admin) return '/' // the neutral landing page
  if (admin === 'themes') return tab ? `/themes/${tab}` : '/themes'
  return tab === 'promises' ? `/${admin}` : `/${admin}/${tab}`
}

// Renders one HTML response for a request URL, given a template (already
// containing correct client asset tags — from Vite's dev transform or its
// build output, both are complete HTML on their own) and a loader for the
// isomorphic entry-server module. Used by both the local dev server and the
// production Vercel/Node server so they share one code path.
//
// Returns { status, redirect, html }: `redirect` is set (and `html` is
// null) for a legacy `?admin=&tab=` link, which 301s to the equivalent
// `/admin/tab` path; otherwise `html` is the full document and `status` is
// 404 for an admin segment that doesn't match any tracked administration,
// 200 otherwise. Callers are expected to check `redirect` before using `html`.
export async function renderHtml(url, template, loadEntryServer) {
  const parsed = new URL(url, 'http://localhost')

  // Backward compat: old `?admin=&tab=` links (bookmarks, indexed search
  // results, anything printed before this migration) redirect to the new
  // path form rather than 404ing or silently re-rendering at the old URL.
  // Any other query params (id, status, cat, q, response) ride along.
  // A leading /<locale> segment ("/ha/tinubu") is stripped here and threaded
  // through; the default locale ("en") carries no prefix.
  const { locale, rest } = splitLocalePath(parsed.pathname)

  const legacyAdmin = parsed.searchParams.get('admin')
  if (legacyAdmin) {
    const legacyTab = parsed.searchParams.get('tab')
    const dest = new URL(parsed.toString())
    dest.searchParams.delete('admin')
    dest.searchParams.delete('tab')
    const barePath = legacyTab && legacyTab !== 'promises' ? `/${legacyAdmin}/${legacyTab}` : `/${legacyAdmin}`
    dest.pathname = localizePath(barePath, locale)
    return { status: 301, redirect: dest.pathname + dest.search, html: null }
  }

  // Reserved top-level paths (/developers, /admin, /press, /guide, /api/*)
  // are matched by dedicated routes registered before this catch-all in
  // server/dev.js, server/index.js and api/ssr.js, so they never reach here.
  const [admin = null, tab = null] = rest.split('/').filter(Boolean)
  const id = parseInt(parsed.searchParams.get('id'))

  const { render } = await loadEntryServer()
  const { html, initialData, meta, notFound } = await render({ locale, admin, tab, id })

  const loc = initialData.locale || DEFAULT_LOCALE
  const langTag = HTML_LANG[loc] || 'en'
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const cRest = canonicalRest(initialData.admin, initialData.tab)
  const canonicalUrl = `${SITE_ORIGIN}${localizePath(cRest, loc)}`

  const hreflang = [
    ...LOCALES.map((l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${SITE_ORIGIN}${localizePath(cRest, l.code)}" />`),
    `<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${localizePath(cRest, DEFAULT_LOCALE)}" />`,
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
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${OG_LOCALE[loc] || 'en_NG'}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace('<!--ssr-outlet-->', html)
    .replace('<!--ssr-state-->', stateScript)

  return { status: notFound ? 404 : 200, redirect: null, html: finalHtml }
}
