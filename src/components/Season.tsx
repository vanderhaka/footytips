import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { fetchMatches, getTips, fetchTippers } from '../data';
import { FamilyMember } from '../types';

interface Match {
  id: string;
  round: number;
  home_team: {
    name: string;
    abbreviation: string;
  };
  away_team: {
    name: string;
    abbreviation: string;
  };
  venue: string;
  match_date: string | null;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  is_complete: boolean;
}

export function Season() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [roundTips, setRoundTips] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, tippersData] = await Promise.all([
          fetchMatches(),
          fetchTippers()
        ]);
        setMatches(matchesData);
        setTippers(tippersData);

        // Get unique rounds
        const rounds = Array.from(new Set(matchesData.map(m => m.round)));
        
        // Load tips for all rounds
        const tipsPromises = rounds.map(round => getTips(round));
        const allTips = await Promise.all(tipsPromises);
        
        // Create tips map by round
        const tipsMap = rounds.reduce((acc, round, index) => {
          acc[round] = allTips[index] || [];
          return acc;
        }, {} as Record<number, any[]>);
        
        setRoundTips(tipsMap);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading season schedule...</p>
      </div>
    );
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBC';
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getTippersByTeam = (matchId: string, team: { name: string, abbreviation: string }, round: number) => {
    const matchTips = roundTips[round] || [];
    const tipperIds = matchTips
      .filter(tip => 
        tip.match_id === matchId && 
        (tip.team_tipped === team.name || tip.team_tipped === team.abbreviation)
      )
      .map(tip => tip.tipper_id);
    
    return tippers
      .filter(tipper => tipperIds.includes(tipper.id))
      .map(tipper => tipper.name)
      .join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round);
        return (
          <div key={round} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-blue-900">Round {round}</h2>
            </div>
            <div className="divide-y">
              {roundMatches.map(match => (
                <div key={match.id} className="px-6 py-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-lg font-semibold text-gray-900">
                      {match.home_team.name}
                    </div>
                    <div className="text-sm text-gray-500 mx-2">vs</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {match.away_team.name}
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-gray-600 text-sm">
                    {match.match_date ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(match.match_date)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle size={16} />
                        <span>Date TBC</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={16} />
                      <span>{match.venue}</span>
                    </div>
                  </div>
                  
                  {match.is_complete && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-start">
                        <div className="text-left flex items-center gap-2">
                          {match.winner && (match.winner === match.home_team.name || match.winner === match.home_team.abbreviation) ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                          {getTippersByTeam(match.id, match.home_team, round) && (
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              match.winner && (match.winner === match.home_team.name || match.winner === match.home_team.abbreviation)
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getTippersByTeam(match.id, match.home_team, round)}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-2">
                          {getTippersByTeam(match.id, match.away_team, round) && (
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              match.winner && (match.winner === match.away_team.name || match.winner === match.away_team.abbreviation)
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {getTippersByTeam(match.id, match.away_team, round)}
                            </div>
                          )}
                          {match.winner && (match.winner === match.away_team.name || match.winner === match.away_team.abbreviation) ? (
                            <CheckCircle className="text-green-500" size={16} />
                          ) : (
                            <XCircle className="text-red-500" size={16} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}