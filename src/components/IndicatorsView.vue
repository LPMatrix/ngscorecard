<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  indicators: { type: Array, required: true },
})

const activeId = ref(null)

const active = computed(() =>
  props.indicators.find(i => i.id === (activeId.value ?? props.indicators[0]?.id))
  ?? props.indicators[0]
)

// ── chart geometry ─────────────────────────────────────
const W = 680
const H = 200
const PAD = { top: 16, right: 16, bottom: 32, left: 52 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

const minVal = computed(() => Math.min(...active.value.points.map(p => p.value)))
const maxVal = computed(() => Math.max(...active.value.points.map(p => p.value)))
const range  = computed(() => maxVal.value - minVal.value || 1)

function xPos(i) {
  const n = active.value.points.length
  if (n === 1) return PAD.left + PLOT_W / 2
  return PAD.left + (i / (n - 1)) * PLOT_W
}

function yPos(v) {
  return PAD.top + PLOT_H - ((v - minVal.value) / range.value) * PLOT_H
}

const polyline = computed(() =>
  active.value.points.map((p, i) => `${xPos(i)},${yPos(p.value)}`).join(' ')
)

// Y axis ticks — 4 ticks
const yTicks = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, i) => {
    const v = minVal.value + (range.value * i) / steps
    return { v, y: yPos(v) }
  })
})

// label every other point if crowded
const labelledPoints = computed(() => {
  const pts = active.value.points
  const step = pts.length > 8 ? 2 : 1
  return pts.map((p, i) => ({ ...p, i, show: i % step === 0 || i === pts.length - 1 }))
})

const hovered = ref(null)

function fmt(v, unit) {
  if (unit === '₦/$') return '₦' + v.toLocaleString()
  if (unit === '₦/litre') return '₦' + v
  if (unit === '₦bn') {
    if (v >= 1000) return '₦' + (v / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 }) + 'tn'
    return '₦' + v.toLocaleString(undefined, { maximumFractionDigits: 3 }) + 'bn'
  }
  return v + unit
}

const first = computed(() => active.value.points[0])
const last  = computed(() => active.value.points[active.value.points.length - 1])
const change = computed(() => {
  const diff = last.value.value - first.value.value
  const pct  = ((diff / first.value.value) * 100).toFixed(1)
  const up   = diff > 0
  // Direction alone doesn't tell you if a change is good news — rising GDP
  // or IGR is good, rising inflation or debt is bad. higherIsBetter decides.
  const good = active.value.higherIsBetter ? up : !up
  return { diff, pct, up, good }
})
</script>

<template>
  <div class="iv-wrap">

    <!-- Indicator selector -->
    <div class="iv-selector">
      <button
        v-for="ind in indicators" :key="ind.id"
        :class="['iv-sel-btn', { active: (activeId ?? indicators[0]?.id) === ind.id }]"
        @click="activeId = ind.id; hovered = null"
      >{{ ind.label }}</button>
    </div>

    <!-- Key stats -->
    <div class="iv-stats">
      <div class="iv-stat">
        <div class="iv-stat-lbl">{{ active.points.length > 1 ? 'Earliest' : 'Recorded' }} ({{ first.label }})</div>
        <div class="iv-stat-val">{{ fmt(first.value, active.unit) }}</div>
      </div>
      <template v-if="active.points.length > 1">
        <div class="iv-stat">
          <div class="iv-stat-lbl">Latest ({{ last.label }})</div>
          <div class="iv-stat-val">{{ fmt(last.value, active.unit) }}</div>
        </div>
        <div class="iv-stat">
          <div class="iv-stat-lbl">Change since {{ first.label }}</div>
          <div :class="['iv-stat-val', 'iv-change', change.good ? 'good' : 'bad']">
            {{ change.up ? '+' : '' }}{{ change.pct }}%
          </div>
        </div>
      </template>
      <div v-if="hovered" class="iv-stat iv-hover-stat">
        <div class="iv-stat-lbl">{{ hovered.label }}</div>
        <div class="iv-stat-val">{{ fmt(hovered.value, active.unit) }}</div>
      </div>
    </div>

    <!-- SVG chart -->
    <div class="iv-chart-scroll">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        :style="{ width: '100%', maxWidth: W + 'px', height: 'auto', display: 'block' }"
      >
        <!-- grid lines -->
        <line
          v-for="t in yTicks" :key="t.v"
          :x1="PAD.left" :y1="t.y" :x2="W - PAD.right" :y2="t.y"
          stroke="#e0dbd4" stroke-width="1"
        />

        <!-- y axis labels -->
        <text
          v-for="t in yTicks" :key="'lbl' + t.v"
          :x="PAD.left - 6" :y="t.y + 4"
          text-anchor="end"
          font-family="'Instrument Sans', sans-serif"
          font-size="10"
          fill="#a09888"
        >{{ t.v % 1 === 0 ? t.v : t.v.toFixed(1) }}</text>

        <!-- area fill -->
        <polygon
          :points="[
            `${PAD.left},${PAD.top + PLOT_H}`,
            ...active.points.map((p, i) => `${xPos(i)},${yPos(p.value)}`),
            `${xPos(active.points.length - 1)},${PAD.top + PLOT_H}`
          ].join(' ')"
          :fill="active.color"
          fill-opacity="0.08"
        />

        <!-- line -->
        <polyline
          :points="polyline"
          fill="none"
          :stroke="active.color"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- dots + x labels -->
        <g v-for="(p, i) in labelledPoints" :key="i">
          <circle
            :cx="xPos(i)" :cy="yPos(p.value)"
            r="4"
            :fill="active.color"
            fill-opacity="0.15"
            stroke="none"
          />
          <circle
            :cx="xPos(i)" :cy="yPos(p.value)"
            r="9"
            fill="transparent"
            stroke="none"
            style="cursor:pointer"
            @mouseenter="hovered = p"
            @mouseleave="hovered = null"
          />
          <circle
            v-if="hovered === p"
            :cx="xPos(i)" :cy="yPos(p.value)"
            r="5"
            :fill="active.color"
            stroke="white"
            stroke-width="2"
          />
          <text
            v-if="p.show"
            :x="xPos(i)" :y="H - 4"
            text-anchor="middle"
            font-family="'Instrument Sans', sans-serif"
            font-size="10"
            fill="#a09888"
          >{{ p.label }}</text>
        </g>
      </svg>
    </div>

    <!-- Note + source -->
    <p v-if="active.note" class="iv-note">{{ active.note }}</p>
    <p class="iv-desc">{{ active.description }}</p>
    <div class="iv-source">
      Source: <a :href="active.source" target="_blank" class="pt-source-link">{{ active.sourceLabel }}</a>
    </div>
  </div>
</template>
