import { useEventListener } from "@vueuse/core";
import { computed, type Ref, ref, shallowRef } from "vue";

/** How fast the gyroscope's resting angle follows the device, per reading */
const BASELINE_FOLLOW = 0.03;
/** Gyroscope readings are subtle; this brings a small wrist turn to a visible tilt */
const GYRO_GAIN = 4;

const clamp1 = (value: number) => Math.min(Math.max(value, -1), 1);

/** The device's tilt (sideways) and roll (forwards), each -0.5..0.5, in the screen's frame, so turning it doesn't swap the axes */
const deviceAngles = ({ beta, gamma }: DeviceOrientationEvent) => {
  const b = (beta ?? 0) / 90;
  const g = (gamma ?? 0) / 90;
  switch (screen.orientation?.type) {
    case "landscape-primary":
      return { tilt: b, roll: g };
    case "landscape-secondary":
      return { tilt: -b, roll: -g };
    case "portrait-secondary":
      return { tilt: -g, roll: b };
    default:
      return { tilt: g, roll: -b };
  }
};

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

  // The gyroscope's latest angles relative to a resting angle that follows them a little on every reading
  const gyro = shallowRef<{ tilt: number; roll: number } | null>(null);
  let baseline: { tilt: number; roll: number } | null = null;
  useEventListener(window, "deviceorientation", (event: DeviceOrientationEvent) => {
    if (event.alpha === null && event.gamma === null) return;
    const angles = deviceAngles(event);
    baseline ??= angles;
    baseline = {
      tilt: baseline.tilt + (angles.tilt - baseline.tilt) * BASELINE_FOLLOW,
      roll: baseline.roll + (angles.roll - baseline.roll) * BASELINE_FOLLOW,
    };
    gyro.value = { tilt: angles.tilt - baseline.tilt, roll: angles.roll - baseline.roll };
  });

  return computed(() => {
    if (pointer.value) return { "--tilt-x": clamp1(pointer.value.x), "--tilt-y": clamp1(pointer.value.y) };
    if (gyro.value) {
      return { "--tilt-x": clamp1(gyro.value.tilt * GYRO_GAIN), "--tilt-y": clamp1(-gyro.value.roll * GYRO_GAIN) };
    }
    return { "--tilt-x": 0, "--tilt-y": 0 };
  });
}
