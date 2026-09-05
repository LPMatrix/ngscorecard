import { Router, json } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import crypto from 'node:crypto'
import { db } from './db.js'
import * as t from './schema.js'

// Public, unauthenticated endpoint for reader-submitted corrections and
// evidence. Nothing submitted here is ever published — it lands in a
// moderation queue (see the /admin "Corrections" table). Layered spam guards,
// no captcha (a third-party captcha would be a privacy and accessibility cost
// against PRINCIPLES.md):
//
//   1. rate limit per IP
//   2. honeypot field — a hidden input real users leave blank
//   3. submit-timing check — bots post instantly; humans don't
//   4. size + content-length caps
//
// Same-origin only: no CORS headers are sent, so a browser on another site
// can't POST here.
const KINDS = new Set(['error', 'outdated', 'missing_source', 'other'])
const MIN_FILL_MS = 2000
const BODY_MIN = 15
const BODY_MAX = 4000

const clip = (s, n) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, n) : null)

export function createCorrectionsRouter() {
  const router = Router()

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 4,                       // 4 submissions / 10 min / IP
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { error: 'Too many submissions from here. Please try again later, or email a correction instead.' },
  })

  router.post('/', limiter, json({ limit: '16kb' }), async (req, res) => {
    const b = req.body || {}

    // (2) honeypot — bots fill it; drop silently so they get no signal.
    if (typeof b.company === 'string' && b.company.trim() !== '') return res.json({ ok: true })

    // (3) timing — a crafted request with no/invalid `renderedAt` is dropped
    // silently; a real-but-fast submit is kept and flagged for the moderator
    // rather than lost.
    const renderedAt = Number(b.renderedAt)
    if (!Number.isFinite(renderedAt) || renderedAt > Date.now()) return res.json({ ok: true })
    const fast = Date.now() - renderedAt < MIN_FILL_MS

    // (4) content
    const body = typeof b.body === 'string' ? b.body.trim() : ''
    if (body.length < BODY_MIN || body.length > BODY_MAX) {
      return res.status(400).json({ error: `Please describe the problem in a sentence or two (${BODY_MIN}–${BODY_MAX} characters).` })
    }

    const ipHash = crypto.createHash('sha256')
      .update(String(req.ip) + (process.env.ADMIN_SESSION_SECRET || ''))
      .digest('hex').slice(0, 16)

    await db.insert(t.corrections).values({
      entryTable:     clip(b.entryTable, 40),
      entryId:        Number.isInteger(b.entryId) ? b.entryId : null,
      administration: clip(b.administration, 60),
      url:            clip(b.url, 300),
      kind:           KINDS.has(b.kind) ? b.kind : 'other',
      body,
      sourceUrl:      clip(b.sourceUrl, 500),
      email:          clip(b.email, 200),
      status:         'new',
      adminNote:      fast ? 'auto-flag: submitted very fast' : null,
      ipHash,
      createdAt:      new Date().toISOString(),
    })

    res.json({ ok: true })
  })

  return router
}
