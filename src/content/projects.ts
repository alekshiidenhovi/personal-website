import { DISCIPLINE_LABELS, type Discipline } from './disciplines';

/** What a project is tagged with: its discipline, or a side project, as low-level work is a hobby. */
export type ProjectTag = Discipline | 'side-project';

/** The cover drawn for a project, by name; components/projects/projectCovers.ts maps each to its component. */
export type ProjectCoverId = 'basic' | 'colvit' | 'portfolio' | 'sispa' | 'compiler' | 'assembler';

/** A project, as a card in the Projects section. */
export interface Project {
  readonly title: string;
  readonly description: string;
  readonly tag: ProjectTag;
  readonly url: string;
  /** What the link leads to, shown on the card. */
  readonly linkLabel: 'source' | 'live demo';
  readonly cover: ProjectCoverId;
  /** Describes the cover for screen readers. */
  readonly coverDescription: string;
}

/** How each tag is named on the page. */
export const PROJECT_TAG_LABELS: Readonly<Record<ProjectTag, string>> = {
  ...DISCIPLINE_LABELS,
  'side-project': 'side project',
};

/** Ordered so each page mixes tags, and with them card colors. */
export const PROJECTS: readonly Project[] = [
  {
    title: 'BASIC interpreter',
    description: 'Classic programming language, interactable in browser',
    tag: 'side-project',
    url: 'https://basic-interpreter-web-editor.hiidenhovi-aleks.workers.dev',
    linkLabel: 'live demo',
    cover: 'basic',
    coverDescription: 'A CRT monitor running a BASIC program',
  },
  {
    title: 'ColViT',
    description: 'Late interaction image retrieval',
    tag: 'machine-learning',
    url: 'https://github.com/alekshiidenhovi/colvit-face',
    linkLabel: 'source',
    cover: 'colvit',
    coverDescription: 'A query image searched against a gallery of images',
  },
  {
    title: 'Portfolio website',
    description: 'Designed and built with coding agents',
    tag: 'web-development',
    url: 'https://github.com/alekshiidenhovi/personal-website',
    linkLabel: 'source',
    cover: 'portfolio',
    coverDescription: 'A wireframe of this website',
  },
  {
    title: 'SISPA',
    description: 'End-to-end machine unlearning framework',
    tag: 'machine-learning',
    url: 'https://github.com/alekshiidenhovi/SISPA',
    linkLabel: 'source',
    cover: 'sispa',
    coverDescription: 'Sharded models aggregated into one prediction, with one shard unlearned',
  },
  {
    title: 'C-- compiler',
    description: 'C17 subset compiler, built from scratch in Rust',
    tag: 'side-project',
    url: 'https://github.com/alekshiidenhovi/C--',
    linkLabel: 'source',
    cover: 'compiler',
    coverDescription: 'A compiler pipeline from C source to syntax tree to assembly',
  },
  {
    title: 'HACK assembler',
    description: 'Two-pass assembler for HACK computing platform',
    tag: 'side-project',
    url: 'https://github.com/alekshiidenhovi/HACK-assembler',
    linkLabel: 'source',
    cover: 'assembler',
    coverDescription: 'HACK assembly translated into binary machine code',
  },
];
