import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { getPresidents, getAllDataForAdmin } from '../server/queries.js'

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills',
])

const FEDERAL_ONLY_TABS = new Set(['bills', 'governors'])

function buildMeta(admin) {
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

  const resolvedAdmin = presidents.some(p => p.key === admin) ? admin : 'tinubu'
  const adminRecord = presidents.find(p => p.key === resolvedAdmin)

  const tabInvalidForLevel = adminRecord?.level === 'state' && FEDERAL_ONLY_TABS.has(tab)
  const resolvedTab = (VALID_TABS.has(tab) && !tabInvalidForLevel) ? tab : 'promises'

  const data = await getAllDataForAdmin(resolvedAdmin)

  const initialData = {
    admin: resolvedAdmin,
    tab: resolvedTab,
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
  const meta = buildMeta(adminRecord)

  return { html, initialData, meta }
}
