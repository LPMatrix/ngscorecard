<script setup>
// Renders the blocks from src/lib/formatAnswer.js. Everything goes through Vue
// interpolation (no v-html), so answer text is always escaped.
defineProps({
  blocks: { type: Array, required: true },
  // builds the id of a source row so a citation can link to it
  sourceHref: { type: Function, required: true },
})
const emit = defineEmits(['cite'])
</script>

<template>
  <div class="ab">
    <template v-for="(block, i) in blocks" :key="i">
      <p v-if="block.type === 'p'">
        <template v-for="(part, k) in block.parts" :key="k">
          <a v-if="part.type === 'cite'" class="ab-cite" :href="sourceHref(part.id)" :aria-label="`Source ${part.id}`" @click.prevent="emit('cite', part.id)">[{{ part.id }}]</a>
          <strong v-else-if="part.type === 'strong'">{{ part.text }}</strong>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>

      <component :is="block.type" v-else :start="block.type === 'ol' && block.start > 1 ? block.start : undefined">
        <li v-for="(item, j) in block.items" :key="j">
          <template v-for="(part, k) in item" :key="k">
            <a v-if="part.type === 'cite'" class="ab-cite" :href="sourceHref(part.id)" :aria-label="`Source ${part.id}`" @click.prevent="emit('cite', part.id)">[{{ part.id }}]</a>
            <strong v-else-if="part.type === 'strong'">{{ part.text }}</strong>
            <template v-else>{{ part.text }}</template>
          </template>
        </li>
      </component>
    </template>
  </div>
</template>

<style scoped>
.ab p { margin: 0 0 0.7rem; }
.ab ol, .ab ul { margin: 0.2rem 0 0.7rem; padding-left: 1.4rem; }
.ab li { margin: 0.3rem 0; padding-left: 0.2rem; }
.ab > :last-child { margin-bottom: 0; }
.ab-cite {
  font-size: 0.8em;
  font-weight: 700;
  color: var(--accent, #0a6b45);
  text-decoration: none;
  padding: 0 0.1em;
  border-radius: 3px;
}
.ab-cite:hover { text-decoration: underline; }
.ab-cite:focus-visible { outline: 2px solid var(--accent, #0a6b45); outline-offset: 1px; }
</style>
