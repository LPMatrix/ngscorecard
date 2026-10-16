// RAG tables, created the same way everywhere: the Turso server at startup and
// the corpus sync script. Safe to run repeatedly. New databases get the full
// tables; older ones gain only the columns they are missing.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS rag_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT,
    content TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rag_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    embedding TEXT,
    token_count INTEGER,
    section TEXT,
    chunk_index INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES rag_documents(id)
  )`,
  `CREATE INDEX IF NOT EXISTS rag_chunks_doc_idx ON rag_chunks(document_id)`,
]

const LATE_COLUMNS = [['section', 'TEXT'], ['chunk_index', 'INTEGER']]
const SECTION_INDEX = 'CREATE INDEX IF NOT EXISTS rag_chunks_section_idx ON rag_chunks(section)'

// Works with both better-sqlite3 (sync) and @libsql/client (async).
export async function ensureRagSchema(client) {
  if (client.prepare) {
    for (const sql of TABLES) client.prepare(sql).run()
    const have = new Set(client.prepare('PRAGMA table_info(rag_chunks)').all().map(c => c.name))
    for (const [column, type] of LATE_COLUMNS) {
      if (!have.has(column)) client.prepare(`ALTER TABLE rag_chunks ADD COLUMN ${column} ${type}`).run()
    }
    client.prepare(SECTION_INDEX).run()
    return
  }

  await client.batch(TABLES, 'write')
  const info = await client.execute('PRAGMA table_info(rag_chunks)')
  const have = new Set(info.rows.map(r => r.name))
  for (const [column, type] of LATE_COLUMNS) {
    if (!have.has(column)) await client.execute(`ALTER TABLE rag_chunks ADD COLUMN ${column} ${type}`)
  }
  await client.execute(SECTION_INDEX)
}
