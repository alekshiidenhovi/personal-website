/*
 * The icons the site uses, as inline SVG so they render with the page. Data
 * from Heroicons (MIT) and Simple Icons (CC0); add any new icon here before
 * using it with the Icon component.
 */
export const ICONS = {
  'heroicons:arrow-up-right-20-solid': {
    viewBox: '0 0 20 20',
    body: '<path fill="currentColor" fill-rule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06" clip-rule="evenodd"/>',
  },
  'heroicons:arrow-down': {
    viewBox: '0 0 24 24',
    body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"/>',
  },
  'heroicons:arrow-down-20-solid': {
    viewBox: '0 0 20 20',
    body: '<path fill="currentColor" fill-rule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3" clip-rule="evenodd"/>',
  },
} as const;

export type IconName = keyof typeof ICONS;
