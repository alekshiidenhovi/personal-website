<script setup lang="ts">
import { tv } from 'tailwind-variants';
import type { Expertise } from '../types';

interface Props {
    upperText: string
    lowerText: string
    expertise: Expertise
}

const props = defineProps<Props>()
 
const cardStyles = tv({
  base: 'flex flex-col gap-2 p-8 border-2 items-center justify-center uppercase tracking-[3px] rounded-2xl w-full h-full text-3xl bg-linear-to-br from-neutral-900 to-neutral-95 transition-all cursor-pointer duration-300',
  variants: {
    color: {
      machineLearning: 'border-primary-500/50 text-primary-500/50 hover:border-primary-500 hover:text-primary-500',
      dataViz: 'border-dataviz-500/50 text-dataviz-500/50 hover:border-dataviz-500 hover:text-dataviz-500',
      fullStack: 'border-fullstack-500/50 text-fullstack-500/50 hover:border-fullstack-500 hover:text-fullstack-500'
    }
  }
});
</script>

<template>
    <div :class="cardStyles({ color: expertise })">
      <span>{{ upperText }}</span>
      <span>{{ lowerText }}</span>
    </div>
  </template>