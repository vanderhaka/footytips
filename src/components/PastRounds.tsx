import { useState, useEffect, useCallback } from 'react';
import { History, Check, Loader2 } from 'lucide-react';
import { TipEntry } from './TipEntry';
import { RoundConfirmation } from './RoundConfirmation';
import { fetchMatches, getTips } from '../data';
import { FamilyMember, Match } from '../types';
import { getRoundLabel } from '../lib/roundLabels';

interface PastRoundsProps {
  tippers: FamilyMember[];
}

export function PastRounds({ tippers }: PastRoundsProps) {
  const [rounds, setRounds] = useState<number[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);
  const [roundTips, setRoundTips] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  // Cache for round completion status (lazy loaded)
  const [roundCompletionCache, setRoundCompletionCache] = useState<Record<number, boolean>>({});

  // Initial load - matches only (no tips preloading)
  useEffect(() => {
    const loadRounds = async () => {
      try {
        const matchesData = await fetchMatches();
        setMatches(matchesData);

        const roundNumbers = Array.from(
          new Set(matchesData.map(m => m.round))
        ).sort((a, b) => b - a);

        setRounds(roundNumbers);
        setLoading(false);
      } catch (error) {
        console.error('Error loading rounds:', error);
        setLoading(false);
      }
    };
    loadRounds();
  }, []);

  // Load tips when a round is selected
  const loadTipsForRound = useCallback(async (round: number) => {
    setLoadingTips(true);
    try {
      const tips = await getTips(round);
      setRoundTips(tips || []);
    } catch (error) {
      console.error('Error loading tips:', error);
      setRoundTips([]);
    } finally {
      setLoadingTips(false);
    }
  }, []);

  // Handle round selection
  const handleSelectRound = useCallback((round: number) => {
    setSelectedRound(round);
    loadTipsForRound(round);
  }, [loadTipsForRound]);

  // Refresh tips after submission
  const handleTipsSubmitted = useCallback(async () => {
    setSelectedMemberId('');
    setShowConfirmation(true);
    // Refresh tips to update completion status
    if (selectedRound !== null) {
      await loadTipsForRound(selectedRound);
      // Update completion cache
      const isComplete = checkRoundComplete(selectedRound, roundTips);
      setRoundCompletionCache(prev => ({ ...prev, [selectedRound]: isComplete }));
    }
  }, [selectedRound, loadTipsForRound, roundTips]);

  // Check if all members have entered tips for a round
  const checkRoundComplete = useCallback((round: number, tips: any[]): boolean => {
    if (!Array.isArray(matches)) return false;
    const roundMatches = matches.filter(m => m.round === round);
    if (roundMatches.length === 0) return false;

    return tippers.every(tipper => {
      const tipperTips = tips.filter(tip =>
        tip.tipper_id === tipper.id && tip.round === round
      );
      return tipperTips.length === roundMatches.length;
    });
  }, [matches, tippers]);

  const hasMemberEnteredTips = (memberId: string): boolean => {
    if (!Array.isArray(roundTips) || !Array.isArray(matches)) return false;
    const roundMatches = matches.filter(match => match.round === selectedRound);
    const memberTips = roundTips.filter(tip =>
      tip.tipper_id === memberId && tip.round === selectedRound
    );
    return memberTips.length === roundMatches.length;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading rounds...</p>
      </div>
    );
  }

  // Round selection view
  if (selectedRound === null) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <History className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Past Rounds</h2>
        </div>

        <div className="grid gap-3">
          {rounds.map(round => {
            const roundMatches = matches.filter(m => m.round === round);
            const isComplete = roundCompletionCache[round];

            return (
              <button
                key={round}
                onClick={() => handleSelectRound(round)}
                className={`p-4 text-left rounded-lg transition-all ${
                  isComplete
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{getRoundLabel(round)}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({roundMatches.length} games)
                    </span>
                  </div>
                  {isComplete && <Check className="text-green-500" size={20} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Selected round view
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{getRoundLabel(selectedRound)}</h2>
        <button
          onClick={() => {
            setSelectedRound(null);
            setSelectedMemberId('');
            setShowConfirmation(false);
            setRoundTips([]);
          }}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Rounds
        </button>
      </div>

      {loadingTips ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading tips...</span>
        </div>
      ) : (
        <>
          {!selectedMemberId && !showConfirmation && (
            <div className="grid gap-3">
              {tippers.map(member => {
                const hasEnteredTips = hasMemberEnteredTips(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`p-4 text-left rounded-lg transition-all ${
                      hasEnteredTips
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-white hover:bg-gray-50'
                    } shadow-sm hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{member.name}</span>
                      {hasEnteredTips && <Check className="text-green-500" size={20} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedMemberId && tippers.find(m => m.id === selectedMemberId) && (
            <TipEntry
              familyMember={tippers.find(m => m.id === selectedMemberId)!}
              onTipsSubmitted={handleTipsSubmitted}
              selectedRound={selectedRound}
            />
          )}

          {showConfirmation && (
            <>
              <RoundConfirmation round={selectedRound} tippers={tippers} />
              <button
                className="mt-6 mx-auto block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={() => setShowConfirmation(false)}
              >
                Back to Tips
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
