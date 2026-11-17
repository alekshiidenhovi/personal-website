<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useViewportUpdates } from "../composables/useViewportUpdates";
import { SECTIONS, type SectionId } from "../data/sections";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-screen section of one or more pages. The section's title stays
 * pinned below the nav while its pages scroll up beneath it, a page a screen:
 * each page fills the height the title leaves, and is a snap stop (see
 * `scroll-snap-type` in App.vue), so a swipe, wheel step or key press settles
 * on a whole page, and a fast one can't skip any.
 *
 * The title's height varies with the screen and how its subtitle wraps, so it
 * is measured into `--header-height`, which sizes the pages and offsets where
 * they snap, just below the title.
 *
 * The default slot is rendered once per page with `{ page, active }`, where
 * `active` is the current page while the section is on screen, so visuals only
 * play while visible. It turns on once the scrolling has settled, so a
 * visual's start-up work never lands in the middle of a scroll. Multi-page
 * sections show a page indicator next to the title.
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

const sectionRef = ref<HTMLElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);
const pageRefs: HTMLElement[] = [];
const activePage = ref(0);
/** The page the scrolling last came to rest on, which `active` follows */
const settledPage = ref(0);
/** How long the scrolling must pause to count as settled */
const SETTLE_MS = 150;
let settleTimer: ReturnType<typeof setTimeout> | undefined;
const isInView = ref(false);
let visibilityObserver: IntersectionObserver | null = null;
let headerObserver: ResizeObserver | null = null;

/**
 * Reads how far the pages have scrolled up under the title, in pages, so it
 * matches the snapping exactly, then hands back the changes to make from it
 * (see useViewportUpdates).
 */
const measureProgress = () => {
  const pages = pageRefs.slice(0, props.pageCount);
  const header = headerRef.value;
  if (!pages.length || !header) return undefined;
  const first = pages[0].getBoundingClientRect().top;
  const pageHeight = pages.length > 1 ? pages[1].getBoundingClientRect().top - first : 1;
  const scrolled = header.getBoundingClientRect().bottom - first;
  const progress = Math.min(Math.max(scrolled / pageHeight, 0), props.pageCount - 1);

  return () => {
    activePage.value = Math.round(progress);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settledPage.value = activePage.value;
    }, SETTLE_MS);
  };
};

useViewportUpdates(measureProgress);

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

  // Reported before the first paint, and again whenever the title's height changes
  headerObserver = new ResizeObserver(([entry]) => {
    sectionRef.value?.style.setProperty("--header-height", `${entry.borderBoxSize[0].blockSize}px`);
  });
  if (headerRef.value) headerObserver.observe(headerRef.value);
});

onUnmounted(() => {
  visibilityObserver?.disconnect();
  headerObserver?.disconnect();
  clearTimeout(settleTimer);
});
</script>

<template>
  <section :id="props.id" ref="sectionRef" class="pinned-section">
    <!-- Pinned below the nav, opaque, so the pages scroll up out of sight beneath it -->
    <div ref="headerRef" class="section-header">
      <div class="column">
        <SectionTitle :index="index + 1" :title="title" :subtitle="subtitle">
          <!-- Passed only with several pages, so a single page's title doesn't keep an empty row for it -->
          <template v-if="props.pageCount > 1" #default>
            <nav class="page-indicator" :aria-label="`${title} pages`">
              <!-- Links to the pages, which crossfade like the nav's links -->
              <a v-for="n in props.pageCount" :key="n" :href="`#${pageId(n - 1)}`" class="page-tick"
                :class="{ current: n - 1 === activePage }" :aria-label="`Page ${n}`"
                :aria-current="n - 1 === activePage ? 'step' : undefined"></a>
              <span class="page-number">{{ formatPageNumber(activePage + 1) }} / {{ formatPageNumber(props.pageCount)
                }}</span>
            </nav>
          </template>
        </SectionTitle>
      </div>
    </div>
    <!--
      A page a screen, each a snap stop carrying its page's anchor id, so links
      and loaded URLs land on it. Pages other than the current one can't be
      focused, so focus never lands on one half hidden under the title.
    -->
    <div v-for="n in props.pageCount" :id="props.pageCount > 1 ? pageId(n - 1) : undefined" :key="n"
      :ref="(el) => { if (el) pageRefs[n - 1] = el as HTMLElement; }" class="page column" data-slide
      :inert="n - 1 !== activePage">
      <slot :page="n - 1" :active="isInView && n - 1 === settledPage" />
    </div>
  </section>
</template>

<style scoped>
.pinned-section {
  /*
   * On screens taller than 16:10 the extra height is split above and below
   * each page instead of stretching it. The root font size follows
   * min(vw, vh), so a rem height caps the page's aspect ratio.
   */
  --letterbox: max(0px, (100svh - 68rem) / 2);
  /* Until measured (see headerObserver) */
  --header-height: 14rem;
  /* The space between the title and the page, and below the page */
  --header-gap: clamp(1.25rem, 3vh, 2.5rem);
  --page-end: clamp(1.5rem, 4vh, 3rem);
  width: 100%;
}

/* The content column, centered within --content-width, with --gutter on each side */
.column {
  max-width: var(--content-width);
  margin: 0 auto;
  padding-inline: var(--gutter);
}

.section-header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: calc(var(--nav-height) + 1rem + var(--letterbox));
  padding-bottom: var(--header-gap);
  background-color: var(--neutral-950);
}

/*
 * As tall as the screen leaves below the title, snapping just below it. A size
 * container named `page`, so content can drop optional details when the page
 * is short, whatever the screen: `@container page (height < …)`. Pages are
 * designed to fit; in development, lib/fitCheck warns when one doesn't.
 */
.page {
  container: page / size;
  height: calc(100svh - var(--header-height));
  padding-bottom: calc(var(--page-end) + var(--letterbox));
  scroll-snap-align: start;
  scroll-snap-stop: always;
  scroll-margin-top: var(--header-height);
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

/* Phones: less space around the title row */
@media (width < 40rem) {
  .pinned-section {
    --header-gap: 0.875rem;
    --page-end: 1rem;
  }
}

/* Short screens (phones in landscape) need every line for the page */
@media (height < 30rem) {
  .pinned-section {
    --header-gap: 0.75rem;
    --page-end: 0.75rem;
  }

  .section-header {
    padding-top: calc(var(--nav-height) + 0.5rem);
  }
}
</style>
