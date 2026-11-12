/**
 * turf-venues.ts
 *
 * The turfs and grounds a tournament can be hosted at: turfs created in the
 * app first, then the venues that ship with it. Kept free of React so the
 * merge and search rules are testable.
 */

export interface TurfVenueOption {
  id: string;
  name: string;
  address: string;
  sport?: string;
  source: 'owned' | 'listed';
}

/**
 * One option per venue. Turfs created in the app win over a shipped venue of
 * the same id or name; a deactivated turf isn't offered.
 */
export function turfVenueOptions(
  owned: { id: string; name: string; address?: string; sportType?: string; isActive?: boolean }[],
  listed: { id: string; name: string; location?: string; sport?: string }[]
): TurfVenueOption[] {
  const out: TurfVenueOption[] = [];
  const ids = new Set<string>();
  const names = new Set<string>();

  const add = (option: TurfVenueOption) => {
    const name = option.name.trim();
    const key = name.toLowerCase();
    if (!name || ids.has(option.id) || names.has(key)) return;
    ids.add(option.id);
    names.add(key);
    out.push({ ...option, name, address: option.address.trim() });
  };

  for (const t of owned || []) {
    if (t?.isActive === false) continue;
    add({ id: t.id, name: String(t.name ?? ''), address: String(t.address ?? ''), sport: t.sportType, source: 'owned' });
  }
  for (const t of listed || []) {
    add({ id: t.id, name: String(t.name ?? ''), address: String(t.location ?? ''), sport: t.sport, source: 'listed' });
  }
  return out;
}

/** Venues whose name or address contains the query; an empty query keeps all. */
export function filterTurfVenues(query: string, options: TurfVenueOption[]): TurfVenueOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options || [];
  return (options || []).filter(o => o.name.toLowerCase().includes(q) || o.address.toLowerCase().includes(q));
}
