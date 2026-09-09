/**
 * tournament.ts
 * Rules a tournament must satisfy, shared by the create form, the browse
 * filters and validation so the three cannot disagree.
 */

/**
 * Sports a tournament may be run in.
 *
 * Kept separate from `SPORTS_LIST` (which covers turfs and matches, and is
 * much wider) because the tournament flow — fixtures, scoring, rule presets —
 * is only built out for these two.
 */
export const TOURNAMENT_SPORTS = ['Football', 'Cricket'] as const;
export type TournamentSport = (typeof TOURNAMENT_SPORTS)[number];

export function isTournamentSport(value: unknown): value is TournamentSport {
  return typeof value === 'string' && (TOURNAMENT_SPORTS as readonly string[]).includes(value);
}

/**
 * Fall back to the first supported sport for a record created before the list
 * narrowed. Without this a saved draft on, say, Tennis would show no chip
 * selected and could not be submitted.
 */
export function coerceTournamentSport(value: unknown): TournamentSport {
  return isTournamentSport(value) ? value : TOURNAMENT_SPORTS[0];
}

/**
 * Cap on the tournament and organiser names.
 *
 * These two strings are rendered in narrow fixed-width places — the ticket
 * card's left column and the Cups list row — where a long name either wraps
 * to three lines or is ellipsised into meaninglessness. Capping at entry is
 * kinder than truncating at display.
 *
 * Mirrored by `max(20)` on the server's createTournamentSchema.
 */
export const MAX_TOURNAMENT_NAME_LENGTH = 20;
export const MAX_ORGANIZER_NAME_LENGTH = 20;

/** Minimum that still reads as a name; matches the server's `min(2)`. */
export const MIN_TOURNAMENT_NAME_LENGTH = 2;

/** Validation message for a name field, or null when acceptable. */
export function nameLengthIssue(
  label: string,
  value: string,
  max: number = MAX_TOURNAMENT_NAME_LENGTH
): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < MIN_TOURNAMENT_NAME_LENGTH) {
    return `${label} must be at least ${MIN_TOURNAMENT_NAME_LENGTH} characters`;
  }
  if (trimmed.length > max) {
    return `${label} must be ${max} characters or fewer`;
  }
  return null;
}

/**
 * Keep only digits, capped to `maxDigits`.
 *
 * Match duration, team size and the three money fields were free text, so
 * "90 Mins", "eleven" and "₹150" all sat in the same field and every consumer
 * had to re-parse them. The unit now lives in the UI as a prefix/suffix and
 * the value stays a plain number string.
 */
export function digitsOnly(value: string, maxDigits = 6): string {
  return (value ?? '').replace(/\D/g, '').slice(0, maxDigits);
}

/** Digit caps, chosen so a typo can't produce an absurd tournament. */
export const MAX_DURATION_DIGITS = 3;   // up to 999 minutes
export const MAX_TEAM_SIZE_DIGITS = 2;  // up to 99 players
export const MAX_OVERS_DIGITS = 3;      // up to 999 overs
export const MAX_MONEY_DIGITS = 7;      // up to ₹9,999,999

/** Overs only apply to cricket; the control is inert for any other sport. */
export function supportsOvers(sport: string): boolean {
  return (sport || '').toLowerCase() === 'cricket';
}

/**
 * How many rule presets to offer as tick boxes. The rest of a sport's rule
 * book is long and mostly boilerplate, so the organiser gets the four that
 * actually vary and writes anything else themselves.
 */
export const RULE_PRESET_LIMIT = 4;

/** Venue names sit in the ticket card's narrow left column alongside the name. */
export const MAX_VENUE_NAME_LENGTH = 40;

/**
 * Read a money field that may be a number or a display string.
 *
 * Tournament records are inconsistent by history: `entryFee` is stored as a
 * parsed number while `registrationFee` and `deposit` keep whatever the form
 * held — "₹25" for anything created before the fee inputs became digits-only.
 * `Number("₹25")` is NaN, and that NaN then propagated through the subtotal
 * into "Total Payable ₹NaN".
 *
 * Falls back rather than returning NaN, so a bad value can never reach a
 * price the user is asked to pay.
 */
export function toAmount(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value !== 'string') return fallback;

  const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;

  const parsed = parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Sponsor labels sit under a 42px logo in a narrow card. */
export const MAX_SPONSOR_NAME_LENGTH = 24;
export const MAX_SPONSOR_TIER_LENGTH = 20;

/**
 * Banner art offered for a tournament voucher's coupon card.
 *
 * `create-class.tsx` and `create-turf.tsx` each carry their own copy of a list
 * like this; this one is shared so the tournament flow does not add a third.
 */
export const TOURNAMENT_VOUCHER_BANNERS = [
  { id: 'arena', label: '🏟️ Arena', uri: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80' },
  { id: 'night', label: '🌙 Night Lights', uri: 'https://images.unsplash.com/photo-1518605368461-1ee71165b400?auto=format&fit=crop&w=800&q=80' },
  { id: 'trophy', label: '🏆 Silverware', uri: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80' },
  { id: 'crowd', label: '🎉 Match Day', uri: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80' },
];

/** A voucher being drafted in the tournament wizard. */
export interface TournamentVoucherDraft {
  localId: string;
  code: string;
  title: string;
  /** Terms printed on the coupon stub. */
  description: string;
  discountType: 'percent' | 'flat';
  discountValue: string;
  minBooking: string;
  maxRedemptions: string;
  validDays: string;
  bannerImage: string;
}

export const MAX_VOUCHER_CODE_LENGTH = 12;

/** Offer copy sits on the coupon stub, which is one short line. */
export const MAX_OFFER_TITLE_LENGTH = 28;
export const MAX_OFFER_TERMS_LENGTH = 60;

/**
 * Common draw sizes. A knockout bracket needs a power of two to avoid byes,
 * which is why these are offered rather than left to free text alone.
 */
export const MAX_TEAM_PRESETS = [4, 8, 16, 32] as const;
export const MAX_TEAMS_DIGITS = 3;
export const MIN_TEAMS = 2;

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Today as `yyyy-mm-dd`, in local time. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `yyyy-mm-dd` a number of days from today. */
export function isoDaysFromToday(days: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return todayIso(d);
}

/**
 * Render a stored `yyyy-mm-dd` as "12 Jun 2026".
 *
 * The wizard showed the raw ISO string, which is unambiguous but hard to read
 * at a glance — and easy to misread as month-first. Parsed by parts rather
 * than `new Date(string)`, which applies a timezone shift that can move a
 * date-only value to the previous day.
 */
export function formatIsoDate(value?: string | null): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!m) return String(value);

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return String(value);

  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}
