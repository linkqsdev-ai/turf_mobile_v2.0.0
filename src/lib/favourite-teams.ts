import type { Team } from '@/store/match-store';

/**
 * Favourite teams the player has starred, most relevant first.
 *
 * Favourites that match the sport being set up win; if the player has no
 * favourite for that sport we fall back to all favourites so the slot still
 * gets a sensible default rather than staying empty.
 */
export function favouriteTeamsFor(teams: Team[], sport?: string): Team[] {
  const favourites = teams.filter((t) => t.isFavourite);
  if (!sport) return favourites;
  const sameSport = favourites.filter(
    (t) => !t.sport || t.sport.toLowerCase() === sport.toLowerCase(),
  );
  return sameSport.length > 0 ? sameSport : favourites;
}

/**
 * Default Team A / Team B names for a match setup form. The app caps
 * favourites at two, so at most both slots get filled — A takes the first
 * favourite, B the second (when one exists).
 */
export function favouriteTeamDefaults(
  teams: Team[],
  sport?: string,
): { teamA: string; teamB: string } {
  const favourites = favouriteTeamsFor(teams, sport);
  return {
    teamA: favourites[0]?.name ?? '',
    teamB: favourites[1]?.name ?? '',
  };
}

/** Case/whitespace-insensitive comparison used by the "already selected" guard. */
export function isSameTeam(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
