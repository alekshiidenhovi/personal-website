import type { Component } from "vue";
import AssemblerCover from "../components/covers/AssemblerCover.vue";
import BasicCover from "../components/covers/BasicCover.vue";
import ColvitCover from "../components/covers/ColvitCover.vue";
import CompilerCover from "../components/covers/CompilerCover.vue";
import PortfolioCover from "../components/covers/PortfolioCover.vue";
import SispaCover from "../components/covers/SispaCover.vue";
import type { Expertise } from "../types";

export interface Project {
  title: string;
  description: string;
  tag: Expertise;
  link: string;
  year: number;
  cover: Component;
  coverDescription: string;
}

export const PROJECTS: Project[] = [
  {
    title: "BASIC interpreter",
    description: "Classic programming language, interactable in browser",
    tag: "low level",
    link: "https://basic-interpreter-web-editor.hiidenhovi-aleks.workers.dev",
    year: 2026,
    cover: BasicCover,
    coverDescription: "A CRT monitor running a BASIC program",
  },
  {
    title: "Portfolio website",
    description: "Source code for this website",
    tag: "web dev",
    link: "https://github.com/alekshiidenhovi/personal-website",
    year: 2026,
    cover: PortfolioCover,
    coverDescription: "A wireframe of this website",
  },
  {
    title: "C-- compiler",
    description: "C17 standard compiler, built from scratch in Rust",
    tag: "low level",
    link: "https://github.com/alekshiidenhovi/C--",
    year: 2025,
    cover: CompilerCover,
    coverDescription: "A compiler pipeline from C source to syntax tree to assembly",
  },
  {
    title: "SISPA",
    description: "End-to-end machine unlearning framework",
    tag: "machine learning",
    link: "https://github.com/alekshiidenhovi/SISPA",
    year: 2025,
    cover: SispaCover,
    coverDescription: "Sharded models aggregated into one prediction, with one shard unlearned",
  },
  {
    title: "HACK assembler",
    description: "Two-pass assembler for HACK computing platform",
    tag: "low level",
    link: "https://github.com/alekshiidenhovi/HACK-assembler",
    year: 2025,
    cover: AssemblerCover,
    coverDescription: "HACK assembly translated into binary machine code",
  },
  {
    title: "ColViT",
    description: "Fast and scalable face identification",
    tag: "machine learning",
    link: "https://github.com/alekshiidenhovi/colvit-face",
    year: 2025,
    cover: ColvitCover,
    coverDescription: "A query face searched against a gallery of faces",
  },
];
