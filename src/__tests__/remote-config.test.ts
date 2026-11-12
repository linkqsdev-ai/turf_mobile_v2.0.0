/**
 * remote-config.test.ts
 * How the app applies the Super Admin's feature switches and form layouts.
 */

import {
  DRAWER_FEATURES,
  EMPTY_CONFIG,
  MATCH_TAB_FEATURES,
  cleanAnswers,
  customFieldsFor,
  fieldView,
  filterByFeature,
  isFeatureOn,
  isServerToken,
  missingRequired,
  parseRemoteConfig,
  tabFeature,
  validateCustomAnswers,
} from '@/lib/remote-config';

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

const serverResponse = {
  status: 'success',
  role: 'Player',
  version: 1757660000000,
  features: { 'matches.bid_match': false, wallet: true, 'nav.host': false, bogus: 'yes' },
  forms: {
    signup_profile: [
      { key: 'name', label: 'Full name', type: 'text', builtIn: true, visible: true, required: true, order: 1, locked: true },
      { key: 'position', label: 'Position on field', type: 'text', builtIn: true, visible: true, required: true, order: 5, labelOverridden: true, requiredOverridden: true },
      { key: 'bio', label: 'Bio', type: 'textarea', builtIn: true, visible: false, required: false, order: 10 },
      { key: 'playingStyle', label: 'Playing style', type: 'text', builtIn: true, visible: true, required: false, order: 6, placeholder: 'e.g. Anchor' },
      { key: 'aadhaarLast4', label: 'Aadhaar last 4', type: 'number', builtIn: false, visible: true, required: true, order: 3 },
      { key: 'tshirt', label: 'T-shirt size', type: 'select', builtIn: false, visible: true, required: false, order: 12, options: ['S', 'M', 'L'] },
      { key: 'hiddenCustom', label: 'Hidden', type: 'text', builtIn: false, visible: false, required: true, order: 13 },
      { key: 'weird', label: 'Weird', type: 'hologram', builtIn: false, visible: true, required: false, order: 14 },
    ],
    not_a_form: [{ key: 'x', label: 'X', type: 'text' }],
  },
};

export function runRemoteConfigTests() {
  passed = 0;
  failed = 0;
  console.log('\n🛠  Super Admin remote config\n');

  const config = parseRemoteConfig(serverResponse)!;

  // ── Parsing ──────────────────────────────────────────────────────────────
  check('garbage is rejected', parseRemoteConfig('nope'), null);
  check('non-boolean switches are dropped', 'bogus' in config.features, false);
  check('unknown forms are dropped', Object.keys(config.forms), ['signup_profile']);
  check('unknown field types are dropped', config.forms.signup_profile!.some((f) => f.key === 'weird'), false);
  check('fields come back in admin order', config.forms.signup_profile!.map((f) => f.key), ['name', 'aadhaarLast4', 'position', 'playingStyle', 'bio', 'tshirt', 'hiddenCustom']);

  // ── Feature switches ─────────────────────────────────────────────────────
  check('a switched-off feature is off', isFeatureOn(config, 'matches.bid_match'), false);
  check('an unknown feature stays on', isFeatureOn(config, 'something.new'), true);
  check('with no config everything is on', isFeatureOn(EMPTY_CONFIG, 'matches.bid_match'), true);
  check('an unmapped surface is never hidden', isFeatureOn(config, ''), true);
  check('owners get Add Turf on the coach route', tabFeature('coach', 'Owner'), 'owner.create_turf');
  check('players get Class on the coach route', tabFeature('coach', 'Player'), 'nav.class');
  check('home has no switch', tabFeature('index', 'Player'), '');
  check(
    'match sub-tabs follow their switches',
    filterByFeature(['Home', 'Bid Match', 'Quick Match'], (t) => t, MATCH_TAB_FEATURES, config),
    ['Home', 'Quick Match']
  );
  check(
    'drawer shortcuts follow their switches',
    filterByFeature([{ key: 'bookings' }, { key: 'wallet' }, { key: 'host' }], (l) => l.key, DRAWER_FEATURES, config).map((l) => l.key),
    ['bookings', 'wallet']
  );

  // ── Built-in fields ──────────────────────────────────────────────────────
  const fallback = { label: 'PLAYING POSITION', placeholder: 'e.g. Batsman', required: false };
  check('no config keeps the screen as it is', fieldView(EMPTY_CONFIG, 'signup_profile', 'position', fallback), {
    key: 'position', visible: true, required: false, label: 'PLAYING POSITION', placeholder: 'e.g. Batsman',
  });
  check('an admin rename and require applies', fieldView(config, 'signup_profile', 'position', fallback), {
    key: 'position', visible: true, required: true, label: 'Position on field', placeholder: 'e.g. Batsman',
  });
  check(
    'untouched label and placeholder keep the screen text',
    fieldView(config, 'signup_profile', 'playingStyle', { label: 'PLAYING STYLE', placeholder: 'e.g. Aggressive Opener' }),
    { key: 'playingStyle', visible: true, required: false, label: 'PLAYING STYLE', placeholder: 'e.g. Aggressive Opener' }
  );
  check('a hidden field is never required', fieldView(config, 'signup_profile', 'bio', { label: 'BIO', required: true }).required, false);
  check('a hidden field is hidden', fieldView(config, 'signup_profile', 'bio', { label: 'BIO' }).visible, false);
  check('an untouched required flag keeps the screen rule', fieldView(config, 'signup_profile', 'name', { label: 'Name', required: false }).required, false);
  check(
    'missing required fields are named',
    missingRequired([
      { view: fieldView(config, 'signup_profile', 'position', fallback), value: '  ' },
      { view: fieldView(config, 'signup_profile', 'bio', { label: 'BIO', required: true }), value: '' },
    ]),
    ['Position on field']
  );

  // ── Custom fields ────────────────────────────────────────────────────────
  const customs = customFieldsFor(config, 'signup_profile');
  check('only visible custom fields render', customs.map((f) => f.key), ['aadhaarLast4', 'tshirt']);
  check('required custom answer is enforced', validateCustomAnswers(customs, {}), ['Aadhaar last 4 is required.']);
  check('numbers are checked', validateCustomAnswers(customs, { aadhaarLast4: 'abcd' }), ['Aadhaar last 4 must be a number.']);
  check('dropdowns only accept their options', validateCustomAnswers(customs, { aadhaarLast4: '1234', tshirt: 'XXL' }), ['Choose an option for T-shirt size.']);
  check('valid answers pass', validateCustomAnswers(customs, { aadhaarLast4: '1234', tshirt: 'M' }), []);
  check('answers are trimmed and unknown keys dropped', cleanAnswers(customs, { aadhaarLast4: ' 1234 ', tshirt: '', other: 'x' }), { aadhaarLast4: '1234' });

  // ── Tokens ───────────────────────────────────────────────────────────────
  check('a demo token never reaches the API', isServerToken('local_token_1757660000000'), false);
  check('a preview token never reaches the API', isServerToken('dev-preview-token'), false);
  check('a JWT is a server token', isServerToken('eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEifQ.c2ln'), true);
  check('no token is not a server token', isServerToken(null), false);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
