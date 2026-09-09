<script setup>
import { ref, computed, watch, inject } from 'vue'
import AdminColumn from './AdminColumn.vue'

const t = inject('t', (k) => k)

const props = defineProps({
  presidents: { type: Array, required: true },
  initialA:   { type: String, default: null },
  initialB:   { type: String, default: null },
  initialTab: { type: String, default: 'promises' },
})

const emit = defineEmits(['exit'])

const TABS = computed(() => [
  { key: 'promises',     label: t('tab.promises') },
  { key: 'inherited',    label: t('tab.inherited') },
  { key: 'fraud',        label: t('tab.fraud') },
  { key: 'judgments',    label: t('tab.judgments') },
  { key: 'orders',       label: t('tab.orders') },
  { key: 'ministers',    label: t('tab.ministersCommissioners') },
  { key: 'appointments', label: t('tab.appointments') },
  { key: 'budget',       label: t('tab.budget') },
  { key: 'indicators',   label: t('tab.indicators') },
])

const opt = (key, k) => ({ key, label: t(k) })
const STATUS_OPTIONS = computed(() => ({
  promises:     [opt('all', 'status.all'), opt('kept', 'status.kept'), opt('partial', 'status.partial'), opt('broken', 'status.broken'), opt('pending', 'status.pending')],
  inherited:    [opt('all', 'status.all'), opt('fixed', 'status.fixed'), opt('partial', 'status.partial')],
  fraud:        [opt('all', 'status.all'), opt('convicted', 'status.convicted'), opt('ongoing', 'status.ongoing'), opt('dismissed', 'status.dismissed'), opt('acquitted', 'status.acquitted')],
  orders:       [opt('all', 'status.all'), opt('implemented', 'status.implemented'), opt('partial', 'status.partial'), opt('reversed', 'status.reversed'), opt('ignored', 'status.ignored')],
  ministers:    [opt('all', 'status.all'), opt('good', 'status.good'), opt('fair', 'status.fair'), opt('poor', 'status.poor'), opt('sacked', 'status.sacked'), opt('resigned', 'status.resigned')],
  appointments: [opt('all', 'status.all'), opt('serving', 'status.serving'), opt('resigned', 'status.resigned'), opt('sacked', 'status.sacked')],
  judgments:    [opt('all', 'status.all'), opt('lost', 'status.lost'), opt('won', 'status.won'), opt('settled', 'status.settled'), opt('ongoing', 'status.ongoing')],
  budget:       [],
  indicators:   [],
}))

// Governors only compare against governors, presidents only against presidents
// — pairing across levels doesn't mean much (2 years in Anambra vs. 8 years
// nationally). Enforced by filtering B's options to A's level, not a toggle,
// so picking stays a single step.
function levelOf(key) {
  return props.presidents.find(p => p.key === key)?.level ?? 'federal'
}
function sameLevel(pool, level) {
  return pool.filter(p => (p.level ?? 'federal') === level)
}

const initialALevel = levelOf(props.initialA ?? props.presidents[0]?.key)
const adminA = ref(props.initialA ?? props.presidents[0]?.key)
const adminB = ref(
  sameLevel(props.presidents, initialALevel).some(p => p.key === props.initialB)
    ? props.initialB
    : sameLevel(props.presidents, initialALevel).find(p => p.key !== adminA.value)?.key
)
const activeTab = ref(props.initialTab)
const statusFilter = ref('all')
const searchQuery = ref('')

const adminAObj = computed(() => props.presidents.find(p => p.key === adminA.value) ?? {})
const adminBObj = computed(() => props.presidents.find(p => p.key === adminB.value) ?? {})

const adminBOptions = computed(() => sameLevel(props.presidents, adminAObj.value.level ?? 'federal'))

// If A moves to a different level, B needs a new same-level default.
watch(adminA, () => {
  if (!adminBOptions.value.some(p => p.key === adminB.value)) {
    adminB.value = adminBOptions.value.find(p => p.key !== adminA.value)?.key ?? adminBOptions.value[0]?.key
  }
})

const currentStatusOptions = computed(() => STATUS_OPTIONS.value[activeTab.value] ?? [])
const hasFilters = computed(() => !['budget', 'indicators'].includes(activeTab.value))

function syncUrl() {
  const url = new URL(window.location)
  url.searchParams.delete('admin')
  url.searchParams.set('mode', 'compare')
  url.searchParams.set('a', adminA.value)
  url.searchParams.set('b', adminB.value)
  url.searchParams.set('tab', activeTab.value)
  window.history.replaceState(null, '', url)
}

watch([adminA, adminB], syncUrl)
watch(activeTab, () => { statusFilter.value = 'all'; searchQuery.value = ''; syncUrl() })

function swapAdmins() {
  const tmp = adminA.value
  adminA.value = adminB.value
  adminB.value = tmp
}
</script>

<template>
  <div class="cmp-wrap">
    <div class="cmp-toolbar">
      <button class="cmp-exit" @click="emit('exit')">{{ t('compare.backToSingle') }}</button>

      <div class="cmp-pickers">
        <select v-model="adminA" class="cmp-picker">
          <option v-for="p in presidents" :key="p.key" :value="p.key">{{ p.name }}{{ p.state ? ` (${p.state})` : '' }}</option>
        </select>
        <button class="cmp-swap" :title="t('compare.swap')" @click="swapAdmins">⇄</button>
        <select v-model="adminB" class="cmp-picker">
          <option v-for="p in adminBOptions" :key="p.key" :value="p.key">{{ p.name }}{{ p.state ? ` (${p.state})` : '' }}</option>
        </select>
      </div>
    </div>

    <nav class="cmp-tabs" :aria-label="t('compare.section')">
      <button
        v-for="tb in TABS" :key="tb.key"
        :class="['cmp-tab-btn', { active: activeTab === tb.key }]"
        @click="activeTab = tb.key"
      >{{ tb.label }}</button>
    </nav>

    <div v-if="hasFilters" class="cmp-filters">
      <input v-model="searchQuery" type="text" class="pt-search" :placeholder="t('search.both')" />
      <div class="pt-filter-group">
        <button
          v-for="s in currentStatusOptions" :key="s.key"
          :class="['pt-filter-btn', { active: statusFilter === s.key }]"
          @click="statusFilter = s.key"
        >{{ s.label }}</button>
      </div>
    </div>

    <div class="cmp-grid">
      <AdminColumn
        :admin="adminAObj" :tab="activeTab"
        :statusFilter="statusFilter" categoryFilter="all" :searchQuery="searchQuery"
      />
      <AdminColumn
        :admin="adminBObj" :tab="activeTab"
        :statusFilter="statusFilter" categoryFilter="all" :searchQuery="searchQuery"
      />
    </div>
  </div>
</template>
