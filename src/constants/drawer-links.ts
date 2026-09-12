/**
 * drawer-links.ts
 *
 * The "Functions" section of the profile drawer: shortcuts to what each role
 * actually does in the app, kept apart from the Profile and Settings sections.
 * Plain data so the per-role lists are testable.
 */

export interface DrawerLinkSpec {
  key: string;
  label: string;
  hint: string;
  /** An Ionicons glyph name. */
  icon: string;
  tint: string;
  /** An app route; every one is checked to exist in the tests. */
  path: string;
}

const BOOKINGS: DrawerLinkSpec = {
  key: 'bookings', label: 'Booking History', hint: 'Active, completed & cancelled',
  icon: 'calendar-outline', tint: '#3B82F6', path: '/booking-history',
};
const WALLET: DrawerLinkSpec = {
  key: 'wallet', label: 'Offers & Wallet', hint: 'Vouchers, rewards & balance',
  icon: 'wallet-outline', tint: '#F59E0B', path: '/wallet',
};
const TEAMS: DrawerLinkSpec = {
  key: 'teams', label: 'My Teams', hint: 'Squads and players',
  icon: 'people-outline', tint: '#10B981', path: '/team-management',
};
const CLASSES: DrawerLinkSpec = {
  key: 'classes', label: 'My Classes', hint: 'Schedules, batches & enrolments',
  icon: 'school-outline', tint: '#8B5CF6', path: '/coach-classes',
};
const STUDENTS: DrawerLinkSpec = {
  key: 'students', label: 'Students', hint: "Today's sessions & attendance",
  icon: 'body-outline', tint: '#0EA5E9', path: '/coach-students',
};
const TURF_BOOKINGS: DrawerLinkSpec = {
  key: 'turf-bookings', label: 'Turf Bookings', hint: 'Who has booked your venues',
  icon: 'football-outline', tint: '#10B981', path: '/turf-bookings',
};
const OWNER_OFFERS: DrawerLinkSpec = {
  key: 'owner-offers', label: 'Vouchers & Offers', hint: 'Discounts for your turfs',
  icon: 'pricetags-outline', tint: '#EC4899', path: '/owner-offers',
};
const HOST: DrawerLinkSpec = {
  key: 'host', label: 'Host Tournaments', hint: 'Your cups, drafts & fixtures',
  icon: 'trophy-outline', tint: '#8B5CF6', path: '/(tabs)/club',
};
const EARNINGS: DrawerLinkSpec = {
  key: 'earnings', label: 'Payment Transactions', hint: 'Settlements, escrow & statements',
  icon: 'receipt-outline', tint: '#0EA5E9', path: '/owner-earnings',
};
const PAYOUTS: DrawerLinkSpec = {
  key: 'payouts', label: 'Payout Details', hint: 'Bank, UPI, PAN & GST',
  icon: 'card-outline', tint: '#64748B', path: '/payout-settings',
};

/**
 * Shortcuts for a role, most-used first. Payouts go only to roles that get
 * paid (owner, coach, organizer) — never to a player. An unknown role is
 * treated as a player.
 */
export function drawerFunctionLinks(role?: string | null): DrawerLinkSpec[] {
  switch (role) {
    case 'Owner':
      return [TURF_BOOKINGS, OWNER_OFFERS, EARNINGS, PAYOUTS, BOOKINGS, WALLET];
    case 'Coach':
      return [EARNINGS, PAYOUTS, BOOKINGS, WALLET];
    case 'Organizer':
      return [HOST, EARNINGS, PAYOUTS, BOOKINGS, WALLET];
    case 'Admin':
    case 'Super Admin':
      return [HOST, BOOKINGS, WALLET];
    default:
      return [BOOKINGS, WALLET, TEAMS];
  }
}

/** The notification switches the drawer's Settings section shows. */
export type NotificationKey = 'pushNotifications' | 'emailAlerts' | 'smsAlerts' | 'matchReminders' | 'promoOffers';

export const NOTIFICATION_SETTINGS: { key: NotificationKey; label: string; hint: string; defaultOn: boolean }[] = [
  { key: 'pushNotifications', label: 'Push Notifications', hint: 'Alerts for matches, bookings, and chats', defaultOn: true },
  { key: 'emailAlerts', label: 'Email Alerts', hint: 'Weekly summaries and invoicing', defaultOn: false },
  { key: 'smsAlerts', label: 'SMS Alerts', hint: 'Text message reminders for urgent updates', defaultOn: false },
  { key: 'matchReminders', label: 'Match Reminders', hint: 'Reminders before your scheduled matches', defaultOn: true },
  { key: 'promoOffers', label: 'Promotional Offers', hint: 'Discounts, vouchers, and seasonal deals', defaultOn: false },
];

/** "2 of 5 on" — unset switches count at their default. */
export function notificationsSummary(prefs: Partial<Record<NotificationKey, boolean | undefined>> | null | undefined): string {
  const on = NOTIFICATION_SETTINGS.filter(n => prefs?.[n.key] ?? n.defaultOn).length;
  if (on === 0) return 'All notifications off';
  if (on === NOTIFICATION_SETTINGS.length) return 'All notifications on';
  return `${on} of ${NOTIFICATION_SETTINGS.length} on`;
}

export const THEME_OPTIONS = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'blue', label: 'Blue', icon: 'color-fill-outline' },
] as const;
