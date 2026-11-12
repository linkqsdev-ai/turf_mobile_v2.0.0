/**
 * duck.test.ts
 * When the scoreboard shows the out-for-a-duck walk-off, and which duck it is.
 */

import { duckKind, DUCK_LABEL } from '@/utils/duck';

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

export function runDuckTests() {
  passed = 0;
  failed = 0;
  console.log('\n🦆 Duck walk-off\n');

  check('out for 0 first ball is a golden duck', duckKind(0, 1, 'bowled'), 'golden');
  check('out for 0 after several balls is a duck', duckKind(0, 7, 'caught'), 'duck');
  check('run out for 0 without facing is a diamond duck', duckKind(0, 0, 'run_out'), 'diamond');
  check('any run means no duck', duckKind(1, 5, 'lbw'), null);
  check('retiring on 0 is not a duck', duckKind(0, 3, 'retired'), null);
  check('retired hurt on 0 is not a duck', duckKind(0, 3, 'retired_hurt'), null);
  check('missing numbers read as nought, not a crash', duckKind(NaN, undefined as unknown as number, 'bowled'), 'diamond');
  check('labels read naturally', [DUCK_LABEL.golden, DUCK_LABEL.diamond, DUCK_LABEL.duck], ['Golden Duck', 'Diamond Duck', 'Duck']);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
