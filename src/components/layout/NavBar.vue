<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import { useActiveSection } from '../../composables/useActiveSection';
import { getSectionHref, HERO_ID, SECTIONS } from '../../content/sections';

/** The site navigation: a link per section, hidden on the hero and highlighting the section in view. */

const activeSectionId = useActiveSection([HERO_ID, ...SECTIONS.map((section) => section.id)]);
const isVisible = computed(() => activeSectionId.value !== HERO_ID);

const linksRef = useTemplateRef<HTMLElement>('links');
// Indexed by section, as refs collected in a v-for don't keep their order
const linkElements: HTMLElement[] = [];

/**
 * Stores a link's element as it mounts.
 *
 * @param element The link element, or null as it unmounts.
 * @param sectionIndex The index of the link's section.
 */
function setLinkElement(element: unknown, sectionIndex: number) {
  if (element instanceof HTMLElement) {
    linkElements[sectionIndex] = element;
  }
}

/**
 * Scrolls the links sideways to bring a section's link into view, on phones, where the links overflow the bar.
 * Runs once per section change, so the bar can still be scrolled freely in between.
 *
 * @param sectionId The section whose link to show.
 */
function scrollLinkIntoView(sectionId: string) {
  const links = linksRef.value;
  const link = linkElements[SECTIONS.findIndex((section) => section.id === sectionId)];
  if (!links || !link) {
    return;
  }
  const linksBox = links.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  const overflow =
    linkBox.left < linksBox.left ? linkBox.left - linksBox.left : Math.max(0, linkBox.right - linksBox.right);
  if (overflow !== 0) {
    links.scrollBy({ left: overflow, behavior: 'smooth' });
  }
}

watch(activeSectionId, scrollLinkIntoView);
</script>

<template>
  <header :class="{ visible: isVisible }" :inert="!isVisible">
    <a :href="getSectionHref(HERO_ID)" class="home" aria-label="Back to start">AH</a>
    <nav ref="links" :style="{ '--link-count': SECTIONS.length }">
      <a v-for="(section, sectionIndex) in SECTIONS" :key="section.id"
        :ref="(element) => setLinkElement(element, sectionIndex)" :href="getSectionHref(section.id)" class="link"
        :class="{ active: activeSectionId === section.id }"
        :aria-current="activeSectionId === section.id ? 'location' : undefined">
        <span class="number">{{ String(sectionIndex + 1).padStart(2, '0') }}</span>
        <span>{{ section.title }}</span>
      </a>
    </nav>
  </header>
</template>

<style scoped>
@import "../../styles/media.css";

header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr calc(min(100%, var(--content-width)) - 2 * var(--gutter)) 1fr;
  border-bottom: 1px solid var(--neutral-800);
  background-color: color-mix(in srgb, var(--neutral-950), transparent 20%);
  backdrop-filter: blur(12px);
  translate: 0 -100%;
  transition: translate 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  /* Keeps the bar out of the crossfade on long jumps */
  view-transition-name: site-nav;
}

header.visible {
  translate: 0 0;
}

nav {
  grid-column: 2;
  display: grid;
  grid-template-columns: repeat(var(--link-count), minmax(0, 1fr));
}

/* Sized to the letters, so the gradient spans them rather than the whole gutter */
.home {
  justify-self: center;
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  text-decoration: none;
  background: linear-gradient(100deg, var(--primary-400), var(--accent-400) 55%, var(--warning-400));
  background-clip: text;
  color: transparent;
  transition: filter 0.2s ease;
}

.home:hover {
  filter: brightness(1.2);
}

.link {
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
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.link:last-child {
  border-right: 1px solid var(--neutral-800);
}

.number {
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.link:hover {
  color: var(--neutral-100);
}

.link.active {
  color: var(--neutral-100);
  background-color: color-mix(in srgb, var(--primary-500), transparent 90%);
}

.link.active .number {
  color: var(--primary-400);
}

.link::after {
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

.link.active::after {
  transform: scaleX(1);
}

@media (--below-md) {
  .number {
    display: none;
  }
}

/* The links overflow a phone's width, so they scroll sideways */
@media (--below-sm) {
  header {
    display: flex;
  }

  nav {
    flex: 1;
    min-width: 0;
    grid-template-columns: repeat(var(--link-count), auto);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .home {
    margin: 0 0.75rem 0 1.25rem;
    font-size: 1rem;
  }

  .link {
    padding: 1rem 0.5rem;
    font-size: 0.75rem;
  }
}
</style>
