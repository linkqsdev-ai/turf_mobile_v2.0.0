/**
 * vouchers.ts
 * Player-facing voucher catalogue, shared by the wallet grid and the redeem
 * screen so both render the same record rather than passing a blob through
 * navigation params.
 */

export interface Voucher {
  id: string;
  code: string;
  title: string;
  /** Short vendor/brand line shown under the title on the redeem ticket. */
  brand: string;
  description: string;
  /** Long-form copy shown only on the redeem screen. */
  terms: string;
  /** Headline number on the badge and ticket, e.g. "50%" or "₹500". */
  discountLabel: string;
  /** Word under the headline — "OFF", "FREE", "CASH". */
  discountSuffix: string;
  validUntil: string;
  minBooking: number;
  category: VoucherCategory;
  logo: any;
}

export type VoucherCategory = 'Turf Booking' | 'Coaching' | 'Tournaments' | 'Rewards';

export const VOUCHER_CATEGORIES: VoucherCategory[] = [
  'Turf Booking',
  'Coaching',
  'Tournaments',
  'Rewards',
];

export const VOUCHERS: Voucher[] = [
  {
    id: 'v-1',
    code: 'SALE50',
    title: 'Turf Mega Deal',
    brand: 'Skyline Turf Arena',
    description: 'Save flat 50% on all prime turf court slots today',
    terms:
      'Get 50% off any prime-time turf slot. Apply this code at checkout when booking, and the discount is taken off your slot total.',
    discountLabel: '50%',
    discountSuffix: 'OFF',
    validUntil: '08th May',
    minBooking: 400,
    category: 'Turf Booking',
    logo: require('@/assets/images/sports/sport_football.png'),
  },
  {
    id: 'v-5',
    code: 'NIGHTOWL40',
    title: 'Night Owl Madness',
    brand: 'All Partner Turfs',
    description: 'Flat 40% cashback on floodlight slots booked 10 PM - 1 AM',
    terms:
      'Book any floodlight slot between 10 PM and 1 AM and get 40% back as wallet cashback within 24 hours of play.',
    discountLabel: '40%',
    discountSuffix: 'BACK',
    validUntil: '02nd May',
    minBooking: 350,
    category: 'Turf Booking',
    logo: require('@/assets/images/sports/sport_booking.png'),
  },
  {
    id: 'v-3',
    code: 'EXPLORE20',
    title: 'Top 5-Star Arenas',
    brand: 'Premium Venues',
    description: 'Flat 20% discount on all premium rated arenas',
    terms:
      'Applies to any venue rated 4.5 and above. Show this code at the counter or apply it in-app while booking.',
    discountLabel: '20%',
    discountSuffix: 'OFF',
    validUntil: '12th May',
    minBooking: 500,
    category: 'Turf Booking',
    logo: require('@/assets/images/sports/skyline_turf.png'),
  },
  {
    id: 'v-7',
    code: 'COACHFREE',
    title: '1st Session Free',
    brand: 'NonStricker Academy',
    description: '100% free trial session with certified national coaches',
    terms:
      'Redeem one free trial coaching session with any certified coach on the platform. New students only, one per account.',
    discountLabel: '100%',
    discountSuffix: 'FREE',
    validUntil: '06th May',
    minBooking: 0,
    category: 'Coaching',
    logo: require('@/assets/images/sports/sport_coaching.png'),
  },
  {
    id: 'v-8',
    code: 'STUDENT60',
    title: 'Student League Pass',
    brand: 'Youth Programme',
    description: 'Flat 60% OFF on all weekday morning slots for students',
    terms:
      'Verified students get 60% off weekday morning slots before 12 PM. Carry a valid student ID to the venue.',
    discountLabel: '60%',
    discountSuffix: 'OFF',
    validUntil: '15th May',
    minBooking: 250,
    category: 'Coaching',
    logo: require('@/assets/images/sports/sport_cricket.png'),
  },
  {
    id: 'v-2',
    code: 'BIGSALE80',
    title: 'Tournament Pass',
    brand: 'Season Finale',
    description: 'End of season discount on tournament entry tickets',
    terms:
      'Up to 80% off tournament entry fees during the end-of-season window. Discount varies by tournament tier.',
    discountLabel: '80%',
    discountSuffix: 'OFF',
    validUntil: '05th May',
    minBooking: 300,
    category: 'Tournaments',
    logo: require('@/assets/images/sports/sport_tournament.png'),
  },
  {
    id: 'v-4',
    code: 'UNIVERI20',
    title: 'Pro Championship',
    brand: 'Championship Series',
    description: '20% discount when registering your squad for championships',
    terms:
      'Register a full squad for any Pro Championship fixture and take 20% off the team registration fee.',
    discountLabel: '20%',
    discountSuffix: 'OFF',
    validUntil: '10th May',
    minBooking: 600,
    category: 'Tournaments',
    logo: require('@/assets/images/sports/tournament_football.png'),
  },
  {
    id: 'v-6',
    code: 'GIFT500',
    title: 'e-Gift Card',
    brand: 'Gift a Game',
    description: 'Gift sports credits to friends & family with ₹500 wallet cash',
    terms:
      'Sends ₹500 of instant wallet credit to any NonStricker account you nominate. Credit never expires.',
    discountLabel: '₹500',
    discountSuffix: 'GIFT',
    validUntil: '14th May',
    minBooking: 500,
    category: 'Rewards',
    logo: require('@/assets/images/illustrations/gift_card_banner_bg.png'),
  },
  {
    id: 'v-9',
    code: 'SUPERBID2X',
    title: 'Bid Match 2X Coins',
    brand: 'Bid Rewards',
    description: 'Double your winning reward coins when challenging opponents',
    terms:
      'Win any bid match while this voucher is active and your reward coins are doubled automatically.',
    discountLabel: '2X',
    discountSuffix: 'COINS',
    validUntil: '04th May',
    minBooking: 100,
    category: 'Rewards',
    logo: require('@/assets/images/sports/sport_bid.png'),
  },
  {
    id: 'v-10',
    code: 'REFER250',
    title: 'Refer & Earn ₹250',
    brand: 'Referral Programme',
    description: 'Earn ₹250 instant wallet balance for every friend who plays',
    terms:
      'Share your referral code. When a friend signs up and completes their first booking, ₹250 lands in your wallet.',
    discountLabel: '₹250',
    discountSuffix: 'CASH',
    validUntil: '30th May',
    minBooking: 0,
    category: 'Rewards',
    logo: require('@/assets/images/illustrations/wallet_sports_icon.png'),
  },
];

export function getVoucherById(id?: string | string[]): Voucher | undefined {
  const key = Array.isArray(id) ? id[0] : id;
  if (!key) return undefined;
  return VOUCHERS.find(v => v.id === key);
}

export function getVoucherByCode(code: string): Voucher | undefined {
  const key = code.trim().toUpperCase();
  return VOUCHERS.find(v => v.code.toUpperCase() === key);
}

export function vouchersByCategory(category: VoucherCategory): Voucher[] {
  return VOUCHERS.filter(v => v.category === category);
}
