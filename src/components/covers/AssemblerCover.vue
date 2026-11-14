<script setup lang="ts">
import { useId } from "vue";
import { assemble } from "../../lib/hack";
import CoverArrow from "./CoverArrow.vue";

/** HACK assembly next to its real machine code; the program scrolls when active. */

interface Props {
  active: boolean;
}
const props = defineProps<Props>();

// Sums 1..100 into `sum`
const PROGRAM = [
  "@i", "M=1", "@sum", "M=0", "(LOOP)", "@i", "D=M", "@100", "D=D-A", "@END", "D;JGT",
  "@i", "D=M", "@sum", "M=D+M", "@i", "M=M+1", "@LOOP", "0;JMP", "(END)", "@END", "0;JMP",
];
const ROW_HEIGHT = 15;
const VIEWPORT = { y: 30, height: 150 };
const HIGHLIGHT_ROW = 4;

const { instructions } = assemble(PROGRAM);
const rows = instructions.map((instruction) => ({
  address: instruction.address,
  source: instruction.source,
  binary: instruction.segments.map((segment) => segment.bits).join(""),
}));
// Rendered twice so the scroll loops seamlessly
const loopedRows = [...rows, ...rows];
const scrollDistance = rows.length * ROW_HEIGHT;

// The arrow points along the highlighted row
const arrowY = VIEWPORT.y + HIGHLIGHT_ROW * ROW_HEIGHT + 3 + ROW_HEIGHT / 2;

const clipId = useId();
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <defs>
      <clipPath :id="clipId">
        <rect x="0" :y="VIEWPORT.y" width="400" :height="VIEWPORT.height" />
      </clipPath>
    </defs>

    <text x="40" y="20" class="cover-text label">sum.asm</text>
    <text x="230" y="20" class="cover-text label">sum.hack</text>
    <line x1="30" :y1="VIEWPORT.y - 2" x2="370" :y2="VIEWPORT.y - 2" class="cover-line muted" />
    <line x1="30" :y1="VIEWPORT.y + VIEWPORT.height + 2" x2="370" :y2="VIEWPORT.y + VIEWPORT.height + 2"
      class="cover-line muted" />

    <rect x="30" :y="VIEWPORT.y + HIGHLIGHT_ROW * ROW_HEIGHT + 3" width="340" :height="ROW_HEIGHT"
      class="cover-fill accent highlight" />

    <g :clip-path="`url(#${clipId})`">
      <g class="scroller" :style="{ '--scroll-distance': `-${scrollDistance}px` }">
        <g v-for="(row, index) in loopedRows" :key="index">
          <text x="40" :y="VIEWPORT.y + (index + 1) * ROW_HEIGHT" class="cover-text label">{{ row.address }}</text>
          <text x="62" :y="VIEWPORT.y + (index + 1) * ROW_HEIGHT" class="cover-text">{{ row.source }}</text>
          <text x="230" :y="VIEWPORT.y + (index + 1) * ROW_HEIGHT" class="cover-text accent">{{ row.binary }}</text>
        </g>
      </g>
    </g>

    <text x="128" y="20" class="cover-text label">assemble →</text>
    <CoverArrow :x1="125" :x2="205" :y="arrowY" />
  </svg>
</template>

<style scoped>
.highlight {
  fill-opacity: 0;
}

.active .highlight {
  fill-opacity: 0.12;
}

.active .scroller {
  animation: scroll 9s linear infinite;
}

@keyframes scroll {
  to {
    transform: translateY(var(--scroll-distance));
  }
}
</style>
