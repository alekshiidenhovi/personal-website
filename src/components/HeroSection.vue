<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useTypewriter } from "../composables/useTypewriter";
import { EXPERTISE_COLOR } from "../data/expertise";
import type { Expertise } from "../types";
import NeuralField from "./NeuralField.vue";
import TerminalCard from "./TerminalCard.vue";

const FOCUS_AREAS: { expertise: Expertise; phrase: string }[] = [
  { expertise: "machine learning", phrase: "ML systems that ship to production." },
  { expertise: "low level", phrase: "compilers, assemblers & interpreters." },
  { expertise: "web dev", phrase: "data-driven dashboards, end to end." },
];

const { text, phraseIndex } = useTypewriter(FOCUS_AREAS.map((area) => area.phrase));
</script>

<template>
  <section id="hero" data-slide>
    <NeuralField />
    <div class="glow"></div>
    <div class="content">
      <div class="intro">
        <span class="prompt"><span class="prompt-path">~/aleks</span> $ whoami</span>
        <h1>
          <span class="name-first">Aleks</span>
          <span class="name-last">Hiidenhovi</span>
        </h1>
        <p class="typed-line">
          I build
          <span class="typed" :style="{ color: EXPERTISE_COLOR[FOCUS_AREAS[phraseIndex].expertise] }">{{ text }}</span>
        </p>
        <p class="pitch">
          Machine learning engineer bridging deep technical research and production systems,
          working across <span class="hl-ml">machine learning</span>, <span class="hl-ll">low level systems</span>
          and <span class="hl-wd">web dev</span>.
        </p>
        <div class="cta-container">
          <a class="cta cta-primary" href="#projects">
            See selected work
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
      </div>
      <TerminalCard class="terminal" />
    </div>
    <a class="scroll-cue" href="#expertise" aria-label="Scroll to expertise">
      <span>scroll</span>
      <span class="scroll-line"></span>
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

.prompt {
  font-family: var(--font-mono);
  font-size: clamp(0.875rem, 1.2vw, 1rem);
  color: var(--neutral-400);
}

.prompt-path {
  color: var(--success-400);
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

.typed-line {
  min-height: 1.5em;
  font-family: var(--font-mono);
  font-size: clamp(1rem, 1.8vw, 1.5rem);
  color: var(--neutral-300);
}

.typed {
  font-weight: 500;
  transition: color 0.3s ease;
}

.typed::after {
  content: "";
  display: inline-block;
  width: 0.55em;
  height: 1.1em;
  margin-left: 0.15em;
  vertical-align: text-bottom;
  background-color: currentColor;
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

.pitch {
  max-width: 38rem;
  font-size: clamp(1rem, 1.3vw, 1.2rem);
  line-height: 1.65;
  color: var(--neutral-400);
}

.hl-ml {
  color: var(--primary-400);
}

.hl-ll {
  color: var(--accent-400);
}

.hl-wd {
  color: var(--warning-400);
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

.terminal {
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  50% {
    transform: translateY(-0.75rem);
  }
}

.scroll-cue {
  position: absolute;
  bottom: clamp(1.25rem, 3vh, 2.5rem);
  left: 50%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  translate: -50% 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 3px;
  color: var(--neutral-500);
  text-decoration: none;
}

.scroll-line {
  position: relative;
  width: 1px;
  height: 3rem;
  overflow: hidden;
  background-color: var(--neutral-800);
}

.scroll-line::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--primary-400);
  animation: scroll-hint 2s ease-in-out infinite;
}

@keyframes scroll-hint {
  from {
    translate: 0 -100%;
  }

  to {
    translate: 0 100%;
  }
}

@media (max-width: 64rem) {
  .content {
    grid-template-columns: 1fr;
  }

  .terminal {
    display: none;
  }
}
</style>
