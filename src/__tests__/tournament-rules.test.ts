/**
 * tournament-rules.test.ts
 *
 * Name caps and the supported-sport list. Both are enforced in three places —
 * the input, the step validator and the server schema — so the rule they share
 * is pinned here.
 */

import {
  TOURNAMENT_SPORTS,
  isTournamentSport,
  coerceTournamentSport,
  nameLengthIssue,
  MAX_TOURNAMENT_NAME_LENGTH,
  MAX_ORGANIZER_NAME_LENGTH,
  MIN_TOURNAMENT_NAME_LENGTH,
  digitsOnly,
  supportsOvers,
  RULE_PRESET_LIMIT,
  MAX_MONEY_DIGITS,
  MAX_TEAM_SIZE_DIGITS,
  toAmount,
} from '@/constants/tournament';
import {
  hasTournamentStarted,
  registrationCountdown,
  formatRegistrationCountdown,
  registrationBlocker,
  spotsRemaining,
  generateFixtures,
  buildTournamentFixtures,
  shouldAutoGenerateFixtures,
  datesInWindow,
  isoDateParts,
  parseKickoff,
  formatKickoff,
  fixtureDateIssue,
  kickoffToMinutes,
  minutesToKickoff,
  matchLengthMinutes,
  kickoffSlots,
  scheduleAtVenue,
  findOverlap,
  refreshLegacyFixtures,
  isLegacyPitch,
  squadPlayerLimit,
  nextFixture,
  describeFixture,
  renameFixtureVenue,
  hostTournamentStatus,
  roundName,
  scheduleRoundDates,
  voucherMaxDays,
  formatDefaultsFor,
} from '@/store/tournament-store';

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

export function runTournamentRulesTests() {
  passed = 0;
  failed = 0;
  console.log('\n🏆 Tournament rules\n');

  // ── Supported sports ─────────────────────────────────────────────────────
  check('exactly two sports are supported', TOURNAMENT_SPORTS.length, 2);
  check('Football is supported', isTournamentSport('Football'), true);
  check('Cricket is supported', isTournamentSport('Cricket'), true);
  check('Tennis is no longer supported', isTournamentSport('Tennis'), false);
  check('Badminton is not supported', isTournamentSport('Badminton'), false);
  check('a non-string is not a sport', isTournamentSport(undefined), false);
  check('an empty string is not a sport', isTournamentSport(''), false);
  check('matching is case-sensitive', isTournamentSport('football'), false);

  // A draft saved while Tennis was still offered must still open.
  check('an unsupported saved sport falls back', coerceTournamentSport('Tennis'), 'Football');
  check('a missing sport falls back', coerceTournamentSport(undefined), 'Football');
  check('a supported sport is kept', coerceTournamentSport('Cricket'), 'Cricket');

  // ── Name length ──────────────────────────────────────────────────────────
  check('the cap is 20', MAX_TOURNAMENT_NAME_LENGTH, 20);
  check('the organiser cap is 20', MAX_ORGANIZER_NAME_LENGTH, 20);

  check(
    'an empty name is rejected as required',
    nameLengthIssue('Tournament name', ''),
    'Tournament name is required'
  );
  check(
    'whitespace only is rejected as required',
    nameLengthIssue('Tournament name', '   '),
    'Tournament name is required'
  );
  check(
    'a single character is too short',
    nameLengthIssue('Tournament name', 'A'),
    `Tournament name must be at least ${MIN_TOURNAMENT_NAME_LENGTH} characters`
  );
  check('a two-character name is accepted', nameLengthIssue('Tournament name', 'A1'), null);
  check(
    'exactly 20 characters is accepted',
    nameLengthIssue('Tournament name', 'A'.repeat(20)),
    null
  );
  check(
    '21 characters is rejected',
    nameLengthIssue('Tournament name', 'A'.repeat(21)),
    'Tournament name must be 20 characters or fewer'
  );
  check(
    'surrounding spaces do not count toward the cap',
    nameLengthIssue('Tournament name', '  ' + 'A'.repeat(20) + '  '),
    null
  );
  check(
    'the label appears in the organiser message',
    nameLengthIssue('Organizer name', 'A'.repeat(21), MAX_ORGANIZER_NAME_LENGTH),
    'Organizer name must be 20 characters or fewer'
  );

  // ── Numeric-only fields ──────────────────────────────────────────────────
  check('letters are stripped', digitsOnly('90 Mins'), '90');
  check('a currency symbol is stripped', digitsOnly('₹150'), '150');
  check('commas are stripped', digitsOnly('1,500'), '1500');
  check('a word-only value yields nothing', digitsOnly('eleven'), '');
  check('digits are capped', digitsOnly('123456789', MAX_TEAM_SIZE_DIGITS), '12');
  check('money allows seven digits', digitsOnly('99999999', MAX_MONEY_DIGITS), '9999999');
  check('an empty value stays empty', digitsOnly(''), '');
  check('a decimal point is stripped, not rounded', digitsOnly('99.99'), '9999');
  check('a negative sign is stripped', digitsOnly('-50'), '50');

  // ── Overs gating ─────────────────────────────────────────────────────────
  check('cricket enables overs', supportsOvers('Cricket'), true);
  check('gating is case-insensitive', supportsOvers('cricket'), true);
  check('football disables overs', supportsOvers('Football'), false);
  check('an empty sport disables overs', supportsOvers(''), false);

  // ── Rule presets ─────────────────────────────────────────────────────────
  check('only four presets are offered', RULE_PRESET_LIMIT, 4);

  // ── Money parsing ────────────────────────────────────────────────────────
  // A tournament created before the fee inputs became digits-only stores
  // "₹25"; Number("₹25") is NaN, which rendered "Total Payable ₹NaN".
  check('REGRESSION: a currency string parses, not NaN', toAmount('₹25', 0), 25);
  check('a plain numeric string parses', toAmount('25', 0), 25);
  check('a number passes through', toAmount(25, 0), 25);
  check('a thousands separator is handled', toAmount('₹1,500', 0), 1500);
  check('decimals survive', toAmount('₹25.50', 0), 25.5);
  check('undefined falls back', toAmount(undefined, 25), 25);
  check('null falls back', toAmount(null, 25), 25);
  check('an empty string falls back', toAmount('', 25), 25);
  check('a non-numeric string falls back', toAmount('free', 25), 25);
  check('NaN itself falls back', toAmount(NaN, 25), 25);
  check('Infinity falls back', toAmount(Infinity, 25), 25);
  check('an object falls back', toAmount({}, 25), 25);
  check('zero is preserved, not treated as missing', toAmount(0, 25), 0);
  check('a zero string is preserved', toAmount('0', 25), 0);
  check('the default fallback is zero', toAmount('free'), 0);

  // ── Fixtures / Live gate ─────────────────────────────────────────────────
  check('a draft has not started', hasTournamentStarted('Draft'), false);
  check('registering has not started', hasTournamentStarted('Registering'), false);
  check('ongoing has started', hasTournamentStarted('Ongoing'), true);
  check('completed counts as started, so results stay readable', hasTournamentStarted('Completed'), true);
  check('cancelled has not started', hasTournamentStarted('Cancelled'), false);
  check('an unknown status has not started', hasTournamentStarted('Whatever'), false);
  check('a missing status has not started', hasTournamentStarted(undefined), false);
  check('a null status has not started', hasTournamentStarted(null), false);

  // ── Registration countdown ───────────────────────────────────────────────
  // The screen printed a fixed "02d : 14h : 45m" for every tournament.
  const now = new Date('2026-09-10T12:00:00Z');

  check(
    'a future deadline counts down',
    registrationCountdown('2026-09-12T14:45:00Z', now),
    { days: 2, hours: 2, minutes: 45, closed: false }
  );
  check(
    'a deadline under a day has no days',
    registrationCountdown('2026-09-10T18:30:00Z', now)?.days,
    0
  );
  check(
    'a passed deadline reads as closed',
    registrationCountdown('2026-09-09T12:00:00Z', now)?.closed,
    true
  );
  check(
    'the exact deadline instant is closed',
    registrationCountdown('2026-09-10T12:00:00Z', now)?.closed,
    true
  );
  check('a missing deadline is null, not zero', registrationCountdown(undefined, now), null);
  check('an unparseable deadline is null', registrationCountdown('someday', now), null);

  check(
    'the formatted countdown is zero-padded',
    formatRegistrationCountdown('2026-09-12T14:45:00Z', now),
    '02d : 02h : 45m'
  );
  check(
    'a closed window says so rather than showing zeros',
    formatRegistrationCountdown('2026-09-01T00:00:00Z', now),
    'Registration closed'
  );
  check(
    'no deadline formats to null so the row can be hidden',
    formatRegistrationCountdown(null, now),
    null
  );

  // ── Registration cap ─────────────────────────────────────────────────────
  // A 16-team cup used to accept a 17th, showing "17/16" on the progress bar.
  const open16 = { status: 'Registering', maxTeams: 16, teamsCount: 4 };

  check('an open tournament with room accepts teams', registrationBlocker(open16, 4), null);
  check(
    'REGRESSION: a full tournament refuses',
    registrationBlocker({ ...open16, teamsCount: 16 }, 16),
    'full'
  );
  check(
    'over-full also refuses',
    registrationBlocker({ ...open16, teamsCount: 20 }, 20),
    'full'
  );
  check('an uncapped tournament never fills', registrationBlocker({ status: 'Registering', maxTeams: 0 }, 999), null);
  check('an ongoing tournament is closed', registrationBlocker({ status: 'Ongoing', maxTeams: 16 }, 2), 'closed');
  check('a completed tournament is closed', registrationBlocker({ status: 'Completed', maxTeams: 16 }, 2), 'closed');
  check('a cancelled tournament refuses', registrationBlocker({ status: 'Cancelled', maxTeams: 16 }, 2), 'cancelled');
  check('a missing tournament refuses', registrationBlocker(null), 'not_open');
  check(
    'the real registration count wins over a drifted counter',
    registrationBlocker({ status: 'Registering', maxTeams: 4, teamsCount: 1 }, 4),
    'full'
  );

  check('spots left counts down', spotsRemaining(open16, 4), 12);
  check('a full tournament has no spots', spotsRemaining(open16, 16), 0);
  check('spots never go negative', spotsRemaining(open16, 20), 0);
  check('an uncapped tournament reports null', spotsRemaining({ maxTeams: 0 }, 5), null);

  // ── Fixture generation ───────────────────────────────────────────────────
  check('no teams makes no fixtures', generateFixtures([]), []);
  check('one team makes no fixtures', generateFixtures(['Solo']), []);
  check(
    'two teams make one match',
    generateFixtures(['A', 'B']).map(f => `${f.teamA} v ${f.teamB}`),
    ['A v B']
  );
  check(
    'four teams pair first-v-last in opening round',
    generateFixtures(['A', 'B', 'C', 'D']).slice(0, 2).map(f => `${f.teamA} v ${f.teamB}`),
    ['A v D', 'B v C']
  );
  check(
    'an odd count gives the middle team a bye in opening round',
    generateFixtures(['A', 'B', 'C']).slice(0, 2).map(f => `${f.teamA} v ${f.teamB}`),
    ['A v C', 'B v Bye']
  );
  check('every team appears in opening round fixtures', (() => {
    const names = generateFixtures(['A', 'B', 'C', 'D', 'E', 'F'])
      .slice(0, 3)
      .flatMap(f => [f.teamA, f.teamB]);
    return names.sort().join(',');
  })(), 'A,B,C,D,E,F');
  check('blank names are dropped', generateFixtures(['A', '', '  ', 'B']).length, 1);

  // ── Bracket rounds ───────────────────────────────────────────────────────
  // Generation stopped after one round, so a cup never showed its semis/final.
  check('one match is the final', roundName(1), 'Final');
  check('two matches are the semis', roundName(2), 'Semi Final');
  check('four matches are the quarters', roundName(4), 'Quarter Final');
  check('eight matches are the round of 16', roundName(8), 'Round of 16');

  const four = generateFixtures(['A', 'B', 'C', 'D']);
  check(
    'a 4-team draw is semis then a final, not "Round 1"',
    [...new Set(four.map(f => f.round))],
    ['Semi Final', 'Final']
  );
  check('a 4-team draw has three matches', four.length, 3);
  check('the final follows the semi winners', `${four[2].teamA} v ${four[2].teamB}`, 'Winner SF 1 v Winner SF 2');

  const eight = generateFixtures(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  check(
    'REGRESSION: an 8-team draw runs quarters, semis and a final',
    [...new Set(eight.map(f => f.round))],
    ['Quarter Final', 'Semi Final', 'Final']
  );
  check('an 8-team draw has seven matches', eight.length, 7);
  check('the last match is the final', eight[eight.length - 1].matchNo, 'Final');
  check('two teams produce just a final', generateFixtures(['A', 'B']).map(f => f.round), ['Final']);
  check('fixture ids stay unique', (() => {
    const ids = eight.map(f => f.id);
    return new Set(ids).size === ids.length;
  })(), true);

  // ── Fixture dates ────────────────────────────────────────────────────────
  // Every fixture took the start date, so the final shared a day with the QFs.
  const rounds3 = ['Quarter Final', 'Semi Final', 'Final'];
  const d3 = scheduleRoundDates(rounds3, '2026-10-01', '2026-10-07');
  check('REGRESSION: the opening round is on the start date', d3['Quarter Final'], '2026-10-01');
  check('the final is on the end date', d3['Final'], '2026-10-07');
  check('the middle round sits between', d3['Semi Final'], '2026-10-04');
  check('rounds get distinct dates', new Set(Object.values(d3)).size, 3);
  check(
    'a final-only draw is played on the end date',
    scheduleRoundDates(['Final'], '2026-10-01', '2026-10-07')['Final'],
    '2026-10-07'
  );
  check(
    'a one-day window puts every round on that day',
    Object.values(scheduleRoundDates(rounds3, '2026-10-01', '2026-10-01')),
    ['2026-10-01', '2026-10-01', '2026-10-01']
  );
  check('an end before the start collapses to the start', scheduleRoundDates(['Final'], '2026-10-05', '2026-10-01')['Final'], '2026-10-05');
  check('no start date yields no dates', scheduleRoundDates(rounds3, undefined, '2026-10-07'), {});
  check('month boundaries are crossed correctly', scheduleRoundDates(['A', 'B'], '2026-09-30', '2026-10-02')['B'], '2026-10-02');

  // ── Voucher validity ─────────────────────────────────────────────────────
  const today = new Date(2026, 8, 10);
  check('a voucher can run until the tournament ends', voucherMaxDays('2026-09-30', today), 20);
  check('a tournament ending tomorrow allows one day', voucherMaxDays('2026-09-11', today), 1);
  check('a past end date still allows a minimum of one day', voucherMaxDays('2026-09-01', today), 1);
  check('no end date means no cap', voucherMaxDays(undefined, today), null);

  // ── Sport format defaults ────────────────────────────────────────────────
  check('cricket points mention ties, not draws', formatDefaultsFor('Cricket').pointSystem.includes('Tie'), true);
  check('football points mention draws', formatDefaultsFor('Football').pointSystem.includes('Draw'), true);
  check('the two sports differ', formatDefaultsFor('Cricket').pointSystem !== formatDefaultsFor('Football').pointSystem, true);
  check('an unknown sport falls back to football', formatDefaultsFor('Kabaddi'), formatDefaultsFor('Football'));

  // ── Automatic draw on a full roster ──────────────────────────────────────
  check('a full roster with no fixtures is drawn', shouldAutoGenerateFixtures({ maxTeams: 4, fixtures: [] }, 4), true);
  check('a roster with spaces left is not drawn', shouldAutoGenerateFixtures({ maxTeams: 4 }, 3), false);
  check(
    'an existing draw is never replaced',
    shouldAutoGenerateFixtures({ maxTeams: 4, fixtures: [{ id: 'fx-1' }] }, 4),
    false
  );
  check('no team cap means no automatic draw', shouldAutoGenerateFixtures({ maxTeams: 0 }, 6), false);
  check('one team is never drawn', shouldAutoGenerateFixtures({ maxTeams: 1 }, 1), false);
  check('a missing tournament is not drawn', shouldAutoGenerateFixtures(undefined, 4), false);

  const built = buildTournamentFixtures(['A', 'B', 'C', 'D'], '2026-10-01', '2026-10-03');
  check('four teams build two semis and a final', built.map(f => f.matchNo), ['SF 1', 'SF 2', 'Final']);
  check('the semis open on the start date', built[0].date, '2026-10-01');
  check('the final lands on the end date', built[2].date, '2026-10-03');
  check('semis at one venue kick off one after another', [built[0].time, built[1].time], ['09:00 AM', '11:00 AM']);
  check('every built fixture starts scheduled', built.every(f => f.status === 'Scheduled'), true);
  check('no start date falls back to the given date', buildTournamentFixtures(['A', 'B'], undefined, undefined, '2026-09-10')[0].date, '2026-09-10');

  // ── Rescheduling a fixture ───────────────────────────────────────────────
  check('the window includes both ends', datesInWindow('2026-10-01', '2026-10-03'), ['2026-10-01', '2026-10-02', '2026-10-03']);
  check('the window crosses a month end', datesInWindow('2026-09-30', '2026-10-01'), ['2026-09-30', '2026-10-01']);
  check('an end before the start is just the start', datesInWindow('2026-10-05', '2026-10-01'), ['2026-10-05']);
  check('no start date gives no days', datesInWindow(undefined, '2026-10-01'), []);
  check('a runaway window is capped', datesInWindow('2026-01-01', '2027-01-01').length, 62);

  check('date parts read without a timezone shift', isoDateParts('2026-10-01'), { weekday: 'Thu', day: 1, month: 'Oct' });
  check('a malformed date has no parts', isoDateParts('1 Oct'), null);

  check('a stored kick-off parses', parseKickoff('09:00 AM'), { hour: 9, minute: 0, meridiem: 'AM' });
  check('lower-case pm parses', parseKickoff('4:30 pm'), { hour: 4, minute: 30, meridiem: 'PM' });
  check('a 24-hour value is rejected', parseKickoff('13:00 PM'), null);
  check('an empty kick-off is rejected', parseKickoff(''), null);
  check('a kick-off formats with padding', formatKickoff(9, 5, 'PM'), '09:05 PM');
  check('a blank hour is not midnight', formatKickoff('', '30', 'AM'), null);
  check('hour zero is invalid', formatKickoff(0, 0, 'AM'), null);
  check('sixty minutes is invalid', formatKickoff(12, 60, 'AM'), null);
  check('parse and format round-trip', formatKickoff(parseKickoff('04:30 PM')!.hour, parseKickoff('04:30 PM')!.minute, 'PM'), '04:30 PM');

  const draw4 = buildTournamentFixtures(['A', 'B', 'C', 'D'], '2026-10-01', '2026-10-03');
  check('a semi moved past the final is flagged', (fixtureDateIssue(draw4, 'fx-1', '2026-10-04') || '').includes('Final'), true);
  check('a final moved before the semis is flagged', (fixtureDateIssue(draw4, 'fx-3', '2026-09-30') || '').includes('SF'), true);
  check('a semi moved within the window is fine', fixtureDateIssue(draw4, 'fx-1', '2026-10-02'), null);
  check('an unknown fixture raises nothing', fixtureDateIssue(draw4, 'nope', '2026-10-02'), null);

  // ── One venue, one match at a time ───────────────────────────────────────
  check('09:00 AM is 540 minutes', kickoffToMinutes('09:00 AM'), 540);
  check('12:30 PM is 750 minutes', kickoffToMinutes('12:30 PM'), 750);
  check('12:15 AM is 15 minutes', kickoffToMinutes('12:15 AM'), 15);
  check('minutes format back to a kick-off', minutesToKickoff(870), '02:30 PM');
  check('match length reads the format', matchLengthMinutes('120'), 120);
  check('a blank match length defaults to 90', matchLengthMinutes(''), 90);
  check('an absurd match length defaults to 90', matchLengthMinutes('5000'), 90);
  check('90-minute matches get five slots', kickoffSlots(90), ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']);
  check('120-minute matches get four slots', kickoffSlots(120), ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']);

  const venueDraw = buildTournamentFixtures(
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], '2026-10-01', '2026-10-05', '',
    { venue: 'Anna Arena', matchDuration: '120' }
  );
  check('every fixture is at the tournament venue', venueDraw.every(f => f.pitch === 'Anna Arena'), true);
  check(
    'quarter-finals kick off one after another',
    venueDraw.filter(f => f.round === 'Quarter Final').map(f => f.time),
    ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']
  );
  check('no two generated fixtures overlap', venueDraw.some(f => !!findOverlap(venueDraw, f, 120)), false);
  check('a missing venue reads TBD', buildTournamentFixtures(['A', 'B'], '2026-10-01', '2026-10-01')[0].pitch, 'Venue TBD');

  const crowded = [0, 1, 2, 3, 4, 5].map(i => ({ id: `c${i}`, date: '2026-10-01', time: '09:00 AM', pitch: 'Arena' }));
  const spread = scheduleAtVenue(crowded, 120);
  check('a full day spills onto the next day', spread[4].date, '2026-10-02');
  check('the spill starts at the first kick-off', spread[4].time, '09:00 AM');
  check('the next spill follows it', spread[5].time, '11:30 AM');
  check(
    'a clash-free kick-off is left alone',
    scheduleAtVenue([{ id: 'x', date: '2026-10-01', time: '03:15 PM', pitch: 'Arena' }], 90)[0].time,
    '03:15 PM'
  );
  check(
    'different venues may share a kick-off',
    scheduleAtVenue(
      [
        { id: 'a', date: '2026-10-01', time: '09:00 AM', pitch: 'North' },
        { id: 'b', date: '2026-10-01', time: '09:00 AM', pitch: 'South' },
      ],
      90
    )[1].time,
    '09:00 AM'
  );

  const booked = [{ id: 'a', date: '2026-10-01', time: '09:00 AM', pitch: 'Arena' }];
  check('a kick-off inside the match length overlaps', findOverlap(booked, { id: 'b', date: '2026-10-01', time: '10:00 AM', pitch: 'arena' }, 90)?.id, 'a');
  check('a kick-off after the match ends does not', findOverlap(booked, { id: 'b', date: '2026-10-01', time: '10:30 AM', pitch: 'Arena' }, 90), undefined);
  check('another day does not overlap', findOverlap(booked, { id: 'b', date: '2026-10-02', time: '09:00 AM', pitch: 'Arena' }, 90), undefined);

  check('"Pitch A" is a placeholder', isLegacyPitch('Pitch A'), true);
  check('a real venue is not a placeholder', isLegacyPitch('Anna Arena'), false);
  const legacy = [
    { id: 'l1', date: '2026-10-01', time: '09:00 AM', pitch: 'Pitch A' },
    { id: 'l2', date: '2026-10-01', time: '09:00 AM', pitch: 'Pitch B' },
  ];
  const refreshed = refreshLegacyFixtures(legacy, 'Anna Arena', '90');
  check('placeholder pitches move to the venue', refreshed?.map(f => f.pitch), ['Anna Arena', 'Anna Arena']);
  check('their parallel kick-offs are staggered', refreshed?.map(f => f.time), ['09:00 AM', '11:00 AM']);
  check('a draw already at the venue is left alone', refreshLegacyFixtures(refreshed, 'Anna Arena', '90'), null);
  check('a venue that looks like a placeholder is not reused', refreshLegacyFixtures(legacy, 'Pitch C', '90')?.[0].pitch, 'Venue TBD');

  // ── Squad size ───────────────────────────────────────────────────────────
  check('an 11-a-side squad holds 10 besides the captain', squadPlayerLimit('11'), 10);
  check('older "7 players" values still read', squadPlayerLimit('7 players'), 6);
  check('a numeric team size works', squadPlayerLimit(5), 4);
  check('a one-player team has no squad places', squadPlayerLimit('1'), 0);
  check('no team size leaves the squad open', squadPlayerLimit(''), null);
  check('a zero team size leaves the squad open', squadPlayerLimit('0'), null);

  // ── Next fixture on a tournament card ────────────────────────────────────
  const onSept10 = new Date(2026, 8, 10);
  const card = [
    { id: 'f', matchNo: 'Final', date: '2026-10-08', time: '09:00 AM', status: 'Scheduled' },
    { id: 's2', matchNo: 'SF 2', date: '2026-10-01', time: '11:00 AM', status: 'Scheduled' },
    { id: 's1', matchNo: 'SF 1', date: '2026-10-01', time: '09:00 AM', status: 'Scheduled' },
  ];
  check('the earliest kick-off is next', nextFixture(card, onSept10)?.id, 's1');
  check(
    'a rescheduled match moves to the front',
    nextFixture(card.map(f => (f.id === 's2' ? { ...f, date: '2026-09-20' } : f)), onSept10)?.id,
    's2'
  );
  check('a live match beats the schedule', nextFixture([...card, { id: 'l', matchNo: 'SF 3', date: '2026-10-01', time: '09:00 AM', status: 'Live' }], onSept10)?.id, 'l');
  check('finished and past matches are skipped', nextFixture(card.map(f => (f.id === 's1' ? { ...f, status: 'Finished' } : f)), onSept10)?.id, 's2');
  check('nothing left to play gives null', nextFixture(card, new Date(2026, 9, 9)), null);
  check('no draw gives null', nextFixture(undefined), null);
  check('a scheduled fixture reads with date and time', describeFixture(card[2]), 'Next: SF 1 · 1 Oct, 09:00 AM');
  check('a live fixture says so', describeFixture({ ...card[2], status: 'Live' }), 'Live now · SF 1');

  // ── Changing a tournament's venue ────────────────────────────────────────
  const atArena = [
    { id: 'a', pitch: 'Anna Arena' },
    { id: 'b', pitch: 'anna arena ' },
    { id: 'c', pitch: 'Side Ground' },
  ];
  check(
    'fixtures at the old venue move to the new one',
    renameFixtureVenue(atArena, 'Anna Arena', 'Skyline Arena Elite')?.map(f => f.pitch),
    ['Skyline Arena Elite', 'Skyline Arena Elite', 'Side Ground']
  );
  check('an unchanged venue changes nothing', renameFixtureVenue(atArena, 'Anna Arena', ' anna arena'), null);
  check('no fixture at the old venue changes nothing', renameFixtureVenue(atArena, 'Elsewhere', 'Skyline Arena Elite'), null);
  check('no draw changes nothing', renameFixtureVenue(undefined, 'Anna Arena', 'Skyline Arena Elite'), null);
  check('a blank new venue changes nothing', renameFixtureVenue(atArena, 'Anna Arena', ''), null);

  // ── Host dashboard status ────────────────────────────────────────────────
  const sept10 = new Date(2026, 8, 10);
  const cup = {
    status: 'Registering', regStart: '2026-09-01', regEnd: '2026-09-25',
    startDate: '2026-10-01', endDate: '2026-10-08', maxTeams: 4,
  };
  check('an open window with places reads Registering', hostTournamentStatus(cup, 2, sept10), 'Registering');
  check('a filled roster reads Full', hostTournamentStatus(cup, 4, sept10), 'Full');
  check('a passed registration end reads closed', hostTournamentStatus({ ...cup, regEnd: '2026-09-09' }, 2, sept10), 'Registration closed');
  check('a registration start still ahead reads Upcoming', hostTournamentStatus({ ...cup, regStart: '2026-09-15' }, 0, sept10), 'Upcoming');
  check('a start date reached reads Ongoing', hostTournamentStatus({ ...cup, startDate: '2026-09-10' }, 4, sept10), 'Ongoing');
  check('a passed end date reads Completed', hostTournamentStatus({ ...cup, startDate: '2026-09-01', endDate: '2026-09-09' }, 4, sept10), 'Completed');
  check('a stored Completed stays Completed', hostTournamentStatus({ ...cup, status: 'Completed' }, 0, sept10), 'Completed');
  check('Cancelled always wins', hostTournamentStatus({ ...cup, status: 'Cancelled', startDate: '2026-09-01' }, 4, sept10), 'Cancelled');
  check('a cup with no dates reads Registering', hostTournamentStatus({ status: 'Registering', maxTeams: 8 }, 1, sept10), 'Registering');

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
