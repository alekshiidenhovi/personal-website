/** Matches `oklch(L C H)`, with the lightness as a number or a percentage. */
const OKLCH_PATTERN = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i;

/**
 * Encodes a linear-light sRGB channel for display, clamped to the sRGB gamut.
 *
 * @param linear The channel in linear light, nominally from 0 to 1.
 * @returns The gamma-encoded channel, from 0 to 255.
 */
function encodeSrgbChannel(linear: number): number {
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(encoded, 0), 1) * 255);
}

/**
 * Converts a CSS color to one a canvas can paint. Canvas in some Safari versions ignores oklch and silently
 * paints black, so colors read from CSS go through this before reaching a canvas.
 *
 * @param color A CSS color.
 * @returns An `oklch(L C H)` color as `rgb(…)`, clamped to sRGB; any other color unchanged.
 */
export function convertToCanvasColor(color: string): string {
  const match = color.match(OKLCH_PATTERN);
  if (!match) {
    return color;
  }
  const [, lightnessValue, percentSign, chromaValue, hueDegrees] = match;
  const lightness = Number(lightnessValue) / (percentSign ? 100 : 1);
  const chroma = Number(chromaValue);
  const hue = (Number(hueDegrees) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  // OKLab to linear sRGB, per Björn Ottosson's reference implementation
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return `rgb(${encodeSrgbChannel(red)} ${encodeSrgbChannel(green)} ${encodeSrgbChannel(blue)})`;
}
