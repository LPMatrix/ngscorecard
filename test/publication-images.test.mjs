// A publication with an image shares with that image; one without keeps the
// site card. Covers the resolver, the real publications' image data, and the
// <head> that server/render.js produces.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PUBLICATIONS, shareImageOf, imagesOf, listPublications } from '../src/content/publications.js'
import { renderHtml } from '../server/render.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8')

const img = (src, extra = {}) => ({ src, alt: 'A road under construction', width: 1600, height: 900, ...extra })

describe('shareImageOf', () => {
  test('no images → null, so the site card stays', () => {
    assert.equal(shareImageOf({ sections: [{ paragraphs: ['x'] }] }), null)
    assert.equal(shareImageOf(null), null)
    assert.equal(shareImageOf({ image: {}, sections: [{ image: { alt: 'no src' } }] }), null)
  })

  test('the cover wins over body images', () => {
    const p = { image: img('/publications/cover.jpg'), sections: [{ image: img('/publications/body.jpg') }] }
    assert.equal(shareImageOf(p).src, '/publications/cover.jpg')
  })

  test('without a cover, the first image in the body is used', () => {
    const p = { sections: [{ paragraphs: [] }, { image: img('/publications/a.jpg') }, { image: img('/publications/b.jpg') }] }
    assert.equal(shareImageOf(p).src, '/publications/a.jpg')
  })

  test('returns a copy, not the content object', () => {
    const p = { image: img('/publications/cover.jpg') }
    shareImageOf(p).src = 'changed'
    assert.equal(p.image.src, '/publications/cover.jpg')
  })
})

describe('publication content', () => {
  test('every image exists on disk and has alt text and real dimensions', () => {
    for (const pub of PUBLICATIONS) {
      for (const image of imagesOf(pub)) {
        assert.ok(image.alt?.trim(), `${pub.slug}: image ${image.src} needs alt text`)
        assert.ok(Number.isInteger(image.width) && Number.isInteger(image.height) && image.width > 0 && image.height > 0,
          `${pub.slug}: image ${image.src} needs integer width and height`)
        if (image.src.startsWith('/')) assert.ok(fs.existsSync(path.join(root, 'public', image.src)), `${pub.slug}: public${image.src} is missing`)
        else assert.match(image.src, /^https:\/\//, `${pub.slug}: external images must be https`)
      }
    }
  })

  test('the index carries each piece\'s cover image', () => {
    const list = listPublications()
    assert.equal(list.length, PUBLICATIONS.length)
    for (const row of list) assert.ok(row.image === null || typeof row.image.src === 'string')
  })
})

describe('share tags in the page head', () => {
  const page = async (extra) => {
    const loadEntryServer = async () => ({
      render: async () => ({
        html: '', initialData: { locale: 'en' }, meta: { title: 'A piece | NGScorecard', description: 'About a piece' },
        notFound: false, canonical: '/publications/a-piece', ...extra,
      }),
    })
    const out = await renderHtml('/publications/a-piece', template, loadEntryServer)
    return out.html
  }
  const tag = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1]

  test('a piece with an image shares that image, its alt text and its size', async () => {
    const html = await page({ ogImage: '/publications/road.jpg', ogImageAlt: 'A road "under" construction', ogImageSize: { width: 1600, height: 900 } })
    assert.equal(tag(html, 'property', 'og:image'), 'https://ngscorecard.com/publications/road.jpg')
    assert.equal(tag(html, 'name', 'twitter:image'), 'https://ngscorecard.com/publications/road.jpg')
    assert.equal(tag(html, 'property', 'og:image:alt'), 'A road &quot;under&quot; construction')
    assert.equal(tag(html, 'property', 'og:image:width'), '1600')
    assert.equal(tag(html, 'property', 'og:image:height'), '900')
  })

  test('a piece without an image keeps the site card and its 1200x630', async () => {
    const html = await page({})
    assert.equal(tag(html, 'property', 'og:image'), 'https://ngscorecard.com/og-image.png')
    assert.equal(tag(html, 'property', 'og:image:width'), '1200')
    assert.equal(tag(html, 'property', 'og:image:height'), '630')
  })

  test('an https URL is used as given; other schemes are ignored', async () => {
    const ok = await page({ ogImage: 'https://cdn.example.org/a.jpg', ogImageSize: { width: 800, height: 450 } })
    assert.equal(tag(ok, 'property', 'og:image'), 'https://cdn.example.org/a.jpg')
    for (const bad of ['http://x.test/a.jpg', 'javascript:alert(1)', '//evil.test/a.jpg', 'data:image/png;base64,AAAA', 'https://x.test/a"><script>']) {
      const html = await page({ ogImage: bad })
      assert.equal(tag(html, 'property', 'og:image'), 'https://ngscorecard.com/og-image.png', bad)
      assert.ok(!html.includes('<script>alert'), bad)
    }
  })

  test('an image of unknown size drops the 1200x630 claim rather than keep a wrong one', async () => {
    const html = await page({ ogImage: '/publications/road.jpg' })
    assert.equal(tag(html, 'property', 'og:image'), 'https://ngscorecard.com/publications/road.jpg')
    assert.equal(tag(html, 'property', 'og:image:width'), undefined)
    assert.equal(tag(html, 'property', 'og:image:height'), undefined)
  })

  test('an article is described as an Article, with its image, in the structured data', async () => {
    const html = await page({
      ogImage: '/publications/road.jpg', ogImageSize: { width: 1600, height: 900 },
      article: { title: 'A piece', date: '2026-09-20', author: 'NGScorecard' },
    })
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)[1])
    assert.equal(ld['@type'], 'Article')
    assert.equal(ld.headline, 'A piece')
    assert.equal(ld.datePublished, '2026-09-20')
    assert.equal(ld.image, 'https://ngscorecard.com/publications/road.jpg')
  })

  test('other pages are still a WebPage', async () => {
    const html = await page({})
    assert.equal(JSON.parse(html.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)[1])['@type'], 'WebPage')
  })
})
