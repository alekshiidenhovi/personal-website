import type { IconName } from '../components/ui/icons';

/** A link to a profile on another site. */
export interface ProfileLink {
  label: string;
  href: string;
  icon: IconName;
}

export const EMAIL = 'hiidenhovi.aleks@gmail.com';

/**
 * The CV, a PDF in public/ that opens in a new tab, where the browser's viewer offers download and print. Named so
 * a saved copy is easy to find.
 */
export const CV = { label: 'CV', href: '/Aleks-Hiidenhovi-CV.pdf', icon: 'heroicons:document-text-20-solid' } as const;

export const PROFILES: ProfileLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hiidenhovi/', icon: 'simple-icons:linkedin' },
  { label: 'GitHub', href: 'https://github.com/alekshiidenhovi', icon: 'simple-icons:github' },
];
