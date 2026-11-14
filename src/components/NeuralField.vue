<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

/**
 * Animated "neural network" backdrop: drifting nodes in the three expertise
 * colors, linked when close to each other and to the pointer.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const COLOR_VARS = ["--primary-500", "--accent-500", "--warning-500"];
const COLOR_WEIGHTS = [0.6, 0.25, 0.15];
const AREA_PER_NODE = 16000;
const LINK_DISTANCE = 140;
const POINTER_DISTANCE = 200;
const SPEED = 0.25;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pointer = { x: -9999, y: -9999 };
let nodes: Node[] = [];
let frameId = 0;
let isVisible = true;
let resizeObserver: ResizeObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;

const pickColor = (colors: string[]) => {
  const roll = Math.random();
  let cumulative = 0;
  for (const [i, weight] of COLOR_WEIGHTS.entries()) {
    cumulative += weight;
    if (roll < cumulative) return colors[i];
  }
  return colors[0];
};

const createNodes = (width: number, height: number) => {
  const styles = getComputedStyle(document.documentElement);
  const colors = COLOR_VARS.map((name) => styles.getPropertyValue(name).trim());
  const count = Math.round((width * height) / AREA_PER_NODE);
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * SPEED * 2,
    vy: (Math.random() - 0.5) * SPEED * 2,
    radius: Math.random() * 1.5 + 0.75,
    color: pickColor(colors),
  }));
};

const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
  createNodes(width, height);
};

const drawLink = (ctx: CanvasRenderingContext2D, a: Node, bx: number, by: number, strength: number) => {
  ctx.globalAlpha = strength;
  ctx.strokeStyle = a.color;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(bx, by);
  ctx.stroke();
};

const step = (animate: boolean) => {
  const canvas = canvasRef.value;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 0.6;

  for (const node of nodes) {
    if (animate) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < LINK_DISTANCE) drawLink(ctx, a, b.x, b.y, (1 - distance / LINK_DISTANCE) * 0.35);
    }
    const pointerDistance = Math.hypot(a.x - pointer.x, a.y - pointer.y);
    if (pointerDistance < POINTER_DISTANCE) {
      drawLink(ctx, a, pointer.x, pointer.y, (1 - pointerDistance / POINTER_DISTANCE) * 0.8);
    }
  }

  for (const node of nodes) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fill();
  }
};

const loop = () => {
  if (isVisible) step(true);
  frameId = requestAnimationFrame(loop);
};

const onPointerMove = (event: PointerEvent) => {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
};

const onPointerLeave = () => {
  pointer.x = -9999;
  pointer.y = -9999;
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  resize();

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    step(false);
    return;
  }

  visibilityObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });
  visibilityObserver.observe(canvas);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  loop();
});

onUnmounted(() => {
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  visibilityObserver?.disconnect();
  window.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerleave", onPointerLeave);
});
</script>

<template>
  <canvas ref="canvasRef" aria-hidden="true"></canvas>
</template>

<style scoped>
canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
