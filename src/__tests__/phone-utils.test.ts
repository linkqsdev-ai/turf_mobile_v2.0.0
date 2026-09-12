/**
 * phone-utils.test.ts
 * Validation and formatting tests for standard 10-digit Indian phone numbers across all app screens.
 */

import {
  cleanPhoneDigits,
  formatPhoneNumber,
  formatDisplayPhone,
  isValidMobile,
  getPhoneValidationError,
} from '@/utils/phone-utils';

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

export function runPhoneUtilsTests() {
  passed = 0;
  failed = 0;
  console.log('\n📱 Phone formatting and validation rules\n');

  // 1. Cleaning Digits
  check('strips non-digit characters', cleanPhoneDigits('+91 98765-43210'), '9876543210');
  check('strips leading +91 country code', cleanPhoneDigits('+919876543210'), '9876543210');
  check('strips leading 91 (12 digits total)', cleanPhoneDigits('919876543210'), '9876543210');
  check('strips leading 0', cleanPhoneDigits('09876543210'), '9876543210');
  check('caps at 10 digits', cleanPhoneDigits('9876543210999'), '9876543210');
  check('handles null / undefined', cleanPhoneDigits(null), '');

  // 2. Formatting (XXXXX XXXXX)
  check('formats 10 digits as 5+5 split', formatPhoneNumber('9876543210'), '98765 43210');
  check('formats partial input up to 5 digits without space', formatPhoneNumber('98765'), '98765');
  check('formats partial 6 digits with space', formatPhoneNumber('987654'), '98765 4');
  check('formats unformatted text cleanly', formatPhoneNumber('98765-43210'), '98765 43210');
  check('formats empty value as empty string', formatPhoneNumber(''), '');

  // 3. Display format (+91 XXXXX XXXXX)
  check('formats 10-digit number with +91 prefix for display', formatDisplayPhone('9876543210'), '+91 98765 43210');

  // 4. Validity checks
  check('valid 10-digit mobile starting with 9', isValidMobile('9876543210'), true);
  check('valid 10-digit mobile starting with 8', isValidMobile('8876543210'), true);
  check('valid 10-digit mobile starting with 7', isValidMobile('7876543210'), true);
  check('valid 10-digit mobile starting with 6', isValidMobile('6876543210'), true);
  check('invalid mobile starting with 5', isValidMobile('5876543210'), false);
  check('invalid mobile starting with 0', isValidMobile('0876543210'), false);
  check('invalid mobile with less than 10 digits', isValidMobile('987654321'), false);
  check('invalid mobile with empty input', isValidMobile(''), false);

  // 5. Error messages
  check('returns required error when empty and required', getPhoneValidationError('', true), 'Mobile number is required');
  check('returns null when empty and optional', getPhoneValidationError('', false), null);
  check('returns length error when short', getPhoneValidationError('98765', true), 'Mobile number must be 10 digits (5/10)');
  check('returns prefix error when starting with invalid digit', getPhoneValidationError('1234567890', true), 'Mobile number must start with 6, 7, 8, or 9');
  check('returns null for valid number', getPhoneValidationError('98765 43210', true), null);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
