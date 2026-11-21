<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useCurrentPage } from '../../composables/useCurrentPage';
import { useIsInViewport } from '../../composables/useIsInViewport';
import { SECTIONS, type SectionId } from '../../content/sections';
import PageIndicator from './PageIndicator.vue';
import SectionTitle from './SectionTitle.vue';

/**
 * A full-screen section of one or more pages, each a slide. The section's title stays pinned below the nav while
 * its pages scroll up beneath it, a page a screen. Multi-page sections show a page indicator by the title.
 *
 * The default slot is rendered once per page with `{ page, active }`: `active` is true for the page that
 * scrolling has settled on while the section is in view, so visuals play only when seen.
 */
interface Props {
  id: SectionId;
  pageCount?: number;
  /** Anchor ids for the pages, so links can target one page; `<section id>-<page number>` by default. */
  pageIds?: string[];
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1, pageIds: undefined });

const sectionIndex = SECTIONS.findIndex((section) => section.id === props.id);
const { title, subtitle } = SECTIONS[sectionIndex];

const pageIds = computed(() =>
  Array.from({ length: props.pageCount }, (_, pageIndex) => props.pageIds?.[pageIndex] ?? `${props.id}-${pageIndex + 1}`),
);

const sectionRef = useTemplateRef<HTMLElement>('section');
const headerRef = useTemplateRef<HTMLElement>('header');
// Indexed by page, as refs collected in a v-for don't keep their order
const pageElements: HTMLElement[] = [];

const isInViewport = useIsInViewport(sectionRef);
const { currentPageIndex, settledPageIndex } = useCurrentPage({
  getHeader: () => headerRef.value,
  // Elements past the page count remain from before the section lost pages
  getPages: () => pageElements.slice(0, props.pageCount),
});

/**
 * Stores a page's element as it mounts.
 *
 * @param element The page element, or null as it unmounts.
 * @param pageIndex The page's index.
 */
function setPageElement(element: unknown, pageIndex: number) {
  if (element instanceof HTMLElement) {
    pageElements[pageIndex] = element;
  }
}

let headerResizeObserver: ResizeObserver | undefined;

/**
 * Keeps `--header-height` equal to the pinned header's height, which varies with the screen and how the subtitle
 * wraps. The pages are sized and snap by it.
 */
function trackHeaderHeight() {
  if (!sectionRef.value || !headerRef.value) {
    throw new Error('PinnedSection needs its section and header mounted');
  }
  const section = sectionRef.value;
  headerResizeObserver = new ResizeObserver(([entry]) => {
    section.style.setProperty('--header-height', `${entry.borderBoxSize[0].blockSize}px`);
  });
  headerResizeObserver.observe(headerRef.value);
}

onMounted(trackHeaderHeight);
onUnmounted(() => headerResizeObserver?.disconnect());
</script>

<template>
  <section :id="props.id" ref="section" class="pinned-section">
    <div ref="header" class="header">
      <div class="column">
        <SectionTitle :index="sectionIndex + 1" :title="title" :subtitle="subtitle">
          <!-- Only with several pages, so a single page's title keeps no empty row for it -->
          <template v-if="props.pageCount > 1" #default>
            <PageIndicator :label="`${title} pages`" :page-ids="pageIds" :current-page-index="currentPageIndex" />
          </template>
        </SectionTitle>
      </div>
    </div>
    <!-- Pages other than the current one are inert, so focus never lands on one half hidden under the title -->
    <div v-for="(pageId, pageIndex) in pageIds" :id="props.pageCount > 1 ? pageId : undefined" :key="pageId"
      :ref="(element) => setPageElement(element, pageIndex)" class="page column" data-slide
      :inert="pageIndex !== currentPageIndex">
      <slot :page="pageIndex" :active="isInViewport && pageIndex === settledPageIndex" />
    </div>
  </section>
</template>

<style scoped>
@import "../../styles/media.css";

.pinned-section {
  /*
   * On screens taller than 16:10 the extra height goes above and below each page rather than stretching it. The
   * root font size follows min(vw, vh), so a height in rem caps the page's aspect ratio.
   */
  --letterbox: max(0px, (100svh - 68rem) / 2);
  /* A first guess until trackHeaderHeight measures it */
  --header-height: 14rem;
  --header-gap: clamp(1.25rem, 3vh, 2.5rem);
  --page-end-space: clamp(1.5rem, 4vh, 3rem);
  --page-height: calc(100svh - var(--header-height));
  width: 100%;
  /*
   * The header sticks only within the section's content box, which the last page's negative margin ends where
   * that page begins. So on the last page the title moves with it, and sections move on as whole blocks. This
   * padding gives the section back the height the margin takes.
   */
  padding-bottom: var(--page-height);
}

.column {
  max-width: var(--content-width);
  margin: 0 auto;
  padding-inline: var(--gutter);
}

/* Opaque, so the pages scroll up out of sight beneath it */
.header {
  position: sticky;
  top: 0;
  z-index: 1;
  padding-top: calc(var(--nav-height) + 1rem + var(--letterbox));
  padding-bottom: var(--header-gap);
  background-color: var(--neutral-950);
}

/*
 * A size container named `page`, so content can drop details on short pages whatever the screen, with
 * `@container page (height < …)`. In development, lib/fitCheck warns about pages whose content doesn't fit.
 */
.page {
  container: page / size;
  height: var(--page-height);
  padding-bottom: calc(var(--page-end-space) + var(--letterbox));
  scroll-snap-align: start;
  scroll-snap-stop: always;
  scroll-margin-top: var(--header-height);
}

.page:last-child {
  margin-bottom: calc(-1 * var(--page-height));
}

@media (--below-sm) {
  .pinned-section {
    --header-gap: 0.875rem;
    --page-end-space: 1rem;
  }
}

@media (--short) {
  .pinned-section {
    --header-gap: 0.75rem;
    --page-end-space: 0.75rem;
  }

  .header {
    padding-top: calc(var(--nav-height) + 0.5rem);
  }
}
</style>
