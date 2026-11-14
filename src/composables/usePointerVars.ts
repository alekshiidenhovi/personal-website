import { type Ref, onMounted, onUnmounted } from "vue";

/**
 * Exposes the pointer position over an element as CSS variables:
 * `--pointer-x` / `--pointer-y` in px (for spotlights) and
 * `--tilt-x` / `--tilt-y` in the range -1..1 (for 3D tilts).
 */
export function usePointerVars(elRef: Ref<HTMLElement | null>) {
  const onMove = (event: PointerEvent) => {
    const el = elRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty("--pointer-x", `${x}px`);
    el.style.setProperty("--pointer-y", `${y}px`);
    el.style.setProperty("--tilt-x", `${(x / rect.width) * 2 - 1}`);
    el.style.setProperty("--tilt-y", `${(y / rect.height) * 2 - 1}`);
  };

  const onLeave = () => {
    elRef.value?.style.setProperty("--tilt-x", "0");
    elRef.value?.style.setProperty("--tilt-y", "0");
  };

  onMounted(() => {
    elRef.value?.addEventListener("pointermove", onMove);
    elRef.value?.addEventListener("pointerleave", onLeave);
  });

  onUnmounted(() => {
    elRef.value?.removeEventListener("pointermove", onMove);
    elRef.value?.removeEventListener("pointerleave", onLeave);
  });
}
