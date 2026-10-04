import { createHmac, createHash, timingSafeEqual, randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { eq } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

const scryptAsync = promisify(scrypt)

const COOKIE_NAME = 'ngs_admin'
const CSRF_COOKIE = 'ngs_csrf'
const SESSION_MS = 12 * 60 * 60 * 1000 // 12h

export const MIN_PASSWORD_LENGTH = 12

// Two kinds of account:
//   - the break-glass owner, defined by ADMIN_EMAIL / ADMIN_PASSWORD in the
//     environment (id 0). It needs no database row, so a database problem can
//     never lock the owner out.
//   - everyone else, a row in admin_users with their own scrypt password hash.
export const ENV_OWNER_ID = 0

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set')
  return s
}

const sha = (s) => createHash('sha256').update(String(s)).digest('hex')
const sign = (payload) => createHmac('sha256', secret()).update(payload).digest('hex')

function safeEqual(a, b) {
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// ---- passwords -------------------------------------------------------------

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scryptAsync(String(password), salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$')
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
  const key = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'), 64)
  const expected = Buffer.from(hashHex, 'hex')
  return key.length === expected.length && timingSafeEqual(key, expected)
}

// Verified against when no such user exists, so a wrong email costs the same
// time as a wrong password and can't be used to discover which emails have accounts.
let dummyHash = null

export function generateTemporaryPassword() {
  return randomBytes(12).toString('base64url')
}

// ---- subjects & sessions ---------------------------------------------------

const envEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase()

function envOwnerSubject() {
  return {
    id: ENV_OWNER_ID,
    email: envEmail(),
    name: 'Owner',
    role: 'owner',
    mustChangePassword: false,
    // Tag changes whenever the credential does, which ends old sessions.
    tag: sha(process.env.ADMIN_PASSWORD || '').slice(0, 12),
  }
}

export function userSubject(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    mustChangePassword: Boolean(u.mustChangePassword),
    tag: sha(u.passwordHash).slice(0, 12),
  }
}

export async function authenticate(email, password) {
  const candidate = String(email || '').trim().toLowerCase()
  const pw = String(password || '')
  if (!candidate || !pw) return null

  const expectedEmail = envEmail()
  const expectedPassword = process.env.ADMIN_PASSWORD || ''
  if (expectedEmail && expectedPassword && safeEqual(candidate, expectedEmail)) {
    return safeEqual(pw, expectedPassword) ? envOwnerSubject() : null
  }

  let user = null
  try {
    ;[user] = await db.select().from(t.adminUsers).where(eq(t.adminUsers.email, candidate)).limit(1)
  } catch (e) {
    console.error('admin_users lookup failed:', e.message)
  }
  if (!user) {
    dummyHash ??= await hashPassword('not-a-real-password')
    await verifyPassword(pw, dummyHash)
    return null
  }
  if (!(await verifyPassword(pw, user.passwordHash))) return null
  if (!user.active) return null
  return userSubject(user)
}

function makeToken(subject) {
  const expiry = Date.now() + SESSION_MS
  const payload = `${expiry}.${subject.id}.${subject.tag}`
  return `${payload}.${sign(payload)}`
}

export function setAdminCookie(res, subject) {
  res.cookie(COOKIE_NAME, makeToken(subject), {
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

// Resolves the signed-in account for a request, or null. Role and active
// status come from the database on every request, not from the cookie, so
// deactivating someone or resetting their password takes effect immediately.
export async function loadSession(req) {
  const token = parseCookies(req)[COOKIE_NAME]
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [expiry, idStr, tag, sig] = parts
  if (!safeEqual(sig, sign(`${expiry}.${idStr}.${tag}`))) return null
  if (Date.now() > Number(expiry)) return null

  const id = Number(idStr)
  if (id === ENV_OWNER_ID) {
    if (!envEmail() || !process.env.ADMIN_PASSWORD) return null
    const subject = envOwnerSubject()
    return safeEqual(tag, subject.tag) ? subject : null
  }

  let user = null
  try {
    ;[user] = await db.select().from(t.adminUsers).where(eq(t.adminUsers.id, id)).limit(1)
  } catch (e) {
    console.error('admin_users lookup failed:', e.message)
  }
  if (!user || !user.active) return null
  const subject = userSubject(user)
  return safeEqual(tag, subject.tag) ? subject : null
}

export async function requireAdmin(req, res, next) {
  const admin = await loadSession(req)
  if (!admin) return res.status(401).json({ error: 'Not authenticated' })

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const cookies = parseCookies(req)
    const sent = req.get('x-csrf-token')
    if (!sent || !cookies[CSRF_COOKIE] || sent !== cookies[CSRF_COOKIE]) {
      return res.status(403).json({ error: 'Invalid CSRF token' })
    }
  }

  // A temporary password must be replaced before anything else is reachable.
  if (admin.mustChangePassword && !(req.method === 'POST' && req.path === '/password')) {
    return res.status(403).json({ error: 'password_change_required' })
  }

  req.admin = admin
  next()
}

export function requireOwner(req, res, next) {
  if (req.admin?.role !== 'owner') return res.status(403).json({ error: 'Owner access required' })
  next()
}

// Verifies a current password for the signed-in database user (used by the
// change-password flow). The env owner changes theirs by editing the env var.
export async function verifyUserPassword(userId, password) {
  const [user] = await db.select().from(t.adminUsers).where(eq(t.adminUsers.id, userId)).limit(1)
  return user ? verifyPassword(password, user.passwordHash) : false
}
