import type { Discipline } from './disciplines';

/** A degree, as a card in the Education section. */
export interface Study {
  readonly degree: string;
  readonly school: string;
  /** The minor, or another line about the studies. */
  readonly detail: string;
  readonly startYear: number;
  readonly endYear: number;
  /** The discipline the studies built up, which sets the card's color. */
  readonly discipline: Discipline;
  readonly thesis?: {
    readonly title: string;
    readonly summary: string;
    readonly url: string;
  };
  readonly exchange?: {
    readonly school: string;
    readonly location: string;
    readonly year: number;
    /** The cities the route is drawn between: the exchange and home. */
    readonly route: { readonly from: string; readonly to: string };
  };
}

/** The degrees, newest first. */
export const STUDIES: readonly Study[] = [
  {
    degree: 'MSc Computer Science',
    school: 'Aalto University',
    detail: 'Minor in ML, Data Science & AI',
    startYear: 2024,
    endYear: 2026,
    discipline: 'machine-learning',
    thesis: {
      title: 'Learning self-supervised player embeddings from game event streams',
      summary:
        "Embeddings learned from raw event streams that cut a production in-game content recommender's validation loss by 20%.",
      url: 'https://aaltodoc.aalto.fi/server/api/core/bitstreams/167423ba-5e84-4442-8468-ec644f9e8404/content',
    },
    exchange: {
      school: 'University of Calgary',
      location: 'Calgary, Canada',
      year: 2025,
      route: { from: 'Calgary', to: 'Helsinki' },
    },
  },
  {
    degree: 'BSc Industrial Engineering',
    school: 'Aalto University',
    detail: 'Minor in Data Science',
    startYear: 2020,
    endYear: 2024,
    discipline: 'data-foundations',
  },
];
