<template>
  <section id="hero">
    <div class="gradient-overlay"></div>
    <h1>
      Aleks Hiidenhovi
    </h1>
    <div class="subtitle-container">
      <span class="subtitle-base subtitle-ml">machine learning</span>
      <span class="subtitle-base subtitle-ll">low level</span>
      <span class="subtitle-base subtitle-wd">web dev</span>
    </div>
  </section>
</template>

<style scoped>
#hero {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100dvh;
  width: 100dvw;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 2vw, 1.25rem);
  overflow: hidden;
  padding: clamp(2rem, 2vw, 4rem);
}

.gradient-overlay {
  background-image: radial-gradient(ellipse 60dvw 50dvh at center top,
      color-mix(in srgb, var(--primary-600), transparent 75%) 0%,
      color-mix(in srgb, var(--primary-600), transparent 88%) 20%,
      color-mix(in srgb, var(--primary-600), transparent 94%) 35%,
      color-mix(in srgb, var(--primary-600), transparent 97%) 50%,
      color-mix(in srgb, var(--primary-600), transparent 99.85%) 65%,
      color-mix(in srgb, var(--primary-600), transparent 99.95%) 80%,
      transparent 100%);
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 50%;
  height: 60dvh;
  width: 120dvw;
  transform: translateX(-50%);
}

h1 {
  color: var(--primary-50);
  font-size: clamp(3.5rem, 10vw, 8rem);
  letter-spacing: 3px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
}

.subtitle-container {
  display: flex;
  gap: clamp(1rem, 2vw, 2rem);
}

.subtitle-base {
  font-size: clamp(0.8rem, 2vw, 1.5rem);
  letter-spacing: clamp(0.25rem, 1vw, 0.375rem);
  text-transform: uppercase;
  line-height: 1.33;
}

.subtitle-ml {
  color: var(--primary-500);
}

.subtitle-ll {
  color: var(--accent-500);
}

.subtitle-wd {
  color: var(--warning-500);
}
</style>
