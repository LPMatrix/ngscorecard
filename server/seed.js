import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pub = path.join(__dirname, '../data/seed')

function readJson(filename) {
  try {
    return JSON.parse(readFileSync(path.join(pub, filename), 'utf-8'))
  } catch {
    return []
  }
}

// Each administration's full record lives in one file (data/seed/{key}.json)
// with a key per category — see the CATEGORIES list in the Run section below.
function readAdminData(key) {
  try {
    return JSON.parse(readFileSync(path.join(pub, `${key}.json`), 'utf-8'))
  } catch {
    return {}
  }
}

// ── Clear all tables (order matters for FK integrity) ────────────────────────
// Only runs with --reset. Normal runs are additive — see seedByKey below.
async function clearAll() {
  console.log('Clearing tables…')
  await db.delete(t.indicatorPoints)
  await db.delete(t.indicators)
  await db.delete(t.budgetMinistries)
  await db.delete(t.budget)
  await db.delete(t.history)
  await db.delete(t.judgments)
  await db.delete(t.appointments)
  await db.delete(t.bills)
  await db.delete(t.ministers)
  await db.delete(t.orders)
  await db.delete(t.fraud)
  await db.delete(t.inherited)
  await db.delete(t.promises)
  await db.delete(t.governors)
  await db.delete(t.presidents)
}

// ── Diff-based insert: skips rows that already exist for this administration,
// keyed by keyFn (applied to both existing DB rows and freshly mapped rows).
// Never updates or deletes — editing an already-seeded row's JSON has no
// effect until it's removed from the DB (or a --reset is run).
async function seedByKey(table, admin, rows, keyFn, mapFn) {
  const existing = await db.select().from(table).where(eq(table.administration, admin))
  const seen = new Set(existing.map(keyFn))
  let added = 0
  for (const r of rows) {
    const row = mapFn(r)
    const key = keyFn(row)
    if (seen.has(key)) continue
    await db.insert(table).values(row)
    seen.add(key)
    added++
  }
  return added
}

// ── Seed helpers ─────────────────────────────────────────────────────────────

async function seedPresidents(rows) {
  const existing = await db.select().from(t.presidents)
  const seen = new Set(existing.map(r => r.key))
  let added = 0
  for (const r of rows) {
    const values = {
      key: r.key, name: r.name, fullName: r.fullName,
      termStart: r.termStart, termEnd: r.termEnd ?? null,
      tagline: r.tagline, party: r.party ?? null, reviewed: r.reviewed,
      level: r.level ?? 'federal', state: r.state ?? null,
    }
    if (seen.has(r.key)) {
      await db.update(t.presidents).set(values).where(eq(t.presidents.key, r.key))
      continue
    }
    await db.insert(t.presidents).values(values)
    seen.add(r.key)
    added++
  }
  return added
}

function seedPromises(rows, admin) {
  return seedByKey(t.promises, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, category: r.category,
    status: r.status, promise: r.promise, assessment: r.assessment,
    source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
  }))
}

function seedInherited(rows, admin) {
  return seedByKey(t.inherited, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, category: r.category,
    status: r.status, problem: r.problem, resolution: r.resolution,
    source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
  }))
}

function seedFraud(rows, admin) {
  return seedByKey(t.fraud, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, category: r.category,
    status: r.status, amount: r.amount ?? null, year: r.year ?? null,
    allegation: r.allegation, outcome: r.outcome,
    responseVerdict: r.responseVerdict ?? null, govtResponse: r.govtResponse ?? null,
    source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
  }))
}

function seedOrders(rows, admin) {
  return seedByKey(t.orders, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, category: r.category,
    status: r.status, signed: r.signed ?? null,
    directive: r.directive, effect: r.effect,
    source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
  }))
}

function seedMinisters(rows, admin) {
  return seedByKey(t.ministers, admin, rows, r => `${r.name}|${r.ministry}`, r => ({
    administration: admin, name: r.name, ministry: r.ministry,
    appointed: r.appointed ?? null, status: r.status, serving: r.serving ?? null,
    mandate: r.mandate, performance: r.performance,
    source: r.source ?? null, sourceLabel: r.sourceLabel ?? null, updated: r.updated ?? null,
  }))
}

function seedBills(rows, admin) {
  return seedByKey(t.bills, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, category: r.category,
    status: r.status, chamber: r.chamber ?? null,
    introduced: r.introduced ?? null, signed: r.signed ?? null,
    summary: r.summary, outcome: r.outcome,
    source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
  }))
}

function seedAppointments(rows, admin) {
  return seedByKey(t.appointments, admin, rows, r => `${r.name}|${r.role}`, r => ({
    administration: admin, name: r.name, role: r.role, agency: r.agency,
    category: r.category, state: r.state, geopolitical: r.geopolitical,
    appointed: r.appointed, status: r.status, note: r.note,
  }))
}

function seedJudgments(rows, admin) {
  return seedByKey(t.judgments, admin, rows, r => r.title, r => ({
    administration: admin, title: r.title, court: r.court,
    category: r.category, status: r.status, compliance: r.compliance ?? null,
    ruled: r.ruled, issue: r.issue, outcome: r.outcome,
    source: r.source ?? null, sourceLabel: r.sourceLabel ?? null,
  }))
}

async function seedBudget(rows, admin) {
  const added = await seedByKey(t.budget, admin, rows, r => String(r.year), r => ({
    administration: admin, year: r.year, totalBn: r.totalBn,
    revenueBn: r.revenueBn, actualRevenueBn: r.actualRevenueBn ?? null,
    debtServiceBn: r.debtServiceBn, capitalBn: r.capitalBn,
    recurrentBn: r.recurrentBn, implementationPct: r.implementationPct ?? null,
    deficitBn: r.deficitBn, note: r.note ?? null,
    source: r.source, sourceLabel: r.sourceLabel,
  }))

  const allMinistries = rows.flatMap(r => (r.ministries || []).map(m => ({ ...m, budgetYear: r.year })))
  const addedMinistries = await seedByKey(t.budgetMinistries, admin, allMinistries, m => `${String(m.budgetYear)}|${m.name}`, m => ({
    budgetYear: m.budgetYear, administration: admin, name: m.name,
    allocationBn: m.allocationBn, releasedPct: m.releasedPct ?? null, note: m.note ?? null,
  }))

  return added + addedMinistries
}

function seedGovernors(rows, admin) {
  return seedByKey(t.governors, admin, rows, r => `${r.name}|${r.termStart}`, r => ({
    administration: admin, name: r.name, state: r.state,
    party: r.party, geopolitical: r.geopolitical,
    termStart: r.termStart, termEnd: r.termEnd ?? null,
    status: r.status, note: r.note ?? null,
  }))
}

async function seedIndicators(rows, admin) {
  const existingIndicators = await db.select().from(t.indicators).where(eq(t.indicators.administration, admin))
  const byKey = new Map(existingIndicators.map(r => [r.key, r]))
  let added = 0

  for (const r of rows) {
    let indicatorId = byKey.get(r.id)?.id
    if (!indicatorId) {
      const [{ id }] = await db.insert(t.indicators).values({
        administration: admin, key: r.id, label: r.label, unit: r.unit,
        color: r.color, description: r.description,
        source: r.source, sourceLabel: r.sourceLabel, note: r.note ?? null,
        higherIsBetter: r.higherIsBetter ?? false,
      }).returning({ id: t.indicators.id })
      indicatorId = id
      added++
    }

    const existingPoints = await db.select().from(t.indicatorPoints).where(eq(t.indicatorPoints.indicatorId, indicatorId))
    const seenLabels = new Set(existingPoints.map(p => p.label))
    for (const pt of (r.points || [])) {
      if (seenLabels.has(pt.label)) continue
      await db.insert(t.indicatorPoints).values({ indicatorId, administration: admin, label: pt.label, value: pt.value })
      seenLabels.add(pt.label)
      added++
    }
  }

  return added
}

// ── Run ──────────────────────────────────────────────────────────────────────

if (process.argv.includes('--reset')) {
  await clearAll()
}

const administrations = readJson('presidents.json')

await seedPresidents(administrations)

for (const admin of administrations) {
  const key = admin.key
  const data = readAdminData(key)
  const counts = {
    promises:     await seedPromises(    data.promises ?? [],     key),
    inherited:    await seedInherited(   data.inherited ?? [],    key),
    fraud:        await seedFraud(       data.fraud ?? [],        key),
    orders:       await seedOrders(      data.orders ?? [],       key),
    ministers:    await seedMinisters(   data.ministers ?? [],    key),
    bills:        await seedBills(       data.bills ?? [],        key),
    appointments: await seedAppointments(data.appointments ?? [], key),
    judgments:    await seedJudgments(   data.judgments ?? [],    key),
    budget:       await seedBudget(      data.budget ?? [],       key),
    indicators:   await seedIndicators(  data.indicators ?? [],   key),
    governors:    await seedGovernors(   data.governors ?? [],    key),
  }
  const added = Object.entries(counts).filter(([, n]) => n > 0).map(([k, n]) => `${k} +${n}`).join(', ')
  console.log(`Seeding ${key}… ${added || 'nothing new'}`)
}

console.log('Done.')
