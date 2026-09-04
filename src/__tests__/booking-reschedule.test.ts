/**
 * booking-reschedule.test.ts
 *
 * Covers the slot-conflict rule behind rescheduling. This is the part that can
 * lose a player their slot or double-sell an owner's pitch, so it is pinned
 * here rather than left to manual testing through the UI.
 */

import { Booking, findSlotClashes, holdsSlots } from '@/store/booking-store';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`   ✓ ${name}`);
  } else {
    failed++;
    console.log(`   ✗ ${name}\n       expected ${e}\n       actual   ${a}`);
  }
}

function booking(over: Partial<Booking> & Pick<Booking, 'id'>): Booking {
  return {
    venueId: 'venue-1',
    venueName: 'Skyline Arena',
    venueLocation: 'Chennai',
    venueImage: '',
    date: '2026-09-10',
    dayLabel: 'Thu, 10 Sep 2026',
    slots: ['18:00'],
    totalAmount: 1000,
    advancePaid: 300,
    remaining: 700,
    paymentMethod: 'upi',
    status: 'confirmed',
    bookingRef: 'REF1',
    createdAt: new Date().toISOString(),
    ...over,
    id: over.id,
  } as Booking;
}

export function runBookingRescheduleTests() {
  passed = 0;
  failed = 0;
  console.log('\n🗓  Booking reschedule rules\n');

// ── holdsSlots ─────────────────────────────────────────────────────────────
check('a confirmed booking holds its slots', holdsSlots('confirmed'), true);
check('a pending booking holds its slots', holdsSlots('pending'), true);
check('a cancelled booking releases its slots', holdsSlots('cancelled'), false);
check('a completed booking releases its slots', holdsSlots('completed'), false);

// ── findSlotClashes ────────────────────────────────────────────────────────
const mine = booking({ id: 'mine', slots: ['18:00', '19:00'] });

check(
  'an empty diary has no clashes',
  findSlotClashes([mine], 'mine', 'venue-1', '2026-09-10', ['20:00']),
  []
);

check(
  'a booking never clashes with its own current slots',
  findSlotClashes([mine], 'mine', 'venue-1', '2026-09-10', ['18:00', '19:00']),
  []
);

const theirs = booking({ id: 'theirs', slots: ['20:00', '21:00'], bookingRef: 'REF2' });

check(
  "another player's slot is reported as taken",
  findSlotClashes([mine, theirs], 'mine', 'venue-1', '2026-09-10', ['20:00']),
  ['20:00']
);

check(
  'only the overlapping slots come back, not the whole request',
  findSlotClashes([mine, theirs], 'mine', 'venue-1', '2026-09-10', ['19:00', '20:00', '22:00']),
  ['20:00']
);

check(
  'every overlapping slot is reported',
  findSlotClashes([mine, theirs], 'mine', 'venue-1', '2026-09-10', ['20:00', '21:00']),
  ['20:00', '21:00']
);

check(
  'a different date does not clash',
  findSlotClashes([mine, theirs], 'mine', 'venue-1', '2026-09-11', ['20:00']),
  []
);

check(
  'a different venue does not clash',
  findSlotClashes([mine, theirs], 'mine', 'venue-2', '2026-09-10', ['20:00']),
  []
);

check(
  'a cancelled booking frees its slot',
  findSlotClashes(
    [mine, booking({ id: 'gone', slots: ['20:00'], status: 'cancelled' })],
    'mine',
    'venue-1',
    '2026-09-10',
    ['20:00']
  ),
  []
);

check(
  'a completed booking frees its slot',
  findSlotClashes(
    [mine, booking({ id: 'done', slots: ['20:00'], status: 'completed' })],
    'mine',
    'venue-1',
    '2026-09-10',
    ['20:00']
  ),
  []
);

check(
  'a slot held by two bookings is reported once, not twice',
  findSlotClashes(
    [
      mine,
      booking({ id: 'a', slots: ['20:00'] }),
      booking({ id: 'b', slots: ['20:00'] }),
    ],
    'mine',
    'venue-1',
    '2026-09-10',
    ['20:00']
  ),
  ['20:00']
);

check(
  'requesting nothing clashes with nothing',
  findSlotClashes([mine, theirs], 'mine', 'venue-1', '2026-09-10', []),
  []
);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
