/**
 * directory-search.ts
 *
 * Look up teams and players the app already knows about, so registering a team
 * can reuse an existing roster instead of retyping it.
 *
 * Kept free of React and react-native so the matching rules are testable.
 */

export interface DirectoryPlayer {
  id: string;
  name: string;
  phone?: string;
  team?: string;
}

export interface DirectoryTeam {
  id: string;
  name: string;
  mascot?: string;
  players: { name: string; phone?: string }[];
  source: 'team' | 'registration';
}

/** Last 10 digits — "+91 98765 11111" and "9876511111" are the same person. */
export function normalisePhone(phone?: string | null): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const MIN_QUERY = 2;

/** Prefix matches first, then anywhere-in-name matches, each group A→Z. */
function rank<T>(items: T[], query: string, key: (t: T) => string): T[] {
  const q = query.trim().toLowerCase();
  const starts: T[] = [];
  const contains: T[] = [];
  for (const item of items) {
    const name = key(item).toLowerCase();
    if (name.startsWith(q)) starts.push(item);
    else if (name.includes(q)) contains.push(item);
  }
  const byName = (a: T, b: T) => key(a).localeCompare(key(b));
  return [...starts.sort(byName), ...contains.sort(byName)];
}

/**
 * Teams whose name matches the query. The same team can exist both as a saved
 * team and as a past registration; the one with more players wins, since that
 * is the roster worth importing.
 */
export function searchTeams(query: string, teams: DirectoryTeam[], limit = 5): DirectoryTeam[] {
  if (query.trim().length < MIN_QUERY) return [];

  const best = new Map<string, DirectoryTeam>();
  for (const t of teams || []) {
    const name = String(t?.name ?? '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const current = best.get(key);
    if (!current || (t.players?.length ?? 0) > (current.players?.length ?? 0)) {
      best.set(key, { ...t, name, players: t.players || [] });
    }
  }
  return rank([...best.values()], query, t => t.name).slice(0, limit);
}

/**
 * One entry per real person: de-duplicated by phone when there is one,
 * otherwise by name. The first record with a phone number wins, so a name-only
 * duplicate never hides a contactable one.
 */
export function buildPlayerDirectory(
  sources: { name?: string; phone?: string; team?: string }[]
): DirectoryPlayer[] {
  const byPhone = new Map<string, DirectoryPlayer>();
  const byName = new Map<string, DirectoryPlayer>();

  for (const s of sources || []) {
    const name = String(s?.name ?? '').trim();
    if (!name) continue;
    const phone = normalisePhone(s.phone);
    const entry: DirectoryPlayer = {
      id: phone ? `ph-${phone}` : `nm-${name.toLowerCase()}`,
      name,
      ...(phone ? { phone } : {}),
      ...(s.team ? { team: s.team } : {}),
    };
    if (phone) {
      if (!byPhone.has(phone)) byPhone.set(phone, entry);
      byName.delete(name.toLowerCase());
    } else if (![...byPhone.values()].some(p => p.name.toLowerCase() === name.toLowerCase())) {
      if (!byName.has(name.toLowerCase())) byName.set(name.toLowerCase(), entry);
    }
  }
  return [...byPhone.values(), ...byName.values()];
}

/**
 * Players matching by name, or by phone when the query is mostly digits.
 * `exclude` holds names or phones already in the squad, so a player can't be
 * suggested twice.
 */
export function searchPlayers(
  query: string,
  players: DirectoryPlayer[],
  exclude: string[] = [],
  limit = 5
): DirectoryPlayer[] {
  const q = query.trim();
  if (q.length < MIN_QUERY) return [];

  const excluded = new Set(
    exclude.map(e => (normalisePhone(e).length >= 6 ? normalisePhone(e) : e.trim().toLowerCase())).filter(Boolean)
  );
  const available = (players || []).filter(
    p => !excluded.has(p.name.toLowerCase()) && !(p.phone && excluded.has(p.phone))
  );

  const digits = q.replace(/\D/g, '');
  if (digits.length >= 3 && digits.length >= q.replace(/\s/g, '').length - 1) {
    return available.filter(p => p.phone && p.phone.includes(digits)).slice(0, limit);
  }
  return rank(available, q, p => p.name).slice(0, limit);
}

/**
 * Whether a roster player is already one of the squad rows: by phone when both
 * sides have one, otherwise by name. Two people who share a name but have
 * different numbers stay distinct.
 */
export function isInSquad(
  player: { name: string; phone?: string },
  squad: { name: string; phone?: string }[]
): boolean {
  const phone = normalisePhone(player.phone);
  const name = String(player.name ?? '').trim().toLowerCase();
  return (squad || []).some(row => {
    const rowPhone = normalisePhone(row.phone);
    if (phone && rowPhone) return phone === rowPhone;
    return !!name && String(row.name ?? '').trim().toLowerCase() === name;
  });
}

/**
 * Filter a team's roster by name or number. Unlike `searchPlayers` an empty
 * query keeps everyone — the roster is already small and fully shown.
 */
export function filterRoster<T extends { name: string; phone?: string }>(query: string, roster: T[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return roster || [];
  const digits = q.replace(/\D/g, '');
  const isNumber = digits.length > 0 && digits.length >= q.replace(/\s/g, '').length - 1;
  return (roster || []).filter(p =>
    isNumber
      ? normalisePhone(p.phone).includes(digits)
      : String(p.name ?? '').toLowerCase().includes(q)
  );
}
