<script setup>
// "/nigeria-promise-trackers-compared": a fair, sourced comparison of
// NGScorecard with the other Nigerian accountability trackers. All copy lives in
// src/content/trackers.js. English only, so other locales get noindex.
import { inject } from 'vue'
import { US, TRACKERS, ROWS, PICKS, DIFFERENCES, THEY_DO } from '../content/trackers.js'

const lp = inject('lp', (p) => p)

const ALL = [US, ...TRACKERS]
const byId = Object.fromEntries(ALL.map((x) => [x.id, x]))
const isExternal = (url) => /^https?:\/\//.test(url)
const caveats = TRACKERS.filter((tr) => tr.caveat)
</script>

<template>
  <div class="docs-page">
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">Comparison</div>
        <h1>Nigerian promise trackers compared</h1>
        <p class="lede">Several projects hold Nigerian leaders to account, and they are not the same. This page sets out what each one covers and publishes, so you can choose the right one, or use more than one.</p>
      </div>
    </header>

    <main class="wrap">
      <section id="pick">
        <h2>Which one should you use?</h2>
        <ul class="picks">
          <li v-for="p in PICKS" :key="p.id" class="pick">
            <span class="pick-need">{{ p.need }}</span>
            <a
              v-if="isExternal(byId[p.id].url)"
              class="pick-link" :href="byId[p.id].url" target="_blank" rel="noopener"
            >{{ p.pick }} →</a>
            <a v-else class="pick-link us" :href="lp(byId[p.id].url)">{{ p.pick }} →</a>
          </li>
        </ul>
      </section>

      <section id="table">
        <h2>Side by side</h2>
        <div class="tbl-wrap" role="region" aria-label="Comparison table. Scrolls sideways on small screens." tabindex="0">
          <table class="tbl">
            <caption class="sr-only">How NGScorecard compares with four other Nigerian accountability trackers</caption>
            <thead>
              <tr>
                <th scope="col" class="corner"><span class="sr-only">Feature</span></th>
                <th v-for="x in ALL" :key="x.id" scope="col" :class="{ us: x.id === 'ngscorecard' }">
                  <a v-if="isExternal(x.url)" :href="x.url" target="_blank" rel="noopener" class="col-name">{{ x.name }}</a>
                  <a v-else :href="lp(x.url)" class="col-name">{{ x.name }}</a>
                  <span v-if="x.byline" class="col-by">{{ x.byline }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in ROWS" :key="r.key">
                <th scope="row">{{ r.label }}</th>
                <td v-for="x in ALL" :key="x.id" :class="{ us: x.id === 'ngscorecard', unknown: x.cells[r.key].startsWith('Not stated') }">{{ x.cells[r.key] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-for="c in caveats" :key="c.id" class="foot">{{ c.name }}: {{ c.caveat }}</p>
        <p class="foot">"Not stated" means we found nothing on the site either way. It does not mean the project does not do it.</p>
      </section>

      <section id="different">
        <h2>Where NGScorecard is different</h2>
        <div class="diff-grid">
          <article v-for="d in DIFFERENCES" :key="d.title" class="diff">
            <h3>{{ d.title }}</h3>
            <p>{{ d.body }}</p>
            <a :href="lp(d.link.href)">{{ d.link.label }} →</a>
          </article>
        </div>
      </section>

      <section id="others">
        <h2>What the others do that we don't</h2>
        <p class="section-lede">These projects are doing useful work, and in places they go further than we do.</p>
        <ul class="others">
          <li v-for="o in THEY_DO" :key="o.who"><strong>{{ o.who }}.</strong> {{ o.text }}</li>
        </ul>
      </section>

      <section id="correct" class="note">
        <p>If something here about another project is wrong or out of date, email <a href="mailto:mubaraqsanusi908@gmail.com">mubaraqsanusi908@gmail.com</a> and we will correct it.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.docs-page {
  --g900: #073f2a; --g800: #075236; --g700: #006b45; --g600: #008751; --g100: #dff5e8; --g050: #f1fbf5;
  --ink: #1b2720; --muted: #5f6f66; --faint: #7f8c84;
  --line: #d9e2dc; --line-strong: #b9cbc1; --surface: #fffef9;
  color: var(--ink);
}
.wrap { max-width: 1120px; margin: 0 auto; }
main.wrap { max-width: 1168px; padding: 40px 24px 80px; }
.hero { border-bottom: 1px solid var(--line-strong); background: var(--surface); padding: 28px 24px; }
.eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--g700); }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 800; font-size: 36px; line-height: 1.15; margin: 8px 0 10px; }
.lede { color: var(--muted); font-size: 17px; line-height: 1.5; max-width: 680px; margin: 0; }

section { margin-bottom: 56px; }
h2 { font-size: 22px; font-weight: 800; color: var(--g800); margin: 0 0 14px; }
.section-lede { color: var(--muted); margin: -6px 0 16px; max-width: 640px; }

.picks { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
.pick { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding: 14px 18px; }
.pick + .pick { border-top: 1px solid var(--line); }
.pick-need { font-size: 15px; line-height: 1.5; }
.pick-link { flex: none; font-weight: 800; font-size: 14px; color: var(--g700); text-decoration: none; white-space: nowrap; }
.pick-link:hover { text-decoration: underline; }
.pick-link.us { background: var(--g100); padding: 3px 10px; border-radius: 999px; }

.tbl-wrap { overflow-x: auto; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); }
.tbl-wrap:focus-visible { outline: 2px solid var(--g700); outline-offset: 2px; }
.tbl { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 980px; font-size: 14px; line-height: 1.5; }
.tbl th, .tbl td { padding: 14px 16px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
.tbl tbody tr:last-child th, .tbl tbody tr:last-child td { border-bottom: none; }
.tbl thead th { background: #f6f4ea; border-bottom: 1px solid var(--line-strong); vertical-align: bottom; }
.tbl tbody th { width: 150px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); background: var(--surface); position: sticky; left: 0; }
.tbl .corner { position: sticky; left: 0; z-index: 1; width: 150px; }
.col-name { display: block; font-size: 15px; font-weight: 800; color: var(--ink); text-decoration: none; }
a.col-name:hover { color: var(--g700); text-decoration: underline; }
.col-by { display: block; font-size: 12px; font-weight: 500; color: var(--muted); margin-top: 2px; }
.tbl .us { background: var(--g050); }
.tbl thead th.us { background: var(--g100); }
.tbl td.unknown { color: var(--faint); }
.foot { font-size: 13px; color: var(--muted); margin: 10px 0 0; }

.diff-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.diff { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px 22px; display: flex; flex-direction: column; }
.diff h3 { font-family: "Playfair Display", Georgia, serif; font-size: 19px; line-height: 1.25; margin: 0 0 8px; }
.diff p { font-size: 14.5px; line-height: 1.6; margin: 0 0 14px; flex: 1; }
.diff a { font-size: 13.5px; font-weight: 700; color: var(--g700); text-decoration: none; }
.diff a:hover { text-decoration: underline; }

.others { margin: 0; padding: 0 0 0 20px; display: grid; gap: 10px; font-size: 15px; line-height: 1.6; max-width: 760px; }
.note p { font-size: 14px; color: var(--muted); margin: 0; border-top: 1px solid var(--line-strong); padding-top: 18px; }
.note a { color: var(--g700); }
.note { margin-bottom: 0; }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (max-width: 900px) {
  .diff-grid { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px) {
  h1 { font-size: 28px; }
  .hero { padding: 22px 16px; }
  main.wrap { padding: 28px 16px 56px; }
  .pick { flex-direction: column; gap: 6px; }
}
</style>
