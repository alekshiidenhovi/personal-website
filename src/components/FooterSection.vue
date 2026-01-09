<template>
  <footer>
    Copyright © 2026 by Aleks Hiidenhovi
  </footer>
</template>

<style scoped>
footer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: clamp(3rem, 5vw, 6rem);
  background: linear-gradient(to bottom, var(--neutral-950), var(--neutral-900));
  font-size: clamp(0.875rem, 1.5vw, 1.125rem);
  font-weight: 500;
  color: var(--neutral-500);
  text-align: center;
}
</style>
