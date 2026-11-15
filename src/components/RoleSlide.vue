<script setup lang="ts">
import { EXPERTISE_COLOR } from "../data/expertise";
import { COMPANY_NAMES, type Role, durationMonths, formatYearMonth } from "../data/experience";
import "./covers/cover.css";
import HighlightedText from "./HighlightedText.vue";
import StackLine from "./StackLine.vue";
import SupercellLogo from "./SupercellLogo.vue";
import VeriLogo from "./VeriLogo.vue";

interface Props {
  role: Role;
  /** Position in the list, used for the figure number */
  index: number;
  /** The slide currently in view; only its figure animates */
  active: boolean;
}
const props = defineProps<Props>();
</script>

<template>
  <article class="slide" :style="{ '--card-color': EXPERTISE_COLOR[props.role.discipline] }">
    <div class="info">
      <h3>{{ props.role.title }}</h3>
      <!-- Where and when on one row below the title, so the logo doesn't take a row of its own -->
      <div class="meta">
        <!-- The logo alone identifies the company; the name stays for screen readers -->
        <a class="company" :href="props.role.companyUrl" target="_blank" rel="noreferrer"
          :aria-label="COMPANY_NAMES[props.role.company]">
          <span class="logo" :class="props.role.company">
            <SupercellLogo v-if="props.role.company === 'supercell'" />
            <VeriLogo v-else-if="props.role.company === 'veri'" />
          </span>
        </a>
        <span class="dates">
          {{ formatYearMonth(props.role.start) }} — {{ formatYearMonth(props.role.end) }}
          <span class="duration">· {{ durationMonths(props.role) }} months</span>
        </span>
      </div>

      <ul class="highlights">
        <li v-for="highlight in props.role.highlights" :key="highlight"><HighlightedText :text="highlight" /></li>
      </ul>
      <StackLine :items="props.role.stack" />
    </div>

    <!-- Presented as a figure with crop marks, distinct from the project cards -->
    <figure>
      <div class="figure-body">
        <span class="crop crop-top-left"></span>
        <span class="crop crop-top-right"></span>
        <span class="crop crop-bottom-left"></span>
        <span class="crop crop-bottom-right"></span>
        <component :is="props.role.figure" :active="props.active" />
      </div>
      <figcaption>
        <span class="figure-number">Fig. {{ String(props.index + 1).padStart(2, "0") }}</span>
        {{ props.role.figureCaption }}
      </figcaption>
    </figure>
  </article>
</template>

<style scoped>
.slide {
  --selection-color: var(--card-color);
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  height: 100%;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.875rem;
}

.company {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  width: fit-content;
  text-decoration: none;
}

.logo {
  display: flex;
  height: 1.25rem;
}

/* The stacked three-line mark needs more height to match the one-line wordmark */
.logo.supercell {
  height: 1.75rem;
}

.logo svg {
  width: auto;
  height: 100%;
}

.company .logo {
  transition: opacity 0.2s ease;
}

.company:hover .logo {
  opacity: 0.75;
}

h3 {
  font-size: clamp(1.75rem, min(3.5vw, 6dvh), 3rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--neutral-100);
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

figure {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  max-height: 32rem;
  min-height: 0;
}

.figure-body {
  position: relative;
  flex-grow: 1;
  min-height: 0;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  background-image: radial-gradient(color-mix(in srgb, var(--neutral-500), transparent 85%) 1px, transparent 1px);
  background-size: 1.25rem 1.25rem;
}

/* Corner crop marks */
.crop {
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-color: var(--card-color);
  border-style: solid;
  border-width: 0;
}

.crop-top-left {
  top: 0;
  left: 0;
  border-top-width: 2px;
  border-left-width: 2px;
}

.crop-top-right {
  top: 0;
  right: 0;
  border-top-width: 2px;
  border-right-width: 2px;
}

.crop-bottom-left {
  bottom: 0;
  left: 0;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.crop-bottom-right {
  bottom: 0;
  right: 0;
  border-bottom-width: 2px;
  border-right-width: 2px;
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

/* Matches PinnedSection's stacked fallback */
:root:not(.pinned) .slide {
  grid-template-columns: 1fr;
}

:root:not(.pinned) figure {
  height: 20rem;
}
</style>
