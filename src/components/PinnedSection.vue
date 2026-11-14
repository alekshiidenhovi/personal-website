<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { PINNED_LAYOUT_QUERY, closestToViewportCenter } from "../lib/layout";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-viewport section: the title stays pinned at the top while the section
 * scrolls past, and scrolling snaps through its pages, which crossfade in place.
 * Narrow or short screens fall back to a normal stacked layout, where the page
 * closest to the middle of the viewport counts as active.
 *
 * The default slot is rendered once per page with `{ page, active }`, where
 * `active` is the current page while the section is on screen, so visuals only
 * play while visible. Multi-page sections show a page indicator next to the title.
 */

interface Props {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  pageCount?: number;
  /** Anchor ids for the pages, so in-page links can target a single page */
  pageIds?: string[];
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1 });

/** Scroll distance between pages, as a fraction of the viewport height */
const PAGE_SCROLL_RATIO = 0.5;

const scrollerRef = ref<HTMLElement | null>(null);
const pageRefs: HTMLElement[] = [];
const activePage = ref(0);
const isPinned = ref(true);
const isInView = ref(false);
let pinnedMedia: MediaQueryList | null = null;
let visibilityObserver: IntersectionObserver | null = null;

const updateActivePage = () => {
  const scroller = scrollerRef.value;
  if (!scroller) return;
  isPinned.value = pinnedMedia?.matches ?? true;

  if (isPinned.value) {
    const scrolledIntoSection = -scroller.getBoundingClientRect().top;
    const page = Math.round(scrolledIntoSection / (PAGE_SCROLL_RATIO * window.innerHeight));
    activePage.value = Math.min(Math.max(page, 0), props.pageCount - 1);
    return;
  }

  activePage.value = closestToViewportCenter(pageRefs);
};

const formatPageNumber = (page: number) => String(page).padStart(2, "0");

const goToPage = (page: number) => {
  if (!scrollerRef.value) return;
  if (!isPinned.value) {
    pageRefs[page]?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const sectionTop = scrollerRef.value.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: sectionTop + page * PAGE_SCROLL_RATIO * window.innerHeight, behavior: "smooth" });
};

onMounted(() => {
  pinnedMedia = window.matchMedia(PINNED_LAYOUT_QUERY);
  pinnedMedia.addEventListener("change", updateActivePage);
  window.addEventListener("scroll", updateActivePage, { passive: true });
  window.addEventListener("resize", updateActivePage);
  updateActivePage();

  // A section merely touching the viewport's edge reports as intersecting, so require visible overlap
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isInView.value = entry.intersectionRatio > 0;
    },
    { threshold: [0, 0.01] },
  );
  if (scrollerRef.value) visibilityObserver.observe(scrollerRef.value);
});

onUnmounted(() => {
  pinnedMedia?.removeEventListener("change", updateActivePage);
  window.removeEventListener("scroll", updateActivePage);
  window.removeEventListener("resize", updateActivePage);
  visibilityObserver?.disconnect();
});
</script>

<template>
  <section :id="props.id" class="pinned-section"
    :style="{ '--page-count': props.pageCount, '--page-scroll': `${PAGE_SCROLL_RATIO * 100}dvh` }">
    <div ref="scrollerRef" class="scroller">
      <!-- In the slideshow a link to a page scrolls to its snap point (see useSlideshow) -->
      <span v-for="n in props.pageCount" :key="n" class="snap-point" data-slide
        :data-slide-for="props.pageIds?.[n - 1]" :style="{ '--page': n - 1 }"></span>
      <div class="stage">
        <SectionTitle :index="props.index" :title="props.title" :subtitle="props.subtitle">
          <nav v-if="isPinned && props.pageCount > 1" class="page-indicator" :aria-label="`${props.title} pages`">
            <button v-for="n in props.pageCount" :key="n" type="button" class="page-tick"
              :class="{ current: n - 1 === activePage }" :aria-label="`Page ${n}`"
              :aria-current="n - 1 === activePage ? 'step' : undefined" @click="goToPage(n - 1)"></button>
            <span class="page-number">{{ formatPageNumber(activePage + 1) }} / {{ formatPageNumber(props.pageCount)
              }}</span>
          </nav>
        </SectionTitle>
        <div class="pages">
          <div v-for="n in props.pageCount" :id="props.pageIds?.[n - 1]" :key="n"
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
  position: relative;
  height: calc(100dvh + (var(--page-count) - 1) * var(--page-scroll));
}

/* Chrome ignores zero-size snap areas, hence the 1px size */
.snap-point {
  position: absolute;
  top: calc(var(--page) * var(--page-scroll));
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
}

.stage {
  /*
   * On screens taller than 16:10 the extra height is split above and below
   * the slide instead of stretching it. The root font size follows
   * min(vw, vh), so a rem height caps the slide's aspect ratio.
   */
  --letterbox: max(0px, (100dvh - 68rem) / 2);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vh, 2.5rem);
  height: 100dvh;
  max-width: 96rem;
  margin: 0 auto;
  padding:
    calc(var(--nav-height) + 1rem + var(--letterbox)) clamp(1.25rem, 5vw, 5rem) calc(clamp(1.5rem, 4vh, 3rem) + var(--letterbox));
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
  border: none;
  background: linear-gradient(var(--neutral-700), var(--neutral-700)) center / 100% 2px no-repeat;
  cursor: pointer;
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

/* PINNED_LAYOUT_QUERY not matching */
@media not ((min-width: 57.75rem) and (min-height: 40rem) and (orientation: landscape)) {
  .scroller {
    height: auto;
  }

  .snap-point {
    display: none;
  }

  /* The slideshow's height cap doesn't apply to a normal scrolling page */
  .stage {
    --letterbox: 0px;
    position: static;
    height: auto;
    padding-top: 3rem;
    padding-bottom: 1rem;
  }

  /* Sections can tighten this, e.g. so project cards flow as one list */
  .pages {
    display: flex;
    flex-direction: column;
    gap: var(--stacked-page-gap, 3rem);
  }

  .page,
  .page.past {
    opacity: 1;
    translate: none;
    pointer-events: auto;
  }
}
</style>
