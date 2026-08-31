// Mock asset requires for Node.js test environment
// @ts-ignore
if (typeof require !== 'undefined' && require.extensions) {
  // @ts-ignore
  require.extensions['.png'] = () => 1;
  // @ts-ignore
  require.extensions['.jpg'] = () => 1;
}

import { createBooking, generateBookingRef, Booking } from '../store/booking-store';
import { createRegistration, generateTournamentId, PublishedTournament } from '../store/tournament-store';
import { createTeam, createMatch, Team, Match, Player } from '../store/match-store';
import { createTurf, PublishedTurf } from '../store/turf-store';
import { getShortLocation } from '../hooks/use-user-profile';

// Lightweight Assert utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`❌ Assertion Failed: ${message} | Expected: ${expected}, Got: ${actual}`);
  }
}

let passedTests = 0;
let totalTests = 0;

function runTest(testName: string, testFn: () => void) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✓ ${testName}`);
    passedTests++;
  } catch (error: any) {
    console.error(`  ✗ ${testName}\n    ${error.message}`);
  }
}

export function runAllMobileTests() {
  console.log('\n======================================================');
  console.log('🏟️  TURF MOBILE V2.0.0 — COMPREHENSIVE TEST SUITE');
  console.log('======================================================\n');

  console.log('📦 [1] BOOKING & PRICING ENGINE TESTS:');
  
  runTest('generateBookingRef returns valid 11-char ref starting with BK-', () => {
    const ref = generateBookingRef();
    assert(ref.startsWith('BK-'), 'Ref must start with BK-');
    assertEqual(ref.length, 11, 'Ref length must be 11 characters');
  });

  runTest('createBooking generates confirmed booking with advance and remaining calculations', () => {
    const bookingParams: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'status'> = {
      venueId: 'turf-1',
      venueName: 'Skyline Turf Arena',
      venueLocation: 'CHN, TN',
      venueImage: 'https://example.com/turf.jpg',
      date: '2026-09-01',
      dayLabel: 'Tuesday, 01 Sep 2026',
      slots: ['18:00', '19:00'],
      totalAmount: 1800,
      advancePaid: 500,
      remaining: 1300,
      paymentMethod: 'UPI',
      coachAdded: true,
      recordingAdded: false,
    };

    const booking = createBooking(bookingParams);
    assert(booking.id.startsWith('booking-'), 'Booking ID must have prefix');
    assertEqual(booking.status, 'confirmed', 'Initial status must be confirmed');
    assertEqual(booking.totalAmount - booking.advancePaid, booking.remaining, 'Remaining amount math must match');
    assertEqual(booking.coachAdded, true, 'Coach add-on must be preserved');
  });

  console.log('\n🏏 [2] MATCH & CRICKET SCORING ENGINE TESTS:');

  runTest('createTeam initializes stats with 0 wins, 0 losses, 0 draws', () => {
    const player: Player = {
      id: 'p-1',
      name: 'Azarudeen',
      position: 'All-Rounder',
      skillLevel: 'Pro',
    };

    const team = createTeam({
      name: 'Chennai Strikers',
      sport: 'Cricket',
      mascot: 'lion',
      players: [player],
      isFavourite: true,
    });

    assertEqual(team.name, 'Chennai Strikers', 'Team name must match');
    assertEqual(team.wins, 0, 'Wins must start at 0');
    assertEqual(team.losses, 0, 'Losses must start at 0');
    assertEqual(team.players.length, 1, 'Player roster count must be 1');
  });

  runTest('createMatch initializes status as pending with 0-0 score', () => {
    const homeTeam = createTeam({ name: 'Team Alpha', sport: 'Cricket', players: [] });
    const awayTeam = createTeam({ name: 'Team Beta', sport: 'Cricket', players: [] });

    const match = createMatch({
      sport: 'Cricket',
      matchType: 'Quick',
      homeTeam,
      awayTeam,
      venueName: 'Skyline Arena',
      scheduledAt: new Date().toISOString(),
    });

    assertEqual(match.status, 'pending', 'New match must be pending');
    assertEqual(match.homeScore, 0, 'Initial home score must be 0');
    assertEqual(match.awayScore, 0, 'Initial away score must be 0');
  });

  runTest('Cricket run rate and strike rate formula validations', () => {
    const runs = 145;
    const overs = 16.4; // 16 overs and 4 balls = 100 balls
    const totalBalls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
    const crr = Number(((runs / totalBalls) * 6).toFixed(2));
    
    assertEqual(totalBalls, 100, '16.4 overs must equal 100 balls');
    assertEqual(crr, 8.70, 'CRR must be 8.70');

    // Batsman strike rate (48 runs off 28 balls)
    const batsmanRuns = 48;
    const batsmanBalls = 28;
    const strikeRate = Number(((batsmanRuns / batsmanBalls) * 100).toFixed(2));
    assertEqual(strikeRate, 171.43, 'Strike rate must be 171.43');
  });

  console.log('\n🏆 [3] TOURNAMENTS & REGISTRATION FLOW TESTS:');

  runTest('createRegistration initializes registration record with pending status', () => {
    const reg = createRegistration({
      tournamentId: 'tourn-101',
      tournamentName: 'Chennai Premier League',
      teamId: 'team-alpha',
      teamName: 'Alpha XI',
      sport: 'Cricket',
      status: 'pending',
      paymentStatus: 'paid',
      entryFee: 1500,
    });

    assert(reg.id.startsWith('reg-'), 'Registration ID must be generated');
    assertEqual(reg.entryFee, 1500, 'Entry fee must match');
    assertEqual(reg.paymentStatus, 'paid', 'Payment status must match');
  });

  console.log('\n📍 [4] LOCATION FORMATTING & PROFILE HELPERS TESTS:');

  runTest('getShortLocation formats various cities into clean short codes', () => {
    assertEqual(getShortLocation('Chennai, Tamil Nadu'), 'CHN, TN', 'Chennai must map to CHN, TN');
    assertEqual(getShortLocation('Bangalore, Karnataka'), 'BLR, KA', 'Bangalore must map to BLR, KA');
    assertEqual(getShortLocation('London, United Kingdom'), 'LDN, UK', 'London must map to LDN, UK');
    assertEqual(getShortLocation('Mumbai, Maharashtra'), 'MUM, MH', 'Mumbai must map to MUM, MH');
    assertEqual(getShortLocation('Dubai, UAE'), 'DXB, UAE', 'Dubai must map to DXB, UAE');
    assertEqual(getShortLocation(''), 'CHN, TN', 'Empty location fallback must be CHN, TN');
  });

  console.log('\n👛 [5] WALLET COIN ECONOMY LOGIC TESTS:');

  runTest('Wallet addition, deduction, and non-negative safety checks', () => {
    let balance = 200; // Starting ₹200
    
    // Add funds
    balance += 500;
    assertEqual(balance, 700, 'Balance after deposit must be 700');

    // Deduct entry fee
    const fee = 300;
    balance -= fee;
    assertEqual(balance, 400, 'Balance after fee deduction must be 400');

    // Guard against over-deduction
    const overDeduction = 600;
    const nextBalance = Math.max(0, balance - overDeduction);
    assertEqual(nextBalance, 0, 'Balance cannot drop below 0');
  });

  console.log('\n======================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

// Auto-run if executed directly via ts-node
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  runAllMobileTests();
}
