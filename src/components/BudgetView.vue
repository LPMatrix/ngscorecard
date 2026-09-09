<script setup>
import { ref, computed, inject } from 'vue'

const t = inject('t', (k) => k)

const props = defineProps({
  budgets: { type: Array, required: true },
})

const activeYear = ref(null)

const years = computed(() => props.budgets.map(b => b.year))

const current = computed(() => {
  const year = activeYear.value ?? years.value[0]
  return props.budgets.find(b => b.year === year) ?? props.budgets[0]
})

function fmt(bn) {
  if (bn == null) return '—'
  if (bn >= 1000) return '₦' + (bn / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 }) + 'tn'
  return '₦' + bn.toLocaleString(undefined, { maximumFractionDigits: 3 }) + 'bn'
}

function barWidth(pct) {
  if (pct == null) return '0%'
  return Math.min(pct, 100) + '%'
}

function barClass(pct) {
  if (pct == null) return 'bv-bar-unknown'
  if (pct >= 80) return 'bv-bar-high'
  if (pct >= 60) return 'bv-bar-mid'
  return 'bv-bar-low'
}

function releaseLabel(pct) {
  if (pct == null) return t('budget.dataPending')
  return t('budget.pctReleased', { pct })
}
</script>

<template>
  <div class="bv-wrap">

    <!-- Year selector -->
    <div class="bv-year-row">
      <button
        v-for="yr in years"
        :key="yr"
        :class="['bv-yr-btn', { active: (activeYear ?? years[0]) === yr }]"
        @click="activeYear = yr"
      >{{ t('budget.yearBtn', { year: yr }) }}</button>
    </div>

    <!-- Top-line stats -->
    <div class="bv-top-stats">
      <div class="bv-top-stat">
        <div class="bv-top-val">{{ fmt(current.totalBn) }}</div>
        <div class="bv-top-lbl">{{ t('budget.totalBudget') }}</div>
      </div>
      <div class="bv-top-stat">
        <div class="bv-top-val">{{ fmt(current.revenueBn) }}</div>
        <div class="bv-top-lbl">{{ t('budget.revenueProjected') }}</div>
      </div>
      <div class="bv-top-stat">
        <div class="bv-top-val">{{ current.actualRevenueBn ? fmt(current.actualRevenueBn) : '—' }}</div>
        <div class="bv-top-lbl">{{ t('budget.revenueActual') }}</div>
      </div>
      <div class="bv-top-stat">
        <div class="bv-top-val deficit">{{ fmt(current.deficitBn) }}</div>
        <div class="bv-top-lbl">{{ t('budget.deficit') }}</div>
      </div>
      <div class="bv-top-stat">
        <div class="bv-top-val debt">{{ fmt(current.debtServiceBn) }}</div>
        <div class="bv-top-lbl">{{ t('budget.debtService') }}</div>
      </div>
      <div class="bv-top-stat">
        <div class="bv-top-val">{{ current.implementationPct != null ? current.implementationPct + '%' : '—' }}</div>
        <div class="bv-top-lbl">{{ t('budget.implementationRate') }}</div>
      </div>
    </div>

    <!-- Note -->
    <p class="bv-note">{{ current.note }}</p>

    <!-- Ministry bars -->
    <div class="bv-legend-row">
      <span class="bv-legend-item"><span class="bv-swatch alloc"></span>{{ t('budget.allocation') }}</span>
      <span class="bv-legend-item"><span class="bv-swatch released"></span>{{ t('budget.released') }}</span>
    </div>

    <div class="bv-bars">
      <div v-for="m in current.ministries" :key="m.name" class="bv-row">
        <div class="bv-row-name">{{ m.name }}</div>
        <div class="bv-row-right">
          <div class="bv-track">
            <!-- allocation — full width reference -->
            <div class="bv-alloc-bar"></div>
            <!-- released -->
            <div
              :class="['bv-released-bar', barClass(m.releasedPct)]"
              :style="{ width: barWidth(m.releasedPct) }"
            ></div>
          </div>
          <div class="bv-row-meta">
            <span class="bv-alloc-amt">{{ fmt(m.allocationBn) }}</span>
            <span :class="['bv-pct', barClass(m.releasedPct)]">{{ releaseLabel(m.releasedPct) }}</span>
          </div>
          <div v-if="m.note" class="bv-row-note">{{ m.note }}</div>
        </div>
      </div>
    </div>

    <div class="bv-source">
      {{ t('budget.source') }} <a :href="current.source" target="_blank" class="pt-source-link">{{ current.sourceLabel }}</a>
    </div>
  </div>
</template>
