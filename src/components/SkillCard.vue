<script setup lang="ts">
import { gsap } from "gsap";
import { tv } from "tailwind-variants";
import { onBeforeUnmount, onMounted, ref } from "vue";

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

const ANIMATION_DURATION_LOWER_BOUND_SECONDS = 0.3;
const ANIMATION_DURATION_UPPER_BOUND_SECONDS = 0.3;
const ANIMATION_DELAY_LOWER_BOUND_SECONDS = 0.0;
const ANIMATION_DELAY_UPPER_BOUND_SECONDS = 0.5;

const cardStyles = tv({
  base: "to-neutral-95 relative flex h-full w-full cursor-pointer flex-col justify-center gap-2 overflow-hidden rounded-2xl border-2 bg-linear-to-br from-neutral-900 p-8 text-center text-3xl tracking-[3px] uppercase shadow-xl transition-all duration-300 hover:shadow-2xl",
  variants: {
    color: {
      machineLearning: "border-primary-500 text-primary-500 shadow-primary-500",
      dataViz: "border-dataviz-500 text-dataviz-500 shadow-dataviz-500",
      fullStack: "border-fullstack-500 text-fullstack-500 shadow-fullstack-500",
    },
  },
});

const gridRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!gridRef.value) return;

  const root = gridRef.value;
  const tiles = Array.from(root.querySelectorAll<HTMLDivElement>(".tile"));
  const timeline = gsap.timeline({
    paused: true,
    defaults: { overwrite: "auto" },
  });

  tiles.forEach((el) => {
    const duration = gsap.utils.random(
      ANIMATION_DURATION_LOWER_BOUND_SECONDS,
      ANIMATION_DURATION_UPPER_BOUND_SECONDS,
    );
    const delay = gsap.utils.random(
      ANIMATION_DELAY_LOWER_BOUND_SECONDS,
      ANIMATION_DELAY_UPPER_BOUND_SECONDS,
    );
    timeline.to(el, { opacity: 1, duration, ease: "power2.inOut" }, delay);
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
    <span class="w-full">{{ upperText }}</span>
    <span class="w-full">{{ lowerText }}</span>
    <div
      class="pointer-events-none absolute inset-0 grid"
      :style="{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }"
    >
      <div
        v-for="i in TILE_COUNT"
        :key="i"
        class="tile z-10 bg-neutral-900 opacity-0 will-change-[opacity]"
      ></div>
    </div>
  </div>
</template>
