const toSrgbChannel = (linear: number) => {
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(Math.max(encoded, 0), 1) * 255);
};

/**
 * Converts an `oklch(L C H)` color to `rgb(...)`, clamped to sRGB; anything
 * else passes through unchanged. Canvas in some Safari versions ignores
 * oklch and silently paints black, so colors read from CSS go through this
 * before reaching a canvas.
 */
export function toCanvasColor(color: string) {
  const match = color.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i);
  if (!match) return color;

  const lightness = Number(match[1]) / (match[2] ? 100 : 1);
  const chroma = Number(match[3]);
  const hue = (Number(match[4]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  // OKLab to linear sRGB, per Björn Ottosson's reference implementation
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return `rgb(${toSrgbChannel(red)} ${toSrgbChannel(green)} ${toSrgbChannel(blue)})`;
}
