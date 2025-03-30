export interface FamilyMember {
  id: string;
  name: string;
  total_points: number;
  avatar_url?: string;
  created_at?: string;
}

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