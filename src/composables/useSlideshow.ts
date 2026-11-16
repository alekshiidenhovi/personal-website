import { useEventListener } from "@vueuse/core";
import { SLIDE_ATTRIBUTE } from "../lib/layout";
import { prefersReducedMotion } from "../lib/motion";
import { jumpTo } from "../lib/scroll";

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
 * Keyboard and link navigation on top of the page's native scrolling.
 *
 * Scrolling itself, by finger, trackpad or wheel, is the browser's own, so the
 * slides follow it continuously and snapping settles on a whole slide. On top
 * of that, the arrow keys, Page Up/Down and Space move exactly one slide (any
 * element marked with `data-slide`) forwards or backwards, scrolling smoothly
 * to the next snap stop; Home/End crossfade once the target is more than a
 * slide away. In-page links crossfade straight to their target, however near,
 * unless marked `data-scroll` to scroll there instead. Call once, from the
 * root component.
 */
export function useSlideshow() {
  let isAnimating = false;

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
    // Typing, and keys meant for an open popup, stay with them
    if (isTypingTarget(event.target) || document.querySelector("dialog[open]")) return;

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
  useEventListener(window, "keydown", onKeyDown);
}
