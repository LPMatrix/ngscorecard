<script setup>
// In-header language switcher. A plain <select> — no dropdown library — that
// does a full-page navigation to the same route under the chosen locale, so
// the server re-renders with the right <html lang>, meta and catalogue
// (there is no client-side locale swap; catalogues are provided per request).
//
// Only shown when more than one locale is switchable (see SWITCHABLE_LOCALES:
// `ready` locales plus unreviewed `preview` drafts). SEO exposure is a
// separate gate (READY_LOCALES) and unaffected by this control.
import { inject } from 'vue'
import { SWITCHABLE_LOCALES, DEFAULT_LOCALE } from '../i18n/index.js'
import { swapLocale } from '../routes.js'

const t = inject('t', (k) => k)
const locale = inject('locale', DEFAULT_LOCALE)

const locales = SWITCHABLE_LOCALES

function onChange(e) {
  const code = e.target.value
  if (code === locale) return
  const { pathname, search, hash } = window.location
  window.location.href = swapLocale(pathname, code) + search + hash
}
</script>

<template>
  <label v-if="locales.length > 1" class="pt-lang">
    <span class="pt-lang-label">{{ t('lang.switcher.label') }}</span>
    <select
      class="pt-lang-select"
      :aria-label="t('lang.switcher.label')"
      @change="onChange"
    >
      <option
        v-for="l in locales"
        :key="l.code"
        :value="l.code"
        :selected="l.code === locale"
      >{{ l.name }}</option>
    </select>
  </label>
</template>

<style scoped>
.pt-lang {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pt-lang-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pt-text-faint, #7f8c84);
}
.pt-lang-select {
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 24px 4px 8px;
  border: 1px solid var(--pt-line-strong, #b9cbc1);
  border-radius: 6px;
  background-color: var(--pt-surface, #fffef9);
  color: var(--pt-text, #1b2720);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%235f6f66' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}
.pt-lang-select:hover { border-color: var(--pt-green-700, #1f7a4d); }
.pt-lang-select:focus-visible {
  outline: 2px solid var(--pt-focus, #f6c343);
  outline-offset: 1px;
}
</style>
