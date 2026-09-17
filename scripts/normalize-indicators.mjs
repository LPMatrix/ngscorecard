// Normalizes the free-text `indicators` entries already sitting in
// data/seed/*.json against the canonical registry (data/seed/indicators.json),
// without changing what they mean. Three things move:
//   1. `registryKey` gets set where an entry's (id, label) pair is a
//      confident match for a registry concept — see MAPPINGS below.
//   2. `unit` spelling gets unified ('₦ bn' / 'N bn' -> '₦bn'; a missing
//      leading space on a word unit gets added) — never a unit *change*
//      (e.g. million vs thousand stays as printed; the audit script flags
//      that mismatch for a human to reconcile against the real values).
//   3. `higherIsBetter` gets filled from the registry only when the entry
//      doesn't already say one way or the other.
//   4. Each point's free-text `label` gets a parsed `year`/`period` where a
//      pattern matches; unparseable labels are left alone and listed.
//
// `id`, `label`, and every point `label` are never rewritten — this is
// meant to be safe to re-run and safe to review before trusting.
//
// Usage:
//   node --env-file=.env scripts/normalize-indicators.mjs           # dry run, prints a report
//   node --env-file=.env scripts/normalize-indicators.mjs --apply   # writes the JSON files

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedDir = path.join(__dirname, '../data/seed')
const apply = process.argv.includes('--apply')

const registry = JSON.parse(readFileSync(path.join(seedDir, 'indicators.json'), 'utf-8'))
const registryByKey = new Map(registry.map(r => [r.key, r]))

// (id, label) -> { registryKey, basis? }. Keyed by id alone when every label
// under that id means the same registry concept; keyed by "id|label" when
// the id is overloaded with genuinely different concepts (debt, gdp).
const MAPPINGS = new Map([
  ['igr', { registryKey: 'igr' }],
  ['budget', { registryKey: 'budget' }],
  ['inflation', { registryKey: 'inflation' }],
  ['naira', { registryKey: 'fx-official' }],
  ['fuel', { registryKey: 'petrol-price' }],
  ['unemployment', { registryKey: 'unemployment' }],
  ['capital-share', { registryKey: 'capex-share' }],
  ['outofschool', { registryKey: 'out-of-school' }],

  ['debt|State Debt Profile', { registryKey: 'debt' }],
  ['debt|Total Public Debt', { registryKey: 'debt' }],
  ['debt|State Debt Stock', { registryKey: 'debt' }],
  ['debt|Domestic Debt Stock', { registryKey: 'debt', basis: 'domestic' }],
  ['debt|State Domestic Debt', { registryKey: 'debt', basis: 'domestic' }],
  // 'debt|Commercial Bank Debt' and 'debt|External Debt Stock' are
  // deliberately NOT mapped — narrower concepts than total public debt;
  // remapping them would misrepresent what the figure covers.

  ['gdp|GDP Growth Rate', { registryKey: 'gdp-growth' }],
  // 'gdp|State GDP' is an absolute level (₦bn), not a growth rate (%) —
  // a different registry concept; left unmapped.
])

// Ids/labels seen but never mapped, for reference in the report — anything
// not listed here that shows up unmapped is a genuinely new one to review.
const KNOWN_UNMAPPED = new Set([
  'infant_mortality', // needs its source re-read before it can become under5-mortality (a different denominator)
  'igr-monthly', 'debt-service', 'debt-service-ratio', 'debt-cleared', 'economy', 'capex',
  'education', 'education-share', 'electric-buses', 'gratuity', 'health', 'health-share',
  'infrastructure', 'minimum-wage', 'mining-licences', 'rail', 'revenue-share',
  'rice-capacity', 'roads', 'security', 'allocation-dependence',
  'debt|Commercial Bank Debt', 'debt|External Debt Stock', 'gdp|State GDP',
])

function mappingFor(id, label) {
  return MAPPINGS.get(`${id}|${label}`) ?? MAPPINGS.get(id) ?? null
}

// Unit spelling only — never a unit change. Word units (no leading digit or
// currency/percent symbol) get the project's existing leading-space
// convention if they're missing it.
function normalizeUnit(unit) {
  if (unit === '₦ bn' || unit === 'N bn') return '₦bn'
  if (/^[a-zA-Z]/.test(unit) && !unit.startsWith(' ')) return ' ' + unit
  return unit
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTH_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Parses a free-text point label into { year, period } or null if no rule
// matches. First match wins; never touches the label string itself.
function parseLabel(label) {
  let m

  if ((m = /^(\d{4})$/.exec(label))) return { year: +m[1], period: null }

  if ((m = /^(\d{4})\*$/.exec(label))) return { year: +m[1], period: null, note: 'provisional' }

  if ((m = /^([A-Za-z]{3})[a-z]*\s*'?(\d{2}|\d{4})$/.exec(label))) {
    const mi = MONTHS.indexOf(m[1].toLowerCase())
    if (mi >= 0) {
      const year = m[2].length === 2 ? 2000 + (+m[2]) : +m[2]
      return { year, period: MONTH_NAME[mi] }
    }
  }

  if ((m = /^(Q[1-4]|H[12])\s*'?(\d{2}|\d{4})$/.exec(label))) {
    const year = m[2].length === 2 ? 2000 + (+m[2]) : +m[2]
    return { year, period: m[1] }
  }

  if ((m = /^(\d{4})\s+Budget$/.exec(label))) return { year: +m[1], period: null }

  if ((m = /^FY(\d{4})$/.exec(label))) return { year: +m[1], period: null }

  return null
}

const files = readdirSync(seedDir).filter(f =>
  f.endsWith('.json') && f !== 'presidents.json' && f !== 'themes.json' && f !== 'indicators.json'
)

const report = {
  admins: 0, indicators: 0, points: 0,
  registryKeySet: 0, unitFixed: 0, higherIsBetterFilled: 0,
  pointsParsed: 0, pointsUnparsed: [],
  unmappedSeen: new Map(), // "id|label" -> count, excluding KNOWN_UNMAPPED
}

for (const file of files) {
  const admin = file.replace('.json', '')
  const full = path.join(seedDir, file)
  const data = JSON.parse(readFileSync(full, 'utf-8'))
  if (!data.indicators?.length) continue

  report.admins++
  let changed = false

  for (const ind of data.indicators) {
    report.indicators++
    const mapping = mappingFor(ind.id, ind.label)

    if (mapping && !ind.registryKey) {
      ind.registryKey = mapping.registryKey
      if (mapping.basis) ind.basis = mapping.basis
      report.registryKeySet++
      changed = true
    } else if (!mapping) {
      const sig = `${ind.id}|${ind.label}`
      if (!KNOWN_UNMAPPED.has(ind.id) && !KNOWN_UNMAPPED.has(sig)) {
        report.unmappedSeen.set(sig, (report.unmappedSeen.get(sig) ?? 0) + 1)
      }
    }

    const newUnit = normalizeUnit(ind.unit)
    if (newUnit !== ind.unit) {
      ind.unit = newUnit
      report.unitFixed++
      changed = true
    }

    if (ind.higherIsBetter === undefined || ind.higherIsBetter === null) {
      const reg = registryByKey.get(ind.registryKey)
      if (reg && reg.higherIsBetter !== null && reg.higherIsBetter !== undefined) {
        ind.higherIsBetter = reg.higherIsBetter
        report.higherIsBetterFilled++
        changed = true
      }
    }

    for (const pt of (ind.points || [])) {
      report.points++
      if (pt.year != null) continue // already parsed in an earlier run
      const parsed = parseLabel(pt.label)
      if (parsed) {
        pt.year = parsed.year
        if (parsed.period) pt.period = parsed.period
        if (parsed.note) pt.note = parsed.note
        report.pointsParsed++
        changed = true
      } else {
        report.pointsUnparsed.push(`${admin}/${ind.id}: "${pt.label}"`)
      }
    }
  }

  if (apply && changed) {
    writeFileSync(full, JSON.stringify(data, null, 2) + '\n')
  }
}

console.log(`${apply ? 'Applied' : 'Dry run (pass --apply to write)'}`)
console.log(`Admins with indicators: ${report.admins}`)
console.log(`Indicators: ${report.indicators} | Points: ${report.points}`)
console.log(`registryKey set: ${report.registryKeySet}`)
console.log(`unit spelling fixed: ${report.unitFixed}`)
console.log(`higherIsBetter filled from registry: ${report.higherIsBetterFilled}`)
console.log(`point labels parsed to year/period: ${report.pointsParsed}`)
console.log(`point labels NOT parsed (${report.pointsUnparsed.length}):`)
for (const l of report.pointsUnparsed) console.log('  -', l)
console.log(`\nUnmapped (id|label) pairs not already known (${report.unmappedSeen.size}):`)
for (const [sig, n] of [...report.unmappedSeen.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}x  ${sig}`)
}
