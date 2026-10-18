import { Router, json, urlencoded } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db as defaultDb } from './db.js'
import * as t from './schema.js'
import { mailer as defaultMailer, MailerNotConfigured } from './mailer.js'

// Newsletter signup with double opt-in. Nobody is ever mailed an issue until
// they click the link in a confirmation email, and every response to the signup
// form is the same whether or not the address was already on the list, so the
// form cannot be used to find out who subscribes.
//
//   POST /api/newsletter/subscribe       { email, company, renderedAt, source }
//   GET  /api/newsletter/confirm/:token  confirms (the link in the email)
//   GET  /api/newsletter/unsubscribe/:token  a page with one button
//   POST /api/newsletter/unsubscribe/:token  unsubscribes (the button, and mail
//                                        clients' one-click List-Unsubscribe)
//
// Spam guards match the corrections form: a rate limit per IP, a hidden
// honeypot field, a submit-timing check, and size caps. A confirmation email is
// also sent at most once every RESEND_AFTER_MS to the same address, so the form
// cannot be used to flood someone's inbox.
const EMAIL_MAX = 254
const SOURCE_MAX = 60
const MIN_FILL_MS = 1500
const RESEND_AFTER_MS = 10 * 60 * 1000
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/
const EMAIL_RE = /^[^\s@<>"',;:()[\]\\]+@[^\s@<>"',;:()[\]\\]+\.[^\s@<>"',;:()[\]\\]{2,}$/

// Vercel overwrites x-vercel-forwarded-for with the real client address; with
// req.ip alone every visitor behind its proxy would share one counter. Elsewhere
// fall back to req.ip (same approach as the Ask endpoint).
const callerKey = (req) => {
  const v = req.headers['x-vercel-forwarded-for']
  const ip = (Array.isArray(v) ? v[0] : v)?.split(',')[0].trim()
  return ipKeyGenerator(ip || req.ip || '')
}

export const normaliseEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '')
export const isValidEmail = (e) => e.length <= EMAIL_MAX && EMAIL_RE.test(e) && !e.includes('..')

const newToken = () => crypto.randomBytes(24).toString('base64url')
const clip = (s, n) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, n) : null)

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Where the links in an email point. Never taken from the request's Host header
// in production, which would let anyone make us mail a link to their own site.
export function siteUrl(req, env = process.env) {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/+$/, '')
  if (env.NODE_ENV === 'production') return 'https://ngscorecard.com'
  return `${req.protocol}://${req.get('host')}`
}

export function confirmationEmail({ confirmUrl, unsubscribeUrl }) {
  const subject = 'Confirm your NGScorecard subscription'
  const text = [
    'Someone, hopefully you, asked to get the NGScorecard newsletter at this address.',
    '',
    'To start receiving it, confirm here:',
    confirmUrl,
    '',
    "If that wasn't you, do nothing. You won't be subscribed and we won't email you again.",
    '',
    `Already confirmed and want out later? ${unsubscribeUrl}`,
    '',
    'NGScorecard, an independent tracker of Nigerian government promises.',
  ].join('\n')
  const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1b2720;line-height:1.6">
<p>Someone, hopefully you, asked to get the NGScorecard newsletter at this address.</p>
<p><a href="${esc(confirmUrl)}" style="display:inline-block;background:#006b45;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Confirm my subscription</a></p>
<p style="font-size:14px;color:#5f6f66">If that wasn't you, do nothing. You won't be subscribed and we won't email you again.</p>
<p style="font-size:13px;color:#7f8c84">Button not working? Paste this into your browser:<br>${esc(confirmUrl)}</p>
<p style="font-size:13px;color:#7f8c84">NGScorecard, an independent tracker of Nigerian government promises. <a href="${esc(unsubscribeUrl)}" style="color:#7f8c84">Unsubscribe</a></p>
</div>`
  return { subject, text, html }
}

// The pages behind the email links. Self-contained HTML (no app bundle), marked
// noindex and no-referrer because the token is in the address.
function page(res, status, { title, heading, body, button }) {
  res.status(status)
    .set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    })
    .send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} | NGScorecard</title>
<style>body{margin:0;background:#fffef9;color:#1b2720;font:17px/1.6 Georgia,serif}main{max-width:520px;margin:12vh auto;padding:0 20px}
h1{font-size:26px;color:#075236;margin:0 0 12px}p{margin:0 0 16px}a{color:#006b45}
button{font:inherit;font-weight:bold;background:#006b45;color:#fff;border:0;border-radius:6px;padding:10px 18px;cursor:pointer}</style></head>
<body><main><h1>${esc(heading)}</h1><p>${body}</p>${button ?? ''}<p><a href="/">Back to NGScorecard</a></p></main></body></html>`)
}

export function createNewsletterRouter({ db = defaultDb, mailer = defaultMailer, now = () => Date.now() } = {}) {
  const router = Router()

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,                       // 5 signups / 10 min / IP
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: callerKey,
    validate: { xForwardedForHeader: false, trustProxy: false },
    message: { error: 'Too many attempts from here. Please try again in a few minutes.' },
  })

  const ready = () => db._newsletterReady ?? Promise.resolve()
  const byToken = async (token) => (await db.select().from(t.subscribers).where(eq(t.subscribers.token, token)).limit(1))[0]

  router.post('/subscribe', limiter, json({ limit: '4kb' }), async (req, res) => {
    const b = req.body || {}

    // honeypot: bots fill it; answer as if it worked so they learn nothing
    if (typeof b.company === 'string' && b.company.trim() !== '') return res.json({ ok: true })

    const renderedAt = Number(b.renderedAt)
    if (!Number.isFinite(renderedAt) || renderedAt > now() || now() - renderedAt < MIN_FILL_MS) {
      return res.status(400).json({ error: 'That was quick. Please try again.' })
    }

    const email = normaliseEmail(b.email)
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })

    await ready()
    const base = siteUrl(req)
    const stamp = new Date(now()).toISOString()
    let row = (await db.select().from(t.subscribers).where(eq(t.subscribers.email, email)).limit(1))[0]

    let send = false
    if (!row) {
      const token = newToken()
      await db.insert(t.subscribers).values({
        email, token, status: 'pending', source: clip(b.source, SOURCE_MAX), createdAt: stamp,
      })
      row = { email, token }
      send = true
    } else if (row.status === 'unsubscribed') {
      // asking again is a fresh, explicit request: new token, back to pending
      const token = newToken()
      await db.update(t.subscribers)
        .set({ status: 'pending', token, unsubscribedAt: null, confirmationSentAt: null })
        .where(eq(t.subscribers.id, row.id))
      row = { ...row, token }
      send = true
    } else if (row.status === 'pending') {
      const last = row.confirmationSentAt ? Date.parse(row.confirmationSentAt) : 0
      send = now() - last >= RESEND_AFTER_MS
    }
    // 'confirmed': nothing to send, and nothing to reveal

    if (send) {
      try {
        const result = await mailer.send({
          to: email,
          ...confirmationEmail({
            confirmUrl: `${base}/api/newsletter/confirm/${row.token}`,
            unsubscribeUrl: `${base}/api/newsletter/unsubscribe/${row.token}`,
          }),
        })
        // A message the mailer only printed (no API key in development) was not
        // sent, so it must not start the resend cooldown.
        if (!result?.skipped) {
          await db.update(t.subscribers).set({ confirmationSentAt: stamp }).where(eq(t.subscribers.email, email))
        }
      } catch (e) {
        console.error('newsletter confirmation email failed:', e.message)
        const unavailable = e instanceof MailerNotConfigured
        return res.status(503).json({ error: unavailable
          ? 'Newsletter signup is not available yet. Please check back soon.'
          : 'We could not send the confirmation email. Please try again later.' })
      }
    }
    res.json({ ok: true })
  })

  router.get('/confirm/:token', async (req, res) => {
    const { token } = req.params
    const bad = () => page(res, 404, {
      title: 'Link not valid', heading: 'This link is not valid',
      body: 'It may have expired or been replaced by a newer one. You can sign up again from the site and we will send a fresh link.',
    })
    if (!TOKEN_RE.test(token)) return bad()
    await ready()
    const row = await byToken(token)
    if (!row) return bad()
    if (row.status === 'unsubscribed') {
      return page(res, 200, {
        title: 'Unsubscribed', heading: 'You are unsubscribed',
        body: 'This address opted out, so it was not re-subscribed. If you want back in, sign up again from the site.',
      })
    }
    if (row.status === 'pending') {
      await db.update(t.subscribers).set({ status: 'confirmed', confirmedAt: new Date(now()).toISOString() }).where(eq(t.subscribers.id, row.id))
    }
    page(res, 200, {
      title: 'Subscribed', heading: 'You are subscribed',
      body: row.status === 'confirmed' ? 'This address was already confirmed. Nothing more to do.'
        : 'Thank you. We will email you when we publish. Every message has an unsubscribe link.',
    })
  })

  router.get('/unsubscribe/:token', async (req, res) => {
    const { token } = req.params
    const row = TOKEN_RE.test(token) ? (await ready(), await byToken(token)) : null
    if (!row) return page(res, 404, { title: 'Link not valid', heading: 'This link is not valid', body: 'It may have been replaced by a newer one.' })
    // A button rather than acting on GET, so a mail scanner that opens every
    // link in a message cannot unsubscribe anyone.
    page(res, 200, {
      title: 'Unsubscribe', heading: 'Unsubscribe from NGScorecard?',
      body: 'Press the button and we will stop emailing this address.',
      button: `<form method="post" action="/api/newsletter/unsubscribe/${esc(token)}"><p><button type="submit">Unsubscribe</button></p></form>`,
    })
  })

  router.post('/unsubscribe/:token', urlencoded({ extended: false, limit: '2kb' }), async (req, res) => {
    const { token } = req.params
    const row = TOKEN_RE.test(token) ? (await ready(), await byToken(token)) : null
    if (!row) return page(res, 404, { title: 'Link not valid', heading: 'This link is not valid', body: 'It may have been replaced by a newer one.' })
    if (row.status !== 'unsubscribed') {
      await db.update(t.subscribers).set({ status: 'unsubscribed', unsubscribedAt: new Date(now()).toISOString() }).where(eq(t.subscribers.id, row.id))
    }
    page(res, 200, { title: 'Unsubscribed', heading: 'You are unsubscribed', body: 'We will not email this address again. If this was a mistake, you can sign up again from the site.' })
  })

  return router
}
