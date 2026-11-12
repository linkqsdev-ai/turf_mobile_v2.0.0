/**
 * sync-rules.ts
 *
 * Which device records can be mirrored to the backend, and in what shape. The
 * Super Admin console ranks turfs, coaches and tournaments from backend rows,
 * so a booking that never leaves the phone never earns its turf a place.
 *
 * Only records that point at backend entities are sent: a booking at a turf
 * from the built-in demo list (id "skyline") has no row to attach to, and the
 * API would reject it. Pure so the rules are testable.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Backend ids are UUIDs; device-made ids ("team-1757…", "skyline") are not. */
export const isUuid = (value: string | null | undefined): boolean => !!value && UUID_RE.test(value);

const money = (n: unknown) => Math.max(0, Math.round((Number(n) || 0) * 100) / 100);

export interface BookingLike {
  venueId: string;
  date: string;
  dayLabel: string;
  slots: string[];
  totalAmount: number;
  advancePaid: number;
  remaining: number;
  paymentMethod: string;
  coachAdded?: boolean;
  recordingAdded?: boolean;
}

/** The POST /bookings body, or null when the booking can't exist on the server. */
export function bookingPayload(b: BookingLike) {
  if (!isUuid(b.venueId) || !Array.isArray(b.slots) || b.slots.length === 0 || !(Number(b.totalAmount) > 0)) return null;
  return {
    turfId: b.venueId,
    date: b.date,
    dayLabel: b.dayLabel,
    slots: b.slots,
    totalAmount: money(b.totalAmount),
    advancePaid: money(b.advancePaid),
    remaining: money(b.remaining),
    paymentMethod: b.paymentMethod || 'unknown',
    coachAdded: !!b.coachAdded,
    recordingAdded: !!b.recordingAdded,
  };
}

/** Mirrors the backend's createTournamentSchema limits. */
const SERVER_SPORTS = ['Football', 'Cricket'];
const MAX_NAME = 20;

export interface TournamentLike {
  name: string;
  sport: string;
  type?: string;
  location?: string;
  startDate: string;
  endDate: string;
  prizePool?: string;
  prizePoolAmount?: number;
  entryFee?: number;
  maxTeams: number;
}

/** The POST /tournaments body, or null when the server would refuse it. */
export function tournamentPayload(t: TournamentLike) {
  const sport = SERVER_SPORTS.find((s) => s.toLowerCase() === String(t.sport ?? '').trim().toLowerCase());
  const name = String(t.name ?? '').trim();
  const start = Date.parse(t.startDate);
  const end = Date.parse(t.endDate);
  const maxTeams = Math.floor(Number(t.maxTeams));
  if (!sport || name.length < 2 || name.length > MAX_NAME || Number.isNaN(start) || Number.isNaN(end) || !(maxTeams > 0)) {
    return null;
  }
  return {
    name,
    sport,
    type: t.type || 'Knockout',
    location: t.location || '',
    startDate: new Date(start).toISOString(),
    endDate: new Date(end).toISOString(),
    prizePool: String(t.prizePool ?? ''),
    prizePoolAmount: money(t.prizePoolAmount),
    entryFee: money(t.entryFee),
    maxTeams,
  };
}
