import type { Directive } from "vue";

const observers = new WeakMap<SVGSVGElement, ResizeObserver>();

/**
 * Keeps an SVG drawing's text readable however small the drawing is shown.
 * Sets `--units-per-px` on the SVG, the drawing's own units per screen pixel,
 * from how large it is drawn. The figure styles (covers/cover.css) turn it
 * into a minimum text size.
 */
export const vFigureScale: Directive<SVGSVGElement> = {
  mounted(el) {
    const update = () => {
      const { width, height } = el.viewBox.baseVal;
      // The drawing fits its box whole (`meet`), so the tighter side sets its scale
      const scale = Math.min(el.clientWidth / width, el.clientHeight / height);
      if (scale > 0) el.style.setProperty("--units-per-px", String(1 / scale));
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observers.set(el, observer);
  },
  unmounted(el) {
    observers.get(el)?.disconnect();
  },
};
