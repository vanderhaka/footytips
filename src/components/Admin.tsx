import { useState, useEffect } from 'react';
import { Trophy, Check, Loader2, AlertCircle } from 'lucide-react';
import { fetchMatches, updateMatchResult } from '../data';
import { Match } from '../types';
import { GameStats } from './GameStats';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminProps {
  showToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export function Admin({ showToast }: AdminProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMatch, setSavingMatch] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [pendingWinner, setPendingWinner] = useState<{ matchId: string; winner: string; matchLabel: string } | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      const matchesData = await fetchMatches();
      setMatches(matchesData);
      
      // Set initial round to the earliest incomplete round
      const incompleteRound = matchesData
        .filter(m => !m.is_complete)
        .sort((a, b) => a.round - b.round)[0]?.round;
      
      setSelectedRound(incompleteRound || matchesData[0]?.round || 0);
      setLoading(false);
    };
    loadMatches();
  }, []);

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
  const roundMatches = matches.filter(m => m.round === selectedRound);

  const executeWinnerSelect = async (matchId: string, winner: string) => {
    try {
      setSavingMatch(matchId);
      const updatedMatch = await updateMatchResult(matchId, winner);

      setMatches(prev => prev.map(m =>
        m.id === matchId ? {
          ...m,
          winner: updatedMatch.winner,
          is_complete: updatedMatch.is_complete
        } : m
      ));

      const updatedMatches = await fetchMatches();
      setMatches(updatedMatches);
      setEditingMatch(null);
      showToast({ message: 'Match result saved', type: 'success' });
    } catch (error) {
      console.error('Error updating match result:', error);
      showToast({ message: 'Failed to update match result. Please try again.', type: 'error' });
    } finally {
      setSavingMatch(null);
    }
  };

  const handleWinnerSelect = (matchId: string, winner: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const winnerName = winner === 'draw' ? 'Draw' :
      winner === match.home_team.abbreviation ? match.home_team.name : match.away_team.name;

    setPendingWinner({
      matchId,
      winner,
      matchLabel: `${match.home_team.name} vs ${match.away_team.name} → ${winnerName}`
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GameStats />
      
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Enter Match Results</h2>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {rounds.map(round => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedRound === round
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Round {round}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {roundMatches.map(match => {
            const isEditing = editingMatch === match.id;
            const isCompleted = match.is_complete && !isEditing;
            
            return (
              <div key={match.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600">
                    {new Date(match.match_date).toLocaleString('en-AU', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true,
                      timeZone: 'Australia/Melbourne'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{match.venue}</p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      match.winner === match.home_team.abbreviation
                        ? 'bg-green-500 text-white'
                        : 'hover:bg-gray-50'
                    } ${savingMatch === match.id ? 'opacity-75' : ''}`}
                    onClick={() => handleWinnerSelect(match.id, match.home_team.abbreviation)}
                    disabled={savingMatch !== null || isCompleted}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {match.home_team.name}
                      {savingMatch === match.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : match.winner === match.home_team.abbreviation && (
                        <Check size={16} />
                      )}
                    </span>
                  </button>
                  
                  <button
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      match.winner === match.away_team.abbreviation
                        ? 'bg-green-500 text-white'
                        : 'hover:bg-gray-50'
                    } ${savingMatch === match.id ? 'opacity-75' : ''}`}
                    onClick={() => handleWinnerSelect(match.id, match.away_team.abbreviation)}
                    disabled={savingMatch !== null || isCompleted}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {match.away_team.name}
                      {savingMatch === match.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : match.winner === match.away_team.abbreviation && (
                        <Check size={16} />
                      )}
                    </span>
                  </button>
                </div>
                
                <div className="mt-2">
                  <button
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      match.winner === 'draw'
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-50'
                    } ${savingMatch === match.id ? 'opacity-75' : ''}`}
                    onClick={() => handleWinnerSelect(match.id, 'draw')}
                    disabled={savingMatch !== null || isCompleted}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Draw
                      {savingMatch === match.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : match.winner === 'draw' && (
                        <Check size={16} />
                      )}
                    </span>
                  </button>
                </div>
                
                {match.is_complete && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm text-green-600">
                      Match complete - {match.winner === 'draw' ? 'Draw' : `Winner: ${
                        match.winner === match.home_team.abbreviation 
                          ? match.home_team.name 
                          : match.winner === match.away_team.abbreviation 
                            ? match.away_team.name 
                            : match.winner
                      }`}
                    </p>
                    {!isEditing ? (
                      <button
                        onClick={() => setEditingMatch(match.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <AlertCircle size={14} />
                        Edit Result
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingMatch(null)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingWinner !== null}
        title="Confirm Match Result"
        message={pendingWinner ? `Set result: ${pendingWinner.matchLabel}?` : ''}
        confirmLabel="Set Result"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          if (pendingWinner) {
            executeWinnerSelect(pendingWinner.matchId, pendingWinner.winner);
          }
          setPendingWinner(null);
        }}
        onCancel={() => setPendingWinner(null)}
      />
    </div>
  );
}