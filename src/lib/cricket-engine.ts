/**
 * cricket-engine.ts
 *
 * The decision kernel of live cricket scoring, pulled out of the scoring
 * component so it can be tested. These are the rules a scoring bug hides in:
 * which deliveries count, who is credited, when strike rotates, when the over
 * turns over. Getting any of them wrong silently corrupts a match — and a
 * corrupted scorecard destroys the trust the feature exists to earn.
 *
 * Everything here is pure: same inputs, same outputs, no React, no I/O.
 * `cricket-scoring.tsx` calls these rather than keeping its own copy, so these
 * tests protect the code that actually runs.
 */

export type ExtraType = 'WD' | 'NB' | 'BYE' | 'LB';
export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'stumped'
  | 'run_out'
  | 'hit_wicket'
  | 'retired';

export const BALLS_PER_OVER = 6;
export const MAX_WICKETS = 10;

/**
 * Was this a legal delivery — i.e. does it advance the over?
 *
 * Byes and leg byes are legal (the bowler bowled a fair ball; the runs simply
 * didn't come off the bat). Wides and no-balls are not, and must be re-bowled.
 * `override` exists because the UI allows a bye/leg-bye to be recorded off a
 * no-ball, where the delivery is illegal despite the extra type.
 */
export function isLegalDelivery(extraType: ExtraType, override?: boolean): boolean {
  if (override !== undefined) return override;
  return extraType === 'BYE' || extraType === 'LB';
}

/**
 * Does the striker get a ball added to their personal tally?
 *
 * Only legal deliveries count as balls faced. A bye or leg bye was legal, so it
 * counts even though the batsman scored nothing from it. A wide or no-ball
 * does not.
 */
export function countsAsBallFaced(extraType: ExtraType): boolean {
  return extraType === 'BYE' || extraType === 'LB';
}

/**
 * How many runs the batsmen physically *ran*, which is what decides which end
 * they finish at — not the team total.
 *
 * On a wide or no-ball, one run is a penalty nobody ran, so it must be excluded
 * or strike rotates when it shouldn't. On byes and leg byes every run counted
 * was actually run.
 */
export function ranRuns(extraType: ExtraType, totalRuns: number): number {
  if (extraType === 'BYE' || extraType === 'LB') return totalRuns;
  return Math.max(0, totalRuns - 1);
}

/** Batsmen finish at opposite ends after an odd number of runs. */
export function shouldRotateStrike(runsRan: number): boolean {
  return runsRan % 2 !== 0;
}

/**
 * Runs credited to the striker's personal score for an extra.
 *
 * Only a no-ball can carry runs off the bat. The wide/no-ball penalty run and
 * all bye/leg-bye runs belong to the team as extras and must never reach a
 * personal score, or batting averages silently inflate.
 */
export function batsmanRunsFromExtra(extraType: ExtraType, runsOffBat: number): number {
  return extraType === 'NB' ? Math.max(0, runsOffBat) : 0;
}

/** Scorecard symbol for an extra: a plain wide logs "WD", a 3-run wide "3WD". */
export function extraLogSymbol(extraType: ExtraType, runCount: number): string {
  return runCount <= 1 ? extraType : `${runCount}${extraType}`;
}

/** Scorecard symbol for a wicket; a run-out may carry completed runs. */
export function wicketLogSymbol(dismissalType: string, runsCompleted: number): string {
  if (dismissalType === 'run_out' && runsCompleted > 0) return `${runsCompleted}W`;
  return 'W';
}

/**
 * Is the bowler credited with the wicket?
 *
 * Takes a bare string, not the `DismissalType` union, because the value
 * arrives from UI state and is not guaranteed to be one of the known kinds.
 * Anything unrecognised is treated as a normal wicket and credited.
 *
 * Run-outs and retirements are not the bowler's doing. Crediting them would
 * inflate bowling figures — the stat coaches and players care most about.
 */
export function bowlerGetsCredit(dismissalType: string): boolean {
  return dismissalType !== 'run_out' && dismissalType !== 'retired';
}

/**
 * Which batsman is dismissed, as an index into the two-batsman array.
 *
 * Normally the striker, but a run-out can dismiss the non-striker, so the
 * caller passes which end went. Falls back to index 0 when no striker is
 * flagged rather than returning -1 and corrupting the array.
 */
export function dismissedBatsmanIndex(
  strikerIndex: number,
  whoIsOut: 'striker' | 'non-striker'
): number {
  const striker = strikerIndex >= 0 ? strikerIndex : 0;
  if (whoIsOut === 'non-striker') return striker === 0 ? 1 : 0;
  return striker;
}

export interface BallCountResult {
  overs: number;
  ballsInCurrentOver: number;
  overComplete: boolean;
}

/**
 * Advances the ball count for a legal delivery.
 *
 * At six the over is complete: the over number increments and the ball counter
 * resets. `overComplete` lets the caller run end-of-over handling (swap strike,
 * change bowler) without re-deriving the condition.
 */
export function advanceBall(overs: number, ballsInCurrentOver: number): BallCountResult {
  const next = ballsInCurrentOver + 1;
  if (next >= BALLS_PER_OVER) {
    return { overs: overs + 1, ballsInCurrentOver: 0, overComplete: true };
  }
  return { overs, ballsInCurrentOver: next, overComplete: false };
}

/** Conventional overs display: 3 overs and 4 balls reads "3.4". */
export function formatOvers(overs: number, ballsInCurrentOver: number): string {
  return `${overs}.${ballsInCurrentOver}`;
}

/** Overs as a decimal, for economy rates. 3 overs 3 balls = 3.5 overs bowled. */
export function oversBowled(overs: number, ballsInOver: number): number {
  return overs + ballsInOver / BALLS_PER_OVER;
}

/** Runs conceded per over. Zero overs yields 0 rather than dividing by zero. */
export function economyRate(runs: number, overs: number, ballsInOver: number): number {
  const total = oversBowled(overs, ballsInOver);
  if (total <= 0) return 0;
  return Number((runs / total).toFixed(2));
}

/** Runs per 100 balls faced. Zero balls yields 0 rather than NaN. */
export function strikeRate(runs: number, balls: number): number {
  if (balls <= 0) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

/** The chasing side must pass the first innings total, so target is +1. */
export function targetFrom(firstInningsRuns: number): number {
  return firstInningsRuns + 1;
}

/** Has the chase succeeded? Uses >= because the target is already +1. */
export function isTargetReached(currentRuns: number, firstInningsRuns: number): boolean {
  return currentRuns >= targetFrom(firstInningsRuns);
}

/** Runs still needed to win. Never negative. */
export function runsRequired(currentRuns: number, firstInningsRuns: number): number {
  return Math.max(0, targetFrom(firstInningsRuns) - currentRuns);
}

/**
 * Is the innings over?
 *
 * Three independent endings: all out, allotted overs bowled, or (batting
 * second) the target passed. Any one of them ends it.
 */
export function isInningsComplete(params: {
  wickets: number;
  overs: number;
  ballsInCurrentOver: number;
  maxOvers?: number;
  currentRuns?: number;
  firstInningsRuns?: number | null;
  isChasing?: boolean;
}): boolean {
  const { wickets, overs, ballsInCurrentOver, maxOvers, currentRuns, firstInningsRuns, isChasing } =
    params;

  if (wickets >= MAX_WICKETS) return true;

  if (typeof maxOvers === 'number' && maxOvers > 0) {
    if (overs > maxOvers) return true;
    if (overs === maxOvers && ballsInCurrentOver >= BALLS_PER_OVER) return true;
    if (overs >= maxOvers && ballsInCurrentOver === 0 && overs === maxOvers) {
      // Exactly at the end of the final over.
      return true;
    }
  }

  if (isChasing && typeof currentRuns === 'number' && typeof firstInningsRuns === 'number') {
    return isTargetReached(currentRuns, firstInningsRuns);
  }

  return false;
}

/**
 * A maiden is a completed over in which the bowler conceded nothing.
 *
 * Byes and leg byes don't count against the bowler, so an over of byes is still
 * a maiden; a wide or no-ball is the bowler's fault and breaks it.
 */
export function isMaidenOver(runsOffBowlerThisOver: number, ballsBowled: number): boolean {
  return ballsBowled >= BALLS_PER_OVER && runsOffBowlerThisOver === 0;
}
