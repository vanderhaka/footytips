import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { getTips, fetchMatches } from '../data';
import { FamilyMember } from '../types';

interface RoundConfirmationProps {
  round: number;
  tippers: FamilyMember[];
}

export function RoundConfirmation({ round, tippers }: RoundConfirmationProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [matchesData, tipsData] = await Promise.all([
        fetchMatches(),
        getTips(round)
      ]);
      setMatches(matchesData);
      setTips(tipsData);
      setLoading(false);
    };
    loadData();
  }, [round]);

  if (loading) {
    return <div className="text-center py-4">Loading matches and tips...</div>;
  }

  const roundMatches = matches.filter(match => match.round === round);

  const getTipForGame = (tipperId: string, matchId: string) => {
    const tip = tips.find(
      t => t.tipper_id === tipperId && t.match_id === matchId
    );
    return tip?.team_tipped || '-';
  };

  const allTipsEntered = tippers.every(tipper =>
    roundMatches.every(match =>
      tips.some(
        tip => tip.tipper_id === tipper.id && tip.match_id === match.id
      )
    )
  );

  console.log('Display data:', { matches, tippers, roundTips: tips });

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
                    <div className="font-medium">{match.home_team}</div>
                    <div className="text-sm text-gray-500">vs</div>
                    <div className="font-medium">{match.away_team}</div>
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