# RAG Document Ingestion Guide

This document explains how to ingest government documents into the NGScorecard RAG (Retrieval-Augmented Generation) system.

## Overview

The RAG system supports two ingestion approaches:

### 1. **Hardcoded Documents** (Static, Curated)
Use when you have specific, well-structured documents you want to maintain control over.

- **Script**: `npm run rag:ingest-all`
- **Source**: `scripts/government-data-sources.mjs`
- **Benefits**: 
  - Complete control over content
  - Well-structured and validated
  - Fast ingestion (no network calls)
  - Consistent formatting

### 2. **Fetched Documents** (Dynamic, Live)
Use when you want to fetch documents from actual government websites.

- **Script**: `npm run rag:fetch`
- **Source**: `scripts/fetch-government-documents.mjs`
- **Benefits**:
  - Live data from official sources
  - Automatic updates
  - No manual document creation
  - Reflects current information

## Document Structure

### Database Schema

```
rag_documents
├── id (PRIMARY KEY)
├── source (agency code, e.g., "FIRS", "CAC")
├── title (document title)
├── url (source URL)
├── content (full document text)
├── fetched_at (when document was added)
└── updated_at (when document was last updated)

rag_chunks
├── id (PRIMARY KEY)
├── document_id (FOREIGN KEY)
├── text (chunk content)
├── section (section header/name)
├── chunk_index (position within section)
├── token_count (estimated tokens)
└── created_at (when chunk was created)
```

### Metadata Preservation

Each chunk preserves:
- **Section name** — Document section from markdown headers (e.g., "Step 1: Registration")
- **Chunk index** — Position within section (enables section-aware retrieval)
- **Document ID** — Link to parent document
- **Token count** — Size estimation for LLM context

## Method 1: Hardcoded Documents (Recommended for Production)

### File: `scripts/government-data-sources.mjs`

Structure of a document:

```javascript
{
  source: 'FIRS',           // Agency code
  title: 'Tax Registration', // Document title
  url: 'https://...',       // Original source URL
  content: `# Markdown format with sections
  
## Section 1
Content here...

## Section 2
More content...`
}
```

### Ingestion Process

```bash
# Ingest all hardcoded documents
npm run rag:ingest-all

# Output:
# ✓ 28 documents ingested
# ✓ 139 chunks created
# ✓ Full metadata preserved
```

### Adding New Documents

1. Edit `scripts/government-data-sources.mjs`
2. Add to `governmentDocuments` or `stateServices` array
3. Use markdown format with headers for sections
4. Run `npm run rag:ingest-all`

Example:

```javascript
{
  source: 'NewAgency',
  title: 'New Service',
  url: 'https://official-url.gov.ng',
  content: `# Service Overview

## Step 1: Register
Instructions...

## Step 2: Submit
Instructions...

## Cost and Timeline
- Cost: ₦X,XXX
- Timeline: X days`
}
```

## Method 2: Fetched Documents (Live Updates)

### File: `scripts/fetch-government-documents.mjs`

### Ingestion Process

```bash
# Fetch documents from official government websites
npm run rag:fetch

# Output:
# Fetching: Tax Registration Requirements from FIRS...
#   ✓ Ingested (2500 chars)
# Fetching: Business Name Registration from CAC...
#   ✓ Ingested (1800 chars)
# ...
# ✅ Ingestion complete:
#    Documents: X ingested, Y failed, Z skipped
#    Chunks: N total
```

### Configured Sources

Documents are fetched from:

| Agency | Source | URL |
|--------|--------|-----|
| FIRS | Tax Registration | https://www.firs.gov.ng/businesstaxonline/ |
| CAC | Business Registration | https://www.cac.gov.ng/newcompanypage/namecheck |
| NBS | Economic Data | https://www.nigerianstat.gov.ng/ |
| CBN | Banking & Monetary | https://www.cbn.gov.ng/ |
| NIMC | National ID | https://www.nimc.gov.ng/ |
| BPP | Procurement | https://www.bpp.gov.ng/ |
| NIS | Immigration | https://immigration.gov.ng/ |
| FRSC | Road Safety | https://www.frsc.gov.ng/ |
| JAMB | University Admissions | https://www.jamb.gov.ng/ |
| Ministry of Health | Healthcare | https://www.health.gov.ng/ |

### Adding New Sources

Edit `documentSources` array in `scripts/fetch-government-documents.mjs`:

```javascript
{
  source: 'AgencyCode',
  title: 'Service Title',
  url: 'https://official-url.gov.ng/',
  description: 'What this document covers'
}
```

### Content Extraction

The fetcher automatically:
1. Strips HTML tags and boilerplate
2. Removes navigation/headers/footers
3. Extracts main content area
4. Cleans up whitespace
5. Limits to 5000 characters per document
6. Splits into sections (chunks)

### Limitations

- Some government websites may block automated requests
- Dynamic content (JavaScript-rendered) won't be captured
- PDF documents need additional parsing library
- May require User-Agent header spoofing
- Some sites rate-limit requests

## Chunk Structure

When documents are ingested, they're split into chunks by markdown sections:

```
Document: Tax Registration
├─ Chunk 0: Overview (150 chars)
├─ Chunk 1: Step 1: Online Registration (200 chars)
├─ Chunk 2: Step 2: Physical Registration (180 chars)
├─ Chunk 3: Required Documents (220 chars)
└─ Chunk 4: Cost and Timeline (120 chars)
```

Each chunk:
- Preserves section context
- Maintains document link
- Stores position within section
- Can be retrieved independently or as part of section

## Retrieval

When users ask questions, the RAG system:

1. Tokenizes the question
2. Searches all chunks by keyword relevance
3. Returns top-K chunks with section information
4. LLM synthesizes answer using context
5. Provides source citations

Example retrieval:

```
Question: "How do I register for tax?"
↓
Retrieved Chunks:
  - Document: FIRS Tax Registration
    Section: Step 1: Online Registration
    Relevance: 95%
  - Document: FIRS Tax Registration
    Section: Step 2: Physical Registration
    Relevance: 88%
↓
LLM Answer: "Based on FIRS documentation, you can register for tax
either online at taxes.firs.gov.ng or physically at any FIRS office.
[section: Step 1: Online Registration]"
```

## Best Practices

### For Hardcoded Documents
1. ✅ Use markdown headers for clear section structure
2. ✅ Keep content accurate and up-to-date
3. ✅ Include cost and timeline information
4. ✅ Test ingestion after adding documents
5. ✅ Version control the documents

### For Fetched Documents
1. ✅ Use reliable government sources with stable URLs
2. ✅ Test fetch individually before adding to production
3. ✅ Handle network timeouts gracefully
4. ✅ Monitor fetch success rate
5. ✅ Fall back to cached versions if fetch fails

### For Both
1. ✅ Include agency/source in metadata
2. ✅ Add official URLs for verification
3. ✅ Keep documents under 10KB for optimal chunking
4. ✅ Use consistent formatting across documents
5. ✅ Update documents regularly (monthly recommended)

## Hybrid Approach (Recommended)

For production systems, use both methods:

```
Hardcoded Documents:
├─ Critical services (always available)
├─ Well-curated content (verified accuracy)
└─ Manually updated (quality control)

Fetched Documents:
├─ Supplementary information (reference only)
├─ Live data (economic indicators, statistics)
└─ Auto-updated (no manual work)
```

**Ingestion workflow:**

```bash
# 1. Ingest curated hardcoded documents first
npm run rag:ingest-all

# 2. Try to fetch live updates (optional)
npm run rag:fetch

# 3. Verify ingestion
sqlite3 data/ngscorecard.db "SELECT COUNT(*) FROM rag_documents;"

# 4. Start the server
npm run dev
```

## Troubleshooting

### Fetch script returns no content

**Cause**: Website blocked automated access or content is dynamically loaded

**Solution**: 
- Check if website requires JavaScript rendering
- Add to hardcoded documents instead
- Use a headless browser library (Puppeteer) for JavaScript-heavy sites

### Documents too large

**Cause**: Website includes too much boilerplate content

**Solution**:
- Content is limited to 5000 chars, increase if needed
- Extract specific pages manually and add as hardcoded documents
- Use targeted CSS selectors to extract main content

### Chunks are too large or too small

**Cause**: Markdown structure doesn't match website layout

**Solution**:
- For hardcoded: Adjust markdown headers
- For fetched: Pre-process content before adding
- Consider section size when structuring documents

## Performance

- **Ingestion time**: ~1 minute for 28 documents (100-150 chunks)
- **Query latency**: <100ms for keyword search across all chunks
- **Storage**: ~5-10MB for 100-150 documents
- **Memory**: ~50MB during ingestion, ~10MB runtime

## Next Steps

1. Choose ingestion method based on your needs
2. Configure sources/documents
3. Test ingestion: `npm run rag:ingest-all` or `npm run rag:fetch`
4. Verify in database: `sqlite3 data/ngscorecard.db`
5. Start server and test Q&A: `npm run dev`

