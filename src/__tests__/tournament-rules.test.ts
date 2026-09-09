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
  roundName,
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

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
