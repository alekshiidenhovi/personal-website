<script setup lang="ts">
/**
 * Sharded, isolated training with an aggregated prediction. When active, one
 * shard is unlearned and only its model retrains.
 */

interface Props {
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
  isForgotten: index === FORGOTTEN_SHARD,
}));
</script>

<template>
  <svg class="cover" :class="{ active: props.active }" viewBox="0 0 400 200" aria-hidden="true">
    <text x="20" y="22" class="cover-text label">shards</text>
    <text x="118" y="22" class="cover-text label">isolated models</text>
    <text x="240" y="22" class="cover-text label">aggregate</text>

    <g v-for="row in rows" :key="row.index" :class="{ forgotten: row.isForgotten }">
      <!-- Shard -->
      <rect x="20" :y="row.y" width="62" :height="BOX_HEIGHT" class="cover-line shard" />
      <text x="28" :y="row.y + 16" class="cover-text">D{{ row.index + 1 }}</text>
      <path :d="`M20 ${row.y} L82 ${row.y + BOX_HEIGHT} M82 ${row.y} L20 ${row.y + BOX_HEIGHT}`"
        class="cover-line accent strike" />

      <line x1="82" :y1="row.y + BOX_HEIGHT / 2" x2="118" :y2="row.y + BOX_HEIGHT / 2"
        class="cover-line muted cover-flow" />

      <!-- Model -->
      <rect x="118" :y="row.y" width="72" :height="BOX_HEIGHT" class="cover-line model" />
      <text x="126" :y="row.y + 16" class="cover-text">θ{{ row.index + 1 }}</text>
      <text x="148" :y="row.y + 16" class="cover-text label retrain">retrain</text>

      <line x1="190" :y1="row.y + BOX_HEIGHT / 2" :x2="AGGREGATOR.x - AGGREGATOR.radius" :y2="AGGREGATOR.y"
        class="cover-line muted cover-flow" />
    </g>

    <circle :cx="AGGREGATOR.x" :cy="AGGREGATOR.y" :r="AGGREGATOR.radius" class="cover-line accent aggregator glow" />
    <text :x="AGGREGATOR.x" :y="AGGREGATOR.y + 4" text-anchor="middle" class="cover-text accent">Σ</text>
    <line :x1="AGGREGATOR.x + AGGREGATOR.radius" :y1="AGGREGATOR.y" x2="322" :y2="AGGREGATOR.y"
      class="cover-line cover-flow" />
    <rect x="322" :y="AGGREGATOR.y - 14" width="62" height="28" class="cover-line" />
    <text x="330" :y="AGGREGATOR.y + 3" class="cover-text">predict</text>

    <text x="20" y="190" class="cover-text accent cover-sequence">
      forget(D{{ FORGOTTEN_SHARD + 1 }}) → retrain θ{{ FORGOTTEN_SHARD + 1 }} only
    </text>
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
  fill: var(--cover-accent);
  animation: pulse 0.9s ease-in-out infinite;
}

.active .forgotten .shard {
  stroke-dasharray: 3 3;
}

.active .forgotten .model {
  stroke: var(--cover-accent);
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
