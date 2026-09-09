// Minimal in-house i18n for NGScorecard.
//
// No framework (see docs/i18n-plan.md for why): the app is small, SSR is
// hand-rolled, and the message set is a few hundred flat keys with light
// interpolation. `createT(locale)` returns a `t(key, params)` function with a
// strict fallback chain — requested locale → English → the key itself — so a
// missing translation degrades to English and never shows a raw key to a
// reader.
//
// Phase 0 (this file + en.json) is scaffolding only: routing, extraction and
// the other-locale catalogues come in later phases.

import en from './en.js'
import ha from './ha.js'
import yo from './yo.js'
import ig from './ig.js'
import pcm from './pcm.js'

// Ordered for the language switcher. `name` is the endonym shown in the UI;
// `htmlLang` is the BCP-47 tag for <html lang> and hreflang.
//
// Two independent gates:
//   `ready`   — SEO exposure. A locale's routes are always reachable (not
//               404), but are NOT advertised in the sitemap or hreflang
//               cluster until `ready`. Flip on only after native review.
//   `preview` — shows the locale in the in-header language switcher so
//               readers can opt into an unreviewed machine draft. Google is
//               still not told about it. A `ready` locale is switchable too.
export const LOCALES = [
  { code: 'en',  name: 'English', htmlLang: 'en',  ready: true },
  { code: 'ha',  name: 'Hausa',   htmlLang: 'ha',  ready: false, preview: true },
  { code: 'yo',  name: 'Yorùbá',  htmlLang: 'yo',  ready: false, preview: true },
  { code: 'ig',  name: 'Igbo',    htmlLang: 'ig',  ready: false, preview: true },
  { code: 'pcm', name: 'Naijá',   htmlLang: 'pcm', ready: false, preview: true },
]

export const DEFAULT_LOCALE = 'en'
export const LOCALE_CODES = LOCALES.map(l => l.code)
export const READY_LOCALES = LOCALES.filter(l => l.ready)
export const READY_LOCALE_CODES = READY_LOCALES.map(l => l.code)
// Offered in the language switcher: fully-ready locales plus preview drafts.
export const SWITCHABLE_LOCALES = LOCALES.filter(l => l.ready || l.preview)
// A locale a reader can switch to but that isn't natively reviewed yet.
export const PREVIEW_LOCALE_CODES = LOCALES.filter(l => l.preview && !l.ready).map(l => l.code)
export function isPreviewLocale(code) {
  return PREVIEW_LOCALE_CODES.includes(code)
}

const MESSAGES = { en, ha, yo, ig, pcm }

const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV

export function isLocale(code) {
  return LOCALE_CODES.includes(code)
}

// Splits a leading locale segment off a pathname.
//   "/ha/tinubu/orders" → { locale: "ha", rest: "/tinubu/orders" }
//   "/tinubu"           → { locale: "en", rest: "/tinubu" }
export function splitLocalePath(pathname) {
  const m = /^\/([a-z]{2,3})(\/|$)/.exec(pathname || '/')
  if (m && isLocale(m[1]) && m[1] !== DEFAULT_LOCALE) {
    return { locale: m[1], rest: pathname.slice(m[1].length + 1) || '/' }
  }
  return { locale: DEFAULT_LOCALE, rest: pathname || '/' }
}

// Prefixes a path for a locale. `en` stays bare; everything else gets "/<code>".
export function localizePath(path, locale) {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (!locale || locale === DEFAULT_LOCALE) return clean
  return `/${locale}${clean === '/' ? '' : clean}`
}

function interpolate(str, params) {
  if (!params || str.indexOf('{') === -1) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : ''))
}

// Returns a bound translator for one locale.
export function createT(locale) {
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  const table = MESSAGES[loc] || {}
  const base = MESSAGES[DEFAULT_LOCALE]

  const missing = DEV ? new Set() : null

  function t(key, params) {
    let val = table[key]
    if (val == null) {
      val = base[key]
      if (val == null) {
        if (missing && !missing.has(key)) {
          missing.add(key)
          console.warn(`[i18n] missing key: "${key}"`)
        }
        return key
      }
    }
    // "singular|plural" — pick on params.count (or params.n)
    if (val.indexOf('|') !== -1 && params && (params.count != null || params.n != null)) {
      const n = params.count != null ? params.count : params.n
      const parts = val.split('|')
      val = Math.abs(n) === 1 ? parts[0] : (parts[1] ?? parts[0])
    }
    return interpolate(val, params)
  }

  t.locale = loc
  return t
}
