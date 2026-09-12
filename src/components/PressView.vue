<script setup>
// Press kit — unified into the app route table (see GuideView.vue's header
// comment for why). Chrome (title/eyebrow/ledes/section headings) is
// translated; the copy-paste boilerplate quotes, facts grid and asset labels
// stay English for now — a press kit's canonical citation text is the one
// thing that shouldn't silently vary by the reader's locale until reviewed.
import { inject, ref } from 'vue'

const t = inject('t', (k) => k)

const SHORT_BLURB = 'NGScorecard is a free, independent tracker of what Nigerian presidents and governors promised versus what they actually delivered — every entry sourced and dated.'
const LONG_BLURB = "NGScorecard is a free, independent civic-accountability tracker covering Nigeria's five most recent presidents and all 36 sitting state governors. It records what each administration promised and what actually happened — kept, partial, or broken — alongside budget allocations, fraud allegations and their outcomes, executive orders, bills, appointments, and court judgments, each entry dated and linked to its original source. Where an official figure (such as a state budget line) hasn't actually been published, NGScorecard marks it as unavailable rather than estimating one. The dataset is also available as a free public API and as an embeddable widget for newsrooms and civic-tech projects."

const copied = ref({ short: false, long: false })
function copyBlurb(which, text) {
  navigator.clipboard.writeText(text).then(() => {
    copied.value[which] = true
    setTimeout(() => { copied.value[which] = false }, 1600)
  })
}
</script>

<template>
  <div class="docs-page">
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">{{ t('press.eyebrow') }}</div>
        <h1>{{ t('press.title') }}</h1>
        <p class="lede">
          {{ t('press.leadPrefix') }}
          <a href="mailto:mubaraqsanusi908@gmail.com">mubaraqsanusi908@gmail.com</a>.
        </p>
      </div>
    </header>

    <main class="wrap">

      <section id="boilerplate">
        <h2><span class="num">1</span> {{ t('press.boilerplate.title') }}</h2>
        <p class="section-lede">{{ t('press.boilerplate.lede') }}</p>
        <div class="card">
          <div class="quote-block">
            <div class="quote-block-label">
              <span>Short (1 sentence)</span>
              <button class="copy-btn" :class="{ copied: copied.short }" @click="copyBlurb('short', SHORT_BLURB)">{{ copied.short ? 'Copied' : 'Copy' }}</button>
            </div>
            <p>{{ SHORT_BLURB }}</p>
          </div>
          <div class="quote-block long">
            <div class="quote-block-label">
              <span>Long (one paragraph)</span>
              <button class="copy-btn" :class="{ copied: copied.long }" @click="copyBlurb('long', LONG_BLURB)">{{ copied.long ? 'Copied' : 'Copy' }}</button>
            </div>
            <p>{{ LONG_BLURB }}</p>
          </div>
        </div>
      </section>

      <section id="facts">
        <h2><span class="num">2</span> {{ t('press.facts.title') }}</h2>
        <div class="facts-grid">
          <div class="fact"><div class="fact-value">36</div><div class="fact-label">States tracked</div></div>
          <div class="fact"><div class="fact-value">5 / 36</div><div class="fact-label">Federal presidents / state governors</div></div>
          <div class="fact"><div class="fact-value">7</div><div class="fact-label">Categories per administration</div></div>
        </div>
        <ul class="point-list">
          <li><strong>Categories tracked:</strong> promises, budget, fraud cases, executive orders, bills, appointments, and court judgments.</li>
          <li><strong>Every entry is sourced and dated</strong> — no claim without a linked reference.</li>
          <li><strong>No derived numbers:</strong> when a real figure (e.g. an unpublished state budget line) doesn't exist, the field is left blank rather than estimated.</li>
          <li><strong>Free to use:</strong> the site, the public API, and the embeddable widget are all free, with no paywall or account requirement to read.</li>
        </ul>
      </section>

      <section id="assets">
        <h2><span class="num">3</span> {{ t('press.assets.title') }}</h2>
        <p class="section-lede">{{ t('press.assets.lede') }}</p>
        <div class="asset-grid">
          <div class="asset-card">
            <div class="asset-preview"><img src="/pwa-512x512.png" alt="NGScorecard logo mark" /></div>
            <div class="asset-name">Logo mark</div>
            <div class="asset-meta">PNG · 512×512</div>
            <a class="asset-dl" href="/pwa-512x512.png" target="_blank" rel="noopener">Open PNG</a>
          </div>
          <div class="asset-card">
            <div class="asset-preview"><img src="/favicon.svg" alt="NGScorecard vector mark" /></div>
            <div class="asset-name">Vector mark</div>
            <div class="asset-meta">SVG · scalable</div>
            <a class="asset-dl" href="/favicon.svg" target="_blank" rel="noopener">Open SVG</a>
          </div>
          <div class="asset-card">
            <div class="asset-preview dark"><img src="/og-image.png" alt="NGScorecard brand card" /></div>
            <div class="asset-name">Brand card</div>
            <div class="asset-meta">PNG · 1200×630</div>
            <a class="asset-dl" href="/og-image.png" target="_blank" rel="noopener">Open PNG</a>
          </div>
        </div>
        <p class="usage-note">These marks may be used to identify NGScorecard in editorial coverage (articles, embeds, citations). They don't imply NGScorecard's endorsement of any publication, product, or campaign.</p>
      </section>

      <section id="screenshot">
        <h2><span class="num">4</span> {{ t('press.screenshot.title') }}</h2>
        <p class="section-lede">The live tracker — visit <a href="https://ngscorecard.com" target="_blank" rel="noopener">ngscorecard.com</a> for a current view, or email us for a custom screenshot of a specific administration or category.</p>
      </section>

      <section id="sourcing">
        <h2><span class="num">5</span> {{ t('press.sourcing.title') }}</h2>
        <p class="section-lede">{{ t('press.sourcing.lede') }}</p>
      </section>

      <section id="contact">
        <h2><span class="num">6</span> {{ t('press.contact.title') }}</h2>
        <div class="card">
          <p style="margin:0 0 8px;">{{ t('press.contact.lede') }}</p>
          <p style="margin:0;"><a href="mailto:mubaraqsanusi908@gmail.com" style="font-weight:700;">mubaraqsanusi908@gmail.com</a></p>
        </div>
      </section>

    </main>

    <footer>
      <div class="wrap">
        <p class="footer-tag">{{ t('common.footerTag') }}</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.docs-page {
  --g900: #073f2a; --g800: #075236; --g700: #006b45; --g600: #008751; --g100: #dff5e8; --g050: #f1fbf5;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1;
  --surface: #fffef9;
  color: var(--ink);
}
.wrap { max-width: 860px; margin: 0 auto; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 34px; margin: 6px 0 8px; }
.lede { color: var(--muted); font-size: 16px; max-width: 620px; margin: 0; }
.lede a { color: var(--g700); }

main { padding: 40px 24px 80px; }
section { margin-bottom: 52px; }
h2 { font-size: 20px; font-weight: 800; color: var(--g800); margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
h2 .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--g100); color: var(--g700); font-size: 12px; font-weight: 800;
}
.section-lede { color: var(--muted); margin: 0 0 16px; max-width: 640px; }
.section-lede a { color: var(--g700); }

.card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 18px 20px; }

.quote-block { margin-bottom: 14px; }
.quote-block-label {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--faint); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;
}
.quote-block p { margin: 0; font-size: 15px; color: var(--ink); }
.quote-block.long p { font-size: 14px; color: var(--muted); }
.copy-btn {
  border: 1px solid var(--line-strong); background: #fff; color: var(--muted);
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 5px; cursor: pointer; font-family: inherit;
}
.copy-btn:hover { border-color: var(--g700); color: var(--g700); }
.copy-btn.copied { border-color: var(--g700); background: var(--g100); color: var(--g800); }

.facts-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
  background: var(--line); border: 1px solid var(--line); border-radius: 8px; overflow: hidden;
}
.fact { background: var(--surface); padding: 18px 16px; }
.fact-value { font-family: "Playfair Display", Georgia, serif; font-size: 28px; font-weight: 800; color: var(--g800); line-height: 1; }
.fact-label { font-size: 11.5px; color: var(--faint); margin-top: 6px; }
ul.point-list { margin: 14px 0 0; padding: 0 0 0 18px; color: var(--muted); font-size: 14px; }
ul.point-list li { margin-bottom: 6px; }
ul.point-list strong { color: var(--ink); }

.asset-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.asset-card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; text-align: center; }
.asset-preview {
  display: flex; align-items: center; justify-content: center; height: 88px; margin-bottom: 12px;
  background: repeating-conic-gradient(#eef2ec 0% 25%, #fff 0% 50%) 50% / 14px 14px; border-radius: 6px;
}
.asset-preview img { max-height: 64px; max-width: 84%; }
.asset-preview.dark { background: #0f1a14; }
.asset-preview.dark img { max-height: 88px; max-width: 100%; }
.asset-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.asset-meta { font-size: 11px; color: var(--faint); margin-bottom: 10px; }
.asset-dl {
  display: inline-block; font-size: 12px; font-weight: 700; color: var(--g700);
  border: 1px solid var(--line-strong); border-radius: 6px; padding: 6px 12px; text-decoration: none;
}
.asset-dl:hover { border-color: var(--g700); background: var(--g050); }
.usage-note { margin-top: 14px; font-size: 12.5px; color: var(--faint); }

footer { border-top: 1px solid var(--line-strong); padding: 28px 24px; text-align: center; color: var(--faint); font-size: 12.5px; }
footer .footer-tag { margin: 0; }
</style>
