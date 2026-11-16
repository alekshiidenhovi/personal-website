import { onMounted, onUnmounted, readonly, ref } from "vue";
import { HERO_ID, SECTIONS } from "../data/sections";

const SECTION_IDS = [HERO_ID, ...SECTIONS.map((section) => section.id)];

const activeId = ref<string>(HERO_ID);

/** The id of the section crossing the middle of the viewport; shared by the nav and the layout switch */
export const activeSection = readonly(activeId);

/**
 * Keeps activeSection up to date. Call once, from the root component.
 *
 * Leaving the middle line is tracked as well as entering it: while the layout
 * settles on load, several sections can touch the line at once, and acting
 * only on entries would leave a section that has since moved away active.
 */
export function useActiveSection() {
  let observer: IntersectionObserver | null = null;

  onMounted(() => {
    const crossing = new Set<string>();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id);
          else crossing.delete(entry.target.id);
        }
        // Two sections only share the line at their common edge; the lower one is the one being entered
        const active = [...SECTION_IDS].reverse().find((id) => crossing.has(id));
        if (active) activeId.value = active;
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    for (const id of SECTION_IDS) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
  });

  onUnmounted(() => observer?.disconnect());
}
