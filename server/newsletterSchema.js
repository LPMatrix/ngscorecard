// The newsletter list. Created the same way as the RAG tables: at startup, for
// both the local SQLite file and Turso. Safe to run repeatedly.
//
// status: 'pending' (asked, not yet confirmed: never mailed an issue),
//         'confirmed' (clicked the link in the confirmation email),
//         'unsubscribed' (kept as a suppression record so they are not re-added).
// token: random secret in the confirm and unsubscribe links.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    source TEXT,
    created_at TEXT NOT NULL,
    confirmation_sent_at TEXT,
    confirmed_at TEXT,
    unsubscribed_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers(status)`,
]

// Works with both better-sqlite3 (sync) and @libsql/client (async).
export async function ensureNewsletterSchema(client) {
  if (client.prepare) {
    for (const sql of TABLES) client.prepare(sql).run()
    return
  }
  await client.batch(TABLES, 'write')
}
