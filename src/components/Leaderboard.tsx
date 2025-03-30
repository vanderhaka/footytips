import { useState, useEffect } from 'react';
import { Trophy, X } from 'lucide-react';
import { FamilyMember } from '../types';
import { fetchRoundScores } from '../data'; // Import the new function

interface LeaderboardProps {
  tippers: FamilyMember[];
  matches: any[];
}

interface RoundScore {
  tipper_id: string;
  round: number;
  is_correct: boolean | null;
  id: number;
  match_id: number;
  team_tipped: string;
  created_at: string;
}

interface ProcessedScores {
  [tipperId: string]: {
    [round: number]: number;
  };
}

export function Leaderboard({ tippers, matches }: LeaderboardProps) {
  const [sortedMembers, setSortedMembers] = useState<FamilyMember[]>([]);
  const [ranks, setRanks] = useState<Record<string, number>>({});
  const [roundScores, setRoundScores] = useState<ProcessedScores>({});
  const [rounds, setRounds] = useState<number[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTipperData, setSelectedTipperData] = useState<{ 
    tipper: FamilyMember | null; 
    scores: { [round: number]: number } 
  } | null>(null);

  useEffect(() => {
    // Sort members by points and calculate ranks
    const sorted = [...tippers].sort((a, b) => b.total_points - a.total_points);
    setSortedMembers(sorted);
    
    const rankMap: Record<string, number> = {};
    let currentRank = 1;
    sorted.forEach((member, index) => {
      if (index > 0 && member.total_points < sorted[index - 1].total_points) {
        currentRank = index + 1;
      }
      rankMap[member.id] = currentRank;
    });
    setRanks(rankMap);
  }, [tippers]);

  useEffect(() => {
    const loadScores = async () => {
      setLoadingScores(true);
      const scoresData: RoundScore[] = await fetchRoundScores();
      console.log('Fetched round scores data:', scoresData);
      
      const processed: ProcessedScores = {};
      const uniqueRounds = new Set<number>();

      scoresData.forEach(score => {
        if (score.tipper_id && score.round !== null && score.round !== undefined && score.is_correct !== null && score.is_correct !== undefined) {
          if (!processed[score.tipper_id]) {
            processed[score.tipper_id] = {};
          }
          processed[score.tipper_id][score.round] = 
            (processed[score.tipper_id][score.round] || 0) + (score.is_correct ? 1 : 0);
          uniqueRounds.add(score.round);
        }
      });
      
      setRoundScores(processed);
      setRounds(Array.from(uniqueRounds).sort((a, b) => b - a));
      setLoadingScores(false);
    };
    loadScores();
  }, []);

  // Calculate matches per round *outside* useEffect, as matches prop can change
  const matchesPerRound = matches.reduce((acc, match) => {
    if (match.round !== null && match.round !== undefined) {
      acc[match.round] = (acc[match.round] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  const handleTipperClick = (tipper: FamilyMember) => {
    setSelectedTipperData({ 
      tipper: tipper,
      scores: roundScores[tipper.id] || {}
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTipperData(null);
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-lg overflow-x-auto relative">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-yellow-500" size={20} />
        <h2 className="text-xl font-bold text-gray-800">Leaderboard</h2>
      </div>

      {loadingScores ? (
        <div className="text-center py-4 text-gray-500">Loading round scores...</div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 text-xs md:text-sm">Rank</th>
              <th className="p-2 text-left font-semibold text-gray-700 sticky left-10 bg-gray-50 z-10 text-xs md:text-sm">Name</th>
              {rounds.map(round => (
                <th key={round} className="p-2 text-center font-semibold text-gray-700 hidden md:table-cell">R{round}</th>
              ))}
              <th className="p-2 text-right font-semibold text-gray-700 sticky right-0 bg-gray-50 z-10 text-xs md:text-sm">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member) => {
              const rank = ranks[member.id];
              const memberScores = roundScores[member.id] || {};
              return (
                <tr key={member.id} className="border-t">
                  <td className="p-2 font-medium sticky left-0 bg-white z-10">
                    <span className={`font-semibold text-xs md:text-sm ${
                      rank === 1 ? 'text-yellow-500' :
                      rank === 2 ? 'text-gray-500' :
                      rank === 3 ? 'text-amber-700' : 'text-gray-700'
                    }`}>
                      #{rank}
                    </span>
                  </td>
                  <td 
                    className="p-2 sticky left-10 bg-white z-10 text-xs md:text-sm cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() => handleTipperClick(member)}
                  >
                    {member.name}
                  </td>
                  {rounds.map(round => {
                    const score = memberScores[round];
                    const totalGames = matchesPerRound[round] || 0;
                    const displayScore = score !== undefined ? `${score} / ${totalGames}` : '-';
                    return (
                      <td key={round} className="p-2 text-center text-gray-600 hidden md:table-cell text-xs">
                        {displayScore}
                      </td>
                    );
                  })}
                  <td className="p-2 text-right font-bold text-blue-600 sticky right-0 bg-white z-10 text-xs md:text-sm">
                    {member.total_points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal */} 
      {isModalOpen && selectedTipperData && selectedTipperData.tipper && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal} // Close on overlay click
        >
          <div 
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedTipperData.tipper.name} - Round Scores</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2"> {/* Scrollable content */}
              {rounds.map(round => {
                const score = selectedTipperData.scores[round];
                const totalGames = matchesPerRound[round] || 0;
                const displayScore = score !== undefined ? `${score} / ${totalGames}` : '-';
                
                return (
                  <div key={round} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">Round {round}:</span>
                    <span className="font-semibold text-blue-600">{displayScore}</span>
                  </div>
                );
              })}
              {Object.keys(selectedTipperData.scores).length === 0 && (
                 <p className="text-sm text-gray-500 text-center py-4">No round scores available yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}