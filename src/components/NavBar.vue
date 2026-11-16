<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { activeSection } from "../composables/useActiveSection";
import { HERO_ID, SECTIONS } from "../data/sections";

// The hero is the landing page; the navigation appears once a section is reached
const isVisible = computed(() => activeSection.value !== HERO_ID);

/*
 * On phones the links scroll sideways and some sit out of view. Reaching a
 * section brings its link into view, once per change, so the bar can still be
 * scrolled freely while on the section.
 */
const navRef = ref<HTMLElement | null>(null);
const linkRefs: HTMLElement[] = [];

watch(activeSection, (id) => {
  const nav = navRef.value;
  const link = linkRefs[SECTIONS.findIndex((candidate) => candidate.id === id)];
  if (!nav || !link) return;
  const navRect = nav.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const overflow =
    linkRect.left < navRect.left ? linkRect.left - navRect.left : Math.max(0, linkRect.right - navRect.right);
  if (overflow) nav.scrollBy({ left: overflow, behavior: "smooth" });
});
</script>

<template>
  <header :class="{ visible: isVisible }" :inert="!isVisible">
    <a :href="`#${HERO_ID}`" class="nav-home" aria-label="Back to start">AH</a>
    <nav ref="navRef">
      <a v-for="(section, index) in SECTIONS" :key="section.id"
        :ref="(el) => { if (el) linkRefs[index] = el as HTMLElement; }" :href="`#${section.id}`" class="nav-link"
        :class="{ active: activeSection === section.id }" :aria-current="activeSection === section.id ? 'location' : undefined">
        <span class="nav-index">{{ String(index + 1).padStart(2, "0") }}</span>
        <span>{{ section.title }}</span>
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
  /* Stays put while the page crossfades on long jumps */
  view-transition-name: site-nav;
  translate: 0 -100%;
  transition: translate 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  /* Same content column as the sections, the home link sits in the left gutter */
  display: grid;
  grid-template-columns: 1fr calc(min(100%, var(--content-width)) - 2 * var(--gutter)) 1fr;
}

header.visible {
  translate: 0 0;
}

nav {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

/* Monogram in the same type and gradient as the hero name */
/* Sized to the letters, so the gradient spans them rather than the whole gutter */
.nav-home {
  justify-self: center;
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  text-decoration: none;
  background: linear-gradient(100deg, var(--primary-400), var(--accent-400) 55%, var(--warning-400));
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  transition: filter 0.2s ease;
}

.nav-home:hover {
  filter: brightness(1.2);
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
  color: var(--text-muted);
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

/* Tablets squeeze the links, so drop their numbering */
@media (width < 48rem) {
  .nav-index {
    display: none;
  }
}

@media (width < 40rem) {
  header {
    display: flex;
  }

  /* Five sections don't fit across a phone, so the bar scrolls sideways */
  nav {
    flex: 1;
    min-width: 0;
    grid-template-columns: repeat(5, auto);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-home {
    margin: 0 0.75rem 0 1.25rem;
    font-size: 1rem;
  }

  .nav-link {
    padding: 1rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
