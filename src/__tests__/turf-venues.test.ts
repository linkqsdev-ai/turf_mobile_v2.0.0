/**
 * turf-venues.test.ts
 * Which turfs the tournament venue picker offers, and how it searches them.
 */

import { turfVenueOptions, filterTurfVenues } from '@/utils/turf-venues';
import { STATIC_TURFS } from '@/constants/turfs';

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

export function runTurfVenueTests() {
  passed = 0;
  failed = 0;
  console.log('\n🏟  Tournament venue picker\n');

  const owned = [
    { id: 'turf-1', name: 'Anna Arena ', address: ' Thillai Nagar, Trichy', sportType: 'Cricket', isActive: true },
    { id: 'turf-2', name: 'Closed Ground', address: 'Srirangam', isActive: false },
    { id: 'turf-3', name: 'Wembley Powerleague', address: 'My own Wembley', sportType: 'Football' },
  ];
  const options = turfVenueOptions(owned, STATIC_TURFS);

  check('app turfs come before shipped venues', options[0].source, 'owned');
  check('names and addresses are trimmed', [options[0].name, options[0].address], ['Anna Arena', 'Thillai Nagar, Trichy']);
  check('a deactivated turf is not offered', options.some(o => o.name === 'Closed Ground'), false);
  check(
    'an app turf replaces a shipped venue of the same name',
    options.filter(o => o.name === 'Wembley Powerleague').map(o => o.source),
    ['owned']
  );
  check('every shipped venue is otherwise offered', options.filter(o => o.source === 'listed').length, STATIC_TURFS.length - 1);
  check('a shipped venue uses its location as the address', options.find(o => o.id === 'skyline')?.address, 'Canary Wharf, East London');
  check('nameless turfs are skipped', turfVenueOptions([{ id: 'x', name: '  ' }], []).length, 0);

  check('an empty search keeps every venue', filterTurfVenues('', options).length, options.length);
  check('search matches the name', filterTurfVenues('anna', options).map(o => o.id), ['turf-1']);
  check('search matches the address', filterTurfVenues('stratford', options).map(o => o.id), ['the-grid']);
  check('no match yields nothing', filterTurfVenues('zzz', options), []);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
