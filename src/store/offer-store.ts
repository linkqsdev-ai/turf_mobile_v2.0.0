/**
 * offer-store.ts
 * Promotional vouchers and offers created BY a turf owner for their venues.
 * This is the supply side of the player-facing vouchers listed in the wallet:
 * the owner publishes a code here, a player redeems it at booking time.
 */

export type OfferDiscountType = 'percent' | 'flat';
export type OfferStatus = 'active' | 'paused' | 'expired';

export interface OwnerOffer {
  id: string;
  code: string;               // Redemption code, e.g. WEEKDAY20
  title: string;
  description: string;
  discountType: OfferDiscountType;
  discountValue: number;      // 20 => 20% or ₹20 depending on discountType
  minBooking: number;         // Minimum cart value for the code to apply
  maxRedemptions: number;     // 0 means unlimited
  redeemedCount: number;
  validTill: string;          // ISO date
  appliesTo: string;          // Turf name, or 'All Turfs'
  status: OfferStatus;
  createdAt: string;
}

export function generateOfferId(): string {
  return `offer-${Date.now()}`;
}

/** Human-readable discount, e.g. "20% OFF" or "₹150 OFF". */
export function formatDiscount(offer: Pick<OwnerOffer, 'discountType' | 'discountValue'>): string {
  return offer.discountType === 'percent'
    ? `${offer.discountValue}% OFF`
    : `₹${offer.discountValue} OFF`;
}

/**
 * An offer is only redeemable while it is active, in date, and under its cap.
 * Callers use this rather than reading `status` alone, because an offer can
 * lapse by date or exhaust its cap without anyone having edited it.
 */
export function isRedeemable(offer: OwnerOffer, now: Date = new Date()): boolean {
  if (offer.status !== 'active') return false;
  if (isExpired(offer, now)) return false;
  if (offer.maxRedemptions > 0 && offer.redeemedCount >= offer.maxRedemptions) return false;
  return true;
}

export function isExpired(offer: OwnerOffer, now: Date = new Date()): boolean {
  const till = new Date(offer.validTill);
  if (isNaN(till.getTime())) return false;
  // validTill is inclusive — the offer runs to the end of that day.
  till.setHours(23, 59, 59, 999);
  return now > till;
}

/** Remaining redemptions, or null when the offer is uncapped. */
export function redemptionsLeft(offer: OwnerOffer): number | null {
  if (offer.maxRedemptions <= 0) return null;
  return Math.max(0, offer.maxRedemptions - offer.redeemedCount);
}

export function formatValidTill(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function createOffer(
  params: Omit<OwnerOffer, 'id' | 'redeemedCount' | 'status' | 'createdAt'> & { status?: OfferStatus }
): OwnerOffer {
  return {
    ...params,
    code: params.code.trim().toUpperCase(),
    id: generateOfferId(),
    redeemedCount: 0,
    status: params.status ?? 'active',
    createdAt: new Date().toISOString(),
  };
}

/** Seeded so a brand-new owner account has something to look at and edit. */
export function defaultOwnerOffers(): OwnerOffer[] {
  const daysFromNow = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  return [
    {
      id: 'offer-seed-1',
      code: 'WEEKDAY20',
      title: 'Weekday Morning Saver',
      description: '20% off on all weekday slots booked before 12 PM.',
      discountType: 'percent',
      discountValue: 20,
      minBooking: 300,
      maxRedemptions: 100,
      redeemedCount: 34,
      validTill: daysFromNow(21),
      appliesTo: 'All Turfs',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'offer-seed-2',
      code: 'NIGHT150',
      title: 'Floodlight Night Deal',
      description: 'Flat ₹150 off on floodlight slots after 9 PM.',
      discountType: 'flat',
      discountValue: 150,
      minBooking: 500,
      maxRedemptions: 50,
      redeemedCount: 50,
      validTill: daysFromNow(10),
      appliesTo: 'All Turfs',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'offer-seed-3',
      code: 'MONSOON30',
      title: 'Monsoon Comeback Offer',
      description: '30% off to bring teams back after the rain break.',
      discountType: 'percent',
      discountValue: 30,
      minBooking: 400,
      maxRedemptions: 0,
      redeemedCount: 12,
      validTill: daysFromNow(-3),
      appliesTo: 'All Turfs',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];
}
