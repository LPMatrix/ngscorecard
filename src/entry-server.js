import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { getPresidents, getAllDataForAdmin, getThemesWithCounts, getThemeLineage } from '../server/queries.js'
import { createT, isLocale, DEFAULT_LOCALE } from './i18n/index.js'
import { routePath } from './routes.js'

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills',
])

const FEDERAL_ONLY_TABS = new Set(['bills', 'governors'])

// Fields, in priority order, that carry the human-readable gist of a record
// across the different tabs (promise, fraud case, order, bill, minister…).
const DETAIL_FIELDS = ['promise', 'assessment', 'allegation', 'directive', 'summary', 'mandate', 'issue', 'problem', 'outcome', 'note']

// `t` is a bound translator for the active locale (see src/i18n). Meta frames
// come from the catalogue; deep-link detail and theme blurbs stay as data.
function buildMeta(t, admin, deepItem, notFound) {
  if (notFound) {
    return { title: t('meta.notFound.title'), description: t('meta.notFound.desc') }
  }
  // A shared/deep link to one card (?id=…) — describe that card, not the tab.
  if (admin && deepItem) {
    const label = deepItem.title || deepItem.name
    if (label) {
      const detailSrc = DETAIL_FIELDS.map(f => deepItem[f]).find(Boolean)
      const detail = detailSrc
        ? String(detailSrc).replace(/\s+/g, ' ').trim().slice(0, 200)
        : `${admin.fullName} — tracked on NGScorecard.`
      return { title: `${label} — ${admin.fullName} | NGScorecard`, description: detail }
    }
  }
  if (!admin) {
    return { title: t('meta.landing.title'), description: t('meta.landing.desc') }
  }
  if (admin.level === 'state') {
    const p = { fullName: admin.fullName, state: admin.state, term: admin.term }
    return { title: t('meta.state.title', p), description: t('meta.state.desc', p) }
  }
  const p = { fullName: admin.fullName, term: admin.term }
  return { title: t('meta.federal.title', p), description: t('meta.federal.desc', p) }
}

// `render({ route, id })` where route = { name, params, locale } comes from
// src/routes.js matchRoute(). Dispatches on route.name; returns { html,
// initialData, meta, notFound, canonical } — `canonical` is the locale-less
// canonical path for this view (server/render.js adds the locale prefix and
// hreflang cluster). `initialData` shape is stable so src/App.vue's client
// hydration path needs no per-route knowledge.
export async function render({ route, id } = {}) {
  const { name = 'notFound', params = {} } = route || {}
  const loc = isLocale(route?.locale) ? route.locale : DEFAULT_LOCALE
  const t = createT(loc)
  const presidents = await getPresidents()

  const projectedPresidents = presidents.map(p => ({
    key: p.key, name: p.name, title: p.fullName, term: p.term,
    party: p.party, termStart: p.termStart, termEnd: p.termEnd,
    tagline: p.tagline, reviewed: p.reviewed, level: p.level, state: p.state,
    isCurrent: p.isCurrent !== false,
  }))

  const mount = (initialData) => {
    const app = createSSRApp(App)
    app.provide('initialData', initialData)
    app.provide('t', t)
    return renderToString(app)
  }

  const baseState = () => ({
    locale: loc, landing: false, admin: null, tab: 'promises', notFound: false,
    requestedAdmin: null, expandedId: null, presidents: projectedPresidents, data: {}, page: null,
  })

  // ── "/" — the neutral landing page ────────────────────────────────────
  if (name === 'home') {
    const initialData = { ...baseState(), landing: true }
    const html = await mount(initialData)
    return { html, initialData, meta: buildMeta(t, null, null, false), notFound: false, canonical: '/' }
  }

  // ── "/guide", "/press", "/developers" — content pages, unified into the
  // route table so they get the same locale prefix, switcher and t()
  // catalogue as everything else (see docs/i18n-plan.md). `page` tells
  // App.vue which view component to mount.
  if (name === 'guide' || name === 'press' || name === 'developers') {
    const initialData = { ...baseState(), page: name }
    const html = await mount(initialData)
    const meta = { title: t(`meta.${name}.title`), description: t(`meta.${name}.desc`) }
    return { html, initialData, meta, notFound: false, canonical: routePath(name, params) }
  }

  // ── "/themes" and "/themes/<slug>" — recurring commitments ────────────
  if (name === 'themesIndex' || name === 'themeLineage') {
    const slug = name === 'themeLineage' ? params.slug : null
    let payload, meta, missing = false
    if (slug) {
      const lineage = await getThemeLineage(slug)
      if (lineage) {
        payload = { mode: 'lineage', slug, theme: lineage.theme, entries: lineage.entries }
        meta = { title: t('meta.themeLineage.title', { title: lineage.theme.title }), description: lineage.theme.blurb }
      } else {
        missing = true
        payload = { mode: 'missing', slug }
        meta = buildMeta(t, null, null, true)
      }
    } else {
      payload = { mode: 'index', list: await getThemesWithCounts() }
      meta = { title: t('meta.themesIndex.title'), description: t('meta.themesIndex.desc') }
    }
    const initialData = {
      ...baseState(), admin: 'themes', tab: slug, themes: payload,
      notFound: missing, requestedAdmin: missing ? `themes/${slug}` : null,
    }
    const html = await mount(initialData)
    return { html, initialData, meta, notFound: missing, canonical: routePath(name, params) }
  }

  // ── "/<admin>" and "/<admin>/<tab>" — an administration scorecard ─────
  if (name === 'scorecard') {
    const { admin, tab } = params
    const adminKnown = presidents.some(p => p.key === admin)
    const notFound = !adminKnown
    const resolvedAdmin = adminKnown ? admin : 'tinubu'
    const adminRecord = presidents.find(p => p.key === resolvedAdmin)

    const tabInvalidForLevel = adminRecord?.level === 'state' && FEDERAL_ONLY_TABS.has(tab)
    const resolvedTab = (VALID_TABS.has(tab) && !tabInvalidForLevel) ? tab : 'promises'

    const data = await getAllDataForAdmin(resolvedAdmin)
    const initialData = {
      ...baseState(),
      admin: resolvedAdmin,
      tab: resolvedTab,
      notFound,
      requestedAdmin: notFound ? admin : null,
      expandedId: Number.isFinite(id) ? id : null,
      data,
    }
    const html = await mount(initialData)

    const deepItem = Number.isFinite(id) && Array.isArray(data[resolvedTab])
      ? data[resolvedTab].find(x => x.id === id)
      : null
    const meta = buildMeta(t, adminRecord, deepItem, notFound)
    const canonical = notFound ? (route.path || '/') : routePath('scorecard', { admin: resolvedAdmin, tab: resolvedTab })
    return { html, initialData, meta, notFound, canonical, reviewed: notFound ? null : (adminRecord?.reviewed ?? null) }
  }

  // ── Anything else — a genuine 404 ────────────────────────────────────
  const initialData = { ...baseState(), notFound: true, requestedAdmin: (route?.path || '').replace(/^\//, '') || 'this page' }
  const html = await mount(initialData)
  return { html, initialData, meta: buildMeta(t, null, null, true), notFound: true, canonical: route?.path || '/' }
}
