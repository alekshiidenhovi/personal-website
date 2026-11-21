/**
 * A discipline the work falls into. An element marked with `data-discipline` takes its color (see
 * styles/utilities.css).
 */
export type Discipline = 'machine-learning' | 'data-foundations' | 'web-development';

/** How each discipline is named on the page. */
export const DISCIPLINE_LABELS: Readonly<Record<Discipline, string>> = {
  'machine-learning': 'machine learning',
  'data-foundations': 'data foundations',
  'web-development': 'web development',
};
