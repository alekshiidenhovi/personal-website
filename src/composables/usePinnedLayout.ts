import { onMounted, onUnmounted, readonly, ref } from "vue";
import { PINNED_CLASS, PINNED_LAYOUT_QUERY } from "../lib/layout";

/** On the root while switching, so the switch never starts transitions */
const SWITCHING_CLASS = "switching-layout";

const isPinned = ref(false);

/** Whether the pinned layout is on; shared by every component that depends on it */
export const pinnedLayout = readonly(isPinned);

/** The section crossing the middle of the viewport */
const sectionInView = () => {
  const middle = window.innerHeight / 2;
  return [...document.querySelectorAll("main > section[id]")].find((section) => {
    const { top, bottom } = section.getBoundingClientRect();
    return top <= middle && bottom > middle;
  });
};

/*
 * The two layouts place sections at different heights, so a switch (a resized
 * window) returns to the section that was on screen rather than keeping the
 * scroll position. It is remembered on scroll, as the resize has already moved
 * things by the time the media query reports the switch.
 */
let lastSection: Element | undefined;
const rememberSection = () => {
  lastSection = sectionInView() ?? lastSection;
};

/** Applies the layout the media query picks */
const apply = (matches: boolean, section?: Element) => {
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
  const onChange = (event: MediaQueryListEvent) => apply(event.matches, lastSection);

  onMounted(() => {
    apply(query.matches);
    rememberSection();
    query.addEventListener("change", onChange);
    window.addEventListener("scroll", rememberSection, { passive: true });
  });

  onUnmounted(() => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("scroll", rememberSection);
  });
}
