import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronRight, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
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
  const [sortDesc, setSortDesc] = useState(false); // false: 0 → Finals, true: Finals → 0
  const [openRounds, setOpenRounds] = useState<Set<number>>(new Set());

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

  // Initialize open rounds once matches are loaded (default: all open)
  useEffect(() => {
    if (!matches.length || openRounds.size > 0) return;
    const uniqueRounds = Array.from(new Set(matches.map(m => m.round)));
    setOpenRounds(new Set(uniqueRounds));
  }, [matches]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading season schedule...</p>
      </div>
    );
  }

  let rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  if (sortDesc) rounds = rounds.reverse();

  const getRoundLabel = (roundNum: number) => {
    switch (roundNum) {
      case 26:
        return 'Finals Week 1';
      case 27:
        return 'Finals Week 2';
      case 28:
        return 'Preliminary Finals';
      case 29:
        return 'Grand Final';
      default:
        return `Round ${roundNum}`;
    }
  };

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
      {/* Controls: sort and expand/collapse */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortDesc(s => !s)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Toggle round sort order"
          >
            {sortDesc ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
            <span>Sort: {sortDesc ? 'Finals → 0' : '0 → Finals'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const all = new Set(rounds);
              setOpenRounds(all);
            }}
            className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Expand all
          </button>
          <button
            onClick={() => setOpenRounds(new Set())}
            className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Collapse all
          </button>
        </div>
      </div>
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round);
        return (
          <div key={round} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const next = new Set(openRounds);
                if (next.has(round)) next.delete(round); else next.add(round);
                setOpenRounds(next);
              }}
              className="w-full bg-blue-50 px-6 py-4 border-b flex items-center justify-between text-left"
              aria-expanded={openRounds.has(round)}
            >
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                {openRounds.has(round) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {getRoundLabel(round)}
              </h2>
              <span className="text-sm text-blue-900/70">{roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}</span>
            </button>
            {openRounds.has(round) && (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
