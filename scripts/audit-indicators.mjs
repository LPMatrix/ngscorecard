// Coverage and quality audit for the `indicators` feature across every
// administration in data/seed/*.json, against the canonical registry
// (data/seed/indicators.json). Read-only — writes nothing but the report.
//
// Usage:
//   node --env-file=.env scripts/audit-indicators.mjs [--out docs/indicators-coverage.md]
// With no --out, prints to stdout.

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedDir = path.join(__dirname, '../data/seed')
const outArg = process.argv.find(a => a.startsWith('--out'))
const outPath = outArg ? (outArg.includes('=') ? outArg.split('=')[1] : process.argv[process.argv.indexOf(outArg) + 1]) : null

const registry = JSON.parse(readFileSync(path.join(seedDir, 'indicators.json'), 'utf-8'))
const registryByKey = new Map(registry.map(r => [r.key, r]))
const federalCore = registry.filter(r => r.level === 'federal' && r.tier === 'core').map(r => r.key)
const stateCore = registry.filter(r => r.level === 'state' && r.tier === 'core').map(r => r.key)
const stateExtended = registry.filter(r => r.level === 'state' && r.tier === 'extended').map(r => r.key)

const presidents = JSON.parse(readFileSync(path.join(seedDir, 'presidents.json'), 'utf-8'))
const byKey = new Map(presidents.map(p => [p.key, p]))

function era(admin) {
  if (admin.level !== 'state') return (+admin.termStart >= 1999) ? 'federal-1999+' : 'federal-pre1999'
  const start = +admin.termStart
  if (start < 1999) return 'state-pre1999'
  if (start < 2007) return 'state-1999-2007'
  if (start < 2023) return 'state-2007-2023'
  return 'state-current'
}

const files = readdirSync(seedDir).filter(f =>
  f.endsWith('.json') && f !== 'presidents.json' && f !== 'themes.json' && f !== 'indicators.json'
)

// era -> coreKey -> { published, notPublished, admins: Set }
const coverage = {}
const eraTotals = {}
const missingByKey = {} // coreKey -> [admin, ...]
const drift = { badUnit: [], noRegistryKey: [], missingHib: [], nullYearPoints: [], fewPoints: [], basisNoNote: [] }
const budgetCross = []

for (const file of files) {
  const admin = file.replace('.json', '')
  const meta = byKey.get(admin)
  if (!meta) continue
  const e = era(meta)
  eraTotals[e] = (eraTotals[e] ?? 0) + 1

  const data = JSON.parse(readFileSync(path.join(seedDir, file), 'utf-8'))
  const inds = data.indicators ?? []
  const coreKeys = meta.level === 'state' ? stateCore : federalCore
  const haveByCore = new Map(inds.filter(i => i.registryKey).map(i => [i.registryKey, i]))

  for (const key of coreKeys) {
    coverage[e] ??= {}
    coverage[e][key] ??= { published: 0, notPublished: 0 }
    const ind = haveByCore.get(key)
    if (ind && ind.status === 'not-published') coverage[e][key].notPublished++
    else if (ind) coverage[e][key].published++
    else {
      missingByKey[key] ??= []
      missingByKey[key].push(admin)
    }
  }

  for (const ind of inds) {
    const reg = ind.registryKey ? registryByKey.get(ind.registryKey) : null
    if (reg && ind.unit !== reg.unit) {
      drift.badUnit.push(`${admin}/${ind.id}: unit "${ind.unit}" vs registry "${reg.unit}" (${ind.registryKey})`)
    }
    if (!ind.registryKey) drift.noRegistryKey.push(`${admin}/${ind.id} (${ind.label})`)
    if (ind.higherIsBetter === undefined || ind.higherIsBetter === null) {
      drift.missingHib.push(`${admin}/${ind.id}`)
    }
    if (ind.status !== 'not-published') {
      const pts = ind.points ?? []
      if (pts.length < 2) drift.fewPoints.push(`${admin}/${ind.id}: ${pts.length} point(s)`)
      for (const p of pts) {
        if (p.year == null) drift.nullYearPoints.push(`${admin}/${ind.id}: "${p.label}"`)
      }
      const sorted = pts.filter(p => p.year != null).sort((a, b) => a.year - b.year)
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].basis && sorted[i].basis !== sorted[i - 1].basis && !sorted[i].note) {
          drift.basisNoNote.push(`${admin}/${ind.id}: basis changed to "${sorted[i].basis}" at ${sorted[i].label} with no note`)
        }
      }
    }
    if (ind.registryKey === 'budget') {
      const budgetTableTotal = (data.budget ?? []).find(b => String(b.year) === String(ind.points?.at(-1)?.year))?.totalBn
      const lastPoint = ind.points?.at(-1)?.value
      if (budgetTableTotal != null && lastPoint != null && Math.abs(budgetTableTotal - lastPoint) > 0.5) {
        budgetCross.push(`${admin}: indicator budget point ${lastPoint} vs budget table totalBn ${budgetTableTotal} for ${ind.points.at(-1).year}`)
      }
    }
  }
}

const lines = []
lines.push('# Indicator coverage audit')
lines.push('')
lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/audit-indicators.mjs\`. Read-only report — does not write to data/seed.`)
lines.push('')
lines.push('## Core-key coverage by era')
lines.push('')
const eraOrder = ['federal-pre1999', 'federal-1999+', 'state-pre1999', 'state-1999-2007', 'state-2007-2023', 'state-current']
for (const e of eraOrder) {
  if (!eraTotals[e]) continue
  lines.push(`### ${e} (${eraTotals[e]} administrations)`)
  lines.push('')
  lines.push('| Core indicator | Published | Not published | Missing entirely |')
  lines.push('|---|---|---|---|')
  const keys = e.startsWith('federal') ? federalCore : stateCore
  for (const key of keys) {
    const c = coverage[e]?.[key] ?? { published: 0, notPublished: 0 }
    const missing = eraTotals[e] - c.published - c.notPublished
    lines.push(`| ${key} | ${c.published} | ${c.notPublished} | ${missing} |`)
  }
  lines.push('')
}

lines.push('## Missing core indicators, by key')
lines.push('')
for (const key of [...federalCore, ...stateCore]) {
  const missing = missingByKey[key] ?? []
  if (!missing.length) continue
  lines.push(`- **${key}** (${missing.length} admin${missing.length === 1 ? '' : 's'}): ${missing.slice(0, 15).join(', ')}${missing.length > 15 ? ', …' : ''}`)
}
lines.push('')

lines.push('## Drift')
lines.push('')
lines.push(`- Unit mismatch vs registry: ${drift.badUnit.length}`)
for (const l of drift.badUnit) lines.push(`  - ${l}`)
lines.push(`- No registryKey (one-off or unmapped): ${drift.noRegistryKey.length}`)
lines.push(`- Missing higherIsBetter: ${drift.missingHib.length}`)
for (const l of drift.missingHib) lines.push(`  - ${l}`)
lines.push(`- Points with no parsed year: ${drift.nullYearPoints.length}`)
for (const l of drift.nullYearPoints) lines.push(`  - ${l}`)
lines.push(`- Fewer than 2 points (excluding not-published): ${drift.fewPoints.length}`)
for (const l of drift.fewPoints) lines.push(`  - ${l}`)
lines.push(`- Basis change with no note: ${drift.basisNoNote.length}`)
for (const l of drift.basisNoNote) lines.push(`  - ${l}`)
lines.push(`- Budget indicator vs budget table mismatch: ${budgetCross.length}`)
for (const l of budgetCross) lines.push(`  - ${l}`)
lines.push('')

const totalAdmins = files.length
const withAny = files.filter(f => {
  const d = JSON.parse(readFileSync(path.join(seedDir, f), 'utf-8'))
  return (d.indicators ?? []).length > 0
}).length

lines.push('## Execution debt')
lines.push('')
lines.push(`As of ${new Date().toISOString().slice(0, 10)}: ${withAny} of ${totalAdmins} administrations (${Math.round(100 * withAny / totalAdmins)}%) have at least one indicator. Registry, structured points, and an upserting seed are in place (server/seed.js, data/seed/indicators.json); the backfill itself (plan Step 9, Phases A-F) has not started. Core-key gaps above are the actual backlog, not memory of what "should" exist. Re-run this script after each backfill phase and update this line.`)
lines.push('')

const report = lines.join('\n')
if (outPath) {
  writeFileSync(path.join(__dirname, '..', outPath), report)
  console.log(`Wrote ${outPath}`)
} else {
  console.log(report)
}
