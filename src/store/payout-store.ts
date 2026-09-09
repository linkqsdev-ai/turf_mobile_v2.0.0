/**
 * payout-store.ts
 *
 * The billing identity of anyone the platform pays: turf owners, coaches and
 * tournament organizers. They differ in what they sell, not in how they get
 * paid, so one profile serves all three with a `role` discriminator.
 *
 * A profile is only usable for a real transfer once it is *payable* — see
 * `payoutReadiness`, which is deliberately stricter than "the form was filled
 * in": a typo'd IFSC or a GSTIN that doesn't match the PAN inside it will fail
 * at the bank or the tax return, long after the user has left the screen.
 */

export type PayeeRole = 'owner' | 'coach' | 'organizer';

export type PayoutMethod = 'bank' | 'upi';

export interface PayeeAddress {
  line1: string;
  line2?: string;
  city: string;
  /** State matters for GST: it determines CGST+SGST vs IGST on our invoice. */
  state: string;
  pincode: string;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string;
}

export interface PayeeProfile {
  id: string;
  role: PayeeRole;
  /** Name as it appears on the PAN/bank account — used on the invoice. */
  legalName: string;
  /** Public-facing name, e.g. the turf's brand. */
  displayName?: string;
  address: PayeeAddress;
  /** 15-character GSTIN. Absent for the many small venues below the threshold. */
  gstin?: string;
  panNumber?: string;
  payoutMethod: PayoutMethod;
  bank?: BankAccount;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Validation                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** 5 letters, 4 digits, 1 letter — e.g. ABCDE1234F. */
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/**
 * GSTIN: 2-digit state code, the 10-char PAN of the holder, an entity digit,
 * a literal 'Z', then a checksum character.
 */
const GSTIN_RE = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** IFSC: 4-letter bank code, a reserved '0', then a 6-char branch code. */
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** UPI handle: local part @ provider. */
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

const PINCODE_RE = /^[1-9][0-9]{5}$/;

/** Indian bank account numbers run 9–18 digits. */
const ACCOUNT_RE = /^[0-9]{9,18}$/;

export const normalizeGstin = (v?: string) => (v || '').toUpperCase().replace(/\s/g, '');
export const normalizeIfsc = (v?: string) => (v || '').toUpperCase().replace(/\s/g, '');
export const normalizeAccount = (v?: string) => (v || '').replace(/\D/g, '');

export function isValidPan(pan?: string): boolean {
  return PAN_RE.test((pan || '').toUpperCase().replace(/\s/g, ''));
}

export function isValidGstin(gstin?: string): boolean {
  return GSTIN_RE.test(normalizeGstin(gstin));
}

export function isValidIfsc(ifsc?: string): boolean {
  return IFSC_RE.test(normalizeIfsc(ifsc));
}

export function isValidUpi(upi?: string): boolean {
  return UPI_RE.test((upi || '').trim());
}

export function isValidPincode(pin?: string): boolean {
  return PINCODE_RE.test((pin || '').trim());
}

export function isValidAccountNumber(acc?: string): boolean {
  return ACCOUNT_RE.test(normalizeAccount(acc));
}

/** The PAN embedded in a GSTIN (chars 3–12) must match the declared PAN. */
export function gstinMatchesPan(gstin?: string, pan?: string): boolean {
  const g = normalizeGstin(gstin);
  const p = (pan || '').toUpperCase().replace(/\s/g, '');
  if (!isValidGstin(g) || !isValidPan(p)) return false;
  return g.slice(2, 12) === p;
}

/** The 2-digit state code a GSTIN starts with. */
export function gstStateCode(gstin?: string): string | null {
  const g = normalizeGstin(gstin);
  return isValidGstin(g) ? g.slice(0, 2) : null;
}

export interface FieldIssue {
  field: string;
  message: string;
}

export interface PayoutReadiness {
  /** Every required field is present and well-formed. */
  payable: boolean;
  issues: FieldIssue[];
  /** Non-blocking notes, e.g. no GSTIN so no input credit. */
  warnings: FieldIssue[];
}

/**
 * Decides whether a profile can actually receive money, and explains exactly
 * what is wrong when it cannot.
 */
export function payoutReadiness(profile: Partial<PayeeProfile> | null | undefined): PayoutReadiness {
  const issues: FieldIssue[] = [];
  const warnings: FieldIssue[] = [];

  if (!profile) {
    return {
      payable: false,
      issues: [{ field: 'profile', message: 'No payout profile has been set up yet.' }],
      warnings,
    };
  }

  if (!profile.legalName || profile.legalName.trim().length < 3) {
    issues.push({ field: 'legalName', message: 'Legal name is required, as printed on your PAN.' });
  }

  const addr = profile.address;
  if (!addr?.line1?.trim()) issues.push({ field: 'address.line1', message: 'Address line 1 is required.' });
  if (!addr?.city?.trim()) issues.push({ field: 'address.city', message: 'City is required.' });
  if (!addr?.state?.trim()) issues.push({ field: 'address.state', message: 'State is required — it sets CGST/SGST vs IGST.' });
  if (!isValidPincode(addr?.pincode)) issues.push({ field: 'address.pincode', message: 'Enter a valid 6-digit PIN code.' });

  if (profile.panNumber && !isValidPan(profile.panNumber)) {
    issues.push({ field: 'panNumber', message: 'PAN must look like ABCDE1234F.' });
  }

  if (profile.gstin) {
    if (!isValidGstin(profile.gstin)) {
      issues.push({ field: 'gstin', message: 'GSTIN must be 15 characters, e.g. 33ABCDE1234F1Z5.' });
    } else if (profile.panNumber && !gstinMatchesPan(profile.gstin, profile.panNumber)) {
      // Caught here rather than at filing time, when it is far more expensive.
      issues.push({ field: 'gstin', message: 'GSTIN does not contain the PAN you entered.' });
    }
  } else {
    warnings.push({
      field: 'gstin',
      message: 'No GSTIN: platform fee GST cannot be claimed back as input credit.',
    });
  }

  if (profile.payoutMethod === 'upi') {
    if (!isValidUpi(profile.upiId)) {
      issues.push({ field: 'upiId', message: 'Enter a valid UPI ID, e.g. name@bank.' });
    }
  } else if (profile.payoutMethod === 'bank') {
    const bank = profile.bank;
    if (!bank?.accountName?.trim()) {
      issues.push({ field: 'bank.accountName', message: 'Account holder name is required.' });
    }
    if (!isValidAccountNumber(bank?.accountNumber)) {
      issues.push({ field: 'bank.accountNumber', message: 'Account number must be 9–18 digits.' });
    }
    if (!isValidIfsc(bank?.ifsc)) {
      issues.push({ field: 'bank.ifsc', message: 'IFSC must look like HDFC0001234.' });
    }
  } else {
    issues.push({ field: 'payoutMethod', message: 'Choose how you want to be paid.' });
  }

  return { payable: issues.length === 0, issues, warnings };
}

/** Masks an account number for display — never show it in full after saving. */
export function maskAccountNumber(acc?: string): string {
  const digits = normalizeAccount(acc);
  if (digits.length < 4) return '••••';
  return `${'•'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function generatePayeeId(): string {
  return `payee-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function createPayeeProfile(
  params: Omit<PayeeProfile, 'id' | 'createdAt' | 'updatedAt'>
): PayeeProfile {
  const now = new Date().toISOString();
  return {
    ...params,
    gstin: params.gstin ? normalizeGstin(params.gstin) : undefined,
    bank: params.bank
      ? {
          ...params.bank,
          ifsc: normalizeIfsc(params.bank.ifsc),
          accountNumber: normalizeAccount(params.bank.accountNumber),
        }
      : undefined,
    id: generatePayeeId(),
    createdAt: now,
    updatedAt: now,
  };
}
