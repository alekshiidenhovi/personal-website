import { onMounted, onUnmounted } from 'vue';
import { useSlideshowScroller } from './useSlideshowScroller';

/** Something to measure from the layout, and how to apply the measurement. */
export interface ViewportMeasurement<T> {
  /** Reads the layout; returns undefined when there is nothing to measure yet. */
  measure: () => T | undefined;
  /** Writes what the measurement changes, such as reactive state. */
  apply: (measurement: T) => void;
}

/** A registered measurement, its result already bound to its apply step. */
type PendingUpdate = () => (() => void) | undefined;

const registeredUpdates = new Set<PendingUpdate>();
let scheduledFrame = 0;

/**
 * Runs every registered measurement, then applies all their results. Reading everything before writing anything
 * keeps a write from forcing the browser to recompute layout for the next read.
 */
function runMeasurements() {
  scheduledFrame = 0;
  const applySteps = [...registeredUpdates].map((update) => update());
  for (const apply of applySteps) {
    apply?.();
  }
}

/** Schedules the measurements for the next frame, at most once per frame. */
function scheduleMeasurements() {
  scheduledFrame ||= requestAnimationFrame(runMeasurements);
}

/**
 * Measures the layout once mounted and whenever what's in view can change (scrolling the slideshow and resizing
 * the window), at most once a frame, batched with every other component's measurements.
 *
 * @param measurement What to measure and how to apply it.
 */
export function useViewportMeasurement<T>({ measure, apply }: ViewportMeasurement<T>) {
  const getScroller = useSlideshowScroller();

  /**
   * Measures and binds the result to its apply step.
   *
   * @returns The apply step, or undefined when there was nothing to measure.
   */
  function update() {
    const measured = measure();
    return measured === undefined ? undefined : () => apply(measured);
  }

  onMounted(() => {
    if (registeredUpdates.size === 0) {
      getScroller().addEventListener('scroll', scheduleMeasurements, { passive: true });
      window.addEventListener('resize', scheduleMeasurements, { passive: true });
    }
    registeredUpdates.add(update);
    scheduleMeasurements();
  });

  onUnmounted(() => {
    registeredUpdates.delete(update);
    if (registeredUpdates.size > 0) {
      return;
    }
    getScroller().removeEventListener('scroll', scheduleMeasurements);
    window.removeEventListener('resize', scheduleMeasurements);
    cancelAnimationFrame(scheduledFrame);
    scheduledFrame = 0;
  });
}
