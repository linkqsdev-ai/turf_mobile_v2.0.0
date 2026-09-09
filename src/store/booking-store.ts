/**
 * booking-store.ts
 * Manages all booking-related state: history, active bookings, drafts.
 */

/**
 * A booking only holds its slots while it is live. Cancelled and completed
 * bookings release them, so they must never block a reschedule.
 */
export function holdsSlots(status: Booking['status']): boolean {
  return status !== 'cancelled' && status !== 'completed';
}

/**
 * Slots in `wanted` that another live booking already holds at the same venue
 * on the same date. `excludeId` is the booking being moved — without it a
 * booking would collide with its own current slots and could never be edited.
 *
 * Extracted from the store so the rule is testable on its own; the store is a
 * React provider and its callbacks can't be exercised directly.
 */
export function findSlotClashes(
  all: Booking[],
  excludeId: string,
  venueId: string,
  date: string,
  wanted: string[]
): string[] {
  const taken = all
    .filter(
      b =>
        b.id !== excludeId &&
        b.venueId === venueId &&
        b.date === date &&
        holdsSlots(b.status)
    )
    .flatMap(b => b.slots);

  return [...new Set(wanted.filter(s => taken.includes(s)))];
}

/**
 * Outcome of a reschedule attempt. Rescheduling can fail for reasons the
 * player needs spelled out — chiefly that someone else holds the new slot —
 * so the caller is handed the clashing times rather than a bare false.
 */
export type RescheduleResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'cancelled' | 'completed' | 'no_slots' }
  | { ok: false; reason: 'slot_taken'; clashes: string[] };

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueLocation: string;
  venueImage: string;
  date: string;           // ISO "2026-06-24"
  dayLabel: string;       // "Mon, 24 Jun 2026"
  slots: string[];        // ["12:00", "13:00"]
  totalAmount: number;
  advancePaid: number;
  remaining: number;
  paymentMethod: string;

  // ── Who booked ────────────────────────────────────────────────────────────
  // Captured at booking time so a turf owner can see and contact the customer.
  // Snapshotted rather than joined by id: the owner needs the name and number
  // that were given when the slot was taken, even if that profile later changes.
  customerName?: string;
  customerPhone?: string;
  customerAvatar?: string;

  coachAdded: boolean;
  recordingAdded: boolean;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
  bookingRef: string;
}

export function generateBookingRef(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BK-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export function createBooking(params: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'status'>): Booking {
  return {
    ...params,
    id: `booking-${Date.now()}`,
    bookingRef: generateBookingRef(),
    createdAt: new Date().toISOString(),
    status: 'confirmed',
  };
}
