/**
 * Single source of truth for every stat description shown in tooltips.
 *
 * If you add a new stat or change how something is calculated, update it
 * HERE, not in the page.
 */

export const STAT_DEFS = {
  // ----- Records & basic counting -----
  record:
    "Wins-Losses-Ties from regular-season and playoff games. " +
    "Byes and forfeits are excluded.",
  wins: "Total wins from regular-season and playoff games.",
  losses: "Total losses from regular-season and playoff games.",
  winPct:
    "Win percentage = (Wins + 0.5 × Ties) ÷ Games.",
  seasons: "Number of full seasons the owner has played in the league.",
  games: "Regular-season + playoff games. Excludes byes.",

  // ----- Points -----
  pf: "Points For — total points the team's lineup scored.",
  pa: "Points Against — total points the team's opponents scored.",
  pfPerGame: "Average points scored per game. Total PF ÷ games played.",
  paPerGame: "Average points allowed per game. Total PA ÷ games played.",
  pointDiff:
    "Points For minus Points Against. Positive means you outscored your " +
    "opposition cumulatively.",

  // ----- Finishes & trophies -----
  finish: "Final standing for the season after the playoff bracket finishes.",
  avgFinish:
    "Average final standing across every season the owner has played. " +
    "Lower is better — 1.0 would mean champion every year.",
  championship: "Final standing of 1st in the playoff bracket.",
  runnerUp: "Final standing of 2nd in the playoff bracket.",
  thirdPlace: "Final standing of 3rd in the playoff bracket.",
  leagueLoser: "Finished last place in the consolation bracket.",
  regularSeasonTitle:
    "Best regular-season record (ties broken by Points For). Doesn't account " +
    "for the playoffs.",
  playoffApp:
    "Number of seasons the owner appeared in any playoff (winners' bracket) " +
    "matchup. Consolation/toilet bowl games don't count.",
  playoffRate:
    "Playoff appearances ÷ seasons played.",

  // ----- Single-week extremes -----
  highestWeek:
    "Highest single-week score by any team that season — the regular-season " +
    "or playoff explosion.",
  lowestWeek:
    "Lowest single-week score (excluding zeros, which usually mean a forfeit " +
    "or roster screw-up).",
  biggestWin:
    "Largest margin of victory the owner has ever posted. Margin = your score − opponent's score.",
  worstLoss:
    "Largest margin of defeat the owner has ever absorbed.",

  // ----- Records book -----
  highestScore:
    "Single-team, single-week highest scores. Each entry is one team's score in one week.",
  lowestScore:
    "Single-team, single-week lowest scores. Excludes 0-point forfeits.",
  biggestBlowout:
    "Largest absolute scoring margin in a single matchup.",
  closestGame:
    "Smallest absolute scoring margin in a single matchup.",
  highestCombined:
    "Combined score (home + away) — the biggest scoring fests.",
  lowestCombined:
    "Combined score (home + away) — the slogs. Excludes 0-0 byes.",
  cursedLoss:
    "Highest score in a losing effort — the most points you can score and " +
    "still lose because the other guy went off.",
  luckyWin:
    "Lowest score in a winning effort — backed into a W because the other " +
    "guy was even worse.",

  // ----- Awards page -----
  pointsLeader:
    "Highest total Points For in the regular season + playoffs. The pure " +
    "scoring champion.",
  mostScrewed:
    "Highest total Points Against — the team that consistently caught " +
    "everyone's best week.",
  mostConsistent:
    "Lowest standard deviation of weekly scores. Their week-to-week output is " +
    "the most predictable.",
  mostVolatile:
    "Highest standard deviation of weekly scores. Boom-or-bust personified.",
  biggestComeback:
    "Largest year-over-year improvement in win %.",
  stdDev:
    "Standard deviation of weekly scores — a measure of how much an owner's " +
    "weekly output bounces around. Low σ = consistent; high σ = boom/bust.",

  // ----- Streaks -----
  winStreak:
    "Longest run of consecutive wins. Spans across seasons — playoff games count.",
  loseStreak:
    "Longest run of consecutive losses, across seasons.",
  playoffStreak:
    "Most consecutive seasons making the playoffs.",
  playoffDrought:
    "Longest run of consecutive seasons missing the playoffs.",

  // ----- Luck-adjusted -----
  allPlay:
    "All-Play record — for each week, you 'play' every other team in the " +
    "league and your record is W if you outscored them, L if not. This " +
    "removes schedule luck.",
  luck:
    "Gap between your all-play record and your actual record (All-Play Win % − Actual Win %). " +
    "Negative = lucky: you won more games than your scoring earned. " +
    "Positive = unlucky: you scored well enough to win more, but didn't. " +
    "Green numbers are lucky, red are unlucky.",
  luckIndex:
    "PF Rank − Finish Rank. Positive delta = you finished better than your " +
    "scoring suggested (got the bounces); negative = you finished worse than " +
    "your scoring suggested.",
  cursedSeason:
    "Highest Points For totals among teams that missed the playoffs entirely. " +
    "Scoring monsters who got nothing for it.",
  strengthOfSchedule:
    "Average of every opponent's regular-season Points For per game. Higher " +
    "= harder schedule.",

  // ----- Head-to-head -----
  h2hRecord:
    "Wins-Losses-Ties between these two owners across every regular-season " +
    "and playoff game they've matched up.",
  h2hWinPct:
    "Win % from the row-owner's perspective vs the column-owner.",
  seriesRecord:
    "All-time series record between these two owners.",

  // ----- Misc -----
  matchupType:
    "Regular = regular-season matchup. PO = playoff (winners' bracket). " +
    "Consolation/Toilet Bowl = losers' bracket games.",
  weeklyHeatmap:
    "Each cell is one team's score in one week. Color scales from cool (low) " +
    "to warm (high). A green outline means a win that week, red means a loss.",
} as const;

export type StatDefKey = keyof typeof STAT_DEFS;
