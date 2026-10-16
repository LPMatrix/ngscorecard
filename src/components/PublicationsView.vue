<script setup>
// Publications — an index at /publications and an article at
// /publications/<slug>. Content lives in src/content/publications.js.
import { computed, inject } from 'vue'
import ShareActions from './ShareActions.vue'

const t = inject('t', (k) => k)
const lp = inject('lp', (p) => p)

const props = defineProps({
  // The article to show, or null for the index.
  publication: { type: Object, default: null },
  // Index entries (no section bodies).
  list: { type: Array, default: () => [] },
  // Article requested but not found.
  missing: { type: Boolean, default: false },
})

function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// "text with *italic* words" → [{ text, em }] — no HTML is ever injected.
function parts(str) {
  return String(str).split('*').map((text, i) => ({ text, em: i % 2 === 1 })).filter((p) => p.text)
}

const isArticle = computed(() => !!props.publication)

// Shares always point at the English canonical address (same as the page's
// canonical link), whichever language the reader is browsing in.
const SITE_ORIGIN = 'https://ngscorecard.com'
const shareUrl = computed(() => props.publication ? `${SITE_ORIGIN}/publications/${props.publication.slug}` : '')

// Newest first: the latest piece is featured, the rest follow as a list.
const sorted = computed(() => [...props.list].sort((a, b) => b.date.localeCompare(a.date)))
const featured = computed(() => sorted.value[0] ?? null)
const earlier = computed(() => sorted.value.slice(1))

// Section headings arrive numbered ("1. Absent"); the list numbers them itself.
const tocOf = (p) => (p.headings ?? []).map((h) => h.replace(/^\d+\.\s*/, ''))
</script>

<template>
  <div class="docs-page pub-page">
    <template v-if="missing">
      <header class="hero"><div class="wrap">
        <div class="eyebrow">{{ t('publications.eyebrow') }}</div>
        <h1>{{ t('publications.notFound.title') }}</h1>
        <p class="lede">{{ t('publications.notFound.body') }} <a :href="lp('/publications')">{{ t('publications.all') }}</a></p>
      </div></header>
    </template>

    <template v-else-if="isArticle">
      <header class="hero">
        <div class="wrap">
          <div class="eyebrow"><a :href="lp('/publications')">{{ t('publications.eyebrow') }}</a></div>
          <h1>{{ publication.title }}</h1>
          <p class="lede">{{ publication.subtitle }}</p>
          <p class="pub-meta">{{ t('publications.byline', { author: publication.author, date: fmtDate(publication.date) }) }}</p>
          <ShareActions class="pub-share-top" :url="shareUrl" :title="publication.title" :text="publication.subtitle" />
        </div>
      </header>
      <main class="wrap pub-article">
        <section v-for="(s, i) in publication.sections" :key="i" class="pub-section">
          <h2 v-if="s.heading">{{ s.heading }}</h2>
          <p v-for="(para, j) in s.paragraphs" :key="j">
            <template v-for="(part, k) in parts(para)" :key="k"><em v-if="part.em">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
          </p>
        </section>
        <aside v-if="publication.notes?.length" class="pub-notes">
          <p v-for="(n, i) in publication.notes" :key="i">{{ n }}</p>
        </aside>
        <div class="pub-share-end">
          <div class="pub-share-label">{{ t('publications.shareThis') }}</div>
          <ShareActions :url="shareUrl" :title="publication.title" :text="publication.subtitle" />
        </div>
        <p class="pub-back"><a :href="lp('/publications')">← {{ t('publications.all') }}</a></p>
      </main>
    </template>

    <template v-else>
      <header class="hero">
        <div class="wrap wide">
          <div class="eyebrow">{{ t('publications.eyebrow') }}</div>
          <h1>{{ t('publications.title') }}</h1>
          <p class="lede">{{ t('publications.lede') }}</p>
        </div>
      </header>
      <main class="wrap wide">
        <article v-if="featured" class="pub-feature" :class="{ solo: !tocOf(featured).length }">
          <div class="pub-feature-body">
            <div class="pub-kicker">
              <span class="pub-tag">{{ t('publications.latest') }}</span>
              <span class="pub-when">{{ fmtDate(featured.date) }}</span>
            </div>
            <h2 class="pub-feature-title"><a class="stretch" :href="lp(`/publications/${featured.slug}`)">{{ featured.title }}</a></h2>
            <p class="pub-feature-sub">{{ featured.subtitle }}</p>
            <p class="pub-feature-sum">{{ featured.summary }}</p>
            <span class="pub-cta">{{ t('publications.readPiece') }} →</span>
          </div>
          <aside v-if="tocOf(featured).length" class="pub-toc">
            <div class="pub-toc-label">{{ t('publications.inThisPiece') }}</div>
            <ol>
              <li v-for="h in tocOf(featured)" :key="h">{{ h }}</li>
            </ol>
          </aside>
        </article>

        <section v-if="earlier.length" class="pub-earlier">
          <h2 class="pub-earlier-title">{{ t('publications.earlier') }}</h2>
          <ul class="pub-rows">
            <li v-for="p in earlier" :key="p.slug" class="pub-row">
              <div class="pub-row-meta">{{ fmtDate(p.date) }}</div>
              <div class="pub-row-body">
                <h3 class="pub-row-title"><a class="stretch" :href="lp(`/publications/${p.slug}`)">{{ p.title }}</a></h3>
                <p class="pub-row-sub">{{ p.subtitle }}</p>
                <p class="pub-row-sum">{{ p.summary }}</p>
              </div>
              <span class="pub-row-go" aria-hidden="true">→</span>
            </li>
          </ul>
        </section>
      </main>
    </template>
  </div>
</template>

<style scoped>
.docs-page {
  --g800: #075236; --g700: #006b45; --g100: #dff5e8;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1; --surface: #fffef9;
  color: var(--ink);
}
.wrap { max-width: 720px; margin: 0 auto; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
.eyebrow a { color: inherit; text-decoration: none; }
.eyebrow a:hover { text-decoration: underline; }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 36px; line-height: 1.15; margin: 8px 0 10px; overflow-wrap: anywhere; }
.lede { color: var(--muted); font-size: 17px; line-height: 1.5; max-width: 620px; margin: 0; }
.lede a { color: var(--g700); }
.pub-meta { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--faint); margin: 14px 0 0; }

main { padding: 36px 24px 72px; }
.pub-section { margin-bottom: 30px; }
.pub-section h2 { font-size: 21px; font-weight: 800; color: var(--g800); margin: 0 0 8px; }
.pub-section p { font-size: 17px; line-height: 1.7; margin: 0 0 14px; overflow-wrap: anywhere; }
.pub-notes { border-top: 1px solid var(--line-strong); margin-top: 40px; padding-top: 16px; }
.pub-notes p { font-size: 13.5px; line-height: 1.6; color: var(--muted); margin: 0 0 8px; }
.pub-share-top { margin-top: 16px; }
.pub-share-end { border-top: 1px solid var(--line-strong); margin-top: 40px; padding-top: 18px; }
.pub-notes + .pub-share-end { margin-top: 24px; border-top: none; padding-top: 0; }
.pub-share-label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 10px; }
.pub-back { margin: 28px 0 0; font-size: 14px; }
.pub-back a { color: var(--g700); }

.wrap.wide { max-width: 1120px; }
/* main's side padding sits inside its width; widen it so its content lines up with the heading above. */
main.wrap.wide { max-width: 1168px; }

/* Whole-card links: the title link stretches over its card, so the card is the
   click target while screen readers still hear one link per piece. */
.stretch { color: inherit; text-decoration: none; }
.stretch::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
.stretch:focus-visible { outline: none; }
.stretch:focus-visible::after { outline: 2px solid var(--g700); outline-offset: -3px; }

.pub-feature {
  position: relative; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  background: var(--surface); border: 1px solid var(--line-strong); border-radius: 12px; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pub-feature.solo { grid-template-columns: minmax(0, 1fr); }
.pub-feature:hover { border-color: var(--g700); box-shadow: 0 10px 30px rgba(7, 63, 42, 0.08); }
.pub-feature-body { padding: 34px 38px 32px; }
.pub-kicker { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin-bottom: 14px; }
.pub-tag {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  background: var(--g700); color: #fff; padding: 3px 9px; border-radius: 999px;
}
.pub-when { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--faint); }
.pub-feature-title { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 38px; line-height: 1.12; margin: 0 0 10px; overflow-wrap: anywhere; }
.pub-feature:hover .pub-feature-title { color: var(--g800); }
.pub-feature-sub { font-size: 18px; line-height: 1.45; color: var(--muted); margin: 0 0 16px; }
.pub-feature-sum { font-size: 15.5px; line-height: 1.65; margin: 0 0 22px; max-width: 62ch; }
.pub-cta { color: var(--g700); font-weight: 800; font-size: 14.5px; }
.pub-feature:hover .pub-cta { text-decoration: underline; }
.pub-toc { background: #f1fbf5; border-left: 1px solid var(--line); padding: 34px 32px; }
.pub-toc-label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); margin-bottom: 14px; }
.pub-toc ol { margin: 0; padding: 0; list-style: none; counter-reset: toc; display: grid; gap: 12px; }
.pub-toc li { counter-increment: toc; display: grid; grid-template-columns: 24px 1fr; gap: 8px; font-size: 14.5px; line-height: 1.4; color: var(--ink); }
.pub-toc li::before { content: counter(toc); font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--g700); padding-top: 2px; }

.pub-earlier { margin-top: 48px; }
.pub-earlier-title { font-size: 11.5px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 0 0 4px; padding-bottom: 12px; border-bottom: 1px solid var(--line-strong); }
.pub-rows { list-style: none; margin: 0; padding: 0; }
.pub-row {
  position: relative; display: grid; grid-template-columns: 170px minmax(0, 1fr) 28px; gap: 8px 28px; align-items: start;
  padding: 24px 12px; margin: 0 -12px; border-bottom: 1px solid var(--line); border-radius: 8px;
  transition: background 0.15s;
}
.pub-row:hover { background: var(--surface); }
.pub-row-meta { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--faint); line-height: 1.7; padding-top: 5px; }
.pub-row-title { font-family: "Playfair Display", Georgia, serif; font-size: 25px; line-height: 1.2; margin: 0 0 6px; }
.pub-row:hover .pub-row-title { color: var(--g700); }
.pub-row-sub { color: var(--muted); font-size: 16px; line-height: 1.45; margin: 0 0 8px; }
.pub-row-sum { font-size: 14.5px; line-height: 1.6; color: var(--ink); margin: 0; max-width: 70ch; }
.pub-row-go { color: var(--g700); font-weight: 800; font-size: 20px; padding-top: 2px; transition: transform 0.15s; }
.pub-row:hover .pub-row-go { transform: translateX(4px); }

@media (prefers-reduced-motion: reduce) {
  .pub-feature, .pub-row, .pub-row-go { transition: none; }
  .pub-row:hover .pub-row-go { transform: none; }
}

@media (max-width: 900px) {
  .pub-feature { grid-template-columns: minmax(0, 1fr); }
  .pub-toc { border-left: none; border-top: 1px solid var(--line); padding: 24px 28px; }
  .pub-feature-body { padding: 28px 28px 26px; }
  .pub-feature-title { font-size: 32px; }
}

@media (max-width: 600px) {
  .pub-feature-body { padding: 22px 20px 20px; }
  .pub-feature-title { font-size: 27px; }
  .pub-feature-sub { font-size: 16.5px; }
  .pub-feature-sum { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 6; overflow: hidden; }
  .pub-row-sum { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; overflow: hidden; }
  .pub-row { grid-template-columns: minmax(0, 1fr) 24px; padding: 20px 10px; margin: 0 -10px; }
  .pub-row-meta { grid-column: 1 / -1; display: flex; gap: 12px; padding-top: 0; }
  .pub-row-body { grid-column: 1; }
  .pub-row-go { grid-column: 2; grid-row: 2; }
  .pub-row-title { font-size: 22px; }
  h1 { font-size: 28px; }
  .hero { padding: 22px 16px; }
  main { padding: 28px 16px 56px; }
  .pub-section p { font-size: 16px; }
}
</style>
