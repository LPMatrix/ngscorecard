/**
 * Real-time Tracker — monitors news feeds for new government promises
 * Screens articles for trackable statements and routes them to an editorial queue
 */

import { chatText, parseJsonReply, DEFAULT_MODEL } from './openrouter.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const QUEUE_FILE = join(__dirname, '../data/promise-queue.json')

// An OpenRouter model id; override with AI_TOOLS_MODEL without a code change.
const MODEL = process.env.AI_TOOLS_MODEL || DEFAULT_MODEL

// Nigerian government and news RSS feeds to monitor
const DEFAULT_FEEDS = [
  { name: 'Presidency', url: 'https://statehouse.gov.ng/feed/' },
  { name: 'NAN', url: 'https://nanews.ng/feed/' },
  { name: 'Punch', url: 'https://punchng.com/feed/' },
  { name: 'Vanguard', url: 'https://www.vanguardngr.com/feed/' },
  { name: 'Guardian Nigeria', url: 'https://guardian.ng/feed/' },
  { name: 'Premium Times', url: 'https://premiumtimesng.com/feed' },
  { name: 'ThisDay', url: 'https://thisdaylive.com/index.php/feed/' },
]

// ── Queue persistence ──────────────────────────────────────────────────────

function readQueue() {
  if (!existsSync(QUEUE_FILE)) return []
  try {
    return JSON.parse(readFileSync(QUEUE_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeQueue(items) {
  writeFileSync(QUEUE_FILE, JSON.stringify(items, null, 2))
}

export function getQueue() {
  return readQueue()
}

export function dismissQueueItem(id) {
  const queue = readQueue()
  const updated = queue.filter(item => item.id !== id)
  writeQueue(updated)
  return { success: true }
}

export function clearApprovedItems() {
  const queue = readQueue().filter(item => item.status === 'pending')
  writeQueue(queue)
  return { cleared: true }
}

// ── RSS parsing ────────────────────────────────────────────────────────────

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'NGScorecard/1.0 (+https://ngscorecard.com)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()

    // Simple XML item extraction — pulls title + description from <item> tags
    const items = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1]
      const title = (/<title[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) || /<title[^>]*>(.*?)<\/title>/i.exec(block) || [])[1] || ''
      const desc = (/<description[^>]*><!\[CDATA\[(.*?)\]\]>/i.exec(block) || /<description[^>]*>(.*?)<\/description>/i.exec(block) || [])[1] || ''
      const link = (/<link[^>]*>(.*?)<\/link>/i.exec(block) || [])[1] || ''
      const pubDate = (/<pubDate[^>]*>(.*?)<\/pubDate>/i.exec(block) || [])[1] || ''

      if (title) {
        items.push({
          source: feed.name,
          title: title.trim(),
          description: desc.replace(/<[^>]+>/g, ' ').trim().slice(0, 500),
          link: link.trim(),
          pubDate: pubDate.trim(),
        })
      }
    }
    return items.slice(0, 10) // max 10 items per feed
  } catch {
    return []
  }
}

// ── LLM screening ──────────────────────────────────────────────────────────

async function screenArticlesForPromises(articles) {
  if (!articles.length) return []

  const systemPrompt = `You are screening Nigerian government news for trackable political promises.
A trackable promise must have ALL of these:
1. A specific, measurable commitment ("will build X", "allocate ₦Nbn to Y", "complete Z by date")
2. Made by an official in government (president, governor, minister, NASS)
3. Verifiable — there will be evidence later whether it was kept or broken

NOT trackable: vague statements ("we will do better"), past actions ("we have built"),
general aspirations without specifics, press releases about routine administration.

For each article that contains a trackable promise, extract it precisely.
Respond in JSON: { promises: [{ article_index, promise_text, official, administration_hint, category, confidence: "high|medium|low" }] }`

  const articleList = articles
    .map((a, i) => `[${i}] ${a.source}: "${a.title}" — ${a.description}`)
    .join('\n')

  const text = await chatText({
    model: MODEL,
    maxTokens: 1024,
    system: systemPrompt,
    user: `Screen these articles for trackable government promises:\n\n${articleList}`,
  })

  try {
    const result = parseJsonReply(text)
    return (result.promises || []).map(p => ({
      ...p,
      article: articles[p.article_index] || {},
    }))
  } catch {
    return []
  }
}

// ── Main scan ──────────────────────────────────────────────────────────────

/**
 * Scan all feeds for new promises and add them to the queue
 * Returns: { scanned, found, added }
 */
export async function scanFeeds(feedUrls = null) {
  const feeds = feedUrls
    ? feedUrls.map((url, i) => ({ name: `Feed ${i + 1}`, url }))
    : DEFAULT_FEEDS

  // Fetch all feeds in parallel
  const fetchResults = await Promise.all(feeds.map(fetchFeed))
  const allArticles = fetchResults.flat()

  if (!allArticles.length) {
    return { scanned: feeds.length, found: 0, added: 0 }
  }

  // Screen for promises
  const detected = await screenArticlesForPromises(allArticles)

  if (!detected.length) {
    return { scanned: allArticles.length, found: 0, added: 0 }
  }

  // Deduplicate against existing queue
  const existing = readQueue()
  const existingLinks = new Set(existing.map(q => q.source_url))

  const newItems = detected
    .filter(p => !existingLinks.has(p.article.link))
    .map(p => ({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      status: 'pending',
      promise_text: p.promise_text,
      official: p.official,
      administration_hint: p.administration_hint,
      category: p.category,
      confidence: p.confidence,
      source_name: p.article.source,
      source_url: p.article.link,
      source_title: p.article.title,
      detected_at: new Date().toISOString(),
    }))

  if (newItems.length) {
    writeQueue([...newItems, ...existing])
  }

  return {
    scanned: allArticles.length,
    found: detected.length,
    added: newItems.length,
  }
}

export { DEFAULT_FEEDS }
