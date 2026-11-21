import { onMounted, onUnmounted } from 'vue';
import { getSnapScrollTop, SCROLL_SETTLE_MS } from '../lib/scroll';
import { tryReadSlidePosition, tryStoreSlidePosition } from '../lib/slidePositionStorage';
import { findNearestSlidePosition, findSlide, type SlidePosition } from '../lib/slides';
import { useEventListener } from './useEventListener';
import type { ScrollerGetter } from './useSlideshowScroller';

/** How long after a layout change scrolling counts as the browser adjusting to it rather than the reader moving. */
const LAYOUT_ADJUSTMENT_MS = 500;

/**
 * Checks whether the page was loaded by a reload or by back/forward navigation, when the reader expects to
 * return to where they were rather than start from the top.
 *
 * @returns Whether the page load returns to an earlier visit.
 */
function isReturningNavigation(): boolean {
  const [navigation] = performance.getEntriesByType('navigation');
  return (
    navigation instanceof PerformanceNavigationTiming &&
    (navigation.type === 'reload' || navigation.type === 'back_forward')
  );
}

/**
 * Scrolls instantly to a slide, unless the scroller is already there.
 *
 * @param scroller The scroll container.
 * @param position The slide to scroll to.
 */
function scrollToSlidePosition(scroller: HTMLElement, position: SlidePosition) {
  const slide = findSlide(scroller, position);
  if (!slide) {
    return;
  }
  const top = getSnapScrollTop(scroller, slide);
  if (Math.abs(scroller.scrollTop - top) > 1) {
    scroller.scrollTo({ top, behavior: 'instant' });
  }
}

/**
 * Keeps the reader on the same slide whatever changes the layout: rotating a tablet, resizing the window, or a
 * section gaining or losing pages. Slides are sized to the screen, so a layout change moves every slide, and
 * browsers differ in following it: Safari keeps the old scroll offset, which can land slides away. The slide
 * scrolling last settled on is therefore preserved by section and page, and returned to after every change.
 *
 * The preserved slide also survives reloads and back/forward navigation, which the browser can't restore by
 * itself for an inner scroller.
 *
 * @param getScroller Returns the scroll container.
 */
export function usePreservedSlidePosition(getScroller: ScrollerGetter) {
  let preservedPosition: SlidePosition | undefined;
  let lastLayoutChangeTime = Number.NEGATIVE_INFINITY;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let resizeObserver: ResizeObserver | undefined;

  /** Preserves the slide the reader scrolled to, once scrolling has settled. */
  function preserveSettledSlide() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const isAdjustingToLayout = performance.now() - lastLayoutChangeTime < LAYOUT_ADJUSTMENT_MS;
      // The browser's own scrolling after a layout change must not replace the slide being kept
      if (preservedPosition && isAdjustingToLayout) {
        return;
      }
      preservedPosition = findNearestSlidePosition(getScroller());
    }, SCROLL_SETTLE_MS);
  }

  /** Returns to the preserved slide after the viewport or the content changed size. */
  function restoreSlideAfterLayoutChange() {
    lastLayoutChangeTime = performance.now();
    if (preservedPosition) {
      scrollToSlidePosition(getScroller(), preservedPosition);
    }
  }

  /** Stores the current slide, so a reload or back navigation returns to it. */
  function storeCurrentSlide() {
    const position = preservedPosition ?? findNearestSlidePosition(getScroller());
    if (position) {
      tryStoreSlidePosition(position);
    }
  }

  onMounted(() => {
    const scroller = getScroller();
    if (isReturningNavigation()) {
      preservedPosition = tryReadSlidePosition();
      if (preservedPosition) {
        scrollToSlidePosition(scroller, preservedPosition);
      }
    }
    resizeObserver = new ResizeObserver(restoreSlideAfterLayoutChange);
    resizeObserver.observe(scroller);
    for (const child of scroller.children) {
      resizeObserver.observe(child);
    }
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    clearTimeout(settleTimer);
  });

  useEventListener(getScroller, 'scroll', preserveSettledSlide, { passive: true });
  // pagehide alone isn't reliable on iOS, which can discard a backgrounded page without firing it
  useEventListener(window, 'pagehide', storeCurrentSlide);
  useEventListener(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      storeCurrentSlide();
    }
  });
}
