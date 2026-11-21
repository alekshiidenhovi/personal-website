import { prefersReducedMotion } from '../lib/motion';
import { getSnapScrollTop, jumpToScrollTop } from '../lib/scroll';
import { getSlideScrollTops } from '../lib/slides';
import { useEventListener } from './useEventListener';
import type { ScrollerGetter } from './useSlideshowScroller';

/** How long to wait for `scrollend` before treating a smooth scroll as finished, for browsers without it. */
const SCROLL_END_FALLBACK_MS = 900;
/** How close a slide's offset may be to the current one to count as the current slide, in pixels. */
const SAME_SLIDE_TOLERANCE_PX = 2;

const NEXT_SLIDE_KEYS = new Set(['ArrowDown', 'ArrowRight', 'PageDown']);
const PREVIOUS_SLIDE_KEYS = new Set(['ArrowUp', 'ArrowLeft', 'PageUp']);

/** Where a key press moves in the slideshow. */
type SlideCommand = 'next' | 'previous' | 'first' | 'last';

/**
 * Checks whether keyboard input on an element is meant for typing rather than for navigating.
 *
 * @param target The event's target.
 * @returns Whether the target accepts text input.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * Checks whether an element is activated by the space bar, which must then be left to it.
 *
 * @param target The event's target.
 * @returns Whether the target is a button or a link.
 */
function isActivatedBySpace(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && ['BUTTON', 'A'].includes(target.tagName);
}

/**
 * Gets the slideshow command for a key press.
 *
 * @param event The key press.
 * @returns The command, or undefined when the key isn't for the slideshow.
 */
function getSlideCommand(event: KeyboardEvent): SlideCommand | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return undefined;
  }
  const isSpace = event.key === ' ' && !isActivatedBySpace(event.target);
  if (NEXT_SLIDE_KEYS.has(event.key) || (isSpace && !event.shiftKey)) {
    return 'next';
  }
  if (PREVIOUS_SLIDE_KEYS.has(event.key) || (isSpace && event.shiftKey)) {
    return 'previous';
  }
  if (event.key === 'Home') {
    return 'first';
  }
  if (event.key === 'End') {
    return 'last';
  }
  return undefined;
}

/**
 * Gets the scroll offset a slideshow command moves to.
 *
 * @param command The command.
 * @param scroller The scroll container.
 * @returns The target offset, or undefined when there is no slide in that direction.
 */
function getCommandScrollTop(command: SlideCommand, scroller: HTMLElement): number | undefined {
  const slideScrollTops = getSlideScrollTops(scroller);
  const current = scroller.scrollTop;
  switch (command) {
    case 'next':
      return slideScrollTops.find((top) => top > current + SAME_SLIDE_TOLERANCE_PX);
    case 'previous':
      return slideScrollTops.findLast((top) => top < current - SAME_SLIDE_TOLERANCE_PX);
    case 'first':
      return slideScrollTops.at(0);
    case 'last':
      return slideScrollTops.at(-1);
    default:
      throw new Error(`Unknown slide command: ${command satisfies never}`);
  }
}

/**
 * Gets the in-page link a click landed on, with the element it points to.
 *
 * @param event The click.
 * @param scroller The scroll container, which in-page link targets must be in.
 * @returns The link and its target, or undefined when the click isn't a plain click on an in-page link.
 */
function getInPageLinkClick(
  event: MouseEvent,
  scroller: HTMLElement,
): { link: HTMLAnchorElement; target: Element } | undefined {
  const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (!isPlainClick || !(event.target instanceof Element)) {
    return undefined;
  }
  const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
  const target = link?.hash && scroller.querySelector(`#${CSS.escape(link.hash.slice(1))}`);
  return link && target ? { link, target } : undefined;
}

/**
 * Adds keyboard and link navigation on top of the page's native scrolling.
 *
 * Scrolling by finger, trackpad or wheel stays the browser's own, with snapping settling on a whole slide. The
 * arrow keys, Page Up/Down and Space move exactly one slide, scrolling smoothly; Home and End go to the first
 * and last slide. In-page links crossfade straight to their target, unless marked `data-scroll` to scroll
 * there instead. Moves farther than one screen always crossfade, so they never render every slide on the way.
 *
 * @param getScroller Returns the scroll container.
 */
export function useSlideNavigation(getScroller: ScrollerGetter) {
  let isMoving = false;

  /**
   * Smoothly scrolls to an offset, and marks the slideshow as moving until the scroll ends.
   *
   * @param scroller The scroll container.
   * @param top The offset to scroll to.
   */
  function scrollSmoothly(scroller: HTMLElement, top: number) {
    /** Marks the slideshow as no longer moving, on `scrollend` or the fallback timeout, whichever comes first. */
    function finishScroll() {
      clearTimeout(fallbackTimer);
      scroller.removeEventListener('scrollend', finishScroll);
      isMoving = false;
    }

    isMoving = true;
    const fallbackTimer = setTimeout(finishScroll, SCROLL_END_FALLBACK_MS);
    scroller.addEventListener('scrollend', finishScroll, { once: true });
    scroller.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * Moves to a scroll offset: crossfading for a jump or a move farther than one screen, scrolling otherwise.
   *
   * @param top The offset to move to.
   * @param isJump Whether to crossfade however near the offset is.
   */
  function moveTo(top: number, isJump: boolean) {
    const scroller = getScroller();
    const isFar = Math.abs(top - scroller.scrollTop) > scroller.clientHeight + SAME_SLIDE_TOLERANCE_PX;
    if (isJump || isFar) {
      isMoving = true;
      void jumpToScrollTop(scroller, top).finally(() => {
        isMoving = false;
      });
    } else if (prefersReducedMotion) {
      scroller.scrollTo({ top, behavior: 'instant' });
    } else {
      scrollSmoothly(scroller, top);
    }
  }

  /**
   * Runs the slideshow command for a key press, unless the key is meant for typing or an open dialog.
   *
   * @param event The key press.
   */
  function handleKeyDown(event: KeyboardEvent) {
    const command = getSlideCommand(event);
    if (!command || isTypingTarget(event.target) || document.querySelector('dialog[open]')) {
      return;
    }
    event.preventDefault();
    if (isMoving) {
      return;
    }
    const top = getCommandScrollTop(command, getScroller());
    if (top !== undefined) {
      moveTo(top, false);
    }
  }

  /**
   * Moves to the target of a clicked in-page link and records it in the history.
   *
   * @param event The click.
   */
  function handleLinkClick(event: MouseEvent) {
    const scroller = getScroller();
    const click = getInPageLinkClick(event, scroller);
    if (!click) {
      return;
    }
    event.preventDefault();
    if (isMoving) {
      return;
    }
    history.pushState(null, '', `#${click.target.id}`);
    moveTo(getSnapScrollTop(scroller, click.target), !click.link.hasAttribute('data-scroll'));
  }

  useEventListener(window, 'keydown', handleKeyDown);
  useEventListener(document, 'click', handleLinkClick);
}
