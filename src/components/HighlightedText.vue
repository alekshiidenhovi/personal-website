<script setup lang="ts">
import { computed } from "vue";

/**
 * Renders copy with its key facts emphasized: text between ** pairs becomes
 * <strong>, so a skimming reader still picks up the outcomes. Kept rare in the
 * copy, at most one per sentence, so the emphasis keeps its weight.
 */

interface Props {
  text: string;
}
const props = defineProps<Props>();

const parts = computed(() => props.text.split("**").map((part, index) => ({ part, isKey: index % 2 === 1 })));
</script>

<template>
  <template v-for="({ part, isKey }, index) in parts" :key="index"><strong v-if="isKey">{{ part }}</strong><template
      v-else>{{ part }}</template></template>
</template>

<style scoped>
/*
 * Brighter, heavier and tinted with the card's color, so a fact catches the eye
 * by hue as well as weight; pale enough not to read as a saturated accent link
 */
strong {
  font-weight: 600;
  color: color-mix(in srgb, var(--card-color), var(--neutral-100) 50%);
}
</style>
