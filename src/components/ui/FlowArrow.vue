<script setup lang="ts">
/**
 * A horizontal arrow for SVG figures (see styles/drawing.css): the shaft flows while the figure is active, the
 * head stays solid.
 */
interface Props {
  /** Where the shaft starts. */
  x1: number;
  /** Where the tip is. */
  x2: number;
  y: number;
}
const props = defineProps<Props>();

const HEAD_SIZE = 4;
</script>

<template>
  <line :x1="props.x1" :y1="props.y" :x2="props.x2 - 1" :y2="props.y" class="drawing-line drawing-flow" />
  <path
    :d="`M${props.x2 - HEAD_SIZE} ${props.y - HEAD_SIZE} L${props.x2} ${props.y} L${props.x2 - HEAD_SIZE} ${props.y + HEAD_SIZE}`"
    class="drawing-line accent" />
</template>
