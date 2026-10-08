<script setup>
// Share a page. Plain share links only: no SDKs, embeds or tracking pixels, so
// nothing from these networks loads until someone actually clicks one.
// The native share sheet (phones, some desktops) is offered when the browser
// has it; it is added after mount so server and client markup match.
import { ref, computed, inject, onMounted } from 'vue'

const t = inject('t', (k) => k)

const props = defineProps({
  url: { type: String, required: true },   // absolute, canonical
  title: { type: String, required: true },
  text: { type: String, default: '' },     // one-line description
})

const canNativeShare = ref(false)
onMounted(() => { canNativeShare.value = typeof navigator !== 'undefined' && typeof navigator.share === 'function' })

const enc = encodeURIComponent
const links = computed(() => [
  { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${props.title} ${props.url}`)}` },
  { id: 'x', label: 'X', href: `https://x.com/intent/post?text=${enc(props.title)}&url=${enc(props.url)}` },
  { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(props.url)}` },
  { id: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(props.url)}` },
])
const mailHref = computed(() =>
  `mailto:?subject=${enc(props.title)}&body=${enc(`${props.text ? props.text + '\n\n' : ''}${props.url}`)}`)

const status = ref('')
let statusTimer = null
function announce(msg) {
  status.value = msg
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.value = '' }, 2500)
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
  } catch {
    // Older or locked-down browsers: fall back to selecting a throwaway field.
    const field = document.createElement('textarea')
    field.value = props.url
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    try { document.execCommand('copy') } finally { document.body.removeChild(field) }
  }
  announce(t('publications.linkCopied'))
}

async function nativeShare() {
  try {
    await navigator.share({ title: props.title, text: props.text || props.title, url: props.url })
  } catch { /* dismissed, or not permitted: nothing to do */ }
}
</script>

<template>
  <div class="share" role="group" :aria-label="t('publications.shareThis')">
    <button v-if="canNativeShare" type="button" class="share-btn primary" @click="nativeShare">{{ t('publications.shareNative') }}</button>
    <a
      v-for="l in links" :key="l.id"
      class="share-btn" :href="l.href" target="_blank" rel="noopener noreferrer"
      :aria-label="t('publications.shareOn', { network: l.label })"
    >{{ l.label }}</a>
    <a class="share-btn" :href="mailHref">{{ t('publications.shareEmail') }}</a>
    <button type="button" class="share-btn" :class="{ done: status }" @click="copy">{{ status ? t('publications.linkCopied') : t('publications.copyLink') }}</button>
    <span class="share-status" role="status" aria-live="polite">{{ status }}</span>
  </div>
</template>

<style scoped>
.share { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.share-btn {
  font: inherit; font-size: 13px; font-weight: 700; line-height: 1;
  padding: 8px 14px; border-radius: 999px; cursor: pointer; text-decoration: none;
  color: var(--ink, #1b2720); background: #fff; border: 1px solid var(--line-strong, #b9cbc1);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.share-btn:hover { border-color: var(--g700, #006b45); color: var(--g700, #006b45); }
.share-btn:focus-visible { outline: 2px solid var(--g700, #006b45); outline-offset: 2px; }
.share-btn.primary { background: var(--g700, #006b45); border-color: var(--g700, #006b45); color: #fff; }
.share-btn.primary:hover { background: var(--g800, #075236); color: #fff; }
.share-btn.done { border-color: var(--g700, #006b45); background: var(--g100, #dff5e8); color: var(--g800, #075236); }
.share-status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .share-btn { transition: none; } }
</style>
