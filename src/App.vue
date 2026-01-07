<script lang="ts">
import HeroSection from "./components/HeroSection.vue";
import ExpertiseSection from "./components/ExpertiseSection.vue";

/**
 * Root component for the personal website
 */
export default {
  name: "App",
  components: {
    HeroSection,
    ExpertiseSection
  },
  setup() { }
}
</script>

<template>
  <main>
    <HeroSection />
    <ExpertiseSection />
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  width: 100dvw;
  overflow-y: auto;
  background-color: var(--neutral-950);
}
</style>
