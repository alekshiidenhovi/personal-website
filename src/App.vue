<script setup lang="ts">
import SkillCard from "./components/SkillCard.vue";
</script>

<template>
  <main
    class="flex min-h-screen w-screen flex-col items-center overflow-y-auto bg-neutral-950"
  >
    <section
      id="hero"
      class="relative flex h-screen w-screen flex-col items-center justify-center gap-5 overflow-hidden"
    >
      <div
        class="gradient-overlay pointer-events-none absolute top-0 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 transform"
      ></div>
      <h1 class="text-primary-50 text-9xl font-bold tracking-[3px]">
        Aleks Hiidenhovi
      </h1>
      <div class="flex gap-8">
        <span class="text-primary-500 text-2xl tracking-[6px] uppercase"
          >machine learning</span
        >
        <span class="text-dataviz-500 text-2xl tracking-[6px] uppercase"
          >data viz</span
        >
        <span class="text-fullstack-500 text-2xl tracking-[6px] uppercase"
          >full stack</span
        >
      </div>
    </section>
    <section
      id="expertise"
      class="flex h-[95vh] w-full max-w-7xl flex-col items-center gap-24 py-24"
    >
      <h2 class="text-6xl font-bold text-neutral-200">Expertise</h2>
      <div class="flex h-full w-full gap-12">
        <SkillCard
          expertise="machineLearning"
          upperText="machine"
          lowerText="learning"
        />
        <SkillCard
          expertise="dataViz"
          upperText="data"
          lowerText="visualization"
        />
        <SkillCard expertise="fullStack" upperText="full" lowerText="stack" />
      </div>
    </section>
  </main>
</template>
