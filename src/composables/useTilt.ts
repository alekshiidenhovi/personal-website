import { useEventListener, useParallax } from "@vueuse/core";
import { computed, type Ref, ref, watch } from "vue";

/** How fast the gyroscope's resting angle follows the device, per reading */
const BASELINE_FOLLOW = 0.03;
/** Gyroscope readings are subtle; this brings a small wrist turn to a visible tilt */
const GYRO_GAIN = 4;

const clamp1 = (value: number) => Math.min(Math.max(value, -1), 1);

/**
 * A 3D tilt for an element, as `--tilt-x` and `--tilt-y` in -1..1.
 *
 * A mouse tilts it toward the pointer while over it; touches never do, so a
 * tap can't leave it stuck at an angle. Devices that share their orientation
 * without asking (Android) tilt it with the gyroscope, measured against a
 * resting angle that slowly catches up with how the device is held, so a
 * reading angle stays flat. iPhones only share orientation after a permission
 * prompt, so there it stays flat.
 */
export function useTilt(target: Ref<HTMLElement | null>) {
  const pointer = ref<{ x: number; y: number } | null>(null);
  useEventListener(target, "pointermove", (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !target.value) return;
    const rect = target.value.getBoundingClientRect();
    pointer.value = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
    };
  });
  useEventListener(target, "pointerleave", () => {
    pointer.value = null;
  });

  // Only its gyroscope readings are used; the pointer is tracked above
  const { tilt, roll, source } = useParallax(target);
  const baseline = ref({ tilt: 0, roll: 0 });
  watch([tilt, roll], ([tiltNow, rollNow]) => {
    if (source.value !== "deviceOrientation") return;
    baseline.value = {
      tilt: baseline.value.tilt + (tiltNow - baseline.value.tilt) * BASELINE_FOLLOW,
      roll: baseline.value.roll + (rollNow - baseline.value.roll) * BASELINE_FOLLOW,
    };
  });

  return computed(() => {
    if (pointer.value) return { "--tilt-x": clamp1(pointer.value.x), "--tilt-y": clamp1(pointer.value.y) };
    if (source.value === "deviceOrientation") {
      return {
        "--tilt-x": clamp1((tilt.value - baseline.value.tilt) * GYRO_GAIN),
        "--tilt-y": clamp1(-(roll.value - baseline.value.roll) * GYRO_GAIN),
      };
    }
    return { "--tilt-x": 0, "--tilt-y": 0 };
  });
}
