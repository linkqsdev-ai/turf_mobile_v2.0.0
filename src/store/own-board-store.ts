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
  status?: string;
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
    teamA: 'Knights Riders',
    teamB: 'Royal Rockers',
    innings1: {
      team: 'Knights Riders',
      score: '68/2',
      overs: '5.0',
      batsmen: [
        { name: 'Praveen', runs: 38, balls: 14, fours: 4, sixes: 3, isOut: false, status: 'not out', strikeRate: 271.4 },
        { name: 'Azar', runs: 20, balls: 9, fours: 3, sixes: 1, isOut: false, status: 'not out', strikeRate: 222.2 },
        { name: 'Antony', runs: 10, balls: 7, fours: 1, sixes: 0, isOut: true, status: 'c Guna b Messi Player', strikeRate: 142.9 },
      ],
      bowlers: [
        { name: 'Messi Player', overs: 1.0, runs: 11, wickets: 0, maidens: 0, economy: 11.0, dots: 1 },
        { name: 'Alex Rivera', overs: 1.0, runs: 12, wickets: 0, maidens: 0, economy: 12.0, dots: 1 },
        { name: 'Guna', overs: 2.0, runs: 24, wickets: 1, maidens: 0, economy: 12.0, dots: 2 },
        { name: 'Seshu', overs: 1.0, runs: 18, wickets: 0, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Royal Rockers',
      score: '54/4',
      overs: '5.0',
      batsmen: [
        { name: 'Messi Player', runs: 22, balls: 12, fours: 2, sixes: 1, isOut: true, status: 'b Azar', strikeRate: 183.3 },
        { name: 'Seshu', runs: 18, balls: 10, fours: 2, sixes: 1, isOut: true, status: 'c Antony b Praveen', strikeRate: 180.0 },
        { name: 'Guna', runs: 10, balls: 6, fours: 1, sixes: 0, isOut: true, status: 'c & b Azar', strikeRate: 166.7 },
        { name: 'Alex Rivera', runs: 4, balls: 2, fours: 1, sixes: 0, isOut: false, status: 'not out', strikeRate: 200.0 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 18, wickets: 2, maidens: 0, economy: 9.0, dots: 5 },
        { name: 'Praveen', overs: 2.0, runs: 20, wickets: 1, maidens: 0, economy: 10.0, dots: 4 },
        { name: 'Antony', overs: 1.0, runs: 16, wickets: 1, maidens: 0, economy: 16.0, dots: 2 },
      ],
    },
    winner: 'Knights Riders',
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
      score: '62/3',
      overs: '5.0',
      batsmen: [
        { name: 'Azar', runs: 29, balls: 15, fours: 3, sixes: 2, isOut: false, status: 'not out', strikeRate: 193.3 },
        { name: 'Antony', runs: 21, balls: 11, fours: 2, sixes: 1, isOut: true, status: 'b Seshu', strikeRate: 190.9 },
        { name: 'Sri', runs: 12, balls: 4, fours: 1, sixes: 1, isOut: true, status: 'c & b Guna', strikeRate: 300.0 },
      ],
      bowlers: [
        { name: 'Seshu', overs: 2.0, runs: 22, wickets: 1, maidens: 0, economy: 11.0, dots: 3 },
        { name: 'Guna', overs: 2.0, runs: 20, wickets: 1, maidens: 0, economy: 10.0, dots: 4 },
        { name: 'Messi Player', overs: 1.0, runs: 18, wickets: 1, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Kent Kings',
      score: '56/4',
      overs: '5.0',
      batsmen: [
        { name: 'Seshu', runs: 21, balls: 11, fours: 2, sixes: 1, isOut: true, status: 'c Antony b Azar', strikeRate: 190.9 },
        { name: 'Guna', runs: 24, balls: 11, fours: 3, sixes: 1, isOut: false, status: 'not out', strikeRate: 218.2 },
        { name: 'Messi Player', runs: 9, balls: 5, fours: 1, sixes: 0, isOut: true, status: 'b Azar', strikeRate: 180.0 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 14, wickets: 3, maidens: 0, economy: 7.0, dots: 6 },
        { name: 'Praveen', overs: 2.0, runs: 22, wickets: 1, maidens: 0, economy: 11.0, dots: 3 },
        { name: 'Antony', overs: 1.0, runs: 18, wickets: 0, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    winner: 'London Lions',
    winMargin: 'Won by 6 runs',
    motmName: 'Azar',
    motmStat: '29* (15b) & 3/14 (2.0 ov)',
  },
  {
    id: 'sample-match-3',
    completedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    teamA: 'Chennai Super Turfs',
    teamB: 'Bangalore Blasters',
    innings1: {
      team: 'Bangalore Blasters',
      score: '65/2',
      overs: '5.0',
      batsmen: [
        { name: 'Guna', runs: 26, balls: 12, fours: 3, sixes: 1, isOut: false, status: 'not out', strikeRate: 216.7 },
        { name: 'Seshu', runs: 24, balls: 13, fours: 2, sixes: 1, isOut: true, status: 'c Azar b Praveen', strikeRate: 184.6 },
        { name: 'Messi Player', runs: 15, balls: 8, fours: 2, sixes: 0, isOut: true, status: 'c & b Antony', strikeRate: 187.5 },
      ],
      bowlers: [
        { name: 'Azar', overs: 2.0, runs: 19, wickets: 1, maidens: 0, economy: 9.5, dots: 4 },
        { name: 'Praveen', overs: 2.0, runs: 24, wickets: 1, maidens: 0, economy: 12.0, dots: 3 },
        { name: 'Antony', overs: 1.0, runs: 18, wickets: 1, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    innings2: {
      team: 'Chennai Super Turfs',
      score: '68/2',
      overs: '4.3',
      batsmen: [
        { name: 'Praveen', runs: 42, balls: 16, fours: 5, sixes: 3, isOut: false, status: 'not out', strikeRate: 262.5 },
        { name: 'Azar', runs: 16, balls: 8, fours: 2, sixes: 1, isOut: true, status: 'b Guna', strikeRate: 200.0 },
        { name: 'Antony', runs: 10, balls: 4, fours: 2, sixes: 0, isOut: false, status: 'not out', strikeRate: 250.0 },
      ],
      bowlers: [
        { name: 'Guna', overs: 2.0, runs: 26, wickets: 1, maidens: 0, economy: 13.0, dots: 2 },
        { name: 'Messi Player', overs: 1.3, runs: 22, wickets: 0, maidens: 0, economy: 14.7, dots: 1 },
        { name: 'Seshu', overs: 1.0, runs: 18, wickets: 0, maidens: 0, economy: 18.0, dots: 1 },
      ],
    },
    winner: 'Chennai Super Turfs',
    winMargin: 'Won by 8 wickets',
    motmName: 'Praveen',
    motmStat: '42* runs (16b) & 1/24',
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
      if (!inn || !inn.batsmen) continue;
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
        existing.totalFours += (b.fours || 0);
        existing.totalSixes += (b.sixes || 0);
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
      if (!inn || !inn.bowlers) continue;
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
        existing.totalMaidens += (b.maidens || 0);
        existing.totalDots += (b.dots || 0);
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

// ── Per-Player Match History ──────────────────────────────────────────────────

export interface PlayerMatchHistoryItem {
  matchId: string;
  completedAt: string;
  matchTitle: string;
  teamA: string;
  teamB: string;
  winner: string;
  winMargin: string;
  isMOTM: boolean;
  motmName: string;
  batting?: {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    status: string;
    strikeRate: number;
  };
  bowling?: {
    overs: number;
    runs: number;
    wickets: number;
    maidens: number;
    economy: number;
  };
  matchRecord: CompletedMatchRecord;
}

export function getPlayerMatchHistory(playerName: string, matches: CompletedMatchRecord[]): PlayerMatchHistoryItem[] {
  if (!playerName || !matches) return [];
  const pKey = playerName.trim().toLowerCase();
  const list: PlayerMatchHistoryItem[] = [];

  for (const match of matches) {
    let batEntry: MatchBatsmanEntry | undefined;
    let bowlEntry: MatchBowlerEntry | undefined;

    for (const inn of [match.innings1, match.innings2]) {
      if (!inn) continue;
      const b = (inn.batsmen || []).find(x => x && x.name && x.name.trim().toLowerCase() === pKey);
      if (b) batEntry = b;
      const bw = (inn.bowlers || []).find(x => x && x.name && x.name.trim().toLowerCase() === pKey);
      if (bw) bowlEntry = bw;
    }

    if (batEntry || bowlEntry) {
      list.push({
        matchId: match.id,
        completedAt: match.completedAt,
        matchTitle: `${match.teamA} vs ${match.teamB}`,
        teamA: match.teamA,
        teamB: match.teamB,
        winner: match.winner,
        winMargin: match.winMargin,
        motmName: match.motmName,
        isMOTM: match.motmName.trim().toLowerCase() === pKey,
        batting: batEntry ? {
          runs: batEntry.runs,
          balls: batEntry.balls,
          fours: batEntry.fours || 0,
          sixes: batEntry.sixes || 0,
          isOut: batEntry.isOut,
          status: batEntry.status || (batEntry.isOut ? 'out' : 'not out'),
          strikeRate: batEntry.strikeRate,
        } : undefined,
        bowling: bowlEntry ? {
          overs: bowlEntry.overs,
          runs: bowlEntry.runs,
          wickets: bowlEntry.wickets,
          maidens: bowlEntry.maidens || 0,
          economy: bowlEntry.economy,
        } : undefined,
        matchRecord: match,
      });
    }
  }

  return list;
}

