import { Check, X } from 'lucide-react';
import { FamilyMember, Match, DatabaseTip } from '../types';
import { isTipCorrect, getTipAbbreviation } from '../lib/tipValidation';

interface TipsSummaryProps {
  title: string;
  tippers: FamilyMember[];
  matches: Match[];
  roundTips: DatabaseTip[];
}

export function TipsSummary({ title, tippers, matches, roundTips }: TipsSummaryProps) {
  const getTipForMatch = (tipperId: string, matchId: string | number): DatabaseTip | null => {
    const matchIdStr = String(matchId);
    return roundTips.find(
      tip => tip.tipper_id === tipperId && String(tip.match_id) === matchIdStr
    ) || null;
  };

  // Calculate round winners
  const allMatchesComplete = matches.length > 0 && matches.every(m => m.is_complete);
  let roundWinners: FamilyMember[] = [];

  if (allMatchesComplete) {
    const scores: Record<string, number> = {};
    tippers.forEach(tipper => {
      scores[tipper.id] = 0;
      matches.forEach(match => {
        const tip = getTipForMatch(tipper.id, match.id);
        if (tip && isTipCorrect(tip, match)) {
          scores[tipper.id]++;
        }
      });
    });

    const highestScore = Math.max(0, ...Object.values(scores));
    if (highestScore > 0) {
      roundWinners = tippers.filter(tipper => scores[tipper.id] === highestScore);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 px-2 text-left font-medium">Game</th>
              {tippers.map(tipper => {
                const isWinner = allMatchesComplete && roundWinners.some(winner => winner.id === tipper.id);
                return (
                  <th key={tipper.id} className="py-1 px-2 text-left font-medium">
                    {tipper.name.split(' ')[0]}
                    {isWinner && ' 🏆'}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id} className="border-b last:border-0">
                <td className="py-1 px-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span>{match.home_team.abbreviation}</span>
                    <span className="text-gray-400">v</span>
                    <span>{match.away_team.abbreviation}</span>
                    {match.is_complete && match.winner === 'draw' && (
                      <span className="ml-1 text-blue-600 font-semibold">(Draw)</span>
                    )}
                  </div>
                </td>
                {tippers.map(tipper => {
                  const tip = getTipForMatch(tipper.id, match.id);
                  const tipAbbr = tip
                    ? getTipAbbreviation(tip.team_tipped, match.home_team, match.away_team)
                    : null;
                  const isCorrect = tip ? isTipCorrect(tip, match) : false;

                  return (
                    <td key={tipper.id} className="py-1 px-2">
                      {tip ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                          ${match.is_complete
                            ? isCorrect
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            : tipAbbr
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tipAbbr || '??'}
                          {match.is_complete && (
                            isCorrect
                              ? <Check className="text-green-500" size={12} />
                              : <X className="text-red-500" size={12} />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
