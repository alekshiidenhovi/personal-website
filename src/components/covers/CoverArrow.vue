<script setup lang="ts">
/** A horizontal arrow: the shaft flows when the cover is active, the head stays solid. */

interface Props {
  x1: number;
  x2: number;
  y: number;
}
const props = defineProps<Props>();

const HEAD_SIZE = 4;
</script>

<template>
  <g>
    <line :x1="props.x1" :y1="props.y" :x2="props.x2 - 1" :y2="props.y" class="cover-line cover-flow" />
    <path :d="`M${props.x2 - HEAD_SIZE} ${props.y - HEAD_SIZE} L${props.x2} ${props.y} L${props.x2 - HEAD_SIZE} ${props.y + HEAD_SIZE}`"
      class="cover-line accent" />
  </g>
</template>
