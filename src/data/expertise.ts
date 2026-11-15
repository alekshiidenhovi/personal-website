import type { Expertise } from "../types";

export const EXPERTISE_COLOR: Record<Expertise, string> = {
  "machine learning": "var(--primary-500)",
  "data foundations": "var(--accent-500)",
  "web dev": "var(--warning-500)",
};

export interface ExpertiseArea {
  expertise: Expertise;
  title: string;
  text: string;
  /** Shown in the card's window bar */
  fileName: string;
  tags: string[];
  /** The work the visual is based on; an in-page link */
  source: { label: string; href: string };
}

export const EXPERTISE_AREAS: ExpertiseArea[] = [
  {
    expertise: "machine learning",
    title: "Machine Learning",
    text: "Specialized in embedding models: self-supervised representation learning, retrieval and recommendation, taken from research to measured results.",
    fileName: "pretrain.py",
    tags: ["PyTorch", "Ray", "MLflow"],
    source: { label: "Data Scientist @ Supercell", href: "#role-data-scientist" },
  },
  {
    expertise: "data foundations",
    title: "Data Foundations",
    text: "Analysis, pipelines and data quality on terabyte-scale data, from the first query to the production job.",
    fileName: "pipeline.py",
    tags: ["SQL", "Spark", "Databricks"],
    source: { label: "Ticket analysis platform", href: "#role-ml-engineer" },
  },
  {
    expertise: "web dev",
    title: "Web Dev",
    text: "Full-stack web apps and dashboards that put data and models in front of the people who use them.",
    fileName: "dashboard.vue",
    tags: ["React", "Vue", "FastAPI", "Tailwind", "PostgreSQL", "Figma"],
    source: { label: "Ticket analysis platform", href: "#role-ml-engineer" },
  },
];
