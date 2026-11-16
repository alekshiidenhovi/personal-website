import { onMounted, onUnmounted } from "vue";

/** Measures what it needs, and returns the changes to make from it, if any */
type Update = () => (() => void) | undefined;

const updates = new Set<Update>();
let frameId = 0;

/*
 * Every update reads first, then all their changes are written, so a write
 * never forces the browser to recompute layout for the next update's read.
 */
const flush = () => {
  frameId = 0;
  const writes = [...updates].map((update) => update());
  for (const write of writes) write?.();
};

const schedule = () => {
  frameId ||= requestAnimationFrame(flush);
};

/**
 * Runs `update` once mounted and whenever what's in view can change (scrolling
 * and resizing), at most once a frame, in one batch with every other update.
 */
export function useViewportUpdates(update: Update) {
  onMounted(() => {
    if (!updates.size) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
    }
    updates.add(update);
    schedule();
  });

  onUnmounted(() => {
    updates.delete(update);
    if (updates.size) return;
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frameId);
    frameId = 0;
  });
}
