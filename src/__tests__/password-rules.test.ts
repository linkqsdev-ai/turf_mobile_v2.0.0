/**
 * password-rules.test.ts
 * The Change Password form's rules — kept in step with the server's schema.
 */

import { passwordRuleResults, changePasswordIssue, isLocalSession } from '@/utils/password-rules';

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

const unmet = (p: string) => passwordRuleResults(p).filter(r => !r.met).map(r => r.key);

export function runPasswordRuleTests() {
  passed = 0;
  failed = 0;
  console.log('\n🔑 Change password rules\n');

  check('a strong password meets every rule', unmet('Turf@2026'), []);
  check('too short fails length', unmet('Ab1@').includes('length'), true);
  check('13 characters is too long', unmet('Abcdefgh1@xyz').includes('length'), true);
  check('no uppercase is caught', unmet('turf@2026'), ['upper']);
  check('no lowercase is caught', unmet('TURF@2026'), ['lower']);
  check('no number is caught', unmet('Turf@abcd'), ['number']);
  check('no special character is caught', unmet('Turf2026a'), ['special']);
  check('the seed password fails the rule', unmet('password123'), ['upper', 'special']);

  const ok = { current: 'password123', next: 'Turf@2026', confirm: 'Turf@2026' };
  check('a valid change has no issue', changePasswordIssue(ok), null);
  check('the current password is required', changePasswordIssue({ ...ok, current: '' }), 'Enter your current password');
  check('a new password is required', changePasswordIssue({ ...ok, next: '', confirm: '' }), 'Enter a new password');
  check('a weak new password names the rule', changePasswordIssue({ ...ok, next: 'turf@2026', confirm: 'turf@2026' }), 'New password needs an uppercase letter');
  check('reusing the current password is refused', changePasswordIssue({ current: 'Turf@2026', next: 'Turf@2026', confirm: 'Turf@2026' }), 'New password must be different from your current one');
  check('a mismatched confirmation is caught', changePasswordIssue({ ...ok, confirm: 'Turf@2025' }), "Passwords don't match");

  check('a server token is a real session', isLocalSession('eyJhbGciOiJIUzI1NiJ9.x.y'), false);
  check('a local token has no server account', isLocalSession('local_token_1757500000000'), true);
  check('no token has no server account', isLocalSession(null), true);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
