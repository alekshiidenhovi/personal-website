export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A standard normal sample (Box–Muller) */
export const gaussian = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
