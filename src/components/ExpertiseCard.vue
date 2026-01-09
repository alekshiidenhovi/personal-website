<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { onMounted, ref } from "vue";
import type { Expertise } from "../types";
import Tag from "./Tag.vue";

const tagContainerRef = ref<HTMLDivElement | null>(null);
const showLeftShadow = ref(false);
const showRightShadow = ref(false);
const END_PADDING = 10;

const checkOverflow = () => {
  const el = tagContainerRef.value;
  if (!el) return;

  const { scrollLeft, scrollWidth, clientWidth } = el;
  showLeftShadow.value = scrollLeft > END_PADDING;
  showRightShadow.value = scrollLeft + clientWidth < scrollWidth - END_PADDING;
}

onMounted(() => {
  checkOverflow();
  tagContainerRef.value?.addEventListener('scroll', checkOverflow);
})

interface Props {
  cardColor: Expertise;
  cardTitle: string;
  cardText: string;
  iconName: string;
  tags: {
    tagText: string;
  }[]
}
const props = defineProps<Props>();
</script>

<template>
  <div class="card">
    <div :class="{
      'title-container': true,
      'title-container-ml': cardColor === 'machine learning',
      'title-container-ll': cardColor === 'low level',
      'title-container-wd': cardColor === 'web dev',
    }">
      <Icon :icon="props.iconName" class="icon" />
      <h3>{{ cardTitle }}</h3>
    </div>
    <p>{{ cardText }}</p>
    <div class="tag-container-wrapper" :class="{
      'show-left': showLeftShadow, 'show-right': showRightShadow,
    }">
      <div class="tag-container" ref="tagContainerRef" @scroll="checkOverflow">
        <Tag v-for="tag in props.tags" :color="cardColor" :text="tag.tagText" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  border: 2px solid var(--neutral-700);
  background-color: var(--neutral-900);
  min-height: 12rem;
  flex: 1 1 33.3%;
  min-width: clamp(16rem, 20vw, 24rem);
  max-width: 50%
}


@media (max-width: 57.75rem) {
  .card {
    max-width: 100%;
  }
}

.title-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.title-container-ml {
  color: var(--primary-500);
}

.title-container-ll {
  color: var(--accent-500);
}

.title-container-wd {
  color: var(--warning-500);
}

.title-container .icon {
  width: 2rem;
  height: 2rem;
}

.title-container h3 {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 3px;
  text-transform: uppercase;
}

p {
  color: var(--neutral-500);
  font-size: 1.125rem;
  line-height: calc(1.75 / 1.125);
  flex-grow: 1;
}

.tag-container-wrapper {
  position: relative;
  display: flex;
  width: 100%;
}

.tag-container {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;

  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.tag-container-wrapper::before,
.tag-container-wrapper::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0px;
  z-index: 2;
  pointer-events: none;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  opacity: 0;
}

.tag-container-wrapper::before {
  left: 0;
  background: linear-gradient(to right, var(--neutral-900), transparent);
}

.tag-container-wrapper::after {
  right: 0;
  background: linear-gradient(to left, var(--neutral-900), transparent);
}

.show-left::before {
  opacity: 1;
  width: 40px;
}

.show-right::after {
  opacity: 1;
  width: 40px;
}
</style>
