<script setup lang="ts">
import ContactSection from './components/contact/ContactSection.vue';
import HeroSection from './components/hero/HeroSection.vue';
import NavBar from './components/layout/NavBar.vue';
import PinnedSection from './components/layout/PinnedSection.vue';
import SlideshowScroller from './components/layout/SlideshowScroller.vue';
import FilmGrain from './components/ui/FilmGrain.vue';
</script>

<template>
  <!-- The nav sits inside the scroller, so the wheel scrolls the page over it too -->
  <SlideshowScroller>
    <NavBar />
    <main>
      <HeroSection />
      <!-- Placeholders with each section's page count, until the sections are built -->
      <PinnedSection id="expertise" :page-count="3" />
      <PinnedSection id="professional-experience" :page-count="4" />
      <PinnedSection id="projects" :page-count="2" />
      <PinnedSection id="education" />
      <ContactSection />
    </main>
  </SlideshowScroller>
  <FilmGrain />
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
</style>
