import React from 'react';
import { Check, X } from 'lucide-react';
import { FamilyMember } from '../types';

interface TipsSummaryProps {
  title: string;
  tippers: FamilyMember[];
  matches: any[];
  roundTips: any[];
}

export function TipsSummary({ title, tippers, matches, roundTips }: TipsSummaryProps) {
  const getTipForMatch = (tipperId: string, matchId: string) => {
    return roundTips.find(
      tip => tip.tipper_id === tipperId && tip.match_id === matchId
    )?.team_tipped || null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 px-2 text-left font-medium">Game</th>
              {tippers.map(tipper => (
                <th key={tipper.id} className="py-1 px-2 text-left font-medium">
                  {tipper.name.split(' ')[0]} {/* Show only first name */}
                </th>
              ))}
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
                  </div>
                </td>
                {tippers.map(tipper => {
                  const tip = getTipForMatch(tipper.id, match.id);
                  const tipAbbr = tip ? (
                    tip === match.home_team.name
                      ? match.home_team.abbreviation 
                      : match.away_team.abbreviation
                  ) : null;
                  
                  return (
                    <td key={tipper.id} className="py-1 px-2">
                      {tip ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                          ${match.is_complete 
                            ? tip === match.winner
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tipAbbr}
                          {match.is_complete && (
                            tip === match.winner 
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