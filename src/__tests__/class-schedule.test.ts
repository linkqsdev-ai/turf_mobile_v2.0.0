/**
 * class-schedule.test.ts
 *
 * Classes store dates as DD/MM/YYYY, which the built-in Date parser reads as
 * MM/DD/YYYY. Getting this wrong silently mislabels a class as finished or
 * not-yet-started, so the parsing and status rules are pinned here.
 */

import {
  parseClassDate,
  classStatus,
  formatClassDate,
  formatClassDateRange,
  formatReadableDate,
  daysUntilStart,
  normaliseScheduleList,
} from '@/utils/class-schedule';

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

export function runClassScheduleTests() {
  passed = 0;
  failed = 0;
  console.log('\n📚 Class schedule\n');

  // ── Parsing ──────────────────────────────────────────────────────────────
  const d = parseClassDate('03/09/2026');
  check('day/month are not swapped (03/09 is 3 September)', d?.getMonth(), 8);
  check('the day is read from the first field', d?.getDate(), 3);
  check('the year is read from the third field', d?.getFullYear(), 2026);
  check('parsing normalises to midnight', d?.getHours(), 0);

  check('a missing value is null', parseClassDate(undefined), null);
  check('an empty string is null', parseClassDate(''), null);
  check('a non-date string is null', parseClassDate('soon'), null);
  check('a two-part date is null', parseClassDate('03/09'), null);
  check('an ISO date is rejected, not misread', parseClassDate('2026-09-03'), null);

  // Round-trip validation — the reason this parser exists.
  check('day 32 does not roll into next month', parseClassDate('32/01/2026'), null);
  check('30 February is rejected', parseClassDate('30/02/2026'), null);
  check('month 13 is rejected', parseClassDate('01/13/2026'), null);
  check('29 Feb is valid in a leap year', parseClassDate('29/02/2024')?.getDate(), 29);
  check('29 Feb is rejected in a non-leap year', parseClassDate('29/02/2026'), null);
  check('an absurd year is rejected', parseClassDate('01/01/0007'), null);

  // ── Status ───────────────────────────────────────────────────────────────
  const today = new Date(2026, 8, 10); // 10 Sep 2026

  check(
    'a class starting later is upcoming',
    classStatus('15/09/2026', '20/09/2026', today),
    'upcoming'
  );
  check(
    'a class spanning today is ongoing',
    classStatus('05/09/2026', '20/09/2026', today),
    'ongoing'
  );
  check(
    'a class that ended is completed',
    classStatus('01/09/2026', '05/09/2026', today),
    'completed'
  );
  check(
    'a class starting today is ongoing, not upcoming',
    classStatus('10/09/2026', '20/09/2026', today),
    'ongoing'
  );
  check(
    'a class ending today is ongoing, not completed',
    classStatus('01/09/2026', '10/09/2026', today),
    'ongoing'
  );
  check(
    'a one-day class today is ongoing',
    classStatus('10/09/2026', '10/09/2026', today),
    'ongoing'
  );
  check(
    'no dates at all is unknown, never completed',
    classStatus(undefined, undefined, today),
    'unknown'
  );
  check(
    'unparseable dates are unknown, never completed',
    classStatus('soon', 'later', today),
    'unknown'
  );
  check(
    'a start date alone still places the class',
    classStatus('15/09/2026', undefined, today),
    'upcoming'
  );
  check(
    'an end date alone still places the class',
    classStatus(undefined, '05/09/2026', today),
    'completed'
  );

  // ── Formatting ───────────────────────────────────────────────────────────
  check('a date formats unambiguously', formatClassDate('03/09/2026'), '3 Sep 2026');
  check('an ISO date formats cleanly', formatClassDate('2026-09-09T11:07:54.962Z'), '9 Sep 2026');
  check('formatReadableDate handles ISO timestamps', formatReadableDate('2026-09-09T11:07:54.962Z'), '9 Sep 2026');
  check('formatReadableDate handles DD/MM/YYYY', formatReadableDate('09/09/2026'), '9 Sep 2026');
  check('formatReadableDate handles human strings', formatReadableDate('12 May 2026'), '12 May 2026');
  check('formatReadableDate handles undefined', formatReadableDate(undefined), 'Recently');
  check(
    'a range shows both ends',
    formatClassDateRange('03/09/2026', '19/09/2026'),
    '3 Sep 2026 – 19 Sep 2026'
  );
  check(
    'a single-day range collapses',
    formatClassDateRange('03/09/2026', '03/09/2026'),
    '3 Sep 2026'
  );
  check(
    'a half-known range shows the known end',
    formatClassDateRange('03/09/2026', undefined),
    '3 Sep 2026'
  );
  check('an empty range is empty, not "Invalid Date"', formatClassDateRange(null, null), '');
  check(
    'an unparseable date is echoed rather than mangled',
    formatClassDate('TBD'),
    'TBD'
  );

  // ── Countdown ────────────────────────────────────────────────────────────
  check('days until start counts forward', daysUntilStart('15/09/2026', today), 5);
  check('a class starting today has no countdown', daysUntilStart('10/09/2026', today), null);
  check('a past class has no countdown', daysUntilStart('01/09/2026', today), null);
  check('an unparseable date has no countdown', daysUntilStart('soon', today), null);

  // ── Schedule normalisation ───────────────────────────────────────────────
  // A day map read as an array is what rendered "[object Object]" on the cards.
  check(
    'a day map yields the ticked days, not "[object Object]"',
    normaliseScheduleList({ Wed: true, Mon: true, Fri: false, Sat: true }),
    ['Mon', 'Wed', 'Sat']
  );
  check(
    'ticked days come back in calendar order, not insertion order',
    normaliseScheduleList({ Sun: true, Tue: true, Mon: true }),
    ['Mon', 'Tue', 'Sun']
  );
  check('an all-false day map is empty', normaliseScheduleList({ Mon: false }), []);
  check('an empty day map is empty', normaliseScheduleList({}), []);
  check(
    'a comma-joined string splits and trims',
    normaliseScheduleList('7:00 AM, 8:00 AM'),
    ['7:00 AM', '8:00 AM']
  );
  check(
    'a plain array passes through',
    normaliseScheduleList(['Morning', 'Evening']),
    ['Morning', 'Evening']
  );
  check('an array drops empty entries', normaliseScheduleList(['Mon', '', null]), ['Mon']);
  check('undefined is empty', normaliseScheduleList(undefined), []);
  check('null is empty', normaliseScheduleList(null), []);
  check('an empty string is empty', normaliseScheduleList(''), []);
  check(
    'unknown keys survive after the known weekdays',
    normaliseScheduleList({ Holiday: true, Mon: true }),
    ['Mon', 'Holiday']
  );

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
