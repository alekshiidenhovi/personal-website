import type { Discipline } from './disciplines';
import type { RoleSlug } from './experience';

/** The visual demoing an area, by name; components/expertise/expertiseVisuals.ts maps each to its component. */
export type ExpertiseVisualId = 'pretraining-run' | 'data-pipeline' | 'ticket-dashboard';

/** An area of expertise, as one slide of the Expertise section. */
export interface ExpertiseArea {
  readonly discipline: Discipline;
  readonly title: string;
  /** What the area covers; key facts between `**` pairs are emphasized (see HighlightedText). */
  readonly text: string;
  /** Shown in the visual's window bar. */
  readonly fileName: string;
  readonly stack: readonly string[];
  readonly visual: ExpertiseVisualId;
  /** The work the visual is based on, linked to its role. */
  readonly source: { readonly label: string; readonly role: RoleSlug };
}

export const EXPERTISE_AREAS: readonly ExpertiseArea[] = [
  {
    discipline: 'machine-learning',
    title: 'Machine Learning',
    text: 'Specialized in **embedding models**: self-supervised representation learning, retrieval and recommendation, taken from research to measured results.',
    fileName: 'pretrain.py',
    stack: ['PyTorch', 'Ray', 'MLflow'],
    visual: 'pretraining-run',
    source: { label: 'Data Scientist @ Supercell', role: 'role-data-scientist' },
  },
  {
    discipline: 'data-foundations',
    title: 'Data Foundations',
    text: 'Analysis, pipelines and data quality on **terabyte-scale data**, from the first query to the production job.',
    fileName: 'pipeline.py',
    stack: ['SQL', 'Spark', 'Databricks'],
    visual: 'data-pipeline',
    source: { label: 'Ticket analysis platform', role: 'role-ml-engineer' },
  },
  {
    discipline: 'web-development',
    title: 'Web Development',
    text: 'Full-stack web apps and dashboards that put data and models in front of the people who use them.',
    fileName: 'dashboard.vue',
    stack: ['React', 'Vue', 'FastAPI', 'PostgreSQL'],
    visual: 'ticket-dashboard',
    source: { label: 'Ticket analysis platform', role: 'role-ml-engineer' },
  },
];
