import { onMounted, onUnmounted } from 'vue';

/**
 * Listens to an event while the calling component is mounted.
 *
 * @param target The event target, or a function returning it, for targets that exist only once mounted.
 * @param type The event type.
 * @param listener Called with each event.
 * @param options Listener options, such as `passive`.
 */
export function useEventListener<E extends Event>(
  target: EventTarget | (() => EventTarget),
  type: string,
  listener: (event: E) => void,
  options?: AddEventListenerOptions,
) {
  // The DOM types listeners as taking any Event; `listener` narrows it to the event type it is registered for
  const handler = listener as EventListener;
  let resolvedTarget: EventTarget | undefined;
  onMounted(() => {
    resolvedTarget = typeof target === 'function' ? target() : target;
    resolvedTarget.addEventListener(type, handler, options);
  });
  onUnmounted(() => {
    resolvedTarget?.removeEventListener(type, handler, options);
  });
}
