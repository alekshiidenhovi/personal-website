<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { pinnedLayout } from "../composables/usePinnedLayout";
import { useViewportUpdates } from "../composables/useViewportUpdates";
import { SECTIONS, type SectionId } from "../data/sections";
import { closestToViewportCenter } from "../lib/layout";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-viewport section: the title stays pinned at the top while the section
 * scrolls past, and the slideshow steps through its pages, which crossfade in place.
 * Touch and small screens get a normal stacked layout instead (see
 * usePinnedLayout), where the page closest to the middle of the viewport
 * counts as active.
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
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1 });

const index = SECTIONS.findIndex((section) => section.id === props.id);
const { title, subtitle } = SECTIONS[index];

const pageId = (page: number) => props.pageIds?.[page] ?? `${props.id}-${page + 1}`;

const scrollerRef = ref<HTMLElement | null>(null);
const stopRefs: HTMLElement[] = [];
const pageRefs: HTMLElement[] = [];
const activePage = ref(0);
const isInView = ref(false);
let visibilityObserver: IntersectionObserver | null = null;

const updateActivePage = () => {
  const scroller = scrollerRef.value;
  if (!scroller) return;

  // Pinned, the current page is the one whose stop is nearest the top of the viewport
  if (pinnedLayout.value) {
    const distances = stopRefs.map((stop) => Math.abs(stop.getBoundingClientRect().top));
    activePage.value = distances.indexOf(Math.min(...distances));
    return;
  }

  activePage.value = closestToViewportCenter(pageRefs);
};

useViewportUpdates(updateActivePage);

const formatPageNumber = (page: number) => String(page).padStart(2, "0");

onMounted(() => {
  // A section merely touching the viewport's edge reports as intersecting, so require visible overlap
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isInView.value = entry.intersectionRatio > 0;
    },
    { threshold: [0, 0.01] },
  );
  if (scrollerRef.value) visibilityObserver.observe(scrollerRef.value);
});

onUnmounted(() => visibilityObserver?.disconnect());
</script>

<template>
  <section :id="props.id" class="pinned-section"
    :style="{ '--page-count': props.pageCount }">
    <div ref="scrollerRef" class="scroller">
      <!-- Slideshow stops, one per page; a link to a page goes to its stop (see useSlideshow) -->
      <span v-for="n in props.pageCount" :key="n" :ref="(el) => { if (el) stopRefs[n - 1] = el as HTMLElement; }"
        class="slide-stop" data-slide :data-slide-for="pageId(n - 1)" :style="{ '--page': n - 1 }"></span>
      <div class="stage">
        <SectionTitle :index="index + 1" :title="title" :subtitle="subtitle">
          <nav v-if="pinnedLayout && props.pageCount > 1" class="page-indicator" :aria-label="`${title} pages`">
            <!-- Links to the pages' stops, which the slideshow jumps to like the nav's links -->
            <a v-for="n in props.pageCount" :key="n" :href="`#${pageId(n - 1)}`" class="page-tick"
              :class="{ current: n - 1 === activePage }" :aria-label="`Page ${n}`"
              :aria-current="n - 1 === activePage ? 'step' : undefined"></a>
            <span class="page-number">{{ formatPageNumber(activePage + 1) }} / {{ formatPageNumber(props.pageCount)
              }}</span>
          </nav>
        </SectionTitle>
        <div class="pages">
          <div v-for="n in props.pageCount" :id="pageId(n - 1)" :key="n"
            :ref="(el) => { if (el) pageRefs[n - 1] = el as HTMLElement; }" class="page"
            :class="{ current: n - 1 === activePage, past: n - 1 < activePage }">
            <slot :page="n - 1" :active="isInView && n - 1 === activePage" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pinned-section {
  width: 100%;
}

.scroller {
  /* Scroll distance between pages */
  --page-scroll: 50svh;
  position: relative;
  height: calc(100svh + (var(--page-count) - 1) * var(--page-scroll));
}

.slide-stop {
  position: absolute;
  top: calc(var(--page) * var(--page-scroll));
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

/* Pages share one grid cell and crossfade as the active page changes */
.pages {
  flex-grow: 1;
  display: grid;
  grid-template: minmax(0, 1fr) / minmax(0, 1fr);
  min-height: 0;
}

.page {
  grid-area: 1 / 1;
  min-height: 0;
  opacity: 0;
  translate: 0 2.5rem;
  pointer-events: none;
  transition: opacity 0.5s ease, translate 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.page.past {
  translate: 0 -2.5rem;
}

.page.current {
  opacity: 1;
  translate: 0 0;
  pointer-events: auto;
}

/* The stacked layout, for touch and small screens */

/* Links to the section land with air between the nav bar and the title, which the stage's padding adds to */
:root:not(.pinned) .pinned-section {
  scroll-margin-top: calc(var(--nav-height) - 1.5rem);
}

:root:not(.pinned) .scroller {
  height: auto;
}

:root:not(.pinned) .slide-stop {
  display: none;
}

/* The slideshow's height cap doesn't apply to a normal scrolling page */
:root:not(.pinned) .stage {
  --letterbox: 0px;
  position: static;
  height: auto;
  padding-top: 3rem;
  padding-bottom: 1rem;
}

/* Sections can tighten this, e.g. so project cards flow as one list */
:root:not(.pinned) .pages {
  display: flex;
  flex-direction: column;
  gap: var(--stacked-page-gap, 3rem);
}

:root:not(.pinned) .page,
:root:not(.pinned) .page.past {
  /* Links to a page land below the fixed nav bar */
  scroll-margin-top: var(--nav-height);
  opacity: 1;
  translate: none;
  pointer-events: auto;
}
</style>
