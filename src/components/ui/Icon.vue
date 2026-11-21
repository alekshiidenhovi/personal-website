<script setup lang="ts">
import { ICONS, type IconName } from "./icons";

/** An inline SVG icon, sized to the text (1em) and colored with it */
const props = defineProps<{ icon: IconName }>();
</script>

<template>
  <!-- The bodies are fixed markup from icons.ts, never user content -->
  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="1em" height="1em"
    :viewBox="ICONS[props.icon].viewBox" v-html="ICONS[props.icon].body"></svg>
</template>
