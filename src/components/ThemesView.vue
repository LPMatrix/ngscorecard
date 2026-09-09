<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const LABELS = { kept: 'Kept', partial: 'Partial', broken: 'Broken', pending: 'In progress' }
const label = (s) => LABELS[s] || s
const yr = (ts) => String(ts || '').slice(0, 4)

const entries = computed(() => props.data?.entries || [])
const adminCount = computed(() => new Set(entries.value.map((e) => e.adminKey)).size)
const tally = computed(() => {
  const order = ['kept', 'partial', 'broken', 'pending']
  const c = {}
  for (const e of entries.value) c[e.status] = (c[e.status] || 0) + 1
  return order.filter((k) => c[k]).map((k) => ({ key: k, n: c[k], label: LABELS[k] }))
})

const adminHref = (e) => `/${e.adminKey}`
const promiseHref = (e) => `/${e.adminKey}?id=${e.id}`
</script>

<template>
  <div class="tv">
    <!-- ── Index: every recurring commitment ── -->
    <template v-if="data.mode === 'index'">
      <nav class="tv-back"><a href="/">&larr; NGScorecard</a></nav>
      <header class="tv-head">
        <p class="tv-eyebrow">Recurring commitments</p>
        <h1 class="tv-title">Promises made again and again</h1>
        <p class="tv-lede">
          Some pledges recur across administration after administration. Each one below is
          threaded through every government that made it &mdash; military and civilian &mdash;
          with what actually happened.
        </p>
      </header>

      <ul class="tv-list">
        <li v-for="th in data.list" :key="th.slug">
          <a :href="`/themes/${th.slug}`" class="tv-card">
            <div class="tv-card-top">
              <span class="tv-card-title">{{ th.title }}</span>
              <span class="tv-card-count">{{ th.adminCount }} administrations</span>
            </div>
            <p class="tv-card-blurb">{{ th.blurb }}</p>
            <span v-if="th.category" class="tv-card-cat">{{ th.category }}</span>
          </a>
        </li>
      </ul>
    </template>

    <!-- ── Lineage: one commitment across administrations ── -->
    <template v-else-if="data.mode === 'lineage'">
      <nav class="tv-back"><a href="/themes">&larr; All recurring commitments</a></nav>
      <header class="tv-head">
        <p class="tv-eyebrow">{{ data.theme.category || 'Recurring commitment' }}</p>
        <h1 class="tv-title">{{ data.theme.title }}</h1>
        <p class="tv-lede">{{ data.theme.blurb }}</p>
        <div class="tv-summary">
          <span class="tv-summary-count">Promised by <b>{{ adminCount }}</b> administrations</span>
          <span v-for="s in tally" :key="s.key" :class="['tv-tag', s.key]">{{ s.n }} {{ s.label.toLowerCase() }}</span>
        </div>
      </header>

      <ol class="tv-rail">
        <li v-for="e in data.entries" :key="e.id" :class="['tv-node', e.status]">
          <div class="tv-node-head">
            <span class="tv-year">{{ yr(e.termStart) }}</span>
            <a :href="adminHref(e)" class="tv-admin">{{ e.adminName }}</a>
            <span v-if="e.party" class="tv-party">{{ e.party }}</span>
            <span :class="['tv-pill', e.status]">{{ label(e.status) }}</span>
          </div>
          <a :href="promiseHref(e)" class="tv-promise">{{ e.title }}</a>
          <p class="tv-assess">{{ e.assessment }}</p>
          <div class="tv-node-foot">
            <a v-if="e.source" :href="e.source" target="_blank" rel="noopener">{{ e.sourceLabel || 'Source' }}</a>
            <span v-if="e.updated"> &middot; updated {{ e.updated }}</span>
          </div>
        </li>
      </ol>

      <p class="tv-foot">
        Each entry is one rated promise &mdash; follow it to that administration&rsquo;s full
        scorecard. Ratings use the four verdicts defined in the
        <a href="/guide#ratings">methodology</a>.
      </p>
    </template>
  </div>
</template>

<style scoped>
.tv {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

.tv-back { margin-bottom: 20px; }
.tv-back a {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pt-text-muted);
  text-decoration: none;
}
.tv-back a:hover { color: var(--pt-link); }

.tv-head { border-bottom: 1px solid var(--pt-line); padding-bottom: 22px; margin-bottom: 8px; }
.tv-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
  margin-bottom: 10px;
}
.tv-title {
  font-size: clamp(24px, 3.4vw, 32px);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.015em;
  margin: 0 0 12px;
  color: var(--pt-text);
  text-wrap: balance;
}
.tv-lede { max-width: 60ch; font-size: 15px; line-height: 1.6; color: var(--pt-text-muted); margin: 0; }

.tv-summary { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; margin-top: 16px; }
.tv-summary-count { font-size: 12.5px; color: var(--pt-text-muted); }
.tv-summary-count b { color: var(--pt-text); }
.tv-tag {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
}
.tv-tag.kept { color: var(--pt-kept); background: var(--pt-kept-bg); }
.tv-tag.partial { color: var(--pt-partial); background: var(--pt-partial-bg); }
.tv-tag.broken { color: var(--pt-broken); background: var(--pt-broken-bg); }
.tv-tag.pending { color: var(--pt-pending); background: var(--pt-pending-bg); }

/* ── index list ── */
.tv-list { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.tv-card {
  display: block;
  border: 1px solid var(--pt-line);
  border-radius: 10px;
  padding: 16px 18px;
  background: var(--pt-surface);
  text-decoration: none;
  color: inherit;
  transition: border-color 120ms ease, background 120ms ease;
}
.tv-card:hover { border-color: var(--pt-green-600); background: var(--pt-surface-hover); }
.tv-card-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.tv-card-title { font-size: 16px; font-weight: 700; color: var(--pt-text); }
.tv-card-count { font-size: 11.5px; color: var(--pt-text-faint); white-space: nowrap; }
.tv-card-blurb { font-size: 13px; line-height: 1.55; color: var(--pt-text-muted); margin: 6px 0 0; }
.tv-card-cat {
  display: inline-block;
  margin-top: 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pt-text-faint);
}

/* ── lineage rail ── */
.tv-rail { list-style: none; margin: 26px 0 0; padding: 0; position: relative; }
.tv-rail::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--pt-line-strong);
}
.tv-node { position: relative; padding: 0 0 22px 30px; }
.tv-node:last-child { padding-bottom: 0; }
.tv-node::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--pt-surface);
  border: 2px solid var(--pt-line-strong);
}
.tv-node.kept::before { border-color: var(--pt-kept); }
.tv-node.partial::before { border-color: var(--pt-partial); }
.tv-node.broken::before { border-color: var(--pt-broken); }
.tv-node.pending::before { border-color: var(--pt-pending); }

.tv-node-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tv-year {
  font-size: 12px;
  font-weight: 700;
  color: var(--pt-text-faint);
  font-variant-numeric: tabular-nums;
}
.tv-admin { font-size: 14px; font-weight: 700; color: var(--pt-text); text-decoration: none; }
.tv-admin:hover { color: var(--pt-link); text-decoration: underline; }
.tv-party { font-size: 11px; color: var(--pt-text-faint); }
.tv-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: auto;
}
.tv-pill.kept { color: var(--pt-kept); background: var(--pt-kept-bg); }
.tv-pill.partial { color: var(--pt-partial); background: var(--pt-partial-bg); }
.tv-pill.broken { color: var(--pt-broken); background: var(--pt-broken-bg); }
.tv-pill.pending { color: var(--pt-pending); background: var(--pt-pending-bg); }

.tv-promise {
  display: block;
  margin: 7px 0 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--pt-text);
  text-decoration: none;
}
.tv-promise:hover { color: var(--pt-link); text-decoration: underline; }
.tv-assess { font-size: 12.5px; line-height: 1.55; color: var(--pt-text-muted); margin: 0; }
.tv-node-foot { margin-top: 6px; font-size: 11px; color: var(--pt-text-faint); }
.tv-node-foot a { color: var(--pt-text-faint); }
.tv-node-foot a:hover { color: var(--pt-link); }

.tv-foot {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid var(--pt-line);
  font-size: 12.5px;
  color: var(--pt-text-muted);
}
.tv-foot a { color: var(--pt-link); }

@media (max-width: 560px) {
  .tv-card-top { flex-direction: column; gap: 2px; }
  .tv-pill { margin-left: 0; }
}
</style>
