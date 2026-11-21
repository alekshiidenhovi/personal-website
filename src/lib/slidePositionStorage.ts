import type { SlidePosition } from './slides';

const STORAGE_KEY = 'slide-position';

/**
 * Checks whether a value read from storage has the shape of a slide position.
 *
 * @param value The parsed value.
 * @returns Whether the value is a slide position.
 */
function isSlidePosition(value: unknown): value is SlidePosition {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sectionId' in value &&
    typeof value.sectionId === 'string' &&
    'pageIndex' in value &&
    typeof value.pageIndex === 'number' &&
    Number.isInteger(value.pageIndex) &&
    value.pageIndex >= 0
  );
}

/**
 * Reads the slide position stored for this tab.
 *
 * @returns The stored position, or undefined when there is none, it is malformed, or storage is unavailable.
 */
export function tryReadSlidePosition(): SlidePosition | undefined {
  let stored: string | null;
  try {
    stored = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked, such as in some private windows; the page then starts from the top
    return undefined;
  }
  if (stored === null) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return isSlidePosition(parsed) ? parsed : undefined;
  } catch {
    // Written by an older version of the site, or edited by hand; treated as nothing stored
    return undefined;
  }
}

/**
 * Stores the slide position for this tab, so a reload or back navigation returns to it.
 *
 * @param position The position to store.
 */
export function tryStoreSlidePosition(position: SlidePosition) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Storage can be blocked or full; the position is then not kept across reloads
  }
}
