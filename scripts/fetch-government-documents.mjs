#!/usr/bin/env node

/**
 * Fetch government documents from official sources
 * This script retrieves documents from real government websites
 * instead of using hardcoded content
 */

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { addDocument } from '../server/rag.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data/ngscorecard.db')

// Document sources to fetch from
const documentSources = [
  {
    source: 'FIRS',
    title: 'Tax Registration Requirements',
    url: 'https://www.firs.gov.ng/businesstaxonline/',
    description: 'Official FIRS tax registration page'
  },
  {
    source: 'CAC',
    title: 'Business Name Registration',
    url: 'https://www.cac.gov.ng/newcompanypage/namecheck',
    description: 'CAC business registration portal'
  },
  {
    source: 'NBS',
    title: 'Economic Statistics and Data',
    url: 'https://www.nigerianstat.gov.ng/',
    description: 'National Bureau of Statistics official data'
  },
  {
    source: 'CBN',
    title: 'Monetary Policy and Banking',
    url: 'https://www.cbn.gov.ng/',
    description: 'Central Bank of Nigeria official information'
  },
  {
    source: 'NIMC',
    title: 'National Identification Services',
    url: 'https://www.nimc.gov.ng/',
    description: 'NIMC NIN registration information'
  },
  {
    source: 'BPP',
    title: 'Government Procurement',
    url: 'https://www.bpp.gov.ng/',
    description: 'Bureau of Public Procurement tenders'
  },
  {
    source: 'NIS',
    title: 'Passport and Immigration',
    url: 'https://immigration.gov.ng/',
    description: 'Nigerian Immigration Service passport services'
  },
  {
    source: 'FRSC',
    title: 'Driver License and Vehicle Registration',
    url: 'https://www.frsc.gov.ng/',
    description: 'Federal Road Safety Corps services'
  },
  {
    source: 'JAMB',
    title: 'University Admissions and UTME',
    url: 'https://www.jamb.gov.ng/',
    description: 'Joint Admissions and Matriculation Board'
  },
  {
    source: 'Ministry of Health',
    title: 'Healthcare and Immunization',
    url: 'https://www.health.gov.ng/',
    description: 'Federal Ministry of Health services'
  }
]

/**
 * Fetch document content from a URL
 * @param {string} url - URL to fetch from
 * @returns {Promise<string>} Document content
 */
async function fetchDocumentContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NGScorecard Government Services Bot/1.0'
      },
      timeout: 10000
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')

    // Handle different content types
    if (contentType?.includes('text/html')) {
      const html = await response.text()
      // Extract text from HTML (basic strip of tags)
      return html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    } else if (contentType?.includes('application/pdf')) {
      // PDF content would need pdfparse library
      return `PDF document from ${url}. PDF parsing requires additional dependencies.`
    } else {
      return await response.text()
    }
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message)
    return null
  }
}

/**
 * Extract meaningful content from fetched HTML
 * Focuses on main content area, removing boilerplate
 * @param {string} content - HTML content
 * @returns {string} Extracted content
 */
function extractMainContent(content) {
  // Remove navigation, headers, footers
  let extracted = content
    .replace(/header[^>]*>.*?<\/header>/gi, '')
    .replace(/nav[^>]*>.*?<\/nav>/gi, '')
    .replace(/footer[^>]*>.*?<\/footer>/gi, '')
    .replace(/aside[^>]*>.*?<\/aside>/gi, '')
    .replace(/script[^>]*>.*?<\/script>/gi, '')
    .replace(/style[^>]*>.*?<\/style>/gi, '')

  // Extract main content
  const mainMatch = extracted.match(/<main[^>]*>(.*?)<\/main>/gi)
  if (mainMatch) {
    extracted = mainMatch[0]
  } else {
    const articleMatch = extracted.match(/<article[^>]*>(.*?)<\/article>/gi)
    if (articleMatch) {
      extracted = articleMatch[0]
    }
  }

  // Clean up HTML
  extracted = extracted
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  return extracted.substring(0, 5000) // Limit to first 5000 chars
}

/**
 * Main ingestion function
 */
async function ingestDocumentsFromSources() {
  console.log('Fetching government documents from official sources...\n')

  // Create data directory
  mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new Database(dbPath)

  // Ensure RAG tables exist
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

  // Clear existing documents for fresh fetch
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM rag_documents').get()
  if (existingCount.count > 0) {
    console.log(`Clearing ${existingCount.count} existing documents...\n`)
    db.prepare('DELETE FROM rag_chunks').run()
    db.prepare('DELETE FROM rag_documents').run()
  }

  let ingested = 0
  let failed = 0
  let skipped = 0

  // Fetch and ingest documents
  for (const source of documentSources) {
    try {
      console.log(`Fetching: ${source.title} from ${source.source}...`)

      // Fetch content from URL
      const content = await fetchDocumentContent(source.url)

      if (!content || content.length < 100) {
        console.log(`  ⚠ Skipped: Content too small or fetch failed`)
        skipped++
        continue
      }

      // Extract main content
      const extractedContent = extractMainContent(content)

      if (extractedContent.length < 50) {
        console.log(`  ⚠ Skipped: No meaningful content extracted`)
        skipped++
        continue
      }

      // Add to database
      const docId = await addDocument(db, {
        source: source.source,
        title: source.title,
        url: source.url,
        content: extractedContent
      })

      console.log(`  ✓ Ingested (${extractedContent.length} chars)`)
      ingested++
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`)
      failed++
    }
  }

  // Summary
  const totalChunks = db.prepare('SELECT COUNT(*) as count FROM rag_chunks').get()
  console.log(`\n✅ Ingestion complete:`)
  console.log(`   Documents: ${ingested} ingested, ${failed} failed, ${skipped} skipped`)
  console.log(`   Chunks: ${totalChunks.count} total`)
  console.log(`\nNote: This fetches live content from government websites.`)
  console.log(`Some sites may block automated requests or have dynamic content.`)
  console.log(`For production use, consider using official APIs or data feeds when available.`)

  db.close()
}

// Run ingestion
ingestDocumentsFromSources().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
