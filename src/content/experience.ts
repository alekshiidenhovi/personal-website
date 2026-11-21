import type { YearMonth } from '../lib/dates';
import type { Discipline } from './disciplines';

/** The anchor id of a role's slide. Typed, so a renamed role can't leave a link pointing nowhere. */
export type RoleSlug = 'role-data-scientist' | 'role-ml-engineer' | 'role-data-analyst' | 'role-software-developer';

/** A company worked for. */
export type CompanyId = 'supercell' | 'veri';

/** How a company is named and linked to. */
export interface Company {
  readonly name: string;
  readonly url: string;
}

/** The figure illustrating a role, by name; components/experience/roleFigures.ts maps each to its component. */
export type RoleFigureId =
  | 'self-supervised-embeddings'
  | 'topic-modeling-pipeline'
  | 'markov-growth'
  | 'llm-classification';

/** A position held, as one slide of the Experience section. */
export interface Role {
  readonly slug: RoleSlug;
  readonly title: string;
  readonly company: CompanyId;
  readonly start: YearMonth;
  /** The last month, or undefined while the role is ongoing. */
  readonly end?: YearMonth;
  /** The discipline the role highlights, which sets its color. */
  readonly discipline: Discipline;
  /** What the role achieved; key facts between `**` pairs are emphasized (see HighlightedText). */
  readonly highlights: readonly string[];
  readonly figure: RoleFigureId;
  readonly figureCaption: string;
}

export const COMPANIES: Readonly<Record<CompanyId, Company>> = {
  supercell: { name: 'Supercell', url: 'https://www.supercell.com/' },
  veri: { name: 'Veri', url: 'https://www.veri.co/' },
};

/** The roles, newest first. */
export const ROLES: readonly Role[] = [
  {
    slug: 'role-data-scientist',
    title: 'Data Scientist',
    company: 'supercell',
    start: { year: 2026, month: 2 },
    discipline: 'machine-learning',
    highlights: [
      'Trained a self-supervised player embedding on terabyte-scale game event streams, adapting LeJEPA to event sequences, so models can take player context off the shelf.',
      "Cut a production in-game content recommender's **validation loss by 20%** when added to aggregated features, and matched them when used on its own.",
    ],
    figure: 'self-supervised-embeddings',
    figureCaption: 'Learned vs. aggregated features',
  },
  {
    slug: 'role-ml-engineer',
    title: 'Machine Learning Engineer',
    company: 'supercell',
    start: { year: 2023, month: 9 },
    end: { year: 2024, month: 12 },
    discipline: 'machine-learning',
    highlights: [
      'Built an end-to-end ticket analysis platform to surface the issues players face daily across all games for Player Support and game teams.',
      'Replacing a manual reporting chain through hundreds of agents brought feedback in **minutes rather than days**, higher-quality analysis of every ticket, and more time to serve players.',
    ],
    figure: 'topic-modeling-pipeline',
    figureCaption: 'Ticket analysis pipeline',
  },
  {
    slug: 'role-data-analyst',
    title: 'Data Analyst Intern',
    company: 'supercell',
    start: { year: 2023, month: 1 },
    end: { year: 2023, month: 8 },
    discipline: 'data-foundations',
    highlights: [
      'Designed a Markovian growth model where no shared model for growth and engagement existed; it is **still in use at the company today**.',
      'Prototyped AI support tools, such as semantic ticket search and LLM chatbots, which **led to the ticket analysis platform** I built next.',
    ],
    figure: 'markov-growth',
    figureCaption: 'Markovian growth model',
  },
  {
    slug: 'role-software-developer',
    title: 'Software Developer Intern',
    company: 'veri',
    start: { year: 2022, month: 6 },
    end: { year: 2022, month: 8 },
    discipline: 'machine-learning',
    highlights: [
      'Applied GPT-3 to support ticket classification in a proof of concept, months before ChatGPT launched.',
    ],
    figure: 'llm-classification',
    figureCaption: 'LLM ticket classification',
  },
];

/**
 * Gets the in-page link to a role's slide.
 *
 * @param slug The role's slug.
 * @returns The link's href.
 */
export function getRoleHref(slug: RoleSlug): string {
  return `#${slug}`;
}
