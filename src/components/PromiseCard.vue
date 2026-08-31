<script setup>
import { computed } from 'vue'

const props = defineProps({
  item:       { type: Object,  required: true },
  field1:     { type: String,  required: true },
  field2:     { type: String,  required: true },
  field3:     { type: String,  default: null },
  label1:     { type: String,  default: 'The promise' },
  label2:     { type: String,  default: 'Assessment' },
  label3:     { type: String,  default: 'Govt response' },
  isExpanded: { type: Boolean, default: false },
  // Resolved "See also" targets for this card: [{ id, title }]. Empty unless
  // the parent passes them (currently only the Promises tab). Dormant until
  // seed data sets a promise's `related` array.
  related:    { type: Array,   default: () => [] },
})

const emit = defineEmits(['toggle', 'share', 'goto'])

const BADGE_LABEL = {
  // promises
  kept:         'Kept',
  broken:       'Broken',
  partial:      'Partial',
  pending:      'In progress',
  fixed:        'Fixed',
  // fraud case status
  convicted:    'Convicted',
  ongoing:      'Ongoing',
  dismissed:    'Dismissed',
  acquitted:    'Acquitted',
  // fraud govt response
  pursuing:     'Pursuing',
  stalled:      'Stalled',
  political:    'Politicised',
  abandoned:    'Abandoned',
  complied:     'No interference',
  // orders
  implemented:  'Implemented',
  reversed:     'Reversed',
  ignored:      'Ignored',
  // ministers
  good:         'Good',
  fair:         'Fair',
  poor:         'Poor',
  sacked:       'Sacked',
  resigned:     'Resigned',
  // bills
  passed:       'Passed',
  // judgments
  won:          'Govt Won',
  lost:         'Govt Lost',
  settled:      'Settled',
  // appointments
  serving:      'Serving',
}

// Standardised editorial banners — Wikipedia-style status notices instead of
// ad-hoc prose. Keyed off item.flag; nothing renders when it's absent.
const FLAG_META = {
  disputed:   { cls: 'disputed',   label: 'Rating disputed', text: 'This rating is contested. See the sources and judge for yourself.' },
  correction: { cls: 'correction', label: 'Corrected',       text: 'This entry was recently corrected.' },
  review:     { cls: 'review',     label: 'Under review',     text: 'This entry is being re-checked against newer evidence.' },
}
const flag = computed(() => FLAG_META[props.item.flag] || null)

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
          {{ BADGE_LABEL[item.status] }}
        </span>
        <!-- Secondary response verdict badge (fraud tab) -->
        <span
          v-if="item.responseVerdict"
          :class="['pt-badge', 'pt-badge-response', `pt-badge-rv-${item.responseVerdict}`]"
        >{{ BADGE_LABEL[item.responseVerdict] }}</span>
        <button
          class="pt-share-btn"
          :title="`Copy link to #${item.id}`"
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
          <!-- See also: related promises in the same administration -->
          <div v-if="related.length" class="pt-detail-response pt-see-also">
            <div class="pt-detail-label">See also</div>
            <button
              v-for="r in related"
              :key="r.id"
              class="pt-see-also-link"
              @click.stop="emit('goto', r.id)"
            >{{ r.title }}</button>
          </div>
          <div class="pt-detail-footer">
            <span>Source:</span>
            <a class="pt-source-link" :href="item.source" target="_blank" @click.stop>
              {{ item.sourceLabel }}
            </a>
            <span>· Updated {{ item.updated }}</span>
            <span v-if="isStale" class="pt-stale-note" title="Not updated in over 18 months — may not reflect the latest evidence">· needs review</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
