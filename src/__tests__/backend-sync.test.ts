/**
 * backend-sync.test.ts
 * Which device records are mirrored to the backend for the Super Admin console.
 */

import { bookingPayload, isUuid, tournamentPayload } from '@/lib/sync-rules';

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

const TURF_ID = '3f1c2b9e-8a4d-4c1f-9b2e-7d6a5c4b3a21';

const booking = {
  venueId: TURF_ID,
  date: '2026-09-20',
  dayLabel: 'Sun, 20 Sep 2026',
  slots: ['18:00', '19:00'],
  totalAmount: 2400,
  advancePaid: 600.005,
  remaining: 1800,
  paymentMethod: 'upi',
  coachAdded: false,
  recordingAdded: true,
};

const tournament = {
  name: '  Summer Cup  ',
  sport: 'cricket',
  type: 'League',
  location: 'Anna Stadium',
  startDate: '2026-10-01',
  endDate: '2026-10-05',
  prizePool: '₹10,000',
  prizePoolAmount: 10000,
  entryFee: 500,
  maxTeams: 8,
};

export function runBackendSyncTests() {
  passed = 0;
  failed = 0;
  console.log('\n🔄 Backend sync rules\n');

  check('backend ids are UUIDs', isUuid(TURF_ID), true);
  check('demo venue ids are not', isUuid('skyline'), false);
  check('device team ids are not', isUuid('team-1757660000000'), false);

  check('a booking at a backend turf is sent', bookingPayload(booking), {
    turfId: TURF_ID,
    date: '2026-09-20',
    dayLabel: 'Sun, 20 Sep 2026',
    slots: ['18:00', '19:00'],
    totalAmount: 2400,
    advancePaid: 600.01,
    remaining: 1800,
    paymentMethod: 'upi',
    coachAdded: false,
    recordingAdded: true,
  });
  check('a booking at a demo turf stays on the device', bookingPayload({ ...booking, venueId: 'skyline' }), null);
  check('a booking without slots is not sent', bookingPayload({ ...booking, slots: [] }), null);
  check('a free booking is not sent (the API needs a positive total)', bookingPayload({ ...booking, totalAmount: 0 }), null);
  check('negative amounts are clamped', bookingPayload({ ...booking, remaining: -5 })?.remaining, 0);

  const t = tournamentPayload(tournament);
  check('tournament name is trimmed', t?.name, 'Summer Cup');
  check('sport is matched to the server spelling', t?.sport, 'Cricket');
  check('dates become ISO timestamps', t?.startDate, '2026-10-01T00:00:00.000Z');
  check('a sport the server does not host is not sent', tournamentPayload({ ...tournament, sport: 'Badminton' }), null);
  check('a name over 20 characters is not sent', tournamentPayload({ ...tournament, name: 'The Extremely Long Summer Cup' }), null);
  check('a tournament without teams is not sent', tournamentPayload({ ...tournament, maxTeams: 0 }), null);
  check('an unreadable date is not sent', tournamentPayload({ ...tournament, endDate: 'soon' }), null);
  check('a missing type falls back', tournamentPayload({ ...tournament, type: '' })?.type, 'Knockout');

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
