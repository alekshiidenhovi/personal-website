<script setup lang="ts">
import { useMatchMedia } from "../composables/useMatchMedia";
import { computed, onUnmounted, ref } from "vue";
import { STUDIES } from "../data/education";
import { EXPERTISE_COLOR } from "../data/expertise";
import { PHONE_QUERY } from "../lib/layout";
import Icon from "./Icon.vue";
import PinnedSection from "./PinnedSection.vue";

const isPhone = useMatchMedia(PHONE_QUERY);

/** "2024 – 26": the end year shortened, as the century repeats */
const formatYears = (start: number, end: number) => `${start} – ${String(end).slice(2)}`;

/*
 * Calgary to Helsinki, edge to edge. The drawing is sized to the route's real
 * pixels rather than stretched, so the travelling line's dash, a share of the
 * path length, runs exactly from one city to the other.
 */
const routeSize = ref({ width: 100, height: 40 });
const resizeObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (width !== routeSize.value.width || height !== routeSize.value.height) routeSize.value = { width, height };
});
let observedRoute: Element | null = null;
// Template refs are set on every render, so only start observing when the element changes
const observeRoute = (el: Element | null) => {
  if (el === observedRoute) return;
  resizeObserver.disconnect();
  observedRoute = el;
  if (el) resizeObserver.observe(el);
};
onUnmounted(() => resizeObserver.disconnect());

const routeArc = computed(() => {
  const { width, height } = routeSize.value;
  const end = height * 0.95;
  return `M 0 ${end} Q ${width / 2} ${-height * 0.85} ${width} ${end}`;
});
</script>

<template>
  <PinnedSection id="education" :page-count="isPhone ? STUDIES.length : 1" hide-subtitle-on-phones>
    <!-- Phones show one degree per page -->
    <template #default="{ page }">
      <ol class="studies">
        <li v-for="study in isPhone ? [STUDIES[page]] : STUDIES" :key="study.degree" class="card dot-grid"
          :style="{ '--card-color': EXPERTISE_COLOR[study.discipline], '--selection-color': EXPERTISE_COLOR[study.discipline] }">
          <span class="years">{{ formatYears(study.start, study.end) }}</span>

          <div class="degree">
            <h3>{{ study.degree }}</h3>
            <p class="meta">{{ study.school }}<span class="separator">·</span>{{ study.detail }}</p>
          </div>

          <div v-if="study.thesis || study.exchange" class="blocks">
            <a v-if="study.thesis" class="block thesis" :href="study.thesis.href" target="_blank" rel="noreferrer">
              <span class="block-label">Master's thesis</span>
              <span class="block-title">{{ study.thesis.title }}</span>
              <span class="block-detail">{{ study.thesis.summary }}</span>
              <span class="read">
                Read the thesis
                <Icon icon="heroicons:arrow-up-right-20-solid" class="read-arrow" />
              </span>
            </a>

            <div v-if="study.exchange" class="block exchange">
              <span class="block-label">Exchange · {{ study.exchange.year }}</span>
              <span class="block-title">{{ study.exchange.school }}</span>
              <span class="block-detail">{{ study.exchange.location }}</span>
              <div class="route" aria-hidden="true">
                <svg :ref="(el) => observeRoute(el as Element | null)"
                  :viewBox="`0 0 ${routeSize.width} ${routeSize.height}`">
                  <path :d="routeArc" class="route-line" />
                  <path :d="routeArc" class="route-pulse" pathLength="100" />
                </svg>
                <span class="route-city"></span>
                <span class="route-city route-end"></span>
                <span class="route-label">Calgary</span>
                <span class="route-label route-end">Helsinki</span>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </template>
  </PinnedSection>
</template>

<style scoped>
/*
 * One row per degree on a shared grid: the years in a rail on the left, the
 * degree and its highlights beside them. The MSc row carries the thesis and
 * exchange; the BSc stays a slim row rather than a card with nothing in it.
 */
.studies {
  container-type: inline-size;
  /* As large as the rail allows, and the same on every row */
  --years-size: min(4.4cqi, 9svh);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  height: 100%;
  list-style: none;
}

.card {
  position: relative;
  display: grid;
  grid-template-columns: calc(var(--years-size) * 4.9) minmax(0, 1fr);
  /* The years centered on the degree's title and subtitle; the highlights below */
  align-items: center;
  gap: clamp(1rem, 2.5vh, 1.5rem) clamp(1.5rem, 3vw, 3rem);
  padding: clamp(1.25rem, 2.5vw, 2rem);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-color) 18%, var(--neutral-800));
  background-color: var(--neutral-900);
}

/* A dim glow in the discipline's color, behind the years */
.card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 50% 90% at 0% 0%, color-mix(in srgb, var(--card-color), transparent 86%), transparent);
  pointer-events: none;
}

.card > * {
  position: relative;
}

/*
 * Outlined like the section numbers, in the card's color. The fill paints over
 * the stroke's inner half, hiding lines where a glyph's contours overlap.
 */
.years {
  font-size: var(--years-size);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 0.85;
  white-space: nowrap;
  color: var(--neutral-900);
  -webkit-text-stroke: 2px color-mix(in srgb, var(--card-color), transparent 40%);
  paint-order: stroke fill;
}

.degree {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

h3 {
  font-size: clamp(1.5rem, 2.4vw, 2.25rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--neutral-100);
}

.meta {
  font-size: 1rem;
  color: var(--text-muted);
}

.separator {
  margin: 0 0.5rem;
  color: var(--neutral-600);
}

/* Thesis and exchange as cells of one bordered panel */
.blocks {
  grid-column: 2;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1px;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-800);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem 1.25rem;
  background-color: var(--neutral-900);
  text-decoration: none;
}

.block-label {
  margin-bottom: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--card-color);
}

.block-title {
  font-size: clamp(1.0625rem, 1.4vw, 1.1875rem);
  font-weight: 500;
  line-height: 1.35;
  color: var(--neutral-100);
}

.block-detail {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.read {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: auto;
  padding-top: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--card-color);
}

.read-arrow {
  width: 1rem;
  height: 1rem;
  transition: translate 0.2s ease;
}

.thesis {
  transition: background-color 0.2s ease;
}

.thesis:hover {
  background-color: color-mix(in srgb, var(--card-color), var(--neutral-900) 94%);
}

.thesis:hover .read-arrow {
  translate: 2px -2px;
}

/* There and back: a single line travels the dotted route, reaching each city */
.route {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: space-between;
  row-gap: 0.5rem;
  position: relative;
  margin-top: auto;
  padding-top: 3.5rem;
}

/* The arc spans the full width; the dots and labels keep their size */
.route svg {
  position: absolute;
  /* Ends on the dots' centers */
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

.route-city {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--card-color);
  box-shadow: 0 0 0.375rem var(--card-color);
}

.route-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.route-end {
  justify-self: end;
}

/* Below lg the years move above the degree */
@media (width < 64rem) {
  .studies {
    --years-size: 14cqi;
  }

  .card {
    grid-template-columns: minmax(0, 1fr);
  }

  .blocks {
    grid-column: auto;
  }
}

/*
 * Phones: close to the whole section on one screen. The thesis summary
 * repeats what the experience section already says (the subtitle is hidden
 * too, see hide-subtitle-on-phones), and the route adds nothing beyond the
 * exchange school's name.
 */
@media (width < 40rem), (height < 30rem) {
  .thesis .block-detail,
  .exchange .block-detail,
  .route {
    display: none;
  }

  .card {
    gap: 0.75rem;
    padding: 1rem;
  }

  .blocks {
    grid-template-columns: 1fr;
  }

  .block {
    padding: 0.75rem 1rem;
  }

  .read {
    padding-top: 0.25rem;
  }
}
</style>
