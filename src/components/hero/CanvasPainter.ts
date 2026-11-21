import type { Vec } from "./embeddingModel";

/**
 * Drawing on a 2D canvas in CSS pixels, with the two optimizations the
 * embedding space needs to stay smooth in Safari: many small dots are batched
 * into one fill per color and opacity, and glowing dots are blurred once into
 * a sprite, as a canvas shadow blur every frame is slow there.
 */
export class CanvasPainter {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private readonly dotBatches = new Map<string, Map<number, Path2D>>();
  private readonly glowSprites = new Map<string, { image: HTMLCanvasElement; extent: number }>();

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not supported");
    this.canvas = canvas;
    this.ctx = ctx;
  }

  /** Sizes the buffer to the canvas's box at the screen's density (capped at 2x); resizing the buffer clears it */
  resize(width: number, height: number) {
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Sprites are drawn at the old density and size
    this.glowSprites.clear();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  line(from: Vec, to: Vec, color: string, alpha: number) {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1]);
    ctx.lineTo(to[0], to[1]);
    ctx.stroke();
  }

  dot(at: Vec, radius: number, color: string, alpha: number) {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(at[0], at[1], radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ring(at: Vec, radius: number, color: string, alpha: number) {
    const { ctx } = this;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(at[0], at[1], radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  /** Queues a dot for `fillBatchedDots`, grouped with others of its color and opacity */
  batchDot(at: Vec, radius: number, color: string, alpha: number) {
    if (!alpha) return;
    let byAlpha = this.dotBatches.get(color);
    if (!byAlpha) {
      byAlpha = new Map();
      this.dotBatches.set(color, byAlpha);
    }
    let path = byAlpha.get(alpha);
    if (!path) {
      path = new Path2D();
      byAlpha.set(alpha, path);
    }
    path.moveTo(at[0] + radius, at[1]);
    path.arc(at[0], at[1], radius, 0, Math.PI * 2);
  }

  /** Draws the queued dots, one fill per color and opacity */
  fillBatchedDots() {
    const { ctx } = this;
    for (const [color, byAlpha] of this.dotBatches) {
      ctx.fillStyle = color;
      for (const [alpha, path] of byAlpha) {
        ctx.globalAlpha = alpha;
        ctx.fill(path);
      }
    }
    this.dotBatches.clear();
  }

  /** A dot with a soft glow of `glow` pixels, scaled down by `scale` as it appears */
  glowingDot(at: Vec, radius: number, color: string, alpha: number, glow: number, scale = 1) {
    const { image, extent } = this.glowSprite(radius, color, glow);
    const half = extent * scale;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(image, at[0] - half, at[1] - half, half * 2, half * 2);
  }

  private glowSprite(radius: number, color: string, glow: number) {
    const key = `${color} ${radius} ${glow}`;
    const cached = this.glowSprites.get(key);
    if (cached) return cached;
    // Half the sprite's width in CSS pixels, with room for the blur's falloff
    const extent = Math.ceil(radius + glow);
    const image = document.createElement("canvas");
    image.width = image.height = extent * 2 * this.dpr;
    const ctx = image.getContext("2d");
    if (ctx) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(extent, extent, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    const sprite = { image, extent };
    this.glowSprites.set(key, sprite);
    return sprite;
  }
}
