import { useState, useEffect } from 'react';
import { History, Check } from 'lucide-react';
import { TipEntry } from './TipEntry';
import { RoundConfirmation } from './RoundConfirmation';
import { fetchMatches, getTips } from '../data';
import { FamilyMember, Match } from '../types';

interface PastRoundsProps {
  tippers: FamilyMember[];
}

export function PastRounds({ tippers }: PastRoundsProps) {
  const [rounds, setRounds] = useState<number[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roundTips, setRoundTips] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [allRoundsTips, setAllRoundsTips] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const loadRounds = async () => {
      try {
        const matchesData = await fetchMatches();
        setMatches(matchesData);
        
        // Get unique rounds and sort in descending order
        const roundNumbers = Array.from(
          new Set(matchesData.map(m => m.round))
        ).sort((a, b) => b - a);
        
        setRounds(roundNumbers);

        // Load tips for all rounds
        const tipsPromises = roundNumbers.map(round => getTips(round));
        const allTips = await Promise.all(tipsPromises);
        const tipsMap = roundNumbers.reduce((acc, round, index) => {
          acc[round] = allTips[index] || [];
          return acc;
        }, {} as Record<number, any[]>);
        setAllRoundsTips(tipsMap);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading rounds:', error);
        setLoading(false);
      }
    };
    loadRounds();
  }, []);

  useEffect(() => {
    const loadTips = async () => {
      if (selectedRound !== null) {
        try {
          const tips = await getTips(selectedRound);
          setRoundTips(tips || []);
        } catch (error) {
          console.error('Error loading tips:', error);
        }
      }
    };
    loadTips();
  }, [selectedRound]);

  const handleTipsSubmitted = () => {
    setSelectedMemberId('');
    setShowConfirmation(true);
  };

  const hasMemberEnteredTips = (memberId: string): boolean => {
    if (!Array.isArray(roundTips) || !Array.isArray(matches)) return false;
    const roundMatches = matches.filter(match => match.round === selectedRound);
    const memberTips = roundTips.filter(tip => 
      tip.tipper_id === memberId && 
      tip.round === selectedRound
    );
    return memberTips.length === roundMatches.length;
  };

  const isRoundComplete = (round: number): boolean => {
    if (!Array.isArray(matches)) return false;
    const roundMatches = matches.filter(m => m.round === round);
    if (roundMatches.length === 0) return false;
    
    const roundTips = allRoundsTips[round] || [];
    
    return tippers.every(tipper => {
      const tipperTips = roundTips.filter(tip => 
        tip.tipper_id === tipper.id && 
        tip.round === round
      );
      return tipperTips.length === roundMatches.length;
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading rounds...</p>
      </div>
    );
  }

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
            const complete = isRoundComplete(round);
            return (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`p-4 text-left rounded-lg transition-all ${ 
                  complete 
                    ? 'bg-green-50 hover:bg-green-100' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Round {round}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({roundMatches.length} games)
                    </span>
                  </div>
                  {complete && (
                    <Check className="text-green-500" size={20} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Round {selectedRound}</h2>
        <button
          onClick={() => {
            setSelectedRound(null);
            setSelectedMemberId('');
            setShowConfirmation(false);
          }}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Rounds
        </button>
      </div>
      
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
                  {hasEnteredTips && (
                    <Check className="text-green-500" size={20} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedMemberId && (
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
    </div>
  );
}