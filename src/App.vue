<script setup lang="ts">
import HeroSection from "./components/hero/HeroSection.vue";
import FilmGrain from "./components/ui/FilmGrain.vue";
</script>

<template>
  <main>
    <HeroSection />
  </main>
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
