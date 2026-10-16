import { Router, json, raw } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

// Donate flow: the client uses Paystack's Inline popup (no redirect), then
// posts the resulting reference here for verification. The webhook is the
// authoritative record, since it fires even if the browser tab closes right
// after payment, while /verify just gives the visitor an immediate "thank
// you". Both write through the same upsert, keyed on Paystack's `reference`,
// so whichever lands first wins and the other is a no-op.
const PAYSTACK_API = 'https://api.paystack.co'
const MIN_AMOUNT_KOBO = 10000 // ₦100

// Read at request time, not import time, so a rotated key only needs a restart.
const secretKey = () => process.env.PAYSTACK_SECRET_KEY || ''
const publicKey = () => process.env.PAYSTACK_PUBLIC_KEY || ''
const monthlyPlanCode = () => process.env.PAYSTACK_MONTHLY_PLAN_CODE || ''

async function paystackFetch(path, options = {}) {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body) throw new Error(body?.message || `Paystack API error (${res.status})`)
  return body
}

// Insert on first sight of a reference, update on later ones (verify then
// webhook, or Paystack retrying the webhook). Never regresses a success row.
async function upsertDonation(fields) {
  const [existing] = await db.select().from(t.donations).where(eq(t.donations.reference, fields.reference)).limit(1)
  const now = new Date().toISOString()
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
      createdAt:            now,
      verifiedAt:           fields.status === 'success' ? now : null,
    })
    return
  }
  if (existing.status === 'success') return
  await db.update(t.donations).set({
    status:               fields.status,
    channel:              fields.channel ?? existing.channel,
    planCode:             fields.planCode ?? existing.planCode,
    paystackCustomerCode: fields.paystackCustomerCode ?? existing.paystackCustomerCode,
    subscriptionCode:     fields.subscriptionCode ?? existing.subscriptionCode,
    verifiedAt:           fields.status === 'success' ? now : existing.verifiedAt,
  }).where(eq(t.donations.reference, fields.reference))
}

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
    subscriptionCode:     data.subscription_code || null,
  }
}

export function createPaystackRouter() {
  const router = Router()

  router.get('/config', (_req, res) => {
    res.set('Cache-Control', 'no-store')
    const ready = Boolean(secretKey() && publicKey())
    res.json({
      enabled: ready,
      publicKey: publicKey() || null,
      monthlyEnabled: ready && Boolean(monthlyPlanCode()),
      monthlyPlanCode: monthlyPlanCode() || null,
    })
  })

  const verifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { error: 'Too many verification attempts. Please try again shortly.' },
  })

  router.post('/verify', verifyLimiter, json({ limit: '4kb' }), async (req, res) => {
    if (!secretKey()) return res.status(503).json({ error: 'Donations are not configured yet.' })
    const reference = typeof req.body?.reference === 'string' ? req.body.reference.trim() : ''
    if (!reference || reference.length > 200) return res.status(400).json({ error: 'Missing or invalid reference.' })

    let body
    try {
      body = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`)
    } catch (e) {
      return res.status(502).json({ error: e.message })
    }

    const data = body.data
    if (!data || data.amount < MIN_AMOUNT_KOBO) return res.status(400).json({ error: 'Could not verify this transaction.' })

    await upsertDonation(fieldsFromPaystackData(data))
    res.json({ ok: true, status: data.status === 'success' ? 'success' : 'failed' })
  })

  // Signature checking needs the raw body, so this route uses express.raw()
  // instead of the JSON parser. Once the signature passes it must answer 200
  // quickly: Paystack retries on anything else.
  router.post('/webhook', raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
    if (!secretKey()) return res.status(503).end()
    const signature = req.get('x-paystack-signature') || ''
    const expected = crypto.createHmac('sha512', secretKey()).update(req.body).digest('hex')
    const sigBuf = Buffer.from(signature, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return res.status(401).end()

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
      }
    }
    res.status(200).end()
  })

  return router
}
