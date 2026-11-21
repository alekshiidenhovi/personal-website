import { onUnmounted, type Ref, readonly, ref } from 'vue';
import { clamp } from '../lib/math';
import { SCROLL_SETTLE_MS } from '../lib/scroll';
import { useViewportMeasurement } from './useViewportMeasurement';

/** The elements of a pinned section that its page progress is read from. */
export interface PinnedSectionElements {
  /** Returns the pinned header, which the pages scroll up beneath. */
  getHeader: () => HTMLElement | null;
  /** Returns the page elements, in order. */
  getPages: () => HTMLElement[];
}

/** The page a pinned section shows, now and once scrolling has settled. */
export interface CurrentPage {
  /** The page under the header right now. */
  currentPageIndex: Readonly<Ref<number>>;
  /** The page scrolling last came to rest on. */
  settledPageIndex: Readonly<Ref<number>>;
}

/**
 * Measures how far a pinned section's pages have scrolled up beneath its header.
 *
 * @param header The pinned header.
 * @param pages The page elements, in order.
 * @returns The progress in pages, from 0 at the first page to the last page's index.
 */
function measurePageProgress(header: HTMLElement, pages: HTMLElement[]): number {
  const firstPageTop = pages[0].getBoundingClientRect().top;
  // Measured between pages rather than taken from one page's height, so it matches where they snap
  const pageHeight = pages.length > 1 ? pages[1].getBoundingClientRect().top - firstPageTop : 1;
  const scrolled = header.getBoundingClientRect().bottom - firstPageTop;
  return clamp(scrolled / pageHeight, 0, pages.length - 1);
}

/**
 * Tracks which page of a pinned section is showing. The settled page follows once scrolling pauses, so work
 * started by a page change, such as a visual starting to play, never lands in the middle of a scroll.
 *
 * @param elements The section's header and pages.
 * @returns The current and settled page indexes.
 */
export function useCurrentPage({ getHeader, getPages }: PinnedSectionElements): CurrentPage {
  const currentPageIndex = ref(0);
  const settledPageIndex = ref(0);
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  useViewportMeasurement({
    measure: () => {
      const header = getHeader();
      const pages = getPages();
      return header && pages.length > 0 ? measurePageProgress(header, pages) : undefined;
    },
    apply: (progress) => {
      currentPageIndex.value = Math.round(progress);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        settledPageIndex.value = currentPageIndex.value;
      }, SCROLL_SETTLE_MS);
    },
  });

  onUnmounted(() => clearTimeout(settleTimer));

  return { currentPageIndex: readonly(currentPageIndex), settledPageIndex: readonly(settledPageIndex) };
}
