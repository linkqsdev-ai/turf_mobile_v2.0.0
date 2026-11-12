/**
 * wallet-deals.ts
 *
 * What the Wallet & Offers screen lists, and what its redeem box accepts:
 *  - liveOfferDeals: every offer a player can use right now — published venue
 *    and class offers, unpublished class vouchers, and the tournament passes.
 *  - resolveCashbackCode: the redeem box takes cashback codes only. Vouchers
 *    and offers are booking discounts, applied at checkout.
 *
 * Pure, so it is testable without React Native.
 */

import { formatDiscount, formatValidTill, isRedeemable, type OwnerOffer } from '@/store/offer-store';
import type { CashbackDeal, PlatformPass } from '@/constants/platform-deals';

export type OfferGroup = 'Venue Offers' | 'Class Offers' | 'Tournament Passes';

export const OFFER_GROUPS: OfferGroup[] = ['Venue Offers', 'Class Offers', 'Tournament Passes'];

export interface OfferDeal {
  id: string;
  code: string;
  title: string;
  appliesTo: string;
  /** e.g. "20% OFF" or "₹150 OFF". */
  headline: string;
  group: OfferGroup;
  /** e.g. "Min. booking ₹300 · Valid till 2 Oct 2026", when known. */
  detail?: string;
  /** Set for class vouchers, so the card can open that class. */
  classId?: string;
}

/** The voucher fields a class record carries. */
export interface ClassVoucherSource {
  id: string;
  className?: string;
  vouchers?: { code?: string; title?: string; discountType?: string; discountValue?: number | string }[];
}

const cleanCode = (code: unknown) => String(code ?? '').trim().toUpperCase();

export function liveOfferDeals(
  offers: OwnerOffer[],
  classes: ClassVoucherSource[],
  passes: PlatformPass[],
  now: Date = new Date()
): OfferDeal[] {
  const deals: OfferDeal[] = [];
  const seen = new Set<string>();

  // Which class a voucher code belongs to, so a published class voucher is
  // grouped with its class rather than with venues.
  const classByCode = new Map<string, ClassVoucherSource>();
  for (const cls of classes || []) {
    for (const v of cls.vouchers || []) {
      const code = cleanCode(v.code);
      if (code && !classByCode.has(code)) classByCode.set(code, cls);
    }
  }

  // 1. Published offers — only those a player can redeem today.
  const storeCodes = new Set((offers || []).map((o) => cleanCode(o.code)));
  for (const o of offers || []) {
    const code = cleanCode(o.code);
    if (!code || seen.has(code) || !isRedeemable(o, now)) continue;
    seen.add(code);
    const cls = classByCode.get(code);
    const detail = [
      o.minBooking > 0 ? `Min. booking ₹${o.minBooking}` : null,
      o.validTill ? `Valid till ${formatValidTill(o.validTill)}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    deals.push({
      id: o.id,
      code,
      title: o.title || (cls ? `${cls.className || 'Class'} Voucher` : 'Venue Offer'),
      appliesTo: cls?.className || o.appliesTo || 'All Partner Turfs',
      headline: formatDiscount(o),
      group: cls ? 'Class Offers' : 'Venue Offers',
      detail: detail || undefined,
      classId: cls?.id,
    });
  }

  // 2. Class vouchers never published to the offer store. One that was
  //    published but has since lapsed stays hidden: the store is the authority.
  for (const cls of classes || []) {
    (cls.vouchers || []).forEach((v, idx) => {
      const code = cleanCode(v.code);
      if (!code || seen.has(code) || storeCodes.has(code)) return;
      seen.add(code);
      const value = parseFloat(String(v.discountValue ?? '')) || 0;
      deals.push({
        id: `class-voucher-${cls.id}-${code}-${idx}`,
        code,
        title: v.title || `${cls.className || 'Class'} Voucher`,
        appliesTo: cls.className || 'Coaching Class',
        headline:
          value > 0
            ? formatDiscount({ discountType: v.discountType === 'flat' ? 'flat' : 'percent', discountValue: value })
            : 'Special offer',
        group: 'Class Offers',
        classId: cls.id,
      });
    });
  }

  // 3. The platform's tournament passes.
  for (const p of passes || []) {
    const code = cleanCode(p.code);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    deals.push({
      id: p.id,
      code,
      title: p.title,
      appliesTo: p.appliesTo,
      headline: formatDiscount(p),
      group: 'Tournament Passes',
    });
  }

  return deals;
}

export type CashbackRedeemResult =
  | { status: 'empty' }
  | { status: 'credit'; deal: CashbackDeal }
  | { status: 'already_redeemed'; deal: CashbackDeal }
  /** A voucher or offer code: a discount taken at checkout, not wallet cash. */
  | { status: 'not_cashback'; code: string }
  | { status: 'invalid'; code: string };

/**
 * Decides what the wallet's redeem box does with a code. Only a cashback code
 * that hasn't been redeemed yet credits the wallet.
 */
export function resolveCashbackCode(
  input: string,
  cashback: CashbackDeal[],
  redeemedCodes: readonly string[],
  bookingCodes: readonly string[]
): CashbackRedeemResult {
  const code = cleanCode(input);
  if (!code) return { status: 'empty' };

  const deal = cashback.find((d) => cleanCode(d.code) === code);
  if (deal) {
    return redeemedCodes.some((c) => cleanCode(c) === code)
      ? { status: 'already_redeemed', deal }
      : { status: 'credit', deal };
  }
  if (bookingCodes.some((c) => cleanCode(c) === code)) return { status: 'not_cashback', code };
  return { status: 'invalid', code };
}
