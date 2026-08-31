import * as schema from './schema.js'

function ensureColumn(client, table, column, definition) {
  const columns = client.prepare(`PRAGMA table_info(${table})`).all()
  if (columns.some(c => c.name === column)) return
  client.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()
}

function ensureLocalSchema(client) {
  ensureColumn(client, 'presidents', 'level', "TEXT NOT NULL DEFAULT 'federal'")
  ensureColumn(client, 'presidents', 'state', 'TEXT')
  ensureColumn(client, 'presidents', 'is_current', 'INTEGER NOT NULL DEFAULT 1')
  ensureColumn(client, 'fraud', 'response_verdict', 'TEXT')
  ensureColumn(client, 'fraud', 'govt_response', 'TEXT')
  ensureColumn(client, 'indicators', 'higher_is_better', 'INTEGER')
  ensureColumn(client, 'promises', 'flag', 'TEXT')
  ensureColumn(client, 'promises', 'related', 'TEXT')
  for (const tbl of ['promises', 'inherited', 'fraud', 'orders', 'ministers', 'bills', 'judgments']) {
    ensureColumn(client, tbl, 'source_tier', 'TEXT')
  }
  client.prepare(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL,
      last_used_at TEXT,
      request_count INTEGER NOT NULL DEFAULT 0,
      revoked INTEGER NOT NULL DEFAULT 0
    )
  `).run()
}

async function createDb() {
  if (process.env.TURSO_DATABASE_URL) {
    const { createClient } = await import('@libsql/client')
    const { drizzle } = await import('drizzle-orm/libsql')
    const client = createClient({
      url:       process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return drizzle(client, { schema })
  }

  // Local dev: better-sqlite3
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  const { mkdirSync } = await import('fs')
  const { fileURLToPath } = await import('url')
  const { default: path } = await import('path')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const dbPath = path.join(__dirname, '../data/ngscorecard.db')
  mkdirSync(path.dirname(dbPath), { recursive: true })
  const client = new Database(dbPath)
  client.pragma('journal_mode = WAL')
  client.pragma('foreign_keys = ON')
  ensureLocalSchema(client)
  return drizzle(client, { schema })
}

export const db = await createDb()
