<script setup lang="ts">
import { useId } from "vue";

/** A CRT monitor running a small BASIC program; output types out when active. */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

const PROGRAM = ['10 PRINT "HELLO, WORLD"', "20 LET N = N + 1", "30 IF N < 3 THEN 10", "RUN"];
const OUTPUT = ["HELLO, WORLD", "HELLO, WORLD", "HELLO, WORLD", "READY."];
const LINE_HEIGHT = 14;
const FIRST_LINE_Y = 38;
const OUTPUT_DELAY_S = 0.35;

const scanlinesId = useId();
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <defs>
      <pattern :id="scanlinesId" width="4" height="3" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0.5" x2="4" y2="0.5" class="cover-line muted" opacity="0.5" />
      </pattern>
    </defs>

    <!-- Monitor -->
    <rect x="70" y="4" width="260" height="170" rx="14" class="cover-line" />
    <rect x="84" y="17" width="232" height="144" rx="8" class="cover-fill accent screen" />
    <rect x="84" y="17" width="232" height="144" rx="8" :fill="`url(#${scanlinesId})`" />
    <rect x="84" y="17" width="232" height="144" rx="8" class="cover-line accent" />
    <path d="M175 174 L165 194 M225 174 L235 194 M150 194 H250" class="cover-line" />
    <circle cx="316" cy="167" r="2" class="cover-fill accent glow" />

    <!-- Program and its output -->
    <text v-for="(line, index) in PROGRAM" :key="line" x="98" :y="FIRST_LINE_Y + index * LINE_HEIGHT"
      class="cover-text accent">{{ line }}</text>
    <text v-for="(line, index) in OUTPUT" :key="index" x="98"
      :y="FIRST_LINE_Y + (PROGRAM.length + index) * LINE_HEIGHT" class="cover-text accent cover-sequence glow"
      :style="{ '--delay': `${(index + 1) * OUTPUT_DELAY_S}s` }">{{ line }}</text>
    <rect x="98" :y="FIRST_LINE_Y + (PROGRAM.length + OUTPUT.length) * LINE_HEIGHT - 8" width="6" height="9"
      class="cover-fill accent cursor" :style="{ '--delay': `${(OUTPUT.length + 1) * OUTPUT_DELAY_S}s` }" />
  </svg>
</template>

<style scoped>
.screen {
  fill-opacity: 0.04;
}

.active .screen {
  fill-opacity: 0.1;
}

.cursor {
  opacity: 0;
}

.active .cursor {
  animation: blink 1s steps(2, start) var(--delay) infinite;
}

@keyframes blink {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}
</style>
