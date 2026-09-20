<script setup>
import { computed, inject } from 'vue'

const t = inject('t', (k) => k)
const lp = inject('lp', (p) => p)

const props = defineProps({
  // { state: 'candidate' | 'party' | 'pledge' | 'none' | 'pending', documents: [...], note }
  manifesto: { type: Object, required: true },
  adminName: { type: String, default: '' },
})
const emit = defineEmits(['goto-promises', 'report'])

const state = computed(() => props.manifesto?.state || 'pending')
const documents = computed(() => props.manifesto?.documents ?? [])

function fmtDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <section class="pt-mf">
    <div :class="['pt-mf-state', `pt-mf-state-${state}`]">
      <div class="pt-mf-state-label">{{ t(`manifesto.state.${state}`) }}</div>
      <p class="pt-mf-state-desc">{{ t(`manifesto.desc.${state}`) }}</p>
    </div>

    <template v-if="documents.length">
      <h2 class="pt-mf-heading">{{ t('manifesto.docs.title') }}</h2>
      <ul class="pt-mf-docs">
        <li v-for="d in documents" :key="d.publicUrl" class="pt-mf-doc">
          <div class="pt-mf-doc-title">{{ d.title }}</div>
          <div class="pt-mf-doc-meta">
            <span>{{ t('manifesto.issuedBy', { issuer: t(`manifesto.issuer.${d.issuer}`) }) }}</span>
            <span v-if="d.year">{{ d.year }}</span>
            <span v-if="d.retrievedOn">{{ t('manifesto.retrieved', { date: fmtDate(d.retrievedOn) }) }}</span>
          </div>
          <div class="pt-mf-doc-links">
            <a :href="d.publicUrl" target="_blank" rel="noopener">{{ t('manifesto.openSource') }} ↗</a>
            <a v-if="d.archiveUrl" :href="d.archiveUrl" target="_blank" rel="noopener">{{ t('manifesto.archived') }} ↗</a>
          </div>
        </li>
      </ul>
    </template>

    <template v-if="state === 'none' && manifesto.note">
      <h2 class="pt-mf-heading">{{ t('manifesto.searched.title') }}</h2>
      <p class="pt-mf-note">{{ manifesto.note }}</p>
    </template>

    <p class="pt-mf-foot">
      {{ t('manifesto.about') }}
      <a :href="lp('/guide')">{{ t('manifesto.methodology') }}</a>
    </p>

    <div class="pt-mf-actions">
      <button type="button" class="pt-viewlink-btn" @click="emit('goto-promises')">{{ t('manifesto.viewPromises') }}</button>
      <button
        type="button"
        class="pt-viewlink-btn"
        @click="emit('report', { entryTable: null, entryId: null, title: t('tab.manifesto'), administration: adminName || null })"
      >{{ t('manifesto.report') }}</button>
    </div>
  </section>
</template>
