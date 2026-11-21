/**
 * Gets the transition delay of one of a sequence of elements, which light up one after another as a cover
 * activates, and all at once as it rests again.
 *
 * @param isActive Whether the cover is active.
 * @param index The element's place in the sequence.
 * @param staggerS The delay between consecutive elements, in seconds.
 * @returns The style to bind.
 */
export function getStaggeredTransition(
  isActive: boolean,
  index: number,
  staggerS: number,
): { transitionDelay: string } {
  return { transitionDelay: isActive ? `${index * staggerS}s` : '0s' };
}
