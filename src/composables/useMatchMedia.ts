import { useEventListener } from "@vueuse/core";
import { readonly, shallowRef } from "vue";

/**
 * Whether a media query matches, kept up to date. Unlike VueUse's
 * useMediaQuery, which reports false until mounted (for server rendering),
 * this reads the query straight away, so the first render already has the
 * right layout and the page doesn't shift after loading at an anchor.
 */
export function useMatchMedia(query: string) {
  const mediaQuery = window.matchMedia(query);
  const matches = shallowRef(mediaQuery.matches);
  useEventListener(mediaQuery, "change", (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  });
  return readonly(matches);
}
