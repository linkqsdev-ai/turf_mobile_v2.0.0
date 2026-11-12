/**
 * directory-search.test.ts
 * Matching rules for reusing existing teams and players at registration.
 */

import {
  normalisePhone,
  searchTeams,
  searchPlayers,
  buildPlayerDirectory,
  isInSquad,
  filterRoster,
  DirectoryTeam,
} from '@/utils/directory-search';

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

export function runDirectorySearchTests() {
  passed = 0;
  failed = 0;
  console.log('\n🔎 Team & player directory\n');

  // ── Phones ───────────────────────────────────────────────────────────────
  check('a formatted Indian number reduces to 10 digits', normalisePhone('+91 98765 11111'), '9876511111');
  check('a bare number is unchanged', normalisePhone('9876511111'), '9876511111');
  check('a missing phone is empty', normalisePhone(undefined), '');

  // ── Teams ────────────────────────────────────────────────────────────────
  const teams: DirectoryTeam[] = [
    { id: 't1', name: 'Royal Strikers', players: [{ name: 'Guna' }], source: 'team' },
    { id: 't2', name: 'Knights Riders', players: [], source: 'team' },
    { id: 'r1', name: 'Royal Strikers', players: [{ name: 'Guna' }, { name: 'Siva' }], source: 'registration' },
    { id: 't3', name: 'Loyal Royals', players: [], source: 'team' },
  ];

  check('a one-letter query suggests nothing', searchTeams('R', teams), []);
  check('matching is case-insensitive', searchTeams('royal', teams).length, 2);
  check(
    'prefix matches rank above anywhere-matches',
    searchTeams('roy', teams).map(t => t.name),
    ['Royal Strikers', 'Loyal Royals']
  );
  check('a duplicate team name appears once', searchTeams('strik', teams).length, 1);
  check('the fuller roster wins between duplicates', searchTeams('strik', teams)[0].players.length, 2);
  check('no match yields nothing', searchTeams('zzz', teams), []);
  check('results respect the limit', searchTeams('ri', teams, 1).length, 1);

  // ── Player directory ─────────────────────────────────────────────────────
  const dir = buildPlayerDirectory([
    { name: 'Guna', phone: '+91 98765 11111', team: 'Royal Strikers' },
    { name: 'Guna', phone: '9876511111' },
    { name: 'Siva' },
    { name: 'siva' },
    { name: 'Asik', phone: '9876522222' },
    { name: '' },
  ]);
  check('the same phone in two formats is one player', dir.filter(p => p.name === 'Guna').length, 1);
  check('name-only duplicates collapse', dir.filter(p => p.name.toLowerCase() === 'siva').length, 1);
  check('nameless entries are dropped', dir.every(p => p.name.length > 0), true);
  check('the directory has three people', dir.length, 3);

  // ── Player search ────────────────────────────────────────────────────────
  check('players are found by name', searchPlayers('gu', dir).map(p => p.name), ['Guna']);
  check('players are found by phone digits', searchPlayers('98765222', dir).map(p => p.name), ['Asik']);
  check(
    'a player already in the squad is not suggested again',
    searchPlayers('gu', dir, ['Guna']),
    []
  );
  check(
    'exclusion also works by phone',
    searchPlayers('as', dir, ['+91 98765 22222']),
    []
  );
  check('a one-letter query suggests nothing', searchPlayers('g', dir), []);

  // ── Picking players from a selected team ────────────────────────────────
  const squad = [{ name: 'Guna', phone: '9876511111' }, { name: 'Siva' }];
  check('a squad member is found by phone', isInSquad({ name: 'G. Kumar', phone: '+91 98765 11111' }, squad), true);
  check('a squad member is found by name when no phone', isInSquad({ name: 'siva' }, squad), true);
  check(
    'same name, different numbers are different people',
    isInSquad({ name: 'Guna', phone: '9000000000' }, squad),
    false
  );
  check('someone new is not in the squad', isInSquad({ name: 'Asik' }, squad), false);

  const roster = [
    { name: 'Guna', phone: '9876511111' },
    { name: 'Siva' },
    { name: 'Asik', phone: '9876522222' },
  ];
  check('an empty roster search keeps everyone', filterRoster('', roster).length, 3);
  check('the roster filters by name', filterRoster('siv', roster).map(p => p.name), ['Siva']);
  check('a name match can fall anywhere in the name', filterRoster('si', roster).map(p => p.name), ['Siva', 'Asik']);
  check('the roster filters by number', filterRoster('22222', roster).map(p => p.name), ['Asik']);
  check('a number never matches a player without one', filterRoster('98765', roster).length, 2);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
