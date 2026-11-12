/**
 * booking-history.test.ts
 * Tests for unified booking history: turfs, classes, and tournaments.
 */

import {
  buildUnifiedHistoryList,
  filterUnifiedHistory,
  computeHistoryMetrics,
} from '@/utils/booking-history-utils';
import { Booking } from '@/store/booking-store';
import { ClassEnrollment } from '@/store/enrollment-store';
import { TournamentRegistration, PublishedTournament } from '@/store/tournament-store';

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

export function runBookingHistoryTests() {
  passed = 0;
  failed = 0;
  console.log('\n📅 Unified Booking History rules\n');

  const sampleBookings: Booking[] = [
    {
      id: 'bk-1',
      bookingRef: 'BK-1001',
      venueId: 'v-1',
      venueName: 'Green Valley Turf',
      venueLocation: 'KK Nagar, Trichy',
      venueImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6',
      date: '2026-09-15',
      dayLabel: 'Tue, 15 Sep 2026',
      slots: ['06:00 PM', '07:00 PM'],
      totalAmount: 1600,
      advancePaid: 1600,
      remaining: 0,
      status: 'confirmed',
      paymentMethod: 'wallet',
      coachAdded: false,
      recordingAdded: false,
      createdAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'bk-2',
      bookingRef: 'BK-1002',
      venueId: 'v-2',
      venueName: 'Skyline Arena',
      venueLocation: 'Thillai Nagar, Trichy',
      venueImage: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6',
      date: '2026-09-01',
      dayLabel: 'Tue, 01 Sep 2026',
      slots: ['08:00 PM'],
      totalAmount: 800,
      advancePaid: 800,
      remaining: 0,
      status: 'confirmed',
      paymentMethod: 'wallet',
      coachAdded: false,
      recordingAdded: false,
      createdAt: '2026-08-30T10:00:00Z',
    },
  ];

  const sampleEnrollments: ClassEnrollment[] = [
    {
      id: 'enroll-101',
      classId: 'class-c1',
      className: 'Fast Bowling Masterclass',
      studentName: 'Rahul Dravid',
      studentAge: '16',
      contactNumber: '9876543210',
      amountPaid: 2500,
      createdAt: '2026-09-11T09:00:00Z',
    },
  ];

  const sampleClasses = [
    {
      id: 'class-c1',
      title: 'Fast Bowling Masterclass',
      coachName: 'Zaheer Khan',
      sport: 'Cricket',
      venue: 'Star Cricket Ground',
      startDate: '2026-09-20',
      endDate: '2026-10-20',
      price: 2500,
    },
  ];

  const sampleRegistrations: TournamentRegistration[] = [
    {
      id: 'reg-201',
      tournamentId: 't-1',
      tournamentName: 'Trichy Premier League T20',
      teamId: 'team-az',
      teamName: 'Azar XI',
      sport: 'Cricket',
      registeredAt: '2026-09-12T08:00:00Z',
      status: 'confirmed',
      paymentStatus: 'paid',
      entryFee: 3000,
    },
  ];

  const sampleTournaments: PublishedTournament[] = [
    {
      id: 't-1',
      name: 'Trichy Premier League T20',
      sport: 'Cricket',
      type: 'Knockout',
      location: 'Central Stadium',
      startDate: '2026-09-25',
      endDate: '2026-09-28',
      prizePool: '₹50,000',
      prizePoolAmount: 50000,
      entryFee: 3000,
      maxTeams: 16,
      teamsCount: 8,
      banner: null,
      organizerName: 'TNCA',
      status: 'Registering',
      createdAt: '2026-09-01T00:00:00Z',
    },
  ];

  const list = buildUnifiedHistoryList({
    bookings: sampleBookings,
    enrollments: sampleEnrollments,
    classes: sampleClasses,
    registrations: sampleRegistrations,
    tournaments: sampleTournaments,
    todayISO: '2026-09-12',
  });

  check('unifies all 3 types into 4 total items', list.length, 4);
  check('newest activity is at the top', list[0].id, 'reg-201');
  check('second newest is class enrollment', list[1].id, 'enroll-101');

  const futureTurf = list.find((i) => i.id === 'bk-1');
  const pastTurf = list.find((i) => i.id === 'bk-2');
  check('future turf is confirmed', futureTurf?.status, 'confirmed');
  check('past turf is completed', pastTurf?.status, 'completed');

  // Filtering
  const turfOnly = filterUnifiedHistory({ items: list, typeFilter: 'turf' });
  check('filters turf items', turfOnly.length, 2);

  const classOnly = filterUnifiedHistory({ items: list, typeFilter: 'class' });
  check('filters class items', classOnly.length, 1);
  check('class title matches', classOnly[0]?.title, 'Fast Bowling Masterclass');

  const tourneyOnly = filterUnifiedHistory({ items: list, typeFilter: 'tournament' });
  check('filters tournament items', tourneyOnly.length, 1);
  check('tournament title matches', tourneyOnly[0]?.title, 'Trichy Premier League T20');

  // Status Filter
  const upcoming = filterUnifiedHistory({ items: list, statusFilter: 'upcoming' });
  check('upcoming filter includes active turf, class, and tournament', upcoming.length, 3);

  const completed = filterUnifiedHistory({ items: list, statusFilter: 'completed' });
  check('completed filter finds played turf', completed.length, 1);

  // Search
  const matchZaheer = filterUnifiedHistory({ items: list, searchQuery: 'Zaheer' });
  check('searches by coach name', matchZaheer.length, 1);

  const matchTeam = filterUnifiedHistory({ items: list, searchQuery: 'Azar XI' });
  check('searches by team name', matchTeam.length, 1);

  const matchRef = filterUnifiedHistory({ items: list, searchQuery: 'BK-1001' });
  check('searches by booking ref', matchRef.length, 1);

  // Metrics
  const metrics = computeHistoryMetrics(list);
  check('metrics total count', metrics.totalCount, 4);
  check('metrics turf count', metrics.turfCount, 2);
  check('metrics class count', metrics.classCount, 1);
  check('metrics tournament count', metrics.tournamentCount, 1);
  check('metrics total spent', metrics.totalSpent, 7900);

  // Role-based visibility tests
  const { getRoleAllowedHistoryTypes } = require('@/utils/booking-history-utils');
  check('Player gets 3 categories (turf, class, tournament)', getRoleAllowedHistoryTypes('Player'), ['turf', 'class', 'tournament']);
  check('Organizer gets 2 categories except tournament (turf, class)', getRoleAllowedHistoryTypes('Organizer'), ['turf', 'class']);
  check('Coach gets turf and tournament categories', getRoleAllowedHistoryTypes('Coach'), ['turf', 'tournament']);
  check('Turf Owner gets only tournament category', getRoleAllowedHistoryTypes('Owner'), ['tournament']);

  // Role-based filtering
  const coachItems = filterUnifiedHistory({ items: list, allowedTypes: ['turf', 'tournament'] });
  check('Coach filtered items include turf and tournament, exclude class', coachItems.every((i) => i.type !== 'class'), true);

  const ownerItems = filterUnifiedHistory({ items: list, allowedTypes: ['tournament'] });
  check('Owner filtered items only include tournament', ownerItems.every((i) => i.type === 'tournament'), true);

  const organizerItems = filterUnifiedHistory({ items: list, allowedTypes: ['turf', 'class'] });
  check('Organizer filtered items exclude tournaments', organizerItems.every((i) => i.type !== 'tournament'), true);

  return { passed, failed };
}
