import { onMounted, onUnmounted, watch } from "vue";
import { pinnedLayout } from "./usePinnedLayout";

/**
 * Calls `update` once mounted and whenever what's in view can change:
 * scrolling, resizing and switching layouts.
 */
export function useViewportUpdates(update: () => void) {
  watch(pinnedLayout, update);

  onMounted(() => {
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });
}
