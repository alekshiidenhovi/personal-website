<script setup lang="ts">
import { useMatchMedia } from '../../composables/useMatchMedia';
import type { Discipline } from '../../content/disciplines';
import { PHONE_QUERY } from '../../lib/layout';
import VisualPopup from '../ui/VisualPopup.vue';

/**
 * One item of a pinned section, such as a role or an area of expertise: a card in the item's discipline color,
 * beside or above a visual. Phones have no room for the visual, so the card opens it in a popup instead, and the
 * visual on the page isn't rendered at all.
 *
 * Slots:
 * - `info`: the card's content below the title.
 * - `visual`: the visual, rendered on the page and in the popup; gets `{ active, isInPopup }`.
 * - `caption`: a line below the visual on the page.
 *
 * The slide using it can tune the card by setting these custom properties on it, such as on short pages:
 * `--info-gap`, `--info-padding` and `--title-size`, and `--columns` for the text's and the visual's columns.
 */
interface Props {
  discipline: Discipline;
  title: string;
  /** Names the popup's button on phones. */
  popupLabel: string;
  /** Names the popup's dialog. */
  popupTitle: string;
  /** Whether the slide is the one in view, so its visual plays. */
  active: boolean;
  /**
   * Whether the visual takes the height left over when stacked below the card. Otherwise the two share the height
   * evenly.
   */
  fillsHeight?: boolean;
}
const props = withDefaults(defineProps<Props>(), { fillsHeight: false });

const isPhone = useMatchMedia(PHONE_QUERY);
</script>

<template>
  <article class="item-slide" :class="{ 'fills-height': props.fillsHeight }" :data-discipline="props.discipline">
    <!-- The text as a card, grouping the item apart from the section's title and beside or above its visual -->
    <div class="info tinted-card dot-grid">
      <h3>{{ props.title }}</h3>
      <slot name="info" />
      <VisualPopup v-if="isPhone" class="popup" :label="props.popupLabel" :title="props.popupTitle">
        <template #default="{ active }">
          <slot name="visual" :active="active" :is-in-popup="true" />
        </template>
      </VisualPopup>
    </div>

    <figure v-if="!isPhone" class="visual-column">
      <slot name="visual" :active="props.active" :is-in-popup="false" />
      <slot name="caption" />
    </figure>
  </article>
</template>

<style scoped>
@import "../../styles/media.css";

.item-slide {
  display: grid;
  grid-template-columns: var(--columns, minmax(0, 2fr) minmax(0, 3fr));
  align-items: center;
  gap: clamp(2rem, 5vw, 5rem);
  width: 100%;
  height: 100%;
}

.info {
  display: flex;
  flex-direction: column;
  gap: var(--info-gap, 1rem);
  padding: var(--info-padding, clamp(1.5rem, 2.5vw, 2.5rem));
}

/* A clear step below the section's title, the same for every item */
h3 {
  font-size: var(--title-size, clamp(1.75rem, min(3.5vw, 6svh), 2.75rem));
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--neutral-100);
}

/* In the card's top-right corner, the title kept clear of it */
.popup {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.visual-column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.fills-height .visual-column {
  height: 100%;
  max-height: 32rem;
  min-height: 0;
}

/*
 * Side by side on wide screens, the card as tall as the visual: the visual's column spans two rows as a subgrid,
 * the visual sharing the card's row and the caption below.
 */
@media (--wide) {
  .item-slide {
    grid-template-rows: auto auto;
    row-gap: 0.75rem;
    align-content: center;
    align-items: stretch;
  }

  .info {
    grid-row: 1;
    justify-content: center;
  }

  .visual-column,
  .fills-height .visual-column {
    grid-row: 1 / 3;
    display: grid;
    grid-template-rows: subgrid;
    height: auto;
    max-height: none;
  }
}

/* Below lg the visual moves under the card, close enough that the two read as one item */
@media (--below-lg) {
  .item-slide {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: stretch;
    gap: 1.25rem;
  }

  .fills-height {
    justify-content: flex-start;
  }

  .fills-height .visual-column {
    flex: 1;
  }
}

/* Phones: from the top, like the other sections' phone pages, and a compact card */
@media (--phone) {
  .item-slide {
    justify-content: flex-start;
    align-content: start;
  }

  .info {
    padding: var(--info-padding, 1.25rem);
  }

  h3 {
    padding-right: 2.75rem;
    font-size: var(--title-size, 1.5rem);
  }
}

@container page (height < 16rem) {
  .popup {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
