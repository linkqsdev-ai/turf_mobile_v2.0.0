import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ScoreSheetData {
  matchId: string;
  sport: string;
  venueName: string;
  venueAddress?: string;
  contactNumber?: string;
  date: string;
  time: string;
  teamA: {
    name: string;
    captain?: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    runRate?: number;
    extras?: {
      wides?: number;
      noBalls?: number;
      byes?: number;
      legByes?: number;
      total?: number;
    };
    batsmen: {
      name: string;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      status: string;
      strikeRate?: number;
    }[];
    bowlers: {
      name: string;
      overs: number;
      maidens: number;
      runs: number;
      wickets: number;
      economy?: number;
    }[];
  };
  teamB: {
    name: string;
    captain?: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    runRate?: number;
    extras?: {
      wides?: number;
      noBalls?: number;
      byes?: number;
      legByes?: number;
      total?: number;
    };
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
  tossWinner?: string;
  tossDecision?: string;
  notes?: string;
}

export function generateScoreSheetHTML(data: ScoreSheetData): string {
  const primaryColor = '#10b981'; // Emerald/Green theme
  const primaryDark = '#065f46';
  const primaryLight = '#ecfdf5';
  const borderLight = '#e2e8f0';

  const teamABatsmenRows = (data.teamA.batsmen || []).map((b, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
    return `
      <tr style="background-color: ${bg}; border-bottom: 1px solid ${borderLight};">
        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${b.name}</td>
        <td style="padding: 10px 14px; color: #64748b; font-size: 11px;">${b.status || 'not out'}</td>
        <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #047857; font-size: 13px;">${b.runs}</td>
        <td style="padding: 10px 14px; text-align: center; color: #334155; font-weight: 600;">${b.balls}</td>
        <td style="padding: 10px 14px; text-align: center; color: #334155;">${b.fours}</td>
        <td style="padding: 10px 14px; text-align: center; color: #334155;">${b.sixes}</td>
        <td style="padding: 10px 14px; text-align: right; color: #0f172a; font-weight: 700;">${sr}</td>
      </tr>
    `;
  }).join('');

  const teamABowlerRows = (data.teamA.bowlers || []).map((bw, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const econ = bw.overs > 0 ? (bw.runs / bw.overs).toFixed(2) : '0.00';
    return `
      <tr style="background-color: ${bg}; border-bottom: 1px solid ${borderLight};">
        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${bw.name}</td>
        <td style="padding: 10px 14px; text-align: center; color: #334155; font-weight: 600;">${bw.overs.toFixed(1)}</td>
        <td style="padding: 10px 14px; text-align: center; color: #334155;">${bw.maidens}</td>
        <td style="padding: 10px 14px; text-align: center; color: #dc2626; font-weight: 700;">${bw.runs}</td>
        <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #047857; font-size: 13px;">${bw.wickets}</td>
        <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #0f172a;">${econ}</td>
      </tr>
    `;
  }).join('');

  const teamARunRate = data.teamA.runRate
    ? data.teamA.runRate.toFixed(2)
    : (data.teamA.score / (data.teamA.overs + (data.teamA.balls || 0) / 6 || 1)).toFixed(2);

  const teamBRunRate = data.teamB.runRate
    ? data.teamB.runRate.toFixed(2)
    : (data.teamB.score / (data.teamB.overs + (data.teamB.balls || 0) / 6 || 1)).toFixed(2);

  // Extras calculation
  const totalWides = data.extrasSummary?.wides ?? (data.teamA.extras?.wides || 0);
  const totalNoBalls = data.extrasSummary?.noBalls ?? (data.teamA.extras?.noBalls || 0);
  const totalByes = data.extrasSummary?.byes ?? (data.teamA.extras?.byes || 0);
  const totalLegByes = data.extrasSummary?.legByes ?? (data.teamA.extras?.legByes || 0);
  const totalExtras = data.extrasSummary?.total ?? (totalWides + totalNoBalls + totalByes + totalLegByes);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Official Match Score Sheet - ${data.matchId}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        body { background-color: #ffffff; color: #0f172a; padding: 28px 32px; font-size: 12px; line-height: 1.4; }
        
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2.5px solid ${primaryColor}; }
        .match-title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .match-meta { font-size: 11.5px; color: #64748b; margin-top: 3px; font-weight: 600; }
        .match-id-badge { background-color: ${primaryLight}; border: 1px solid #a7f3d0; padding: 5px 12px; border-radius: 6px; font-weight: 700; color: ${primaryDark}; font-size: 11px; }

        /* 1. SCOREBOARD CARD */
        .scoreboard-container { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
        .score-card { background-color: ${primaryLight}; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 14px 18px; }
        .score-card.opponent { background-color: #f8fafc; border-color: #e2e8f0; }
        .team-title { font-size: 15px; font-weight: 800; color: ${primaryDark}; margin-bottom: 6px; }
        .score-card.opponent .team-title { color: #1e293b; }
        .big-score { font-size: 24px; font-weight: 900; color: #047857; }
        .score-card.opponent .big-score { color: #3b82f6; }
        .overs-text { font-size: 13px; font-weight: 600; color: #475569; }
        .run-rate { font-size: 11.5px; color: #475569; font-weight: 600; margin-top: 4px; }

        /* 2. SECTION TITLES & TABLES */
        .section-title { font-size: 12.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 18px 0 8px 0; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid ${borderLight}; font-size: 11.5px; margin-bottom: 6px; }
        th { background-color: #047857; color: #ffffff; padding: 10px 14px; font-weight: 700; text-align: left; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }

        /* 3. EXTRAS & WICKETS SUMMARY */
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; margin-bottom: 20px; }
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
        .summary-box-title { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; }
        .summary-row { display: flex; justify-content: space-between; font-size: 11px; color: #334155; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; }
        .summary-row.total-row { border-bottom: none; font-weight: 800; font-size: 12px; color: #047857; padding-top: 6px; }

        .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; font-weight: 600; }
      </style>
    </head>
    <body>
      <!-- Top Scoreboard Header -->
      <div class="header">
        <div>
          <div class="match-title">${data.teamA.name} vs ${data.teamB.name}</div>
          <div class="match-meta">
            ${data.venueName || 'Turf Arena'} • ${data.date} • ${data.sport || 'Cricket Match'}
          </div>
        </div>
        <div class="match-id-badge">
          Match ID: ${data.matchId}
        </div>
      </div>

      <!-- 1. SCOREBOARD -->
      <div class="scoreboard-container">
        <div class="score-card">
          <div class="team-title">${data.teamA.name}</div>
          <div>
            <span class="big-score">${data.teamA.score}/${data.teamA.wickets}</span>
            <span class="overs-text">(${data.teamA.overs}.${data.teamA.balls} Ov)</span>
          </div>
          <div class="run-rate">Run Rate: ${teamARunRate} RPO</div>
        </div>

        <div class="score-card opponent">
          <div class="team-title">${data.teamB.name}</div>
          <div>
            <span class="big-score">${data.teamB.score}/${data.teamB.wickets}</span>
            <span class="overs-text">(${data.teamB.overs}.${data.teamB.balls} Ov)</span>
          </div>
          <div class="run-rate">Run Rate: ${teamBRunRate} RPO</div>
        </div>
      </div>

      <!-- 2. BATSMEN RUNS & STATS -->
      <div class="section-title">${data.teamA.name} — Batting Performance</div>
      <table>
        <thead>
          <tr>
            <th>Batsman</th>
            <th>Dismissal</th>
            <th style="text-align: center;">Runs</th>
            <th style="text-align: center;">Balls</th>
            <th style="text-align: center;">4s</th>
            <th style="text-align: center;">6s</th>
            <th style="text-align: right;">Strike Rate</th>
          </tr>
        </thead>
        <tbody>
          ${teamABatsmenRows || `
            <tr>
              <td colspan="7" style="padding: 12px; text-align: center; color: #94a3b8;">No batting data recorded</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- 3. BOWLERS RUNS & WICKETS -->
      ${data.teamA.bowlers && data.teamA.bowlers.length > 0 ? `
        <div class="section-title">Bowling Performance</div>
        <table>
          <thead>
            <tr>
              <th>Bowler Name</th>
              <th style="text-align: center;">Overs</th>
              <th style="text-align: center;">Maidens</th>
              <th style="text-align: center;">Runs</th>
              <th style="text-align: center;">Wickets</th>
              <th style="text-align: right;">Economy</th>
            </tr>
          </thead>
          <tbody>
            ${teamABowlerRows}
          </tbody>
        </table>
      ` : ''}

      <!-- 4. EXTRAS & WICKETS SUMMARY -->
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-box-title">Extras Breakdown</div>
          <div class="summary-row">
            <span>Wides (WD)</span>
            <span>${totalWides}</span>
          </div>
          <div class="summary-row">
            <span>No Balls (NB)</span>
            <span>${totalNoBalls}</span>
          </div>
          <div class="summary-row">
            <span>Byes (B) / Leg Byes (LB)</span>
            <span>${totalByes + totalLegByes}</span>
          </div>
          <div class="summary-row total-row">
            <span>Total Extras</span>
            <span>${totalExtras}</span>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-box-title">Wickets & Match Totals</div>
          <div class="summary-row">
            <span>${data.teamA.name} Wickets</span>
            <span>${data.teamA.wickets} wickets</span>
          </div>
          <div class="summary-row">
            <span>${data.teamB.name} Wickets</span>
            <span>${data.teamB.wickets} wickets</span>
          </div>
          <div class="summary-row">
            <span>Total Match Runs</span>
            <span>${data.teamA.score + data.teamB.score} runs</span>
          </div>
          <div class="summary-row total-row">
            <span>Total Wickets Taken</span>
            <span>${data.teamA.wickets + data.teamB.wickets}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        Official Turf Match Score Sheet • Generated on ${data.date} ${data.time}
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
