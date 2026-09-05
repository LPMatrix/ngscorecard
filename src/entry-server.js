import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { getPresidents, getAllDataForAdmin } from '../server/queries.js'

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
      description: 'Independent tracker for Nigerian presidential administrations — campaign promises, fraud cases, executive orders, ministerial performance, budgets, and legislation, covering Tinubu, Buhari, Jonathan, Yar’Adua, and Obasanjo since 1999.',
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

  // `admin` is null on the bare homepage (default to Tinubu) but a
  // non-matching *non-null* value means the path segment itself is bogus
  // (e.g. /nosuchperson) — that's a real 404, not a silent fallback.
  const adminKnown = presidents.some(p => p.key === admin)
  const notFound = admin != null && !adminKnown
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
    presidents: presidents.map(p => ({
      key: p.key, name: p.name, title: p.fullName, term: p.term,
      tagline: p.tagline, reviewed: p.reviewed, level: p.level, state: p.state,
      isCurrent: p.isCurrent !== false,
    })),
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
