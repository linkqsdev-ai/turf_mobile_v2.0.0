/**
 * class-list.test.ts
 *
 * The coach-creates-a-class flow: the record keeps its identity through
 * storage, appears in the coach's own list, and reaches players.
 *
 * Two shipped defects are pinned here as regressions:
 *   - loading deduplicated on className-classType-sportType and wrote the
 *     survivors back, permanently deleting a coach's second batch;
 *   - the player list deduplicated on a derived coach name, hiding classes.
 */

import {
  ensureClassIdentity,
  sortByNewestFirst,
  sortByOldestFirst,
  buildCoachList,
  classToCoachEntry,
  generateClassId,
  ClassRecord,
  CoachListEntry,
} from '@/store/class-list';
import { countForClass, ClassEnrollment } from '@/store/enrollment-store';

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

function cls(over: Partial<ClassRecord>): ClassRecord {
  return {
    id: 'class-1',
    className: 'Cricket Camp',
    classType: 'Regular Class',
    sportType: 'Cricket',
    createdAt: '2026-09-07T10:00:00.000Z',
    isActive: true,
    ...over,
  };
}

const alwaysActive = (c: ClassRecord) => c.isActive !== false;

export function runClassListTests() {
  passed = 0;
  failed = 0;
  console.log('\n🎓 Class creation & sync\n');

  // ── Identity survives storage ────────────────────────────────────────────
  const morning = cls({ id: 'class-a', sessionTime: '6:00 AM', venue: 'Ground A' });
  const evening = cls({ id: 'class-b', sessionTime: '6:00 PM', venue: 'Ground B' });

  check(
    'REGRESSION: two batches of one course both survive a reload',
    ensureClassIdentity([morning, evening]).classes.length,
    2
  );
  check(
    'nothing is rewritten when every record already has an id',
    ensureClassIdentity([morning, evening]).changed,
    false
  );
  check(
    'the same record stored twice is collapsed',
    ensureClassIdentity([morning, morning]).classes.length,
    1
  );
  check(
    'collapsing a true duplicate flags a rewrite',
    ensureClassIdentity([morning, morning]).changed,
    true
  );

  const legacy = ensureClassIdentity([
    { className: 'Old A', classType: 'Regular Class', sportType: 'Cricket' },
    { className: 'Old B', classType: 'Regular Class', sportType: 'Cricket' },
  ]);
  check('id-less legacy rows are kept, not merged', legacy.classes.length, 2);
  check('legacy rows each receive an id', legacy.classes.every(c => !!c.id), true);
  check('legacy rows get distinct ids', new Set(legacy.classes.map(c => c.id)).size, 2);
  check('repairing legacy rows flags a rewrite', legacy.changed, true);

  check('a malformed entry is dropped', ensureClassIdentity([null as any, morning]).classes.length, 1);
  check('an empty list is handled', ensureClassIdentity([]).classes, []);

  check('generated ids are unique', generateClassId() !== generateClassId(), true);

  // ── Ordering: newly created first ────────────────────────────────────────
  const older = cls({ id: 'class-old', className: 'Old', createdAt: '2026-09-01T09:00:00.000Z' });
  const newer = cls({ id: 'class-new', className: 'New', createdAt: '2026-09-07T09:00:00.000Z' });

  check(
    'a newly created class sorts to the top',
    sortByNewestFirst([older, newer]).map(c => c.className),
    ['New', 'Old']
  );
  check(
    'order does not depend on the input order',
    sortByNewestFirst([newer, older]).map(c => c.className),
    ['New', 'Old']
  );
  check(
    'oldest-first is the exact mirror',
    sortByOldestFirst([newer, older]).map(c => c.className),
    ['Old', 'New']
  );
  check('sorting does not mutate the input', (() => {
    const input = [older, newer];
    sortByNewestFirst(input);
    return input.map(c => c.className);
  })(), ['Old', 'New']);
  check(
    'a class with no createdAt falls back to its id timestamp',
    sortByNewestFirst([
      { id: 'class-1000000000000', className: 'Early' },
      { id: 'class-1900000000000', className: 'Late' },
    ]).map(c => c.className),
    ['Late', 'Early']
  );
  check(
    'same-millisecond classes keep a deterministic order',
    sortByNewestFirst([
      cls({ id: 'class-a', className: 'A', createdAt: '2026-09-07T10:00:00.000Z' }),
      cls({ id: 'class-b', className: 'B', createdAt: '2026-09-07T10:00:00.000Z' }),
    ]).map(c => c.className),
    ['B', 'A']
  );

  // ── The player-facing list ───────────────────────────────────────────────
  const batchA = cls({ id: 'c1', className: 'Cricket Camp - Batch A', createdAt: '2026-09-07T10:00:00.000Z' });
  const batchB = cls({ id: 'c2', className: 'Cricket Camp - Batch B', createdAt: '2026-09-07T11:00:00.000Z' });
  const sample: CoachListEntry[] = [
    classToCoachEntry(cls({ id: 'sample-1', className: 'Coach Vanguard' }), 0),
  ];

  const list = buildCoachList({
    classes: [batchA, batchB],
    isActive: alwaysActive,
    defaults: sample,
  });

  check(
    'REGRESSION: two batches sharing a coach-name prefix both reach players',
    list.filter(e => e.className?.startsWith('Cricket Camp')).length,
    2
  );
  check(
    'the newest class is first in the player list',
    list[0].className,
    'Cricket Camp - Batch B'
  );
  check('the sample roster follows real classes', list[list.length - 1].coachName, 'Coach Vanguard');

  check(
    'a deactivated class never reaches players',
    buildCoachList({
      classes: [batchA, cls({ id: 'c3', className: 'Hidden', isActive: false })],
      isActive: alwaysActive,
      defaults: [],
    }).length,
    1
  );

  check(
    'a sample coach is suppressed when a real class uses that name',
    buildCoachList({
      classes: [cls({ id: 'c9', className: 'Coach Vanguard' })],
      isActive: alwaysActive,
      defaults: sample,
    }).length,
    1
  );

  check(
    'a class reaching maxStudents capacity is removed from browse list',
    buildCoachList({
      classes: [
        cls({ id: 'c-full', className: 'Full Class', maxStudents: '10' }),
        cls({ id: 'c-open', className: 'Open Class', maxStudents: '10' }),
      ],
      isActive: alwaysActive,
      enrollmentCount: (id) => (id === 'c-full' ? 10 : 2),
      defaults: [],
    }).map(e => e.className),
    ['Open Class']
  );

  // ── Search and sport filters ─────────────────────────────────────────────
  check(
    'search matches the class name',
    buildCoachList({
      classes: [batchA, batchB],
      isActive: alwaysActive,
      defaults: [],
      query: 'batch a',
    }).map(e => e.className),
    ['Cricket Camp - Batch A']
  );
  check(
    'search matches the sport',
    buildCoachList({
      classes: [batchA, cls({ id: 'c4', className: 'Yoga', sportType: 'Fitness' })],
      isActive: alwaysActive,
      defaults: [],
      query: 'fitness',
    }).length,
    1
  );
  check(
    'the sport filter excludes other sports',
    buildCoachList({
      classes: [batchA, cls({ id: 'c5', className: 'Yoga', sportType: 'Fitness' })],
      isActive: alwaysActive,
      defaults: [],
      sport: 'Cricket',
    }).length,
    1
  );
  check(
    '"All" keeps every sport',
    buildCoachList({
      classes: [batchA, cls({ id: 'c6', className: 'Yoga', sportType: 'Fitness' })],
      isActive: alwaysActive,
      defaults: [],
      sport: 'All',
    }).length,
    2
  );
  check(
    'a search matching nothing yields an empty list, not everything',
    buildCoachList({
      classes: [batchA],
      isActive: alwaysActive,
      defaults: [],
      query: 'zzzz',
    }).length,
    0
  );

  // ── Card mapping ─────────────────────────────────────────────────────────
  const entry = classToCoachEntry(cls({ id: 'c7', className: 'Kids Cricket', feeAmount: 2500 }), 0);
  check('the card keeps the class id, so booking targets the right class', entry.id, 'c7');
  check('a fee renders as a rate', entry.rateText, '₹2500/hr');
  check(
    'a free class says Free rather than ₹0',
    classToCoachEntry(cls({ id: 'c8', feeAmount: 0 }), 0).rateText,
    'Free'
  );
  check('the raw class is carried for booking', entry.rawClass?.id, 'c7');

  // ── All classes display & Player Find Near Coach ─────────────────────────
  const classA = cls({ id: 'c10', className: 'Trichy Stars', venue: 'Trichy Turf', createdAt: '2026-09-01T10:00:00.000Z' });
  const classB = cls({ id: 'c11', className: 'Chennai Super', venue: 'Chennai Ground', createdAt: '2026-09-02T10:00:00.000Z' });
  const allList = buildCoachList({
    classes: [classA, classB],
    isActive: alwaysActive,
    defaults: [],
  });
  check('all coaching classes are shown in newest-first order', allList[0].className, 'Chennai Super');
  check('older classes follow in chronological order', allList[1].className, 'Trichy Stars');

  // Test Coach creation flow -> Player Find Near Coach
  const coachCreatedClass = cls({
    id: 'class-coach-test-1',
    className: 'Test coach',
    coachName: 'Test coach',
    sportType: 'Cricket',
    classType: 'Summer Camp',
    feeAmount: 2222,
    venue: 'Trichy Zone IV, Tiruchirappalli, Tamil Nadu, India',
    createdAt: new Date().toISOString(),
    isActive: true,
  });

  const playerBrowseList = buildCoachList({
    classes: [coachCreatedClass],
    isActive: alwaysActive,
    defaults: [],
    sport: 'All',
  });

  check('coach created class shows in player Find Near Coach list', playerBrowseList.length, 1);
  check('coach created class name matches', playerBrowseList[0].coachName, 'Test coach');
  check('mock coaches are completely excluded', playerBrowseList.some(c => c.coachName === 'Chloe Harrison'), false);

  // ── Booked count & Enrollment sync ────────────────────────────────────────
  const enrollments: ClassEnrollment[] = [
    {
      id: 'enroll-1',
      classId: 'class-unish-1',
      className: 'Unish Camp',
      studentName: 'Alex Turner',
      studentAge: '14',
      contactNumber: '+91 98765 43210',
      amountPaid: 1500,
      createdAt: '2026-09-09T10:00:00.000Z',
    },
  ];

  check('booked count matches exactly 1 for Unish Camp by id', countForClass(enrollments, 'class-unish-1'), 1);
  check('booked count matches exactly 1 for Unish Camp by name', countForClass(enrollments, 'Unish Camp'), 1);
  check('booked count is 0 for class with no enrollments', countForClass(enrollments, 'class-other-99'), 0);

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
