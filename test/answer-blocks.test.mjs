// Renders the real AnswerBlocks component (through Vite's SSR loader) to check
// the thing that matters for safety: whatever the model wrote ends up escaped.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { formatAnswer } from '../src/lib/formatAnswer.js'

let vite, AnswerBlocks
before(async () => {
  vite = await createServer({ root: process.cwd(), appType: 'custom', server: { middlewareMode: true, hmr: false }, logLevel: 'silent' })
  AnswerBlocks = (await vite.ssrLoadModule('/src/components/AnswerBlocks.vue')).default
})
after(async () => { await vite?.close() })

// Vue's server renderer adds fragment comments and a scoped-style attribute;
// strip them so the assertions read the markup that matters.
const render = async (answer, ids) =>
  (await renderToString(createSSRApp(AnswerBlocks, { blocks: formatAnswer(answer, ids), sourceHref: (id) => `#src-${id}` })))
    .replace(/<!--.*?-->/g, '')
    .replace(/ data-v-[a-z0-9]+/g, '')

describe('AnswerBlocks', () => {
  test('renders real lists, bold and clickable citations', async () => {
    const html = await render('Steps:\n1. First [1].\n2. Second [2].\n\n**Note:** done.', [1, 2])
    assert.match(html, /<ol>/)
    assert.equal((html.match(/<li>/g) || []).length, 2)
    assert.match(html, /<strong>Note:<\/strong>/)
    assert.match(html, /<a class="ab-cite" href="#src-1" aria-label="Source 1">\[1\]<\/a>/)
    assert.match(html, /href="#src-2"/)
  })

  test('uses a bullet list element for "- " items', async () => {
    assert.match(await render('- a\n- b', []), /<ul>\s*<li>a<\/li>\s*<li>b<\/li>\s*<\/ul>/)
  })

  test('markup in the answer is escaped, never rendered', async () => {
    const html = await render('<script>alert(1)</script>\n- <img src=x onerror=alert(1)>', [1])
    assert.ok(!html.includes('<script'), 'no script element')
    assert.ok(!html.includes('<img'), 'no img element')
    assert.ok(html.includes('&lt;script&gt;'))
    assert.ok(html.includes('&lt;img'))
  })

  test('a javascript: URL typed as text is not a link', async () => {
    const html = await render('[click](javascript:alert(1))', [])
    assert.ok(!/<a [^>]*javascript:/.test(html))
  })

  test('only the sources that exist become links', async () => {
    const html = await render('Claim [1] and [5].', [1])
    assert.equal((html.match(/class="ab-cite"/g) || []).length, 1)
  })
})
