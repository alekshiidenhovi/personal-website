import { getSnapScrollTop } from './scroll';

/** The attribute marking an element whose top edge is a slide stop. */
export const SLIDE_ATTRIBUTE = 'data-slide';

/** A slide by its section and page, which stays valid when a layout change moves every slide. */
export interface SlidePosition {
  readonly sectionId: string;
  readonly pageIndex: number;
}

/**
 * Gets the slides inside an element, in page order.
 *
 * @param container The element to search.
 * @returns The slide elements.
 */
export function getSlides(container: ParentNode): Element[] {
  return [...container.querySelectorAll(`[${SLIDE_ATTRIBUTE}]`)];
}

/**
 * Gets the scroll offsets of every slide stop.
 *
 * @param scroller The scroll container.
 * @returns The distinct offsets, in ascending order.
 */
export function getSlideScrollTops(scroller: HTMLElement): number[] {
  const scrollTops = getSlides(scroller).map((slide) => getSnapScrollTop(scroller, slide));
  return [...new Set(scrollTops)].sort((a, b) => a - b);
}

/**
 * Gets a section's slides, which for a section that is a slide itself, such as the hero, is the section alone.
 *
 * @param section The section element.
 * @returns The section's slides, in page order.
 */
function getSectionSlides(section: Element): Element[] {
  return section.hasAttribute(SLIDE_ATTRIBUTE) ? [section] : getSlides(section);
}

/**
 * Finds the slide nearest to the scroller's current offset.
 *
 * @param scroller The scroll container.
 * @returns The nearest slide's position, or undefined when the scroller has no slides.
 */
export function findNearestSlidePosition(scroller: HTMLElement): SlidePosition | undefined {
  let nearest: { position: SlidePosition; distance: number } | undefined;
  for (const slide of getSlides(scroller)) {
    const section = slide.closest('section[id]');
    if (!section) {
      throw new Error('Every slide must be inside a section with an id');
    }
    const distance = Math.abs(getSnapScrollTop(scroller, slide) - scroller.scrollTop);
    if (!nearest || distance < nearest.distance) {
      const pageIndex = getSectionSlides(section).indexOf(slide);
      nearest = { position: { sectionId: section.id, pageIndex }, distance };
    }
  }
  return nearest?.position;
}

/**
 * Finds the slide at a position. A page index past a section's last page, such as after the section lost pages
 * in a layout change, gives its last page.
 *
 * @param scroller The scroll container.
 * @param position The slide's section and page.
 * @returns The slide element, or undefined when the page has no such section.
 */
export function findSlide(scroller: HTMLElement, position: SlidePosition): Element | undefined {
  const section = scroller.querySelector(`section[id="${CSS.escape(position.sectionId)}"]`);
  if (!section) {
    return undefined;
  }
  const slides = getSectionSlides(section);
  return slides[Math.min(position.pageIndex, slides.length - 1)];
}
