/**
 * own-board-display.ts
 *
 * What the Own Board cards say about a player or a match, worked out from the
 * aggregated stats so the wording and performance tiers are testable. The
 * cards themselves live in components/scoring/own-board-cards.tsx.
 */

import type {
  AggregatedBatsmanStat,
  AggregatedBowlerStat,
  CompletedMatchRecord,
  MatchBatsmanEntry,
  MatchBowlerEntry,
  PlayerMatchHistoryItem,
} from '@/store/own-board-store';
import { ACCENTS, type Accent } from '@/constants/dashboard-accents';

export type Tone = 'good' | 'fair' | 'poor';

/** Strike-rate tiers for short turf matches, where 150+ is genuinely quick. */
export function strikeRateTone(strikeRate: number): Tone {
  return strikeRate >= 150 ? 'good' : strikeRate >= 110 ? 'fair' : 'poor';
}

/** Economy tiers for 5-over turf cricket, where 12 an over is ordinary. */
export function economyTone(economy: number): Tone {
  return economy <= 8 ? 'good' : economy <= 12 ? 'fair' : 'poor';
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10 Sep 2026", built by parts so it reads the same on every device locale. */
export function formatPlayedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export interface PlayerCardContent {
  role: string;
  badge: { label: string; tone: Tone };
  info: string;
  meta: string[];
  chips: string[];
  total: { value: string; caption: string };
}

export function batsmanCard(s: AggregatedBatsmanStat, rank: number): PlayerCardContent {
  const notOuts = Math.max(0, s.innings - s.dismissals);
  return {
    role: rank === 1 && s.totalRuns > 0 ? 'Top run scorer' : 'Batter',
    badge: { label: `SR ${Math.round(s.strikeRate)}`, tone: strikeRateTone(s.strikeRate) },
    info: `${plural(s.innings, 'innings', 'innings')} · ${plural(s.totalBalls, 'ball')} faced`,
    meta: [`High score ${s.highScore}`, `${plural(s.totalFours, 'four')} · ${plural(s.totalSixes, 'six', 'sixes')}`],
    chips: [
      // Never dismissed means no batting average, not an average of every run.
      `Avg ${s.dismissals > 0 ? s.average : '–'}`,
      `SR ${s.strikeRate}`,
      plural(s.totalFours + s.totalSixes, 'boundary', 'boundaries'),
      plural(notOuts, 'not out', 'not outs'),
    ],
    total: { value: plural(s.totalRuns, 'run'), caption: 'Career total' },
  };
}

export function bowlerCard(s: AggregatedBowlerStat, rank: number): PlayerCardContent {
  const bestRuns = s.bestRuns === 999 ? '–' : String(s.bestRuns);
  return {
    role: rank === 1 && s.totalWickets > 0 ? 'Leading wicket-taker' : 'Bowler',
    badge: { label: `Eco ${s.economy}`, tone: economyTone(s.economy) },
    info: `${s.totalOvers.toFixed(1)} overs bowled`,
    meta: [
      `Best figures ${s.bestWickets}/${bestRuns}`,
      `${plural(s.totalDots, 'dot ball')} · ${plural(s.totalMaidens, 'maiden')}`,
    ],
    chips: [
      `Eco ${s.economy}`,
      `Avg ${s.average === 999 ? '–' : s.average}`,
      plural(s.innings, 'spell'),
      `${s.totalRuns} runs conceded`,
    ],
    total: { value: plural(s.totalWickets, 'wicket'), caption: 'Career total' },
  };
}

export interface MatchCardContent {
  title: string;
  pill: { label: string; tone: Tone };
  rows: { label: string; value: string }[];
  date: string;
  innings: { team: string; score: string; overs: string; runs: number; won: boolean }[];
  motm: { name: string; stat: string };
}

export function matchCard(m: CompletedMatchRecord): MatchCardContent {
  const scores = [m.innings1, m.innings2]
    .filter((inn) => inn && inn.score)
    .map((inn) => `${inn.score} (${inn.overs})`);
  const decided = !!m.winner?.trim();
  const winner = (m.winner || '').trim().toLowerCase();
  return {
    date: formatPlayedDate(m.completedAt),
    innings: [m.innings1, m.innings2]
      .filter((inn) => inn && inn.score)
      .map((inn) => ({
        team: inn.team,
        score: inn.score,
        overs: inn.overs,
        runs: runsOf(inn.score),
        won: decided && inn.team.trim().toLowerCase() === winner,
      })),
    motm: { name: m.motmName?.trim() || '—', stat: m.motmStat?.trim() || '' },
    title: `${m.teamA} vs ${m.teamB}`,
    pill: decided
      ? { label: m.winMargin?.trim() || 'Won', tone: 'good' }
      : { label: m.winMargin?.trim() || 'No result', tone: 'fair' },
    rows: [
      { label: 'Winner', value: decided ? m.winner : '—' },
      { label: 'Score', value: scores.join(' · ') || '—' },
      { label: 'Player of the match', value: m.motmName?.trim() || '—' },
      { label: 'Played', value: formatPlayedDate(m.completedAt) },
    ],
  };
}

// ─── Home dashboard design system ─────────────────────────────────────────────

// Accent pairs live in constants/dashboard-accents so every dashboard-style
// screen shares them; re-exported here for the Own Board's existing imports.
export { ACCENTS };
export type { Accent };

export function toneAccent(tone: Tone): Accent {
  return tone === 'good' ? ACCENTS.green : tone === 'fair' ? ACCENTS.orange : ACCENTS.red;
}

/** "Avg 38.5" → Avg / 38.5; "15 boundaries" → boundaries / 15 — for a value-over-label tile. */
export function splitStat(chip: string): { label: string; value: string } {
  const text = chip.trim();
  const space = text.indexOf(' ');
  if (space < 0) return { label: '', value: text };
  const first = text.slice(0, space);
  const rest = text.slice(space + 1);
  return /^[0-9]/.test(first) ? { label: rest, value: first } : { label: first, value: rest };
}

/** "68/2" → 68. */
export function runsOf(score?: string | null): number {
  return parseInt(String(score ?? '').split('/')[0], 10) || 0;
}

/** A bar label that fits under a 20px bar: the first name, trimmed. */
export function shortName(name: string): string {
  const first = name.trim().split(/\s+/)[0] || name.trim();
  return first.length > 7 ? `${first.slice(0, 6)}…` : first;
}

export interface AnalyticsBar {
  label: string;
  value: number;
  display: string;
  active: boolean;
}

export interface AnalyticsSummary {
  title: string;
  metric: string;
  tag: string;
  icon: string;
  accent: Accent;
  bars: AnalyticsBar[];
  footer: { label: string; value: string; status: string };
}

const BAR_LIMIT = 6;

/** Highlight the leaders, as the Home charts do: the top two non-zero values. */
function withLeaders(bars: Omit<AnalyticsBar, 'active'>[], leaders = 2): AnalyticsBar[] {
  const cut = [...bars].map((b) => b.value).sort((a, b) => b - a)[Math.min(leaders, bars.length) - 1] ?? 0;
  return bars.map((b) => ({ ...b, active: b.value > 0 && b.value >= cut }));
}

export function battingSummary(batsmen: AggregatedBatsmanStat[]): AnalyticsSummary {
  const runs = batsmen.reduce((sum, b) => sum + b.totalRuns, 0);
  const balls = batsmen.reduce((sum, b) => sum + b.totalBalls, 0);
  const quick = batsmen.filter((b) => b.strikeRate >= 150).length;
  const leader = batsmen[0];
  return {
    title: 'Career Runs (Top Batters)',
    metric: `${runs} Runs Total`,
    tag: leader ? `🔥 Top: ${shortName(leader.name)} (${leader.totalRuns})` : '',
    icon: 'stats-chart',
    accent: ACCENTS.green,
    bars: withLeaders(
      batsmen.slice(0, BAR_LIMIT).map((b) => ({ label: shortName(b.name), value: b.totalRuns, display: String(b.totalRuns) }))
    ),
    footer: {
      label: 'Team SR',
      value: balls > 0 ? String(Math.round((runs / balls) * 100)) : '–',
      status: `${plural(quick, 'batter')} at SR 150+`,
    },
  };
}

export function bowlingSummary(bowlers: AggregatedBowlerStat[]): AnalyticsSummary {
  const wickets = bowlers.reduce((sum, b) => sum + b.totalWickets, 0);
  const runs = bowlers.reduce((sum, b) => sum + b.totalRuns, 0);
  const overs = bowlers.reduce((sum, b) => sum + b.totalOvers, 0);
  const tight = bowlers.filter((b) => b.totalOvers > 0 && b.economy <= 8).length;
  const leader = bowlers[0];
  return {
    title: 'Career Wickets (Top Bowlers)',
    metric: `${wickets} Wickets Total`,
    tag: leader
      ? `🏆 Best: ${shortName(leader.name)} (${leader.bestWickets}/${leader.bestRuns === 999 ? '–' : leader.bestRuns})`
      : '',
    icon: 'trending-up',
    accent: ACCENTS.orange,
    bars: withLeaders(
      bowlers.slice(0, BAR_LIMIT).map((b) => ({ label: shortName(b.name), value: b.totalWickets, display: String(b.totalWickets) }))
    ),
    footer: {
      label: 'Avg Economy',
      value: overs > 0 ? `${(runs / overs).toFixed(1)}/over` : '–',
      status: `${plural(tight, 'bowler')} at eco ≤8`,
    },
  };
}

export function matchesSummary(matches: CompletedMatchRecord[]): AnalyticsSummary {
  // Oldest first, so the chart reads left-to-right in the order matches were played.
  const ordered = [...matches].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );
  const totals = ordered.map((m) => runsOf(m.innings1?.score) + runsOf(m.innings2?.score));
  const recent = ordered.slice(-BAR_LIMIT);
  const offset = ordered.length - recent.length;
  const chases = matches.filter(
    (m) => m.winner?.trim() && m.innings2?.team?.trim().toLowerCase() === m.winner.trim().toLowerCase()
  ).length;
  const highest = totals.length ? Math.max(...totals) : 0;
  return {
    title: 'Match Totals (Runs per Match)',
    metric: `${plural(matches.length, 'Match', 'Matches')} Played`,
    tag: totals.length ? `🏆 Highest: ${highest} runs` : '',
    icon: 'trophy',
    accent: ACCENTS.primary,
    bars: withLeaders(
      recent.map((m, i) => ({ label: `#${offset + i + 1}`, value: totals[offset + i], display: String(totals[offset + i]) }))
    ),
    footer: {
      label: 'Avg Total',
      value: totals.length ? `${Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)} runs` : '–',
      status: `Chased: ${chases}/${matches.length}`,
    },
  };
}

// ─── Scorecard & career detail ────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Thu, 10 Sep 2026 · 07:05 PM", built by parts so every locale reads the same. */
export function formatPlayedDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time = `${String(h12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${time}`;
}

export function toneEmoji(tone: Tone): string {
  return tone === 'good' ? '🔥' : tone === 'fair' ? '⚡' : '📉';
}

/** Cricket overs are over.ball, not a decimal: "1.3" is 9 balls, not 1.3 overs. */
export function oversToBalls(overs: number | string | null | undefined): number {
  const [whole, part = '0'] = String(overs ?? '0').split('.');
  return (parseInt(whole, 10) || 0) * 6 + Math.min(5, parseInt(part.charAt(0) || '0', 10) || 0);
}

export function economyOf(runs: number, overs: number | string): string {
  const balls = oversToBalls(overs);
  return balls > 0 ? ((runs * 6) / balls).toFixed(2) : '–';
}

export function strikeRateOf(runs: number, balls: number): string {
  return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '–';
}

type Innings = CompletedMatchRecord['innings1'];

function topBatter(batsmen: MatchBatsmanEntry[]): MatchBatsmanEntry | undefined {
  return batsmen.reduce<MatchBatsmanEntry | undefined>((best, b) => (!best || b.runs > best.runs ? b : best), undefined);
}

function bestBowler(bowlers: MatchBowlerEntry[]): MatchBowlerEntry | undefined {
  return bowlers.reduce<MatchBowlerEntry | undefined>(
    (best, b) => (!best || b.wickets > best.wickets || (b.wickets === best.wickets && b.runs < best.runs) ? b : best),
    undefined
  );
}

export function inningsBattingSummary(inn: Innings): AnalyticsSummary {
  const batsmen = inn?.batsmen || [];
  const runs = runsOf(inn?.score);
  const balls = oversToBalls(inn?.overs);
  const top = topBatter(batsmen);
  const boundaries = batsmen.reduce((sum, b) => sum + (b.fours || 0) + (b.sixes || 0), 0);
  return {
    title: `Batting · ${inn?.team || 'Innings'}`,
    metric: `${inn?.score || '0/0'} (${inn?.overs || '0.0'} ov)`,
    tag: top && top.runs > 0 ? `🔥 Top: ${shortName(top.name)} ${top.runs} (${top.balls})` : '',
    icon: 'stats-chart',
    accent: ACCENTS.green,
    bars: withLeaders(
      batsmen.slice(0, BAR_LIMIT).map((b) => ({ label: shortName(b.name), value: b.runs, display: `${b.runs}${b.isOut ? '' : '*'}` }))
    ),
    footer: {
      label: 'Run rate',
      value: balls > 0 ? `${((runs * 6) / balls).toFixed(1)}/over` : '–',
      status: plural(boundaries, 'boundary', 'boundaries'),
    },
  };
}

export function inningsBowlingSummary(inn: Innings, bowlingTeam?: string): AnalyticsSummary {
  const bowlers = inn?.bowlers || [];
  const wickets = bowlers.reduce((sum, b) => sum + b.wickets, 0);
  const dots = bowlers.reduce((sum, b) => sum + (b.dots || 0), 0);
  const best = bestBowler(bowlers);
  const tight = bowlers.filter((b) => {
    const balls = oversToBalls(b.overs);
    return balls > 0 && (b.runs * 6) / balls <= 8;
  }).length;
  return {
    title: bowlingTeam ? `Bowling · ${bowlingTeam}` : 'Bowling',
    metric: `${plural(wickets, 'Wicket')} Taken`,
    tag: best && best.wickets > 0 ? `🏆 Best: ${shortName(best.name)} ${best.wickets}/${best.runs}` : '',
    icon: 'trending-up',
    accent: ACCENTS.orange,
    bars: withLeaders(
      bowlers.slice(0, BAR_LIMIT).map((b) => ({ label: shortName(b.name), value: b.wickets, display: `${b.wickets}/${b.runs}` }))
    ),
    footer: { label: 'Dot balls', value: String(dots), status: `${plural(tight, 'bowler')} at eco ≤8` },
  };
}

export interface ScoreRow {
  key: string;
  title: string;
  subtitle: string;
  cells: string[];
  highlight: boolean;
}

export const BATTING_COLUMNS = ['R', 'B', '4s', '6s', 'SR'];
export const BOWLING_COLUMNS = ['O', 'M', 'R', 'W', 'Econ'];

export function battingRows(inn: Innings): ScoreRow[] {
  const batsmen = inn?.batsmen || [];
  const top = topBatter(batsmen);
  return batsmen.map((b, i) => ({
    key: `${b.name}-${i}`,
    title: b.name,
    subtitle: b.status || (b.isOut ? 'out' : 'not out'),
    cells: [String(b.runs), String(b.balls), String(b.fours || 0), String(b.sixes || 0), strikeRateOf(b.runs, b.balls)],
    highlight: b === top && b.runs > 0,
  }));
}

export function bowlingRows(inn: Innings): ScoreRow[] {
  const bowlers = inn?.bowlers || [];
  const best = bestBowler(bowlers);
  return bowlers.map((b, i) => ({
    key: `${b.name}-${i}`,
    title: b.name,
    subtitle: plural(b.dots || 0, 'dot ball'),
    cells: [Number(b.overs).toFixed(1), String(b.maidens || 0), String(b.runs), String(b.wickets), economyOf(b.runs, b.overs)],
    highlight: b === best && b.wickets > 0,
  }));
}

export interface PlayerCareerContent {
  role: string;
  metric: string;
  tag: string;
  footer: { label: string; value: string; status: string };
  batting: AnalyticsSummary | null;
  battingTiles: string[];
  bowling: AnalyticsSummary | null;
  bowlingTiles: string[];
}

export function playerCareerSummary(
  logs: PlayerMatchHistoryItem[],
  bat?: AggregatedBatsmanStat,
  bowl?: AggregatedBowlerStat
): PlayerCareerContent {
  const ordered = [...logs].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const numbered = ordered.map((log, i) => ({ log, n: i + 1 }));
  const motm = logs.filter((l) => l.isMOTM).length;
  const latest = ordered[ordered.length - 1];
  const role = bat && bowl ? 'All-rounder' : bat ? 'Batter' : bowl ? 'Bowler' : 'Player';

  return {
    role,
    metric: `${plural(logs.length, 'Match', 'Matches')} Played`,
    tag: motm > 0 ? `⭐ ${motm}× Player of the Match` : '🏏 Career record',
    footer: { label: 'Last played', value: latest ? formatPlayedDate(latest.completedAt) : '—', status: role },
    batting: bat
      ? {
          title: 'Career Batting',
          metric: `${plural(bat.totalRuns, 'Run')} · ${bat.innings} Inns`,
          tag: `${toneEmoji(strikeRateTone(bat.strikeRate))} SR ${Math.round(bat.strikeRate)}`,
          icon: 'stats-chart',
          accent: ACCENTS.green,
          bars: withLeaders(
            numbered
              .filter((x) => x.log.batting)
              .slice(-BAR_LIMIT)
              .map(({ log, n }) => ({
                label: `#${n}`,
                value: log.batting!.runs,
                display: `${log.batting!.runs}${log.batting!.isOut ? '' : '*'}`,
              }))
          ),
          footer: {
            label: 'High score',
            value: String(bat.highScore),
            status: `${plural(bat.totalFours, 'four')} · ${plural(bat.totalSixes, 'six', 'sixes')}`,
          },
        }
      : null,
    battingTiles: bat ? batsmanCard(bat, 2).chips : [],
    bowling: bowl
      ? {
          title: 'Career Bowling',
          metric: `${plural(bowl.totalWickets, 'Wicket')} · ${bowl.totalOvers.toFixed(1)} ov`,
          tag: `${toneEmoji(economyTone(bowl.economy))} Eco ${bowl.economy}`,
          icon: 'trending-up',
          accent: ACCENTS.orange,
          bars: withLeaders(
            numbered
              .filter((x) => x.log.bowling)
              .slice(-BAR_LIMIT)
              .map(({ log, n }) => ({
                label: `#${n}`,
                value: log.bowling!.wickets,
                display: `${log.bowling!.wickets}/${log.bowling!.runs}`,
              }))
          ),
          footer: {
            label: 'Best figures',
            value: `${bowl.bestWickets}/${bowl.bestRuns === 999 ? '–' : bowl.bestRuns}`,
            status: plural(bowl.totalDots, 'dot ball'),
          },
        }
      : null,
    bowlingTiles: bowl ? bowlerCard(bowl, 2).chips : [],
  };
}

export interface MatchLogContent {
  title: string;
  result: { label: string; tone: Tone };
  date: string;
  isMOTM: boolean;
  batting: { line: string; note: string; status: string } | null;
  bowling: { line: string; note: string } | null;
}

export function matchLogCard(item: PlayerMatchHistoryItem): MatchLogContent {
  const winner = (item.winner || '').trim();
  const margin = (item.winMargin || '').trim();
  return {
    title: item.matchTitle,
    result: winner
      ? { label: margin ? `${winner} ${margin.charAt(0).toLowerCase()}${margin.slice(1)}` : `${winner} won`, tone: 'good' }
      : { label: margin || 'No result', tone: 'fair' },
    date: formatPlayedDate(item.completedAt),
    isMOTM: item.isMOTM,
    batting: item.batting
      ? {
          line: `${item.batting.runs}${item.batting.isOut ? '' : '*'} (${item.batting.balls}b)`,
          note: `${item.batting.fours}×4 · ${item.batting.sixes}×6 · SR ${strikeRateOf(item.batting.runs, item.batting.balls)}`,
          status: item.batting.status,
        }
      : null,
    bowling: item.bowling
      ? {
          line: `${item.bowling.wickets}/${item.bowling.runs} (${Number(item.bowling.overs).toFixed(1)} ov)`,
          note: `Eco ${economyOf(item.bowling.runs, item.bowling.overs)} · ${plural(item.bowling.maidens || 0, 'maiden')}`,
        }
      : null,
  };
}
