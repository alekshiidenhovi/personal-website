<script setup lang="ts">
import { computed } from 'vue';

/**
 * Copy with its key facts emphasized, so a skimming reader still picks up the outcomes. Kept rare in the copy, at
 * most one per sentence, so the emphasis keeps its weight.
 */
interface Props {
  /** The copy, with each key fact between a pair of `**`. */
  text: string;
}
const props = defineProps<Props>();

/** The copy split at the markers; every other part is a key fact. */
const parts = computed(() =>
  props.text.split('**').map((text, index) => ({ text, isKeyFact: index % 2 === 1 })),
);
</script>

<!-- On one line, as any whitespace between the parts would show in the copy -->
<template>
  <template v-for="(part, index) in parts" :key="index"><strong v-if="part.isKeyFact">{{ part.text }}</strong><template
      v-else>{{ part.text }}</template></template>
</template>

<style scoped>
/*
 * Brighter, heavier and tinted with the card's color, so a fact catches the eye by hue as well as weight; pale
 * enough not to read as a saturated accent link
 */
strong {
  font-weight: 600;
  color: color-mix(in srgb, var(--card-color), var(--neutral-100) 50%);
}
</style>
