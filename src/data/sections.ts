/** The landing section, before the numbered ones */
export const HERO_ID = "hero";

/** The numbered sections, in page order; their numbers and the nav come from this list */
export const SECTIONS = [
  {
    id: "expertise",
    title: "Expertise",
    subtitle: "Deep in embedding models, broad across the data stack around them.",
  },
  {
    id: "professional-experience",
    title: "Experience",
    subtitle: "ML and data products, from mobile games to health-tech.",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Built from the ground up — some for research, some for fun.",
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Industrial engineering into computer science, with data and machine learning throughout.",
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Building something ambitious in the ML or data space? I'd love to hear about it.",
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
