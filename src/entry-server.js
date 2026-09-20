import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { getPresidents, getAllDataForAdmin, getThemesWithCounts, getThemeLineage, getPromises, getFraud, getBudget, getManifesto } from '../server/queries.js'
import { createT, isLocale, DEFAULT_LOCALE } from './i18n/index.js'
import { routePath } from './routes.js'
import { findPublication, listPublications } from './content/publications.js'
import { buildTermReport } from './lib/termReport.js'

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills', 'manifesto',
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
    requestedAdmin: null, expandedId: null, presidents: projectedPresidents, data: {}, page: null, report: false, publication: null, publications: null, publicationMissing: false,
  })

  // ── "/" — the neutral landing page ────────────────────────────────────
  if (name === 'home') {
    const landingThemes = (await getThemesWithCounts()).map(th => ({ slug: th.slug, title: th.title, adminCount: th.adminCount }))
    const initialData = { ...baseState(), landing: true, landingThemes }
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

  // ── "/publications" and "/publications/<slug>" — editorial pieces. The
  // content is bundled (src/content/publications.js) and English only, so
  // other locales are served but kept out of search results.
  if (name === 'publications' || name === 'publication') {
    const article = name === 'publication' ? findPublication(params.slug) : null
    const missing = name === 'publication' && !article
    const initialData = {
      ...baseState(), page: 'publications',
      publication: article, publications: listPublications(), publicationMissing: missing,
    }
    const html = await mount(initialData)
    const meta = article
      ? { title: `${article.title} | NGScorecard`, description: article.summary }
      : { title: t('meta.publications.title'), description: t('meta.publications.desc') }
    return {
      html, initialData, meta, notFound: missing,
      canonical: article ? routePath('publication', { slug: article.slug }) : routePath('publications'),
      robots: missing || loc !== 'en' ? 'noindex, follow' : null,
    }
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

  // ── "/<admin>/report" — the term report card. Loads only what the report
  // derives from (promises, fraud, budget), not the whole admin payload.
  // Also returns a per-page share image and, for an admin with nothing
  // tracked yet, a noindex hint so a thin page isn't offered to search.
  if (name === 'adminReport') {
    const adminRecord = presidents.find(p => p.key === params.admin)
    if (!adminRecord) {
      const initialData = { ...baseState(), notFound: true, requestedAdmin: params.admin }
      const html = await mount(initialData)
      return { html, initialData, meta: buildMeta(t, null, null, true), notFound: true, canonical: route?.path || '/' }
    }
    const key = adminRecord.key
    const [promises, fraud, budget] = await Promise.all([getPromises(key), getFraud(key), getBudget(key)])
    const initialData = { ...baseState(), admin: key, report: true, data: { promises, fraud, budget } }
    const html = await mount(initialData)

    const report = buildTermReport({ admin: adminRecord, promises, fraud, budget })
    const p = { name: adminRecord.fullName, term: adminRecord.term }
    const meta = report.total
      ? {
          title: t('meta.report.title', p),
          description: t('meta.report.desc', { ...p, kept: report.kept, total: report.total, pct: report.keptPct }),
        }
      : { title: t('meta.report.title', p), description: t('meta.report.descEmpty', p) }
    return {
      html, initialData, meta, notFound: false,
      canonical: routePath('adminReport', { admin: key }),
      reviewed: adminRecord.reviewed,
      ogImage: `/api/og/report/${key}.png`,
      ogImageAlt: report.total ? t('report.ogAlt', { ...p, kept: report.kept, total: report.total }) : meta.title,
      robots: report.total ? null : 'noindex, follow',
    }
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

    const data = { ...(await getAllDataForAdmin(resolvedAdmin)), manifesto: getManifesto(resolvedAdmin) }
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
    // The Manifesto tab is thin until an administration has reviewed documents,
    // so it stays out of search results until then.
    const robots = resolvedTab === 'manifesto' && (notFound || !['candidate', 'party', 'pledge'].includes(data.manifesto.state)) ? 'noindex, follow' : null
    return { html, initialData, meta, notFound, canonical, reviewed: notFound ? null : (adminRecord?.reviewed ?? null), robots }
  }

  // ── Anything else — a genuine 404 ────────────────────────────────────
  const initialData = { ...baseState(), notFound: true, requestedAdmin: (route?.path || '').replace(/^\//, '') || 'this page' }
  const html = await mount(initialData)
  return { html, initialData, meta: buildMeta(t, null, null, true), notFound: true, canonical: route?.path || '/' }
}
