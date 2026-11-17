/** A mouse or trackpad, which can hover */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/*
 * Device classes. CSS repeats these queries (media queries can't read
 * variables), so change them together:
 * - phone: narrow, or too short for more (phones in landscape)
 * - wide: lg and up, the desktop compositions
 */
export const PHONE_QUERY = "(width < 40rem), (height < 30rem)";
export const WIDE_QUERY = "(width >= 64rem)";

/**
 * The element the page scrolls in (see App.vue), rather than the document.
 * Safari resizes its toolbars while the document scrolls, which changes the
 * viewport mid-scroll and makes it snap a second time; an inner scroller keeps
 * the viewport, and so every slide's size, fixed.
 */
export const getScroller = () => document.getElementById("scroller") as HTMLElement;

/** Marks an element whose top edge is a slide stop */
export const SLIDE_ATTRIBUTE = "data-slide";
