/**
 * cup-display.test.ts
 * What the Cups cards and the "Cups at a Glance" card show.
 */

import { cupStatus, teamsProgress, prizeLabel, sportIcon, sportEmoji, cupsSummary } from '@/utils/cup-display';
import { ACCENTS } from '@/constants/dashboard-accents';

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

export function runCupDisplayTests() {
  passed = 0;
  failed = 0;
  console.log('\n🏆 Cups cards\n');

  check('a live cup reads live in red', cupStatus({ status: 'Ongoing', isLive: true }), { label: 'Live now', accent: ACCENTS.red });
  check('a finished cup reads finished in slate', cupStatus({ status: 'Finished' }), { label: 'Finished', accent: ACCENTS.slate });
  check('filling fast reads orange', cupStatus({ status: 'Registering', registrationStatus: 'Filling Fast' }).accent, ACCENTS.orange);
  check('an upcoming cup is opening soon', cupStatus({ status: 'Upcoming', registrationStatus: 'Upcoming' }).label, 'Opening soon');
  check('a closed window reads closed', cupStatus({ registrationStatus: 'Closed' }).label, 'Registration closed');
  check('an open cup is registering in green', cupStatus({ status: 'Registering' }), { label: 'Registering now', accent: ACCENTS.green });

  check('12 of 16 teams is three-quarters full', teamsProgress(12, 16), 0.75);
  check('an uncapped cup has no fill', teamsProgress(5, 0), 0);
  check('an overfull cup caps at full', teamsProgress(20, 16), 1);

  check('a parsed prize is formatted in rupees', prizeLabel(50000, 'Big prize'), '₹50,000');
  check('no amount falls back to the label', prizeLabel(0, ' ₹2,500 + Trophy '), '₹2,500 + Trophy');
  check('no prize at all reads TBD', prizeLabel(undefined, ''), 'TBD');

  check('cricket has a cricket icon', sportIcon('Cricket'), 'cricket');
  check('an unknown sport gets a trophy', sportIcon('Chess'), 'trophy-outline');
  check('football reads as a football', sportEmoji('Football'), '⚽');

  const summary = cupsSummary([
    { status: 'Registering', prizePoolAmount: 2500 },
    { status: 'Registering', registrationStatus: 'Filling Fast', prizePoolAmount: 5000 },
    { status: 'Ongoing', isLive: true, prizePoolAmount: 50000 },
    { status: 'Upcoming', registrationStatus: 'Upcoming' },
    { status: 'Finished' },
    { registrationStatus: 'Closed' },
  ]);
  check('the glance card counts each state', summary, { total: 6, open: 2, live: 1, upcoming: 1, finished: 1, topPrize: 50000 });
  check('an empty list counts nothing', cupsSummary([]), { total: 0, open: 0, live: 0, upcoming: 0, finished: 0, topPrize: 0 });

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
