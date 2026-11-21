import { prefersReducedMotion } from './motion';

/** How long scrolling must pause before it counts as settled, in milliseconds. */
export const SCROLL_SETTLE_MS = 150;

/**
 * Gets the scroll offset at which an element rests at its snap position.
 *
 * @param scroller The scroll container.
 * @param element An element inside the scroller.
 * @returns The element's top edge less its scroll margin, capped at the scroller's furthest offset.
 */
export function getSnapScrollTop(scroller: HTMLElement, element: Element): number {
  const scrollMargin = Number(getComputedStyle(element).scrollMarginTop.replace(/px$/, ''));
  if (Number.isNaN(scrollMargin)) {
    throw new Error(`Unexpected scroll margin on ${element.tagName}`);
  }
  const top = Math.round(element.getBoundingClientRect().top + scroller.scrollTop - scrollMargin);
  return Math.min(top, scroller.scrollHeight - scroller.clientHeight);
}

/**
 * Cuts straight to a scroll offset, crossfading where view transitions are supported, so a long jump never
 * renders every slide on the way. Cuts instantly with reduced motion or without view transitions.
 *
 * @param scroller The scroll container.
 * @param top The scroll offset to jump to.
 * @returns A promise that resolves once the jump has finished.
 */
export function jumpToScrollTop(scroller: HTMLElement, top: number): Promise<void> {
  /** Moves the scroller to the offset at once. */
  function cutToTop() {
    scroller.scrollTo({ top, behavior: 'instant' });
  }

  if (prefersReducedMotion || !document.startViewTransition) {
    cutToTop();
    return Promise.resolve();
  }
  return document.startViewTransition(cutToTop).finished;
}
