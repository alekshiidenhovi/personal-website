<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

const LINKS = [
  { label: "Expertise", id: "expertise" },
  { label: "Projects", id: "projects" },
  { label: "Experience", id: "professional-experience" },
  { label: "Contact", id: "contact" },
];
const HERO_ID = "hero";

const activeId = ref(HERO_ID);
// The hero is the landing page; the navigation appears once a section is reached
const isVisible = computed(() => activeId.value !== HERO_ID);
let sectionObserver: IntersectionObserver | null = null;

onMounted(() => {
  // A section counts as active while it crosses the middle of the viewport
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeId.value = entry.target.id;
      }
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  for (const id of [HERO_ID, ...LINKS.map((link) => link.id)]) {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  }
});

onUnmounted(() => {
  sectionObserver?.disconnect();
});
</script>

<template>
  <header :class="{ visible: isVisible }" :inert="!isVisible">
    <nav>
      <a v-for="(link, index) in LINKS" :key="link.id" :href="`#${link.id}`" class="nav-link"
        :class="{ active: activeId === link.id }" :aria-current="activeId === link.id ? 'location' : undefined">
        <span class="nav-index">0{{ index + 1 }}</span>
        <span>{{ link.label }}</span>
      </a>
    </nav>
  </header>
</template>

<style scoped>
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-bottom: 1px solid var(--neutral-800);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 20%);
  backdrop-filter: blur(12px);
  translate: 0 -100%;
  transition: translate 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

header.visible {
  translate: 0 0;
}

/* Same content width and gutters as the sections */
nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 96rem;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 5vw, 5rem);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  padding: 1.125rem 1rem;
  border-left: 1px solid var(--neutral-800);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.nav-link:last-child {
  border-right: 1px solid var(--neutral-800);
}

.nav-index {
  color: var(--neutral-600);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--neutral-100);
}

.nav-link.active {
  color: var(--neutral-100);
  background-color: color-mix(in srgb, var(--primary-500), transparent 90%);
}

.nav-link.active .nav-index {
  color: var(--primary-400);
}

.nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background-color: var(--primary-400);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.nav-link.active::after {
  transform: scaleX(1);
}

@media (max-width: 40rem) {
  .nav-link {
    padding: 1rem 0.5rem;
    font-size: 0.75rem;
  }

  .nav-index {
    display: none;
  }
}
</style>
