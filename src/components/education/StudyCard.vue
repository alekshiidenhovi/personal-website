<script setup lang="ts">
import type { Study } from '../../content/education';
import { formatYearSpan } from '../../lib/dates';
import Icon from '../ui/Icon.vue';
import RouteArc from './RouteArc.vue';

/**
 * A degree as one row on a shared grid: the years in a rail on the left, the degree and its highlights beside them.
 * A degree with a thesis or an exchange shows them below a hairline; one without stays a slim row.
 */
interface Props {
  study: Study;
}
const props = defineProps<Props>();
</script>

<template>
  <li class="card tinted-card dot-grid" :data-discipline="props.study.discipline">
    <span class="years">{{ formatYearSpan(props.study.startYear, props.study.endYear) }}</span>

    <div class="degree">
      <h3>{{ props.study.degree }}</h3>
      <p class="meta">{{ props.study.school }}<span class="detail"><span class="separator">·</span>{{
        props.study.detail }}</span></p>
    </div>

    <div v-if="props.study.thesis || props.study.exchange" class="blocks">
      <a v-if="props.study.thesis" class="block thesis" :href="props.study.thesis.url" target="_blank"
        rel="noreferrer">
        <!-- The arrow stands in for "Read the thesis" where that line is left out -->
        <span class="block-label">
          Master's thesis
          <Icon icon="heroicons:arrow-up-right-20-solid" class="label-arrow" />
        </span>
        <span class="block-title">{{ props.study.thesis.title }}</span>
        <span class="block-detail">{{ props.study.thesis.summary }}</span>
        <span class="read">
          Read the thesis
          <Icon icon="heroicons:arrow-up-right-20-solid" class="read-arrow" />
        </span>
      </a>

      <div v-if="props.study.exchange" class="block exchange">
        <span class="block-label">Exchange · {{ props.study.exchange.year }}</span>
        <span class="block-title">{{ props.study.exchange.school }}</span>
        <span class="block-detail">{{ props.study.exchange.location }}</span>
        <RouteArc class="route" :from="props.study.exchange.route.from" :to="props.study.exchange.route.to" />
      </div>
    </div>
  </li>
</template>

<style scoped>
@import "../../styles/media.css";

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
 * Outlined like the section numbers, in the card's color. The fill paints over the stroke's inner half, hiding
 * lines where a glyph's contours overlap.
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
 * The thesis and exchange as columns below a hairline, without a box of their own: a box inside the card would
 * crowd it, most of all on phones
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

/* Only where the "Read the thesis" line is left out (see the compact cards below) */
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

/*
 * Short pages, such as tablets in landscape: the thesis summary and the exchange's location (the route names the
 * cities) go, as on phones, and the cards tighten, so both degrees still fit
 */
@container page (height < 30rem) {
  .block-detail {
    display: none;
  }

  .card {
    padding: 1.25rem;
  }
}

/* Below lg the years move above the degree */
@media (--below-lg) {
  .card {
    --years-size: 14cqi;
    grid-template-columns: minmax(0, 1fr);
  }

  .blocks {
    grid-column: auto;
  }
}

/*
 * Compact cards, for narrow pages (phones) and short ones (phones in landscape, short laptop windows): the same
 * card with less in it. The years shrink, and the details keep the thesis and exchange by name: the thesis summary repeats the
 * experience section, the route adds nothing beyond the school's name, and the thesis's arrow moves onto its
 * label, the whole row being the link.
 */
@container page (width < 36rem) or (height < 24rem) {
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

  .block-detail,
  .read,
  .exchange .route {
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

/* Narrow pages: the thesis and exchange stacked */
@container page (width < 36rem) {
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
 * Shorter narrow pages give up detail a step at a time, keeping the cards' spacing: the thesis title shortens to a
 * line, then leaves its label alone, then the details go and the cards tighten. Measured to keep some room spare
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
  .detail {
    display: none;
  }

  .card {
    padding: 0.75rem 1.25rem;
  }
}

/*
 * Short pages (phones in landscape, short laptop windows) have the width instead: each degree is one row, the years
 * beside it, and the thesis and exchange share a line below, the thesis by its label and link alone. Below 24rem,
 * as the roomier layouts need about 23.5rem with the years in the rail, and more with them stacked above.
 */
@container page (height < 24rem) {
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
