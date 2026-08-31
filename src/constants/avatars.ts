// Preset avatar artwork — single source of truth for resolving a user's
// `avatarUrl` to an actual image source.
//
// `avatarUrl` should always be stored as either:
//   - a preset key, e.g. "avatar_7"  (picked from the grid below), or
//   - a real photo URI (http(s)://, file://, or data:)
//
// It must never be stored as a raw `require()` result. On native that's an
// opaque Metro asset id (a plain number) which is NOT stable across bundle
// rebuilds/reloads — persisting one to AsyncStorage and reading it back
// after the bundle changes points at nothing, which is exactly why avatars
// were silently failing to load across the app after a reload. Sticking to
// string keys/URIs keeps `avatarUrl` JSON-safe and stable to persist.

export const AVATAR_IMAGES: Record<string, any> = {
  avatar_1: require('@/assets/images/avatars/avatar_1.png'),
  avatar_2: require('@/assets/images/avatars/avatar_2.png'),
  avatar_3: require('@/assets/images/avatars/avatar_3.png'),
  avatar_4: require('@/assets/images/avatars/avatar_4.png'),
  avatar_5: require('@/assets/images/avatars/avatar_5.png'),
  avatar_6: require('@/assets/images/avatars/avatar_6.png'),
  avatar_7: require('@/assets/images/avatars/avatar_7.png'),
  avatar_8: require('@/assets/images/avatars/avatar_8.png'),
  avatar_9: require('@/assets/images/avatars/avatar_9.png'),
  avatar_10: require('@/assets/images/avatars/avatar_10.png'),
  avatar_11: require('@/assets/images/avatars/avatar_11.png'),
  avatar_12: require('@/assets/images/avatars/avatar_12.png'),
  avatar_13: require('@/assets/images/avatars/avatar_13.png'),
  avatar_14: require('@/assets/images/avatars/avatar_14.png'),
  avatar_15: require('@/assets/images/avatars/avatar_15.png'),
  avatar_16: require('@/assets/images/avatars/avatar_16.png'),
  avatar_17: require('@/assets/images/avatars/avatar_17.png'),
  avatar_18: require('@/assets/images/avatars/avatar_18.png'),
  avatar_19: require('@/assets/images/avatars/avatar_19.png'),
  avatar_20: require('@/assets/images/avatars/avatar_20.png'),
};

export const AVATAR_KEYS = Object.keys(AVATAR_IMAGES);
export const DEFAULT_AVATAR_KEY = 'avatar_1';

/**
 * Resolves any historical shape `avatarUrl` might be in — a preset key, a
 * real photo URI, a legacy raw require() result (number/object from before
 * this module existed), or a stale/garbage value — to a safe `<Image>`
 * source, always falling back to the default preset rather than rendering
 * a broken image.
 */
export function getAvatarSource(avatarUrl?: unknown): any {
  if (avatarUrl === null || avatarUrl === undefined || avatarUrl === '') {
    return AVATAR_IMAGES[DEFAULT_AVATAR_KEY];
  }

  // Legacy: already a resolved require() result (native module id, or a
  // web asset object) from before avatars were stored as keys/URIs.
  if (typeof avatarUrl === 'number' || (typeof avatarUrl === 'object' && avatarUrl !== null)) {
    return avatarUrl;
  }

  if (typeof avatarUrl === 'string') {
    if (AVATAR_IMAGES[avatarUrl]) return AVATAR_IMAGES[avatarUrl];
    if (/^(https?:|data:|file:|blob:|\/)/.test(avatarUrl)) return { uri: avatarUrl };
    // A bare numeric string is a stale persisted Metro asset id from the old
    // scheme — it won't resolve to anything valid anymore, so don't try.
    if (/^\d+$/.test(avatarUrl)) return AVATAR_IMAGES[DEFAULT_AVATAR_KEY];
    // Anything else unrecognized: treat as a URI and let the fallback in the
    // calling <Image> (if any) handle a genuine 404.
    return { uri: avatarUrl };
  }

  return AVATAR_IMAGES[DEFAULT_AVATAR_KEY];
}
