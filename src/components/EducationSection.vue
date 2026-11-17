<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { STUDIES } from "../data/education";
import { EXPERTISE_COLOR } from "../data/expertise";
import Icon from "./Icon.vue";
import PinnedSection from "./PinnedSection.vue";

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
  <PinnedSection id="education">
    <ol class="studies">
      <li v-for="study in STUDIES" :key="study.degree" class="card tinted-card dot-grid"
        :style="{ '--card-color': EXPERTISE_COLOR[study.discipline], '--selection-color': EXPERTISE_COLOR[study.discipline] }">
        <span class="years">{{ formatYears(study.start, study.end) }}</span>

        <div class="degree">
          <h3>{{ study.degree }}</h3>
          <p class="meta">{{ study.school }}<span class="minor"><span class="separator">·</span>{{ study.detail }}</span></p>
        </div>

        <div v-if="study.thesis || study.exchange" class="blocks">
          <a v-if="study.thesis" class="block thesis" :href="study.thesis.href" target="_blank" rel="noreferrer">
            <!-- The arrow stands in for "Read the thesis" where that line is left out -->
            <span class="block-label">
              Master's thesis
              <Icon icon="heroicons:arrow-up-right-20-solid" class="label-arrow" />
            </span>
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  height: 100%;
  list-style: none;
}

.card {
  /* As large as the rail allows, and the same on every row; a share of the list's width (its container) */
  --years-size: min(5.5cqi, 9svh);
  display: grid;
  grid-template-columns: calc(var(--years-size) * 4.9) minmax(0, 1fr);
  /* The years centered on the degree's title and subtitle; the highlights below */
  align-items: center;
  gap: clamp(1rem, 2.5vh, 1.5rem) clamp(1.5rem, 3vw, 3rem);
  padding: clamp(1.25rem, 2.5vw, 2rem);
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

/*
 * The thesis and exchange as columns below a hairline, without a box of their
 * own: a box inside the card would crowd it, most of all on phones
 */
.blocks {
  grid-column: 2;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  padding-top: clamp(1rem, 2.5vh, 1.5rem);
  border-top: 1px solid var(--neutral-800);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  text-decoration: none;
}

.thesis {
  padding-right: clamp(1.25rem, 2.5vw, 2rem);
}

.exchange {
  padding-left: clamp(1.25rem, 2.5vw, 2rem);
  border-left: 1px solid var(--neutral-800);
}

.block-label {
  margin-bottom: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--card-color);
}

/* Only where the "Read the thesis" line is left out (see the narrow pages below) */
.label-arrow {
  display: none;
  width: 0.875rem;
  height: 0.875rem;
  transition: translate 0.2s ease;
}

.block-title {
  font-size: clamp(1.0625rem, 1.4vw, 1.1875rem);
  font-weight: 500;
  line-height: 1.35;
  color: var(--neutral-100);
  transition: color 0.2s ease;
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

/* The thesis is a link: its title takes on the card's color, and the arrow nudges */
.thesis:hover .block-title {
  color: color-mix(in srgb, var(--card-color) 35%, var(--neutral-100));
}

.thesis:hover .read-arrow,
.thesis:hover .label-arrow {
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

/*
 * Short pages, such as tablets in landscape: the thesis summary and the
 * exchange's location (the route names the cities) go, as on phones, and the
 * cards and route tighten, so both degrees still fit
 */
@container page (height < 30rem) {
  .thesis .block-detail,
  .exchange .block-detail {
    display: none;
  }

  .card {
    padding: 1.25rem;
  }

  .route {
    padding-top: 2.25rem;
  }

  /* The arc still ends on the dots' centers: top + 95% of the height = padding + half a dot */
  .route svg {
    top: 0.75rem;
    height: 1.85rem;
  }
}

/* Below lg the years move above the degree */
@media (width < 64rem) {
  .card {
    --years-size: 14cqi;
    grid-template-columns: minmax(0, 1fr);
  }

  .blocks {
    grid-column: auto;
  }
}

/*
 * Compact cards, for narrow pages (phones) and very short ones (phones in
 * landscape): the same card with less in it. The years shrink, and the
 * details keep the thesis and exchange by name: the thesis summary repeats
 * the experience section, the route adds nothing beyond the school's name,
 * and the thesis's arrow moves onto its label, the whole row being the link.
 */
@container page (width < 36rem) or (height < 16rem) {
  .card {
    --years-size: 1.75rem;
    row-gap: 0.625rem;
    padding: 1.125rem 1.25rem;
  }

  h3 {
    font-size: 1.25rem;
  }

  .meta {
    font-size: 0.875rem;
    line-height: 1.45;
  }

  .thesis .block-detail,
  .exchange .block-detail,
  .route,
  .read {
    display: none;
  }

  .blocks {
    margin-top: 0.625rem;
    padding-top: 1rem;
  }

  .block {
    gap: 0.25rem;
  }

  .block-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0;
  }

  .label-arrow {
    display: block;
  }

  /* Details, a step below the degree */
  .block-title {
    font-size: 0.9375rem;
    font-weight: 400;
    line-height: 1.45;
    color: var(--neutral-300);
  }
}

/* Narrow pages: both degrees from the top, the thesis and exchange stacked */
@container page (width < 36rem) {
  .studies {
    justify-content: flex-start;
    gap: 0.875rem;
  }

  .blocks {
    grid-template-columns: 1fr;
    row-gap: 1rem;
  }

  .thesis {
    padding-right: 0;
  }

  .exchange {
    padding-left: 0;
    border-left: none;
  }
}

/*
 * Shorter narrow pages give up detail a step at a time, keeping the cards'
 * spacing: the thesis title shortens to a line, then leaves its label alone,
 * then the minors go and the cards tighten. Measured to keep some room spare
 * at phone widths from 360 to 430px.
 */
@container page (width < 36rem) and (height < 28rem) {
  .thesis .block-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
}

@container page (width < 36rem) and (height < 25rem) {
  .thesis .block-title {
    display: none;
  }
}

@container page (width < 36rem) and (height < 23.5rem) {
  .minor {
    display: none;
  }

  .card {
    padding: 0.75rem 1.25rem;
  }
}

/*
 * Very short pages (phones in landscape) have the width instead: each degree
 * is one row, the years beside it, and the thesis and exchange share a line
 * below, the thesis by its label and link alone.
 */
@container page (height < 16rem) {
  .studies {
    gap: 0.5rem;
  }

  /* The years sit beside the degree here, so the rows can close up */
  .card {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.375rem 1rem;
    padding: 0.625rem 1rem;
  }

  h3 {
    font-size: 1.125rem;
  }

  .blocks {
    grid-column: 1 / -1;
    margin-top: 0.25rem;
    padding-top: 0.5rem;
  }

  .block {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.75rem;
  }

  .thesis .block-title {
    display: none;
  }
}
</style>
