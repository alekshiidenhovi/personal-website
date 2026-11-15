<script setup lang="ts">
import { Icon } from '@iconify/vue';
import EmbeddingSpace from "./EmbeddingSpace.vue";
</script>

<template>
  <section id="hero" data-slide>
    <div class="glow"></div>
    <div class="content">
      <div class="intro">
        <h1>
          <span class="name-first">Aleks</span>
          <span class="name-last">Hiidenhovi</span>
        </h1>
        <p class="headline">Full-stack data scientist</p>
        <p class="pitch">From raw data to real products, at terabyte scale.</p>
        <div class="cta-container">
          <a class="cta cta-primary" href="#professional-experience">
            See my work
            <Icon icon="heroicons:arrow-down-20-solid" class="cta-icon" />
          </a>
          <a class="cta cta-secondary" href="https://www.linkedin.com/in/hiidenhovi/" target="_blank" rel="noreferrer">
            <Icon icon="simple-icons:linkedin" class="cta-icon" />
            LinkedIn
          </a>
          <a class="cta cta-secondary" href="https://github.com/alekshiidenhovi" target="_blank" rel="noreferrer">
            <Icon icon="simple-icons:github" class="cta-icon" />
            GitHub
          </a>
        </div>
        <a class="status" href="#role-data-scientist">
          <span class="status-dot"></span>
          Employed at Supercell
        </a>
      </div>
      <EmbeddingSpace class="embedding" />
    </div>
    <a class="scroll-cue" href="#expertise" aria-label="Scroll to expertise">
      <Icon icon="heroicons:arrow-down" class="scroll-arrow" />
    </a>
  </section>
</template>

<style scoped>
#hero {
  position: relative;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  width: 100%;
  overflow: hidden;
  padding: clamp(6rem, 10vh, 8rem) clamp(1.25rem, 5vw, 5rem) clamp(5rem, 10vh, 7rem);
}

#hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 12rem;
  background: linear-gradient(to bottom, transparent, var(--neutral-950));
  pointer-events: none;
}

.glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 50rem 30rem at 20% 0%, color-mix(in srgb, var(--primary-600), transparent 80%), transparent),
    radial-gradient(ellipse 40rem 30rem at 90% 40%, color-mix(in srgb, var(--accent-600), transparent 88%), transparent),
    radial-gradient(ellipse 40rem 25rem at 50% 110%, color-mix(in srgb, var(--warning-600), transparent 90%), transparent);
}

.content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 6rem);
  width: 100%;
  max-width: 96rem;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

h1 {
  display: flex;
  flex-direction: column;
  font-size: clamp(3.25rem, 9vw, 9.5rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.name-first {
  color: var(--neutral-100);
}

.name-last {
  background: linear-gradient(100deg, var(--primary-400) 0%, var(--accent-400) 55%, var(--warning-400) 100%);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: shimmer 8s ease-in-out infinite alternate;
}

@keyframes shimmer {
  to {
    background-position: 100% 0;
  }
}

.headline {
  font-family: var(--font-mono);
  font-size: clamp(1rem, 1.8vw, 1.5rem);
  font-weight: 500;
  color: var(--primary-300);
}

.pitch {
  max-width: 38rem;
  font-size: clamp(1.125rem, 1.6vw, 1.5rem);
  line-height: 1.5;
  color: var(--neutral-300);
}

.status {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.625rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.2s ease;
}

.status:hover {
  color: var(--neutral-100);
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--success-400);
  box-shadow: 0 0 0.5rem var(--success-400);
}

.cta-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.375rem;
  border: 1px solid transparent;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.cta:hover {
  transform: translateY(-2px);
}

.cta-primary {
  color: var(--neutral-950);
  background-color: var(--primary-400);
}

.cta-primary:hover {
  background-color: var(--primary-300);
}

.cta-secondary {
  color: var(--neutral-200);
  border-color: var(--neutral-700);
  background-color: color-mix(in srgb, var(--neutral-900), transparent 40%);
}

.cta-secondary:hover {
  border-color: var(--primary-500);
  color: var(--primary-300);
}

.cta-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.scroll-cue {
  position: absolute;
  bottom: clamp(1.25rem, 3vh, 2.5rem);
  left: 50%;
  z-index: 1;
  display: flex;
  padding: 0.5rem;
  translate: -50% 0;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.scroll-cue:hover,
.scroll-cue:focus-visible {
  color: var(--primary-400);
}

.scroll-arrow {
  width: 1.5rem;
  height: 1.5rem;
  animation: scroll-hint 2.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* Bob downward, brightening at the lowest point to lead the eye down */
@keyframes scroll-hint {
  0%,
  100% {
    translate: 0 -0.25rem;
    opacity: 0.4;
  }

  50% {
    translate: 0 0.5rem;
    opacity: 1;
  }
}

/* Narrower screens stack the embedding space below the introduction */
@media (max-width: 64rem) {
  .content {
    grid-template-columns: 1fr;
  }

  .embedding {
    max-width: 32rem;
  }
}

/* Phones: one full-width primary action, the two profiles side by side below it */
@media (max-width: 40rem) {
  /* Taller than the screen here, so start near the top instead of centering */
  #hero {
    padding-top: 3rem;
  }

  .cta-container {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cta {
    justify-content: center;
  }

  .cta-primary {
    grid-column: 1 / -1;
  }
}
</style>
