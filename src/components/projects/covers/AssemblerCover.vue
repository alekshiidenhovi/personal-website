<script setup lang="ts">
import { useId } from 'vue';
import { assemble } from '../../../lib/hack';
import FlowArrow from '../../ui/FlowArrow.vue';

/** HACK assembly beside its real machine code; the program scrolls while active. */
interface Props {
  /** Whether the cover plays. */
  active: boolean;
}
const props = defineProps<Props>();

/** Sums 1 to 100 into `sum`. */
// biome-ignore format: a few instructions per line read better than one per line
const PROGRAM = [
  '@i', 'M=1', '@sum', 'M=0', '(LOOP)', '@i', 'D=M', '@100', 'D=D-A', '@END', 'D;JGT',
  '@i', 'D=M', '@sum', 'M=D+M', '@i', 'M=M+1', '@LOOP', '0;JMP', '(END)', '@END', '0;JMP',
];
const ROW_HEIGHT = 15;
const VIEWPORT = { y: 30, height: 150 };
const HIGHLIGHT_ROW = 4;
const HIGHLIGHT_Y = VIEWPORT.y + HIGHLIGHT_ROW * ROW_HEIGHT + 3;

const instructions = assemble(PROGRAM);
// Rendered twice, so the scroll loops seamlessly
const loopedInstructions = [...instructions, ...instructions];
const scrollDistance = instructions.length * ROW_HEIGHT;

/**
 * Gets the baseline of a row in the scrolling program.
 *
 * @param index The row's index.
 * @returns The row's y coordinate.
 */
function getRowY(index: number): number {
  return VIEWPORT.y + (index + 1) * ROW_HEIGHT;
}

// Unique per instance, as ids are global to the page
const clipId = useId();
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <defs>
      <clipPath :id="clipId">
        <rect x="0" :y="VIEWPORT.y" width="400" :height="VIEWPORT.height" />
      </clipPath>
    </defs>

    <text x="40" y="20" class="drawing-text label">sum.asm</text>
    <text x="230" y="20" class="drawing-text label">sum.hack</text>
    <line x1="30" :y1="VIEWPORT.y - 2" x2="370" :y2="VIEWPORT.y - 2" class="drawing-line muted" />
    <line x1="30" :y1="VIEWPORT.y + VIEWPORT.height + 2" x2="370" :y2="VIEWPORT.y + VIEWPORT.height + 2"
      class="drawing-line muted" />

    <rect x="30" :y="HIGHLIGHT_Y" width="340" :height="ROW_HEIGHT" class="drawing-fill accent highlight" />

    <g :clip-path="`url(#${clipId})`">
      <g class="scroller" :style="{ '--scroll-distance': `-${scrollDistance}px` }">
        <g v-for="(instruction, index) in loopedInstructions" :key="index">
          <text x="40" :y="getRowY(index)" class="drawing-text label">{{ instruction.address }}</text>
          <text x="62" :y="getRowY(index)" class="drawing-text">{{ instruction.source }}</text>
          <text x="230" :y="getRowY(index)" class="drawing-text accent">{{ instruction.binary }}</text>
        </g>
      </g>
    </g>

    <text x="128" y="20" class="drawing-text label">assemble →</text>
    <!-- Along the highlighted row -->
    <FlowArrow :x1="125" :x2="205" :y="HIGHLIGHT_Y + ROW_HEIGHT / 2" />
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
