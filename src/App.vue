<script setup lang="ts">
import SkillCard from "./components/SkillCard.vue"
</script>

<template>
  <main class="bg-neutral-950 w-screen min-h-screen flex flex-col items-center overflow-y-auto">
    <section id="hero" class="relative w-screen h-screen flex flex-col gap-5 items-center justify-center overflow-hidden">
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vw] h-[60vh] gradient-overlay pointer-events-none"></div>
      <h1 class="font-bold text-9xl tracking-[3px] text-primary-50">Aleks Hiidenhovi</h1>
      <div class="flex gap-8">
        <span class="uppercase text-2xl tracking-[6px] text-primary-500">machine learning</span>
        <span class="uppercase text-2xl tracking-[6px] text-accent-500">data viz</span>
        <span class="uppercase text-2xl tracking-[6px] text-warning-500">full stack</span>
      </div>
    </section>
    <section id="expertise" class="max-w-7xl flex flex-col gap-24 py-24 items-center w-screen h-screen">
      <h2 class="text-primary-600 font-bold text-6xl">Expertise</h2>
      <div class="flex gap-12 h-full w-full">
        <SkillCard upperText="machine" lowerText="learning" />
        <SkillCard upperText="data" lowerText="visualization" />
        <SkillCard upperText="full" lowerText="stack" />
      </div>
    </section>
  </main>
</template>