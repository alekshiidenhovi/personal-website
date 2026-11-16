import { useEventListener } from "@vueuse/core";
import { onMounted } from "vue";
import { getScroller } from "../lib/layout";

const STORAGE_KEY = "scroll-position";

/**
 * Keeps the scroll position across reloads and back/forward navigation.
 * Browsers only restore the document's own scroll position, and the page
 * scrolls in an inner scroller (see getScroller), so it is saved when the page
 * is hidden and restored on the way back. A fresh visit starts at the top, or
 * at the link's anchor, as usual. Call once, from the root component.
 */
export function useScrollRestoration() {
  const save = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, String(getScroller().scrollTop));
    } catch {
      // Storage can be unavailable, such as in some private windows; the page then starts at the top
    }
  };

  onMounted(() => {
    const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navigation?.type !== "reload" && navigation?.type !== "back_forward") return;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (saved !== null) getScroller().scrollTo({ top: Number(saved), behavior: "instant" });
  });

  // pagehide alone isn't reliable on iOS, which can discard a backgrounded page without it
  useEventListener(window, "pagehide", save);
  useEventListener(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
}
