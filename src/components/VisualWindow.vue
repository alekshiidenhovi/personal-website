<script setup lang="ts">
/** An app-window frame around an expertise visual, titled with a file name, in the card's color */
defineProps<{ fileName: string }>();
</script>

<template>
  <div class="window">
    <header class="window-bar">
      <span class="window-dots"><span></span><span></span><span></span></span>
      <span class="file-name">{{ fileName }}</span>
    </header>
    <div class="visual-container">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--card-color), transparent 50%);
  background-color: var(--neutral-900);
  box-shadow: 0 2rem 6rem -3rem color-mix(in srgb, var(--card-color), transparent 50%);
}

.window-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--neutral-800);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-400);
}

.window-dots {
  display: flex;
  gap: 0.5rem;
}

.window-dots span {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: var(--card-color);
}

/* A size container, so visuals can scale their type to the window */
.visual-container {
  container-type: inline-size;
  flex-grow: 1;
  display: flex;
  align-items: center;
  min-height: min(40svh, 24rem);
  /* Tighter on short windows, which need the height for the visual */
  padding: clamp(1rem, min(2.5vw, 4svh), 2rem);
}

@media (width < 64rem) {
  .visual-container {
    min-height: 20rem;
  }
}
</style>
