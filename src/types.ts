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
  season: number;
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
