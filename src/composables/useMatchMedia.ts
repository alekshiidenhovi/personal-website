import { type Ref, readonly, ref } from 'vue';
import { useEventListener } from './useEventListener';

/**
 * Tracks whether a media query matches. The query is read straight away rather than once mounted, so the first
 * render already has the right layout and the page doesn't shift after loading at an anchor.
 *
 * @param query The media query.
 * @returns Whether the query matches.
 */
export function useMatchMedia(query: string): Readonly<Ref<boolean>> {
  const mediaQuery = window.matchMedia(query);
  const matches = ref(mediaQuery.matches);
  useEventListener<MediaQueryListEvent>(mediaQuery, 'change', (event) => {
    matches.value = event.matches;
  });
  return readonly(matches);
}
