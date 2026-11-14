<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { STUDIES, TIMELINE_END, TIMELINE_START } from "../data/education";
import { EXPERTISE_COLOR } from "../data/expertise";
import PinnedSection from "./PinnedSection.vue";

const TIMELINE_YEARS = Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => TIMELINE_START + i);
const toPercent = (year: number) => ((year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
</script>

<template>
  <PinnedSection id="education" :index="4" title="Education"
    subtitle="Industrial engineering into computer science, with data and machine learning throughout.">
    <div class="education">
      <ol class="studies">
        <li v-for="study in STUDIES" :key="study.degree" class="row study"
          :style="{
            '--study-color': study.discipline ? EXPERTISE_COLOR[study.discipline] : 'var(--neutral-500)',
            '--selection-color': study.discipline ? EXPERTISE_COLOR[study.discipline] : undefined,
          }">
          <span class="years">{{ study.start }}{{ study.end - study.start > 1 ? ` — ${study.end}` : "" }}</span>
          <div class="text">
            <h3>{{ study.degree }}</h3>
            <p class="school">{{ study.school }}</p>
            <p class="detail">{{ study.detail }}</p>
            <a v-if="study.link" class="link" :href="study.link.href" target="_blank" rel="noreferrer">
              {{ study.link.label }}
              <Icon icon="heroicons:arrow-up-right-20-solid" class="link-arrow" />
            </a>
          </div>
          <div class="track" aria-hidden="true">
            <span class="bar"
              :style="{ left: `${toPercent(study.start)}%`, width: `${toPercent(study.end) - toPercent(study.start)}%` }"></span>
          </div>
        </li>
      </ol>
      <!-- Shares the rows' columns so the years line up under the bars -->
      <div class="row axis-row" aria-hidden="true">
        <div class="axis">
          <span v-for="year in TIMELINE_YEARS" :key="year" class="tick" :style="{ left: `${toPercent(year)}%` }">{{
            year }}</span>
        </div>
      </div>
    </div>
  </PinnedSection>
</template>

<style scoped>
.education {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}

.studies {
  display: flex;
  flex-direction: column;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(1rem, 3vw, 3rem);
}

.study {
  padding: clamp(1rem, 2.5vh, 1.75rem) 0;
  border-bottom: 1px solid var(--neutral-800);
}

.years {
  align-self: start;
  padding-top: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: var(--neutral-400);
}

.text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

h3 {
  font-size: clamp(1.25rem, 2vw, 1.625rem);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--neutral-100);
}

.school {
  color: var(--neutral-300);
}

.detail {
  font-size: 0.9375rem;
  color: var(--text-muted);
}

.link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.25rem;
  margin-top: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--study-color);
  text-decoration: none;
}

.link-arrow {
  width: 1rem;
  height: 1rem;
  transition: translate 0.2s ease;
}

.link:hover .link-arrow {
  translate: 2px -2px;
}

/* Each study as a bar on a shared 2020 to 2026 axis */
.track {
  position: relative;
  height: 0.5rem;
  background: linear-gradient(var(--neutral-800), var(--neutral-800)) center / 100% 1px no-repeat;
}

.bar {
  position: absolute;
  top: 0;
  bottom: 0;
  background-color: var(--study-color);
  box-shadow: 0 0 1rem color-mix(in srgb, var(--study-color), transparent 60%);
}

.axis {
  grid-column: 3;
  position: relative;
  height: 2rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tick {
  position: absolute;
  top: 0.75rem;
  translate: -50% 0;
}

/* PINNED_LAYOUT_QUERY not matching: the timeline drops away and the list remains */
@media not ((min-width: 57.75rem) and (min-height: 40rem) and (orientation: landscape)) {
  .row {
    grid-template-columns: 6rem minmax(0, 1fr);
  }

  .track,
  .axis-row {
    display: none;
  }
}
</style>
