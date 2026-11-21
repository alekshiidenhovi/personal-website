/**
 * Phones: narrow, or too short for more (phones in landscape). The same query as `--phone` in styles/media.css,
 * which CSS can't share with scripts; change them together.
 */
export const PHONE_QUERY = '(width < 40rem), (height < 30rem)';

/** Wide screens: lg and up, the desktop compositions. The same query as `--wide` in styles/media.css. */
export const WIDE_QUERY = '(width >= 64rem)';

/** A mouse or trackpad, which can hover. */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
