/**
 * Wide and tall enough for full-viewport, pinned sections and slideshow
 * navigation. Mirrored by `@media` queries in the components that use it.
 */
export const PINNED_LAYOUT_QUERY = "(min-width: 57.75rem) and (min-height: 40rem) and (orientation: landscape)";

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
