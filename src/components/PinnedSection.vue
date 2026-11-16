<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useViewportUpdates } from "../composables/useViewportUpdates";
import { SECTIONS, type SectionId } from "../data/sections";
import { prefersReducedMotion } from "../lib/motion";
import Icon from "./Icon.vue";
import SectionTitle from "./SectionTitle.vue";

/**
 * A full-screen slide: the title and stage stay pinned while the section
 * scrolls past, and the section's pages slide sideways with the scroll. The
 * page snaps (see `scroll-snap-type` in style.css) to one stop per page, so a
 * swipe, wheel step or key press settles on a whole page, and a fast one can't
 * skip any.
 *
 * Scroll progress through the section, from 0 on the first page to
 * pageCount - 1 on the last, is written to `--progress` on the section, and
 * everything that moves with the pages reads it, so nothing can fall out of step.
 *
 * The default slot is rendered once per page with `{ page, active }`, where
 * `active` is the current page while the section is on screen, so visuals only
 * play while visible. Multi-page sections show a page indicator next to the
 * title and, with a mouse or trackpad on a wide screen, arrows in the side
 * margins that fade and change color with the progress.
 */

interface Props {
  id: SectionId;
  pageCount?: number;
  /** Anchor ids for the pages, so in-page links can target a single page; numbered after the section by default */
  pageIds?: string[];
  /** Each page's color, which the arrows blend between as the pages slide; blue by default */
  pageColors?: string[];
  keepSubtitleOnPhones?: boolean;
}
const props = withDefaults(defineProps<Props>(), { pageCount: 1 });

const index = SECTIONS.findIndex((section) => section.id === props.id);
const { title, subtitle } = SECTIONS[index];

const pageId = (page: number) => props.pageIds?.[page] ?? `${props.id}-${page + 1}`;

const sectionRef = ref<HTMLElement | null>(null);
const stopRefs: HTMLElement[] = [];
const activePage = ref(0);
const isInView = ref(false);
let visibilityObserver: IntersectionObserver | null = null;

/*
 * Each arrow click moves one page on from the last click's target, not from
 * wherever the pages are mid-slide, so quick clicks step one page each and
 * never past the end.
 */
let targetPage: number | null = null;

/** Reads progress from where the stops sit, so it matches the snapping exactly */
const updateProgress = () => {
  const stops = stopRefs.slice(0, props.pageCount);
  const section = sectionRef.value;
  if (!section || !stops.length) return;
  const first = stops[0].getBoundingClientRect().top;
  const pageScroll = stops.length > 1 ? stops[1].getBoundingClientRect().top - first : 1;
  const progress = Math.min(Math.max(-first / pageScroll, 0), props.pageCount - 1);
  section.style.setProperty("--progress", String(progress));
  activePage.value = Math.round(progress);

  // The arrows' color, partway from the page being left to the one coming in
  const color = (page: number) => props.pageColors?.[page] ?? "var(--primary-400)";
  section.style.setProperty("--arrow-from", color(Math.floor(progress)));
  section.style.setProperty("--arrow-to", color(Math.ceil(progress)));
  section.style.setProperty("--arrow-mix", `${(progress % 1) * 100}%`);
  if (targetPage !== null && Math.abs(progress - targetPage) < 0.01) targetPage = null;
};


const step = (direction: 1 | -1) => {
  const target = Math.min(Math.max((targetPage ?? activePage.value) + direction, 0), props.pageCount - 1);
  targetPage = target;
  window.scrollTo({
    top: stopRefs[target].getBoundingClientRect().top + window.scrollY,
    behavior: prefersReducedMotion ? "instant" : "smooth",
  });
};

useViewportUpdates(updateProgress);

const formatPageNumber = (page: number) => String(page).padStart(2, "0");

onMounted(() => {
  // A section merely touching the viewport's edge reports as intersecting, so require visible overlap
  visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      isInView.value = entry.intersectionRatio > 0;
    },
    { threshold: [0, 0.01] },
  );
  if (sectionRef.value) visibilityObserver.observe(sectionRef.value);
});

onUnmounted(() => visibilityObserver?.disconnect());
</script>

<template>
  <section :id="props.id" ref="sectionRef" class="pinned-section" :style="{ '--page-count': props.pageCount }">
    <!-- Snap stops, one per page; each carries its page's anchor id, so links and loaded URLs land on it -->
    <span v-for="n in props.pageCount" :id="props.pageCount > 1 ? pageId(n - 1) : undefined" :key="n"
      :ref="(el) => { if (el) stopRefs[n - 1] = el as HTMLElement; }" class="slide-stop" data-slide
      :style="{ '--page': n - 1 }"></span>
    <div class="stage">
      <SectionTitle :index="index + 1" :title="title" :subtitle="subtitle"
        :keep-subtitle-on-phones="props.keepSubtitleOnPhones">
        <nav v-if="props.pageCount > 1" class="page-indicator" :aria-label="`${title} pages`">
          <!-- Links to the pages' stops, which crossfade like the nav's links -->
          <a v-for="n in props.pageCount" :key="n" :href="`#${pageId(n - 1)}`" class="page-tick"
            :class="{ current: n - 1 === activePage }" :aria-label="`Page ${n}`"
            :aria-current="n - 1 === activePage ? 'step' : undefined"></a>
          <span class="page-number">{{ formatPageNumber(activePage + 1) }} / {{ formatPageNumber(props.pageCount)
            }}</span>
        </nav>
      </SectionTitle>
      <div class="pages-frame">
        <div class="pages">
          <div class="track">
            <!-- Pages off to the side can't be focused or clicked -->
            <div v-for="n in props.pageCount" :key="n" class="page" :inert="n - 1 !== activePage">
              <slot :page="n - 1" :active="isInView && n - 1 === activePage" />
            </div>
          </div>
        </div>
        <template v-if="props.pageCount > 1">
          <!-- Disabled at the ends, where they have faded out, so they can't be clicked or focused unseen -->
          <button type="button" class="slide-arrow previous" aria-label="Previous page" :disabled="activePage === 0"
            @click="step(-1)">
            <Icon icon="heroicons:arrow-left" />
          </button>
          <button type="button" class="slide-arrow next" aria-label="Next page"
            :disabled="activePage === props.pageCount - 1" @click="step(1)">
            <Icon icon="heroicons:arrow-right" />
          </button>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pinned-section {
  /* Scroll distance between pages */
  --page-scroll: 50svh;
  --page-gap: var(--gutter);
  position: relative;
  width: 100%;
  height: calc(100svh + (var(--page-count) - 1) * var(--page-scroll));
}

/* Chrome ignores zero-size snap areas, hence the 1px size */
.slide-stop {
  position: absolute;
  top: calc(var(--page) * var(--page-scroll));
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.stage {
  /*
   * On screens taller than 16:10 the extra height is split above and below
   * the slide instead of stretching it. The root font size follows
   * min(vw, vh), so a rem height caps the slide's aspect ratio.
   */
  --letterbox: max(0px, (100svh - 68rem) / 2);
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(1.25rem, 3vh, 2.5rem);
  height: 100svh;
  max-width: var(--content-width);
  margin: 0 auto;
  padding:
    calc(var(--nav-height) + 1rem + var(--letterbox)) var(--gutter) calc(clamp(1.5rem, 4vh, 3rem) + var(--letterbox));
}

.page-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* A thin bar with a taller hit area */
.page-tick {
  width: 1.75rem;
  padding: 0.625rem 0;
  background: linear-gradient(var(--neutral-700), var(--neutral-700)) center / 100% 2px no-repeat;
  transition: background 0.3s ease;
}

.page-tick:hover {
  background-image: linear-gradient(var(--neutral-400), var(--neutral-400));
}

.page-tick.current {
  background-image: linear-gradient(var(--primary-400), var(--primary-400));
}

.page-number {
  margin-left: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.pages-frame {
  position: relative;
  flex-grow: 1;
  min-height: 0;
}

/* Clipped, not hidden: a hidden overflow could still be scrolled sideways by focus or find-in-page */
.pages {
  height: 100%;
  overflow: clip;
}

/*
 * Centered in the side margins, so showing them never moves the content. Only
 * with a mouse or trackpad on a wide screen; touch screens move the pages by
 * swiping up and down. Their fade and color come from --progress, so they
 * change exactly as the pages slide.
 */
.slide-arrow {
  --size: min(2.75rem, var(--gutter) - 0.5rem);
  position: absolute;
  top: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  width: var(--size);
  height: var(--size);
  border: 1px solid color-mix(in srgb, currentColor 55%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--neutral-950), transparent 30%);
  color: color-mix(in oklch, var(--arrow-from, var(--primary-400)), var(--arrow-to, var(--primary-400)) var(--arrow-mix, 0%));
  cursor: pointer;
  translate: -50% -50%;
  transition: background-color 0.2s ease;
}

.slide-arrow svg {
  width: 45%;
  height: 45%;
}

.slide-arrow:hover {
  background-color: color-mix(in srgb, currentColor 14%, var(--neutral-950));
}

.slide-arrow:disabled {
  pointer-events: none;
}

.previous {
  left: calc(var(--gutter) / -2);
  opacity: min(1, var(--progress, 0));
}

.next {
  left: calc(100% + var(--gutter) / 2);
  opacity: min(1, calc(var(--page-count) - 1 - var(--progress, 0)));
}

/* Short screens (phones in landscape) need every line for the slide */
@media (height < 30rem) {
  .stage {
    gap: 0.75rem;
    padding-top: calc(var(--nav-height) + 0.5rem);
    padding-bottom: 0.75rem;
  }
}

@media (hover: hover) and (pointer: fine) and (width >= 64rem) {
  .slide-arrow {
    display: flex;
  }
}

/* The pages side by side, moved one page width (plus the gap) per unit of progress */
.track {
  display: flex;
  gap: var(--page-gap);
  height: 100%;
  transform: translateX(calc(var(--progress, 0) * (-100% - var(--page-gap))));
}

/* A page too tall for the screen scrolls on its own, as a last resort; pages are designed to fit */
.page {
  flex: 0 0 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>
