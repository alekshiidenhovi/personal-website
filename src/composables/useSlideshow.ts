import { onMounted, onUnmounted } from "vue";
import { PINNED_LAYOUT_QUERY, SLIDE_ATTRIBUTE } from "../lib/layout";

/** Wheel deltas below this are treated as jitter */
const MIN_WHEEL_DELTA = 4;
/** Wheel events must pause this long before another gesture counts, which swallows trackpad momentum */
const WHEEL_QUIET_MS = 180;
/** Fallback for browsers without the `scrollend` event */
const SCROLL_END_FALLBACK_MS = 900;
/** Positions this close to the current scroll count as the current slide */
const POSITION_TOLERANCE_PX = 2;

const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight", "PageDown"]);
const PREVIOUS_KEYS = new Set(["ArrowUp", "ArrowLeft", "PageUp"]);

type Direction = 1 | -1;

/**
 * Slideshow navigation for the pinned layout: each wheel gesture or arrow key
 * moves exactly one slide (any element marked with `data-slide`) forwards or
 * backwards. Narrow screens keep normal scrolling.
 */
export function useSlideshow() {
  let pinnedMedia: MediaQueryList | null = null;
  let isAnimating = false;
  let isWheelQuiet = true;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;

  const isLocked = () => isAnimating || !isWheelQuiet;

  const slidePositions = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const positions = [...document.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)].map((slide) =>
      Math.min(Math.round(slide.getBoundingClientRect().top + window.scrollY), maxScroll),
    );
    return [...new Set(positions)].sort((a, b) => a - b);
  };

  const scrollTo = (top: number) => {
    isAnimating = true;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("scrollend", finish);
      isAnimating = false;
    };
    const fallbackTimer = setTimeout(finish, SCROLL_END_FALLBACK_MS);
    window.addEventListener("scrollend", finish, { once: true });
    window.scrollTo({ top, behavior: prefersReducedMotion ? "instant" : "smooth" });
  };

  const goTo = (direction: Direction) => {
    const current = window.scrollY;
    const positions = slidePositions();
    const target =
      direction === 1
        ? positions.find((position) => position > current + POSITION_TOLERANCE_PX)
        : [...positions].reverse().find((position) => position < current - POSITION_TOLERANCE_PX);
    if (target !== undefined) scrollTo(target);
  };

  const goToEdge = (edge: "first" | "last") => {
    const positions = slidePositions();
    scrollTo(edge === "first" ? positions[0] : positions[positions.length - 1]);
  };

  const onWheel = (event: WheelEvent) => {
    if (!pinnedMedia?.matches || event.ctrlKey) return;
    event.preventDefault();

    const wasLocked = isLocked();
    isWheelQuiet = false;
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      isWheelQuiet = true;
    }, WHEEL_QUIET_MS);
    if (wasLocked) return;

    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < MIN_WHEEL_DELTA) return;
    goTo(delta > 0 ? 1 : -1);
  };

  const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

  // Space activates focused buttons and links, so leave it to them
  const isActivatableTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && ["BUTTON", "A"].includes(target.tagName);

  const onKeyDown = (event: KeyboardEvent) => {
    if (!pinnedMedia?.matches || event.altKey || event.ctrlKey || event.metaKey) return;
    if (isTypingTarget(event.target)) return;

    const isSpace = event.key === " " && !isActivatableTarget(event.target);
    const isNext = NEXT_KEYS.has(event.key) || (isSpace && !event.shiftKey);
    const isPrevious = PREVIOUS_KEYS.has(event.key) || (isSpace && event.shiftKey);
    const isEdge = event.key === "Home" || event.key === "End";
    if (!isNext && !isPrevious && !isEdge) return;

    event.preventDefault();
    if (isAnimating) return;
    if (isEdge) goToEdge(event.key === "Home" ? "first" : "last");
    else goTo(isNext ? 1 : -1);
  };

  onMounted(() => {
    pinnedMedia = window.matchMedia(PINNED_LAYOUT_QUERY);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
  });

  onUnmounted(() => {
    clearTimeout(quietTimer);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
  });
}
