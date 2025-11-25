import { useState, useEffect, useCallback } from 'react';
import { MapPin, Calendar, AlertCircle, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronRight, ArrowUpAZ, ArrowDownAZ, Loader2 } from 'lucide-react';
import { fetchMatches, getTips, fetchTippers } from '../data';
import { FamilyMember, Match } from '../types';
import { getRoundLabel } from '../lib/roundLabels';
import { formatMatchDateTime } from '../lib/formatDate';

export function Season() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [roundTips, setRoundTips] = useState<Record<number, any[]>>({});
  const [loadingRounds, setLoadingRounds] = useState<Set<number>>(new Set());
  const [sortDesc, setSortDesc] = useState(false);
  const [openRounds, setOpenRounds] = useState<Set<number>>(new Set());

  // Initial load - matches and tippers only (no tips)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, tippersData] = await Promise.all([
          fetchMatches(),
          fetchTippers()
        ]);
        setMatches(matchesData);
        setTippers(tippersData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Lazy load tips when a round is expanded
  const loadTipsForRound = useCallback(async (round: number) => {
    // Skip if already loaded or currently loading
    if (roundTips[round] !== undefined || loadingRounds.has(round)) {
      return;
    }

    setLoadingRounds(prev => new Set(prev).add(round));
    try {
      const tips = await getTips(round);
      setRoundTips(prev => ({ ...prev, [round]: tips || [] }));
    } catch (error) {
      console.error(`Error loading tips for round ${round}:`, error);
      setRoundTips(prev => ({ ...prev, [round]: [] }));
    } finally {
      setLoadingRounds(prev => {
        const next = new Set(prev);
        next.delete(round);
        return next;
      });
    }
  }, [roundTips, loadingRounds]);

  // Handle round toggle - load tips on expand
  const handleRoundToggle = useCallback((round: number) => {
    const isOpening = !openRounds.has(round);

    setOpenRounds(prev => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
      } else {
        next.add(round);
      }
      return next;
    });

    // Load tips if opening and not already loaded
    if (isOpening && roundTips[round] === undefined) {
      loadTipsForRound(round);
    }
  }, [openRounds, roundTips, loadTipsForRound]);

  // Expand all - load tips for all visible rounds
  const handleExpandAll = useCallback((rounds: number[]) => {
    setOpenRounds(new Set(rounds));
    // Load tips for all rounds that aren't already loaded
    rounds.forEach(round => {
      if (roundTips[round] === undefined) {
        loadTipsForRound(round);
      }
    });
  }, [roundTips, loadTipsForRound]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading season schedule...</p>
      </div>
    );
  }

  let rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  if (sortDesc) rounds = rounds.reverse();

  const getTippersByTeam = (matchId: string, team: { name: string, abbreviation: string }, round: number) => {
    const matchTips = roundTips[round] || [];
    const matchIdStr = String(matchId);
    const tipperIds = matchTips
      .filter(tip =>
        String(tip.match_id) === matchIdStr &&
        (tip.team_tipped === team.name || tip.team_tipped === team.abbreviation)
      )
      .map(tip => tip.tipper_id);

    return tippers
      .filter(tipper => tipperIds.includes(tipper.id))
      .map(tipper => tipper.name)
      .join(', ');
  };

  const isTeamWinner = (match: Match, team: { name: string, abbreviation: string }) => {
    if (!match.winner) return false;
    if (match.winner === 'draw') return false;
    return match.winner === team.name || match.winner === team.abbreviation;
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
            onClick={() => handleExpandAll(rounds)}
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
        const isOpen = openRounds.has(round);
        const isLoadingTips = loadingRounds.has(round);
        const hasTips = roundTips[round] !== undefined;

        return (
          <div key={round} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => handleRoundToggle(round)}
              className="w-full bg-blue-50 px-6 py-4 border-b flex items-center justify-between text-left"
              aria-expanded={isOpen}
            >
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                {getRoundLabel(round)}
              </h2>
              <span className="text-sm text-blue-900/70">{roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}</span>
            </button>

            {isOpen && (
              <div className="divide-y">
                {isLoadingTips && !hasTips && (
                  <div className="px-6 py-4 flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading tips...</span>
                  </div>
                )}
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
                          <span>{formatMatchDateTime(match.match_date)}</span>
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

                    {match.is_complete && hasTips && (
                      <div className="mt-3 pt-3 border-t">
                        {match.winner === 'draw' ? (
                          <div className="flex justify-center items-center gap-2 text-blue-600">
                            <MinusCircle size={16} />
                            <span className="font-medium">Draw - All tips correct</span>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="text-left flex items-center gap-2">
                              {isTeamWinner(match, match.home_team) ? (
                                <CheckCircle className="text-green-500" size={16} />
                              ) : (
                                <XCircle className="text-red-500" size={16} />
                              )}
                              {getTippersByTeam(match.id, match.home_team, round) && (
                                <div className={`px-3 py-1 rounded-full text-sm ${
                                  isTeamWinner(match, match.home_team)
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
                                  isTeamWinner(match, match.away_team)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {getTippersByTeam(match.id, match.away_team, round)}
                                </div>
                              )}
                              {isTeamWinner(match, match.away_team) ? (
                                <CheckCircle className="text-green-500" size={16} />
                              ) : (
                                <XCircle className="text-red-500" size={16} />
                              )}
                            </div>
                          </div>
                        )}
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
