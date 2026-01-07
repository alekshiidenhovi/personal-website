<script setup lang="ts">
import type { Expertise } from "../types";
import ExpertiseCard from "./ExpertiseCard.vue";

</script>

<template>
  <section id="expertise" class="flex w-full max-w-7xl flex-col items-center gap-32 pt-24 pb-32 px-20 bg-neutral-950">
    <h2 class="text-6xl font-bold text-neutral-200">Expertise</h2>
    <div class="flex w-full h-full">
      <ExpertiseCard cardColor="machineLearning" cardTitle="Machine Learning"
        cardText="End-to-end ML specialist with a proven track record bridging the gap between deep technical research and production apps."
        :tags="[
          {
            tagText: 'Python'
          },
          {
            tagText: 'PyTorch'
          },
          {
            tagText: 'W&B'
          }
        ]" />
      <ExpertiseCard cardColor="lowLevel" cardTitle="Low Level"
        cardText="Passionate about low-level optimization. Built foundational systems from assemblers to compilers."
        :tags="[
          {
            tagText: 'Rust'
          },
          {
            tagText: 'C++'
          },
          {
            tagText: 'Assembly'
          }
        ]" />
      <ExpertiseCard cardColor="webDev" cardTitle="Web Dev"
        cardText="Full-stack generalist, with expertise in building data-driven dashboard applications from the ground up."
        :tags="[
          {
            tagText: 'React/NextJS'
          },
          {
            tagText: 'FastAPI'
          },
          {
            tagText: 'TailwindCSS'
          },
          {
            tagText: 'PostgreSQL'
          }
        ]" />
    </div>
  </section>
</template>
