import type { Directive } from "vue";

/** Fades an element in once it scrolls into view. */
export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.classList.add("reveal");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("revealed");
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
  },
};

declare module "vue" {
  interface GlobalDirectives {
    vReveal: typeof vReveal;
  }
}
