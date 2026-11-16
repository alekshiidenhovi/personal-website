<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useViewportUpdates } from "../composables/useViewportUpdates";
import { SECTIONS, type SectionId } from "../data/sections";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-screen slide: the title and stage stay pinned while the section
 * scrolls past, and the section's pages slide sideways with the scroll. The
 * page snaps (see `scroll-snap-type` in style.css) to one stop per page, so a
 * swipe, wheel step or key press settles on a whole page, and a fast one can't
 * skip any.
 *
 * Scroll progress through the section, from 0 on the first page to
 * pageCount - 1 on the last, is written to `--progress` on the section, and
 * everything that moves with the pages reads it, so nothing can fall out of step.
 *
 * The default slot is rendered once per page with `{ page, active }`, where
 * `active` is the current page while the section is on screen, so visuals only
 * play while visible. Multi-page sections show a page indicator next to the title.
 */

interface Props {
  id: SectionId;
  pageCount?: number;
  /** Anchor ids for the pages, so in-page links can target a single page; numbered after the section by default */
  pageIds?: string[];
  hideSubtitleOnPhones?: boolean;
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1 });

const index = SECTIONS.findIndex((section) => section.id === props.id);
const { title, subtitle } = SECTIONS[index];

const pageId = (page: number) => props.pageIds?.[page] ?? `${props.id}-${page + 1}`;

const sectionRef = ref<HTMLElement | null>(null);
const stopRefs: HTMLElement[] = [];
const activePage = ref(0);
const isInView = ref(false);
let visibilityObserver: IntersectionObserver | null = null;

/** Reads progress from where the stops sit, so it matches the snapping exactly */
const updateProgress = () => {
  const stops = stopRefs.slice(0, props.pageCount);
  if (!sectionRef.value || !stops.length) return;
  const first = stops[0].getBoundingClientRect().top;
  const pageScroll = stops.length > 1 ? stops[1].getBoundingClientRect().top - first : 1;
  const progress = Math.min(Math.max(-first / pageScroll, 0), props.pageCount - 1);
  sectionRef.value.style.setProperty("--progress", String(progress));
  activePage.value = Math.round(progress);
};

useViewportUpdates(updateProgress);

const formatPageNumber = (page: number) => String(page).padStart(2, "0");

onMounted(() => {
  // A section merely touching the viewport's edge reports as intersecting, so require visible overlap
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isInView.value = entry.intersectionRatio > 0;
    },
    { threshold: [0, 0.01] },
  );
  if (sectionRef.value) visibilityObserver.observe(sectionRef.value);
});

onUnmounted(() => visibilityObserver?.disconnect());
</script>

<template>
  <section :id="props.id" ref="sectionRef" class="pinned-section" :style="{ '--page-count': props.pageCount }">
    <!-- Snap stops, one per page; each carries its page's anchor id, so links and loaded URLs land on it -->
    <span v-for="n in props.pageCount" :id="props.pageCount > 1 ? pageId(n - 1) : undefined" :key="n"
      :ref="(el) => { if (el) stopRefs[n - 1] = el as HTMLElement; }" class="slide-stop" data-slide
      :style="{ '--page': n - 1 }"></span>
    <div class="stage">
      <SectionTitle :index="index + 1" :title="title" :subtitle="subtitle"
        :hide-subtitle-on-phones="props.hideSubtitleOnPhones">
        <nav v-if="props.pageCount > 1" class="page-indicator" :aria-label="`${title} pages`">
          <!-- Links to the pages' stops, which crossfade like the nav's links -->
          <a v-for="n in props.pageCount" :key="n" :href="`#${pageId(n - 1)}`" class="page-tick"
            :class="{ current: n - 1 === activePage }" :aria-label="`Page ${n}`"
            :aria-current="n - 1 === activePage ? 'step' : undefined"></a>
          <span class="page-number">{{ formatPageNumber(activePage + 1) }} / {{ formatPageNumber(props.pageCount)
            }}</span>
        </nav>
      </SectionTitle>
      <div class="pages">
        <div class="track">
          <!-- Pages off to the side can't be focused or clicked -->
          <div v-for="n in props.pageCount" :key="n" class="page" :inert="n - 1 !== activePage">
            <slot :page="n - 1" :active="isInView && n - 1 === activePage" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pinned-section {
  /* Scroll distance between pages */
  --page-scroll: 50svh;
  --page-gap: var(--gutter);
  position: relative;
  width: 100%;
  height: calc(100svh + (var(--page-count) - 1) * var(--page-scroll));
}

/* Chrome ignores zero-size snap areas, hence the 1px size */
.slide-stop {
  position: absolute;
  top: calc(var(--page) * var(--page-scroll));
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.stage {
  /*
   * On screens taller than 16:10 the extra height is split above and below
   * the slide instead of stretching it. The root font size follows
   * min(vw, vh), so a rem height caps the slide's aspect ratio.
   */
  --letterbox: max(0px, (100svh - 68rem) / 2);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vh, 2.5rem);
  height: 100svh;
  max-width: var(--content-width);
  margin: 0 auto;
  padding:
    calc(var(--nav-height) + 1rem + var(--letterbox)) var(--gutter) calc(clamp(1.5rem, 4vh, 3rem) + var(--letterbox));
}

.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* A thin bar with a taller hit area */
.page-tick {
  width: 1.75rem;
  padding: 0.625rem 0;
  background: linear-gradient(var(--neutral-700), var(--neutral-700)) center / 100% 2px no-repeat;
  transition: background 0.3s ease;
}

.page-tick:hover {
  background-image: linear-gradient(var(--neutral-400), var(--neutral-400));
}

.page-tick.current {
  background-image: linear-gradient(var(--primary-400), var(--primary-400));
}

.page-number {
  margin-left: 0.75rem;
  font-variant-numeric: tabular-nums;
}

/* Clipped, not hidden: a hidden overflow could still be scrolled sideways by focus or find-in-page */
.pages {
  flex-grow: 1;
  min-height: 0;
  overflow: clip;
}

/* The pages side by side, moved one page width (plus the gap) per unit of progress */
.track {
  display: flex;
  gap: var(--page-gap);
  height: 100%;
  transform: translateX(calc(var(--progress, 0) * (-100% - var(--page-gap))));
}

/* A page too tall for the screen scrolls on its own, as a last resort; pages are designed to fit */
.page {
  flex: 0 0 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>
