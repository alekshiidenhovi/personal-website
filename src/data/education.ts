import type { Expertise } from "../types";

export interface Study {
  degree: string;
  school: string;
  detail: string;
  /** Inclusive start year and exclusive end year, as drawn on the timeline */
  start: number;
  end: number;
  /** The discipline the studies built up; sets the bar color */
  discipline?: Expertise;
  link?: { label: string; href: string };
}

/** Newest first */
export const STUDIES: Study[] = [
  {
    degree: "MSc Computer Science",
    school: "Aalto University",
    detail: "Minor in Machine Learning, Data Science and Artificial Intelligence",
    start: 2024,
    end: 2026,
    discipline: "machine learning",
    link: {
      label: "Master's thesis",
      href: "https://aaltodoc.aalto.fi/server/api/core/bitstreams/167423ba-5e84-4442-8468-ec644f9e8404/content",
    },
  },
  {
    degree: "Student exchange",
    school: "University of Calgary",
    detail: "Calgary, Canada",
    start: 2025,
    end: 2026,
  },
  {
    degree: "BSc Industrial Engineering",
    school: "Aalto University",
    detail: "Minor in Data Science",
    start: 2020,
    end: 2024,
    discipline: "data ops",
  },
];

/** Years shown on the timeline axis */
export const TIMELINE_START = 2020;
export const TIMELINE_END = 2026;
