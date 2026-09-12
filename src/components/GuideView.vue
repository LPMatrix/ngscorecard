<script setup>
// The methodology & glossary page — unified into the app's route table so it
// gets the same locale prefix, header/nav and t() catalogue as every other
// page (see docs/i18n-plan.md "Guide/press/developers unification"). Used to
// be 5 hand-authored static files (guide.html + one per locale); now one
// English source translated through src/i18n/*.js like the rest of the app.
//
// A few strings below carry literal inline HTML (a <strong>, an <em>, an
// internal #anchor link) and are rendered with v-html — safe here because
// every value comes from our own i18n catalogue, never from user input.
import { inject } from 'vue'

const t = inject('t', (k) => k)

const METHODOLOGY_VERSION = 'v1.4'
const METHODOLOGY_DATE = '7 September 2026'

const zones = ['North Central', 'North East', 'North West', 'South East', 'South South', 'South West']
</script>

<template>
  <div class="docs-page">
    <header class="hero">
      <div class="wrap">
        <div class="eyebrow">{{ t('guide.eyebrow') }}</div>
        <h1>{{ t('guide.title') }}</h1>
        <p class="lede">{{ t('guide.lede') }}</p>
        <p class="version">
          {{ t('guide.versionLabel', { version: METHODOLOGY_VERSION, date: METHODOLOGY_DATE }) }}
          <a href="#changes">{{ t('guide.changeLogLink') }}</a>
        </p>
      </div>
    </header>

    <nav class="toc">
      <div class="wrap">
        <a href="#scope">{{ t('guide.toc.scope') }}</a>
        <a href="#ratings">{{ t('guide.toc.ratings') }}</a>
        <a href="#statuses">{{ t('guide.toc.statuses') }}</a>
        <a href="#budget">{{ t('guide.toc.budget') }}</a>
        <a href="#other">{{ t('guide.toc.other') }}</a>
        <a href="#methodology">{{ t('guide.toc.methodology') }}</a>
        <a href="#coverage">{{ t('guide.toc.coverage') }}</a>
        <a href="#independence">{{ t('guide.toc.independence') }}</a>
        <a href="#changes">{{ t('guide.toc.changes') }}</a>
      </div>
    </nav>

    <main class="wrap">

      <section id="scope">
        <h2><span class="num">1</span> {{ t('guide.scope.title') }}</h2>
        <p class="section-lede">{{ t('guide.scope.lede') }}</p>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('guide.scope.included.term') }}</dt>
            <dd>{{ t('guide.scope.included.body') }}</dd>
            <dt>{{ t('guide.scope.trackedSeparately.term') }}</dt>
            <dd v-html="t('guide.scope.trackedSeparately.body')"></dd>
            <dt>{{ t('guide.scope.excluded.term') }}</dt>
            <dd>{{ t('guide.scope.excluded.body') }}</dd>
            <dt>{{ t('guide.scope.selection.term') }}</dt>
            <dd>{{ t('guide.scope.selection.body') }}</dd>
          </dl>
        </div>
        <p class="hint" v-html="t('guide.scope.note')"></p>
      </section>

      <section id="ratings">
        <h2><span class="num">2</span> {{ t('guide.ratings.title') }}</h2>
        <p class="section-lede">{{ t('guide.ratings.lede') }}</p>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.kept') }}</dt>
            <dd>{{ t('guide.ratings.kept.body') }}</dd>
            <dt>{{ t('status.partial') }}</dt>
            <dd>{{ t('guide.ratings.partial.body') }}</dd>
            <dt>{{ t('status.broken') }}</dt>
            <dd>{{ t('guide.ratings.broken.body') }}</dd>
            <dt>{{ t('status.pending') }}</dt>
            <dd>{{ t('guide.ratings.inProgress.body') }}</dd>
          </dl>
        </div>
        <p class="section-lede" style="margin-top:16px;" v-html="t('guide.ratings.note')"></p>
      </section>

      <section id="statuses">
        <h2><span class="num">3</span> {{ t('guide.statuses.title') }}</h2>
        <p class="section-lede">{{ t('guide.statuses.lede') }}</p>

        <div class="subgroup-label">{{ t('guide.statuses.fraud.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.convicted') }}</dt><dd>{{ t('guide.statuses.fraud.convicted.body') }}</dd>
            <dt>{{ t('status.ongoing') }}</dt><dd>{{ t('guide.statuses.fraud.ongoing.body') }}</dd>
            <dt>{{ t('status.dismissed') }}</dt><dd>{{ t('guide.statuses.fraud.dismissed.body') }}</dd>
            <dt>{{ t('status.acquitted') }}</dt><dd>{{ t('guide.statuses.fraud.acquitted.body') }}</dd>
          </dl>
        </div>
        <p class="hint" v-html="t('guide.statuses.fraud.note')"></p>

        <div class="subgroup-label">{{ t('guide.statuses.orders.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.implemented') }}</dt><dd>{{ t('guide.statuses.orders.implemented.body') }}</dd>
            <dt>{{ t('status.partial') }}</dt><dd>{{ t('guide.statuses.orders.partial.body') }}</dd>
            <dt>{{ t('status.reversed') }}</dt><dd>{{ t('guide.statuses.orders.reversed.body') }}</dd>
            <dt>{{ t('status.ignored') }}</dt><dd>{{ t('guide.statuses.orders.ignored.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.statuses.ministers.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.good') }} / {{ t('status.fair') }} / {{ t('status.poor') }}</dt>
            <dd>{{ t('guide.statuses.ministers.goodFairPoor.body') }}</dd>
            <dt>{{ t('status.sacked') }}</dt><dd>{{ t('guide.statuses.ministers.sacked.body') }}</dd>
            <dt>{{ t('status.resigned') }}</dt><dd>{{ t('guide.statuses.ministers.resigned.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.statuses.bills.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.passed') }}</dt><dd>{{ t('guide.statuses.bills.passed.body') }}</dd>
            <dt>{{ t('status.partial') }}</dt><dd>{{ t('guide.statuses.bills.partial.body') }}</dd>
            <dt>{{ t('status.pending') }}</dt><dd>{{ t('guide.statuses.bills.pending.body') }}</dd>
            <dt>{{ t('status.abandoned') }}</dt><dd>{{ t('guide.statuses.bills.abandoned.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.statuses.appointments.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.serving') }}</dt><dd>{{ t('guide.statuses.appointments.serving.body') }}</dd>
            <dt>{{ t('status.resigned') }}</dt><dd>{{ t('guide.statuses.appointments.resigned.body') }}</dd>
            <dt>{{ t('status.sacked') }}</dt><dd>{{ t('guide.statuses.appointments.sacked.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.statuses.judgments.label') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('status.won') }} / {{ t('status.lost') }}</dt>
            <dd>{{ t('guide.statuses.judgments.govtWonLost.body') }}</dd>
            <dt>{{ t('status.settled') }}</dt><dd>{{ t('guide.statuses.judgments.settled.body') }}</dd>
            <dt>{{ t('status.ongoing') }}</dt><dd>{{ t('guide.statuses.judgments.ongoing.body') }}</dd>
          </dl>
        </div>
      </section>

      <section id="budget">
        <h2><span class="num">4</span> {{ t('guide.budget.title') }}</h2>
        <p class="section-lede" v-html="t('guide.budget.lede')"></p>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('budget.totalBudget') }}</dt><dd>{{ t('guide.budget.totalBudget.body') }}</dd>
            <dt>{{ t('guide.budget.revenueProjected.term') }}</dt><dd>{{ t('guide.budget.revenueProjected.body') }}</dd>
            <dt>{{ t('guide.budget.revenueActual.term') }}</dt><dd>{{ t('guide.budget.revenueActual.body') }}</dd>
            <dt>{{ t('budget.deficit') }}</dt><dd>{{ t('guide.budget.deficit.body') }}</dd>
            <dt>{{ t('budget.debtService') }}</dt><dd>{{ t('guide.budget.debtService.body') }}</dd>
            <dt>{{ t('budget.implementationRate') }}</dt><dd>{{ t('guide.budget.implementationRate.body') }}</dd>
            <dt>{{ t('guide.budget.allocationReleased.term') }}</dt><dd v-html="t('guide.budget.allocationReleased.body')"></dd>
          </dl>
        </div>
      </section>

      <section id="other">
        <h2><span class="num">5</span> {{ t('guide.other.title') }}</h2>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('guide.other.zoneTerm') }}</dt>
            <dd>{{ t('guide.other.zoneBody') }}</dd>
          </dl>
        </div>
        <div class="zone-grid">
          <div v-for="z in zones" :key="z" class="zone-chip">{{ t('zone.' + z) }}</div>
        </div>
      </section>

      <section id="methodology">
        <h2><span class="num">6</span> {{ t('guide.methodology.title') }}</h2>
        <p class="section-lede">{{ t('guide.methodology.lede') }}</p>

        <div class="subgroup-label">{{ t('guide.methodology.sourcesLabel') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('guide.methodology.primary.term') }}</dt><dd>{{ t('guide.methodology.primary.body') }}</dd>
            <dt>{{ t('guide.methodology.reporting.term') }}</dt><dd>{{ t('guide.methodology.reporting.body') }}</dd>
            <dt>{{ t('guide.methodology.expert.term') }}</dt><dd>{{ t('guide.methodology.expert.body') }}</dd>
            <dt>{{ t('guide.methodology.notUsed.term') }}</dt><dd>{{ t('guide.methodology.notUsed.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.methodology.numbersLabel') }}</div>
        <p class="section-lede">{{ t('guide.methodology.numbersBody') }}</p>

        <div class="subgroup-label">{{ t('guide.methodology.cadenceLabel') }}</div>
        <p class="section-lede">{{ t('guide.methodology.cadenceBody') }}</p>

        <div class="subgroup-label">{{ t('guide.methodology.correctionsLabel') }}</div>
        <p class="section-lede" v-html="t('guide.methodology.correctionsBody')"></p>
      </section>

      <section id="coverage">
        <h2><span class="num">7</span> {{ t('guide.coverage.title') }}</h2>
        <p class="section-lede">{{ t('guide.coverage.lede') }}</p>

        <div class="subgroup-label">{{ t('guide.coverage.coveredLabel') }}</div>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('guide.coverage.federal.term') }}</dt><dd>{{ t('guide.coverage.federal.body') }}</dd>
            <dt>{{ t('guide.coverage.states.term') }}</dt><dd>{{ t('guide.coverage.states.body') }}</dd>
            <dt>{{ t('guide.coverage.notYetCovered.term') }}</dt><dd>{{ t('guide.coverage.notYetCovered.body') }}</dd>
          </dl>
        </div>

        <div class="subgroup-label">{{ t('guide.coverage.whyShortLabel') }}</div>
        <p class="section-lede">{{ t('guide.coverage.whyShortBody') }}</p>

        <div class="subgroup-label">{{ t('guide.coverage.interimLabel') }}</div>
        <p class="section-lede">{{ t('guide.coverage.interimBody') }}</p>
      </section>

      <section id="independence">
        <h2><span class="num">8</span> {{ t('guide.independence.title') }}</h2>
        <p class="section-lede">{{ t('guide.independence.lede') }}</p>
        <div class="card">
          <dl class="term-list">
            <dt>{{ t('guide.independence.whatThisIs.term') }}</dt><dd>{{ t('guide.independence.whatThisIs.body') }}</dd>
            <dt>{{ t('guide.independence.whoDecides.term') }}</dt><dd>{{ t('guide.independence.whoDecides.body') }}</dd>
            <dt>{{ t('guide.independence.funding.term') }}</dt><dd>{{ t('guide.independence.funding.body') }}</dd>
            <dt>{{ t('guide.independence.openByDefault.term') }}</dt><dd>{{ t('guide.independence.openByDefault.body') }}</dd>
            <dt>{{ t('guide.independence.ownership.term') }}</dt><dd>{{ t('guide.independence.ownership.body') }}</dd>
            <dt>{{ t('guide.independence.correctionsOverReputation.term') }}</dt><dd>{{ t('guide.independence.correctionsOverReputation.body') }}</dd>
          </dl>
        </div>
      </section>

      <section id="changes">
        <h2><span class="num">9</span> {{ t('guide.changes.title') }}</h2>
        <p class="section-lede">{{ t('guide.changes.lede') }}</p>
        <div class="card">
          <dl class="term-list">
            <dt>{{ METHODOLOGY_VERSION }} <span class="badge">{{ t('guide.changes.v14.date') }}</span></dt>
            <dd>{{ t('guide.changes.v14.body') }}</dd>
            <dt>v1.3 <span class="badge">{{ t('guide.changes.v13.date') }}</span></dt>
            <dd>{{ t('guide.changes.v13.body') }}</dd>
            <dt>v1.2 <span class="badge">{{ t('guide.changes.v12.date') }}</span></dt>
            <dd>{{ t('guide.changes.v12.body') }}</dd>
            <dt>v1.1 <span class="badge">{{ t('guide.changes.v11.date') }}</span></dt>
            <dd>{{ t('guide.changes.v11.body') }}</dd>
            <dt>v1.0 <span class="badge">{{ t('guide.changes.v10.date') }}</span></dt>
            <dd>{{ t('guide.changes.v10.body') }}</dd>
          </dl>
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
.version { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: 12px; color: var(--faint); margin: 12px 0 0; }
.version a { color: var(--faint); }

nav.toc { background: var(--surface); border-bottom: 1px solid var(--line); padding: 10px 24px; overflow-x: auto; white-space: nowrap; }
nav.toc .wrap { display: flex; gap: 18px; }
nav.toc a { font-size: 13px; font-weight: 700; color: var(--muted); text-decoration: none; }
nav.toc a:hover { color: var(--g700); }

main { padding: 40px 24px 80px; }
section { margin-bottom: 52px; }
h2 { font-size: 20px; font-weight: 800; color: var(--g800); margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
h2 .num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--g100); color: var(--g700); font-size: 12px; font-weight: 800;
}
.section-lede { color: var(--muted); margin: 0 0 16px; max-width: 640px; }
.section-lede :deep(a) { color: var(--g700); }

.card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 4px 20px; }

dl.term-list { margin: 0; }
dl.term-list dt { display: inline-block; font-weight: 800; color: var(--ink); font-size: 14px; padding: 14px 0 2px; }
dl.term-list dt .badge {
  display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.03em;
  padding: 1px 7px; border-radius: 999px; margin-left: 8px; text-transform: uppercase;
  background: var(--g100); color: var(--g800); vertical-align: middle;
}
dl.term-list dd { margin: 0 0 14px; padding-bottom: 14px; color: var(--muted); font-size: 13.5px; border-bottom: 1px solid var(--line); }
dl.term-list dd:last-of-type { border-bottom: none; }
dl.term-list dd :deep(a) { color: var(--g700); }

.hint { font-size: 12.5px; color: var(--faint); margin: 8px 0 0; }
.hint :deep(strong) { color: var(--ink); }

.subgroup-label { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: var(--faint); margin: 22px 0 4px; }
.subgroup-label:first-child { margin-top: 0; }

.zone-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.zone-chip { background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 8px 12px; font-size: 13px; font-weight: 700; text-align: center; }

footer { border-top: 1px solid var(--line-strong); padding: 28px 24px; text-align: center; color: var(--faint); font-size: 12.5px; }
footer .footer-tag { margin: 0; }

@media (max-width: 600px) {
  .zone-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
