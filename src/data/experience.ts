import type { Component } from "vue";
import LearnedFeaturesFigure from "../components/roles/LearnedFeaturesFigure.vue";
import LlmTriageFigure from "../components/roles/LlmTriageFigure.vue";
import MarkovGrowthFigure from "../components/roles/MarkovGrowthFigure.vue";
import TicketPipelineFigure from "../components/roles/TicketPipelineFigure.vue";
import type { Expertise } from "../types";

export interface YearMonth {
  year: number;
  /** 1-12 */
  month: number;
}

export interface Role {
  /** Anchor id of the role's slide, for in-page links */
  slug: string;
  title: string;
  company: "supercell" | "veri";
  companyUrl: string;
  start: YearMonth;
  /** Missing while the role is ongoing */
  end?: YearMonth;
  /** The discipline the role highlights; sets its accent color */
  discipline: Expertise;
  highlights: string[];
  stack: string[];
  figure: Component;
  figureCaption: string;
}

export const COMPANY_NAMES: Record<Role["company"], string> = {
  supercell: "Supercell",
  veri: "Veri",
};

/** Newest first */
export const ROLES: Role[] = [
  {
    slug: "role-data-scientist",
    title: "Data Scientist",
    company: "supercell",
    companyUrl: "https://www.supercell.com/",
    start: { year: 2026, month: 7 },
    discipline: "machine learning",
    highlights: [
      "Built a self-supervised embedding model on large-scale game event streams, adapting LeJEPA from images to event sequences.",
      "Evaluated the learned embeddings as features in an in-game content recommendation model.",
      "Now improving the technical foundations of recommender systems.",
    ],
    stack: ["Python", "PyTorch", "SQL"],
    figure: LearnedFeaturesFigure,
    figureCaption: "Learned embeddings on top of hand-crafted features",
  },
  {
    slug: "role-ml-engineer",
    title: "Machine Learning Engineer",
    company: "supercell",
    companyUrl: "https://www.supercell.com/",
    start: { year: 2023, month: 10 },
    end: { year: 2024, month: 8 },
    discipline: "machine learning",
    highlights: [
      "Pioneered an end-to-end ticket analysis platform, from high-volume ETL pipelines to neural-net topic modeling and an interactive dashboard.",
      "Replaced labor-intensive manual audits, delivering superior insights in minutes rather than hours.",
    ],
    stack: ["React", "TypeScript", "Python", "FastAPI", "SQL"],
    figure: TicketPipelineFigure,
    figureCaption: "Ticket analysis pipeline",
  },
  {
    slug: "role-data-analyst",
    title: "Data Analyst Intern",
    company: "supercell",
    companyUrl: "https://www.supercell.com/",
    start: { year: 2023, month: 1 },
    end: { year: 2023, month: 8 },
    discipline: "data ops",
    highlights: [
      "Designed a Markovian growth model for quantifying user engagement.",
      "Led multiple data projects, including BI dashboard development.",
      "Prototyped AI-based customer support tools, such as semantic ticket search and AI chatbots.",
    ],
    stack: ["Python", "SQL", "Vector DBs"],
    figure: MarkovGrowthFigure,
    figureCaption: "Markovian growth model",
  },
  {
    slug: "role-software-developer",
    title: "Software Developer Intern",
    company: "veri",
    companyUrl: "https://www.veri.co/",
    start: { year: 2022, month: 6 },
    end: { year: 2022, month: 8 },
    discipline: "machine learning",
    highlights: [
      "Prototyped an LLM-powered customer support ticket classification tool.",
      "Worked on a data-driven insights engine that provided customers frequent health facts and tips.",
    ],
    stack: ["Python", "SQL", "GPT-3"],
    figure: LlmTriageFigure,
    figureCaption: "LLM ticket classification",
  },
];

/** Months since year 0, so dates can be subtracted */
const toMonthIndex = ({ year, month }: YearMonth) => year * 12 + (month - 1);

const currentYearMonth = (): YearMonth => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

/** Inclusive of both the start and end month; ongoing roles count up to the current month */
export const durationMonths = (role: Role) =>
  toMonthIndex(role.end ?? currentYearMonth()) - toMonthIndex(role.start) + 1;

export const formatYearMonth = (date?: YearMonth) =>
  date ? `${date.year}/${String(date.month).padStart(2, "0")}` : "present";
