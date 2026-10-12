/**
 * Calendar-date helpers.
 *
 * Streaks and daily progress are about the learner's local day. Deriving the
 * day from `toISOString()` yields the UTC date, which is wrong for several
 * hours around midnight in Austria (UTC+1 / UTC+2) and shifts streaks by a day.
 */

const pad = (value: number): string => String(value).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD`. */
export function localDateKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A copy of `date` moved by `days` calendar days (DST-safe, keeps local time of day). */
export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/** Local `YYYY-MM-DD` of an ISO timestamp such as `exercise.completedAt`. */
export function localDateKeyOf(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    return Number.isNaN(date.getTime()) ? '' : localDateKey(date);
}

/**
 * Whole calendar days from `from` to `to` (both `YYYY-MM-DD`), independent of
 * DST changes. Positive when `to` is later.
 */
export function daysBetweenKeys(from: string, to: string): number {
    const toUtcDay = (key: string): number => {
        const [y, m, d] = key.split('-').map(Number);
        return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
    };
    return toUtcDay(to) - toUtcDay(from);
}
