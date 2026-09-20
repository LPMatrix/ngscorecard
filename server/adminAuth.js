import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

const COOKIE_NAME = 'ngs_admin'
const CSRF_COOKIE = 'ngs_csrf'
const SESSION_MS = 12 * 60 * 60 * 1000 // 12h — short-lived single admin session

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set')
  return s
}

function sign(expiry) {
  return createHmac('sha256', secret()).update(String(expiry)).digest('hex')
}

function makeToken() {
  const expiry = Date.now() + SESSION_MS
  return `${expiry}.${sign(expiry)}`
}

function verifyToken(token) {
  if (!token) return false
  const [expiry, sig] = token.split('.')
  if (!expiry || !sig) return false
  if (Date.now() > Number(expiry)) return false
  const expected = sign(expiry)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function parseCookies(req) {
  const header = req.headers.cookie
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(p => {
      const i = p.indexOf('=')
      return [p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1).trim())]
    })
  )
}

function safeEqual(a, b) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function checkCredentials(email, password) {
  const expectedEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const expectedPassword = process.env.ADMIN_PASSWORD || ''
  const candidateEmail = String(email || '').trim().toLowerCase()
  if (!expectedEmail || !expectedPassword || !candidateEmail || !password) return false
  return safeEqual(candidateEmail, expectedEmail) && safeEqual(String(password), expectedPassword)
}

export function setAdminCookie(res) {
  const token = makeToken()
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MS,
    path: '/',
  })
  res.cookie(CSRF_COOKIE, randomBytes(24).toString('hex'), {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MS,
    path: '/',
  })
}

export function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.clearCookie(CSRF_COOKIE, { path: '/' })
}

export function isAuthed(req) {
  const cookies = req.headers.cookie ? parseCookies(req) : {}
  return verifyToken(cookies[COOKIE_NAME])
}

export function requireAdmin(req, res, next) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const cookies = parseCookies(req)
    const sent = req.get('x-csrf-token')
    if (!sent || !cookies[CSRF_COOKIE] || sent !== cookies[CSRF_COOKIE]) {
      return res.status(403).json({ error: 'Invalid CSRF token' })
    }
  }
  next()
}
