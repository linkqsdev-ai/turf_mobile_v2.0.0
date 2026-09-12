/**
 * wallet-deals.test.ts
 * What the Wallet & Offers screen lists, what its redeem box accepts, and the
 * payout role that follows from the signed-in account.
 */

import { liveOfferDeals, resolveCashbackCode } from '@/utils/wallet-deals';
import { CASHBACK_DEALS, TOURNAMENT_PASSES } from '@/constants/platform-deals';
import { payeeRoleFor } from '@/store/payout-store';
import type { OwnerOffer } from '@/store/offer-store';

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

const NOW = new Date('2026-09-11T10:00:00');

const offer = (over: Partial<OwnerOffer>): OwnerOffer => ({
  id: 'o-1',
  code: 'WEEKDAY20',
  title: 'Weekday Saver',
  description: '',
  discountType: 'percent',
  discountValue: 20,
  minBooking: 300,
  maxRedemptions: 0,
  redeemedCount: 0,
  validTill: '2026-10-02T00:00:00',
  appliesTo: 'All Turfs',
  status: 'active',
  createdAt: '2026-09-01T00:00:00',
  ...over,
});

export function runWalletDealsTests() {
  passed = 0;
  failed = 0;
  console.log('\n💰 Wallet deals & payout role\n');

  const deals = liveOfferDeals(
    [
      offer({}),
      offer({ id: 'o-2', code: 'OLD30', validTill: '2026-09-01T00:00:00' }),
      offer({ id: 'o-3', code: 'FULL10', maxRedemptions: 5, redeemedCount: 5 }),
      offer({ id: 'o-4', code: 'PAUSED5', status: 'paused' }),
      offer({ id: 'o-5', code: 'CAMP15', title: '', minBooking: 0 }),
    ],
    [
      { id: 'c-1', className: 'U-16 Camp', vouchers: [{ code: 'camp15' }, { code: 'NEWBIE', discountType: 'flat', discountValue: '150' }] },
      { id: 'c-2', className: 'Old Camp', vouchers: [{ code: 'OLD30', discountValue: 30 }] },
    ],
    TOURNAMENT_PASSES,
    NOW
  );

  check(
    'only usable offers, class vouchers and passes are listed',
    deals.map((d) => d.code),
    ['WEEKDAY20', 'CAMP15', 'NEWBIE', ...TOURNAMENT_PASSES.map((p) => p.code)]
  );
  check('a venue offer is grouped under venues', deals[0].group, 'Venue Offers');
  check('a venue offer shows its discount', deals[0].headline, '20% OFF');
  check('a venue offer shows its minimum and validity', deals[0].detail, 'Min. booking ₹300 · Valid till 2 Oct 2026');
  check(
    'a published class voucher is grouped with its class',
    { group: deals[1].group, appliesTo: deals[1].appliesTo, classId: deals[1].classId, title: deals[1].title },
    { group: 'Class Offers', appliesTo: 'U-16 Camp', classId: 'c-1', title: 'U-16 Camp Voucher' }
  );
  check('an unpublished class voucher shows a flat discount', deals[2].headline, '₹150 OFF');
  check('a lapsed store offer is not revived from its class', deals.some((d) => d.code === 'OLD30'), false);
  check('a tournament pass is grouped as a pass', deals[3].group, 'Tournament Passes');
  check('a flat tournament pass reads in rupees', deals[3].headline, '₹500 OFF');
  check('a code listed twice is shown once', liveOfferDeals([offer({}), offer({ id: 'dup' })], [], [], NOW).length, 1);
  check('nothing to list gives nothing', liveOfferDeals([], [], [], NOW), []);

  const bookingCodes = ['SALE50', 'WEEKDAY20'];
  const credit = resolveCashbackCode('  walletcash100 ', CASHBACK_DEALS, [], bookingCodes);
  check(
    'a cashback code credits its amount',
    credit.status === 'credit' ? { status: credit.status, amount: credit.deal.amount } : credit,
    { status: 'credit', amount: 100 }
  );
  check(
    'a cashback code pays out only once',
    resolveCashbackCode('WALLETCASH100', CASHBACK_DEALS, ['walletcash100'], bookingCodes).status,
    'already_redeemed'
  );
  check(
    'redeeming one cashback code leaves the others open',
    resolveCashbackCode('TOPUP50', CASHBACK_DEALS, ['WALLETCASH100'], bookingCodes).status,
    'credit'
  );
  check(
    'a booking voucher is sent to checkout, not credited',
    resolveCashbackCode('sale50', CASHBACK_DEALS, [], bookingCodes),
    { status: 'not_cashback', code: 'SALE50' }
  );
  check('an unknown code is invalid', resolveCashbackCode('nope', CASHBACK_DEALS, [], bookingCodes), { status: 'invalid', code: 'NOPE' });
  check('a blank code asks for one', resolveCashbackCode('   ', CASHBACK_DEALS, [], bookingCodes), { status: 'empty' });

  check('an owner is paid as a turf owner', payeeRoleFor('Owner'), 'owner');
  check('a coach is paid as a coach', payeeRoleFor('Coach'), 'coach');
  check('an organizer is paid as an organizer', payeeRoleFor('Organizer'), 'organizer');
  check('a player has no payee role', payeeRoleFor('Player'), null);
  check('an admin picks a payee role', payeeRoleFor('Super Admin'), null);
  check('no account has no payee role', payeeRoleFor(undefined), null);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
