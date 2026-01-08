<script setup lang="ts">
import ExpertiseCard from "./ExpertiseCard.vue";
import SectionTitle from "./SectionTitle.vue";
</script>

<template>
  <section id="expertise">
    <SectionTitle title="Expertise" />
    <div class="card-container">
      <ExpertiseCard :cardColor="'machine learning'" cardTitle="Machine Learning"
        cardText="End-to-end ML specialist with a proven track record bridging the gap between deep technical research and production applications."
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
      <ExpertiseCard :cardColor="'low level'" cardTitle="Low Level"
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
      <ExpertiseCard :cardColor="'web dev'" cardTitle="Web Dev"
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
  gap: 6rem;
  padding: 6rem 5rem 8rem 5rem;
  width: 100%;
  max-width: 96rem;
  background-color: var(--neutral-950);
}

.card-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}
</style>
