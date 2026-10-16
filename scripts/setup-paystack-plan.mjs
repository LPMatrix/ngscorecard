// One-time setup: creates the Paystack Plan that backs the "Monthly" donate
// option, using the account tied to PAYSTACK_SECRET_KEY (test or live). Safe
// to re-run: it looks for a plan already named MONTHLY_PLAN_NAME at the right
// amount before creating a new one, so it won't spawn duplicates.
//
// After it prints a plan_code, add it to .env as PAYSTACK_MONTHLY_PLAN_CODE.
// Until that's set, the "Monthly" option stays disabled on the Support page
// (see GET /api/donate/config). One-time donations work without this step.
//
// Run:  npm run paystack:setup-plan

import { MONTHLY_AMOUNT, MONTHLY_PLAN_NAME } from '../src/lib/donation.js'

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
if (!SECRET_KEY) {
  console.error('PAYSTACK_SECRET_KEY is not set. Add it to .env first (see .env.example).')
  process.exit(1)
}

const amountKobo = MONTHLY_AMOUNT * 100

async function paystack(path, options = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${SECRET_KEY}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new Error(body?.message || `Paystack API error (${res.status})`)
  return body
}

const existing = await paystack('/plan?perPage=100')
const match = existing.data.find(p => p.name === MONTHLY_PLAN_NAME && p.amount === amountKobo && p.interval === 'monthly')

if (match) {
  console.log(`Plan already exists: ${match.plan_code} (₦${MONTHLY_AMOUNT}/month, "${match.name}")`)
  console.log(`PAYSTACK_MONTHLY_PLAN_CODE=${match.plan_code}`)
  process.exit(0)
}

const created = await paystack('/plan', {
  method: 'POST',
  body: JSON.stringify({ name: MONTHLY_PLAN_NAME, amount: amountKobo, interval: 'monthly', currency: 'NGN' }),
})
console.log(`Created plan: ${created.data.plan_code} (₦${MONTHLY_AMOUNT}/month)`)
console.log(`PAYSTACK_MONTHLY_PLAN_CODE=${created.data.plan_code}`)
