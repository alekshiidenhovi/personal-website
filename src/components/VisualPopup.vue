<script setup lang="ts">
import { ref } from "vue";
import Icon from "./Icon.vue";

/**
 * A button that opens a visual in a modal dialog, for phones, where the page
 * has no room to show it. The visual is only rendered while open, and its slot
 * gets `{ active }` so it plays while shown. The native dialog handles focus,
 * the backdrop and closing with Esc.
 */
interface Props {
  label: string;
  /** Names the dialog, shown above the visual */
  title: string;
}
const props = defineProps<Props>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const isOpen = ref(false);

const open = () => {
  dialogRef.value?.showModal();
  isOpen.value = true;
};
const close = () => dialogRef.value?.close();
// A click on the backdrop lands on the dialog element itself, outside its body
const onDialogClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value) close();
};
</script>

<template>
  <div class="visual-popup">
    <button type="button" class="open-button" @click="open">
      {{ props.label }}
      <Icon icon="heroicons:arrow-up-right-20-solid" class="open-icon" />
    </button>
    <dialog ref="dialogRef" class="dialog" :aria-label="props.title" @close="isOpen = false" @click="onDialogClick">
      <div class="dialog-body">
        <header class="dialog-header">
          <span class="dialog-title">{{ props.title }}</span>
          <button type="button" class="close-button" aria-label="Close" @click="close">
            <Icon icon="heroicons:x-mark-20-solid" />
          </button>
        </header>
        <slot v-if="isOpen" :active="isOpen" />
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.open-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid color-mix(in srgb, var(--card-color) 45%, var(--neutral-700));
  background-color: color-mix(in srgb, var(--card-color), var(--neutral-950) 90%);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-200);
  cursor: pointer;
}

.open-icon {
  width: 1rem;
  height: 1rem;
  color: var(--card-color);
}

.dialog {
  width: min(100% - 2rem, 40rem);
  max-height: calc(100% - 2rem);
  margin: auto;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--card-color), transparent 50%);
  background-color: var(--neutral-950);
  color: inherit;
  overscroll-behavior: contain;
}

.dialog::backdrop {
  background-color: color-mix(in srgb, var(--neutral-950), transparent 20%);
  backdrop-filter: blur(6px);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--neutral-300);
}

.close-button {
  display: flex;
  padding: 0.375rem;
  border: 1px solid var(--neutral-700);
  background: none;
  color: var(--neutral-300);
  cursor: pointer;
}

.close-button svg {
  width: 1.125rem;
  height: 1.125rem;
}
</style>
