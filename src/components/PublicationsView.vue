<script setup>
// Publications — an index at /publications and an article at
// /publications/<slug>. Content lives in src/content/publications.js.
import { computed, inject } from 'vue'

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
        <p class="pub-back"><a :href="lp('/publications')">← {{ t('publications.all') }}</a></p>
      </main>
    </template>

    <template v-else>
      <header class="hero">
        <div class="wrap">
          <div class="eyebrow">{{ t('publications.eyebrow') }}</div>
          <h1>{{ t('publications.title') }}</h1>
          <p class="lede">{{ t('publications.lede') }}</p>
        </div>
      </header>
      <main class="wrap">
        <ul class="pub-list">
          <li v-for="p in list" :key="p.slug" class="pub-item">
            <div class="pub-item-date">{{ fmtDate(p.date) }}</div>
            <h2 class="pub-item-title"><a :href="lp(`/publications/${p.slug}`)">{{ p.title }}</a></h2>
            <p class="pub-item-sub">{{ p.subtitle }}</p>
            <p class="pub-item-sum">{{ p.summary }}</p>
            <a class="pub-item-more" :href="lp(`/publications/${p.slug}`)">{{ t('publications.read') }} →</a>
          </li>
        </ul>
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
.pub-back { margin: 28px 0 0; font-size: 14px; }
.pub-back a { color: var(--g700); }

.pub-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 18px; }
.pub-item { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 20px 22px; }
.pub-item-date { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--faint); }
.pub-item-title { font-family: "Playfair Display", Georgia, serif; font-size: 24px; line-height: 1.2; margin: 6px 0 4px; }
.pub-item-title a { color: var(--ink); text-decoration: none; }
.pub-item-title a:hover { color: var(--g700); text-decoration: underline; }
.pub-item-sub { color: var(--muted); font-size: 15px; margin: 0 0 10px; }
.pub-item-sum { font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
.pub-item-more { color: var(--g700); font-weight: 700; font-size: 14px; text-decoration: none; }
.pub-item-more:hover { text-decoration: underline; }

@media (max-width: 600px) {
  h1 { font-size: 28px; }
  .hero { padding: 22px 16px; }
  main { padding: 28px 16px 56px; }
  .pub-section p { font-size: 16px; }
}
</style>
