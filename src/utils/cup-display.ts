/**
 * cup-display.ts
 *
 * What a Cups card says about a tournament: its status in words and accent, the
 * registration fill, the prize, and the sport's icon — plus the counts on the
 * "Cups at a Glance" card. Free of React so it is testable.
 */

import { ACCENTS, type Accent } from '@/constants/dashboard-accents';

export interface CupStatusInput {
  status?: string;
  registrationStatus?: string;
  isLive?: boolean;
}

export function cupStatus(t: CupStatusInput): { label: string; accent: Accent } {
  if (t.isLive || t.status === 'Ongoing') return { label: 'Live now', accent: ACCENTS.red };
  if (t.status === 'Finished' || t.status === 'Completed') return { label: 'Finished', accent: ACCENTS.slate };
  if (t.status === 'Cancelled') return { label: 'Cancelled', accent: ACCENTS.slate };
  const reg = t.registrationStatus || t.status || '';
  if (reg === 'Filling Fast') return { label: 'Filling fast', accent: ACCENTS.orange };
  if (reg === 'Closed') return { label: 'Registration closed', accent: ACCENTS.slate };
  if (reg === 'Upcoming') return { label: 'Opening soon', accent: ACCENTS.primary };
  return { label: 'Registering now', accent: ACCENTS.green };
}

/** 0–1; an uncapped tournament has no fill. */
export function teamsProgress(taken: number, max: number): number {
  return max > 0 ? Math.min(1, Math.max(0, taken / max)) : 0;
}

/** The parsed amount when there is one ("₹50,000"), else the free-text label, else TBD. */
export function prizeLabel(amount?: number | null, label?: string | null): string {
  if (amount && amount > 0) return `₹${Number(amount).toLocaleString('en-IN')}`;
  return String(label ?? '').trim() || 'TBD';
}

const SPORT_ICONS: Record<string, string> = {
  football: 'soccer',
  futsal: 'soccer',
  cricket: 'cricket',
  tennis: 'tennis',
  basketball: 'basketball',
  badminton: 'badminton',
  volleyball: 'volleyball',
};

const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  futsal: '⚽',
  cricket: '🏏',
  tennis: '🎾',
  basketball: '🏀',
  badminton: '🏸',
  volleyball: '🏐',
};

/** A MaterialCommunityIcons glyph for the sport. */
export function sportIcon(sport?: string | null): string {
  return SPORT_ICONS[String(sport ?? '').trim().toLowerCase()] ?? 'trophy-outline';
}

export function sportEmoji(sport?: string | null): string {
  return SPORT_EMOJI[String(sport ?? '').trim().toLowerCase()] ?? '🏆';
}

export interface CupsSummary {
  total: number;
  open: number;
  live: number;
  upcoming: number;
  finished: number;
  topPrize: number;
}

export function cupsSummary(list: (CupStatusInput & { prizePoolAmount?: number | null })[]): CupsSummary {
  const summary: CupsSummary = { total: list.length, open: 0, live: 0, upcoming: 0, finished: 0, topPrize: 0 };
  for (const t of list) {
    const { label } = cupStatus(t);
    if (label === 'Live now') summary.live += 1;
    else if (label === 'Finished' || label === 'Cancelled') summary.finished += 1;
    else if (label === 'Opening soon') summary.upcoming += 1;
    else if (label === 'Registering now' || label === 'Filling fast') summary.open += 1;
    summary.topPrize = Math.max(summary.topPrize, Number(t.prizePoolAmount) || 0);
  }
  return summary;
}
