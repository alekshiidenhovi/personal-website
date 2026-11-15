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
    start: { year: 2026, month: 2 },
    discipline: "machine learning",
    highlights: [
      "Trained a self-supervised player embedding from raw game event streams, adapting LeJEPA from images to event sequences, so models can take player context off the shelf instead of engineering features.",
      "Cut an in-game content recommender's **validation loss by 20%** when added to hand-crafted features, and matched them when used on its own.",
      "Now developing a new recommender use case for the first-time user experience.",
    ],
    stack: ["PyTorch", "Ray", "Spark", "Databricks"],
    figure: LearnedFeaturesFigure,
    figureCaption: "Embedding alone matches aggregated features; together they predict best",
  },
  {
    slug: "role-ml-engineer",
    title: "Machine Learning Engineer",
    company: "supercell",
    companyUrl: "https://www.supercell.com/",
    start: { year: 2023, month: 9 },
    end: { year: 2024, month: 12 },
    discipline: "machine learning",
    highlights: [
      "Built an end-to-end ticket analysis platform to surface the issues players face daily across all games for Player Support and game teams.",
      "Replacing a manual reporting chain through hundreds of agents and their supervisors brought feedback in **minutes rather than days**, higher-quality analysis of every ticket, and more time for agents to serve players.",
      "Owned it as a solo developer; after I left, Supercell hired **two people and a consultant** to take it further.",
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
    discipline: "data foundations",
    highlights: [
      "Designed a Markovian growth model where no shared model for growth and engagement existed; one game team adopted it and **still uses it today**.",
      "Prototyped AI support tools, such as semantic ticket search and LLM chatbots, which **led to the ticket analysis platform** I built next.",
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
      "Applied GPT-3 to support ticket classification in a proof of concept, months before ChatGPT launched.",
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
