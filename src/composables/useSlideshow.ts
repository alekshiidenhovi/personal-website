import { useEventListener, useMediaQuery } from "@vueuse/core";
import { onUnmounted, watch } from "vue";
import { FINE_POINTER_QUERY, SLIDE_ATTRIBUTE } from "../lib/layout";
import { prefersReducedMotion } from "../lib/motion";
import { jumpTo } from "../lib/scroll";

/*
 * Wheel gestures: trackpad swipes ramp up from tiny deltas and trail off in a
 * long momentum tail, so a gesture moves one slide once its accumulated
 * distance passes a threshold, and the rest of it, momentum included, is
 * swallowed. A pause, a change of direction, or deltas rising again after
 * they started to decay (a fresh swipe over the momentum) start a new gesture.
 */
/** Accumulated distance in pixels that moves one slide */
const WHEEL_THRESHOLD_PX = 24;
/** A pause this long ends the gesture */
const WHEEL_QUIET_MS = 180;
/** Deltas below this share of the gesture's peak mean it is decaying into momentum */
const WHEEL_DECAY_RATIO = 0.6;
/** While decaying, a delta this much larger than the previous one is a new swipe */
const WHEEL_RISE_RATIO = 1.5;
const WHEEL_RISE_MIN_PX = 6;
/** Pixels per line for wheels that report in lines */
const WHEEL_LINE_PX = 16;
/** Fallback for browsers without the `scrollend` event */
const SCROLL_END_FALLBACK_MS = 900;
/** Positions this close to the current scroll count as the current slide */
const POSITION_TOLERANCE_PX = 2;
/** Moves longer than this many viewport heights cut to the target instead of scrolling past the slides between */
const MAX_SCROLL_VIEWPORTS = 1;

const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight", "PageDown"]);
const PREVIOUS_KEYS = new Set(["ArrowUp", "ArrowLeft", "PageUp"]);

type Direction = 1 | -1;

/**
 * Slideshow navigation on top of the page's native snapping.
 *
 * With a mouse or trackpad, each wheel gesture or arrow key moves exactly one
 * slide (any element marked with `data-slide`) forwards or backwards, scrolling
 * smoothly; Home/End crossfade once the target is more than a slide away.
 * Touch screens scroll natively, where snapping alone settles on whole slides.
 *
 * On every device, in-page links crossfade straight to their target, however
 * near, unless marked `data-scroll` to scroll there instead. Call once, from
 * the root component.
 */
export function useSlideshow() {
  let isAnimating = false;
  let gesture: { distance: number; peak: number; isDecaying: boolean; hasMoved: boolean } | null = null;
  let lastWheelMagnitude = 0;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;

  const slidePositions = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const positions = [...document.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)].map((slide) =>
      Math.min(Math.round(slide.getBoundingClientRect().top + window.scrollY), maxScroll),
    );
    return [...new Set(positions)].sort((a, b) => a - b);
  };

  /** Scrolls to a position; a jump, or a move farther than a slide, crossfades instead of scrolling */
  const scrollTo = (top: number, isJump = false) => {
    const isFar =
      isJump || Math.abs(top - window.scrollY) > MAX_SCROLL_VIEWPORTS * window.innerHeight + POSITION_TOLERANCE_PX;
    if (isFar) {
      isAnimating = true;
      jumpTo(top).finally(() => {
        isAnimating = false;
      });
      return;
    }
    if (prefersReducedMotion) {
      window.scrollTo({ top, behavior: "instant" });
      return;
    }

    isAnimating = true;
    const finish = () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("scrollend", finish);
      isAnimating = false;
    };
    const fallbackTimer = setTimeout(finish, SCROLL_END_FALLBACK_MS);
    window.addEventListener("scrollend", finish, { once: true });
    window.scrollTo({ top, behavior: "smooth" });
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
    if (event.ctrlKey) return;
    event.preventDefault();

    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      gesture = null;
    }, WHEEL_QUIET_MS);

    const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    const unit = { [WheelEvent.DOM_DELTA_LINE]: WHEEL_LINE_PX, [WheelEvent.DOM_DELTA_PAGE]: window.innerHeight }[event.deltaMode] ?? 1;
    const delta = rawDelta * unit;
    const magnitude = Math.abs(delta);
    if (!magnitude) return;

    const isReversed = gesture !== null && Math.sign(delta) !== Math.sign(gesture.distance);
    const isFreshSwipe =
      gesture?.isDecaying &&
      magnitude >= lastWheelMagnitude * WHEEL_RISE_RATIO &&
      magnitude - lastWheelMagnitude >= WHEEL_RISE_MIN_PX;
    if (!gesture || isReversed || isFreshSwipe) gesture = { distance: 0, peak: 0, isDecaying: false, hasMoved: false };
    lastWheelMagnitude = magnitude;

    gesture.distance += delta;
    gesture.peak = Math.max(gesture.peak, magnitude);
    if (magnitude < gesture.peak * WHEEL_DECAY_RATIO) gesture.isDecaying = true;

    if (gesture.hasMoved || Math.abs(gesture.distance) < WHEEL_THRESHOLD_PX) return;
    // A gesture reaching the threshold mid-animation is swallowed rather than queued
    gesture.hasMoved = true;
    if (!isAnimating) goTo(delta > 0 ? 1 : -1);
  };

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    const id = link?.hash.slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    if (isAnimating) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    history.pushState(null, "", `#${id}`);
    // A click jumps, so it crossfades even to the neighboring slide, unless the link asks to scroll
    scrollTo(Math.min(target.getBoundingClientRect().top + window.scrollY, maxScroll), !link?.hasAttribute("data-scroll"));
  };

  const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

  // Space activates focused buttons and links, so leave it to them
  const isActivatableTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && ["BUTTON", "A"].includes(target.tagName);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
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

  useEventListener(document, "click", onClick);

  // Wheel and keys only with a mouse or trackpad; touch screens keep their native scrolling
  const attach = () => {
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
  };

  const detach = () => {
    clearTimeout(quietTimer);
    gesture = null;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
  };

  watch(useMediaQuery(FINE_POINTER_QUERY), (hasFinePointer) => (hasFinePointer ? attach() : detach()), {
    immediate: true,
  });
  onUnmounted(detach);
}
