import type { Expertise } from "../types";

export const EXPERTISE_COLOR: Record<Expertise, string> = {
  "machine learning": "var(--primary-500)",
  "low level": "var(--accent-500)",
  "web dev": "var(--warning-500)",
};

export interface ExpertiseArea {
  expertise: Expertise;
  title: string;
  text: string;
  /** Shown in the card's window bar */
  fileName: string;
  tags: string[];
}

export const EXPERTISE_AREAS: ExpertiseArea[] = [
  {
    expertise: "machine learning",
    title: "Machine Learning",
    text: "End-to-end ML specialist with a proven track record bridging the gap between deep technical research and production applications.",
    fileName: "train.py",
    tags: ["PyTorch", "Ray", "Spark", "MLFlow"],
  },
  {
    expertise: "low level",
    title: "Low Level",
    text: "Passionate about low-level optimization. Built foundational systems from assemblers to compilers.",
    fileName: "countdown.asm",
    tags: ["Rust", "C++", "Assembly"],
  },
  {
    expertise: "web dev",
    title: "Web Dev",
    text: "Full-stack generalist, with expertise in building data-driven dashboard applications from the ground up.",
    fileName: "dashboard.vue",
    tags: ["React/NextJS", "Vue", "FastAPI", "TailwindCSS", "PostgreSQL"],
  },
];
