import { Router, json, raw } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

// Donate flow: the client uses Paystack's Inline popup (no redirect), then
// posts the resulting reference here for verification. The webhook is the
// authoritative record — it fires even if the browser tab closes right after
// payment — while /verify just gives the visitor an immediate "thank you"
// without waiting on the webhook's own (usually sub-second, but unbounded)
// delivery. Both write through the same upsert, keyed on Paystack's
// `reference`, so whichever lands first wins and the other is a no-op.
const PAYSTACK_API = 'https://api.paystack.co'
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || ''
const MONTHLY_PLAN_CODE = process.env.PAYSTACK_MONTHLY_PLAN_CODE || ''

// Paystack's own minimum is currency-dependent and enforced on their side
// regardless; this just rejects obvious garbage before we spend an API call.
const MIN_AMOUNT_KOBO = 10000 // ₦100

async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) {
    const message = body?.message || `Paystack API error (${res.status})`
    throw new Error(message)
  }
  return body
}

// Insert on first sight of a reference, update on every subsequent one
// (verify then webhook, or webhook arriving twice — Paystack retries).
// Never regresses a 'success' row back to 'pending'.
async function upsertDonation(fields) {
  const [existing] = await db.select().from(t.donations).where(eq(t.donations.reference, fields.reference)).limit(1)
  if (!existing) {
    await db.insert(t.donations).values({
      reference:            fields.reference,
      email:                fields.email,
      amountKobo:           fields.amountKobo,
      currency:             fields.currency || 'NGN',
      frequency:            fields.frequency,
      status:               fields.status,
      channel:              fields.channel ?? null,
      planCode:             fields.planCode ?? null,
      paystackCustomerCode: fields.paystackCustomerCode ?? null,
      subscriptionCode:     fields.subscriptionCode ?? null,
      createdAt:            new Date().toISOString(),
      verifiedAt:           fields.status === 'success' ? new Date().toISOString() : null,
    })
    return
  }
  if (existing.status === 'success') return // already recorded; don't overwrite
  await db.update(t.donations).set({
    status:               fields.status,
    channel:              fields.channel ?? existing.channel,
    planCode:             fields.planCode ?? existing.planCode,
    paystackCustomerCode: fields.paystackCustomerCode ?? existing.paystackCustomerCode,
    subscriptionCode:     fields.subscriptionCode ?? existing.subscriptionCode,
    verifiedAt:           fields.status === 'success' ? new Date().toISOString() : existing.verifiedAt,
  }).where(eq(t.donations.reference, fields.reference))
}

// A Paystack transaction-verify response's `data` shape, reduced to what we store.
function fieldsFromPaystackData(data) {
  const frequency = data.metadata?.frequency === 'monthly' || data.plan ? 'monthly' : 'once'
  return {
    reference:            data.reference,
    email:                data.customer?.email || 'unknown',
    amountKobo:           data.amount,
    currency:             data.currency || 'NGN',
    frequency,
    status:               data.status === 'success' ? 'success' : 'failed',
    channel:              data.channel,
    planCode:             data.plan?.plan_code || data.plan_object?.plan_code || null,
    paystackCustomerCode: data.customer?.customer_code || null,
    subscriptionCode:     data.plan ? (data.subscription_code || null) : null,
  }
}

export function createPaystackRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    res.json({
      enabled: Boolean(SECRET_KEY && PUBLIC_KEY),
      publicKey: PUBLIC_KEY || null,
      monthlyEnabled: Boolean(SECRET_KEY && PUBLIC_KEY && MONTHLY_PLAN_CODE),
      monthlyPlanCode: MONTHLY_PLAN_CODE || null,
    })
  })

  const verifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20, // generous — a real donor may retry after a declined card
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { error: 'Too many verification attempts. Please try again shortly.' },
  })

  router.post('/verify', verifyLimiter, json({ limit: '4kb' }), async (req, res) => {
    if (!SECRET_KEY) return res.status(503).json({ error: 'Donations are not configured yet.' })
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim() : ''
    if (!reference || reference.length > 200) return res.status(400).json({ error: 'Missing or invalid reference.' })

    let body
    try {
      body = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`)
    } catch (e) {
      return res.status(502).json({ error: e.message })
    }

    const data = body.data
    if (!data || data.amount < MIN_AMOUNT_KOBO) {
      return res.status(400).json({ error: 'Could not verify this transaction.' })
    }

    await upsertDonation(fieldsFromPaystackData(data))
    res.json({ ok: true, status: data.status === 'success' ? 'success' : 'failed' })
  })

  // Paystack needs the raw body to check the signature, so this route is
  // mounted with express.raw() instead of the JSON parser every other route
  // uses. It must always answer 200 quickly once the signature checks out —
  // Paystack retries on anything else, including a slow response.
  router.post('/webhook', raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
    if (!SECRET_KEY) return res.status(503).end()
    const signature = req.get('x-paystack-signature') || ''
    const expected = crypto.createHmac('sha512', SECRET_KEY).update(req.body).digest('hex')
    const sigBuf = Buffer.from(signature, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).end()
    }

    let event
    try {
      event = JSON.parse(req.body.toString('utf-8'))
    } catch {
      return res.status(400).end()
    }

    if (event.event === 'charge.success' && event.data) {
      try {
        await upsertDonation(fieldsFromPaystackData(event.data))
      } catch (e) {
        console.error('Paystack webhook processing failed:', e)
        // Still 200: the payment is real regardless of our bookkeeping bug,
        // and returning an error just makes Paystack retry the same failure.
      }
    }

    res.status(200).end()
  })

  return router
}
