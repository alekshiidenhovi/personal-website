import type { Vector } from '../../lib/math';

/** The highest pixel density drawn at; denser screens gain little detail for the cost. */
const MAX_PIXEL_RATIO = 2;

/** A dot with its glow, blurred once into an image. */
interface GlowSprite {
  readonly image: HTMLCanvasElement;
  /** Half the image's width, in CSS pixels. */
  readonly extent: number;
}

/**
 * Draws on a 2D canvas in CSS pixels, with the two optimizations the embedding space needs to stay smooth in
 * Safari: many small dots are batched into one fill per color and opacity, and glowing dots are blurred once
 * into a sprite, as a canvas shadow blur every frame is slow there.
 */
export class CanvasPainter {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private pixelRatio = 1;
  private readonly dotBatches = new Map<string, Map<number, Path2D>>();
  private readonly glowSprites = new Map<string, GlowSprite>();

  /**
   * Creates a painter for a canvas whose 2D context is already known to exist.
   *
   * @param canvas The canvas to draw on.
   * @param context The canvas's 2D context.
   */
  private constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.context = context;
  }

  /**
   * Creates a painter for a canvas, if the browser can draw on it.
   *
   * @param canvas The canvas to draw on.
   * @returns The painter, or undefined when the browser offers no 2D context.
   */
  static tryCreate(canvas: HTMLCanvasElement): CanvasPainter | undefined {
    const context = canvas.getContext('2d');
    return context ? new CanvasPainter(canvas, context) : undefined;
  }

  /**
   * Sizes the drawing buffer to the canvas's box at the screen's pixel density. Resizing the buffer clears it.
   *
   * @param width The canvas's width in CSS pixels.
   * @param height The canvas's height in CSS pixels.
   */
  resize(width: number, height: number) {
    this.pixelRatio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    // The sprites were drawn at the old pixel density
    this.glowSprites.clear();
  }

  /** Clears the whole canvas. */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draws a straight line, one pixel wide.
   *
   * @param from Where the line starts.
   * @param to Where the line ends.
   * @param color The line's color.
   * @param opacity The line's opacity, from 0 to 1.
   */
  drawLine(from: Vector, to: Vector, color: string, opacity: number) {
    this.context.globalAlpha = opacity;
    this.context.strokeStyle = color;
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(from[0], from[1]);
    this.context.lineTo(to[0], to[1]);
    this.context.stroke();
  }

  /**
   * Draws a filled dot.
   *
   * @param center The dot's center.
   * @param radius The dot's radius.
   * @param color The dot's color.
   * @param opacity The dot's opacity, from 0 to 1.
   */
  drawDot(center: Vector, radius: number, color: string, opacity: number) {
    this.context.globalAlpha = opacity;
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(center[0], center[1], radius, 0, Math.PI * 2);
    this.context.fill();
  }

  /**
   * Draws a circle outline.
   *
   * @param center The ring's center.
   * @param radius The ring's radius.
   * @param color The ring's color.
   * @param opacity The ring's opacity, from 0 to 1.
   */
  drawRing(center: Vector, radius: number, color: string, opacity: number) {
    this.context.globalAlpha = opacity;
    this.context.strokeStyle = color;
    this.context.beginPath();
    this.context.arc(center[0], center[1], radius, 0, Math.PI * 2);
    this.context.stroke();
  }

  /**
   * Queues a dot for `fillBatchedDots`, grouped with the other dots of its color and opacity.
   *
   * @param center The dot's center.
   * @param radius The dot's radius.
   * @param color The dot's color.
   * @param opacity The dot's opacity, from 0 to 1; a dot at 0 is skipped.
   */
  batchDot(center: Vector, radius: number, color: string, opacity: number) {
    if (opacity === 0) {
      return;
    }
    let pathsByOpacity = this.dotBatches.get(color);
    if (!pathsByOpacity) {
      pathsByOpacity = new Map();
      this.dotBatches.set(color, pathsByOpacity);
    }
    let path = pathsByOpacity.get(opacity);
    if (!path) {
      path = new Path2D();
      pathsByOpacity.set(opacity, path);
    }
    // Without a move to the arc's start, the path would join each dot to the previous one
    path.moveTo(center[0] + radius, center[1]);
    path.arc(center[0], center[1], radius, 0, Math.PI * 2);
  }

  /** Draws the queued dots, one fill per color and opacity, and empties the queue. */
  fillBatchedDots() {
    for (const [color, pathsByOpacity] of this.dotBatches) {
      this.context.fillStyle = color;
      for (const [opacity, path] of pathsByOpacity) {
        this.context.globalAlpha = opacity;
        this.context.fill(path);
      }
    }
    this.dotBatches.clear();
  }

  /**
   * Draws a dot with a soft glow around it.
   *
   * @param center The dot's center.
   * @param radius The dot's radius.
   * @param color The dot's and the glow's color.
   * @param opacity The opacity, from 0 to 1.
   * @param glowSize How far the glow reaches beyond the dot.
   * @param scale How much to scale the dot and its glow, such as to grow them in.
   */
  drawGlowingDot(center: Vector, radius: number, color: string, opacity: number, glowSize: number, scale: number) {
    const { image, extent } = this.getGlowSprite(radius, color, glowSize);
    const scaledExtent = extent * scale;
    this.context.globalAlpha = opacity;
    this.context.drawImage(
      image,
      center[0] - scaledExtent,
      center[1] - scaledExtent,
      scaledExtent * 2,
      scaledExtent * 2,
    );
  }

  /**
   * Gets the sprite of a glowing dot, blurring it on first use.
   *
   * @param radius The dot's radius.
   * @param color The dot's and the glow's color.
   * @param glowSize How far the glow reaches beyond the dot.
   * @returns The sprite.
   */
  private getGlowSprite(radius: number, color: string, glowSize: number): GlowSprite {
    const key = `${color} ${radius} ${glowSize}`;
    const cached = this.glowSprites.get(key);
    if (cached) {
      return cached;
    }
    const sprite = this.createGlowSprite(radius, color, glowSize);
    this.glowSprites.set(key, sprite);
    return sprite;
  }

  /**
   * Draws a glowing dot into a new image, at the screen's pixel density.
   *
   * @param radius The dot's radius.
   * @param color The dot's and the glow's color.
   * @param glowSize How far the glow reaches beyond the dot.
   * @returns The sprite.
   */
  private createGlowSprite(radius: number, color: string, glowSize: number): GlowSprite {
    const extent = Math.ceil(radius + glowSize);
    const image = document.createElement('canvas');
    image.width = extent * 2 * this.pixelRatio;
    image.height = image.width;
    const context = image.getContext('2d');
    if (!context) {
      throw new Error('No 2D context for a glow sprite, though the main canvas has one');
    }
    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    context.shadowColor = color;
    context.shadowBlur = glowSize;
    context.fillStyle = color;
    context.beginPath();
    context.arc(extent, extent, radius, 0, Math.PI * 2);
    context.fill();
    return { image, extent };
  }
}
