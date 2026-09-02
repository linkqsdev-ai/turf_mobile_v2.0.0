/**
 * cricket-engine.test.ts
 *
 * Characterisation tests for the live cricket scoring rules. These exist to
 * make the scoring engine safe to change: it is the app's most valuable and
 * least maintainable asset, and a silent rule error corrupts a match nobody can
 * replay.
 *
 * Cases are written from the laws of cricket, not from the implementation, so
 * a test failing here means the behaviour changed — not merely that the code
 * moved.
 */

import {
  isLegalDelivery,
  countsAsBallFaced,
  ranRuns,
  shouldRotateStrike,
  batsmanRunsFromExtra,
  extraLogSymbol,
  wicketLogSymbol,
  bowlerGetsCredit,
  dismissedBatsmanIndex,
  advanceBall,
  formatOvers,
  oversBowled,
  economyRate,
  strikeRate,
  targetFrom,
  isTargetReached,
  runsRequired,
  isInningsComplete,
  isMaidenOver,
  BALLS_PER_OVER,
  MAX_WICKETS,
} from '../lib/cricket-engine';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failed++;
    failures.push(`  ✗ ${name}\n      expected ${e}\n      actual   ${a}`);
  }
}

export function runCricketEngineTests() {
  console.log('\n🏏 Cricket scoring engine');

  // ── Legal deliveries ───────────────────────────────────────────────────────
  // A wide or no-ball must be re-bowled; byes and leg byes were fair deliveries.
  check('wide is not a legal delivery', isLegalDelivery('WD'), false);
  check('no-ball is not a legal delivery', isLegalDelivery('NB'), false);
  check('bye is a legal delivery', isLegalDelivery('BYE'), true);
  check('leg bye is a legal delivery', isLegalDelivery('LB'), true);
  // A bye can be run off a no-ball: the delivery is still illegal.
  check('override forces illegal', isLegalDelivery('BYE', false), false);
  check('override forces legal', isLegalDelivery('WD', true), true);

  // ── Balls faced ────────────────────────────────────────────────────────────
  // Facing a wide does not cost the batsman a ball; a bye does.
  check('wide is not a ball faced', countsAsBallFaced('WD'), false);
  check('no-ball is not a ball faced', countsAsBallFaced('NB'), false);
  check('bye is a ball faced', countsAsBallFaced('BYE'), true);
  check('leg bye is a ball faced', countsAsBallFaced('LB'), true);

  // ── Runs actually run (drives strike rotation) ─────────────────────────────
  // The wide/no-ball penalty run is not run by anyone, so it must be excluded.
  check('plain wide: nobody ran', ranRuns('WD', 1), 0);
  check('wide + 2 run: they ran 2', ranRuns('WD', 3), 2);
  check('plain no-ball: nobody ran', ranRuns('NB', 1), 0);
  check('no-ball + 1: they ran 1', ranRuns('NB', 2), 1);
  check('3 byes: they ran 3', ranRuns('BYE', 3), 3);
  check('2 leg byes: they ran 2', ranRuns('LB', 2), 2);
  // Guard against a malformed 0-run wide producing -1.
  check('zero-run wide never negative', ranRuns('WD', 0), 0);

  // ── Strike rotation ────────────────────────────────────────────────────────
  check('single rotates strike', shouldRotateStrike(1), true);
  check('two does not rotate', shouldRotateStrike(2), false);
  check('three rotates', shouldRotateStrike(3), true);
  check('dot ball does not rotate', shouldRotateStrike(0), false);
  check('boundary four does not rotate', shouldRotateStrike(4), false);
  check('six does not rotate', shouldRotateStrike(6), false);
  // The bug this prevents: a plain wide must NOT rotate strike.
  check('plain wide does not rotate', shouldRotateStrike(ranRuns('WD', 1)), false);
  // ...but a wide they ran a single off does.
  check('wide + 1 run rotates', shouldRotateStrike(ranRuns('WD', 2)), true);

  // ── Personal runs from extras ──────────────────────────────────────────────
  // Only a no-ball can carry runs off the bat. Byes/leg byes are team extras
  // and must never inflate a batting average.
  check('no-ball: 4 off the bat credited', batsmanRunsFromExtra('NB', 4), 4);
  check('wide credits the batsman nothing', batsmanRunsFromExtra('WD', 3), 0);
  check('bye credits the batsman nothing', batsmanRunsFromExtra('BYE', 3), 0);
  check('leg bye credits nothing', batsmanRunsFromExtra('LB', 2), 0);
  check('negative off-bat clamped', batsmanRunsFromExtra('NB', -2), 0);

  // ── Scorecard symbols ──────────────────────────────────────────────────────
  check('plain wide logs WD', extraLogSymbol('WD', 1), 'WD');
  check('3-run wide logs 3WD', extraLogSymbol('WD', 3), '3WD');
  check('plain no-ball logs NB', extraLogSymbol('NB', 1), 'NB');
  check('zero-run extra logs bare', extraLogSymbol('BYE', 0), 'BYE');
  check('4 byes logs 4BYE', extraLogSymbol('BYE', 4), '4BYE');

  check('bowled logs W', wicketLogSymbol('bowled', 0), 'W');
  check('run out with no runs logs W', wicketLogSymbol('run_out', 0), 'W');
  check('run out after 1 run logs 1W', wicketLogSymbol('run_out', 1), '1W');
  check('caught ignores runs', wicketLogSymbol('caught', 2), 'W');

  // ── Bowler credit ──────────────────────────────────────────────────────────
  // Crediting a run-out to the bowler would inflate bowling figures.
  check('bowled credits bowler', bowlerGetsCredit('bowled'), true);
  check('caught credits bowler', bowlerGetsCredit('caught'), true);
  check('lbw credits bowler', bowlerGetsCredit('lbw'), true);
  check('stumped credits bowler', bowlerGetsCredit('stumped'), true);
  check('run out does NOT credit bowler', bowlerGetsCredit('run_out'), false);
  check('retired does NOT credit bowler', bowlerGetsCredit('retired'), false);
  check('unknown kind defaults to credited', bowlerGetsCredit('weird'), true);

  // ── Who is dismissed ───────────────────────────────────────────────────────
  check('striker out at index 0', dismissedBatsmanIndex(0, 'striker'), 0);
  check('striker out at index 1', dismissedBatsmanIndex(1, 'striker'), 1);
  check('non-striker when striker is 0', dismissedBatsmanIndex(0, 'non-striker'), 1);
  check('non-striker when striker is 1', dismissedBatsmanIndex(1, 'non-striker'), 0);
  // No active batsman flagged must not yield -1 and corrupt the array.
  check('missing striker falls back to 0', dismissedBatsmanIndex(-1, 'striker'), 0);
  check('missing striker, non-striker → 1', dismissedBatsmanIndex(-1, 'non-striker'), 1);

  // ── Ball and over counting ─────────────────────────────────────────────────
  check('first ball of over', advanceBall(0, 0), { overs: 0, ballsInCurrentOver: 1, overComplete: false });
  check('fifth ball', advanceBall(0, 4), { overs: 0, ballsInCurrentOver: 5, overComplete: false });
  check('sixth ball completes over', advanceBall(0, 5), { overs: 1, ballsInCurrentOver: 0, overComplete: true });
  check('over rolls from 3.5 to 4.0', advanceBall(3, 5), { overs: 4, ballsInCurrentOver: 0, overComplete: true });
  check('six balls per over', BALLS_PER_OVER, 6);

  // A full over, one ball at a time, must land exactly on 1.0.
  let o = 0;
  let b = 0;
  for (let i = 0; i < 6; i++) {
    const r = advanceBall(o, b);
    o = r.overs;
    b = r.ballsInCurrentOver;
  }
  check('six legal balls = exactly 1.0', formatOvers(o, b), '1.0');

  // ── Overs formatting & rates ───────────────────────────────────────────────
  check('overs display 3.4', formatOvers(3, 4), '3.4');
  check('overs display 0.0', formatOvers(0, 0), '0.0');
  check('3 overs 3 balls = 3.5 decimal', oversBowled(3, 3), 3.5);
  check('economy 30 off 5 overs', economyRate(30, 5, 0), 6);
  check('economy guards divide-by-zero', economyRate(12, 0, 0), 0);
  check('strike rate 50 off 25', strikeRate(50, 25), 200);
  check('strike rate guards zero balls', strikeRate(0, 0), 0);

  // ── Chasing ────────────────────────────────────────────────────────────────
  // The chasing side must PASS the first innings total, not equal it.
  check('target is first innings + 1', targetFrom(150), 151);
  check('equalling the score is not a win', isTargetReached(150, 150), false);
  check('passing the score wins', isTargetReached(151, 150), true);
  check('overtaking wins', isTargetReached(155, 150), true);
  check('runs required from 100', runsRequired(100, 150), 51);
  check('runs required never negative', runsRequired(200, 150), 0);
  check('one run needed to win', runsRequired(150, 150), 1);

  // ── Innings completion ─────────────────────────────────────────────────────
  check('all out ends innings', isInningsComplete({ wickets: 10, overs: 4, ballsInCurrentOver: 2 }), true);
  check('nine down continues', isInningsComplete({ wickets: 9, overs: 4, ballsInCurrentOver: 2 }), false);
  check('ten wickets is all out', MAX_WICKETS, 10);
  check(
    'overs exhausted ends innings',
    isInningsComplete({ wickets: 3, overs: 20, ballsInCurrentOver: 0, maxOvers: 20 }),
    true
  );
  check(
    'mid-final-over continues',
    isInningsComplete({ wickets: 3, overs: 19, ballsInCurrentOver: 3, maxOvers: 20 }),
    false
  );
  check(
    'chase completed ends innings',
    isInningsComplete({
      wickets: 3,
      overs: 12,
      ballsInCurrentOver: 2,
      currentRuns: 151,
      firstInningsRuns: 150,
      isChasing: true,
    }),
    true
  );
  check(
    'chase still short continues',
    isInningsComplete({
      wickets: 3,
      overs: 12,
      ballsInCurrentOver: 2,
      currentRuns: 149,
      firstInningsRuns: 150,
      isChasing: true,
    }),
    false
  );
  check(
    'first innings ignores target',
    isInningsComplete({ wickets: 3, overs: 12, ballsInCurrentOver: 2, currentRuns: 200 }),
    false
  );

  // ── Maidens ────────────────────────────────────────────────────────────────
  check('wicketless scoreless over is a maiden', isMaidenOver(0, 6), true);
  check('one run breaks the maiden', isMaidenOver(1, 6), false);
  check('incomplete over is not a maiden', isMaidenOver(0, 4), false);

  // ── Worked sequence: a full over with extras ───────────────────────────────
  // 1, wide, 4, dot, 2, 6, 1 → 7 legal balls' worth of events, 6 legal deliveries.
  const over = [
    { kind: 'run' as const, runs: 1 },
    { kind: 'extra' as const, extra: 'WD' as const, runs: 1 },
    { kind: 'run' as const, runs: 4 },
    { kind: 'run' as const, runs: 0 },
    { kind: 'run' as const, runs: 2 },
    { kind: 'run' as const, runs: 6 },
    { kind: 'run' as const, runs: 1 },
  ];

  let overs = 0;
  let balls = 0;
  let total = 0;
  let strikerIsFirst = true;

  for (const e of over) {
    if (e.kind === 'run') {
      total += e.runs;
      if (shouldRotateStrike(e.runs)) strikerIsFirst = !strikerIsFirst;
      const r = advanceBall(overs, balls);
      overs = r.overs;
      balls = r.ballsInCurrentOver;
    } else {
      total += e.runs;
      if (shouldRotateStrike(ranRuns(e.extra, e.runs))) strikerIsFirst = !strikerIsFirst;
      if (isLegalDelivery(e.extra)) {
        const r = advanceBall(overs, balls);
        overs = r.overs;
        balls = r.ballsInCurrentOver;
      }
    }
  }

  check('worked over: 15 runs scored', total, 15);
  check('worked over: exactly one over bowled', formatOvers(overs, balls), '1.0');
  // Two singles rotated strike twice, so the original striker is back on strike.
  check('worked over: strike back with opener', strikerIsFirst, true);

  console.log(`   ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log(failures.join('\n'));
  }
  return { passed, failed };
}

// Allow running this file directly as well as through the shared runner.
if ((require as any).main === module) {
  const r = runCricketEngineTests();
  if (r.failed > 0) process.exit(1);
}
