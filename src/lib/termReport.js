// Term report card — the pure derivation behind /<admin>/report and its
// share image (server/ogReport.js). Both call this with the same arrays the
// scorecard tabs already load, so the page, the image and the tabs can never
// disagree, and there's no new editorial field to keep up to date.
//
// Same rule as src/lib/scorecardImage.js: a real fact or nothing. Fraud
// `amount` is free text in mixed currencies ("₦2 billion+ (estimated)",
// "$2.1 billion", "Undisclosed") and can't honestly be summed, so exposure is
// reported as case counts by outcome, never a total. Sections with no rows
// come back null so the UI omits them instead of showing a false zero.

import { promiseTally } from './scorecardImage.js'

const HIGHLIGHT_LIMIT = 3

// Up to `limit` promises with `status`, in editorial (id) order, taking one
// per policy area first so the list spans the term instead of clustering in
// one category, then topping up from the rest.
export function pickHighlights(promises, status, limit = HIGHLIGHT_LIMIT) {
  const matches = (promises || [])
    .filter((p) => p.status === status)
    .slice()
    .sort((a, b) => a.id - b.id)
  const seen = new Set()
  const firstPerCategory = []
  const rest = []
  for (const p of matches) {
    if (seen.has(p.category)) rest.push(p)
    else { seen.add(p.category); firstPerCategory.push(p) }
  }
  return [...firstPerCategory, ...rest]
    .slice(0, limit)
    .map((p) => ({ id: p.id, title: p.title, category: p.category }))
}

const FRAUD_OUTCOMES = ['convicted', 'ongoing', 'dismissed', 'acquitted']

function fraudExposure(fraud) {
  if (!fraud?.length) return null
  const out = { total: fraud.length, convicted: 0, ongoing: 0, dismissed: 0, acquitted: 0, other: 0 }
  for (const f of fraud) {
    if (FRAUD_OUTCOMES.includes(f.status)) out[f.status]++
    else out.other++
  }
  return out
}

// Average `implementationPct` across the budget cycles that actually report
// one; cycles without a figure count toward `cycles` but not the average.
function budgetDelivery(budget) {
  if (!budget?.length) return null
  const rated = budget.filter((b) => typeof b.implementationPct === 'number')
  return {
    cycles: budget.length,
    ratedCycles: rated.length,
    avgImplementation: rated.length
      ? Math.round(rated.reduce((s, b) => s + b.implementationPct, 0) / rated.length)
      : null,
  }
}

export function buildTermReport({ admin, promises, fraud, budget }) {
  const tally = promiseTally(promises)
  const pct = (n) => (tally.total ? Math.round((n / tally.total) * 100) : null)
  return {
    ...tally,
    keptPct: pct(tally.kept),
    // A term that hasn't ended is still moving: pending promises can resolve
    // either way, so the page says so instead of presenting a final verdict.
    sitting: admin?.termEnd == null,
    wins: pickHighlights(promises, 'kept'),
    failures: pickHighlights(promises, 'broken'),
    fraud: fraudExposure(fraud),
    budget: budgetDelivery(budget),
  }
}
