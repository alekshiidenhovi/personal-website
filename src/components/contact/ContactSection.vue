<script setup lang="ts">
import PinnedSection from '../layout/PinnedSection.vue';
import ContactCta from './ContactCta.vue';
import ContactFooter from './ContactFooter.vue';
import ContactLinks from './ContactLinks.vue';
</script>

<template>
  <PinnedSection id="contact">
    <div class="contact">
      <div class="cta-block">
        <ContactCta />
        <ContactLinks />
      </div>
      <ContactFooter />
    </div>
  </PinnedSection>
</template>

<style scoped>
@import "../../styles/media.css";

/* The call to action centered in the page, the footer at its bottom */
.contact {
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

/* Short screens (phones in landscape): closer together */
@media (--short) {
  .contact,
  .cta-block {
    gap: 1rem;
  }
}
</style>
