import * as schema from './schema.js'

function ensureColumn(client, table, column, definition) {
  try {
    const columns = client.prepare(`PRAGMA table_info(${table})`).all()
    if (columns.some(c => c.name === column)) return
    client.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()
  } catch (e) {
    // Table doesn't exist yet; will be created by Drizzle migration
    if (e.code !== 'SQLITE_ERROR') throw e
  }
}

// Creates a unique index if it doesn't exist yet, but only when the data
// underneath is actually unique — a stray duplicate (e.g. from a hand-typed
// admin.html row) would otherwise crash every future startup on this line.
// Log and skip rather than fail; the seed script's own matching logic
// doesn't depend on the index existing, it's a safety net, not a lock.
function ensureUniqueIndex(client, name, table, columns) {
  try {
    const existing = client.prepare(`PRAGMA index_list(${table})`).all()
    if (existing.some(i => i.name === name)) return
    const cols = columns.join(', ')
    const dupes = client.prepare(
      `SELECT ${cols}, COUNT(*) c FROM ${table} GROUP BY ${cols} HAVING c > 1`
    ).all()
    if (dupes.length) {
      console.warn(`Skipping unique index ${name}: ${dupes.length} duplicate group(s) on (${cols}) in ${table}`)
      return
    }
    client.prepare(`CREATE UNIQUE INDEX ${name} ON ${table}(${cols})`).run()
  } catch (e) {
    if (e.code !== 'SQLITE_ERROR') throw e
  }
}

function ensureLocalSchema(client) {
  ensureColumn(client, 'presidents', 'level', "TEXT NOT NULL DEFAULT 'federal'")
  ensureColumn(client, 'presidents', 'state', 'TEXT')
  ensureColumn(client, 'presidents', 'is_current', 'INTEGER NOT NULL DEFAULT 1')
  ensureColumn(client, 'fraud', 'response_verdict', 'TEXT')
  ensureColumn(client, 'fraud', 'govt_response', 'TEXT')
  ensureColumn(client, 'fraud', 'court_case_ref', 'TEXT')
  ensureColumn(client, 'fraud', 'days_pending', 'INTEGER')
  ensureColumn(client, 'indicators', 'higher_is_better', 'INTEGER')
  ensureColumn(client, 'indicators', 'registry_key', 'TEXT')
  ensureColumn(client, 'indicators', 'status', 'TEXT')
  ensureColumn(client, 'indicators', 'checked', 'TEXT')
  ensureColumn(client, 'indicators', 'display_order', 'INTEGER')
  ensureColumn(client, 'indicator_points', 'year', 'INTEGER')
  ensureColumn(client, 'indicator_points', 'period', 'TEXT')
  ensureColumn(client, 'indicator_points', 'source', 'TEXT')
  ensureColumn(client, 'indicator_points', 'source_label', 'TEXT')
  ensureColumn(client, 'indicator_points', 'basis', 'TEXT')
  ensureColumn(client, 'indicator_points', 'note', 'TEXT')
  ensureUniqueIndex(client, 'indicator_points_label_uq', 'indicator_points', ['indicator_id', 'label'])
  ensureColumn(client, 'promises', 'flag', 'TEXT')
  ensureColumn(client, 'promises', 'related', 'TEXT')
  for (const tbl of ['promises', 'inherited', 'fraud', 'orders', 'ministers', 'bills', 'judgments']) {
    ensureColumn(client, tbl, 'source_tier', 'TEXT')
  }
  client.prepare(`
    CREATE TABLE IF NOT EXISTS entry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_table TEXT NOT NULL,
      entry_id INTEGER NOT NULL,
      administration TEXT,
      kind TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      note TEXT,
      changed_at TEXT NOT NULL
    )
  `).run()
  client.prepare(`
    CREATE TABLE IF NOT EXISTS corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_table TEXT, entry_id INTEGER, administration TEXT, url TEXT,
      kind TEXT NOT NULL DEFAULT 'other', body TEXT NOT NULL, source_url TEXT,
      email TEXT, status TEXT NOT NULL DEFAULT 'new', admin_note TEXT,
      ip_hash TEXT, created_at TEXT NOT NULL
    )
  `).run()
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
  const { readFileSync } = await import('fs')
  const { mkdirSync } = await import('fs')
  const { fileURLToPath } = await import('url')
  const { default: path } = await import('path')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const dbPath = path.join(__dirname, '../data/ngscorecard.db')
  mkdirSync(path.dirname(dbPath), { recursive: true })
  const client = new Database(dbPath)
  client.pragma('journal_mode = WAL')
  client.pragma('foreign_keys = ON')
  const db = drizzle(client, { schema })

  // Apply migration if tables don't exist
  const tables = client.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
  if (tables.length === 0) {
    const migrationSql = readFileSync(path.join(__dirname, '../drizzle/0000_light_ink.sql'), 'utf-8')
    const statements = migrationSql.split('--> statement-breakpoint\n').filter(s => s.trim())
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          client.exec(stmt)
        } catch (e) {
          console.error('Migration statement failed:', e.message, '\nStatement:', stmt.slice(0, 100))
        }
      }
    }
  }

  ensureLocalSchema(client)
  return db
}

export const db = await createDb()
