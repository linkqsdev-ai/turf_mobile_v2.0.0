/**
 * class-schedule.ts
 *
 * Reading a coaching class's dates.
 *
 * Classes store `startDate`/`endDate` as `DD/MM/YYYY` strings (see
 * `getTodayDate` in create-class.tsx), which is ambiguous with the US
 * `MM/DD/YYYY` that `new Date(string)` assumes — so these must never be handed
 * to the Date constructor directly. 03/09/2026 is 3 September here and 9 March
 * to the built-in parser.
 */

export type ClassStatus = 'upcoming' | 'ongoing' | 'completed' | 'unknown';

/**
 * Parse a `DD/MM/YYYY` string to a local midnight Date, or null.
 *
 * Validated by round-trip: `new Date(2026, 0, 32)` silently rolls over to
 * 1 February rather than failing, so the components are read back and compared
 * before the value is trusted.
 */
export function parseClassDate(value?: string | null): Date | null {
  if (!value) return null;
  const parts = String(value).trim().split('/');
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  let month = Number(parts[1]);
  if (isNaN(month)) {
    const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
    if (monthIndex >= 0) {
      month = monthIndex + 1;
    }
  }
  const year = Number(parts[2]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (year < 1900 || year > 2999) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  // Reject rolled-over values like 32/01 or 30/02.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Midnight today, so comparisons are day-level rather than time-of-day. */
function startOfDay(d: Date): Date {
  const copy = new Date(d.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Where a class sits relative to today. A class is "ongoing" on both its first
 * and last day — a course ending today has not finished until the day is over.
 *
 * Returns 'unknown' rather than guessing when the dates are missing or
 * unparseable, so the UI can stay quiet instead of claiming a class is over.
 */
export function classStatus(
  startDate?: string | null,
  endDate?: string | null,
  now: Date = new Date()
): ClassStatus {
  const start = parseClassDate(startDate);
  const end = parseClassDate(endDate);
  const today = startOfDay(now);

  if (!start && !end) return 'unknown';

  // A single known date is enough to place the class.
  if (start && !end) return today < start ? 'upcoming' : 'ongoing';
  if (!start && end) return today > end! ? 'completed' : 'ongoing';

  if (today < start!) return 'upcoming';
  if (today > end!) return 'completed';
  return 'ongoing';
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "12 Sep 2026" — unambiguous, unlike the stored numeric form. */
export function formatClassDate(value?: string | null): string {
  const d = parseClassDate(value);
  if (!d) {
    if (!value) return '';
    const str = String(value).trim();
    // Handle ISO date strings (e.g., 2026-09-09T11:07:54.962Z or 2026-09-09)
    if (str.includes('T') || (str.includes('-') && str.length >= 10)) {
      try {
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
        }
      } catch {}
    }
    return str;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats any date (ISO, DD/MM/YYYY, timestamp, human-readable) to "9 Sep 2026" or fallback.
 */
export function formatReadableDate(value?: string | number | null, fallback: string = 'Recently'): string {
  if (!value) return fallback;
  const str = String(value).trim();
  if (!str || str.toLowerCase() === 'recently') return fallback;

  // Already formatted string like "12 May 2026"
  if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/.test(str)) {
    return str;
  }

  // Handle DD/MM/YYYY or ISO strings
  const formatted = formatClassDate(str);
  if (formatted && formatted !== 'Invalid Date') {
    return formatted;
  }

  return str || fallback;
}

/**
 * "12 Sep 2026 – 19 Sep 2026", collapsing to a single date when both ends
 * match, and to whichever end is known when the other is missing.
 */
export function formatClassDateRange(
  startDate?: string | null,
  endDate?: string | null
): string {
  const start = formatClassDate(startDate);
  const end = formatClassDate(endDate);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return start || end || '';
}

/** Whole days from today until the class starts; null when not upcoming. */
export function daysUntilStart(
  startDate?: string | null,
  now: Date = new Date()
): number | null {
  const start = parseClassDate(startDate);
  if (!start) return null;
  const today = startOfDay(now);
  if (today >= start) return null;
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

/** Calendar order, matching the create-class form's day picker. */
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Normalise a schedule field to a list.
 *
 * `selectedDays` is a `Record<string, boolean>` keyed by day, `sessionTime` is
 * a comma-joined string, and older records hold plain arrays. Reading a day map
 * as an array is what rendered "[object Object]" on the class cards.
 *
 * Weekdays come back in calendar order: object keys iterate in insertion order,
 * so ticking Wed then Mon would otherwise read "Wed, Mon".
 */
export function normaliseScheduleList(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === 'object') {
    const map = value as Record<string, unknown>;
    const ticked = Object.keys(map).filter(k => Boolean(map[k]));
    const known = DAYS_OF_WEEK.filter(d => ticked.includes(d));
    const rest = ticked.filter(d => !DAYS_OF_WEEK.includes(d));
    return [...known, ...rest];
  }

  return String(value)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Format days of the week into a clean, compact short form:
 * - All 7 days -> 'All Days'
 * - Mon to Fri -> 'Mon – Fri'
 * - Sat and Sun -> 'Sat & Sun'
 * - Consecutive ranges -> e.g. 'Mon – Thu'
 */
export function formatDaysShort(value: unknown): string {
  const days = normaliseScheduleList(value);
  if (days.length === 0) return '';
  if (days.length === 7) return 'All Days';

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekends = ['Sat', 'Sun'];

  const isAllWeekdays = weekdays.every(d => days.includes(d)) && days.length === 5;
  if (isAllWeekdays) return 'Mon – Fri';

  const isAllWeekends = weekends.every(d => days.includes(d)) && days.length === 2;
  if (isAllWeekends) return 'Sat & Sun';

  // Check if consecutive in DAYS_OF_WEEK
  if (days.length >= 3) {
    const indices = days.map(d => DAYS_OF_WEEK.indexOf(d)).filter(i => i !== -1);
    const isConsecutive = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
    if (isConsecutive && indices.length === days.length) {
      return `${days[0]} – ${days[days.length - 1]}`;
    }
  }

  return days.join(', ');
}

/**
 * Format session times into clean short form without duplicates:
 * - Deduplicates duplicate times like "6:00 PM, 6:00 PM"
 * - Compacts long time lists to fit neatly
 */
export function formatSessionsShort(value: unknown): string {
  if (!value) return '';
  const rawList = normaliseScheduleList(value);
  if (rawList.length === 0) return '';

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const list: string[] = [];
  for (const item of rawList) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      list.push(trimmed);
    }
  }

  if (list.length === 0) return '';
  if (list.length <= 2) return list.join(' · ');

  // If 3 or more slots, e.g. "6:00 AM, 7:00 AM, 6:00 PM"
  const first = list[0];
  const last = list[list.length - 1];
  return `${first} – ${last} (${list.length} slots)`;
}
