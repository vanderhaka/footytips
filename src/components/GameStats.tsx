import { useState, useEffect } from 'react';
import { fetchMatches, fetchTippers } from '../data';

export function GameStats() {
  const [stats, setStats] = useState({
    totalGames: 0,
    completedGames: 0,
    upcomingGames: 0,
    totalCorrectTips: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get matches data
        const matches = await fetchMatches();
        const completed = matches.filter(m => m.is_complete).length;
        
        // Get season-filtered tipper totals
        const tippers = await fetchTippers();
        const totalCorrectTips = tippers.reduce((sum, tipper) => {
          return sum + (tipper.total_points || 0);
        }, 0);
        
        setStats({
          totalGames: matches.length,
          completedGames: completed,
          upcomingGames: matches.length - completed,
          totalCorrectTips
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading stats:', error);
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Game Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Total Games</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalGames}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Completed Games</p>
          <p className="text-2xl font-bold text-green-600">{stats.completedGames}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Upcoming Games</p>
          <p className="text-2xl font-bold text-blue-600">{stats.upcomingGames}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Correct Tips</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalCorrectTips}</p>
          <p className="text-xs text-gray-500">(Sum of all leaderboard points)</p>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        <p>Note: Leaderboard points show correct tips per person.</p>
        <p>Total correct tips is the sum of all points across all tippers.</p>
      </div>
    </div>
  );
}