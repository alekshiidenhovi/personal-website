<template>
  <hgroup class="title">
    <h1>
      <span class="name-first">Aleks</span>
      <span class="name-last">Hiidenhovi</span>
    </h1>
    <p class="headline">Full-stack data scientist</p>
    <p class="pitch">From raw data to real products, at terabyte scale.</p>
  </hgroup>
</template>

<style scoped>
@import "../../styles/media.css";

/* Spaced like the column it sits in, so the name, headline and pitch step down evenly with what follows */
.title {
  display: flex;
  flex-direction: column;
  gap: inherit;
}

h1 {
  display: flex;
  flex-direction: column;
  /*
   * Scales with the window, but never past the column (the nearest size
   * container): "Hiidenhovi" is about 4.8em wide, so 20cqi keeps it inside.
   * Its gradient only paints within the column, so overflowing letters would
   * be cut off.
   */
  font-size: min(clamp(3.25rem, 9vw, 9.5rem), 20cqi);
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

/* Tablets in portrait: the last name runs edge to edge, the lines below it full width */
@media (--tablet-portrait) {
  h1 {
    font-size: 17vw;
  }

  .headline,
  .pitch {
    font-size: 1.375rem;
  }

  .pitch {
    max-width: none;
  }
}

/* Short screens (phones in landscape): a smaller name */
@media (--short) {
  h1 {
    font-size: min(clamp(2.5rem, 9vw, 9.5rem), 20cqi, 14svh);
  }
}
</style>
