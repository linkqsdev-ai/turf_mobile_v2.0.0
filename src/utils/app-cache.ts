/**
 * app-cache.ts
 *
 * What "Clear Cache" removes: everything the app has stored locally — bookings,
 * teams, matches, turfs, classes, offers, drafts — except the signed-in session
 * and the profile, so clearing never logs anyone out.
 */

export const CACHE_KEEP_KEYS = ['@turf_auth_token', '@turf_user_profile'];

export function cacheKeysToClear(allKeys: readonly string[]): string[] {
  const keep = new Set(CACHE_KEEP_KEYS);
  return (allKeys || []).filter(k => !keep.has(k));
}
