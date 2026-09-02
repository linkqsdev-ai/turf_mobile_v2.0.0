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
import {
  computeSettlement,
  assertSettlementBalances,
  summarisePayout,
  canTransition,
  PLATFORM_FEE_PER_SLOT,
  type PayoutLine,
} from '../lib/settlement';
import {
  payoutReadiness,
  isValidGstin,
  isValidIfsc,
  isValidUpi,
  gstinMatchesPan,
  maskAccountNumber,
} from '../store/payout-store';

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

  console.log('\n💰 [6] SETTLEMENT, REVENUE SPLIT & VOUCHER REIMBURSEMENT TESTS:');

  runTest('Platform takes flat 3rs/slot from the owner, never from the player', () => {
    const s = computeSettlement({ slotCount: 4, pricePerSlot: 500, taxable: false });
    assertEqual(s.gross, 2000, 'Gross must be 4 x 500');
    assertEqual(s.playerPays, 2000, 'Player pays the advertised price — fee is not added on top');
    assertEqual(s.platformFee, 4 * PLATFORM_FEE_PER_SLOT, 'Fee must be 3 per slot');
    assertEqual(s.ownerPayout, 1988, 'Owner receives gross minus the 12 fee');
    assert(assertSettlementBalances(s), 'Settlement must balance');
  });

  runTest('Platform-funded voucher is reimbursed so the owner is kept whole', () => {
    const s = computeSettlement({
      slotCount: 2,
      pricePerSlot: 500,
      taxable: false,
      discount: { code: 'SALE50', amount: 500, funder: 'platform' },
    });
    assertEqual(s.playerPays, 500, 'Player pays 1000 less the 500 voucher');
    assertEqual(s.ownerReimbursement, 500, 'Platform reimburses the full voucher');
    assertEqual(s.ownerPayout, 994, 'Owner still gets 1000 minus only the 6 fee');
    assertEqual(s.platformNet, -494, 'Platform absorbs the voucher: 6 fee minus 500');
    assert(assertSettlementBalances(s), 'Settlement must balance');
  });

  runTest('Owner-funded offer is absorbed by the owner, never reimbursed', () => {
    const s = computeSettlement({
      slotCount: 2,
      pricePerSlot: 500,
      taxable: false,
      discount: { code: 'WEEKDAY20', amount: 200, funder: 'owner' },
    });
    assertEqual(s.ownerReimbursement, 0, 'An owner-funded offer is not reimbursed');
    assertEqual(s.ownerPayout, 794, 'Owner absorbs the 200 and pays the 6 fee');
    assertEqual(s.platformNet, 6, 'Platform simply keeps its fee');
    assert(assertSettlementBalances(s), 'Settlement must balance');
  });

  runTest('GST is charged on the platform fee and deducted from the payout', () => {
    const s = computeSettlement({ slotCount: 10, pricePerSlot: 100, taxable: true });
    assertEqual(s.platformFee, 30, 'Fee is 10 slots x 3');
    assertEqual(s.platformFeeGst, 5.4, 'GST is 18% of 30');
    assertEqual(s.platformDeduction, 35.4, 'Owner is deducted fee plus GST');
    assertEqual(s.ownerPayout, 964.6, 'Owner receives 1000 minus 35.40');
    assert(assertSettlementBalances(s), 'Settlement must balance');
  });

  runTest('Discount is capped at gross and negative amounts cannot inflate a bill', () => {
    const over = computeSettlement({
      slotCount: 1, pricePerSlot: 200, taxable: false,
      discount: { code: 'HUGE', amount: 900, funder: 'platform' },
    });
    assertEqual(over.discountApplied, 200, 'Discount cannot exceed the gross');
    assertEqual(over.playerPays, 0, 'Player never pays a negative amount');

    const negative = computeSettlement({
      slotCount: 1, pricePerSlot: 200, taxable: false,
      discount: { code: 'BAD', amount: -50, funder: 'platform' },
    });
    assertEqual(negative.playerPays, 200, 'A negative discount must not increase the bill');
  });

  runTest('Settlement books balance across many generated cases', () => {
    const funders: ('platform' | 'owner')[] = ['platform', 'owner'];
    let checked = 0;
    for (let slots = 0; slots <= 6; slots++) {
      for (const price of [0, 99, 250, 333, 1200]) {
        for (const f of funders) {
          for (const amount of [0, 37, price, price * 3]) {
            const s = computeSettlement({
              slotCount: slots, pricePerSlot: price,
              discount: { code: 'X', amount, funder: f },
            });
            assert(assertSettlementBalances(s), `Books must balance for ${slots}x${price} ${f} ${amount}`);
            assert(s.playerPays >= 0, 'Player payment is never negative');
            assert(s.discountApplied <= s.gross, 'Discount never exceeds gross');
            checked++;
          }
        }
      }
    }
    assert(checked > 200, 'Expected a broad sweep of generated cases');
  });

  runTest('Payout batch totals aggregate payout, reimbursement and deductions', () => {
    const lines: PayoutLine[] = [
      { bookingId: 'b1', bookingRef: 'BK-1', date: '2026-09-01',
        settlement: computeSettlement({ slotCount: 2, pricePerSlot: 500, taxable: false,
          discount: { code: 'V', amount: 100, funder: 'platform' } }) },
      { bookingId: 'b2', bookingRef: 'BK-2', date: '2026-09-02',
        settlement: computeSettlement({ slotCount: 1, pricePerSlot: 300, taxable: false }) },
    ];
    const totals = summarisePayout(lines);
    assertEqual(totals.totalPayout, 994 + 297, 'Payout total sums both lines');
    assertEqual(totals.totalReimbursement, 100, 'Only the voucher line is reimbursed');
    assertEqual(totals.totalPlatformDeduction, 9, 'Deductions are 6 + 3');
  });

  runTest('Payout status machine allows retries but never resurrects a paid batch', () => {
    assert(canTransition('pending', 'payable'), 'pending -> payable is allowed');
    assert(canTransition('processing', 'failed'), 'processing -> failed is allowed');
    assert(canTransition('failed', 'payable'), 'A failed transfer must be retryable');
    assert(!canTransition('paid', 'payable'), 'A paid batch is terminal');
    assert(!canTransition('pending', 'paid'), 'Cannot skip straight to paid');
  });

  console.log('\n🏦 [7] PAYEE GST & PAYMENT DETAIL VALIDATION TESTS:');

  runTest('GSTIN, IFSC and UPI formats are validated, not merely non-empty', () => {
    assert(isValidGstin('33ABCDE1234F1Z5'), 'A well-formed GSTIN is accepted');
    assert(!isValidGstin('33ABCDE1234F1Z'), 'A 14-char GSTIN is rejected');
    assert(!isValidGstin('ABCDE1234F1Z5XX'), 'A GSTIN without a state code is rejected');
    assert(isValidIfsc('HDFC0001234'), 'A well-formed IFSC is accepted');
    assert(!isValidIfsc('HDFC1001234'), 'IFSC without the reserved 0 is rejected');
    assert(isValidUpi('turfowner@okhdfcbank'), 'A well-formed UPI id is accepted');
    assert(!isValidUpi('turfowner'), 'A UPI id without a handle is rejected');
  });

  runTest('GSTIN must embed the declared PAN', () => {
    assert(gstinMatchesPan('33ABCDE1234F1Z5', 'ABCDE1234F'), 'Matching PAN passes');
    assert(!gstinMatchesPan('33ABCDE1234F1Z5', 'ZZZZZ9999Z'), 'Mismatched PAN fails');
  });

  runTest('A profile is only payable when its payment details are usable', () => {
    const base = {
      role: 'owner' as const,
      legalName: 'Skyline Sports LLP',
      address: { line1: '12 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' },
    };

    const badIfsc = payoutReadiness({
      ...base, payoutMethod: 'bank',
      bank: { accountName: 'Skyline Sports LLP', accountNumber: '123456789012', ifsc: 'NOPE' },
    });
    assert(!badIfsc.payable, 'A malformed IFSC blocks payout');
    assert(badIfsc.issues.some(i => i.field === 'bank.ifsc'), 'The IFSC issue is reported');

    const goodBank = payoutReadiness({
      ...base, payoutMethod: 'bank',
      bank: { accountName: 'Skyline Sports LLP', accountNumber: '123456789012', ifsc: 'HDFC0001234' },
    });
    assert(goodBank.payable, 'A complete bank profile is payable');
    assert(goodBank.warnings.some(w => w.field === 'gstin'), 'Missing GSTIN warns but does not block');

    const goodUpi = payoutReadiness({ ...base, payoutMethod: 'upi', upiId: 'skyline@okaxis' });
    assert(goodUpi.payable, 'A valid UPI profile is payable');

    const noProfile = payoutReadiness(null);
    assert(!noProfile.payable, 'A missing profile is never payable');
  });

  runTest('Account numbers are masked once stored', () => {
    assertEqual(maskAccountNumber('123456789012'), '••••••••9012', 'Only the last 4 digits are shown');
    assertEqual(maskAccountNumber(''), '••••', 'An empty account still masks safely');
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
