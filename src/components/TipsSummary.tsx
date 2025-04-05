import { Check, X } from 'lucide-react';
import { FamilyMember } from '../types';

interface TipsSummaryProps {
  title: string;
  tippers: FamilyMember[];
  matches: any[];
  roundTips: any[];
}

export function TipsSummary({ title, tippers, matches, roundTips }: TipsSummaryProps) {

  const getTipForMatch = (tipperId: string, matchId: string | number) => {
    // Convert both to strings for comparison
    const matchIdStr = String(matchId);
    const tip = roundTips.find(
      tip => tip.tipper_id === tipperId && String(tip.match_id) === matchIdStr
    );

    return tip?.team_tipped || null;
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
            {matches.map(match => {
              // Get full team objects for easier comparison
              const homeTeam = match.home_team;
              const awayTeam = match.away_team;

              return (
                <tr key={match.id} className="border-b last:border-0">
                  <td className="py-1 px-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span>{homeTeam.abbreviation}</span>
                      <span className="text-gray-400">v</span>
                      <span>{awayTeam.abbreviation}</span>
                    </div>
                  </td>
                  {tippers.map(tipper => {
                    const tipValue = getTipForMatch(tipper.id, match.id); // Returns team name/abbr like "GWS" or "GWS Giants"

                    // --- Robust Abbreviation Logic ---
                    let tipAbbr: string | null = null;
                    let tippedTeamObject: { name: string, abbreviation: string } | null = null;
                    if (tipValue) {
                        if (tipValue === homeTeam.name || tipValue === homeTeam.abbreviation) {
                            tipAbbr = homeTeam.abbreviation;
                            tippedTeamObject = homeTeam;
                        } else if (tipValue === awayTeam.name || tipValue === awayTeam.abbreviation) {
                            tipAbbr = awayTeam.abbreviation;
                            tippedTeamObject = awayTeam;
                        }
                         // Fallback if only abbreviation was stored in tips and didn't match full name
                         if (!tipAbbr) {
                            if (tipValue === homeTeam.abbreviation) tipAbbr = tipValue;
                            else if (tipValue === awayTeam.abbreviation) tipAbbr = tipValue;
                         }
                    }

                    // --- Robust Correctness Check ---
                    const isCorrect = match.is_complete && tippedTeamObject && match.winner &&
                                      (tippedTeamObject.name === match.winner || tippedTeamObject.abbreviation === match.winner);

                    // --- Render Tip Cell ---
                    return (
                      <td key={tipper.id} className="py-1 px-2">
                        {tipValue ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs
                            ${match.is_complete 
                              ? isCorrect // Use the robust check
                                ? 'bg-green-100 text-green-800' // Correct tip
                                : 'bg-red-100 text-red-800'   // Incorrect tip
                              : tipAbbr // If match not complete, but tip exists, use default highlight
                                ? 'bg-blue-100 text-blue-800' // Highlight selected tip (changed from gray)
                                : 'bg-gray-100 text-gray-800' // Fallback if tip exists but no abbr found
                            }` }
                          >
                            {tipAbbr || '??'} {/* Display abbreviation or ?? if not found */}
                            {match.is_complete && (
                              isCorrect
                                ? <Check className="text-green-500" size={12} />
                                : <X className="text-red-500" size={12} />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span> // No tip entered
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}