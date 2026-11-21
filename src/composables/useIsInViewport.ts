import { onMounted, onUnmounted, type Ref, readonly, ref, type ShallowRef } from 'vue';

/**
 * Tracks whether an element visibly overlaps the viewport. An element merely touching the viewport's edge
 * doesn't count, unlike a plain IntersectionObserver entry.
 *
 * @param element The template ref of the element to track.
 * @returns Whether the element is in view.
 */
export function useIsInViewport(element: Readonly<ShallowRef<HTMLElement | null>>): Readonly<Ref<boolean>> {
  const isInViewport = ref(false);
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    if (!element.value) {
      throw new Error('useIsInViewport() needs its element mounted');
    }
    observer = new IntersectionObserver(
      ([entry]) => {
        isInViewport.value = entry.intersectionRatio > 0;
      },
      { threshold: [0, 0.01] },
    );
    observer.observe(element.value);
  });

  onUnmounted(() => observer?.disconnect());

  return readonly(isInViewport);
}
