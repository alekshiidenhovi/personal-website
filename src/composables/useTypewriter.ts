import { onMounted, onUnmounted, ref } from "vue";

const TYPE_DELAY_MS = 55;
const DELETE_DELAY_MS = 25;
const HOLD_DELAY_MS = 2200;

/** Types each phrase out, holds it, deletes it and moves on to the next one. */
export function useTypewriter(phrases: string[]) {
  const phraseIndex = ref(0);
  const text = ref(phrases[0]);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const tick = (isDeleting: boolean) => {
    const phrase = phrases[phraseIndex.value];

    if (!isDeleting && text.value === phrase) {
      timeoutId = setTimeout(() => tick(true), HOLD_DELAY_MS);
      return;
    }

    if (isDeleting && text.value === "") {
      phraseIndex.value = (phraseIndex.value + 1) % phrases.length;
      timeoutId = setTimeout(() => tick(false), TYPE_DELAY_MS);
      return;
    }

    text.value = isDeleting ? phrase.slice(0, text.value.length - 1) : phrase.slice(0, text.value.length + 1);
    timeoutId = setTimeout(() => tick(isDeleting), isDeleting ? DELETE_DELAY_MS : TYPE_DELAY_MS);
  };

  onMounted(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timeoutId = setTimeout(() => tick(true), HOLD_DELAY_MS);
  });

  onUnmounted(() => clearTimeout(timeoutId));

  return { text, phraseIndex };
}
