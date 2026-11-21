<script setup lang="ts">
import { COMPANIES, type Role } from '../../content/experience';
import { countMonths, formatYearMonth } from '../../lib/dates';
import ItemSlide from '../layout/ItemSlide.vue';
import CropMarks from '../ui/CropMarks.vue';
import HighlightedText from '../ui/HighlightedText.vue';
import CompanyLogo from './CompanyLogo.vue';
import { ROLE_FIGURES } from './roleFigures';

/** One role: a card with the title, company, dates and highlights, and a figure illustrating the work. */
interface Props {
  role: Role;
  /** The role's position in the list, which numbers its figure. */
  index: number;
  /** Whether the slide is the one in view, so its figure plays. */
  active: boolean;
}
const props = defineProps<Props>();

const company = COMPANIES[props.role.company];
const figure = ROLE_FIGURES[props.role.figure];
const figureNumber = `Fig. ${String(props.index + 1).padStart(2, '0')}`;
</script>

<template>
  <ItemSlide class="role-slide" :discipline="props.role.discipline" :title="props.role.title" popup-label="Open figure"
    :popup-title="`${figureNumber} · ${props.role.figureCaption}`" :active="props.active" fills-height>
    <template #info>
      <!-- Where and when on one row below the title, so the logo doesn't take a row of its own -->
      <div class="meta">
        <!-- The logo alone identifies the company; the name stays for screen readers -->
        <a class="company" :href="company.url" target="_blank" rel="noreferrer" :aria-label="company.name">
          <CompanyLogo :company="props.role.company" />
        </a>
        <span class="dates">
          {{ formatYearMonth(props.role.start) }} — {{ formatYearMonth(props.role.end) }}
          <span class="duration">· {{ countMonths(props.role.start, props.role.end) }} months</span>
        </span>
      </div>
      <ul class="highlights">
        <li v-for="highlight in props.role.highlights" :key="highlight"><HighlightedText :text="highlight" /></li>
      </ul>
    </template>

    <!-- Presented as a figure with crop marks, distinct from the project cards; in the popup it takes the drawing's
      own shape -->
    <template #visual="{ active, isInPopup }">
      <div class="dot-grid" :class="isInPopup ? 'popup-figure' : 'figure-body'">
        <CropMarks />
        <component :is="figure" :active="active" />
      </div>
    </template>

    <template #caption>
      <figcaption>
        <span class="figure-number">{{ figureNumber }}</span>
        {{ props.role.figureCaption }}
      </figcaption>
    </template>
  </ItemSlide>
</template>

<style scoped>
@import "../../styles/media.css";

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
}

.company {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  transition: opacity 0.2s ease;
}

.company:hover {
  opacity: 0.75;
}

.dates {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--neutral-300);
}

.duration {
  color: var(--text-muted);
}

.highlights {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  list-style: none;
}

.highlights li {
  position: relative;
  padding-left: 1.5rem;
  font-size: 1rem;
  line-height: 1.6;
  /* A step down from white, leaving room for the highlighted facts to stand out */
  color: var(--neutral-400);
}

.highlights li::before {
  content: "→";
  position: absolute;
  left: 0;
  font-family: var(--font-mono);
  color: var(--card-color);
}

.figure-body {
  position: relative;
  flex-grow: 1;
  min-height: 0;
  padding: clamp(1.25rem, 3vw, 2.5rem);
}

.popup-figure {
  position: relative;
  aspect-ratio: 400 / 220;
  padding: 0.5rem;
}

figcaption {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-400);
}

.figure-number {
  margin-right: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--card-color);
}

/* Between lg and xl the text gets half the width, so it wraps onto fewer lines */
@media (--wide) and (--below-xl) {
  .role-slide {
    --columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

/* Phones: tight enough that a whole role fits on one screen, down to an iPhone 13 mini with Safari's toolbars */
@media (--phone) {
  .role-slide {
    --info-gap: 0.75rem;
  }

  .highlights {
    gap: 0.5rem;
  }

  .highlights li {
    font-size: 0.9375rem;
    line-height: 1.5;
  }
}

/* Short screens (phones in landscape): a step smaller still */
@media (--short) {
  .role-slide {
    --info-gap: 0.5rem;
    --title-size: 1.25rem;
  }

  .highlights li {
    font-size: 0.8125rem;
    line-height: 1.45;
  }
}

/*
 * Short wide pages (landscape tablets, short laptops): the card tightens, its text a step smaller. Very short ones
 * (phones in landscape) have their own sizes, below.
 */
@container page (width >= 36rem) and (16rem <= height < 30rem) {
  .role-slide {
    --info-gap: 0.75rem;
    --info-padding: 1.25rem 1.5rem;
    --title-size: 2rem;
  }

  .highlights li {
    font-size: 0.9375rem;
    line-height: 1.5;
  }
}

/*
 * Short narrow pages set the highlights a step smaller at a time, the card closing up with them. The narrowest
 * phones (360px) wrap the highlights onto more lines, so they take each step sooner. Measured on the longest role
 * to keep room spare at phone widths from 360 to 430px.
 */
@container page ((width < 36rem) and (height < 24rem)) or ((width < 20.5rem) and (height < 27rem)) {
  .role-slide {
    --info-gap: 0.625rem;
    --info-padding: 1.125rem;
  }

  .highlights li {
    font-size: 0.875rem;
    line-height: 1.45;
  }
}

@container page ((width < 36rem) and (height < 21.5rem)) or ((width < 20.5rem) and (height < 24rem)) {
  .role-slide {
    --info-gap: 0.5rem;
    --info-padding: 1rem;
    --title-size: 1.375rem;
  }

  .highlights li {
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}

/* Very short pages (phones in landscape): a compact card */
@container page (height < 16rem) {
  .role-slide {
    --info-gap: 0.375rem;
    --info-padding: 0.625rem 1rem;
  }
}
</style>
