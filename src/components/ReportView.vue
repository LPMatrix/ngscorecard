<script setup>
// Term report card — the one-page verdict at /<admin>/report. Everything here
// is derived from the promises / fraud / budget the scorecard already loads
// (see src/lib/termReport.js); nothing is stored or edited separately, so it
// updates itself whenever a rating changes.
import { computed, inject, ref } from 'vue'
import { canonicalizeCategory } from '../i18n/categories.js'
import { buildTermReport } from '../lib/termReport.js'

const props = defineProps({
  admin: { type: Object, required: true },
  promises: { type: Array, default: () => [] },
  fraud: { type: Array, default: () => [] },
  budget: { type: Array, default: () => [] },
})

const t = inject('t', (k) => k)
const lp = inject('lp', (p) => p)

const report = computed(() => buildTermReport({
  admin: props.admin,
  promises: props.promises,
  fraud: props.fraud,
  budget: props.budget,
}))

const name = computed(() => props.admin.title || props.admin.name)
const base = computed(() => lp(`/${props.admin.key}`))
const catLabel = (c) => (c ? t(`category.${canonicalizeCategory(c)}`) : '')
const cardHref = (id) => `${base.value}?id=${id}`

const subline = computed(() => {
  const a = props.admin
  const role = a.level === 'state' ? t('report.governorOf', { state: a.state }) : t('report.president')
  return [role, a.party, a.term].filter(Boolean).join(' · ')
})

const segments = computed(() => {
  const r = report.value
  return [
    { key: 'kept', n: r.kept },
    { key: 'partial', n: r.partial },
    { key: 'broken', n: r.broken },
    { key: 'pending', n: r.pending },
  ].filter((s) => s.n > 0)
})
const width = (n) => `${(n / (report.value.total || 1)) * 100}%`
const barLabel = computed(() =>
  segments.value.map((s) => `${t(`status.${s.key}`)} ${s.n}`).join(', '))

const fraudBreakdown = computed(() => {
  const f = report.value.fraud
  if (!f) return []
  return ['convicted', 'ongoing', 'dismissed', 'acquitted']
    .filter((k) => f[k] > 0)
    .map((k) => ({ key: k, n: f[k] }))
})

const ogPath = computed(() => `/api/og/report/${props.admin.key}.png`)

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.origin + window.location.pathname)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* clipboard unavailable — the address bar still has the link */ }
}
</script>

<template>
  <div class="rv">
    <nav class="rv-back"><a :href="base">{{ t('report.back') }}</a></nav>

    <header class="rv-head">
      <p class="rv-eyebrow">{{ t('report.eyebrow') }}</p>
      <h1 class="rv-title">{{ name }}</h1>
      <p class="rv-sub">{{ subline }}</p>
    </header>

    <!-- Nothing tracked yet: say so rather than show a wall of zeroes. -->
    <section v-if="!report.total" class="rv-empty">
      <p>{{ t('report.headlineNone') }}</p>
      <a :href="base" class="rv-btn primary">{{ t('report.viewScorecard') }}</a>
    </section>

    <template v-else>
      <section class="rv-verdict" aria-labelledby="rv-verdict-line">
        <div class="rv-verdict-num" aria-hidden="true">{{ report.keptPct }}%</div>
        <div>
          <h2 id="rv-verdict-line" class="rv-verdict-line">
            {{ t('report.headlineKept', { kept: report.kept, total: report.total }) }}
          </h2>
          <p v-if="report.sitting" class="rv-sitting">{{ t('report.sittingNote') }}</p>
        </div>
      </section>

      <div class="rv-stats">
        <div class="rv-stat">
          <div class="rv-stat-v">{{ report.total }}</div>
          <div class="rv-stat-l">{{ t('stats.totalTracked') }}</div>
        </div>
        <div class="rv-stat kept">
          <div class="rv-stat-v">{{ report.kept }}</div>
          <div class="rv-stat-l">{{ t('stats.kept') }}</div>
        </div>
        <div class="rv-stat partial">
          <div class="rv-stat-v">{{ report.partial }}</div>
          <div class="rv-stat-l">{{ t('stats.partialMixed') }}</div>
        </div>
        <div class="rv-stat broken">
          <div class="rv-stat-v">{{ report.broken }}</div>
          <div class="rv-stat-l">{{ t('stats.broken') }}</div>
        </div>
        <div v-if="report.pending" class="rv-stat pending">
          <div class="rv-stat-v">{{ report.pending }}</div>
          <div class="rv-stat-l">{{ t('status.pending') }}</div>
        </div>
      </div>

      <div class="rv-bar" role="img" :aria-label="barLabel">
        <span v-for="s in segments" :key="s.key" :class="['rv-seg', s.key]" :style="{ width: width(s.n) }"></span>
      </div>
      <ul class="rv-legend">
        <li v-for="s in segments" :key="s.key" :class="s.key">{{ t(`status.${s.key}`) }} · {{ s.n }}</li>
      </ul>

      <div class="rv-highlights">
        <section class="rv-col kept" aria-labelledby="rv-wins">
          <h2 id="rv-wins" class="rv-col-title">{{ t('report.delivered') }}</h2>
          <ul v-if="report.wins.length" class="rv-list">
            <li v-for="p in report.wins" :key="p.id">
              <a :href="cardHref(p.id)">{{ p.title }}</a>
              <span class="rv-cat">{{ catLabel(p.category) }}</span>
            </li>
          </ul>
          <p v-else class="rv-none">{{ t('report.noneDelivered') }}</p>
        </section>
        <section class="rv-col broken" aria-labelledby="rv-fails">
          <h2 id="rv-fails" class="rv-col-title">{{ t('report.fellShort') }}</h2>
          <ul v-if="report.failures.length" class="rv-list">
            <li v-for="p in report.failures" :key="p.id">
              <a :href="cardHref(p.id)">{{ p.title }}</a>
              <span class="rv-cat">{{ catLabel(p.category) }}</span>
            </li>
          </ul>
          <p v-else class="rv-none">{{ t('report.noneFellShort') }}</p>
        </section>
      </div>
      <p class="rv-note">{{ t('report.highlightsNote') }}</p>

      <div v-if="report.fraud || report.budget" class="rv-facts">
        <section v-if="report.fraud" class="rv-fact" aria-labelledby="rv-fraud">
          <h2 id="rv-fraud" class="rv-fact-title">{{ t('report.fraudTitle') }}</h2>
          <div class="rv-fact-big">{{ t('report.fraudCases', { n: report.fraud.total }) }}</div>
          <ul v-if="fraudBreakdown.length" class="rv-chips">
            <li v-for="c in fraudBreakdown" :key="c.key">{{ t(`status.${c.key}`) }} · {{ c.n }}</li>
          </ul>
          <p class="rv-fact-note">{{ t('report.fraudNote') }}</p>
          <a :href="lp(`/${admin.key}/fraud`)" class="rv-fact-link">{{ t('report.fraudLink') }}</a>
        </section>
        <section v-if="report.budget" class="rv-fact" aria-labelledby="rv-budget">
          <h2 id="rv-budget" class="rv-fact-title">{{ t('report.budgetTitle') }}</h2>
          <div class="rv-fact-big">
            <template v-if="report.budget.avgImplementation != null">{{ report.budget.avgImplementation }}%</template>
            <template v-else>{{ t('report.budgetCycles', { n: report.budget.cycles }) }}</template>
          </div>
          <p v-if="report.budget.avgImplementation != null" class="rv-fact-note">
            {{ t('report.budgetAvg', { n: report.budget.ratedCycles }) }}
          </p>
          <p v-else class="rv-fact-note">{{ t('report.budgetNoFigure') }}</p>
          <a :href="lp(`/${admin.key}/budget`)" class="rv-fact-link">{{ t('report.budgetLink') }}</a>
        </section>
      </div>

      <div class="rv-actions">
        <a :href="base" class="rv-btn primary">{{ t('report.viewScorecard') }}</a>
        <button type="button" class="rv-btn" @click="copyLink">{{ copied ? t('viewActions.linkCopied') : t('report.copyLink') }}</button>
        <a :href="ogPath" :download="`ngscorecard-${admin.key}-report.png`" class="rv-btn">{{ t('report.downloadImage') }}</a>
      </div>
    </template>

    <p class="rv-foot">
      <span v-if="admin.reviewed">{{ t('report.reviewed', { date: admin.reviewed }) }} · </span>{{ t('report.methodPrefix') }}<a :href="`${lp('/guide')}#ratings`">{{ t('report.methodLink') }}</a>{{ t('report.methodSuffix') }}
    </p>
  </div>
</template>

<style scoped>
.rv {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

.rv-back { margin-bottom: 20px; }
.rv-back a { font-size: 12.5px; font-weight: 600; color: var(--pt-text-muted); text-decoration: none; }
.rv-back a:hover { color: var(--pt-link); }

.rv-head { border-bottom: 1px solid var(--pt-line); padding-bottom: 20px; }
.rv-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pt-gold-700);
  margin: 0 0 10px;
}
.rv-title {
  font-size: clamp(28px, 4.2vw, 40px);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: var(--pt-text);
  text-wrap: balance;
}
.rv-sub { font-size: 14px; color: var(--pt-text-muted); margin: 0; }

.rv-empty { padding: 36px 0; }
.rv-empty p { font-size: 15px; color: var(--pt-text-muted); margin: 0 0 18px; }

/* ── verdict ── */
.rv-verdict {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 26px 0 18px;
}
.rv-verdict-num {
  font-size: clamp(56px, 11vw, 92px);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--pt-green-700);
  font-variant-numeric: tabular-nums;
}
.rv-verdict-line { font-size: clamp(17px, 2.6vw, 22px); line-height: 1.25; font-weight: 700; margin: 0; color: var(--pt-text); }
.rv-sitting { font-size: 13px; line-height: 1.5; color: var(--pt-text-muted); margin: 6px 0 0; max-width: 46ch; }

/* ── stat tiles ── */
.rv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.rv-stat {
  border: 1px solid var(--pt-line);
  border-radius: 10px;
  background: var(--pt-surface);
  padding: 12px 14px;
}
.rv-stat-v { font-size: 26px; font-weight: 800; line-height: 1.1; color: var(--pt-text); font-variant-numeric: tabular-nums; }
.rv-stat-l { font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--pt-text-faint); margin-top: 4px; }
.rv-stat.kept .rv-stat-v { color: var(--pt-kept); }
.rv-stat.partial .rv-stat-v { color: var(--pt-partial); }
.rv-stat.broken .rv-stat-v { color: var(--pt-broken); }
.rv-stat.pending .rv-stat-v { color: var(--pt-pending); }

/* ── stacked bar ── */
.rv-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: var(--pt-line); margin: 18px 0 8px; }
.rv-seg { display: block; height: 100%; }
.rv-seg.kept { background: var(--pt-kept-bar); }
.rv-seg.partial { background: var(--pt-gold-500); }
.rv-seg.broken { background: var(--pt-red-700); }
.rv-seg.pending { background: var(--pt-line-strong); }
.rv-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; color: var(--pt-text-muted); }
.rv-legend li::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; vertical-align: middle; background: var(--pt-line-strong); }
.rv-legend li.kept::before { background: var(--pt-kept-bar); }
.rv-legend li.partial::before { background: var(--pt-gold-500); }
.rv-legend li.broken::before { background: var(--pt-red-700); }

/* ── delivered / fell short ── */
.rv-highlights { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 30px; }
.rv-col { border: 1px solid var(--pt-line); border-radius: 10px; background: var(--pt-surface); padding: 16px 18px; border-top-width: 3px; }
.rv-col.kept { border-top-color: var(--pt-kept-bar); }
.rv-col.broken { border-top-color: var(--pt-red-700); }
.rv-col-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 10px; }
.rv-col.kept .rv-col-title { color: var(--pt-kept); }
.rv-col.broken .rv-col-title { color: var(--pt-broken); }
.rv-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.rv-list a { font-size: 14px; font-weight: 600; line-height: 1.35; color: var(--pt-text); text-decoration: none; }
.rv-list a:hover { color: var(--pt-link); text-decoration: underline; }
.rv-cat { display: block; margin-top: 2px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--pt-text-faint); }
.rv-none { font-size: 13px; color: var(--pt-text-faint); margin: 0; }
.rv-note { font-size: 12px; color: var(--pt-text-faint); margin: 10px 0 0; }

/* ── fraud / budget ── */
.rv-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 30px; }
.rv-fact { border: 1px solid var(--pt-line); border-radius: 10px; background: var(--pt-surface); padding: 16px 18px; }
.rv-fact-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--pt-text-faint); margin: 0 0 8px; }
.rv-fact-big { font-size: 24px; font-weight: 800; line-height: 1.15; color: var(--pt-text); font-variant-numeric: tabular-nums; }
.rv-chips { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.rv-chips li { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: var(--pt-pending-bg); color: var(--pt-pending); }
.rv-fact-note { font-size: 12.5px; line-height: 1.5; color: var(--pt-text-muted); margin: 10px 0 0; }
.rv-fact-link { display: inline-block; margin-top: 10px; font-size: 12.5px; font-weight: 600; color: var(--pt-link); text-decoration: none; }
.rv-fact-link:hover { text-decoration: underline; }

/* ── actions ── */
.rv-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
.rv-btn {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid var(--pt-line-strong);
  background: var(--pt-surface);
  color: var(--pt-text);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}
.rv-btn:hover { border-color: var(--pt-green-700); }
.rv-btn.primary { background: var(--pt-green-700); border-color: var(--pt-green-700); color: #fff; }
.rv-btn.primary:hover { background: var(--pt-green-800); }

.rv-foot { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--pt-line); font-size: 12.5px; color: var(--pt-text-muted); }
.rv-foot a { color: var(--pt-link); }

@media (max-width: 620px) {
  .rv-verdict { flex-direction: column; align-items: flex-start; gap: 8px; }
  .rv-highlights { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .rv-btn { transition: none; }
}
</style>
