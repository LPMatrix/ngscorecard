// The Government Service Portal (https://services.gov.ng) as a document source.
//
// The portal is a Next.js app whose pages are empty shells; the content comes
// from a JSON backend run by Galaxy Backbone, the same calls the site makes
// itself:
//   get-providers-for-nav                 every agency
//   get-provider-detail-by-slug/<agency>  the agency profile and its service list
//   get-service-detail-by-slug/<service>  one service: summary, fee, timeline, steps
//
// This module fetches those politely (one request at a time, paced, retried),
// and turns what comes back into documents for the RAG corpus: one per service
// and one per agency profile, each with a deep link to its portal page. It does
// no database work, so it can be tested with a saved snapshot.
//
// The portal is a pilot and its data is unfinished (placeholder fees, services
// marked "coming soon", typos). The mapper keeps what is usable, says plainly
// what the portal lists rather than asserting it as fact, and reports anything
// it had to drop or doubt.

export const PORTAL_URL = 'https://services.gov.ng'
export const API_BASE = 'https://gsp.galaxybackbone.com.ng/backend/api/user/'
export const PORTAL_ORIGIN = 'portal'

// --- HTML to plain text -----------------------------------------------------

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…',
}

const fromCodePoint = (n) => {
  try { return String.fromCodePoint(n) } catch { return '' }
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

const stripTags = (s) => s.replace(/<[^>]+>/g, '')

// Section text arrives as HTML from a CMS. Keep the reading order, lists and
// the addresses behind links ("click here (https://...)"), drop everything
// else. The result is plain text: nothing from the portal is ever kept as markup.
export function htmlToText(html) {
  if (html == null) return ''
  let s = String(html)
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const text = decodeEntities(stripTags(inner)).replace(/\s+/g, ' ').trim()
    const url = decodeEntities(href).trim()
    if (/^https?:\/\//i.test(url) && text && text !== url) return `${text} (${url})`
    return text || (/^https?:\/\//i.test(url) ? url : '')
  })
  s = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|ul|ol|table|tr|section)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
  s = decodeEntities(stripTags(s))

  const lines = s.split('\n').map(l =>
    // a leading # would be read as a heading by the chunker
    l.replace(/[ \t ​﻿]+/g, ' ').trim().replace(/^#+\s+/, ''))
  const out = []
  for (const line of lines) {
    if (line === '' && (out.length === 0 || out[out.length - 1] === '')) continue
    out.push(line)
  }
  while (out.at(-1) === '') out.pop()
  return out.join('\n')
}

// --- fee and field rules ----------------------------------------------------

// Fees on the portal are often unfilled: 98 of 142 services list 0, two list 1,
// and others list 3 or 13, none of which is a real price in naira. Stating "the
// fee is 0" would tell people a service is free when nobody has said so, so only
// a plausible amount (100 or more) is reported as a fee; everything else is
// described as "no usable fee" and the reader is sent to the agency.
export const MIN_PLAUSIBLE_FEE = 100
export function feeLine(value) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < MIN_PLAUSIBLE_FEE) return null
  return `The portal lists the fee as ₦${n.toLocaleString('en-US')}.`
}

// The portal's live data includes a security researcher's probe record (a
// "service" named SSRF_<digits> whose summary is "x") and a "Test MDA" agency.
// Anything that looks like that is left out rather than turned into an answer.
const TEST_LIKE = /\b(test|dummy|lorem|ipsum|sample|demo|ssrf|xss|sqli|payload|pentest)\b/i
const PROBE_LIKE = /^[a-z]+_?\d{8,}$/i
export function looksLikeTestData(...names) {
  return names.some(n => {
    const v = String(n ?? '').replace(/[-_]+/g, ' ').trim()
    return TEST_LIKE.test(v) || PROBE_LIKE.test(String(n ?? '').trim())
  })
}

const clean = (v) => (v == null ? '' : htmlToText(String(v)))
const oneLine = (v) => clean(v).replace(/\s+/g, ' ').trim()

const serviceUrl = (providerSlug, serviceSlug) => `${PORTAL_URL}/service-provider/${providerSlug}/${serviceSlug}`
const providerUrl = (providerSlug) => `${PORTAL_URL}/service-provider/${providerSlug}`

// --- mapping to documents ---------------------------------------------------

// The agency profiles on the portal hold test data (an address of "6876778", a
// phone of "798897889", an email of "sfsdf@sdfsd.com", a website of "sdfsdf"),
// and presenting that as an agency's contact details would send people to
// nowhere. Each field is therefore only used if it looks real; anything that does
// not is dropped and reported. The service pages carry their own contact text
// written by the agency, which is kept as it is.
const NG_PHONE = /^(\+\d{10,15}|0\d{9,11})$/
const SECOND_LEVEL = new Set(['gov', 'org', 'edu', 'com', 'net', 'co', 'sch'])

function hostOf(website) {
  const w = String(website ?? '').trim()
  if (!w) return ''
  try {
    const host = new URL(/^https?:\/\//i.test(w) ? w : `https://${w}`).hostname.toLowerCase().replace(/^www\./, '')
    // Nigerian agencies use .ng addresses; the profiles' "fdfd.com" is test data
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && host.endsWith('.ng') ? host : ''
  } catch { return '' }
}

function registrable(host) {
  const parts = host.split('.')
  return parts.length >= 3 && SECOND_LEVEL.has(parts.at(-2)) ? parts.slice(-3).join('.') : parts.slice(-2).join('.')
}

export function validContact(provider) {
  const lines = []
  const dropped = []

  const website = hostOf(provider.weblink)
  const address = oneLine(provider.address)
  if (address) {
    if (address.length >= 12 && /[A-Za-z]{3,}/.test(address) && address.split(/\s+/).length >= 2) lines.push(`- Address: ${address}`)
    else dropped.push('Address')
  }

  const rawPhone = oneLine(provider.phone_number)
  if (rawPhone) {
    const numbers = [...new Set(rawPhone.split(/[;,/]| or /i).map(p => p.replace(/[\s().-]/g, '')).filter(p => NG_PHONE.test(p)))]
    if (numbers.length) lines.push(`- Phone: ${numbers.join(', ')}`)
    else dropped.push('Phone')
  }

  const email = oneLine(provider.email_address).toLowerCase()
  if (email) {
    const domain = email.split('@')[1] ?? ''
    const shape = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)
    const trusted = domain.endsWith('.gov.ng') || (website && registrable(domain) === registrable(website))
    if (shape && trusted) lines.push(`- Email: ${email}`)
    else dropped.push('Email')
  }

  if (provider.weblink && String(provider.weblink).trim()) {
    if (website) lines.push(`- Website: ${website}`)
    else dropped.push('Website')
  }

  return { lines, dropped }
}

export function serviceDocument(provider, service) {
  const warnings = []
  const name = oneLine(service.name)
  if (looksLikeTestData(service.name, service.slug)) {
    return { doc: null, warnings, skipped: 'looks like test or probe data' }
  }
  const lines = [`# ${name}`, `Provided by ${provider.name} (${provider.abbr}) and listed on the Government Service Portal.`, '']

  // a one-character summary ("x") is a placeholder, not a description
  const rawSummary = clean(service.summary)
  const summary = rawSummary.length >= 20 ? rawSummary : ''
  if (summary) lines.push('## About this service', summary, '')

  const facts = []
  const fee = feeLine(service.service_fees)
  facts.push(`- Fee: ${fee ?? 'the portal does not give a usable fee for this service. Confirm the fee with the agency.'}`)
  const timeline = oneLine(service.timeline_hrs)
  if (timeline) facts.push(`- Processing time: the portal lists ${timeline}.`)
  if (service.backend_service === 'coming-soon') facts.push('- Online application through the portal: the portal marks this as coming soon.')
  if (facts.length) lines.push('## Fee and processing time', ...facts, '')

  let sectionsWithText = 0
  for (const section of service.serviceSection ?? []) {
    const title = oneLine(section.section_title)
    const text = clean(section.section_description)
    if (!text) { if (title) warnings.push(`section "${title}" is empty`); continue }
    sectionsWithText++
    lines.push(`## ${title || 'More information'}`, text, '')
  }

  const { lines: contact } = validContact(provider)
  if (contact.length) lines.push(`## ${provider.abbr} contact details (from the agency's portal profile)`, ...contact, '')

  const sectionChars = lines.join('\n').length
  if (!summary && sectionsWithText === 0) {
    return { doc: null, warnings, skipped: 'no summary and no sections' }
  }
  if (!summary && sectionChars < 400) {
    return { doc: null, warnings, skipped: 'no real summary and very little text' }
  }
  if (!summary) warnings.push('no usable summary')

  return {
    doc: {
      source: provider.abbr,
      title: name,
      url: serviceUrl(provider.slug, service.slug),
      content: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
      origin: PORTAL_ORIGIN,
      externalId: `service:${provider.slug}/${service.slug}`,
    },
    warnings,
    skipped: null,
  }
}

export function providerDocument(provider, serviceNames) {
  const warnings = []
  if (looksLikeTestData(provider.name, provider.slug)) {
    return { doc: null, warnings, skipped: 'looks like test or probe data' }
  }
  const lines = [`# ${provider.name} (${provider.abbr})`, 'This agency is listed on the Government Service Portal.', '']

  const summary = clean(provider.summary)
  const about = clean(provider.about)
  if (summary) lines.push('## About', summary, '')
  if (about && about !== summary) lines.push(summary ? '## More about the agency' : '## About', about, '')
  const vision = clean(provider.vision)
  const mission = clean(provider.mission)
  if (vision) lines.push('## Vision', vision, '')
  if (mission) lines.push('## Mission', mission, '')

  const { lines: contact, dropped } = validContact(provider)
  if (dropped.length) warnings.push(`profile contact fields look like placeholder data and were left out: ${dropped.join(', ')}`)
  if (contact.length) lines.push('## Contact details', ...contact, '')
  if (serviceNames.length) lines.push('## Services listed on the portal', ...serviceNames.map(n => `- ${n}`), '')

  const hasInfo = summary || about || vision || mission || contact.length
  if (!hasInfo) return { doc: null, warnings, skipped: 'no profile information' }

  return {
    doc: {
      source: provider.abbr,
      title: `${provider.name} (${provider.abbr}): about and contact`,
      url: providerUrl(provider.slug),
      content: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
      origin: PORTAL_ORIGIN,
      externalId: `provider:${provider.slug}`,
    },
    warnings,
    skipped: null,
  }
}

// snapshot -> { docs, stats, warnings: [{ where, message }], skipped: [{ where, reason }] }
export function portalDocuments(snapshot) {
  const docs = []
  const warnings = []
  const skipped = []
  let services = 0
  let comingSoon = 0
  let unusableFees = 0

  for (const entry of snapshot.providers ?? []) {
    const provider = { ...(entry.nav ?? {}), ...(entry.detail ?? {}) }
    if (!provider.slug || !provider.abbr) { skipped.push({ where: provider.slug || provider.name || '(unnamed agency)', reason: 'missing slug or abbreviation' }); continue }
    if (provider.archived_at) { skipped.push({ where: provider.slug, reason: 'archived on the portal' }); continue }

    const names = []
    for (const service of entry.services ?? []) {
      services++
      const where = `${provider.abbr}/${service.slug}`
      if (service.archived_at) { skipped.push({ where, reason: 'archived on the portal' }); continue }
      const r = serviceDocument(provider, service)
      r.warnings.forEach(message => warnings.push({ where, message }))
      if (!r.doc) { skipped.push({ where, reason: r.skipped }); continue }
      docs.push(r.doc)
      names.push(r.doc.title)
      if (service.backend_service === 'coming-soon') comingSoon++
      if (feeLine(service.service_fees) === null) unusableFees++
    }

    const p = providerDocument(provider, names)
    p.warnings.forEach(message => warnings.push({ where: provider.slug, message }))
    if (p.doc) docs.push(p.doc)
    else skipped.push({ where: provider.slug, reason: p.skipped })
  }

  // two documents with the same (source, title) would be indistinguishable to a reader
  const seen = new Map()
  for (const d of docs) {
    const key = `${d.source}|${d.title}`
    if (seen.has(key)) warnings.push({ where: d.externalId, message: `same title as ${seen.get(key)}` })
    else seen.set(key, d.externalId)
  }

  return {
    docs,
    warnings,
    skipped,
    stats: {
      providers: (snapshot.providers ?? []).length,
      services,
      documents: docs.length,
      serviceDocuments: docs.filter(d => d.externalId.startsWith('service:')).length,
      comingSoon,
      unusableFees,
      providerDocuments: docs.filter(d => d.externalId.startsWith('provider:')).length,
    },
  }
}

// --- fetching ---------------------------------------------------------------

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Requests are spaced at least delayMs apart (even if callers overlap). 429 and 5xx and network errors
// are retried with backoff (honouring Retry-After); other 4xx are not. A 404 is
// reported as { notFound: true } so one missing page does not stop a crawl.
export function createPortalClient({
  fetchImpl = globalThis.fetch,
  delayMs = 400,
  retries = 3,
  timeoutMs = 20000,
  userAgent = 'NGScorecard-corpus-sync/1.0 (+https://ngscorecard.ng; read-only, paced)',
  baseUrl = API_BASE,
} = {}) {
  let nextSlot = 0
  let requests = 0

  async function getJson(path) {
    const url = baseUrl + path
    for (let attempt = 0; ; attempt++) {
      // Reserve this request's time slot before waiting, so that even concurrent
      // callers are spaced delayMs apart rather than all waking together.
      const slot = Math.max(Date.now(), nextSlot)
      nextSlot = slot + delayMs
      if (slot > Date.now()) await sleep(slot - Date.now())
      requests++
      try {
        const res = await fetchImpl(url, {
          headers: { accept: 'application/json', 'user-agent': userAgent },
          signal: AbortSignal.timeout(timeoutMs),
        })
        if (res.status === 404) return { notFound: true }
        if (res.status === 429 || res.status >= 500) {
          const err = new Error(`HTTP ${res.status} for ${path}`)
          err.retryAfterMs = Number(res.headers?.get?.('retry-after')) * 1000 || null
          throw err
        }
        if (!res.ok) { const err = new Error(`HTTP ${res.status} for ${path}`); err.fatal = true; throw err }
        return await res.json()
      } catch (e) {
        if (e.fatal || attempt >= retries) throw e
        await sleep(e.retryAfterMs ?? Math.min(10000, 1000 * 2 ** attempt))
      }
    }
  }

  return { getJson, get requestCount() { return requests } }
}

// Crawl every agency and service. Per-item failures are recorded and the crawl
// continues; if the agency list itself cannot be read there is nothing to do.
export async function crawlPortal(client, { limitProviders = null, onProgress = () => {} } = {}) {
  const nav = await client.getJson('get-providers-for-nav')
  if (!Array.isArray(nav?.data)) throw new Error('The portal did not return an agency list (has the API changed?)')

  const providers = limitProviders ? nav.data.slice(0, limitProviders) : nav.data
  const failures = []
  const out = []

  for (const [i, p] of providers.entries()) {
    onProgress({ stage: 'provider', index: i + 1, total: providers.length, slug: p.slug })
    let detail
    try {
      const r = await client.getJson(`get-provider-detail-by-slug/${p.slug}`)
      if (r.notFound || !r.data) { failures.push({ path: `provider/${p.slug}`, error: 'not found' }); continue }
      detail = r.data
    } catch (e) {
      failures.push({ path: `provider/${p.slug}`, error: e.message }); continue
    }

    const services = []
    for (const s of detail.services ?? []) {
      try {
        const r = await client.getJson(`get-service-detail-by-slug/${s.slug}`)
        if (r.notFound || !r.data) { failures.push({ path: `service/${s.slug}`, error: 'not found' }); continue }
        services.push(r.data)
      } catch (e) {
        failures.push({ path: `service/${s.slug}`, error: e.message })
      }
    }
    const { services: _list, ...profile } = detail
    out.push({ nav: p, detail: profile, services })
  }

  return {
    source: PORTAL_URL,
    apiBase: API_BASE,
    fetchedAt: new Date().toISOString(),
    providers: out,
    failures,
  }
}
