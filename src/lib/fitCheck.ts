import { getSlides } from './slides';

/** How long the window must stop resizing before checking again, so layouts that follow the size have settled. */
const RESIZE_SETTLE_MS = 500;

/**
 * Checks whether an element clips its overflow on purpose, as text cut short with an ellipsis or a line clamp.
 *
 * @param style The element's computed style.
 * @returns Whether the clipping is intended.
 */
function isTruncatedText(style: CSSStyleDeclaration): boolean {
  return style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none';
}

/**
 * Lists the ways a slide's content doesn't fit: the slide overflowing, or an element inside it hiding part of
 * its content.
 *
 * @param slide The slide element.
 * @returns A description of each problem, with the element it concerns.
 */
function findFitProblems(slide: Element): Array<{ message: string; element: Element }> {
  const problems: Array<{ message: string; element: Element }> = [];
  const overflow = slide.scrollHeight - slide.clientHeight;
  if (overflow > 0) {
    problems.push({ message: `overflows by ${overflow}px`, element: slide });
  }
  for (const element of slide.querySelectorAll('*')) {
    const style = getComputedStyle(element);
    const clipsContent = style.overflowY === 'hidden' || style.overflowY === 'clip';
    const clipped = element.scrollHeight - element.clientHeight;
    if (clipsContent && !isTruncatedText(style) && clipped > 0) {
      problems.push({ message: `clips ${clipped}px`, element });
    }
  }
  return problems;
}

/** Warns in the console about every slide whose content doesn't fit. */
function warnAboutUnfittingSlides() {
  for (const slide of getSlides(document)) {
    const name = slide.id || slide.closest('section[id]')?.id || 'slide';
    for (const { message, element } of findFitProblems(slide)) {
      console.warn(`[fit] ${name} ${message}`, element);
    }
  }
}

/**
 * Development aid: warns whenever a slide's content doesn't fit. Slides are designed to fit the screen; one that
 * overflows scrolls on its own, catching swipes meant for the page, and a box that clips its overflow hides
 * content. Checks once the fonts have loaded and after every resize, so any screen size can be tried.
 */
export function startFitWarnings() {
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Checks again once resizing has paused. */
  function scheduleCheck() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(warnAboutUnfittingSlides, RESIZE_SETTLE_MS);
  }

  void document.fonts.ready.then(scheduleCheck);
  window.addEventListener('resize', scheduleCheck);
}
