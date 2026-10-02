#!/usr/bin/env node

import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import { addDocument } from '../server/rag.js'
import { governmentDocuments, stateServices } from './government-data-sources.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data/ngscorecard.db')

async function ingestAllDocuments() {
  console.log('Ingesting all government documents...')

  // Create data directory if it doesn't exist
  const { mkdirSync } = await import('fs')
  mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)

  // Ensure RAG tables exist with metadata-preserving schema
  db.prepare(`
    CREATE TABLE IF NOT EXISTS rag_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      content TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT,
      token_count INTEGER,
      section TEXT,
      chunk_index INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES rag_documents(id)
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS rag_chunks_doc_idx ON rag_chunks(document_id)
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS rag_chunks_section_idx ON rag_chunks(section)
  `).run()

  // Clear existing documents for fresh ingest
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM rag_documents').get()
  if (existingCount.count > 0) {
    console.log(`Clearing ${existingCount.count} existing documents...`)
    db.prepare('DELETE FROM rag_chunks').run()
    db.prepare('DELETE FROM rag_documents').run()
  }

  let ingested = 0
  let failed = 0

  // Ingest federal documents
  console.log(`\nFederal Documents (${governmentDocuments.length})`)
  for (const doc of governmentDocuments) {
    try {
      const docId = addDocument(db, doc)
      console.log(`  ✓ ${doc.title}`)
      ingested++
    } catch (error) {
      console.error(`  ✗ ${doc.title}: ${error.message}`)
      failed++
    }
  }

  // Ingest state documents
  console.log(`\nState Documents (${stateServices.length})`)
  for (const doc of stateServices) {
    try {
      const docId = addDocument(db, doc)
      console.log(`  ✓ [${doc.state}] ${doc.title}`)
      ingested++
    } catch (error) {
      console.error(`  ✗ [${doc.state}] ${doc.title}: ${error.message}`)
      failed++
    }
  }

  // Summary
  const totalChunks = db.prepare('SELECT COUNT(*) as count FROM rag_chunks').get()
  console.log(`\n✅ Ingestion complete:`)
  console.log(`   Documents: ${ingested} ingested, ${failed} failed`)
  console.log(`   Chunks: ${totalChunks.count} total`)

  db.close()
}

ingestAllDocuments().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
