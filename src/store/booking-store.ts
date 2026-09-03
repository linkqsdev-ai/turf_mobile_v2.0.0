/**
 * booking-store.ts
 * Manages all booking-related state: history, active bookings, drafts.
 */

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
