/** Longest wait for an idle moment before running anyway, in milliseconds. */
const IDLE_TIMEOUT_MS = 1500;
/** Delay standing in for an idle moment in browsers without `requestIdleCallback` (Safari), in milliseconds. */
const FALLBACK_DELAY_MS = 200;

/**
 * Runs a callback once the page has loaded and the browser is idle, so decorative work like an animation loop
 * never competes with the first paint.
 *
 * @param callback The work to run.
 * @returns A function that cancels the callback, for components unmounted before it runs.
 */
export function runWhenIdle(callback: () => void): () => void {
  let isCancelled = false;

  /** Runs the callback, unless it was cancelled meanwhile. */
  function runUnlessCancelled() {
    if (!isCancelled) {
      callback();
    }
  }

  /** Waits for an idle moment, or for the fallback delay where idle callbacks aren't supported. */
  function scheduleWhenIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(runUnlessCancelled, { timeout: IDLE_TIMEOUT_MS });
    } else {
      setTimeout(runUnlessCancelled, FALLBACK_DELAY_MS);
    }
  }

  if (document.readyState === 'complete') {
    scheduleWhenIdle();
  } else {
    window.addEventListener('load', scheduleWhenIdle, { once: true });
  }

  return () => {
    isCancelled = true;
    window.removeEventListener('load', scheduleWhenIdle);
  };
}
