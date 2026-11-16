import { getScroller } from "./layout";
import { prefersReducedMotion } from "./motion";

/** Where an element's top edge sits in the scroller, as far as the scroller can go */
export function scrollPositionOf(element: Element) {
  const scroller = getScroller();
  const top = Math.round(element.getBoundingClientRect().top + scroller.scrollTop);
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
