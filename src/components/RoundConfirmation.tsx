import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getTips, fetchMatches } from '../data';
import { FamilyMember, Match, DatabaseTip } from '../types';

interface RoundConfirmationProps {
  round: number;
  tippers: FamilyMember[];
}

export function RoundConfirmation({ round, tippers }: RoundConfirmationProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tips, setTips] = useState<DatabaseTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, tipsData] = await Promise.all([
          fetchMatches(),
          getTips(round)
        ]);
        setMatches(matchesData);
        setTips(tipsData || []);
        setError(null);
      } catch (err) {
        console.error('Error loading confirmation data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [round]);

  if (loading) {
    return <div className="text-center py-4">Loading matches and tips...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 flex flex-col items-center gap-2">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  const roundMatches = matches.filter(match => match.round === round);

  const getTipForGame = (tipperId: string, matchId: string | number) => {
    const matchIdStr = String(matchId);
    const tip = tips.find(
      t => t.tipper_id === tipperId && String(t.match_id) === matchIdStr
    );
    return tip?.team_tipped || '-';
  };

  const allTipsEntered = tippers.every(tipper =>
    roundMatches.every(match =>
      tips.some(
        tip => tip.tipper_id === tipper.id && String(tip.match_id) === String(match.id)
      )
    )
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <CheckCircle className="text-green-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">
          Round {round} Tips Confirmation
        </h2>
      </div>

      {allTipsEntered ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left font-semibold">Game</th>
                {tippers.map(tipper => (
                  <th key={tipper.id} className="p-3 text-left font-semibold">
                    {tipper.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roundMatches.map(match => (
                <tr key={match.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{match.home_team.name}</div>
                    <div className="text-sm text-gray-500">vs</div>
                    <div className="font-medium">{match.away_team.name}</div>
                  </td>
                  {tippers.map(tipper => (
                    <td key={tipper.id} className="p-3">
                      {getTipForGame(tipper.id, match.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-8 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">
            Not all tips have been entered for this round yet.
          </p>
        </div>
      )}
    </div>
  );
}