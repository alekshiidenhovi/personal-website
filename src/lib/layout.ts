/**
 * Wide and tall enough to try the full-viewport, pinned sections and slideshow
 * navigation; usePinnedLayout keeps them only if every page also fits.
 */
export const PINNED_LAYOUT_QUERY = "(min-width: 57.75rem) and (min-height: 40rem) and (orientation: landscape)";

/**
 * On the root element while the pinned layout is on. Styles for the stacked
 * layout select `:root:not(.pinned)`.
 */
export const PINNED_CLASS = "pinned";

/** Marks a page of a pinned section, whose content must fit its box for the pinned layout */
export const PAGE_ATTRIBUTE = "data-page";

/** Marks an element whose top edge is a slideshow stop */
export const SLIDE_ATTRIBUTE = "data-slide";

/** Index of the element whose vertical center is nearest the viewport's center, or -1 for none */
export const closestToViewportCenter = (elements: Element[]) => {
  const viewportCenter = window.innerHeight / 2;
  const distances = elements.map((element) => {
    const { top, height } = element.getBoundingClientRect();
    return Math.abs(top + height / 2 - viewportCenter);
  });
  return distances.indexOf(Math.min(...distances));
};
