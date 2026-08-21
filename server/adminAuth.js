import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'ngs_admin'
const SESSION_MS = 12 * 60 * 60 * 1000 // 12h — short-lived since it's a single shared password

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

export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || !candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
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
}

export function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function isAuthed(req) {
  const cookies = req.headers.cookie ? parseCookies(req) : {}
  return verifyToken(cookies[COOKIE_NAME])
}

export function requireAdmin(req, res, next) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}
