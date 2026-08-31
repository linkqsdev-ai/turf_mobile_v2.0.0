/**
 * own-board-store.ts
 * Persists and aggregates cricket match stats across all historical matches
 * for the Own Board (per-player career stats, match history).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@turf_own_board_v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MatchBatsmanEntry {
  name: string;
  avatarUrl?: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  strikeRate: number;
}

export interface MatchBowlerEntry {
  name: string;
  avatarUrl?: string;
  overs: number;
  runs: number;
  wickets: number;
  maidens: number;
  economy: number;
  dots: number;
}

export interface CompletedMatchRecord {
  id: string;
  completedAt: string;
  teamA: string;
  teamB: string;
  innings1: {
    team: string;
    score: string;   // e.g. "45/3"
    overs: string;   // e.g. "5.0"
    batsmen: MatchBatsmanEntry[];
    bowlers: MatchBowlerEntry[];
  };
  innings2: {
    team: string;
    score: string;
    overs: string;
    batsmen: MatchBatsmanEntry[];
    bowlers: MatchBowlerEntry[];
  };
  winner: string;
  winMargin: string;
  motmName: string;
  motmStat: string;
}

export interface AggregatedBatsmanStat {
  name: string;
  avatarUrl?: string;
  matches: number;
  innings: number;
  totalRuns: number;
  totalBalls: number;
  highScore: number;
  totalFours: number;
  totalSixes: number;
  dismissals: number;
  average: number;
  strikeRate: number;
}

export interface AggregatedBowlerStat {
  name: string;
  avatarUrl?: string;
  matches: number;
  innings: number;
  totalOvers: number;
  totalRuns: number;
  totalWickets: number;
  totalMaidens: number;
  totalDots: number;
  economy: number;
  average: number;
  bestWickets: number;
  bestRuns: number;
}

export interface OwnBoardData {
  matches: CompletedMatchRecord[];
}

export const INITIAL_SAMPLE_MATCHES: CompletedMatchRecord[] = [
  {
    id: 'sample-match-1',
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    teamA: 'Antony XI',
    teamB: 'Siva Strikers',
    innings1: {
      team: 'Antony XI',
      score: '68/2',
      overs: '5.0',
      batsmen: [
        { name: 'Praveen', runs: 38, balls: 14, fours: 4, sixes: 3, isOut: false, strikeRate: 271.4 },
        { name: 'Antony', runs: 22, balls: 11, fours: 2, sixes: 1, isOut: true, strikeRate: 200.0 },
        { name: 'Kavin', runs: 8, balls: 5, fours: 1, sixes: 0, isOut: true, strikeRate: 160.0 },
      ],
      bowlers: [
        { name: 'Dinesh', overs: 2.0, runs: 24, wickets: 1, maidens: 0, economy: 12.0, dots: 3 },
        { name: 'Yogi', overs: 2.0, runs: 28, wickets: 1, maidens: 0, economy: 14.0, dots: 2 },
        { name: 'Siva', overs: 1.0, runs: 16, wickets: 0, maidens: 0, economy: 16.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Siva Strikers',
      score: '54/4',
      overs: '5.0',
      batsmen: [
        { name: 'Siva', runs: 26, balls: 13, fours: 3, sixes: 1, isOut: true, strikeRate: 200.0 },
        { name: 'Sri', runs: 18, balls: 10, fours: 2, sixes: 0, isOut: true, strikeRate: 180.0 },
        { name: 'Dinesh', runs: 7, balls: 4, fours: 1, sixes: 0, isOut: true, strikeRate: 175.0 },
        { name: 'Yogi', runs: 3, balls: 3, fours: 0, sixes: 0, isOut: false, strikeRate: 100.0 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 18, wickets: 2, maidens: 0, economy: 9.0, dots: 5 },
        { name: 'Praveen', overs: 2.0, runs: 20, wickets: 1, maidens: 0, economy: 10.0, dots: 4 },
        { name: 'Antony', overs: 1.0, runs: 16, wickets: 1, maidens: 0, economy: 16.0, dots: 2 },
      ],
    },
    winner: 'Antony XI',
    winMargin: 'Won by 14 runs',
    motmName: 'Praveen',
    motmStat: '38 runs (14b) & 1/20 (2.0 ov)',
  },
  {
    id: 'sample-match-2',
    completedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    teamA: 'London Lions',
    teamB: 'Kent Kings',
    innings1: {
      team: 'London Lions',
      score: '52/3',
      overs: '5.0',
      batsmen: [
        { name: 'Antony', runs: 31, balls: 15, fours: 3, sixes: 2, isOut: false, strikeRate: 206.7 },
        { name: 'Sri', runs: 14, balls: 8, fours: 2, sixes: 0, isOut: true, strikeRate: 175.0 },
        { name: 'Azar', runs: 7, balls: 7, fours: 0, sixes: 0, isOut: true, strikeRate: 100.0 },
      ],
      bowlers: [
        { name: 'Dinesh', overs: 2.0, runs: 14, wickets: 2, maidens: 0, economy: 7.0, dots: 6 },
        { name: 'Praveen', overs: 2.0, runs: 22, wickets: 1, maidens: 0, economy: 11.0, dots: 3 },
        { name: 'Kavin', overs: 1.0, runs: 16, wickets: 0, maidens: 0, economy: 16.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Kent Kings',
      score: '46/5',
      overs: '4.4',
      batsmen: [
        { name: 'Praveen', runs: 24, balls: 12, fours: 3, sixes: 1, isOut: true, strikeRate: 200.0 },
        { name: 'Kavin', runs: 12, balls: 7, fours: 1, sixes: 1, isOut: true, strikeRate: 171.4 },
        { name: 'Dinesh', runs: 10, balls: 9, fours: 1, sixes: 0, isOut: true, strikeRate: 111.1 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 12, wickets: 3, maidens: 0, economy: 6.0, dots: 7 },
        { name: 'Antony', overs: 2.0, runs: 22, wickets: 1, maidens: 0, economy: 11.0, dots: 4 },
        { name: 'Sri', overs: 0.4, runs: 12, wickets: 1, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    winner: 'London Lions',
    winMargin: 'Won by 6 runs',
    motmName: 'Azar',
    motmStat: '3/12 (2.0 ov) & 7 runs',
  },
  {
    id: 'sample-match-3',
    completedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    teamA: 'Chennai Super Turfs',
    teamB: 'Bangalore Blasters',
    innings1: {
      team: 'Bangalore Blasters',
      score: '62/1',
      overs: '5.0',
      batsmen: [
        { name: 'Kavin', runs: 36, balls: 16, fours: 4, sixes: 2, isOut: false, strikeRate: 225.0 },
        { name: 'Siva', runs: 24, balls: 14, fours: 2, sixes: 1, isOut: true, strikeRate: 171.4 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 21, wickets: 1, maidens: 0, economy: 10.5, dots: 4 },
        { name: 'Praveen', overs: 2.0, runs: 25, wickets: 0, maidens: 0, economy: 12.5, dots: 3 },
        { name: 'Dinesh', overs: 1.0, runs: 16, wickets: 0, maidens: 0, economy: 16.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Chennai Super Turfs',
      score: '65/2',
      overs: '4.2',
      batsmen: [
        { name: 'Praveen', runs: 42, balls: 16, fours: 5, sixes: 3, isOut: false, strikeRate: 262.5 },
        { name: 'Antony', runs: 15, balls: 7, fours: 2, sixes: 0, isOut: true, strikeRate: 214.3 },
        { name: 'Sri', runs: 8, balls: 3, fours: 1, sixes: 0, isOut: false, strikeRate: 266.7 },
      ],
      bowlers: [
        { name: 'Dinesh', overs: 2.0, runs: 28, wickets: 1, maidens: 0, economy: 14.0, dots: 2 },
        { name: 'Yogi', overs: 1.2, runs: 22, wickets: 1, maidens: 0, economy: 16.5, dots: 1 },
        { name: 'Siva', overs: 1.0, runs: 15, wickets: 0, maidens: 0, economy: 15.0, dots: 2 },
      ],
    },
    winner: 'Chennai Super Turfs',
    winMargin: 'Won by 8 wickets',
    motmName: 'Praveen',
    motmStat: '42* runs (16b)',
  },
];

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function loadOwnBoardData(): Promise<OwnBoardData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OwnBoardData;
      if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return { matches: INITIAL_SAMPLE_MATCHES };
}

export async function saveMatchToOwnBoard(record: CompletedMatchRecord): Promise<void> {
  try {
    const data = await loadOwnBoardData();
    // Replace if same ID (rematch), otherwise append
    const idx = data.matches.findIndex(m => m.id === record.id);
    if (idx >= 0) {
      data.matches[idx] = record;
    } else {
      data.matches.unshift(record); // newest first
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

export async function clearOwnBoardData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ── Aggregation helpers ────────────────────────────────────────────────────────

export function aggregateBatsmen(matches: CompletedMatchRecord[]): AggregatedBatsmanStat[] {
  const map = new Map<string, AggregatedBatsmanStat>();

  for (const match of matches) {
    const allInnings = [match.innings1, match.innings2];
    for (const inn of allInnings) {
      for (const b of inn.batsmen) {
        if (!b.name?.trim()) continue;
        const key = b.name.toLowerCase().trim();
        const existing = map.get(key) || {
          name: b.name,
          avatarUrl: b.avatarUrl,
          matches: 0,
          innings: 0,
          totalRuns: 0,
          totalBalls: 0,
          highScore: 0,
          totalFours: 0,
          totalSixes: 0,
          dismissals: 0,
          average: 0,
          strikeRate: 0,
        };
        existing.matches += 1;
        existing.innings += 1;
        existing.totalRuns += b.runs;
        existing.totalBalls += b.balls;
        existing.totalFours += b.fours;
        existing.totalSixes += b.sixes;
        if (b.runs > existing.highScore) existing.highScore = b.runs;
        if (b.isOut) existing.dismissals += 1;
        if (b.avatarUrl && !existing.avatarUrl) existing.avatarUrl = b.avatarUrl;
        map.set(key, existing);
      }
    }
  }

  const result: AggregatedBatsmanStat[] = [];
  for (const stat of map.values()) {
    stat.average = stat.dismissals > 0
      ? parseFloat((stat.totalRuns / stat.dismissals).toFixed(1))
      : stat.totalRuns;
    stat.strikeRate = stat.totalBalls > 0
      ? parseFloat(((stat.totalRuns / stat.totalBalls) * 100).toFixed(1))
      : 0;
    result.push(stat);
  }

  return result.sort((a, b) => b.totalRuns - a.totalRuns);
}

export function aggregateBowlers(matches: CompletedMatchRecord[]): AggregatedBowlerStat[] {
  const map = new Map<string, AggregatedBowlerStat>();

  for (const match of matches) {
    const allInnings = [match.innings1, match.innings2];
    for (const inn of allInnings) {
      for (const b of inn.bowlers) {
        if (!b.name?.trim()) continue;
        const key = b.name.toLowerCase().trim();
        const existing = map.get(key) || {
          name: b.name,
          avatarUrl: b.avatarUrl,
          matches: 0,
          innings: 0,
          totalOvers: 0,
          totalRuns: 0,
          totalWickets: 0,
          totalMaidens: 0,
          totalDots: 0,
          economy: 0,
          average: 0,
          bestWickets: 0,
          bestRuns: 999,
        };
        existing.matches += 1;
        existing.innings += 1;
        existing.totalOvers += b.overs;
        existing.totalRuns += b.runs;
        existing.totalWickets += b.wickets;
        existing.totalMaidens += b.maidens;
        existing.totalDots += b.dots;
        if (
          b.wickets > existing.bestWickets ||
          (b.wickets === existing.bestWickets && b.runs < existing.bestRuns)
        ) {
          existing.bestWickets = b.wickets;
          existing.bestRuns = b.runs;
        }
        if (b.avatarUrl && !existing.avatarUrl) existing.avatarUrl = b.avatarUrl;
        map.set(key, existing);
      }
    }
  }

  const result: AggregatedBowlerStat[] = [];
  for (const stat of map.values()) {
    stat.economy = stat.totalOvers > 0
      ? parseFloat((stat.totalRuns / stat.totalOvers).toFixed(2))
      : 0;
    stat.average = stat.totalWickets > 0
      ? parseFloat((stat.totalRuns / stat.totalWickets).toFixed(1))
      : 999;
    result.push(stat);
  }

  return result.sort((a, b) => b.totalWickets - a.totalWickets || a.economy - b.economy);
}
