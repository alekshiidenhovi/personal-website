import { prefersReducedMotion } from "./motion";

/**
 * Cuts straight to a scroll position, crossfading where the browser supports
 * view transitions, so a jump never renders every slide on the way. Instant
 * with reduced motion or without view transitions. Resolves once it is done.
 */
export function jumpTo(top: number): Promise<void> {
  const cut = () => window.scrollTo({ top, behavior: "instant" });
  if (prefersReducedMotion || !document.startViewTransition) {
    cut();
    return Promise.resolve();
  }
  return document.startViewTransition(cut).finished;
}
