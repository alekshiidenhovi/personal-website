<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { gsap } from "gsap";
import { tv } from "tailwind-variants";
import type { Expertise } from "../types";

interface Props {
  upperText: string;
  lowerText: string;
  expertise: Expertise;
}
const props = defineProps<Props>();

const COLS = 30;
const ROWS = 20;
const TILE_COUNT = COLS * ROWS;

const ANIMATION_DURATION_LOWER_BOUND_SECONDS = 0.3
const ANIMATION_DURATION_UPPER_BOUND_SECONDS = 0.3
const ANIMATION_DELAY_LOWER_BOUND_SECONDS = 0.0
const ANIMATION_DELAY_UPPER_BOUND_SECONDS = 0.5 

const cardStyles = tv({
  base:
    "relative flex flex-col gap-2 p-8 border-2 text-center justify-center uppercase tracking-[3px] rounded-2xl w-full h-full text-3xl bg-linear-to-br from-neutral-900 to-neutral-95 transition-all cursor-pointer duration-300 overflow-hidden",
  variants: {
    color: {
      machineLearning:
        "border-primary-500/50 text-primary-500/50 hover:border-primary-500 hover:text-primary-500",
      dataViz:
        "border-dataviz-500/50 text-dataviz-500/50 hover:border-dataviz-500 hover:text-dataviz-500",
      fullStack:
        "border-fullstack-500/50 text-fullstack-500/50 hover:border-fullstack-500 hover:text-fullstack-500",
    },
  },
});

const gridRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!gridRef.value) return;

  const root = gridRef.value;
  const tiles = Array.from(root.querySelectorAll<HTMLDivElement>(".tile"));
  const timeline = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });

  tiles.forEach((el) => {
    const duration = gsap.utils.random(ANIMATION_DURATION_LOWER_BOUND_SECONDS, ANIMATION_DURATION_UPPER_BOUND_SECONDS);  
    const delay = gsap.utils.random(ANIMATION_DELAY_LOWER_BOUND_SECONDS, ANIMATION_DELAY_UPPER_BOUND_SECONDS);
    timeline.to(el, { opacity: 0, duration, ease: "power2.inOut" }, delay);
  });

  const onEnter = () => {
    timeline.play();
  };

  const onLeave = () => {
    timeline.reverse();
  };

  root.addEventListener("mouseenter", onEnter);
  root.addEventListener("mouseleave", onLeave);

  onBeforeUnmount(() => {
    root.removeEventListener("mouseenter", onEnter);
    root.removeEventListener("mouseleave", onLeave);
    timeline.kill();
  });
});
</script>

<template>
  <div :class="cardStyles({ color: expertise })" ref="gridRef">
    <span class="w-full z-10 relative">{{ upperText }}</span>
    <span class="w-full z-10 relative">{{ lowerText }}</span>
    <div
      class="absolute inset-0 pointer-events-none grid"
      :style="{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`
      }"
    >
      <div v-for="i in TILE_COUNT" :key="i" class="tile opacity-100 bg-neutral-900 will-change-[opacity]"></div>
    </div>
  </div>
</template>