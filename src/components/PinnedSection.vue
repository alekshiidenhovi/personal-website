<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { PINNED_LAYOUT_QUERY } from "../lib/layout";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-viewport section: the title stays pinned at the top while the section
 * scrolls past, and scrolling snaps through its pages, which crossfade in place.
 * Narrow or short screens fall back to a normal stacked layout, where the page
 * closest to the middle of the viewport counts as active.
 *
 * The default slot is rendered once per page with `{ page, active }`.
 */

interface Props {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  pageCount?: number;
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1 });

/** Scroll distance between pages, as a fraction of the viewport height */
const PAGE_SCROLL_RATIO = 0.5;

const scrollerRef = ref<HTMLElement | null>(null);
const pageRefs: HTMLElement[] = [];
const activePage = ref(0);
const isPinned = ref(true);
let pinnedMedia: MediaQueryList | null = null;

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

  const viewportCenter = window.innerHeight / 2;
  const distances = pageRefs.map((page) => {
    const { top, height } = page.getBoundingClientRect();
    return Math.abs(top + height / 2 - viewportCenter);
  });
  activePage.value = distances.indexOf(Math.min(...distances));
};

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
});

onUnmounted(() => {
  pinnedMedia?.removeEventListener("change", updateActivePage);
  window.removeEventListener("scroll", updateActivePage);
  window.removeEventListener("resize", updateActivePage);
});
</script>

<template>
  <section :id="props.id" class="pinned-section"
    :style="{ '--page-count': props.pageCount, '--page-scroll': `${PAGE_SCROLL_RATIO * 100}dvh` }">
    <div ref="scrollerRef" class="scroller">
      <span v-for="n in props.pageCount" :key="n" class="snap-point" data-slide
        :style="{ '--page': n - 1 }"></span>
      <div class="stage">
        <SectionTitle :index="props.index" :title="props.title" :subtitle="props.subtitle" />
        <slot v-if="isPinned" name="nav" :active-page="activePage" :go-to-page="goToPage" />
        <div class="pages">
          <div v-for="n in props.pageCount" :key="n" :ref="(el) => { if (el) pageRefs[n - 1] = el as HTMLElement; }"
            class="page" :class="{ current: n - 1 === activePage, past: n - 1 < activePage }">
            <slot :page="n - 1" :active="n - 1 === activePage" />
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
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vh, 2.5rem);
  height: 100dvh;
  max-width: 96rem;
  margin: 0 auto;
  padding: calc(var(--nav-height) + 1rem) clamp(1.25rem, 5vw, 5rem) clamp(1.5rem, 4vh, 3rem);
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
@media not ((min-width: 57.75rem) and (min-height: 40rem)) {
  .scroller {
    height: auto;
  }

  .snap-point {
    display: none;
  }

  .stage {
    position: static;
    height: auto;
    padding-top: clamp(4rem, 12vw, 6rem);
  }

  .pages {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }

  .page,
  .page.past {
    opacity: 1;
    translate: none;
    pointer-events: auto;
  }
}
</style>
