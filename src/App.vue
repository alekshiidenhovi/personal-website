<script setup lang="ts">
import EducationSection from "./components/EducationSection.vue";
import ExpertiseSection from "./components/ExpertiseSection.vue";
import FooterSection from "./components/FooterSection.vue";
import HeroSection from "./components/HeroSection.vue";
import NavBar from "./components/NavBar.vue";
import ProfessionalExperienceSection from "./components/ProfessionalExperienceSection.vue";
import ProjectsSection from "./components/ProjectsSection.vue";
import { usePinnedLayout } from "./composables/usePinnedLayout";
import { useSlideshow } from "./composables/useSlideshow";

usePinnedLayout();
useSlideshow();
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <ExpertiseSection />
    <ProfessionalExperienceSection />
    <ProjectsSection />
    <EducationSection />
    <FooterSection />
  </main>
  <div class="grain" aria-hidden="true"></div>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100svh;
  width: 100%;
  background-color: var(--neutral-950);
}

/* Subtle film grain over the whole page */
.grain {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
</style>
