import { onMounted, onUnmounted, type Ref, readonly, ref } from 'vue';
import { useSlideshowScroller } from './useSlideshowScroller';

/**
 * Tracks which section of the slideshow crosses the middle of the viewport.
 *
 * Sections leaving the middle line are tracked as well as sections entering it: while the layout settles on
 * load, several sections can touch the line at once, and acting only on entries would leave a section active
 * that has since moved away.
 *
 * @param sectionIds The ids of the sections to track, in page order.
 * @returns The id of the active section; the first section's until one is measured.
 */
export function useActiveSection(sectionIds: readonly string[]): Readonly<Ref<string>> {
  const [firstSectionId] = sectionIds;
  if (firstSectionId === undefined) {
    throw new Error('useActiveSection() needs at least one section');
  }
  const getScroller = useSlideshowScroller();
  const activeSectionId = ref(firstSectionId);
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    const crossingIds = new Set<string>();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            crossingIds.add(entry.target.id);
          } else {
            crossingIds.delete(entry.target.id);
          }
        }
        // Two sections share the line only at their common edge, where the lower one is being entered
        const lowestCrossingId = sectionIds.findLast((id) => crossingIds.has(id));
        if (lowestCrossingId) {
          activeSectionId.value = lowestCrossingId;
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const id of sectionIds) {
      const section = getScroller().querySelector(`#${CSS.escape(id)}`);
      if (!section) {
        throw new Error(`useActiveSection(): no section with id "${id}"`);
      }
      observer.observe(section);
    }
  });

  onUnmounted(() => observer?.disconnect());

  return readonly(activeSectionId);
}
