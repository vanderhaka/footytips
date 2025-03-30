import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
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

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-lg overflow-x-auto">
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
                  <td className="p-2 sticky left-10 bg-white z-10 text-xs md:text-sm">{member.name}</td>
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
    </div>
  );
}