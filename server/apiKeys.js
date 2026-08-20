import { randomBytes } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

function generateKey() {
  return 'ngs_live_' + randomBytes(24).toString('hex')
}

// Reuses an existing non-revoked key for the email if one exists, rather
// than letting repeat signups pile up duplicate keys.
export async function getOrCreateApiKey(email) {
  const existing = await db.select().from(t.apiKeys)
    .where(eq(t.apiKeys.email, email))
    .limit(1)
  if (existing.length && !existing[0].revoked) return existing[0]

  const key = generateKey()
  const [row] = await db.insert(t.apiKeys).values({
    key, email, tier: 'free', createdAt: new Date().toISOString(),
  }).returning()
  return row
}

export async function findApiKey(key) {
  const rows = await db.select().from(t.apiKeys).where(eq(t.apiKeys.key, key)).limit(1)
  return rows[0] ?? null
}

export async function touchApiKey(id) {
  await db.update(t.apiKeys)
    .set({ lastUsedAt: new Date().toISOString(), requestCount: sql`${t.apiKeys.requestCount} + 1` })
    .where(eq(t.apiKeys.id, id))
}
