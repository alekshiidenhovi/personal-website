<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

/**
 * A dotted arc between two cities, edge to edge, with a line travelling it there and back. The drawing is sized to
 * the arc's real pixels rather than stretched, so the travelling line's dash, a share of the path's length, runs
 * exactly from one city to the other.
 */
interface Props {
  from: string;
  to: string;
}
const props = defineProps<Props>();

const svgRef = useTemplateRef<SVGSVGElement>('svg');
const size = ref({ width: 100, height: 40 });
let resizeObserver: ResizeObserver | undefined;

const arcPath = computed(() => {
  const { width, height } = size.value;
  const endY = height * 0.95;
  return `M 0 ${endY} Q ${width / 2} ${-height * 0.85} ${width} ${endY}`;
});

/** Keeps the drawing's size equal to the arc's box. */
function trackSize() {
  if (!svgRef.value) {
    throw new Error('RouteArc needs its drawing mounted');
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width !== size.value.width || height !== size.value.height) {
      size.value = { width, height };
    }
  });
  resizeObserver.observe(svgRef.value);
}

onMounted(trackSize);
onUnmounted(() => resizeObserver?.disconnect());
</script>

<template>
  <div class="route" aria-hidden="true">
    <svg ref="svg" :viewBox="`0 0 ${size.width} ${size.height}`">
      <path :d="arcPath" class="route-line" />
      <path :d="arcPath" class="route-pulse" pathLength="100" />
    </svg>
    <span class="city"></span>
    <span class="city end"></span>
    <span class="label">{{ props.from }}</span>
    <span class="label end">{{ props.to }}</span>
  </div>
</template>

<style scoped>
.route {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  row-gap: 0.5rem;
  position: relative;
  margin-top: auto;
  padding-top: 3.5rem;
}

/* The arc spans the full width, ending on the cities' centers; the cities and labels keep their size */
svg {
  position: absolute;
  top: 1.125rem;
  left: 0.25rem;
  width: calc(100% - 0.5rem);
  height: 2.75rem;
  overflow: visible;
}

.route-line {
  fill: none;
  stroke: var(--neutral-600);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

/* The dash pattern's length is set to 100 by its pathLength */
.route-pulse {
  fill: none;
  stroke: var(--card-color);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-dasharray: 20 200;
  animation: travel 3s ease-in-out infinite alternate;
}

@keyframes travel {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -80;
  }
}

.city {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--card-color);
  box-shadow: 0 0 0.375rem var(--card-color);
}

.label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.end {
  justify-self: end;
}

/* Short pages: a flatter arc, which still ends on the cities' centers (its top plus 95% of its height) */
@container page (height < 30rem) {
  .route {
    padding-top: 2.25rem;
  }

  svg {
    top: 0.75rem;
    height: 1.85rem;
  }
}
</style>
