<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import Icon from './Icon.vue';

/**
 * A button that opens a visual in a modal dialog, for phones, where the page has no room to show it. A compact
 * expand icon, for the parent to place, such as in a card's corner. The visual is rendered only while open, and
 * its slot gets `{ active }`, so it plays while shown. The native dialog handles focus, the backdrop and closing
 * with Esc.
 */
interface Props {
  /** Names the button, which shows only an icon. */
  label: string;
  /** Names the dialog, shown above the visual. */
  title: string;
}
const props = defineProps<Props>();

const dialogRef = useTemplateRef<HTMLDialogElement>('dialog');
const isOpen = ref(false);

/**
 * Gets the dialog element.
 *
 * @returns The dialog.
 */
function getDialog(): HTMLDialogElement {
  if (!dialogRef.value) {
    throw new Error('VisualPopup needs its dialog mounted');
  }
  return dialogRef.value;
}

/** Opens the dialog and renders the visual in it. */
function openDialog() {
  getDialog().showModal();
  isOpen.value = true;
}

/** Closes the dialog; its `close` event then removes the visual. */
function closeDialog() {
  getDialog().close();
}

/**
 * Closes the dialog when the click landed on its backdrop.
 *
 * @param event The click.
 */
function closeOnBackdropClick(event: MouseEvent) {
  // A click on the backdrop targets the dialog element itself, outside its body
  if (event.target === getDialog()) {
    closeDialog();
  }
}
</script>

<template>
  <div class="visual-popup">
    <button type="button" class="open-button" :aria-label="props.label" :title="props.label" @click="openDialog">
      <Icon icon="heroicons:arrows-pointing-out-20-solid" />
    </button>
    <dialog ref="dialog" class="dialog" :aria-label="props.title" @close="isOpen = false" @click="closeOnBackdropClick">
      <div class="dialog-body">
        <header class="dialog-header">
          <span>{{ props.title }}</span>
          <button type="button" class="close-button" aria-label="Close" @click="closeDialog">
            <Icon icon="heroicons:x-mark-20-solid" />
          </button>
        </header>
        <slot v-if="isOpen" :active="isOpen" />
      </div>
    </dialog>
  </div>
</template>

<style scoped>
/* A small square, sized to a card's title, with a larger touch target around it */
.open-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid color-mix(in srgb, var(--card-color) 45%, var(--neutral-700));
  background-color: color-mix(in srgb, var(--card-color), var(--neutral-950) 90%);
  color: var(--card-color);
  cursor: pointer;
}

.open-button::before {
  content: "";
  position: absolute;
  inset: -0.25rem;
}

.open-button svg {
  width: 1rem;
  height: 1rem;
}

.dialog {
  /* Almost the screen's full width, so the visual is drawn as large as a phone allows */
  width: min(100% - 1rem, 40rem);
  /* Lifts the browser's own limits on a modal dialog's size, which leave wider margins */
  max-width: none;
  max-height: calc(100% - 1rem);
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
  padding: 0.75rem;
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
