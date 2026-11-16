/** A mouse or trackpad: hover effects and the slide arrows */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/*
 * Device classes. CSS repeats these queries (media queries can't read
 * variables), so change them together:
 * - phone: narrow, or too short for more (phones in landscape)
 * - wide: lg and up, the desktop compositions
 */
export const PHONE_QUERY = "(width < 40rem), (height < 30rem)";
export const WIDE_QUERY = "(width >= 64rem)";

/** Marks an element whose top edge is a slide stop */
export const SLIDE_ATTRIBUTE = "data-slide";
