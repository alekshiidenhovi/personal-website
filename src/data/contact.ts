import type { IconName } from "../icons";

export const EMAIL = "hiidenhovi.aleks@gmail.com";

/**
 * The CV as a PDF in public/, opened in a new tab: the browser's viewer shows
 * it at once and offers download and print. Named so a saved copy is easy to find.
 */
export const CV = { label: "CV", href: "/Aleks-Hiidenhovi-CV.pdf", icon: "heroicons:document-text-20-solid" } as const;

/** Linked from the contact section */
export const PROFILES: { label: string; href: string; icon: IconName }[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hiidenhovi/", icon: "simple-icons:linkedin" },
  { label: "GitHub", href: "https://github.com/alekshiidenhovi", icon: "simple-icons:github" },
];
