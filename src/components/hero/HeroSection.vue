<script setup lang="ts">
import { CV } from "../../content/contact";
import { getSectionHref, HERO_ID } from "../../content/sections";
import ButtonLink from "../ui/ButtonLink.vue";
import EmbeddingSpace from "./EmbeddingSpace.vue";
import HeroScrollCue from "./HeroScrollCue.vue";
import HeroStatus from "./HeroStatus.vue";
import HeroTitle from "./HeroTitle.vue";
</script>

<template>
  <!-- A slide stop of its own, like each page of the sections -->
  <section :id="HERO_ID" class="hero" data-slide>
    <div class="glow"></div>
    <div class="content">
      <div class="intro">
        <HeroTitle />
        <div class="actions">
          <ButtonLink :href="getSectionHref('professional-experience')" icon="heroicons:arrow-down-20-solid">See my work</ButtonLink>
          <!-- Trailing like the primary's arrow; up-right as it opens in a new tab -->
          <ButtonLink :href="CV.href" variant="secondary" icon="heroicons:arrow-up-right-20-solid" external>
            View {{ CV.label }}
          </ButtonLink>
        </div>
        <HeroStatus href="#role-data-scientist">Data Scientist at Supercell</HeroStatus>
      </div>
      <EmbeddingSpace class="embedding" />
    </div>
    <HeroScrollCue :href="getSectionHref('expertise')" label="Scroll to expertise" />
  </section>
</template>

<style scoped>
@import "../../styles/media.css";

.hero {
  position: relative;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100svh;
  width: 100%;
  overflow: hidden;
  padding: clamp(6rem, 10vh, 8rem) var(--gutter) clamp(5rem, 10vh, 7rem);
}

/* Fades the hero into the page below */
.hero::after {
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
    radial-gradient(
      ellipse 40rem 25rem at 50% 110%,
      color-mix(in srgb, var(--warning-600), transparent 90%),
      transparent
    );
}

.content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(2rem, 5vw, 6rem);
  width: 100%;
  /* The hero pads its gutters outside this box, so the column matches the sections' */
  max-width: calc(var(--content-width) - 2 * var(--gutter));
}

.intro {
  /* A size container, so the name can be capped to the column's width */
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 2vw, 1.5rem);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

/* Below lg the embedding space stacks below the introduction */
@media (--below-lg) {
  .content {
    grid-template-columns: 1fr;
  }

  .embedding {
    max-width: 32rem;
  }
}

/* Tablets in portrait: everything spans the content width, the actions share a row, the embedding fills what's left */
@media (--tablet-portrait) {
  .hero {
    padding-block: 4rem;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .embedding {
    max-width: none;
    max-height: 40svh;
    aspect-ratio: 4 / 3;
  }
}

/* Phones: the introduction alone fills the screen; the actions full width, one above the other */
@media (--phone) {
  .hero {
    padding-block: 4rem;
  }

  .embedding {
    display: none;
  }

  .actions {
    display: grid;
  }
}

/* Short screens (phones in landscape): tighter, and the actions on one row, which the width allows */
@media (--short) {
  .hero {
    padding-block: 1.25rem;
  }

  .intro {
    gap: 0.75rem;
  }

  .actions {
    grid-template-columns: repeat(2, auto);
    justify-content: start;
    padding-top: 0;
  }
}
</style>
