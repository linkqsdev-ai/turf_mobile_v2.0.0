/**
 * class-list.ts
 *
 * Identity, ordering and player-facing assembly for coaching classes.
 *
 * Two defects motivated pulling this out of the components and the provider:
 *
 *  1. Classes loaded from storage were deduplicated on
 *     `className-classType-sportType` and the survivors written back. A coach
 *     running a morning and an evening batch of the same course lost one of
 *     them permanently on the next app start.
 *
 *  2. The player-facing list deduplicated on a *derived* coach name —
 *     `className.split(' - ')[0]` when a class carries no coach name, which is
 *     always, because the create form never writes one. "Cricket Camp - Batch A"
 *     and "Cricket Camp - Batch B" collapsed to one entry.
 *
 * Identity is the class id and nothing else. Two classes that look alike are
 * still two classes.
 */

export interface ClassRecord {
  id?: string;
  className?: string;
  classType?: string;
  sportType?: string;
  createdAt?: string;
  isActive?: boolean;
  [key: string]: any;
}

/** Ids collide when two classes are created in the same millisecond. */
export function generateClassId(): string {
  return `class-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Give every record a stable id and drop only true duplicates — same id twice.
 *
 * Legacy rows written before ids existed get one synthesised here rather than
 * being collapsed together: without an id they would all key on `undefined`
 * and all but the first would be discarded.
 */
export function ensureClassIdentity(list: ClassRecord[]): {
  classes: ClassRecord[];
  changed: boolean;
} {
  const seen = new Set<string>();
  let changed = false;
  const classes: ClassRecord[] = [];

  for (const item of list ?? []) {
    if (!item || typeof item !== 'object') {
      changed = true;
      continue;
    }

    let id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!id) {
      id = generateClassId();
      changed = true;
    }

    if (seen.has(id)) {
      // The same record stored twice — safe to drop, unlike two records that
      // merely share a name.
      changed = true;
      continue;
    }

    seen.add(id);
    classes.push(item.id === id ? item : { ...item, id });
  }

  return { classes, changed };
}

/** Milliseconds for ordering; falls back to the id's timestamp, then 0. */
function createdAtMs(item: ClassRecord): number {
  const parsed = item?.createdAt ? Date.parse(item.createdAt) : NaN;
  if (!Number.isNaN(parsed)) return parsed;

  // Ids look like "class-1757241600000-ab12"; recover the stamp if present.
  const match = typeof item?.id === 'string' ? item.id.match(/^class-(\d{10,})/) : null;
  return match ? Number(match[1]) : 0;
}

/**
 * Newest first, so a class a coach just created is at the top of both their own
 * list and the players' list.
 *
 * Ordering was previously implicit — `addClass` prepends, and everything relied
 * on that insertion order surviving reload and edits. Sorting explicitly means
 * the order holds however the array was built.
 */
export function sortByNewestFirst<T extends ClassRecord>(list: T[]): T[] {
  return [...(list ?? [])].sort((a, b) => {
    const diff = createdAtMs(b) - createdAtMs(a);
    // Stable tie-break so same-millisecond classes keep a deterministic order.
    return diff !== 0 ? diff : String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });
}

/** Oldest first — the mirror of the above, for callers that want it. */
export function sortByOldestFirst<T extends ClassRecord>(list: T[]): T[] {
  return sortByNewestFirst(list).reverse();
}

export interface CoachListEntry {
  id: string;
  coachName: string;
  roleTitle: string;
  sportType: string;
  skills: string[];
  rating: number;
  studentsText: string;
  studentsLabel: string;
  rateText: string;
  feeAmount: number;
  avatar: string;
  venue: string;
  className?: string;
  rawClass?: ClassRecord;
}

const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

/** One published class as a bookable card. */
export function classToCoachEntry(cls: ClassRecord, idx: number): CoachListEntry {
  const displayName =
    cls.className ||
    cls.coachName ||
    cls.instructorName ||
    'Coach Specialist';
  return {
    id: cls.id || `class-coach-${idx}`,
    coachName: displayName,
    roleTitle: `${cls.classType || 'Academy Specialist'} • ${cls.sportType || 'Cricket'}`,
    sportType: cls.sportType || 'Cricket',
    skills: [cls.sportType, cls.classType, cls.ageGroup || 'All Ages'].filter(Boolean),
    rating: cls.rating || 4.9,
    studentsText: `${18 + idx * 6}+`,
    studentsLabel: 'Students',
    rateText: cls.feeAmount ? `₹${cls.feeAmount}/hr` : 'Free',
    feeAmount: cls.feeAmount || 0,
    avatar: cls.avatar || cls.image || FALLBACK_AVATARS[idx % FALLBACK_AVATARS.length],
    venue: cls.venue || 'Local Arena',
    className: cls.className,
    rawClass: cls,
  };
}

export interface BuildCoachListOptions {
  classes: ClassRecord[];
  /** Deactivated classes must never reach players. */
  isActive: (cls: ClassRecord) => boolean;
  /** Enrolment count helper — when a class reaches maxStudents, it is removed from the browsing list */
  enrollmentCount?: (classId: string) => number;
  /** Sample roster shown alongside real classes. */
  defaults: CoachListEntry[];
  query?: string;
  sport?: string;
  userLocation?: string;
}

/**
 * The list a player browses: every active class newest-first (with location
 * matches prioritized at the very top), then the sample roster, filtered by search, sport,
 * and removing classes that have reached their maxStudents capacity.
 *
 * Real classes are never dropped for sharing a name. Only a *sample* coach is
 * suppressed when a real class already uses that name, so the placeholder does
 * not sit next to the genuine article.
 */
export function buildCoachList({
  classes,
  isActive,
  enrollmentCount,
  defaults,
  query = '',
  sport = 'All',
}: BuildCoachListOptions): CoachListEntry[] {
  const active = (classes ?? []).filter(cls => {
    if (!isActive(cls)) return false;
    if (enrollmentCount && cls.id) {
      const cap = parseInt(String(cls.maxStudents || ''), 10);
      if (!isNaN(cap) && cap > 0) {
        const enrolled = enrollmentCount(cls.id);
        if (enrolled >= cap) {
          // Reached max capacity — remove from available list
          return false;
        }
      }
    }
    return true;
  });
  const sortedActive = sortByNewestFirst(active);
  const entries = sortedActive.map(classToCoachEntry);

  const realNames = new Set(entries.map(e => (e.coachName || '').toLowerCase()));
  const samples = (defaults ?? []).filter(
    d => !realNames.has((d.coachName || '').toLowerCase())
  );

  const q = query.trim().toLowerCase();
  return [...entries, ...samples].filter(c => {
    const sLower = sport.toLowerCase();
    const sportOk =
      sport === 'All' ||
      c.sportType.toLowerCase() === sLower ||
      c.sportType.toLowerCase().includes(sLower) ||
      sLower.includes(c.sportType.toLowerCase()) ||
      (c.className || '').toLowerCase().includes(sLower) ||
      c.skills.some(s => s.toLowerCase().includes(sLower));
    if (!sportOk) return false;
    if (!q) return true;
    return (
      c.coachName.toLowerCase().includes(q) ||
      c.roleTitle.toLowerCase().includes(q) ||
      (c.className || '').toLowerCase().includes(q) ||
      (c.venue || '').toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    );
  });
}
