import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface BatsmanScoreData {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status?: string;
  strikeRate?: number | string;
}

export interface BowlerScoreData {
  name: string;
  overs: number | string;
  maidens: number;
  runs: number;
  wickets: number;
  economy?: number | string;
}

export interface ExtrasData {
  wides?: number;
  noBalls?: number;
  byes?: number;
  legByes?: number;
  total?: number;
}

export interface InningsScoreData {
  teamName: string;
  bowlingTeamName?: string;
  captain?: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number;
  runRate?: number;
  extras?: ExtrasData;
  batsmen?: BatsmanScoreData[];
  bowlers?: BowlerScoreData[];
}

export interface ScoreSheetData {
  matchId: string;
  sport: string;
  venueName: string;
  venueAddress?: string;
  contactNumber?: string;
  date: string;
  time: string;
  // Innings structured data
  innings1?: InningsScoreData;
  innings2?: InningsScoreData;
  // Backward compatibility with legacy teamA / teamB structure
  teamA?: {
    name: string;
    captain?: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    runRate?: number;
    extras?: ExtrasData;
    batsmen?: BatsmanScoreData[];
    bowlers?: BowlerScoreData[];
  };
  teamB?: {
    name: string;
    captain?: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    runRate?: number;
    extras?: ExtrasData;
    batsmen?: BatsmanScoreData[];
    bowlers?: BowlerScoreData[];
  };
  extrasSummary?: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  winner?: string;
  winMargin?: string;
  mvpPlayer?: string;
  mvpPerformance?: string;
  motmName?: string;
  motmStat?: string;
  tossWinner?: string;
  tossDecision?: string;
  target?: number;
  notes?: string;
}

function renderBatsmenTable(batsmen: BatsmanScoreData[] | undefined, borderLight: string) {
  if (!batsmen || batsmen.length === 0) {
    return `
      <tr>
        <td colspan="7" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">
          No batting entries recorded
        </td>
      </tr>
    `;
  }

  return batsmen.map((b, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const sr = b.strikeRate !== undefined
      ? b.strikeRate
      : (b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0');
    return `
      <tr style="background-color: ${bg}; border-bottom: 1px solid ${borderLight};">
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a; font-size: 11.5px;">${b.name || 'Batsman'}</td>
        <td style="padding: 9px 12px; color: #64748b; font-size: 11px;">${b.status || 'not out'}</td>
        <td style="padding: 9px 12px; text-align: center; font-weight: 800; color: #047857; font-size: 12.5px;">${b.runs ?? 0}</td>
        <td style="padding: 9px 12px; text-align: center; color: #334155; font-weight: 600;">${b.balls ?? 0}</td>
        <td style="padding: 9px 12px; text-align: center; color: #334155;">${b.fours ?? 0}</td>
        <td style="padding: 9px 12px; text-align: center; color: #334155;">${b.sixes ?? 0}</td>
        <td style="padding: 9px 12px; text-align: right; color: #0f172a; font-weight: 700;">${sr}</td>
      </tr>
    `;
  }).join('');
}

function renderBowlersTable(bowlers: BowlerScoreData[] | undefined, borderLight: string) {
  if (!bowlers || bowlers.length === 0) {
    return `
      <tr>
        <td colspan="6" style="padding: 12px; text-align: center; color: #94a3b8; font-style: italic;">
          No bowling entries recorded
        </td>
      </tr>
    `;
  }

  return bowlers.map((bw, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const oversNum = typeof bw.overs === 'number' ? bw.overs : parseFloat(bw.overs || '0');
    const econ = bw.economy !== undefined
      ? bw.economy
      : (oversNum > 0 ? (bw.runs / oversNum).toFixed(2) : '0.00');
    const oversDisplay = typeof bw.overs === 'string' ? bw.overs : oversNum.toFixed(1);

    return `
      <tr style="background-color: ${bg}; border-bottom: 1px solid ${borderLight};">
        <td style="padding: 9px 12px; font-weight: 700; color: #0f172a; font-size: 11.5px;">${bw.name || 'Bowler'}</td>
        <td style="padding: 9px 12px; text-align: center; color: #334155; font-weight: 600;">${oversDisplay}</td>
        <td style="padding: 9px 12px; text-align: center; color: #334155;">${bw.maidens ?? 0}</td>
        <td style="padding: 9px 12px; text-align: center; color: #dc2626; font-weight: 700;">${bw.runs ?? 0}</td>
        <td style="padding: 9px 12px; text-align: center; font-weight: 800; color: #047857; font-size: 12.5px;">${bw.wickets ?? 0}</td>
        <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #0f172a;">${econ}</td>
      </tr>
    `;
  }).join('');
}

export function generateScoreSheetHTML(data: ScoreSheetData): string {
  const primaryColor = '#10b981'; // Emerald/Green theme
  const primaryDark = '#065f46';
  const primaryLight = '#ecfdf5';
  const borderLight = '#e2e8f0';

  // Extract / Normalize Innings 1
  const inn1: InningsScoreData = data.innings1 || {
    teamName: data.teamA?.name || 'Team 1',
    bowlingTeamName: data.teamB?.name || 'Team 2',
    captain: data.teamA?.captain,
    score: data.teamA?.score ?? 0,
    wickets: data.teamA?.wickets ?? 0,
    overs: data.teamA?.overs ?? 0,
    balls: data.teamA?.balls ?? 0,
    runRate: data.teamA?.runRate,
    extras: data.teamA?.extras,
    batsmen: data.teamA?.batsmen || [],
    bowlers: data.teamA?.bowlers || [],
  };

  // Extract / Normalize Innings 2
  const hasInnings2 = !!(data.innings2 || (data.teamB && (data.teamB.score > 0 || data.teamB.overs > 0 || (data.teamB.batsmen && data.teamB.batsmen.length > 0))));
  const inn2: InningsScoreData | null = hasInnings2 ? (data.innings2 || {
    teamName: data.teamB?.name || 'Team 2',
    bowlingTeamName: data.teamA?.name || 'Team 1',
    captain: data.teamB?.captain,
    score: data.teamB?.score ?? 0,
    wickets: data.teamB?.wickets ?? 0,
    overs: data.teamB?.overs ?? 0,
    balls: data.teamB?.balls ?? 0,
    runRate: data.teamB?.runRate,
    extras: data.teamB?.extras,
    batsmen: data.teamB?.batsmen || [],
    bowlers: data.teamB?.bowlers || [],
  }) : null;

  // Run Rates
  const inn1OversTotal = inn1.overs + (inn1.balls || 0) / 6;
  const inn1RunRate = inn1.runRate
    ? inn1.runRate.toFixed(2)
    : (inn1OversTotal > 0 ? (inn1.score / inn1OversTotal).toFixed(2) : '0.00');

  const inn2OversTotal = inn2 ? inn2.overs + (inn2.balls || 0) / 6 : 0;
  const inn2RunRate = inn2
    ? (inn2.runRate ? inn2.runRate.toFixed(2) : (inn2OversTotal > 0 ? (inn2.score / inn2OversTotal).toFixed(2) : '0.00'))
    : '0.00';

  // Innings 1 Extras
  const inn1Wides = inn1.extras?.wides ?? 0;
  const inn1NoBalls = inn1.extras?.noBalls ?? 0;
  const inn1Byes = (inn1.extras?.byes ?? 0) + (inn1.extras?.legByes ?? 0);
  const inn1TotalExtras = inn1.extras?.total ?? (inn1Wides + inn1NoBalls + inn1Byes);

  // Innings 2 Extras
  const inn2Wides = inn2?.extras?.wides ?? 0;
  const inn2NoBalls = inn2?.extras?.noBalls ?? 0;
  const inn2Byes = ((inn2?.extras?.byes ?? 0) + (inn2?.extras?.legByes ?? 0));
  const inn2TotalExtras = inn2?.extras?.total ?? (inn2Wides + inn2NoBalls + inn2Byes);

  const motm = data.motmName || data.mvpPlayer;
  const motmStat = data.motmStat || data.mvpPerformance;
  const winner = data.winner;
  const winMargin = data.winMargin;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Match Score Sheet - ${data.matchId}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #ffffff; color: #0f172a; padding: 24px 30px; font-size: 11.5px; line-height: 1.4; }
        
        /* HEADER */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2.5px solid ${primaryColor}; }
        .match-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .match-meta { font-size: 11.5px; color: #64748b; margin-top: 3px; font-weight: 600; }
        .match-badge-group { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .match-id-badge { background-color: ${primaryLight}; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; color: ${primaryDark}; font-size: 10.5px; }
        .toss-info { font-size: 10.5px; color: #047857; font-weight: 600; }

        /* WINNER / MVP BANNER */
        .highlight-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border: 1.5px solid #a7f3d0;
          border-radius: 10px;
          padding: 12px 18px;
          margin-bottom: 16px;
        }
        .winner-title { font-size: 15px; font-weight: 800; color: #065f46; display: flex; align-items: center; gap: 6px; }
        .winner-sub { font-size: 11px; color: #047857; font-weight: 600; margin-top: 2px; }
        .motm-badge {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 12px;
          text-align: right;
        }
        .motm-label { font-size: 9.5px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; }
        .motm-name { font-size: 12px; font-weight: 800; color: #0f172a; }
        .motm-stat { font-size: 10px; color: #64748b; font-weight: 600; }

        /* SCOREBOARD CARDS */
        .scoreboard-container { display: grid; grid-template-columns: 1fr ${inn2 ? '1fr' : ''}; gap: 14px; margin-bottom: 20px; }
        .score-card { background-color: ${primaryLight}; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 12px 16px; }
        .score-card.second-inn { background-color: #eff6ff; border-color: #bfdbfe; }
        .team-title { font-size: 14px; font-weight: 800; color: ${primaryDark}; margin-bottom: 4px; }
        .score-card.second-inn .team-title { color: #1e40af; }
        .big-score { font-size: 22px; font-weight: 900; color: #047857; }
        .score-card.second-inn .big-score { color: #2563eb; }
        .overs-text { font-size: 12px; font-weight: 600; color: #475569; }
        .run-rate { font-size: 11px; color: #475569; font-weight: 600; margin-top: 3px; }

        /* INNINGS SECTION */
        .innings-block { margin-bottom: 22px; border: 1px solid ${borderLight}; border-radius: 10px; overflow: hidden; }
        .innings-header {
          background-color: #f1f5f9;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1.5px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .innings-header.inn1 { background-color: #e6fcf5; color: #065f46; border-color: #a7f3d0; }
        .innings-header.inn2 { background-color: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
        
        .section-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #334155; padding: 10px 14px 6px 14px; letter-spacing: 0.4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 4px; }
        th { background-color: #047857; color: #ffffff; padding: 8px 12px; font-weight: 700; text-align: left; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.4px; }
        .th-bowl { background-color: #334155; }

        /* EXTRAS & MINI SUMMARY */
        .mini-summary-bar {
          display: flex;
          justify-content: space-between;
          background-color: #f8fafc;
          border-top: 1px solid ${borderLight};
          padding: 8px 14px;
          font-size: 10.5px;
          color: #475569;
          font-weight: 600;
        }
        .mini-summary-bar span strong { color: #0f172a; }

        /* OVERALL MATCH TOTALS */
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 12px; margin-bottom: 16px; }
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
        .summary-box-title { font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #334155; padding: 2px 0; border-bottom: 1px dashed #e2e8f0; }
        .summary-row.total-row { border-bottom: none; font-weight: 800; font-size: 11.5px; color: #047857; padding-top: 4px; }

        .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #94a3b8; font-weight: 600; }
      </style>
    </head>
    <body>
      <!-- Top Scoreboard Header -->
      <div class="header">
        <div>
          <div class="match-title">${inn1.teamName} vs ${inn2 ? inn2.teamName : (inn1.bowlingTeamName || 'Opponent')}</div>
          <div class="match-meta">
            ${data.venueName || 'Turf Arena'}${data.venueAddress ? ` • ${data.venueAddress}` : ''} • ${data.date} ${data.time} • ${data.sport || 'Cricket Match'}
          </div>
        </div>
        <div class="match-badge-group">
          <div class="match-id-badge">Match ID: ${data.matchId}</div>
          ${data.tossWinner ? `<div class="toss-info">🪙 ${data.tossWinner} elected to ${data.tossDecision || 'bat'} first</div>` : ''}
        </div>
      </div>

      <!-- WINNER / MVP HIGHLIGHT BANNER -->
      ${(winner || motm) ? `
        <div class="highlight-banner">
          <div>
            ${winner ? `
              <div class="winner-title">🏆 ${winner} ${winner.toLowerCase().includes('won') || winner.toLowerCase().includes('tied') ? '' : 'Won'}</div>
              ${winMargin ? `<div class="winner-sub">${winMargin}</div>` : ''}
            ` : `
              <div class="winner-title">🏏 Official Match Scorecard</div>
            `}
          </div>
          ${motm ? `
            <div class="motm-badge">
              <div class="motm-label">⭐ Player of the Match</div>
              <div class="motm-name">${motm}</div>
              ${motmStat ? `<div class="motm-stat">${motmStat}</div>` : ''}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- 1. SCOREBOARD SUMMARY CARDS -->
      <div class="scoreboard-container">
        <!-- 1st Innings Card -->
        <div class="score-card">
          <div class="team-title">1st Innings: ${inn1.teamName}</div>
          <div>
            <span class="big-score">${inn1.score}/${inn1.wickets}</span>
            <span class="overs-text">(${inn1.overs}.${inn1.balls} Ov)</span>
          </div>
          <div class="run-rate">Run Rate: ${inn1RunRate} RPO</div>
        </div>

        <!-- 2nd Innings Card (if played) -->
        ${inn2 ? `
          <div class="score-card second-inn">
            <div class="team-title">2nd Innings: ${inn2.teamName}</div>
            <div>
              <span class="big-score">${inn2.score}/${inn2.wickets}</span>
              <span class="overs-text">(${inn2.overs}.${inn2.balls} Ov)</span>
            </div>
            <div class="run-rate">Run Rate: ${inn2RunRate} RPO ${data.target ? `• Target: ${data.target}` : ''}</div>
          </div>
        ` : ''}
      </div>

      <!-- 2. 1ST INNINGS DETAILED BREAKDOWN -->
      <div class="innings-block">
        <div class="innings-header inn1">
          <span>1st Innings Scorecard — ${inn1.teamName}</span>
          <span>${inn1.score}/${inn1.wickets} (${inn1.overs}.${inn1.balls} Ov)</span>
        </div>

        <div class="section-title">🏏 Batting Performance (${inn1.teamName})</div>
        <table>
          <thead>
            <tr>
              <th>Batsman</th>
              <th>Dismissal / Status</th>
              <th style="text-align: center;">Runs</th>
              <th style="text-align: center;">Balls</th>
              <th style="text-align: center;">4s</th>
              <th style="text-align: center;">6s</th>
              <th style="text-align: right;">Strike Rate</th>
            </tr>
          </thead>
          <tbody>
            ${renderBatsmenTable(inn1.batsmen, borderLight)}
          </tbody>
        </table>

        <div class="section-title">🎯 Bowling Performance (${inn1.bowlingTeamName || (inn2 ? inn2.teamName : 'Bowling Team')})</div>
        <table>
          <thead>
            <tr>
              <th class="th-bowl">Bowler Name</th>
              <th class="th-bowl" style="text-align: center;">Overs</th>
              <th class="th-bowl" style="text-align: center;">Maidens</th>
              <th class="th-bowl" style="text-align: center;">Runs</th>
              <th class="th-bowl" style="text-align: center;">Wickets</th>
              <th class="th-bowl" style="text-align: right;">Economy</th>
            </tr>
          </thead>
          <tbody>
            ${renderBowlersTable(inn1.bowlers, borderLight)}
          </tbody>
        </table>

        <div class="mini-summary-bar">
          <span>Extras: <strong>${inn1TotalExtras}</strong> (WD: ${inn1Wides}, NB: ${inn1NoBalls}, B/LB: ${inn1Byes})</span>
          <span>Wickets Fallen: <strong>${inn1.wickets}</strong></span>
          <span>Total: <strong>${inn1.score}/${inn1.wickets}</strong> (${inn1.overs}.${inn1.balls} ov)</span>
        </div>
      </div>

      <!-- 3. 2ND INNINGS DETAILED BREAKDOWN (IF PLAYED) -->
      ${inn2 ? `
        <div class="innings-block">
          <div class="innings-header inn2">
            <span>2nd Innings Scorecard — ${inn2.teamName}</span>
            <span>${inn2.score}/${inn2.wickets} (${inn2.overs}.${inn2.balls} Ov)</span>
          </div>

          <div class="section-title">🏏 Batting Performance (${inn2.teamName})</div>
          <table>
            <thead>
              <tr>
                <th>Batsman</th>
                <th>Dismissal / Status</th>
                <th style="text-align: center;">Runs</th>
                <th style="text-align: center;">Balls</th>
                <th style="text-align: center;">4s</th>
                <th style="text-align: center;">6s</th>
                <th style="text-align: right;">Strike Rate</th>
              </tr>
            </thead>
            <tbody>
              ${renderBatsmenTable(inn2.batsmen, borderLight)}
            </tbody>
          </table>

          <div class="section-title">🎯 Bowling Performance (${inn2.bowlingTeamName || inn1.teamName})</div>
          <table>
            <thead>
              <tr>
                <th class="th-bowl">Bowler Name</th>
                <th class="th-bowl" style="text-align: center;">Overs</th>
                <th class="th-bowl" style="text-align: center;">Maidens</th>
                <th class="th-bowl" style="text-align: center;">Runs</th>
                <th class="th-bowl" style="text-align: center;">Wickets</th>
                <th class="th-bowl" style="text-align: right;">Economy</th>
              </tr>
            </thead>
            <tbody>
              ${renderBowlersTable(inn2.bowlers, borderLight)}
            </tbody>
          </table>

          <div class="mini-summary-bar">
            <span>Extras: <strong>${inn2TotalExtras}</strong> (WD: ${inn2Wides}, NB: ${inn2NoBalls}, B/LB: ${inn2Byes})</span>
            <span>Wickets Fallen: <strong>${inn2.wickets}</strong></span>
            <span>Total: <strong>${inn2.score}/${inn2.wickets}</strong> (${inn2.overs}.${inn2.balls} ov)</span>
          </div>
        </div>
      ` : ''}

      <!-- 4. OVERALL MATCH SUMMARY -->
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-box-title">Extras Breakdown (All Innings)</div>
          <div class="summary-row">
            <span>Total Wides (WD)</span>
            <span>${inn1Wides + inn2Wides}</span>
          </div>
          <div class="summary-row">
            <span>Total No Balls (NB)</span>
            <span>${inn1NoBalls + inn2NoBalls}</span>
          </div>
          <div class="summary-row">
            <span>Total Byes / Leg Byes</span>
            <span>${inn1Byes + inn2Byes}</span>
          </div>
          <div class="summary-row total-row">
            <span>Total Match Extras</span>
            <span>${inn1TotalExtras + inn2TotalExtras}</span>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-box-title">Match Totals</div>
          <div class="summary-row">
            <span>${inn1.teamName} Total</span>
            <span>${inn1.score}/${inn1.wickets} (${inn1.overs}.${inn1.balls} ov)</span>
          </div>
          ${inn2 ? `
            <div class="summary-row">
              <span>${inn2.teamName} Total</span>
              <span>${inn2.score}/${inn2.wickets} (${inn2.overs}.${inn2.balls} ov)</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span>Total Match Runs</span>
            <span>${inn1.score + (inn2 ? inn2.score : 0)} runs</span>
          </div>
          <div class="summary-row total-row">
            <span>Total Wickets Taken</span>
            <span>${inn1.wickets + (inn2 ? inn2.wickets : 0)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        Official Turf Match Score Sheet • Generated on ${data.date} ${data.time} • Turf Arena Cricket Scoring Engine
      </div>
    </body>
    </html>
  `;
}

export async function exportScoreSheetPDF(data: ScoreSheetData): Promise<string> {
  const html = generateScoreSheetHTML(data);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
    return 'web-printed';
  }

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Match Score Sheet - ${data.matchId}`,
    });
  }

  return uri;
}
