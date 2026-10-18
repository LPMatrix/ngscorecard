// Starter questions for the Ask page, chosen from the corpus itself rather than
// written by hand. A suggestion is a portal service that is well documented (a
// real fee, real steps, not templated boilerplate), at most one per agency, so
// the page offers questions the documents can actually answer.
//
// The question is a fixed template around the service's own name; the name and
// the choice of services come from the data.

const FEE = /The portal lists the fee as ₦/
const BOILERPLATE = /is a flagship initiative overseen by/

// "FRSC (Renewal of Driver’s License)" -> "Renewal of Driver’s License"
export function serviceName(title, abbr) {
  const t = String(title ?? '').trim()
  const prefix = `${abbr} (`
  return t.startsWith(prefix) && t.endsWith(')') ? t.slice(prefix.length, -1).trim() : t
}

export function buildSuggestions(documents, { count = 3 } = {}) {
  const candidates = documents
    .filter(d => String(d.external_id ?? d.externalId ?? '').startsWith('service:'))
    .filter(d => FEE.test(d.content) && !BOILERPLATE.test(d.content))
    .map(d => ({ doc: d, size: d.content.length }))
    .sort((a, b) => b.size - a.size || String(a.doc.title).localeCompare(String(b.doc.title)))

  const seen = new Set()
  const out = []
  for (const { doc } of candidates) {
    if (seen.has(doc.source)) continue
    seen.add(doc.source)
    const name = serviceName(doc.title, doc.source)
    out.push({
      label: `${name} (${doc.source})`,
      question: `What are the steps and requirements for ${name}?`,
      source: doc.source,
      title: doc.title,
    })
    if (out.length >= count) break
  }
  return out
}

// Offer only suggestions that work: each candidate's question is run through
// retrieval (`search`), and it is kept only if its own service comes back in the
// top 3. A starter question that fails would teach visitors the page is broken.
export async function pickSuggestions(documents, search, { count = 3, pool = 12 } = {}) {
  const out = []
  for (const candidate of buildSuggestions(documents, { count: pool })) {
    const results = await search(candidate.question)
    if (results.slice(0, 3).some(r => r.title === candidate.title && r.source === candidate.source)) out.push(candidate)
    if (out.length >= count) break
  }
  return out
}
