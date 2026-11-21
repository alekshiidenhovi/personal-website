<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { usePreservedSlidePosition } from '../../composables/usePreservedSlidePosition';
import { useSlideNavigation } from '../../composables/useSlideNavigation';
import { createScrollerGetter, provideSlideshowScroller } from '../../composables/useSlideshowScroller';

/**
 * The page's scroll container, turning its content into a slideshow: every scroll settles on a slide (any element
 * marked `data-slide`), the keyboard and in-page links move between slides, and the reader stays on their slide
 * through layout changes and reloads. Components inside reach the container with useSlideshowScroller().
 *
 * The page scrolls in here rather than in the document because Safari resizes its toolbars while the document
 * scrolls, which changes the viewport mid-scroll and makes it snap a second time. An inner scroller keeps the
 * viewport, and with it every slide's size, fixed.
 */

const scrollerRef = useTemplateRef<HTMLElement>('scroller');
const getScroller = createScrollerGetter(scrollerRef);

provideSlideshowScroller(getScroller);
useSlideNavigation(getScroller);
usePreservedSlidePosition(getScroller);
</script>

<template>
  <div ref="scroller" class="slideshow-scroller">
    <slot />
  </div>
</template>

<style scoped>
.slideshow-scroller {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}
</style>
