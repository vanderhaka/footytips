import { supabase } from './lib/supabase';

export { supabase };

type Team = {
  name: string;
  abbreviation: string;
};

type Match = {
  id: string;
  round: number;
  venue: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  is_complete: boolean;
  created_at: string;
  home_team: Team;
  away_team: Team;
};

export const getTips = async (round: number) => {
  // Get match IDs for this round
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id')
    .eq('round', round);
    
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
  match_id: string;
  team_tipped: string;
}) => {
  const { error } = await supabase
    .from('tips')
    .upsert({
      tipper_id: tip.tipper_id,
      round: tip.round,
      match_id: tip.match_id,
      team_tipped: tip.team_tipped,
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
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      round,
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
    .order('round')
    .order('match_date');
  
  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  
  return (data || []).map(match => {
    const homeTeam = match.home_team as unknown as Team;
    const awayTeam = match.away_team as unknown as Team;
    
    return {
      ...match,
      home_team: {
        name: homeTeam?.name || '',
        abbreviation: homeTeam?.abbreviation || ''
      },
      away_team: {
        name: awayTeam?.name || '',
        abbreviation: awayTeam?.abbreviation || ''
      }
    };
  });
};

export const getCurrentRound = async (): Promise<number> => {
  const now = new Date();
  // Get matches for the next 7 days
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const { data: upcomingMatches, error } = await supabase
    .from('matches')
    .select('round')
    .gte('match_date', now.toISOString())
    .lte('match_date', nextWeek.toISOString())
    .order('match_date')
    .limit(1);

  if (error || !upcomingMatches?.length) {
    // If no upcoming matches found, get the latest round
    const { data: latestMatch } = await supabase
      .from('matches')
      .select('round')
      .order('round', { ascending: false })
      .limit(1);

    return latestMatch?.[0]?.round || 1;
  }

  return upcomingMatches[0].round;
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

// Points are now automatically calculated by the tipper_points view
export const calculatePoints = async () => {
  // This is now a no-op since points are calculated automatically
  // Keep the function to maintain API compatibility
  return {};
};

export const fetchRoundScores = async () => {
  const { data, error } = await supabase
    .from('tips')
    .select('*')
    .order('round');

  if (error) {
    console.error('Error fetching round scores:', error);
    return [];
  }
  
  return data || []; 
};