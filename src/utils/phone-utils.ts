/**
 * Phone Number Utilities
 * Centralized formatting, validation, and cleaning for mobile numbers across the app.
 */

/**
 * Strips all non-digit characters and standardizes to a 10-digit mobile number.
 * If a 12-digit number starting with 91 is provided, strips the country code prefix.
 */
export function cleanPhoneDigits(val?: string | null): string {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  // If user pasted/typed +91XXXXXXXXXX or 91XXXXXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length > 10 && digits.startsWith('0')) {
    // Leading 0 (e.g. 09876543210)
    digits = digits.replace(/^0+/, '');
  }
  return digits.slice(0, 10);
}

/**
 * Formats a phone number string as "XXXXX XXXXX" (5-5 split for 10 digits).
 * Gracefully formats partial inputs as the user types.
 */
export function formatPhoneNumber(val?: string | null): string {
  const digits = cleanPhoneDigits(val);
  if (!digits) return '';
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/**
 * Formats a 10-digit number for display with country code "+91 XXXXX XXXXX".
 */
export function formatDisplayPhone(val?: string | null): string {
  const digits = cleanPhoneDigits(val);
  if (!digits) return '';
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return formatPhoneNumber(digits);
}

/**
 * Validates whether the mobile number is a valid 10-digit Indian mobile number.
 * (Exactly 10 digits, starts with 6, 7, 8, or 9)
 */
export function isValidMobile(val?: string | null): boolean {
  const digits = cleanPhoneDigits(val);
  if (digits.length !== 10) return false;
  return /^[6-9]\d{9}$/.test(digits);
}

/**
 * Returns a human-friendly validation error message or null if valid.
 */
export function getPhoneValidationError(val?: string | null, isRequired = true): string | null {
  const digits = cleanPhoneDigits(val);
  if (!digits) {
    return isRequired ? 'Mobile number is required' : null;
  }
  if (digits.length < 10) {
    return `Mobile number must be 10 digits (${digits.length}/10)`;
  }
  if (digits.length > 10) {
    return 'Mobile number cannot exceed 10 digits';
  }
  if (!/^[6-9]/.test(digits)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  return null;
}
