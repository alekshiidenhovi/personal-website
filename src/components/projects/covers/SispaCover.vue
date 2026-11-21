<script setup lang="ts">
/** Sharded, isolated training with an aggregated prediction; while active, one shard is unlearned and only its model retrains. */
interface Props {
  /** Whether the cover plays. */
  active: boolean;
}
const props = defineProps<Props>();

const SHARD_COUNT = 4;
const FORGOTTEN_SHARD = 2;
const ROW_HEIGHT = 35;
const FIRST_ROW_Y = 34;
const BOX_HEIGHT = 26;
const AGGREGATOR = { x: 262, y: 100, radius: 22 };

const rows = Array.from({ length: SHARD_COUNT }, (_, index) => ({
  index,
  y: FIRST_ROW_Y + index * ROW_HEIGHT,
  centerY: FIRST_ROW_Y + index * ROW_HEIGHT + BOX_HEIGHT / 2,
  isForgotten: index === FORGOTTEN_SHARD,
}));
</script>

<template>
  <svg class="drawing" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <text x="20" y="22" class="drawing-text label">shards</text>
    <text x="118" y="22" class="drawing-text label">isolated models</text>
    <text x="240" y="22" class="drawing-text label">aggregate</text>

    <g v-for="row in rows" :key="row.index" :class="{ forgotten: row.isForgotten }">
      <rect x="20" :y="row.y" width="62" :height="BOX_HEIGHT" class="drawing-line shard" />
      <text x="28" :y="row.y + 16" class="drawing-text">D{{ row.index + 1 }}</text>
      <path :d="`M20 ${row.y} L82 ${row.y + BOX_HEIGHT} M82 ${row.y} L20 ${row.y + BOX_HEIGHT}`"
        class="drawing-line accent strike" />

      <line x1="82" :y1="row.centerY" x2="118" :y2="row.centerY" class="drawing-line muted drawing-flow" />

      <rect x="118" :y="row.y" width="72" :height="BOX_HEIGHT" class="drawing-line model" />
      <text x="126" :y="row.y + 16" class="drawing-text">θ{{ row.index + 1 }}</text>
      <text x="148" :y="row.y + 16" class="drawing-text label retrain">retrain</text>

      <line x1="190" :y1="row.centerY" :x2="AGGREGATOR.x - AGGREGATOR.radius" :y2="AGGREGATOR.y"
        class="drawing-line muted drawing-flow" />
    </g>

    <circle :cx="AGGREGATOR.x" :cy="AGGREGATOR.y" :r="AGGREGATOR.radius" class="drawing-line accent aggregator glow" />
    <text :x="AGGREGATOR.x" :y="AGGREGATOR.y + 4" text-anchor="middle" class="drawing-text accent">Σ</text>
    <line :x1="AGGREGATOR.x + AGGREGATOR.radius" :y1="AGGREGATOR.y" x2="322" :y2="AGGREGATOR.y"
      class="drawing-line drawing-flow" />
    <rect x="322" :y="AGGREGATOR.y - 14" width="62" height="28" class="drawing-line" />
    <text x="330" :y="AGGREGATOR.y + 3" class="drawing-text">predict</text>

    <text x="20" y="190" class="drawing-text accent drawing-sequence">forget(D{{ FORGOTTEN_SHARD + 1 }}) → retrain θ{{
      FORGOTTEN_SHARD + 1 }} only</text>
  </svg>
</template>

<style scoped>
.strike,
.retrain {
  opacity: 0;
}

.active .forgotten .strike,
.active .forgotten .retrain {
  opacity: 1;
}

.active .forgotten .retrain {
  fill: var(--drawing-accent);
  animation: pulse 0.9s ease-in-out infinite;
}

.active .forgotten .shard {
  stroke-dasharray: 3 3;
}

.active .forgotten .model {
  stroke: var(--drawing-accent);
}

.aggregator {
  fill: var(--card-color);
  fill-opacity: 0;
}

.active .aggregator {
  fill-opacity: 0.12;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}
</style>
