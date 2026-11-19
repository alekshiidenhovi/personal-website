import type { Component } from "vue";
import AssemblerCover from "../components/covers/AssemblerCover.vue";
import BasicCover from "../components/covers/BasicCover.vue";
import ColvitCover from "../components/covers/ColvitCover.vue";
import CompilerCover from "../components/covers/CompilerCover.vue";
import PortfolioCover from "../components/covers/PortfolioCover.vue";
import SispaCover from "../components/covers/SispaCover.vue";
import type { Expertise } from "../types";
import { EXPERTISE_COLOR } from "./expertise";

/** Low-level work is a hobby, so it is tagged as a side project rather than a discipline */
export type ProjectTag = Expertise | "side project";

export const PROJECT_TAG_COLOR: Record<ProjectTag, string> = {
  ...EXPERTISE_COLOR,
  "side project": "var(--neutral-400)",
};

export interface Project {
  title: string;
  description: string;
  tag: ProjectTag;
  link: string;
  cover: Component;
  coverDescription: string;
}

/** Ordered so each page mixes tags, and with them card colors */
export const PROJECTS: Project[] = [
  {
    title: "BASIC interpreter",
    description: "Classic programming language, interactable in browser",
    tag: "side project",
    link: "https://basic-interpreter-web-editor.hiidenhovi-aleks.workers.dev",
    cover: BasicCover,
    coverDescription: "A CRT monitor running a BASIC program",
  },
  {
    title: "ColViT",
    description: "Late interaction image retrieval",
    tag: "machine learning",
    link: "https://github.com/alekshiidenhovi/colvit-face",
    cover: ColvitCover,
    coverDescription: "A query image searched against a gallery of images",
  },
  {
    title: "Portfolio website",
    description: "Designed and built with coding agents",
    tag: "web development",
    link: "https://github.com/alekshiidenhovi/personal-website",
    cover: PortfolioCover,
    coverDescription: "A wireframe of this website",
  },
  {
    title: "SISPA",
    description: "End-to-end machine unlearning framework",
    tag: "machine learning",
    link: "https://github.com/alekshiidenhovi/SISPA",
    cover: SispaCover,
    coverDescription: "Sharded models aggregated into one prediction, with one shard unlearned",
  },
  {
    title: "C-- compiler",
    description: "C17 subset compiler, built from scratch in Rust",
    tag: "side project",
    link: "https://github.com/alekshiidenhovi/C--",
    cover: CompilerCover,
    coverDescription: "A compiler pipeline from C source to syntax tree to assembly",
  },
  {
    title: "HACK assembler",
    description: "Two-pass assembler for HACK computing platform",
    tag: "side project",
    link: "https://github.com/alekshiidenhovi/HACK-assembler",
    cover: AssemblerCover,
    coverDescription: "HACK assembly translated into binary machine code",
  },
];
