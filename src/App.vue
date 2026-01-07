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
  <main class="flex min-h-screen w-screen flex-col items-center overflow-y-auto bg-neutral-950">
    <HeroSection />
    <ExpertiseSection />
  </main>
</template>
