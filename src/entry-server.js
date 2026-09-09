import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { getPresidents, getAllDataForAdmin, getThemesWithCounts, getThemeLineage } from '../server/queries.js'

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills',
])

const FEDERAL_ONLY_TABS = new Set(['bills', 'governors'])

// Fields, in priority order, that carry the human-readable gist of a record
// across the different tabs (promise, fraud case, order, bill, minister…).
const DETAIL_FIELDS = ['promise', 'assessment', 'allegation', 'directive', 'summary', 'mandate', 'issue', 'problem', 'outcome', 'note']

function buildMeta(admin, deepItem, notFound) {
  if (notFound) {
    return {
      title: 'Administration not found | NGScorecard',
      description: 'That page doesn’t match any tracked Nigerian president or governor. Use the search on NGScorecard to find the one you’re after.',
    }
  }
  // A shared/deep link to one card (?id=…) — describe that card, not the tab.
  if (admin && deepItem) {
    const label = deepItem.title || deepItem.name
    if (label) {
      const detailSrc = DETAIL_FIELDS.map(f => deepItem[f]).find(Boolean)
      const detail = detailSrc
        ? String(detailSrc).replace(/\s+/g, ' ').trim().slice(0, 200)
        : `${admin.fullName} — tracked on NGScorecard.`
      return {
        title: `${label} — ${admin.fullName} | NGScorecard`,
        description: detail,
      }
    }
  }
  if (!admin) {
    return {
      title: 'NGScorecard — Nigeria Government Accountability Tracker',
      description: 'Independent, non-partisan tracker of Nigerian governments — campaign promises, fraud cases, executive orders, ministerial performance, budgets and court judgments. Every federal administration since 1960 and elected state governors back to 1979, every claim sourced.',
    }
  }
  if (admin.level === 'state') {
    return {
      title: `NGScorecard — ${admin.fullName} Accountability Tracker (${admin.state} State, ${admin.term})`,
      description: `Independent tracker for ${admin.fullName}'s (${admin.term}) record as Governor of ${admin.state} State — campaign promises, fraud cases, executive directives, commissioners' performance, state budgets, and court judgments. Part of NGScorecard's civic accountability record for Nigeria.`,
    }
  }
  return {
    title: `NGScorecard — ${admin.fullName} Accountability Tracker (${admin.term})`,
    description: `Independent tracker for ${admin.fullName}'s (${admin.term}) campaign promises, fraud cases, executive orders, ministerial performance, federal budgets, and legislation. Part of NGScorecard's civic accountability record for Nigeria since 1999.`,
  }
}

export async function render({ admin, tab, id } = {}) {
  const presidents = await getPresidents()

  const projectedPresidents = presidents.map(p => ({
    key: p.key, name: p.name, title: p.fullName, term: p.term,
    party: p.party, termStart: p.termStart, termEnd: p.termEnd,
    tagline: p.tagline, reviewed: p.reviewed, level: p.level, state: p.state,
    isCurrent: p.isCurrent !== false,
  }))

  // Bare "/" (admin === null) is the neutral landing page — no administration
  // selected, no per-admin data loaded, generic site meta. A non-null admin
  // that matches nothing (e.g. /nosuchperson) is a real 404, handled below.
  if (admin == null) {
    const initialData = {
      landing: true,
      admin: null,
      tab: 'promises',
      notFound: false,
      requestedAdmin: null,
      expandedId: null,
      presidents: projectedPresidents,
      data: {},
    }
    const app = createSSRApp(App)
    app.provide('initialData', initialData)
    const html = await renderToString(app)
    return { html, initialData, meta: buildMeta(null, null, false), notFound: false }
  }

  // "/themes" (index) and "/themes/<slug>" (one recurring commitment's lineage).
  if (admin === 'themes') {
    const slug = tab || null
    const base = {
      admin: 'themes', tab: slug, notFound: false, requestedAdmin: null,
      expandedId: null, presidents: projectedPresidents, data: {},
    }
    let payload, meta, missing = false
    if (slug) {
      const lineage = await getThemeLineage(slug)
      if (lineage) {
        payload = { mode: 'lineage', slug, theme: lineage.theme, entries: lineage.entries }
        meta = {
          title: `${lineage.theme.title} — a recurring commitment | NGScorecard`,
          description: lineage.theme.blurb,
        }
      } else {
        missing = true
        payload = { mode: 'missing', slug }
        meta = buildMeta(null, null, true)
      }
    } else {
      payload = { mode: 'index', list: await getThemesWithCounts() }
      meta = {
        title: 'Recurring commitments | NGScorecard',
        description: 'Promises Nigerian governments have made again and again — each one threaded through every administration that made it, with what actually happened.',
      }
    }
    const initialData = { ...base, themes: payload, notFound: missing, requestedAdmin: missing ? `themes/${slug}` : null }
    const app = createSSRApp(App)
    app.provide('initialData', initialData)
    const html = await renderToString(app)
    return { html, initialData, meta, notFound: missing }
  }

  const adminKnown = presidents.some(p => p.key === admin)
  const notFound = !adminKnown
  const resolvedAdmin = adminKnown ? admin : 'tinubu'
  const adminRecord = presidents.find(p => p.key === resolvedAdmin)

  const tabInvalidForLevel = adminRecord?.level === 'state' && FEDERAL_ONLY_TABS.has(tab)
  const resolvedTab = (VALID_TABS.has(tab) && !tabInvalidForLevel) ? tab : 'promises'

  const data = await getAllDataForAdmin(resolvedAdmin)

  const initialData = {
    admin: resolvedAdmin,
    tab: resolvedTab,
    notFound,
    requestedAdmin: notFound ? admin : null,
    expandedId: Number.isFinite(id) ? id : null,
    presidents: projectedPresidents,
    data,
  }

  const app = createSSRApp(App)
  app.provide('initialData', initialData)

  const html = await renderToString(app)

  // If the URL deep-links a specific card, give it its own title/description
  // so shared links render a meaningful preview.
  const deepItem = Number.isFinite(id) && Array.isArray(data[resolvedTab])
    ? data[resolvedTab].find(x => x.id === id)
    : null
  const meta = buildMeta(adminRecord, deepItem, notFound)

  return { html, initialData, meta, notFound }
}
