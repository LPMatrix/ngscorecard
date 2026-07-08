import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { VALID_ADMINS, getPresidents, getAllDataForAdmin } from '../server/queries.js'

const VALID_TABS = new Set([
  'promises', 'ministers', 'orders', 'appointments', 'governors',
  'fraud', 'judgments', 'inherited', 'budget', 'indicators', 'bills',
])

function buildMeta(president) {
  if (!president) {
    return {
      title: 'NGScorecard — Nigeria Government Accountability Tracker',
      description: 'Independent tracker for Nigerian presidential administrations — campaign promises, fraud cases, executive orders, ministerial performance, budgets, and legislation, covering Tinubu, Buhari, Jonathan, Yar’Adua, and Obasanjo since 1999.',
    }
  }
  return {
    title: `NGScorecard — ${president.fullName} Accountability Tracker (${president.term})`,
    description: `Independent tracker for ${president.fullName}'s (${president.term}) campaign promises, fraud cases, executive orders, ministerial performance, federal budgets, and legislation. Part of NGScorecard's civic accountability record for Nigeria since 1999.`,
  }
}

export async function render({ admin, tab, id } = {}) {
  const resolvedAdmin = VALID_ADMINS.has(admin) ? admin : 'tinubu'
  const resolvedTab   = VALID_TABS.has(tab) ? tab : 'promises'

  const [presidents, data] = await Promise.all([
    getPresidents(),
    getAllDataForAdmin(resolvedAdmin),
  ])

  const initialData = {
    admin: resolvedAdmin,
    tab: resolvedTab,
    expandedId: Number.isFinite(id) ? id : null,
    presidents: presidents.map(p => ({
      key: p.key, name: p.name, title: p.fullName, term: p.term,
      tagline: p.tagline, reviewed: p.reviewed,
    })),
    data,
  }

  const app = createSSRApp(App)
  app.provide('initialData', initialData)

  const html = await renderToString(app)
  const meta = buildMeta(presidents.find(p => p.key === resolvedAdmin))

  return { html, initialData, meta }
}
