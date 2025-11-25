export interface FamilyMember {
  id: string;
  name: string;
  total_points: number;
  avatar_url?: string;
  created_at?: string;
}

export interface Team {
  name: string;
  abbreviation: string;
}

export interface Match {
  id: string;
  round: number;
  venue: string;
  match_date: string | null;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  is_complete: boolean;
  created_at: string;
  home_team: Team;
  away_team: Team;
}

export interface DatabaseTip {
  id: number;
  tipper_id: string;
  match_id: number;
  round: number;
  team_tipped: string;
  is_correct: boolean | null;
  created_at: string;
  match?: Match;
}

// Legacy interfaces (kept for backward compatibility)
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  round: number;
  date: string;
}

export interface Tip {
  gameId: string;
  familyMemberId: string;
  selectedTeam: string;
  round: number;
}

export interface RoundTips {
  familyMemberId: string;
  tips: Tip[];
  isComplete: boolean;
}
