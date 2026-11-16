import { onMounted, onUnmounted, readonly, ref } from "vue";
import { PAGE_ATTRIBUTE, PINNED_CLASS, PINNED_LAYOUT_QUERY } from "../lib/layout";

/** Leeway before a page counts as overflowing, for subpixel rounding */
const OVERFLOW_TOLERANCE_PX = 2;
/** On the root while measuring, so trying a layout never starts its transitions */
const MEASURING_CLASS = "measuring-layout";

const isPinned = ref(false);

/** Whether the pinned layout is on; shared by every component that depends on it */
export const pinnedLayout = readonly(isPinned);

/**
 * The vertical extent of what can be seen of an element's content. An element
 * that clips its overflow, like a card or an SVG, counts as its own box, as
 * whatever reaches past it is hidden anyway.
 */
const visibleExtent = (parent: Element, extent = { top: Number.POSITIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY }) => {
  for (const element of parent.children) {
    const rect = element.getBoundingClientRect();
    if (rect.height) {
      extent.top = Math.min(extent.top, rect.top);
      extent.bottom = Math.max(extent.bottom, rect.bottom);
    }
    if (element.children.length && getComputedStyle(element).overflowY === "visible") visibleExtent(element, extent);
  }
  return extent;
};

/**
 * Whether any page's content is taller than its box. Heights are compared
 * rather than positions, as pages waiting to slide in are offset.
 */
const anyPageOverflows = () =>
  [...document.querySelectorAll<HTMLElement>(`[${PAGE_ATTRIBUTE}]`)].some((page) => {
    const { top, bottom } = visibleExtent(page);
    return bottom - top > page.getBoundingClientRect().height + OVERFLOW_TOLERANCE_PX;
  });

/**
 * Tries the pinned layout and keeps it only if every page fits, falling back
 * to the stacked, scrolling layout. Measuring forces layout synchronously, so
 * nothing paints in between. Screens outside the query skip measuring, so
 * phones, whose toolbars resize the viewport while scrolling, do no work here.
 */
const update = () => {
  const fitsQuery = window.matchMedia(PINNED_LAYOUT_QUERY).matches;
  if (!fitsQuery && !isPinned.value) return;

  const root = document.documentElement;
  root.classList.add(MEASURING_CLASS);
  root.classList.toggle(PINNED_CLASS, fitsQuery);
  if (root.classList.contains(PINNED_CLASS) && anyPageOverflows()) root.classList.remove(PINNED_CLASS);
  // Apply the result before transitions come back, so it doesn't animate in
  root.getBoundingClientRect();
  root.classList.remove(MEASURING_CLASS);
  isPinned.value = root.classList.contains(PINNED_CLASS);
};

/**
 * Picks the layout once the page has mounted, then again whenever the space or
 * the content's size can change: resizes, rotation and fonts loading. Call
 * once, from the root component.
 */
export function usePinnedLayout() {
  let frameId = 0;
  const scheduleUpdate = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(update);
  };

  onMounted(() => {
    update();
    window.addEventListener("resize", scheduleUpdate);
    document.fonts.addEventListener("loadingdone", scheduleUpdate);
    document.fonts.ready.then(scheduleUpdate);
  });

  onUnmounted(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", scheduleUpdate);
    document.fonts.removeEventListener("loadingdone", scheduleUpdate);
  });
}
