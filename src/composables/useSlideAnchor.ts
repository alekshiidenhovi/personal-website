import { useEventListener } from "@vueuse/core";
import { onMounted, onUnmounted } from "vue";
import { getScroller, SLIDE_ATTRIBUTE } from "../lib/layout";
import { scrollPositionOf } from "../lib/scroll";

/**
 * A slide stop by its section and page. Unlike a scroll offset or the stop
 * element itself, it outlives any change of layout.
 */
interface Anchor {
  section: string;
  page: number;
}

const STORAGE_KEY = "slide-anchor";
/** How long scrolling must pause to count as settled */
const SETTLE_MS = 150;
/** Scrolling that settles this soon after a layout change is the browser adjusting to it, not the reader moving */
const LAYOUT_SETTLE_MS = 500;

/** A section's stops in page order; the hero is a stop itself */
const stopsOf = (section: Element) =>
  section.matches(`[${SLIDE_ATTRIBUTE}]`) ? [section] : [...section.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)];

/** The stop nearest the current scroll position */
const currentAnchor = (): Anchor | null => {
  const scrollTop = getScroller().scrollTop;
  let nearest: { anchor: Anchor; distance: number } | null = null;
  for (const stop of document.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)) {
    const section = stop.closest("section[id]");
    if (!section) continue;
    const distance = Math.abs(scrollPositionOf(stop) - scrollTop);
    if (!nearest || distance < nearest.distance) {
      nearest = { anchor: { section: section.id, page: stopsOf(section).indexOf(stop) }, distance };
    }
  }
  return nearest?.anchor ?? null;
};

/** Cuts to the anchor's stop; a page that no longer exists, such as when fewer pages fit, falls back to the section's last */
const scrollToAnchor = (anchor: Anchor) => {
  const section = document.getElementById(anchor.section);
  if (!section) return;
  const stops = stopsOf(section);
  const stop = stops[Math.min(anchor.page, stops.length - 1)];
  if (!stop) return;
  const scroller = getScroller();
  const top = scrollPositionOf(stop);
  if (Math.abs(scroller.scrollTop - top) > 1) scroller.scrollTo({ top, behavior: "instant" });
};

const readSaved = (): Anchor | null => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Anchor) : null;
  } catch {
    // Storage can be unavailable, such as in some private windows
    return null;
  }
};

/**
 * Keeps the reader on the same slide whatever changes the layout: rotating a
 * tablet, resizing the window, or a section gaining or losing pages. Slides
 * are sized to the screen, so a layout change moves every stop, and browsers
 * differ in following it: Safari keeps the old scroll offset, which can land
 * slides away or at the very end. So the slide scrolling last settled on is
 * remembered, by section and page, and scrolled back to after every change.
 *
 * The same anchor survives reloads and back/forward navigation, which the
 * browser can't restore itself as the page scrolls in an inner scroller (see
 * getScroller). A fresh visit starts at the top, or at the link's anchor, as
 * usual. Call once, from the root component.
 */
export function useSlideAnchor() {
  let anchor: Anchor | null = null;
  let lastLayoutChange = -Infinity;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let resizeObserver: ResizeObserver | null = null;

  const onScroll = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      // Once there is a slide to keep, the browser's own adjustment to a layout change must not replace it
      if (anchor && performance.now() - lastLayoutChange < LAYOUT_SETTLE_MS) return;
      anchor = currentAnchor();
    }, SETTLE_MS);
  };

  // Every size change of the viewport or the content, including the first report when observing starts
  const onLayoutChange = () => {
    lastLayoutChange = performance.now();
    if (anchor) scrollToAnchor(anchor);
  };

  const save = () => {
    try {
      const current = anchor ?? currentAnchor();
      if (current) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage can be unavailable; the page then starts at the top
    }
  };

  onMounted(() => {
    const scroller = getScroller();
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navigation?.type === "reload" || navigation?.type === "back_forward") {
      anchor = readSaved();
      if (anchor) scrollToAnchor(anchor);
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    resizeObserver = new ResizeObserver(onLayoutChange);
    resizeObserver.observe(scroller);
    for (const child of scroller.children) resizeObserver.observe(child);
  });

  onUnmounted(() => {
    getScroller()?.removeEventListener("scroll", onScroll);
    resizeObserver?.disconnect();
    clearTimeout(settleTimer);
  });

  // pagehide alone isn't reliable on iOS, which can discard a backgrounded page without it
  useEventListener(window, "pagehide", save);
  useEventListener(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
}
