/** A calendar month. */
export interface YearMonth {
  readonly year: number;
  /** From 1 to 12. */
  readonly month: number;
}

/**
 * Counts the months since year 0, so months can be subtracted.
 *
 * @param date The month.
 * @returns The month's index.
 */
function getMonthIndex({ year, month }: YearMonth): number {
  return year * 12 + (month - 1);
}

/**
 * Gets the current month.
 *
 * @returns The month it is now, in local time.
 */
function getCurrentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Counts the months in a period, both the first and the last included.
 *
 * @param start The first month.
 * @param end The last month, or undefined for a period still ongoing, which counts up to the current month.
 * @returns The number of months.
 */
export function countMonths(start: YearMonth, end: YearMonth | undefined): number {
  return getMonthIndex(end ?? getCurrentYearMonth()) - getMonthIndex(start) + 1;
}

/**
 * Formats a month as `YYYY/MM`.
 *
 * @param date The month, or undefined for the end of a period still ongoing.
 * @returns The formatted month, or "present".
 */
export function formatYearMonth(date: YearMonth | undefined): string {
  return date ? `${date.year}/${String(date.month).padStart(2, '0')}` : 'present';
}

/**
 * Formats a span of years as "2024 – 26", the end year shortened, as the century repeats.
 *
 * @param start The first year.
 * @param end The last year.
 * @returns The formatted span.
 */
export function formatYearSpan(start: number, end: number): string {
  return `${start} – ${String(end).slice(2)}`;
}
