import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { FamilyMember } from '../types';

interface LeaderboardProps {
  tippers: FamilyMember[];
}

export function Leaderboard({ tippers }: LeaderboardProps) {
  const [sortedMembers, setSortedMembers] = useState<FamilyMember[]>([]);
  const [ranks, setRanks] = useState<Record<string, number>>({});

  useEffect(() => {
    // Sort members by points and calculate ranks
    const sorted = [...tippers].sort((a, b) => b.total_points - a.total_points);
    setSortedMembers(sorted);
    
    // Calculate ranks, accounting for ties
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

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {sortedMembers.map((member) => {
          const rank = ranks[member.id];
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${
                  rank === 1 ? 'text-yellow-500' :
                  rank === 2 ? 'text-gray-500' :
                  rank === 3 ? 'text-amber-700' : 'text-gray-700'
                }`}>
                  #{rank}
                </span>
                <span className="font-medium">{member.name}</span>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {member.total_points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}