/**
 * drawer-links.test.ts
 * The profile drawer's per-role Functions shortcuts.
 */

import { drawerFunctionLinks, notificationsSummary, NOTIFICATION_SETTINGS } from '@/constants/drawer-links';
import { cacheKeysToClear } from '@/utils/app-cache';

// The app's tsconfig carries no Node types; the ts-node runner provides these.
declare const __dirname: string;
const fs = require('fs');
const path = require('path');

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

const ROLES = ['Player', 'Coach', 'Owner', 'Organizer', 'Admin', 'Super Admin'];
const keysFor = (role: string) => drawerFunctionLinks(role).map(l => l.key);

export function runDrawerLinkTests() {
  passed = 0;
  failed = 0;
  console.log('\n🧭 Profile drawer functions\n');

  check('a player gets bookings, wallet and teams', keysFor('Player'), ['bookings', 'wallet', 'teams']);
  check('a player never sees payouts', keysFor('Player').some(k => k === 'payouts' || k === 'earnings'), false);
  check('an owner starts with turf bookings', keysFor('Owner')[0], 'turf-bookings');
  check('a coach starts with earnings', keysFor('Coach')[0], 'earnings');
  check('a coach does not have classes or students in drawer', keysFor('Coach').some(k => k === 'classes' || k === 'students'), false);
  check('an organizer starts with hosting', keysFor('Organizer')[0], 'host');
  check(
    'every paid role can reach payouts',
    ['Owner', 'Coach', 'Organizer'].every(r => keysFor(r).includes('payouts')),
    true
  );
  check('an unknown role is treated as a player', keysFor('Scout'), keysFor('Player'));
  check('a missing role is treated as a player', drawerFunctionLinks(undefined).map(l => l.key), keysFor('Player'));
  check('every role can reach the wallet', ROLES.every(r => keysFor(r).includes('wallet')), true);
  check('no role lists a shortcut twice', ROLES.every(r => new Set(keysFor(r)).size === keysFor(r).length), true);

  // A shortcut to a screen that doesn't exist would open a blank "not found".
  const appDir = path.join(__dirname, '..', 'app');
  const missing = ROLES.flatMap(r => drawerFunctionLinks(r))
    .map(l => l.path)
    .filter(p => !fs.existsSync(path.join(appDir, `${p.replace(/^\//, '')}.tsx`)));
  check('every shortcut opens a real screen', [...new Set(missing)], []);

  // ── Settings in the drawer ───────────────────────────────────────────────
  check('unset notifications read at their defaults', notificationsSummary({}), '2 of 5 on');
  check('a saved switch overrides its default', notificationsSummary({ emailAlerts: true }), '3 of 5 on');
  check(
    'every switch on reads as all on',
    notificationsSummary(Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.key, true]))),
    'All notifications on'
  );
  check(
    'every switch off reads as all off',
    notificationsSummary(Object.fromEntries(NOTIFICATION_SETTINGS.map(n => [n.key, false]))),
    'All notifications off'
  );
  check('a missing profile reads at defaults', notificationsSummary(undefined), '2 of 5 on');

  check(
    'clearing the cache keeps the session and profile',
    cacheKeysToClear(['@turf_auth_token', '@turf_user_profile', '@turf_bookings', '@turf_tournaments']),
    ['@turf_bookings', '@turf_tournaments']
  );
  check('clearing an empty store removes nothing', cacheKeysToClear([]), []);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
