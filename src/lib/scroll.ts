import { getScroller } from "./layout";
import { prefersReducedMotion } from "./motion";

/**
 * Where the scroller rests with an element at its snap position: the element's
 * top edge less its scroll margin (pages snap below their section's title), as
 * far as the scroller can go
 */
export function scrollPositionOf(element: Element) {
  const scroller = getScroller();
  const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
  const top = Math.round(element.getBoundingClientRect().top + scroller.scrollTop - margin);
  return Math.min(top, scroller.scrollHeight - scroller.clientHeight);
}

/**
 * Cuts straight to a scroll position, crossfading where the browser supports
 * view transitions, so a jump never renders every slide on the way. Instant
 * with reduced motion or without view transitions. Resolves once it is done.
 */
export function jumpTo(top: number): Promise<void> {
  const cut = () => getScroller().scrollTo({ top, behavior: "instant" });
  if (prefersReducedMotion || !document.startViewTransition) {
    cut();
    return Promise.resolve();
  }
  return document.startViewTransition(cut).finished;
}
