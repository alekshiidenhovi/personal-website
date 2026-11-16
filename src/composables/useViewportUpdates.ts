import { useEventListener } from "@vueuse/core";
import { onMounted } from "vue";

/** Calls `update` once mounted and whenever what's in view can change: scrolling and resizing */
export function useViewportUpdates(update: () => void) {
  useEventListener(window, "scroll", update, { passive: true });
  useEventListener(window, "resize", update, { passive: true });
  onMounted(update);
}
