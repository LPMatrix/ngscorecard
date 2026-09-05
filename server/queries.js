import { eq, and, asc } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

function withTerm(rows) {
  return rows.map(p => ({
    ...p,
    term: p.termEnd ? `${p.termStart}–${p.termEnd}` : `${p.termStart}–present`,
  }))
}

// Full registry — every tracked administration, federal and state alike.
// Used internally (the frontend's own Federal/State nav filters this
// client-side). The public API splits it into the two functions below
// instead, so /api/v1/presidents can't return a governor by surprise.
export async function getPresidents() {
  return withTerm(await db.select().from(t.presidents))
}

export async function getFederalPresidents() {
  return withTerm(await db.select().from(t.presidents).where(eq(t.presidents.level, 'federal')))
}

// Named distinctly from getGovernors(admin) below, which is a different,
// unrelated resource: the historical state-governor list nested under a
// federal president's own profile (GET /:admin/governors), not this —
// the registry of governor *administrations* themselves (Otti, Ododo, etc.).
// Current governors only — former governors (isCurrent: false) stay off this
// list, same as the frontend's own State tab. They're still fully fetchable
// by key (GET /api/v1/:admin/promises etc.), just not listed here.
export async function getStateGovernorAdmins() {
  return withTerm(await db.select().from(t.presidents).where(and(eq(t.presidents.level, 'state'), eq(t.presidents.isCurrent, true))))
}

export async function isValidAdmin(admin) {
  if (!admin) return false
  const rows = await db
    .select({ key: t.presidents.key })
    .from(t.presidents)
    .where(eq(t.presidents.key, admin))
    .limit(1)
  return rows.length > 0
}

export const getPromises     = (admin) => db.select().from(t.promises).where(eq(t.promises.administration, admin))
export const getInherited    = (admin) => db.select().from(t.inherited).where(eq(t.inherited.administration, admin))
export const getFraud        = (admin) => db.select().from(t.fraud).where(eq(t.fraud.administration, admin))
export const getOrders       = (admin) => db.select().from(t.orders).where(eq(t.orders.administration, admin))
export const getMinisters    = (admin) => db.select().from(t.ministers).where(eq(t.ministers.administration, admin))
export const getBills        = (admin) => db.select().from(t.bills).where(eq(t.bills.administration, admin))
export const getAppointments = (admin) => db.select().from(t.appointments).where(eq(t.appointments.administration, admin))
export const getJudgments    = (admin) => db.select().from(t.judgments).where(eq(t.judgments.administration, admin))
export const getGovernors    = (admin) => db.select().from(t.governors).where(eq(t.governors.administration, admin))

// Every logged change under one administration, oldest first. The frontend
// groups these by entryTable + entryId onto each card.
export const getEntryHistory = (admin) =>
  db.select().from(t.entryHistory)
    .where(eq(t.entryHistory.administration, admin))
    .orderBy(asc(t.entryHistory.changedAt), asc(t.entryHistory.id))

export async function getBudget(admin) {
  const [budgets, ministries] = await Promise.all([
    db.select().from(t.budget).where(eq(t.budget.administration, admin)),
    db.select().from(t.budgetMinistries).where(eq(t.budgetMinistries.administration, admin)),
  ])
  const byYear = {}
  for (const m of ministries) {
    if (!byYear[m.budgetYear]) byYear[m.budgetYear] = []
    byYear[m.budgetYear].push({ name: m.name, allocationBn: m.allocationBn, releasedPct: m.releasedPct, note: m.note })
  }
  return budgets.map(b => ({ ...b, ministries: byYear[b.year] || [] }))
}

export async function getIndicators(admin) {
  const [inds, pts] = await Promise.all([
    db.select().from(t.indicators).where(eq(t.indicators.administration, admin)),
    db.select().from(t.indicatorPoints).where(eq(t.indicatorPoints.administration, admin)),
  ])
  const byId = {}
  for (const p of pts) {
    if (!byId[p.indicatorId]) byId[p.indicatorId] = []
    byId[p.indicatorId].push({ label: p.label, value: p.value })
  }
  return inds.map(({ id, key, ...rest }) => ({ id: key, ...rest, points: byId[id] || [] }))
}

// The complete tracker as one structure: every administration (federal and
// state) with all of its category data nested under `data`, mirroring the
// per-admin files in data/seed/. Powers the public /api/v1/dump export and
// the static public/ngscorecard-dataset.json mirror — see server/dataExport.js.
export async function getFullDataset() {
  const admins = await getPresidents()
  return Promise.all(
    admins.map(async (a) => ({ ...a, data: await getAllDataForAdmin(a.key) })),
  )
}

// Matches the shape App.vue's loadData() assembles client-side, so the same
// object can be dropped in as initial state for SSR or hydration.
export async function getAllDataForAdmin(admin) {
  const [
    promises, inherited, fraud, orders, ministers,
    budget, bills, indicators, appointments, judgments, governors, history,
  ] = await Promise.all([
    getPromises(admin), getInherited(admin), getFraud(admin),
    getOrders(admin), getMinisters(admin), getBudget(admin), getBills(admin),
    getIndicators(admin), getAppointments(admin), getJudgments(admin), getGovernors(admin),
    getEntryHistory(admin),
  ])
  return { promises, inherited, fraud, orders, ministers, budget, bills, indicators, appointments, judgments, governors, history }
}
