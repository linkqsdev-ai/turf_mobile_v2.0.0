/**
 * settlement.ts
 *
 * Money rules for a booking: what the player pays, what the platform keeps,
 * what the venue owner is owed, and how a discount is funded.
 *
 * ── The split ────────────────────────────────────────────────────────────
 * The platform charges a flat convenience fee per slot (₹3). It is deducted
 * from the owner's payout — it is NOT added to the player's bill, so the price
 * a player sees on the slot grid is the price they pay.
 *
 * ── Who funds a discount ─────────────────────────────────────────────────
 * This is the crux of owner reimbursement, and the two cases must not be
 * conflated:
 *
 *   platform-funded  A voucher from the app's own catalogue (constants/vouchers).
 *                    The player pays less, but the owner must still receive the
 *                    full slot value — so the platform REIMBURSES the discount.
 *                    Marketing spend sits with the platform, where it belongs.
 *
 *   owner-funded     An owner's own promo code (store/offer-store). The owner
 *                    chose to discount their own inventory, so they absorb it
 *                    and there is nothing to reimburse.
 *
 * Getting this wrong in either direction is a real cash error: reimbursing an
 * owner-funded offer pays the owner twice; failing to reimburse a
 * platform-funded voucher makes owners silently fund our marketing.
 *
 * ── Amounts ──────────────────────────────────────────────────────────────
 * All amounts are rupees. Every derived figure goes through `money()` so a
 * settlement never carries floating-point dust into a payout.
 */

/** Flat platform convenience fee charged per booked slot, in rupees. */
export const PLATFORM_FEE_PER_SLOT = 3;

/** GST rate applied to the platform's service fee (an 18% service). */
export const PLATFORM_FEE_GST_RATE = 0.18;

/** Who bears the cost of a discount applied at checkout. */
export type DiscountFunder = 'platform' | 'owner';

export interface AppliedDiscount {
  /** Code as entered, e.g. "SALE50" or "WEEKDAY20". */
  code: string;
  /** Rupees taken off the player's bill. */
  amount: number;
  funder: DiscountFunder;
}

export interface SettlementInput {
  /** Number of slots booked. Drives both gross and the per-slot platform fee. */
  slotCount: number;
  /** Advertised price of a single slot, in rupees. */
  pricePerSlot: number;
  /** Discount applied at checkout, if any. */
  discount?: AppliedDiscount | null;
  /**
   * Whether the platform fee attracts GST on this settlement. GST is charged
   * on the platform's service to the owner, so it applies regardless of the
   * owner's own registration — an unregistered owner simply cannot claim it
   * back as input credit.
   */
  taxable?: boolean;
}

export interface Settlement {
  /** slotCount × pricePerSlot — the full value of the inventory sold. */
  gross: number;
  /** Discount actually applied (never more than gross). */
  discountApplied: number;
  /** What the player is charged. */
  playerPays: number;
  /** Flat per-slot platform fee, before tax. */
  platformFee: number;
  /** GST on the platform fee. */
  platformFeeGst: number;
  /** platformFee + platformFeeGst — the total deducted from the owner. */
  platformDeduction: number;
  /** Discount the platform owes back to the owner (platform-funded only). */
  ownerReimbursement: number;
  /** What the owner is finally owed for this booking. */
  ownerPayout: number;
  /** What the platform keeps. Negative when a voucher cost exceeds the fee. */
  platformNet: number;
}

/** Rounds to 2dp and normalises -0, so payouts never carry float dust. */
export function money(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Computes the full money breakdown for one booking.
 *
 * Identity that must always hold:
 *   playerPays + ownerReimbursement = ownerPayout + platformDeduction
 * i.e. cash in (from player) plus what the platform tops up equals cash out
 * (to owner) plus what the platform retains. `assertSettlementBalances` below
 * checks it, and the test suite asserts it across generated cases.
 */
export function computeSettlement({
  slotCount,
  pricePerSlot,
  discount,
  taxable = true,
}: SettlementInput): Settlement {
  const slots = Math.max(0, Math.floor(slotCount || 0));
  const price = Math.max(0, pricePerSlot || 0);

  const gross = money(slots * price);

  // A discount can never exceed the value of what was sold, and a negative
  // discount (a malformed offer) must never inflate the bill.
  const requested = Math.max(0, discount?.amount || 0);
  const discountApplied = money(Math.min(requested, gross));

  const playerPays = money(gross - discountApplied);

  const platformFee = money(slots * PLATFORM_FEE_PER_SLOT);
  const platformFeeGst = taxable ? money(platformFee * PLATFORM_FEE_GST_RATE) : 0;
  const platformDeduction = money(platformFee + platformFeeGst);

  // Only a platform-funded discount is reimbursed; an owner-funded one was the
  // owner's own decision and is absorbed by them.
  const ownerReimbursement =
    discount && discount.funder === 'platform' ? discountApplied : 0;

  const ownerPayout = money(playerPays + ownerReimbursement - platformDeduction);

  // The platform receives playerPays and hands out ownerPayout, which reduces
  // to "keep the fee, minus anything we reimbursed". Negative when a
  // platform-funded voucher costs more than the fee it earned.
  const platformNet = money(platformDeduction - ownerReimbursement);

  return {
    gross,
    discountApplied,
    playerPays,
    platformFee,
    platformFeeGst,
    platformDeduction,
    ownerReimbursement,
    ownerPayout,
    platformNet,
  };
}

/**
 * Books must balance: everything that comes in is either paid out or retained.
 * Exposed so a settlement can be checked before it is written to a payout.
 */
export function assertSettlementBalances(s: Settlement): boolean {
  const inflow = money(s.playerPays + s.ownerReimbursement);
  const outflow = money(s.ownerPayout + s.platformDeduction);
  return Math.abs(inflow - outflow) < 0.01;
}

/**
 * A settlement can leave the owner owed a negative amount when a large
 * platform-funded voucher is used on a cheap slot — the fee outweighs the
 * revenue. Payouts are never negative in practice; the shortfall carries to
 * the next settlement instead of clawing back cash.
 */
export function isPayable(s: Settlement): boolean {
  return s.ownerPayout > 0;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Payout lifecycle                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * pending    booking taken, inside the cancellation window — not yet owed
 * payable    window passed, the money is owed and can be batched
 * processing a transfer has been initiated to the payee's bank/UPI
 * paid       transfer confirmed
 * failed     transfer rejected (bad account, etc.) — returns to `payable`
 * on_hold    withheld pending a dispute or KYC/GST issue
 */
export type PayoutStatus =
  | 'pending'
  | 'payable'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'on_hold';

export interface PayoutLine {
  bookingId: string;
  bookingRef: string;
  date: string;
  settlement: Settlement;
}

export interface PayoutBatch {
  id: string;
  payeeId: string;
  periodStart: string;
  periodEnd: string;
  lines: PayoutLine[];
  status: PayoutStatus;
  /** Sum of every line's ownerPayout. */
  totalPayout: number;
  /** Sum of reimbursements — what the platform funded back this period. */
  totalReimbursement: number;
  /** Sum of fee + GST retained. */
  totalPlatformDeduction: number;
  createdAt: string;
  paidAt?: string;
  failureReason?: string;
}

/** Which status transitions are legal. Anything else is a bug, not a retry. */
const ALLOWED_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  pending: ['payable', 'on_hold'],
  payable: ['processing', 'on_hold'],
  processing: ['paid', 'failed'],
  // A failed transfer is re-attemptable; it does not vanish.
  failed: ['payable', 'on_hold'],
  on_hold: ['payable'],
  paid: [],
};

export function canTransition(from: PayoutStatus, to: PayoutStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function summarisePayout(lines: PayoutLine[]): {
  totalPayout: number;
  totalReimbursement: number;
  totalPlatformDeduction: number;
} {
  return lines.reduce(
    (acc, line) => ({
      totalPayout: money(acc.totalPayout + line.settlement.ownerPayout),
      totalReimbursement: money(acc.totalReimbursement + line.settlement.ownerReimbursement),
      totalPlatformDeduction: money(
        acc.totalPlatformDeduction + line.settlement.platformDeduction
      ),
    }),
    { totalPayout: 0, totalReimbursement: 0, totalPlatformDeduction: 0 }
  );
}

export function createPayoutBatch(params: {
  id: string;
  payeeId: string;
  periodStart: string;
  periodEnd: string;
  lines: PayoutLine[];
  createdAt: string;
}): PayoutBatch {
  const totals = summarisePayout(params.lines);
  return {
    ...params,
    ...totals,
    status: 'pending',
  };
}
