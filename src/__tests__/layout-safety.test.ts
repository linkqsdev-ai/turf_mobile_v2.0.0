/**
 * layout-safety.test.ts
 *
 * Rules that keep text from being clipped or run together on real devices.
 * These are cheap to get wrong and invisible in a wide simulator, so the
 * invariants are pinned rather than eyeballed.
 */

import {
  singleLineInputFix,
  multiLineInputFix,
  readableFontSize,
  MIN_READABLE_FONT_SIZE,
  labelValueRow,
} from '@/utils/layout-safety';

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

export function runLayoutSafetyTests() {
  passed = 0;
  failed = 0;
  console.log('\n📐 Layout safety\n');

  // ── Input clipping ───────────────────────────────────────────────────────
  check(
    'single-line inputs disable Android font padding',
    singleLineInputFix.includeFontPadding,
    false
  );
  check(
    'single-line inputs zero their vertical padding',
    singleLineInputFix.paddingVertical,
    0
  );
  check(
    'multi-line inputs also disable font padding',
    multiLineInputFix.includeFontPadding,
    false
  );
  check(
    'multi-line inputs keep their vertical padding',
    Object.prototype.hasOwnProperty.call(multiLineInputFix, 'paddingVertical'),
    false
  );
  check(
    'multi-line inputs align text to the top, not the centre',
    multiLineInputFix.textAlignVertical,
    'top'
  );

  // ── Font floor ───────────────────────────────────────────────────────────
  check('the floor is 9px', MIN_READABLE_FONT_SIZE, 9);
  check('a 6.5px size is raised to the floor', readableFontSize(6.5), 9);
  check('a 7px size is raised to the floor', readableFontSize(7), 9);
  check('a size at the floor is unchanged', readableFontSize(9), 9);
  check('a larger size is left alone', readableFontSize(14), 14);
  check('a non-finite size falls back to the floor', readableFontSize(NaN), 9);

  // ── Label/value rows ─────────────────────────────────────────────────────
  // "Registration Progress8/8 Teams" came from space-between with no gap.
  check('a label/value row always has a gap', labelValueRow.row.gap > 0, true);
  check('the label may shrink', labelValueRow.label.flexShrink, 1);
  check('the label can shrink below its content width', labelValueRow.label.minWidth, 0);
  check('the value never shrinks', labelValueRow.value.flexShrink, 0);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
