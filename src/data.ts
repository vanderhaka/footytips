import { supabase } from './lib/supabase';
import { Match, Team } from './types';

// Shape of the raw Supabase join response for matches
interface RawMatchRow {
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

// Internal season cache - determined once from upcoming matches
let _currentSeason: number | null = null;

export const getCurrentSeason = async (): Promise<number> => {
  if (_currentSeason !== null) return _currentSeason;

  const now = new Date();
  const { data: upcoming } = await supabase
    .from('matches')
    .select('season')
    .gte('match_date', now.toISOString())
    .order('match_date')
    .limit(1);

  if (upcoming?.length) {
    _currentSeason = upcoming[0].season;
    return _currentSeason;
  }

  // No upcoming matches - use the most recent match's season
  const { data: latest } = await supabase
    .from('matches')
    .select('season')
    .not('match_date', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1);

  _currentSeason = latest?.[0]?.season || new Date().getFullYear();
  return _currentSeason;
};

export const getTips = async (round: number) => {
  const season = await getCurrentSeason();

  // Get match IDs for this round in the current season
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id')
    .eq('round', round)
    .eq('season', season);

  if (!matchesData?.length) return [];

  const matchIds = matchesData.map(m => m.id);

  // Then fetch tips for these matches
  const { data, error } = await supabase
    .from('tips')
    .select(`
      *,
      match:matches(
        id,
        round,
        home_team:teams!matches_home_team_fkey(name, abbreviation),
        away_team:teams!matches_away_team_fkey(name, abbreviation)
      )
    `)
    .in('match_id', matchIds);

  if (error) {
    console.error('Error fetching tips:', error);
    return [];
  }

  return data;
};

export const saveTip = async (tip: {
  tipper_id: string;
  round: number;
  match_id: number;
  team_tipped: string;
}) => {
  const { error } = await supabase
    .from('tips')
    .upsert({
      tipper_id: tip.tipper_id,
      round: tip.round,
      match_id: tip.match_id,
      team_tipped: tip.team_tipped,
    }, {
      onConflict: 'tipper_id, round, match_id'
    });

  if (error) {
    console.error('Error saving tip:', error);
    throw error;
  }
};

export const fetchTippers = async () => {
  // Use the tipper_points view which automatically calculates points
  const { data, error } = await supabase
    .from('tipper_points')
    .select('*')
    .order('total_points', { ascending: false });

  if (error) {
    console.error('Error fetching tippers:', error);
    return [];
  }

  return data.map(tipper => ({
    id: tipper.tipper_id,
    name: tipper.name,
    total_points: tipper.total_points,
    avatar_url: tipper.avatar_url,
    created_at: tipper.created_at
  }));
};

export const fetchMatches = async (): Promise<Match[]> => {
  const season = await getCurrentSeason();

  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      round,
      season,
      venue,
      match_date,
      home_score,
      away_score,
      winner,
      is_complete,
      created_at,
      home_team:home_team_id(name, abbreviation),
      away_team:away_team_id(name, abbreviation)
    `)
    .eq('season', season)
    .order('round')
    .order('match_date');

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  const rows = (data || []) as RawMatchRow[];
  return rows.map(match => ({
    ...match,
    home_team: {
      name: match.home_team?.name || '',
      abbreviation: match.home_team?.abbreviation || ''
    },
    away_team: {
      name: match.away_team?.name || '',
      abbreviation: match.away_team?.abbreviation || ''
    }
  }));
};

export const getCurrentRound = async (): Promise<number> => {
  const season = await getCurrentSeason();
  const now = new Date();

  // First try: find the next upcoming match in this season
  const { data: upcomingMatches, error } = await supabase
    .from('matches')
    .select('round')
    .eq('season', season)
    .gte('match_date', now.toISOString())
    .order('match_date')
    .limit(1);

  if (!error && upcomingMatches?.length) {
    return upcomingMatches[0].round;
  }

  // No future matches - get the most recent completed round
  const { data: latestMatch } = await supabase
    .from('matches')
    .select('round')
    .eq('season', season)
    .not('match_date', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1);

  return latestMatch?.[0]?.round || 0;
};

export const updateMatchResult = async (
  matchId: string,
  winner: string,
  homeScore: number | null = null,
  awayScore: number | null = null
) => {
  try {
    // First update the match scores if provided
    if (homeScore !== null && awayScore !== null) {
      const { error: scoreError } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore
        })
        .eq('id', matchId);

      if (scoreError) {
        console.error('Error updating match scores:', scoreError);
        throw scoreError;
      }
    }

    // Update the match result which will mark it as complete
    const { error: updateError } = await supabase
      .rpc('update_match_result', {
        p_match_id: matchId,
        winner_team: winner
      });

    if (updateError) {
      console.error('Error updating match result:', updateError);
      throw updateError;
    }

    // Update tips correctness for this match
    const { error: tipsError } = await supabase
      .rpc('update_tips_correctness', {
        p_match_id: matchId
      });

    if (tipsError) {
      console.error('Error updating tips correctness:', tipsError);
      throw tipsError;
    }

    // Fetch the updated match with all its relations
    const { data: refreshedMatch, error: refreshError } = await supabase
      .from('matches')
      .select(`
        id,
        round,
        season,
        venue,
        match_date,
        home_score,
        away_score,
        winner,
        is_complete,
        created_at,
        home_team:home_team_id(name, abbreviation),
        away_team:away_team_id(name, abbreviation)
      `)
      .eq('id', matchId)
      .single();

    if (refreshError) {
      console.error('Error fetching updated match:', refreshError);
      throw refreshError;
    }

    return refreshedMatch;
  } catch (error) {
    console.error('Error in updateMatchResult:', error);
    throw error;
  }
};

export const fetchRoundScores = async () => {
  const season = await getCurrentSeason();

  // Get match IDs for the current season
  const { data: seasonMatches } = await supabase
    .from('matches')
    .select('id')
    .eq('season', season);

  if (!seasonMatches?.length) return [];
  const matchIds = seasonMatches.map(m => m.id);

  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .in('match_id', matchIds)
    .order('round');

  if (error) {
    console.error('Error fetching round scores:', error);
    return [];
  }

  return data || [];
};
