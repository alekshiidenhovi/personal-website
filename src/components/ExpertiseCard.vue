<script setup lang="ts">
import { tv } from "tailwind-variants";
import type { Expertise } from "../types";
import Tag from "./Tag.vue";

interface Props {
  cardColor: Expertise;
  cardTitle: string;
  cardText: string;
  tags: {
    tagText: string;
  }[]
}
const props = defineProps<Props>();

const titleStyles = tv({
  base: "text-2xl font-normal tracking-[3px] uppercase",
  variants: {
    color: {
      machineLearning: "text-primary-500",
      lowLevel: "text-accent-500",
      webDev: "text-warning-500",
    },
  },
});

</script>

<template>
  <div class="flex flex-col gap-6 p-8 border-2 border-neutral-700 bg-neutral-900 w-full">
    <div>
      <h3 :class="titleStyles({ color: cardColor })">{{ cardTitle }}</h3>
    </div>
    <p class="text-neutral-500 text-lg font-normal">{{ cardText }}</p>
    <div class="flex gap-3 w-full overflow-x-auto">
      <Tag v-for="tag in props.tags" :color="cardColor" :text="tag.tagText" />
    </div>
  </div>
</template>
