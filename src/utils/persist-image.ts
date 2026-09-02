/**
 * persist-image.ts
 *
 * expo-image-picker hands back a *transient handle*, not durable image data:
 *   • web    — `blob:http://…`, scoped to the document and revoked on reload
 *   • native — `file:///…/Caches/ImagePicker/…`, in a cache dir the OS may purge
 *
 * Saving that string (into AsyncStorage, a store, a payload) looks fine until
 * the record is reopened later, at which point the handle is dead and the image
 * silently fails to render. Persist the bytes instead.
 */

/**
 * Cap on a stored data URI. AsyncStorage is not a blob store — Android's
 * default database ceiling is a few MB *in total*, so a couple of full-size
 * banners could wedge the whole app's persistence. Better to refuse a single
 * oversized image with a clear message.
 */
export const MAX_IMAGE_DATA_URI_BYTES = 900_000;

/** A handle that will not survive a reload/restart and must not be persisted. */
export function isTransientImageUri(uri?: string | null): boolean {
  if (!uri) return false;
  return uri.startsWith('blob:') || uri.includes('/ImagePicker/');
}

/** True for a value that is safe to store and re-render later. */
export function isPersistableImageUri(uri?: string | null): boolean {
  if (!uri) return false;
  if (isTransientImageUri(uri)) return false;
  return (
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://')
  );
}

/**
 * Drops a stored value that can no longer render, so callers can fall back to a
 * default rather than showing a broken image. Repairs records written before
 * the picker started persisting real data.
 */
export function sanitiseStoredImageUri(
  uri: string | undefined | null,
  fallback: string
): string {
  return isPersistableImageUri(uri) ? (uri as string) : fallback;
}

export type PickedImageResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'too-large' | 'no-data'; uri?: string };

/**
 * Converts a picker asset into something durable.
 *
 * Pass the asset from `launchImageLibraryAsync({ base64: true, … })`; the
 * base64 payload is what makes the result self-contained across platforms and
 * reloads, with no filesystem access and no extra dependency.
 */
export function toPersistableImage(asset: {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
}): PickedImageResult {
  if (!asset.base64) {
    // Nothing durable to store. Hand the raw uri back so the caller can decide
    // whether to use it provisionally rather than losing the user's pick.
    return { ok: false, reason: 'no-data', uri: asset.uri };
  }

  const dataUri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
  if (dataUri.length > MAX_IMAGE_DATA_URI_BYTES) {
    return { ok: false, reason: 'too-large' };
  }
  return { ok: true, uri: dataUri };
}
