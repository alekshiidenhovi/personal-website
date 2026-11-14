<script setup lang="ts">
import { EXPERTISE_AREAS, EXPERTISE_COLOR } from "../data/expertise";
</script>

<template>
  <div class="terminal">
    <div class="window-bar">
      <span v-for="area in EXPERTISE_AREAS" :key="area.expertise" class="window-dot"
        :style="{ backgroundColor: EXPERTISE_COLOR[area.expertise] }"></span>
      <span class="window-title">~/aleks — zsh</span>
    </div>
    <pre class="content"><span class="prompt">$</span> cat stack.json
<span class="punct">{</span>
<template v-for="(area, areaIndex) in EXPERTISE_AREAS" :key="area.expertise">  <span class="key" :style="{ color: EXPERTISE_COLOR[area.expertise] }">"{{ area.expertise }}"</span><span class="punct">: [</span>
<template v-for="(tag, tagIndex) in area.tags" :key="tag">    <span class="string">"{{ tag }}"</span><span class="punct">{{ tagIndex < area.tags.length - 1 ? "," : "" }}</span>
</template>  <span class="punct">]{{ areaIndex < EXPERTISE_AREAS.length - 1 ? "," : "" }}</span>
</template><span class="punct">}</span></pre>
  </div>
</template>

<style scoped>
.terminal {
  width: 100%;
  border: 1px solid var(--neutral-800);
  background-color: color-mix(in srgb, var(--neutral-900), transparent 20%);
  backdrop-filter: blur(16px);
  box-shadow: 0 2rem 6rem -2rem color-mix(in srgb, var(--primary-600), transparent 60%);
}

.window-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--neutral-800);
}

.window-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.window-title {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--neutral-500);
}

.content {
  padding: 1.25rem 1.5rem;
  font-family: var(--font-mono);
  font-size: clamp(0.75rem, 0.9vw, 0.875rem);
  line-height: 1.7;
  color: var(--neutral-300);
  overflow-x: auto;
}

.prompt {
  color: var(--success-400);
}

.punct {
  color: var(--neutral-500);
}

.string {
  color: var(--neutral-200);
}

</style>
