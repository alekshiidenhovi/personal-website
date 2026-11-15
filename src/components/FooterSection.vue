<script setup lang="ts">
import { Icon } from '@iconify/vue';
import PinnedSection from "./PinnedSection.vue";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hiidenhovi/", icon: "simple-icons:linkedin" },
  { label: "GitHub", href: "https://github.com/alekshiidenhovi", icon: "simple-icons:github" },
];
</script>

<template>
  <PinnedSection id="contact" :index="5" title="Contact"
    subtitle="Building something ambitious in the ML or data space? I'd love to hear about it.">
    <footer>
      <div class="cta-block">
        <a class="big-cta" href="https://www.linkedin.com/in/hiidenhovi/" target="_blank" rel="noreferrer">
          <span>Let's talk<span class="dot">.</span></span>
          <Icon icon="heroicons:arrow-up-right-20-solid" class="big-arrow" />
        </a>
        <div class="social-container">
          <a v-for="link in SOCIAL_LINKS" :key="link.href" :href="link.href" target="_blank" rel="noreferrer"
            class="social-link">
            <Icon :icon="link.icon" class="social-icon" />
            {{ link.label }}
            <Icon icon="heroicons:arrow-up-right-20-solid" class="social-arrow" />
          </a>
        </div>
      </div>
      <div class="bottom-row">
        <span>© 2026 Aleks Hiidenhovi</span>
        <a class="back-to-top" href="#hero">
          Back to top
          <Icon icon="heroicons:arrow-up-20-solid" />
        </a>
      </div>
    </footer>
  </PinnedSection>
</template>

<style scoped>
footer {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 3rem;
  height: 100%;
}

.cta-block {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(1.5rem, 4vh, 3rem);
}

.big-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
  width: fit-content;
  font-size: clamp(3.5rem, min(13vw, 22dvh), 12rem);
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 0.9;
  color: var(--neutral-100);
  text-decoration: none;
  background: linear-gradient(100deg, var(--primary-400), var(--accent-400), var(--warning-400)) no-repeat;
  background-size: 0% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  transition: color 0.4s ease, background-size 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.big-cta:hover {
  color: transparent;
  background-size: 100% 100%;
}

.dot {
  color: var(--primary-400);
}

.big-arrow {
  width: 0.5em;
  height: 0.5em;
  color: var(--text-muted);
  transition: color 0.3s ease, transform 0.3s ease;
}

.big-cta:hover .big-arrow {
  color: var(--warning-400);
  transform: translate(0.1em, -0.1em);
}

.social-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border: 1px solid var(--neutral-800);
  background-color: var(--neutral-900);
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--neutral-200);
  text-decoration: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.social-link:hover {
  border-color: color-mix(in srgb, var(--primary-500), transparent 40%);
  color: var(--primary-300);
}

.social-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.social-arrow {
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  transition: color 0.2s ease, transform 0.2s ease;
}

.social-link:hover .social-arrow {
  color: var(--primary-300);
  transform: translate(2px, -2px);
}

.bottom-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--neutral-800);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.back-to-top {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-to-top:hover {
  color: var(--primary-400);
}
</style>
