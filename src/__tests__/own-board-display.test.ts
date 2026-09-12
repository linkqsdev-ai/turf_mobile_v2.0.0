/**
 * own-board-display.test.ts
 * What the Own Board cards show for players and matches.
 */

import {
  strikeRateTone,
  economyTone,
  formatPlayedDate,
  batsmanCard,
  bowlerCard,
  matchCard,
  splitStat,
  runsOf,
  shortName,
  toneAccent,
  battingSummary,
  bowlingSummary,
  matchesSummary,
  formatPlayedDateTime,
  oversToBalls,
  economyOf,
  strikeRateOf,
  inningsBattingSummary,
  inningsBowlingSummary,
  battingRows,
  bowlingRows,
  playerCareerSummary,
  matchLogCard,
} from '@/utils/own-board-display';

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

export function runOwnBoardDisplayTests() {
  passed = 0;
  failed = 0;
  console.log('\n📋 Own Board cards\n');

  check('a strike rate of 150 is good', strikeRateTone(150), 'good');
  check('a strike rate of 120 is fair', strikeRateTone(120), 'fair');
  check('a strike rate of 90 is poor', strikeRateTone(90), 'poor');
  check('an economy of 7 is good', economyTone(7), 'good');
  check('an economy of 12 is fair', economyTone(12), 'fair');
  check('an economy of 18 is poor', economyTone(18), 'poor');

  const praveen = {
    name: 'Praveen', matches: 2, innings: 2, totalRuns: 80, totalBalls: 30, highScore: 42,
    totalFours: 9, totalSixes: 6, dismissals: 0, average: 80, strikeRate: 266.7,
  };
  const bat = batsmanCard(praveen, 1);
  check('the leading batter is the top run scorer', bat.role, 'Top run scorer');
  check('the batter badge shows the rounded strike rate', bat.badge, { label: 'SR 267', tone: 'good' });
  check('the info line counts innings and balls', bat.info, '2 innings · 30 balls faced');
  check('a batter never out has no average', bat.chips[0], 'Avg –');
  check('boundaries add fours and sixes', bat.chips[2], '15 boundaries');
  check('both innings count as not outs', bat.chips[3], '2 not outs');
  check('the career total is runs', bat.total, { value: '80 runs', caption: 'Career total' });
  check('a lower rank is just a batter', batsmanCard({ ...praveen, dismissals: 1, average: 80 }, 2).role, 'Batter');
  check('a dismissed batter shows the average', batsmanCard({ ...praveen, dismissals: 1, average: 80 }, 2).chips[0], 'Avg 80');
  check('one six reads singular', batsmanCard({ ...praveen, totalSixes: 1 }, 2).meta[1], '9 fours · 1 six');

  const azar = {
    name: 'Azar', matches: 3, innings: 3, totalOvers: 6, totalRuns: 51, totalWickets: 6,
    totalMaidens: 0, totalDots: 15, economy: 8.5, average: 8.5, bestWickets: 3, bestRuns: 14,
  };
  const bowl = bowlerCard(azar, 1);
  check('the leading bowler is the leading wicket-taker', bowl.role, 'Leading wicket-taker');
  check('the bowler badge shows economy', bowl.badge, { label: 'Eco 8.5', tone: 'fair' });
  check('best figures read wickets/runs', bowl.meta[0], 'Best figures 3/14');
  check('overs show one decimal', bowl.info, '6.0 overs bowled');
  check('the career total is wickets', bowl.total.value, '6 wickets');
  check('no wickets means no average or best runs', bowlerCard({ ...azar, totalWickets: 0, average: 999, bestWickets: 0, bestRuns: 999 }, 1).chips[1], 'Avg –');
  check('a wicketless leader is just a bowler', bowlerCard({ ...azar, totalWickets: 0 }, 1).role, 'Bowler');

  const played = new Date(2026, 8, 10, 12).toISOString();
  check('the played date reads by parts', formatPlayedDate(played), '10 Sep 2026');
  check('a broken date reads as a dash', formatPlayedDate('not a date'), '—');

  const innings = { team: 'Knights Riders', score: '68/2', overs: '5.0', batsmen: [], bowlers: [] };
  const match = {
    id: 'm1', completedAt: played, teamA: 'Knights Riders', teamB: 'Royal Rockers',
    innings1: innings, innings2: { ...innings, team: 'Royal Rockers', score: '54/4' },
    winner: 'Knights Riders', winMargin: 'Won by 14 runs', motmName: 'Praveen', motmStat: '38 runs',
  };
  const card = matchCard(match);
  check('the title names both teams', card.title, 'Knights Riders vs Royal Rockers');
  check('a decided match shows its margin as a good pill', card.pill, { label: 'Won by 14 runs', tone: 'good' });
  check(
    'the rows read winner, score, player and date',
    card.rows,
    [
      { label: 'Winner', value: 'Knights Riders' },
      { label: 'Score', value: '68/2 (5.0) · 54/4 (5.0)' },
      { label: 'Player of the match', value: 'Praveen' },
      { label: 'Played', value: '10 Sep 2026' },
    ]
  );
  check('an undecided match reads No result', matchCard({ ...match, winner: '', winMargin: '' }).pill, { label: 'No result', tone: 'fair' });

  // ── Home dashboard design system ─────────────────────────────────────────
  check('good maps to the dashboard green', toneAccent('good'), { main: '#10b981', dark: '#047857' });
  check('poor maps to red', toneAccent('poor').main, '#EF4444');
  check('a label-first stat splits', splitStat('Avg –'), { label: 'Avg', value: '–' });
  check('a number-first stat splits', splitStat('15 boundaries'), { label: 'boundaries', value: '15' });
  check('a multi-word label stays whole', splitStat('51 runs conceded'), { label: 'runs conceded', value: '51' });
  check('runs read from a score', runsOf('68/2'), 68);
  check('a broken score reads zero', runsOf(''), 0);
  check('a bar label keeps the first name', shortName('Messi Player'), 'Messi');
  check('a long first name is trimmed', shortName('Christopher'), 'Christ…');

  check('match cards carry both innings with the winner marked', matchCard(match).innings.map(i => [i.runs, i.won]), [[68, true], [54, false]]);
  check('match cards carry the date and player of the match', [matchCard(match).date, matchCard(match).motm.name], ['10 Sep 2026', 'Praveen']);

  const bats = [
    { ...praveen, totalRuns: 80, totalBalls: 30, strikeRate: 266.7 },
    { ...praveen, name: 'Azar', totalRuns: 45, totalBalls: 23, strikeRate: 195.7 },
    { ...praveen, name: 'Guna', totalRuns: 10, totalBalls: 12, strikeRate: 83.3 },
  ];
  const batSum = battingSummary(bats);
  check('batting metric totals every run', batSum.metric, '135 Runs Total');
  check('batting tag names the top scorer', batSum.tag, '🔥 Top: Praveen (80)');
  check('the top two batters are highlighted', batSum.bars.map(b => b.active), [true, true, false]);
  check('batting footer shows team strike rate', batSum.footer, { label: 'Team SR', value: '208', status: '2 batters at SR 150+' });

  const bowls = [
    { ...azar, totalWickets: 6, totalRuns: 51, totalOvers: 6, economy: 8.5 },
    { ...azar, name: 'Guna', totalWickets: 3, totalRuns: 46, totalOvers: 4, economy: 11.5 },
    { ...azar, name: 'Seshu', totalWickets: 1, totalRuns: 40, totalOvers: 2, economy: 7.5 },
  ];
  const bowlSum = bowlingSummary(bowls);
  check('bowling metric totals every wicket', bowlSum.metric, '10 Wickets Total');
  check('bowling tag shows the best figures', bowlSum.tag, '🏆 Best: Azar (3/14)');
  check('bowling footer averages economy across overs', bowlSum.footer, { label: 'Avg Economy', value: '11.4/over', status: '1 bowler at eco ≤8' });

  const hours = (h: number) => new Date(2026, 8, 10, h).toISOString();
  const m = (id: string, at: number, s1: string, s2: string, winner: string) => ({
    ...match, id, completedAt: hours(at),
    innings1: { ...innings, team: 'A', score: s1 }, innings2: { ...innings, team: 'B', score: s2 }, winner,
  });
  const matchSum = matchesSummary([m('m3', 12, '65/2', '68/2', 'B'), m('m2', 10, '62/3', '56/4', 'A'), m('m1', 8, '68/2', '54/4', 'A')]);
  check('match bars run oldest to newest', matchSum.bars.map(b => [b.label, b.value]), [['#1', 122], ['#2', 118], ['#3', 133]]);
  check('the two biggest totals are highlighted', matchSum.bars.map(b => b.active), [true, false, true]);
  check('matches metric and tag read plainly', [matchSum.metric, matchSum.tag], ['3 Matches Played', '🏆 Highest: 133 runs']);
  check('matches footer averages totals and counts chases', matchSum.footer, { label: 'Avg Total', value: '124 runs', status: 'Chased: 1/3' });
  check('an empty board has no bars', matchesSummary([]).bars, []);

  // ── Scorecard & career detail ────────────────────────────────────────────
  check('1.3 overs is nine balls', oversToBalls('1.3'), 9);
  check('two whole overs is twelve balls', oversToBalls(2), 12);
  check('4.3 overs is 27 balls', oversToBalls('4.3'), 27);
  check('no overs is no balls', oversToBalls(undefined), 0);
  check('economy counts balls, not decimal overs', economyOf(22, '1.3'), '14.67');
  check('no balls bowled has no economy', economyOf(10, 0), '–');
  check('strike rate reads to one decimal', strikeRateOf(38, 14), '271.4');
  check('no balls faced has no strike rate', strikeRateOf(0, 0), '–');
  check('played date and time read by parts', formatPlayedDateTime(new Date(2026, 8, 10, 19, 5).toISOString()), 'Thu, 10 Sep 2026 · 07:05 PM');

  const scoreInn = {
    team: 'Knights Riders', score: '68/2', overs: '5.0',
    batsmen: [
      { name: 'Praveen', runs: 38, balls: 14, fours: 4, sixes: 3, isOut: false, status: 'not out', strikeRate: 271.4 },
      { name: 'Azar', runs: 20, balls: 9, fours: 3, sixes: 1, isOut: false, status: 'not out', strikeRate: 222.2 },
      { name: 'Antony', runs: 10, balls: 7, fours: 1, sixes: 0, isOut: true, status: 'c Guna b Messi Player', strikeRate: 142.9 },
    ],
    bowlers: [
      { name: 'Messi Player', overs: 1.0, runs: 11, wickets: 0, maidens: 0, economy: 11.0, dots: 1 },
      { name: 'Guna', overs: 2.0, runs: 24, wickets: 1, maidens: 0, economy: 12.0, dots: 2 },
      { name: 'Seshu', overs: 1.0, runs: 18, wickets: 0, maidens: 0, economy: 18.0, dots: 1 },
    ],
  };
  const batInn = inningsBattingSummary(scoreInn);
  check('innings batting metric reads score and overs', batInn.metric, '68/2 (5.0 ov)');
  check('innings batting tag names the top scorer', batInn.tag, '🔥 Top: Praveen 38 (14)');
  check('not-outs carry a star on their bars', batInn.bars.map(b => b.display), ['38*', '20*', '10']);
  check('innings batting footer shows run rate and boundaries', batInn.footer, { label: 'Run rate', value: '13.6/over', status: '12 boundaries' });
  check('the top scorer row is highlighted', battingRows(scoreInn).map(r => r.highlight), [true, false, false]);
  check('batting rows carry R B 4s 6s SR', battingRows(scoreInn)[0].cells, ['38', '14', '4', '3', '271.4']);
  check('a dismissal shows under the name', battingRows(scoreInn)[2].subtitle, 'c Guna b Messi Player');

  const bowlInn = inningsBowlingSummary(scoreInn, 'Royal Rockers');
  check('innings bowling title names the bowling side', bowlInn.title, 'Bowling · Royal Rockers');
  check('innings bowling metric counts wickets', bowlInn.metric, '1 Wicket Taken');
  check('innings bowling tag shows the best spell', bowlInn.tag, '🏆 Best: Guna 1/24');
  check('innings bowling footer counts dots and tight bowlers', bowlInn.footer, { label: 'Dot balls', value: '4', status: '0 bowlers at eco ≤8' });
  check('bowling rows carry O M R W Econ', bowlingRows(scoreInn)[1].cells, ['2.0', '0', '24', '1', '12.00']);
  check('the best bowler row is highlighted', bowlingRows(scoreInn).map(r => r.highlight), [false, true, false]);

  const emptyInn = { team: 'Royal Rockers', score: '', overs: '', batsmen: [], bowlers: [] };
  check('an unrecorded innings has no bars or tag', [inningsBattingSummary(emptyInn).bars, inningsBattingSummary(emptyInn).tag], [[], '']);
  check('an unrecorded innings has no rows to invent', [battingRows(emptyInn), bowlingRows(emptyInn)], [[], []]);

  const logA = {
    matchId: 'm1', completedAt: new Date(2026, 8, 8, 18).toISOString(), matchTitle: 'Knights Riders vs Royal Rockers',
    teamA: 'Knights Riders', teamB: 'Royal Rockers', winner: 'Knights Riders', winMargin: 'Won by 14 runs',
    isMOTM: true, motmName: 'Praveen', matchRecord: match,
    batting: { runs: 38, balls: 14, fours: 4, sixes: 3, isOut: false, status: 'not out', strikeRate: 271.4 },
    bowling: { overs: 2, runs: 20, wickets: 1, maidens: 0, economy: 10 },
  };
  const logB = {
    ...logA, matchId: 'm2', completedAt: new Date(2026, 8, 10, 18).toISOString(), isMOTM: false,
    batting: { runs: 42, balls: 16, fours: 5, sixes: 3, isOut: true, status: 'b Guna', strikeRate: 262.5 },
  };
  const career = playerCareerSummary([logB, logA], { ...praveen, totalRuns: 80, dismissals: 1, average: 80 }, { ...azar });
  check('batting and bowling makes an all-rounder', career.role, 'All-rounder');
  check('career metric counts matches', career.metric, '2 Matches Played');
  check('career tag counts player-of-the-match awards', career.tag, '⭐ 1× Player of the Match');
  check('career footer shows the latest match', career.footer.value, '10 Sep 2026');
  check('career batting bars run oldest first with not-outs starred', career.batting?.bars.map(b => [b.label, b.display]), [['#1', '38*'], ['#2', '42']]);
  check('career bowling bars show figures', career.bowling?.bars.map(b => b.display), ['1/20', '1/20']);
  check('career tiles reuse the list card stats', career.battingTiles.length, 4);
  check('no stats means no career cards', [playerCareerSummary([], undefined, undefined).batting, playerCareerSummary([], undefined, undefined).role], [null, 'Player']);

  const log = matchLogCard(logA);
  check('a log result names the winner', log.result, { label: 'Knights Riders won by 14 runs', tone: 'good' });
  check('a log batting line stars a not-out', log.batting, { line: '38* (14b)', note: '4×4 · 3×6 · SR 271.4', status: 'not out' });
  check('a log bowling line reads figures and economy', log.bowling, { line: '1/20 (2.0 ov)', note: 'Eco 10.00 · 0 maidens' });
  check('a log without a winner reads No result', matchLogCard({ ...logA, winner: '', winMargin: '' }).result, { label: 'No result', tone: 'fair' });

  console.log(`\n   ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}
