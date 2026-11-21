import { type ComputedRef, type CSSProperties, computed, ref, type ShallowRef, shallowRef } from 'vue';
import { clamp } from '../lib/math';
import { useEventListener } from './useEventListener';

/** How fast the gyroscope's resting angle follows the device, per reading. */
const RESTING_ANGLE_FOLLOW = 0.03;
/** Gyroscope readings are subtle; this brings a small wrist turn to a visible tilt. */
const GYROSCOPE_GAIN = 4;

/** How a device is turned in the screen's frame, each from -0.5 to 0.5. */
interface DeviceAngles {
  /** Turned sideways. */
  readonly tilt: number;
  /** Turned forwards. */
  readonly roll: number;
}

/**
 * Reads how the device is turned, in the screen's frame, so rotating the screen doesn't swap the axes.
 *
 * @param event The orientation reading.
 * @returns The device's angles.
 */
function readDeviceAngles({ beta, gamma }: DeviceOrientationEvent): DeviceAngles {
  const forwards = (beta ?? 0) / 90;
  const sideways = (gamma ?? 0) / 90;
  switch (screen.orientation?.type) {
    case 'landscape-primary':
      return { tilt: forwards, roll: sideways };
    case 'landscape-secondary':
      return { tilt: -forwards, roll: -sideways };
    case 'portrait-secondary':
      return { tilt: -sideways, roll: forwards };
    default:
      return { tilt: sideways, roll: -forwards };
  }
}

/**
 * Tilts an element in 3D, as `--tilt-x` and `--tilt-y` for its styles to use.
 *
 * A mouse tilts it towards the pointer while over it; touches never do, so a tap can't leave it stuck at an angle.
 * Devices that share their orientation without asking (Android) tilt it with the gyroscope, measured against a
 * resting angle that slowly catches up with how the device is held, so a reading angle stays flat. iPhones share
 * their orientation only after a permission prompt, so there it stays flat.
 *
 * @param element The template ref of the element to tilt.
 * @returns The tilt as `--tilt-x` and `--tilt-y`, each from -1 to 1, to bind to the element's style.
 */
export function useTilt(element: Readonly<ShallowRef<HTMLElement | null>>): ComputedRef<CSSProperties> {
  /** Where the mouse is over the element, each from -1 to 1, or undefined while it isn't. */
  const pointer = ref<{ x: number; y: number }>();
  /** The device's angles relative to its resting angle, or undefined without a gyroscope. */
  const gyroscope = shallowRef<DeviceAngles>();
  let restingAngles: DeviceAngles | undefined;

  /**
   * Gets the element.
   *
   * @returns The element.
   */
  function getElement(): HTMLElement {
    if (!element.value) {
      throw new Error('useTilt() needs its element mounted');
    }
    return element.value;
  }

  /**
   * Follows the mouse over the element.
   *
   * @param event The pointer move.
   */
  function followPointer(event: PointerEvent) {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const { left, top, width, height } = getElement().getBoundingClientRect();
    pointer.value = { x: ((event.clientX - left) / width) * 2 - 1, y: ((event.clientY - top) / height) * 2 - 1 };
  }

  /**
   * Follows the gyroscope, against a resting angle that follows it a little on every reading.
   *
   * @param event The orientation reading.
   */
  function followGyroscope(event: DeviceOrientationEvent) {
    // Desktop browsers fire one empty reading
    if (event.alpha === null && event.gamma === null) {
      return;
    }
    const angles = readDeviceAngles(event);
    const resting = restingAngles ?? angles;
    restingAngles = {
      tilt: resting.tilt + (angles.tilt - resting.tilt) * RESTING_ANGLE_FOLLOW,
      roll: resting.roll + (angles.roll - resting.roll) * RESTING_ANGLE_FOLLOW,
    };
    gyroscope.value = { tilt: angles.tilt - restingAngles.tilt, roll: angles.roll - restingAngles.roll };
  }

  useEventListener<PointerEvent>(getElement, 'pointermove', followPointer);
  useEventListener(getElement, 'pointerleave', () => {
    pointer.value = undefined;
  });
  useEventListener<DeviceOrientationEvent>(window, 'deviceorientation', followGyroscope);

  return computed(() => {
    if (pointer.value) {
      return { '--tilt-x': clamp(pointer.value.x, -1, 1), '--tilt-y': clamp(pointer.value.y, -1, 1) };
    }
    if (gyroscope.value) {
      return {
        '--tilt-x': clamp(gyroscope.value.tilt * GYROSCOPE_GAIN, -1, 1),
        '--tilt-y': clamp(-gyroscope.value.roll * GYROSCOPE_GAIN, -1, 1),
      };
    }
    return { '--tilt-x': 0, '--tilt-y': 0 };
  });
}
