import { Match, DatabaseTip, Team } from '../types';

/**
 * Check if a team matches by name or abbreviation
 */
export function isTeamMatch(team: Team, value: string): boolean {
  return team.name === value || team.abbreviation === value;
}

/**
 * Find which team was tipped (home or away) based on the tip value
 */
export function findTippedTeam(
  tipValue: string,
  homeTeam: Team,
  awayTeam: Team
): Team | null {
  if (isTeamMatch(homeTeam, tipValue)) return homeTeam;
  if (isTeamMatch(awayTeam, tipValue)) return awayTeam;
  return null;
}

/**
 * Check if a tip is correct for a completed match
 * - Returns true for draws (all tips are correct)
 * - Returns true if tipped team matches the winner
 * - Returns false if match is incomplete or tip doesn't match winner
 */
export function isTipCorrect(tip: DatabaseTip, match: Match): boolean {
  if (!match.is_complete || !match.winner) {
    return false;
  }

  // For draws, all tips are correct
  if (match.winner === 'draw') {
    return true;
  }

  // Find the tipped team
  const tippedTeam = findTippedTeam(
    tip.team_tipped,
    match.home_team,
    match.away_team
  );

  if (!tippedTeam) {
    return false;
  }

  // Check if the tipped team is the winner
  return isTeamMatch(tippedTeam, match.winner);
}

/**
 * Get the abbreviation for a tipped team
 */
export function getTipAbbreviation(
  tipValue: string,
  homeTeam: Team,
  awayTeam: Team
): string | null {
  const team = findTippedTeam(tipValue, homeTeam, awayTeam);
  return team?.abbreviation || null;
}

/**
 * Check if a team is the winner of a match
 */
export function isTeamWinner(match: Match, team: Team): boolean {
  if (!match.winner || match.winner === 'draw') {
    return false;
  }
  return isTeamMatch(team, match.winner);
}
