/** Longest wait for an idle moment before running anyway */
const IDLE_TIMEOUT_MS = 1500;
/** Fallback delay for browsers without `requestIdleCallback` (Safari) */
const FALLBACK_DELAY_MS = 200;

/**
 * Runs `callback` once the page has loaded and the browser is idle, so
 * decorative work like animation loops never competes with the first paint.
 * Returns a function that cancels it, for components unmounted before then.
 */
export function whenIdle(callback: () => void) {
  let isCancelled = false;
  const run = () => {
    if (!isCancelled) callback();
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    else setTimeout(run, FALLBACK_DELAY_MS);
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });

  return () => {
    isCancelled = true;
    window.removeEventListener('load', schedule);
  };
}
