import type { Expertise } from "../types";

export interface Study {
  degree: string;
  school: string;
  detail: string;
  start: number;
  end: number;
  /** The discipline the studies built up; sets the card color */
  discipline: Expertise;
  thesis?: { title: string; summary: string; href: string };
  exchange?: { school: string; location: string; year: number };
}

/** Newest first; the first is shown as the featured card */
export const STUDIES: Study[] = [
  {
    degree: "MSc Computer Science",
    school: "Aalto University",
    detail: "Minor in Machine Learning, Data Science and Artificial Intelligence",
    start: 2024,
    end: 2026,
    discipline: "machine learning",
    thesis: {
      title: "Learning self-supervised player embeddings from game event streams",
      summary: "Embeddings learned from raw event streams, used to improve in-game content recommendations.",
      href: "https://aaltodoc.aalto.fi/server/api/core/bitstreams/167423ba-5e84-4442-8468-ec644f9e8404/content",
    },
    exchange: { school: "University of Calgary", location: "Calgary, Canada", year: 2025 },
  },
  {
    degree: "BSc Industrial Engineering",
    school: "Aalto University",
    detail: "Minor in Data Science",
    start: 2020,
    end: 2024,
    discipline: "data foundations",
  },
];
