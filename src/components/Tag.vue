<script setup lang="ts">
import type { Expertise } from "../types";
import { tv } from "tailwind-variants";

interface Props {
  color: Expertise;
  text: string;
}
const props = defineProps<Props>();

const tagStyles = tv({
  base: "border-2 bg-neutral-800 px-5 py-2",
  variants: {
    color: {
      machineLearning: "text-primary-500 border-neutral-800",
      lowLevel: "text-accent-500 border-neutral-800",
      webDev: "text-warning-500 border-neutral-800",
    },
  },
});

</script>

<template>
  <div :class="tagStyles({ color: props.color })">
    {{ text }}
  </div>
</template>
