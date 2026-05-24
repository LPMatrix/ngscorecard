import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
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

// ── Clear all tables (order matters for FK integrity) ────────────────────────
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

// ── Seed helpers ─────────────────────────────────────────────────────────────

async function seedPresidents(rows) {
  for (const r of rows) {
    await db.insert(t.presidents).values({
      key: r.key, name: r.name, fullName: r.fullName,
      termStart: r.termStart, termEnd: r.termEnd ?? null,
      tagline: r.tagline, party: r.party ?? null, reviewed: r.reviewed,
    })
  }
}

async function seedPromises(rows, admin) {
  for (const r of rows) {
    await db.insert(t.promises).values({
      administration: admin, title: r.title, category: r.category,
      status: r.status, promise: r.promise, assessment: r.assessment,
      source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
    })
  }
}

async function seedInherited(rows, admin) {
  for (const r of rows) {
    await db.insert(t.inherited).values({
      administration: admin, title: r.title, category: r.category,
      status: r.status, problem: r.problem, resolution: r.resolution,
      source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
    })
  }
}

async function seedFraud(rows, admin) {
  for (const r of rows) {
    await db.insert(t.fraud).values({
      administration: admin, title: r.title, category: r.category,
      status: r.status, amount: r.amount ?? null, year: r.year ?? null,
      allegation: r.allegation, outcome: r.outcome,
      source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
    })
  }
}

async function seedOrders(rows, admin) {
  for (const r of rows) {
    await db.insert(t.orders).values({
      administration: admin, title: r.title, category: r.category,
      status: r.status, signed: r.signed ?? null,
      directive: r.directive, effect: r.effect,
      source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
    })
  }
}

async function seedMinisters(rows, admin) {
  for (const r of rows) {
    await db.insert(t.ministers).values({
      administration: admin, name: r.name, ministry: r.ministry,
      appointed: r.appointed ?? null, status: r.status, serving: r.serving ?? null,
      mandate: r.mandate, performance: r.performance,
      source: r.source ?? null, sourceLabel: r.sourceLabel ?? null, updated: r.updated ?? null,
    })
  }
}

async function seedBills(rows, admin) {
  for (const r of rows) {
    await db.insert(t.bills).values({
      administration: admin, title: r.title, category: r.category,
      status: r.status, chamber: r.chamber ?? null,
      introduced: r.introduced ?? null, signed: r.signed ?? null,
      summary: r.summary, outcome: r.outcome,
      source: r.source, sourceLabel: r.sourceLabel, updated: r.updated,
    })
  }
}

async function seedAppointments(rows, admin) {
  for (const r of rows) {
    await db.insert(t.appointments).values({
      administration: admin, name: r.name, role: r.role, agency: r.agency,
      category: r.category, state: r.state, geopolitical: r.geopolitical,
      appointed: r.appointed, status: r.status, note: r.note,
    })
  }
}

async function seedJudgments(rows, admin) {
  for (const r of rows) {
    await db.insert(t.judgments).values({
      administration: admin, title: r.title, court: r.court,
      category: r.category, status: r.status, compliance: r.compliance ?? null,
      ruled: r.ruled, issue: r.issue, outcome: r.outcome,
      source: r.source ?? null, sourceLabel: r.sourceLabel ?? null,
    })
  }
}

async function seedHistory(rows, admin) {
  for (const r of rows) {
    await db.insert(t.history).values({
      administration: admin, label: r.label,
      kept: r.kept, partial: r.partial, broken: r.broken, pending: r.pending,
    })
  }
}

async function seedBudget(rows, admin) {
  for (const r of rows) {
    await db.insert(t.budget).values({
      administration: admin, year: r.year, totalBn: r.totalBn,
      revenueBn: r.revenueBn, actualRevenueBn: r.actualRevenueBn ?? null,
      debtServiceBn: r.debtServiceBn, capitalBn: r.capitalBn,
      recurrentBn: r.recurrentBn, implementationPct: r.implementationPct ?? null,
      deficitBn: r.deficitBn, note: r.note ?? null,
      source: r.source, sourceLabel: r.sourceLabel,
    })
    for (const m of (r.ministries || [])) {
      await db.insert(t.budgetMinistries).values({
        budgetYear: r.year, administration: admin, name: m.name,
        allocationBn: m.allocationBn, releasedPct: m.releasedPct ?? null, note: m.note ?? null,
      })
    }
  }
}

async function seedGovernors(rows, admin) {
  for (const r of rows) {
    await db.insert(t.governors).values({
      administration: admin, name: r.name, state: r.state,
      party: r.party, geopolitical: r.geopolitical,
      termStart: r.termStart, termEnd: r.termEnd ?? null,
      status: r.status, note: r.note ?? null,
    })
  }
}

async function seedIndicators(rows, admin) {
  for (const r of rows) {
    const [{ id: indicatorId }] = await db.insert(t.indicators).values({
      administration: admin, key: r.id, label: r.label, unit: r.unit,
      color: r.color, description: r.description,
      source: r.source, sourceLabel: r.sourceLabel, note: r.note ?? null,
    }).returning({ id: t.indicators.id })

    for (const pt of (r.points || [])) {
      await db.insert(t.indicatorPoints).values({
        indicatorId, administration: admin, label: pt.label, value: pt.value,
      })
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

const ADMINISTRATIONS = [
  { key: 'tinubu',   prefix: '' },
  { key: 'buhari',   prefix: 'buhari-' },
  { key: 'jonathan', prefix: 'jonathan-' },
  { key: 'yaradua',  prefix: 'yaradua-' },
  { key: 'obasanjo', prefix: 'obasanjo-' },
]

await clearAll()

await seedPresidents(readJson('presidents.json'))

for (const { key, prefix } of ADMINISTRATIONS) {
  console.log(`Seeding ${key}…`)
  await seedPromises(    readJson(`${prefix}promises.json`),     key)
  await seedInherited(   readJson(`${prefix}inherited.json`),    key)
  await seedFraud(       readJson(`${prefix}fraud.json`),        key)
  await seedOrders(      readJson(`${prefix}orders.json`),       key)
  await seedMinisters(   readJson(`${prefix}ministers.json`),    key)
  await seedBills(       readJson(`${prefix}bills.json`),        key)
  await seedAppointments(readJson(`${prefix}appointments.json`), key)
  await seedJudgments(   readJson(`${prefix}judgments.json`),    key)
  await seedHistory(     readJson(`${prefix}history.json`),      key)
  await seedBudget(      readJson(`${prefix}budget.json`),       key)
  await seedIndicators(  readJson(`${prefix}indicators.json`),   key)
  await seedGovernors(   readJson(`${prefix}governors.json`),    key)
}

console.log('Done.')
