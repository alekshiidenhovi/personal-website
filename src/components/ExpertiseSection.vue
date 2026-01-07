<script setup lang="ts">
import ExpertiseCard from "./ExpertiseCard.vue";
</script>

<template>
  <section id="expertise">
    <h2>Expertise</h2>
    <div class="card-container">
      <ExpertiseCard cardColor="machineLearning" cardTitle="Machine Learning"
        cardText="End-to-end ML specialist with a proven track record bridging the gap between deep technical research and production apps."
        iconName="heroicons:adjustments-vertical-solid" :tags="[
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
        iconName="heroicons:cpu-chip-solid" :tags="[
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
        iconName="heroicons:globe-alt-solid" :tags="[
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

<style scoped>
#expertise {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rem;
  padding: 6rem 5rem 8rem 5rem;
  width: 100%;
  max-width: 96rem;
  background-color: var(--neutral-950);
}

h2 {
  font-size: 3.75rem;
  font-weight: 700;
  color: var(--neutral-200);
}

.card-container {
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  height: 100%;
  width: 100%;
}
</style>
