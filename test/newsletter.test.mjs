// Newsletter signup end to end against an in-memory database and a fake mailer:
// nothing here sends email or touches Turso.
import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../server/schema.js'
import { ensureNewsletterSchema } from '../server/newsletterSchema.js'
import { createNewsletterRouter, isValidEmail, normaliseEmail, siteUrl, confirmationEmail } from '../server/newsletterRoutes.js'
import { createMailer, MailerNotConfigured } from '../server/mailer.js'

const sqlite = new Database(':memory:')
await ensureNewsletterSchema(sqlite)
const db = drizzle(sqlite, { schema })

let sent = []
let failWith = null
const mailer = { send: async (m) => { if (failWith) throw failWith; sent.push(m); return { id: 'x' } } }

let clock = Date.parse('2026-10-18T12:00:00Z')
const now = () => clock

let server, base, ip = 0
const post = (p, body, headers = {}) => fetch(`${base}${p}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': `10.1.0.${++ip}`, ...headers },
  body: JSON.stringify(body),
})
const subscribe = async (email, extra = {}) => {
  const res = await post('/api/newsletter/subscribe', { email, renderedAt: clock - 5000, ...extra })
  return { status: res.status, body: await res.json() }
}
const rowFor = (email) => sqlite.prepare('SELECT * FROM subscribers WHERE email = ?').get(email)
const tokenIn = (msg) => msg.text.match(/\/confirm\/([A-Za-z0-9_-]+)/)[1]

describe('helpers', () => {
  test('email validation', () => {
    for (const ok of ['a@b.co', 'first.last+tag@sub.example.org']) assert.ok(isValidEmail(ok), ok)
    for (const bad of ['', 'a', 'a@b', 'a b@c.com', 'a@b..com', 'a@@b.com', '<x>@b.com', 'a@b.c', `${'a'.repeat(250)}@b.com`]) assert.ok(!isValidEmail(bad), bad)
  })
  test('addresses are trimmed and lowercased', () => assert.equal(normaliseEmail('  Ada@Example.COM '), 'ada@example.com'))
  test('links never take their host from the request in production', () => {
    const req = { protocol: 'http', get: () => 'evil.test' }
    assert.equal(siteUrl(req, { NODE_ENV: 'production' }), 'https://ngscorecard.com')
    assert.equal(siteUrl(req, { NODE_ENV: 'production', SITE_URL: 'https://x.org/' }), 'https://x.org')
    assert.equal(siteUrl(req, {}), 'http://evil.test')
  })
  test('the email escapes its links in HTML', () => {
    const m = confirmationEmail({ confirmUrl: 'https://x.org/?a=1&b="2"', unsubscribeUrl: 'https://x.org/u' })
    assert.ok(m.html.includes('a=1&amp;b=&quot;2&quot;'))
    assert.ok(m.text.includes('https://x.org/?a=1&b="2"'))
  })
})

describe('/api/newsletter', () => {
  before(async () => {
    const app = express()
    app.use('/api/newsletter', createNewsletterRouter({ db, mailer, now }))
    await new Promise(r => { server = app.listen(0, r) })
    base = `http://127.0.0.1:${server.address().port}`
  })
  after(() => { server.close(); sqlite.close() })
  beforeEach(() => { sent = []; failWith = null })

  test('a new address is stored as pending and sent one confirmation', async () => {
    const r = await subscribe('Ada@Example.com', { source: 'footer' })
    assert.equal(r.status, 200)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].to, 'ada@example.com')
    assert.match(sent[0].subject, /Confirm/)
    const row = rowFor('ada@example.com')
    assert.equal(row.status, 'pending')
    assert.equal(row.source, 'footer')
    assert.ok(row.confirmation_sent_at)
    assert.ok(sent[0].text.includes(`/api/newsletter/unsubscribe/${row.token}`))
  })

  test('the confirmation link confirms, and doing it again is harmless', async () => {
    const token = rowFor('ada@example.com').token
    const first = await fetch(`${base}/api/newsletter/confirm/${token}`)
    assert.equal(first.status, 200)
    assert.match(await first.text(), /You are subscribed/)
    assert.equal(rowFor('ada@example.com').status, 'confirmed')
    const confirmedAt = rowFor('ada@example.com').confirmed_at
    const again = await fetch(`${base}/api/newsletter/confirm/${token}`)
    assert.match(await again.text(), /already confirmed/)
    assert.equal(rowFor('ada@example.com').confirmed_at, confirmedAt)
  })

  test('the signup response is the same for a confirmed address, and nothing is sent', async () => {
    const r = await subscribe('ada@example.com')
    assert.deepEqual(r.body, { ok: true })
    assert.equal(sent.length, 0)
  })

  test('a pending address is re-mailed at most once every ten minutes', async () => {
    await subscribe('bola@example.com')
    assert.equal(sent.length, 1)
    clock += 60_000
    await subscribe('bola@example.com')
    assert.equal(sent.length, 1, 'too soon')
    clock += 10 * 60_000
    await subscribe('bola@example.com')
    assert.equal(sent.length, 2)
    assert.equal(tokenIn(sent[0]), tokenIn(sent[1]), 'the same link still works')
  })

  test('the unsubscribe page does nothing on GET, and the button unsubscribes', async () => {
    const token = rowFor('ada@example.com').token
    const page = await fetch(`${base}/api/newsletter/unsubscribe/${token}`)
    assert.equal(page.status, 200)
    assert.match(await page.text(), /<form method="post"/)
    assert.equal(rowFor('ada@example.com').status, 'confirmed', 'a scanner opening the link must not unsubscribe anyone')

    const done = await fetch(`${base}/api/newsletter/unsubscribe/${token}`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click',
    })
    assert.equal(done.status, 200)
    assert.equal(rowFor('ada@example.com').status, 'unsubscribed')
    assert.ok(rowFor('ada@example.com').unsubscribed_at)
  })

  test('an old confirmation link cannot re-subscribe someone who unsubscribed', async () => {
    const token = rowFor('ada@example.com').token
    const res = await fetch(`${base}/api/newsletter/confirm/${token}`)
    assert.match(await res.text(), /opted out/)
    assert.equal(rowFor('ada@example.com').status, 'unsubscribed')
  })

  test('signing up again after unsubscribing starts over with a new link', async () => {
    const oldToken = rowFor('ada@example.com').token
    await subscribe('ada@example.com')
    const row = rowFor('ada@example.com')
    assert.equal(row.status, 'pending')
    assert.notEqual(row.token, oldToken)
    assert.equal(sent.length, 1)
    const res = await fetch(`${base}/api/newsletter/confirm/${oldToken}`)
    assert.equal(res.status, 404, 'the old link is dead')
  })

  test('unknown and malformed tokens are 404 pages, not errors', async () => {
    for (const p of ['confirm/nope', `confirm/${'a'.repeat(30)}`, 'unsubscribe/%3Cscript%3E', `unsubscribe/${'b'.repeat(30)}`]) {
      const res = await fetch(`${base}/api/newsletter/${p}`)
      assert.equal(res.status, 404, p)
      assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow')
    }
  })

  test('bad input is refused without storing anything', async () => {
    const before = sqlite.prepare('SELECT COUNT(*) n FROM subscribers').get().n
    assert.equal((await subscribe('not an email')).status, 400)
    assert.equal((await subscribe('')).status, 400)
    assert.equal((await subscribe(['a@b.co'])).status, 400)
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM subscribers').get().n, before)
    assert.equal(sent.length, 0)
  })

  test('bots: a filled honeypot looks like success but stores and sends nothing', async () => {
    const r = await subscribe('bot@example.com', { company: 'Acme' })
    assert.deepEqual(r.body, { ok: true })
    assert.equal(rowFor('bot@example.com'), undefined)
    assert.equal(sent.length, 0)
  })

  test('bots: an instant or missing-timestamp submit is refused', async () => {
    assert.equal((await subscribe('fast@example.com', { renderedAt: clock - 100 })).status, 400)
    assert.equal((await subscribe('none@example.com', { renderedAt: undefined })).status, 400)
    assert.equal((await subscribe('future@example.com', { renderedAt: clock + 60_000 })).status, 400)
    assert.equal(rowFor('fast@example.com'), undefined)
  })

  test('a mail failure is reported, and the address can try again straight away', async () => {
    failWith = new Error('Resend rejected the email (422)')
    const r = await subscribe('carol@example.com')
    assert.equal(r.status, 503)
    assert.match(r.body.error, /could not send/)
    assert.equal(rowFor('carol@example.com').confirmation_sent_at, null)
    failWith = null
    assert.equal((await subscribe('carol@example.com')).status, 200)
    assert.equal(sent.length, 1)
  })

  test('a message that was only printed (no key, development) does not start the resend cooldown', async () => {
    const skipping = { send: async () => ({ skipped: true }) }
    const app = express()
    app.use('/api/newsletter', createNewsletterRouter({ db, mailer: skipping, now }))
    const s = await new Promise(r => { const x = app.listen(0, () => r(x)) })
    try {
      const res = await fetch(`http://127.0.0.1:${s.address().port}/api/newsletter/subscribe`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-vercel-forwarded-for': '10.7.7.7' },
        body: JSON.stringify({ email: 'erin@example.com', renderedAt: clock - 5000 }),
      })
      assert.equal(res.status, 200)
      assert.equal(rowFor('erin@example.com').confirmation_sent_at, null)
    } finally { s.close() }
  })

  test('with no email provider configured, the response says so instead of claiming success', async () => {
    failWith = new MailerNotConfigured()
    const r = await subscribe('dave@example.com')
    assert.equal(r.status, 503)
    assert.match(r.body.error, /not available yet/)
  })

  test('a flood from one address is rate limited', async () => {
    const same = { 'x-vercel-forwarded-for': '10.99.99.99' }
    const codes = []
    for (let i = 0; i < 7; i++) {
      const res = await post('/api/newsletter/subscribe', { email: `flood${i}@example.com`, renderedAt: clock - 5000 }, same)
      codes.push(res.status)
    }
    assert.deepEqual(codes.slice(0, 5), [200, 200, 200, 200, 200])
    assert.equal(codes[5], 429)
  })
})

describe('mailer', () => {
  const msg = { to: 'a@b.co', subject: 'S', text: 'T', html: '<p>T</p>' }

  test('posts to Resend with the key and the sender', async () => {
    const calls = []
    const m = createMailer({
      env: { RESEND_API_KEY: 're_test', NEWSLETTER_FROM: 'NGScorecard <n@ngscorecard.com>' },
      fetchImpl: async (url, init) => { calls.push({ url, init }); return { ok: true, json: async () => ({ id: 'abc' }) } },
    })
    assert.deepEqual(await m.send(msg), { id: 'abc' })
    assert.equal(calls[0].url, 'https://api.resend.com/emails')
    assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test')
    assert.deepEqual(JSON.parse(calls[0].init.body), { from: 'NGScorecard <n@ngscorecard.com>', to: ['a@b.co'], subject: 'S', text: 'T', html: '<p>T</p>' })
  })

  test('a rejected request throws with the provider\'s reason', async () => {
    const m = createMailer({
      env: { RESEND_API_KEY: 're_test', NEWSLETTER_FROM: 'x <x@y.z>' },
      fetchImpl: async () => ({ ok: false, status: 403, text: async () => 'domain not verified' }),
    })
    await assert.rejects(m.send(msg), /403.*domain not verified/)
  })

  test('no key: development logs the message, production refuses', async () => {
    const logged = []
    const dev = createMailer({ env: {}, log: (s) => logged.push(s) })
    assert.deepEqual(await dev.send(msg), { skipped: true })
    assert.match(logged[0], /not sent/)
    const prod = createMailer({ env: { NODE_ENV: 'production' } })
    await assert.rejects(prod.send(msg), MailerNotConfigured)
  })

  test('a sender without an email address is refused before calling Resend', async () => {
    for (const from of ['NGScorecard', 'NGScorecard <>', 'NGScorecard <not-an-email>']) {
      const m = createMailer({ env: { RESEND_API_KEY: 're_test', NEWSLETTER_FROM: from }, fetchImpl: async () => { throw new Error('should not be called') } })
      await assert.rejects(m.send(msg), /must include an email address/, from)
    }
    for (const from of ['n@ngscorecard.com', 'NGScorecard <n@ngscorecard.com>', '  "NGScorecard" <n@ngscorecard.com> ']) {
      const m = createMailer({ env: { RESEND_API_KEY: 're_test', NEWSLETTER_FROM: from }, fetchImpl: async () => ({ ok: true, json: async () => ({}) }) })
      await m.send(msg)
    }
  })

  test('a key without a sender is a clear error', async () => {
    const m = createMailer({ env: { RESEND_API_KEY: 're_test' }, fetchImpl: async () => { throw new Error('should not be called') } })
    await assert.rejects(m.send(msg), /NEWSLETTER_FROM/)
  })
})
