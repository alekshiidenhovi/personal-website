<script setup lang="ts">
/** A visual's run state: a dot and a label. Active pulses in the visual's color, success holds green, idle rests gray. */
interface Props {
  label: string;
  tone: 'active' | 'success' | 'idle';
  /** The palette of the visual, which colors the active state. */
  color: 'primary' | 'accent' | 'warning';
}
const props = defineProps<Props>();
</script>

<template>
  <span class="status" :class="[props.tone, props.color]">{{ props.label }}</span>
</template>

<style scoped>
.status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--status-text);
}

.status::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--status-dot);
}

.primary {
  --status-text: var(--primary-300);
  --status-dot: var(--primary-400);
}

.accent {
  --status-text: var(--accent-300);
  --status-dot: var(--accent-400);
}

.warning {
  --status-text: var(--warning-300);
  --status-dot: var(--warning-400);
}

.active::before {
  animation: pulse 1.2s ease-in-out infinite;
}

.success {
  --status-text: var(--success-400);
  --status-dot: var(--success-400);
}

.idle {
  --status-text: var(--neutral-400);
  --status-dot: var(--neutral-500);
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
