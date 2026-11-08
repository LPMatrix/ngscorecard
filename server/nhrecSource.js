// NHREC (National Health Research Ethics Committee of Nigeria) as a document source.
// Site: https://nhrec.gov.ng (WordPress)
//
// Crawls page and post URLs from the WordPress XML sitemaps, fetches each page,
// extracts the main article text, and returns documents for the RAG corpus.
// Paced and retried like portalSource.js; nothing is written here.

import { htmlToText } from './portalSource.js'

export const NHREC_ORIGIN = 'nhrec'
export const NHREC_URL = 'https://nhrec.gov.ng'
const SITEMAP_INDEX_PATH = '/sitemap.xml'

// Slugs that are WordPress demo content or media-only pages (no useful text)
const SKIP_SLUGS = new Set([
  'test-page', 'picture-gallery',
  'hello-world', 'this-is-a-post-with-post-type-link',
  'a-nice-post', 'a-nice-entry', 'a-small-gallery',
  'entry-with-post-format-video', 'entry-without-preview-image',
  'entry-with-audio', 'a-nice-post-2', 'post1', 'pdf-edu',
])

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// --- HTTP client (paced, retried, same contract as portalSource.js) -----------

export function createNhrecClient({
  fetchImpl = globalThis.fetch,
  delayMs = 600,
  retries = 3,
  timeoutMs = 25000,
  userAgent = 'NGScorecard-corpus-sync/1.0 (+https://ngscorecard.ng; read-only, paced)',
} = {}) {
  let nextSlot = 0
  let requests = 0

  async function getHtml(url) {
    for (let attempt = 0; ; attempt++) {
      const slot = Math.max(Date.now(), nextSlot)
      nextSlot = slot + delayMs
      if (slot > Date.now()) await sleep(slot - Date.now())
      requests++
      try {
        const res = await fetchImpl(url, {
          headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': userAgent },
          signal: AbortSignal.timeout(timeoutMs),
          redirect: 'follow',
        })
        if (res.status === 404) return { notFound: true }
        if (res.status === 429 || res.status >= 500) {
          const err = new Error(`HTTP ${res.status} for ${url}`)
          err.retryAfterMs = Number(res.headers?.get?.('retry-after')) * 1000 || null
          throw err
        }
        if (!res.ok) { const err = new Error(`HTTP ${res.status} for ${url}`); err.fatal = true; throw err }
        return { html: await res.text() }
      } catch (e) {
        if (e.fatal || attempt >= retries) throw e
        await sleep(e.retryAfterMs ?? Math.min(10000, 1000 * 2 ** attempt))
      }
    }
  }

  return { getHtml, get requestCount() { return requests } }
}

// --- XML sitemap parser -------------------------------------------------------

function parseSitemapUrls(xml) {
  // WordPress sitemaps: either a sitemap index (<sitemapindex>) or a URL set (<urlset>)
  const urls = []
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    urls.push(m[1].trim())
  }
  return urls
}

// Fetch the sitemap index then each child sitemap; return all page/post URLs.
export async function collectUrls(client) {
  const index = await client.getHtml(NHREC_URL + SITEMAP_INDEX_PATH)
  if (!index.html) throw new Error('Could not fetch NHREC sitemap index')

  const childSitemaps = parseSitemapUrls(index.html)
    .filter(u => u.includes('wp-sitemap-posts-page') || u.includes('wp-sitemap-posts-post'))

  const urls = []
  for (const sm of childSitemaps) {
    const r = await client.getHtml(sm)
    if (!r.html) continue
    for (const u of parseSitemapUrls(r.html)) {
      if (u.startsWith(NHREC_URL)) urls.push(u)
    }
  }
  return [...new Set(urls)]
}

// --- HTML content extraction --------------------------------------------------

function extractTitle(html) {
  const og = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
  if (og) return og[1].split(' - NHREC')[0].split(' | NHREC')[0].trim()
  const title = html.match(/<title[^>]*>([^<]+)/i)
  if (title) return title[1].split(' - NHREC')[0].split(' | NHREC')[0].split(' &#8211;')[0].trim()
  const h1 = html.match(/<h1[^>]*>([^<]+)/i)
  return h1 ? h1[1].trim() : ''
}

// Extract the main content region: article body, stripped of nav/widget noise.
function extractContentHtml(html) {
  // Prefer the entry-content div (WordPress standard)
  const entryStart = html.search(/<div[^>]+class="[^"]*entry-content[^"]*"/i)
  if (entryStart !== -1) {
    // Find the matching </article> or just take 50 kB
    const cut = html.indexOf('</article>', entryStart)
    return cut !== -1 ? html.slice(entryStart, cut) : html.slice(entryStart, entryStart + 50000)
  }

  // Fallback: everything between the first <h1> and the first <footer
  const h1Start = html.search(/<h1[\s>]/i)
  if (h1Start !== -1) {
    const footerStart = html.search(/<footer[\s>]/i)
    return footerStart !== -1 ? html.slice(h1Start, footerStart) : html.slice(h1Start, h1Start + 50000)
  }

  // Last resort: full HTML (htmlToText will strip the tags)
  return html
}

function minWords(text, min = 20) {
  return text.split(/\s+/).filter(Boolean).length >= min
}

// --- Crawl -------------------------------------------------------------------

export async function crawlNhrec(client, { onProgress = () => {} } = {}) {
  const allUrls = await collectUrls(client)

  const pages = []
  const failures = []

  for (const [i, url] of allUrls.entries()) {
    const slug = url.replace(NHREC_URL, '').replace(/^\/|\/$/g, '').split('/').pop() || 'home'
    onProgress({ index: i + 1, total: allUrls.length, slug })

    if (SKIP_SLUGS.has(slug)) continue

    try {
      const r = await client.getHtml(url)
      if (r.notFound) { failures.push({ url, error: 'not found' }); continue }

      const title = extractTitle(r.html)
      const contentHtml = extractContentHtml(r.html)
      const content = htmlToText(contentHtml)

      if (!minWords(content)) continue // skip near-empty pages

      pages.push({ url, slug, title: title || slug, content, fetchedAt: new Date().toISOString() })
    } catch (e) {
      failures.push({ url, error: e.message })
    }
  }

  return {
    source: NHREC_URL,
    fetchedAt: new Date().toISOString(),
    pages,
    failures,
  }
}

// --- Map to RAG documents ----------------------------------------------------

export function nhrecDocuments(crawl) {
  const docs = []
  const warnings = []

  for (const page of crawl.pages) {
    const path = new URL(page.url).pathname.replace(/\/+$/, '') || '/'
    docs.push({
      source: 'NHREC',
      title: page.title,
      url: page.url,
      content: `# ${page.title}\n\nSource: National Health Research Ethics Committee of Nigeria (NHREC)\nURL: ${page.url}\n\n${page.content}`,
      externalId: path,
    })
  }

  const stats = { pages: crawl.pages.length, documents: docs.length }
  return { docs, stats, warnings }
}
