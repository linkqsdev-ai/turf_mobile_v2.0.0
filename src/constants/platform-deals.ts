/**
 * platform-deals.ts
 *
 * Deals the platform itself runs, as opposed to offers a venue or coach
 * publishes: the tournament passes and the wallet cashback codes. Shared by
 * the voucher carousels and the Wallet & Offers screen so a code shown in one
 * place is the same code the wallet accepts.
 */

/** A cashback code credits a fixed amount to the wallet, once. */
export interface CashbackDeal {
  id: string;
  code: string;
  title: string;
  description: string;
  appliesTo: string;
  /** Rupees credited to the wallet on redemption. */
  amount: number;
}

export const CASHBACK_DEALS: CashbackDeal[] = [
  {
    id: 'v_wallet_1',
    code: 'WALLETCASH100',
    title: 'Wallet Cashback',
    description: 'Redeem once to add ₹100 of instant balance to your wallet.',
    appliesTo: 'Instant Wallet Balance Credit',
    amount: 100,
  },
  {
    id: 'v_wallet_2',
    code: 'TOPUP50',
    title: 'Top-Up Bonus',
    description: 'Redeem once for a ₹50 bonus on your wallet balance.',
    appliesTo: 'All Online Additions',
    amount: 50,
  },
];

/** A platform discount on tournament entry, applied at registration. */
export interface PlatformPass {
  id: string;
  code: string;
  title: string;
  appliesTo: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
}

export const TOURNAMENT_PASSES: PlatformPass[] = [
  {
    id: 'v_tourn_1',
    code: 'CUP500',
    title: 'Tournament Pass',
    appliesTo: 'State Football & Cricket Cups',
    discountType: 'flat',
    discountValue: 500,
  },
  {
    id: 'v_tourn_2',
    code: 'SUPERLEAGUE',
    title: 'League Entry Pass',
    appliesTo: 'All Tournament Registrations',
    discountType: 'percent',
    discountValue: 25,
  },
];
