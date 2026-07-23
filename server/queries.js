import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

export async function getPresidents() {
  const rows = await db.select().from(t.presidents)
  return rows.map(p => ({
    ...p,
    term: p.termEnd ? `${p.termStart}–${p.termEnd}` : `${p.termStart}–present`,
  }))
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

// Matches the shape App.vue's loadData() assembles client-side, so the same
// object can be dropped in as initial state for SSR or hydration.
export async function getAllDataForAdmin(admin) {
  const [
    promises, inherited, fraud, orders, ministers,
    budget, bills, indicators, appointments, judgments, governors,
  ] = await Promise.all([
    getPromises(admin), getInherited(admin), getFraud(admin),
    getOrders(admin), getMinisters(admin), getBudget(admin), getBills(admin),
    getIndicators(admin), getAppointments(admin), getJudgments(admin), getGovernors(admin),
  ])
  return { promises, inherited, fraud, orders, ministers, budget, bills, indicators, appointments, judgments, governors }
}
