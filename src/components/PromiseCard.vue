<script setup>
import { computed, inject } from 'vue'

const t = inject('t', (k) => k)
// Prefixes an internal path with the active locale (identity for `en`).
const lp = inject('lp', (p) => p)

const props = defineProps({
  item:       { type: Object,  required: true },
  field1:     { type: String,  required: true },
  field2:     { type: String,  required: true },
  field3:     { type: String,  default: null },
  label1:     { type: String,  default: '' },
  label2:     { type: String,  default: '' },
  label3:     { type: String,  default: '' },
  isExpanded: { type: Boolean, default: false },
  // Resolved "See also" targets for this card: [{ id, title }]. Empty unless
  // the parent passes them (currently only the Promises tab). Dormant until
  // seed data sets a promise's `related` array.
  related:    { type: Array,   default: () => [] },
  // Public change log for this entry, newest first — from entry_history.
  // Empty until an editor has changed the entry.
  history:    { type: Array,   default: () => [] },
  // Which table this card is from — lets "Report an issue" attach context.
  entryTable: { type: String,  default: null },
})

const emit = defineEmits(['toggle', 'share', 'goto', 'report'])

// Status/verdict → catalogue key. Covers every section's status vocabulary
// plus the fraud government-response verdicts.
const BADGE_KEY = {
  kept: 'status.kept', broken: 'status.broken', partial: 'status.partial',
  pending: 'status.pending', fixed: 'status.fixed',
  convicted: 'status.convicted', ongoing: 'status.ongoing',
  dismissed: 'status.dismissed', acquitted: 'status.acquitted',
  pursuing: 'response.pursuing', stalled: 'response.stalled',
  political: 'response.political', abandoned: 'response.abandoned',
  complied: 'response.complied',
  implemented: 'status.implemented', reversed: 'status.reversed', ignored: 'status.ignored',
  good: 'status.good', fair: 'status.fair', poor: 'status.poor',
  sacked: 'status.sacked', resigned: 'status.resigned',
  passed: 'status.passed',
  won: 'status.won', lost: 'status.lost', settled: 'status.settled',
  serving: 'status.serving',
}
const badgeLabel = (v) => (BADGE_KEY[v] ? t(BADGE_KEY[v]) : v)

// Standardised editorial banners — Wikipedia-style status notices instead of
// ad-hoc prose. Keyed off item.flag; nothing renders when it's absent.
const FLAG_META = {
  disputed:   { cls: 'disputed',   labelKey: 'flag.disputed.label',   textKey: 'flag.disputed.text' },
  correction: { cls: 'correction', labelKey: 'flag.correction.label', textKey: 'flag.correction.text' },
  review:     { cls: 'review',     labelKey: 'flag.review.label',     textKey: 'flag.review.text' },
}
const flag = computed(() => {
  const f = FLAG_META[props.item.flag]
  return f ? { cls: f.cls, label: t(f.labelKey), text: t(f.textKey) } : null
})

// "Month YYYY" (e.g. "May 2025") or bare "YYYY" → Date, else null.
function parseMonthYear(s) {
  if (!s) return null
  const m = String(s).trim().match(/^(?:([A-Za-z]+)\s+)?(\d{4})$/)
  if (!m) return null
  const year = Number(m[2])
  const month = m[1]
    ? ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        .indexOf(m[1].slice(0, 3).toLowerCase())
    : 0
  if (m[1] && month === -1) return null
  return new Date(year, month, 1)
}

// A row untouched for this long, while the tracker keeps moving, is flagged as
// possibly out of date. Derived only — no data field.
const STALE_MONTHS = 18
const isStale = computed(() => {
  const d = parseMonthYear(props.item.updated)
  if (!d) return false
  const now = new Date()
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  return months >= STALE_MONTHS
})

// 'none' means the entry carries no source at all; 'official' means the host
// is a government domain; 'linked' is any other source.
const OFFICIAL_HOST = /(^|\.)gov(\.[a-z]{2})?$/i
const sourceKind = computed(() => {
  const url = props.item.source
  if (!url) return props.item.sourceLabel ? 'linked' : 'none'
  try {
    return OFFICIAL_HOST.test(new URL(url).hostname) ? 'official' : 'linked'
  } catch {
    return 'linked'
  }
})

// The methodology's source tiers (guide §6). Editor-set `sourceTier` wins;
// when it's unset we still show "Primary" for a .gov host from the heuristic.
const SOURCE_TIER = {
  official:  { cls: 'primary',   labelKey: 'sourceTier.primary.label',   titleKey: 'sourceTier.primary.title' },
  reporting: { cls: 'reporting', labelKey: 'sourceTier.reporting.label', titleKey: 'sourceTier.reporting.title' },
  analysis:  { cls: 'analysis',  labelKey: 'sourceTier.analysis.label',  titleKey: 'sourceTier.analysis.title' },
  weak:      { cls: 'weak',      labelKey: 'sourceTier.weak.label',      titleKey: 'sourceTier.weak.title' },
}
const sourceBadge = computed(() => {
  const tier = props.item.sourceTier
  const meta = (tier && SOURCE_TIER[tier]) || (sourceKind.value === 'official' ? SOURCE_TIER.official : null)
  return meta ? { cls: meta.cls, label: t(meta.labelKey), title: t(meta.titleKey) } : null
})

// Public change history (entry_history) — "correct in the open".
const HIST_KIND_KEY = { rating_change: 'card.hist.rating', reclassify: 'card.hist.tier', correction: 'card.hist.correction' }
function histValue(v) {
  if (v == null || v === '') return '—'
  return badgeLabel(v)
}
function fmtHistDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const historyItems = computed(() => props.history.map(h => ({
  date: fmtHistDate(h.changedAt),
  line: h.kind === 'correction'
    ? t('card.hist.corrected', { field: h.field })
    : t('card.hist.line', { kind: HIST_KIND_KEY[h.kind] ? t(HIST_KIND_KEY[h.kind]) : h.field, old: histValue(h.oldValue), new: histValue(h.newValue) }),
  note: h.note || null,
})))

// Ask the app to open the "suggest a correction" modal for this entry.
function reportIssue() {
  emit('report', {
    entryTable: props.entryTable,
    entryId: props.item.id,
    title: props.item.title || props.item.name || null,
    administration: props.item.administration || null,
  })
}
</script>

<template>
  <div :class="['pt-card', { expanded: isExpanded }]" @click="emit('toggle', item.id)">
    <div v-if="flag" :class="['pt-card-flag', `pt-card-flag-${flag.cls}`]">
      <strong>{{ flag.label }}.</strong> {{ flag.text }}
    </div>

    <div class="pt-card-header">
      <div class="pt-card-meta">
        <div class="pt-card-category">{{ item.category }}</div>
        <div class="pt-card-title">{{ item.title }}</div>
      </div>
      <div class="pt-card-right">
        <!-- Primary status badge -->
        <span :class="['pt-badge', `pt-badge-${item.status}`]">
          {{ badgeLabel(item.status) }}
        </span>
        <!-- Secondary response verdict badge (fraud tab) -->
        <span
          v-if="item.responseVerdict"
          :class="['pt-badge', 'pt-badge-response', `pt-badge-rv-${item.responseVerdict}`]"
        >{{ badgeLabel(item.responseVerdict) }}</span>
        <button
          class="pt-share-btn"
          :title="t('card.copyLinkTitle', { id: item.id })"
          @click.stop="emit('share', item.id)"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M8 1.5h3.5v3.5M11.5 1.5L7 6M5.5 2.5H2a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="pt-chevron">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2.5 4.5L6.5 8.5L10.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    </div>

    <div class="pt-card-detail-wrap">
      <div class="pt-card-detail-inner">
        <div class="pt-card-detail">
          <div class="pt-detail-grid">
            <div>
              <div class="pt-detail-label">{{ label1 }}</div>
              <div class="pt-detail-text">{{ field1 }}</div>
            </div>
            <div>
              <div class="pt-detail-label">{{ label2 }}</div>
              <div class="pt-detail-text">{{ field2 }}</div>
            </div>
          </div>
          <!-- Third field: government response narrative -->
          <div v-if="field3" class="pt-detail-response">
            <div class="pt-detail-label">{{ label3 }}</div>
            <div class="pt-detail-text">{{ field3 }}</div>
          </div>
          <!-- Recurring commitment: this promise recurs across administrations -->
          <div v-if="item.theme" class="pt-detail-response pt-lineage">
            <a class="pt-lineage-link" :href="lp(`/themes/${item.theme}`)" @click.stop>
              {{ t('card.recurringCommitment') }}
            </a>
          </div>
          <!-- See also: related promises in the same administration -->
          <div v-if="related.length" class="pt-detail-response pt-see-also">
            <div class="pt-detail-label">{{ t('card.seeAlso') }}</div>
            <button
              v-for="r in related"
              :key="r.id"
              class="pt-see-also-link"
              @click.stop="emit('goto', r.id)"
            >{{ r.title }}</button>
          </div>
          <!-- Public change history for this entry -->
          <div v-if="historyItems.length" class="pt-detail-response pt-history">
            <div class="pt-detail-label">{{ t('card.changeHistory') }}</div>
            <div v-for="(h, i) in historyItems" :key="i" class="pt-history-row">
              <span class="pt-history-date">{{ h.date }}</span>
              <span class="pt-history-line">{{ h.line }}</span>
              <span v-if="h.note" class="pt-history-note"> — {{ h.note }}</span>
            </div>
          </div>
          <div class="pt-detail-footer">
            <span v-if="sourceKind === 'none'" class="pt-source-none" :title="t('card.sourceNotLinkedTitle')">{{ t('card.sourceNotLinked') }}</span>
            <template v-else>
              <span>{{ t('card.source') }}</span>
              <a class="pt-source-link" :href="item.source" target="_blank" rel="noopener" @click.stop>
                {{ item.sourceLabel || item.source }}
              </a>
              <span
                v-if="sourceBadge"
                :class="['pt-source-flag', `pt-source-flag--${sourceBadge.cls}`]"
                :title="sourceBadge.title"
              >{{ sourceBadge.label }}</span>
            </template>
            <span v-if="item.updated">{{ t('card.updated', { date: item.updated }) }}</span>
            <span v-if="isStale" class="pt-stale-note" :title="t('card.needsReviewTitle')">{{ t('card.needsReview') }}</span>
            <button class="pt-report-link" @click.stop="reportIssue" :title="t('card.reportIssueTitle')">{{ t('card.reportIssue') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
