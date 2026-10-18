# The Ask page's documents

The Ask page (`/services`) answers questions from a corpus of documents stored in
two tables, `rag_documents` and `rag_chunks`. **No document text is written in
this repository.** Every document is built from data fetched from a source; today
the only source is the Government Service Portal.

## Loading the corpus

```bash
npm run rag:sync-portal                    # fetch everything, show what would change, write nothing
npm run rag:sync-portal -- --apply         # write (Turso if TURSO_DATABASE_URL is set, else data/ngscorecard.db)
npm run rag:sync-portal -- --from-file data/portal-snapshot.json   # reuse a saved fetch, no requests
npm run rag:sync-portal -- --limit 3       # a quick trial on the first 3 agencies
npm run rag:sync-portal -- --delay 600     # milliseconds between requests (default 400)
```

It reads the portal's JSON backend (`gsp.galaxybackbone.com.ng`, the same calls
services.gov.ng makes itself), one request at a time and paced (about 190
requests, a minute or two), and saves the raw responses to
`data/portal-snapshot.json`. It builds one document per service and one per
agency profile, each with a deep link to its portal page.

- **Safe to re-run.** Documents are matched on the portal's own ids, so a service
  renamed at the source updates in place. Unchanged documents are only re-dated,
  and that date (`fetched_at`) is the "checked on" date shown beside each source.
- **It never deletes.** A service the portal no longer lists is reported and left
  in place. A partial fetch is refused for `--apply` unless `--allow-partial`.
- **Dry run first.** It prints its target (Turso host or file) before anything
  runs, and only writes with `--apply`.

### The portal's data is unfinished

The portal is a pilot. `server/portalSource.js` deals with that, and the sync
reports what it did:

- **Placeholder fees.** Most services list a fee of 0 (a few list 1, 3 or 13). A fee
  under ₦100 is stated as "no usable fee, confirm with the agency", never as a price.
- **Placeholder agency contacts.** Most agency profiles hold test data (an address of
  "6876778", an email of "sfsdf@sdfsd.com", a website of "fdfd.com"). A contact field
  is kept only if it looks real; the enquiry text each agency wrote on its own service
  pages is kept as written.
- **Test and probe records** are skipped: an agency "Test MDA", and a service named
  "SSRF_<digits>" whose backend field is the cloud-metadata address.
- **"Coming soon".** Most services are marked coming soon for online application; the
  document says so, so the assistant does not send people to apply there.
- **Boilerplate.** About a third of the services carry templated text ("X is a flagship
  initiative overseen by…"). It is kept as published, but it says little.

The portal has no robots.txt and no published terms or API documentation, and the
endpoints appear to be internal to the site. Ask Galaxy Backbone or the Ministry of
Communications, Innovation and Digital Economy for a documented data feed before
relying on this for production.

## Removing documents

`rag:remove` is the only script that deletes anything. It removes the documents of
one origin, after backing them up.

```bash
npm run rag:remove -- --origin none            # dry run: documents with no origin (the old hand-written ones)
npm run rag:remove -- --origin none --apply    # back them up to data/backups/, then remove them
npm run rag:remove -- --origin portal          # the same for the portal documents
```

`--origin` is required. Removing the origin-less documents is refused while no
portal documents are loaded, so the corpus cannot be emptied by mistake.

## How a question is searched

1. **Preparation (one cheap model call, `RAG_REWRITE_MODEL`).** The question goes to a
   small model that returns a standalone version of it (this matters for follow-ups
   like "and for minors?") and up to 8 *search terms*: the formal words the service
   pages use for what the person said in everyday ones ("scammed online" gives
   cybercrime, fraud, report). If the call fails, the question is searched exactly as
   typed, so retrieval never depends on it.
2. **Ranking.** BM25 over the chunks. The user's own words count in full; the added
   terms count for half (`EXPANSION_WEIGHT` in `server/rag.js`), so they can bring a
   service into view without outvoting the question.
3. **Whole documents.** The best chunks pick the best documents, and each document is
   handed to the model whole (up to about 1,500 tokens), once, in reading order. A
   question about "steps and requirements" therefore sees both, even when only one of
   them matched.
4. **Answer (`RAG_MODEL`).** The model answers only from those documents and cites
   them. The Ask page shows the terms that were searched ("Also searched: ...").

Both models are set with environment variables (see `.env.example`). Cost per question
on Haiku is a few hundredths of a cent for each of the two calls; Sonnet is about 20
times that.

## How documents are chunked

`chunkText` (server/rag.js) splits at markdown headings, keeps each heading with
its body inside the chunk text, and merges neighbouring sections up to ~200
tokens, so one chunk can hold related steps, fees and timelines. A section
larger than that is split by lines with its heading repeated. No text is
dropped (covered by test/rag-chunker.test.mjs).

## Rebuilding chunks after a chunker change

Chunks are derived from each document's stored `content`, so a chunker fix does
not need a re-fetch:

```bash
npm run rag:rechunk                 # dry run: shows how many documents would change
npm run rag:rechunk -- --apply      # replace chunks (Turso if TURSO_DATABASE_URL is set, else data/ngscorecard.db)
npm run rag:rechunk -- --db path    # a specific local SQLite file
```

Run `npm run eval:rag` afterwards to confirm retrieval did not regress.

## Where a document came from

Each stored document records its `origin` (`portal`, or empty for documents loaded
before provenance existed), the portal's `external_id`, and `fetched_at`. Retrieval
returns them, and the Ask page shows "Government Service Portal, checked <date>" on
portal sources.
