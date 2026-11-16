/**
 * The pinned sections and slideshow, for a mouse or trackpad on a screen of at
 * least 1024×768. Every page fits from about 750px tall at any width, so the
 * slides are designed to fit rather than measured. Touch screens always get
 * the stacked, natively scrolling layout.
 */
export const PINNED_LAYOUT_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 64rem) and (min-height: 48rem)";

/**
 * On the root element while the pinned layout is on. Styles for the stacked
 * layout select `:root:not(.pinned)`.
 */
export const PINNED_CLASS = "pinned";

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
