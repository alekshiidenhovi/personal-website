<script setup lang="ts">
import ExpertiseSection from "./components/ExpertiseSection.vue";
import FooterSection from "./components/FooterSection.vue";
import HeroSection from "./components/HeroSection.vue";
import ProfessionalExperienceSection from "./components/ProfessionalExperienceSection.vue";
import ProjectsSection from "./components/ProjectsSection.vue";
</script>

<template>
  <main>
    <HeroSection />
    <ExpertiseSection />
    <ProjectsSection />
    <ProfessionalExperienceSection />
    <FooterSection />
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
