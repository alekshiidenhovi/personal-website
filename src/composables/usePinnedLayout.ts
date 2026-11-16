import { onMounted, onUnmounted, readonly, ref } from "vue";
import { PINNED_CLASS, PINNED_LAYOUT_QUERY } from "../lib/layout";
import { activeSection } from "./useActiveSection";

/** On the root while switching, so the switch never starts transitions */
const SWITCHING_CLASS = "switching-layout";

const isPinned = ref(false);

/** Whether the pinned layout is on; shared by every component that depends on it */
export const pinnedLayout = readonly(isPinned);

/** Applies the layout the media query picks, scrolling to `section` if given */
const apply = (matches: boolean, section?: Element | null) => {
  const root = document.documentElement;
  root.classList.add(SWITCHING_CLASS);
  root.classList.toggle(PINNED_CLASS, matches);
  section?.scrollIntoView({ behavior: "instant" });
  // Apply the result before transitions come back, so it doesn't animate in
  root.getBoundingClientRect();
  root.classList.remove(SWITCHING_CLASS);
  isPinned.value = matches;
};

/**
 * Turns the pinned layout on while PINNED_LAYOUT_QUERY matches. The query
 * alone decides, so a device always gets the same layout. Call once, from the
 * root component.
 */
export function usePinnedLayout() {
  const query = window.matchMedia(PINNED_LAYOUT_QUERY);
  /*
   * The two layouts place sections at different heights, so a switch (a
   * resized window) returns to the section that was on screen rather than
   * keeping the scroll position. The active section is still the one from
   * before the resize here, as intersection observers report after it.
   */
  const onChange = (event: MediaQueryListEvent) => apply(event.matches, document.getElementById(activeSection.value));

  onMounted(() => {
    apply(query.matches);
    query.addEventListener("change", onChange);
  });

  onUnmounted(() => query.removeEventListener("change", onChange));
}
