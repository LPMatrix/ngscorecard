<script setup>
import { ref, computed, watch } from 'vue'
import AdminColumn from './AdminColumn.vue'

const props = defineProps({
  presidents: { type: Array, required: true },
  initialA:   { type: String, default: null },
  initialB:   { type: String, default: null },
  initialTab: { type: String, default: 'promises' },
})

const emit = defineEmits(['exit'])

const TABS = [
  { key: 'promises',     label: 'Promises' },
  { key: 'inherited',    label: 'Inherited Fixes' },
  { key: 'fraud',        label: 'Fraud' },
  { key: 'judgments',    label: 'Court Judgments' },
  { key: 'orders',       label: 'Orders & Policy' },
  { key: 'ministers',    label: 'Ministers/Commissioners' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'budget',       label: 'Budget' },
  { key: 'indicators',   label: 'Key Indicators' },
]

const STATUS_OPTIONS = {
  promises:     [{ key: 'all', label: 'All' }, { key: 'kept', label: 'Kept' }, { key: 'partial', label: 'Partial' }, { key: 'broken', label: 'Broken' }, { key: 'pending', label: 'In progress' }],
  inherited:    [{ key: 'all', label: 'All' }, { key: 'fixed', label: 'Fixed' }, { key: 'partial', label: 'Partial' }],
  fraud:        [{ key: 'all', label: 'All' }, { key: 'convicted', label: 'Convicted' }, { key: 'ongoing', label: 'Ongoing' }, { key: 'dismissed', label: 'Dismissed' }, { key: 'acquitted', label: 'Acquitted' }],
  orders:       [{ key: 'all', label: 'All' }, { key: 'implemented', label: 'Implemented' }, { key: 'partial', label: 'Partial' }, { key: 'reversed', label: 'Reversed' }, { key: 'ignored', label: 'Ignored' }],
  ministers:    [{ key: 'all', label: 'All' }, { key: 'good', label: 'Good' }, { key: 'fair', label: 'Fair' }, { key: 'poor', label: 'Poor' }, { key: 'sacked', label: 'Sacked' }, { key: 'resigned', label: 'Resigned' }],
  appointments: [{ key: 'all', label: 'All' }, { key: 'serving', label: 'Serving' }, { key: 'resigned', label: 'Resigned' }, { key: 'sacked', label: 'Sacked' }],
  judgments:    [{ key: 'all', label: 'All' }, { key: 'lost', label: 'Govt Lost' }, { key: 'won', label: 'Govt Won' }, { key: 'settled', label: 'Settled' }, { key: 'ongoing', label: 'Ongoing' }],
  budget:       [],
  indicators:   [],
}

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

const currentStatusOptions = computed(() => STATUS_OPTIONS[activeTab.value] ?? [])
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
      <button class="cmp-exit" @click="emit('exit')">← Back to single view</button>

      <div class="cmp-pickers">
        <select v-model="adminA" class="cmp-picker">
          <option v-for="p in presidents" :key="p.key" :value="p.key">{{ p.name }}{{ p.state ? ` (${p.state})` : '' }}</option>
        </select>
        <button class="cmp-swap" title="Swap" @click="swapAdmins">⇄</button>
        <select v-model="adminB" class="cmp-picker">
          <option v-for="p in adminBOptions" :key="p.key" :value="p.key">{{ p.name }}{{ p.state ? ` (${p.state})` : '' }}</option>
        </select>
      </div>
    </div>

    <nav class="cmp-tabs" aria-label="Compare section">
      <button
        v-for="t in TABS" :key="t.key"
        :class="['cmp-tab-btn', { active: activeTab === t.key }]"
        @click="activeTab = t.key"
      >{{ t.label }}</button>
    </nav>

    <div v-if="hasFilters" class="cmp-filters">
      <input v-model="searchQuery" type="text" class="pt-search" placeholder="Search both…" />
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
