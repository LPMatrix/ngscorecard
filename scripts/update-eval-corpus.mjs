#!/usr/bin/env node
// Refresh the corpus the retrieval evals run against: a dated, trimmed copy of a
// portal snapshot (npm run rag:sync-portal saves one to data/portal-snapshot.json).
// It is data fetched from the portal, not text written for the repo. Only the
// fields the document builder reads are kept, in a stable order, so a refresh
// produces a small, reviewable diff.
//
//   npm run eval:rag:corpus                       from data/portal-snapshot.json
//   npm run eval:rag:corpus -- --from-file <f>    from another snapshot
//
// After refreshing, run `npm run eval:rag` and, if scores moved for understood
// reasons, `npm run eval:rag -- --write-baseline`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const i = args.indexOf('--from-file')
const from = path.resolve(i !== -1 ? args[i + 1] : path.join(__dirname, '../data/portal-snapshot.json'))
const to = path.join(__dirname, '../evals/rag/corpus/portal-snapshot.json')

const PROVIDER_FIELDS = ['id', 'name', 'slug', 'abbr', 'summary', 'about', 'vision', 'mission', 'address', 'phone_number', 'email_address', 'weblink', 'location', 'state', 'archived_at']
const SERVICE_FIELDS = ['id', 'name', 'slug', 'summary', 'service_fees', 'timeline_hrs', 'backend_service', 'archived_at']
const SECTION_FIELDS = ['section_title', 'section_description']
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o?.[k] !== undefined).map(k => [k, o[k]]))

const snap = JSON.parse(fs.readFileSync(from, 'utf8'))
if (!snap.providers?.length) { console.error(`No agencies in ${from}`); process.exit(1) }

const out = {
  source: snap.source,
  fetchedAt: snap.fetchedAt,
  providers: snap.providers.map(p => ({
    nav: pick(p.nav, ['slug', 'name', 'abbr']),
    detail: pick(p.detail, PROVIDER_FIELDS),
    services: p.services.map(s => ({ ...pick(s, SERVICE_FIELDS), serviceSection: (s.serviceSection ?? []).map(x => pick(x, SECTION_FIELDS)) })),
  })),
}
fs.mkdirSync(path.dirname(to), { recursive: true })
fs.writeFileSync(to, JSON.stringify(out, null, 1) + '\n')
const kb = Math.round(fs.statSync(to).size / 1024)
console.log(`Wrote ${path.relative(process.cwd(), to)}: ${out.providers.length} agencies, ${out.providers.reduce((n, p) => n + p.services.length, 0)} services, ${kb} KB (portal data fetched ${out.fetchedAt})`)
