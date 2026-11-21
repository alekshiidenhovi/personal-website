import { type InjectionKey, inject, provide, type ShallowRef } from 'vue';

/** A function that returns the slideshow's scroll container, once it is mounted. */
export type ScrollerGetter = () => HTMLElement;

const SCROLLER_KEY: InjectionKey<ScrollerGetter> = Symbol('slideshow scroller');

/**
 * Creates a getter for a scroller element held in a template ref.
 *
 * @param scrollerRef The template ref of the scroll container.
 * @returns A getter that throws when called before the element is mounted.
 */
export function createScrollerGetter(scrollerRef: Readonly<ShallowRef<HTMLElement | null>>): ScrollerGetter {
  return () => {
    if (!scrollerRef.value) {
      throw new Error('The slideshow scroller is not mounted yet');
    }
    return scrollerRef.value;
  };
}

/**
 * Makes the slideshow's scroll container available to the components inside it.
 *
 * @param getScroller Returns the scroll container.
 */
export function provideSlideshowScroller(getScroller: ScrollerGetter) {
  provide(SCROLLER_KEY, getScroller);
}

/**
 * Gets the scroll container of the slideshow the calling component is in.
 *
 * @returns A getter for the scroll container, to call once mounted.
 */
export function useSlideshowScroller(): ScrollerGetter {
  const getScroller = inject(SCROLLER_KEY);
  if (!getScroller) {
    throw new Error('useSlideshowScroller() must be called in a component inside <SlideshowScroller>');
  }
  return getScroller;
}
