import { Check, X } from 'lucide-react';
import { FamilyMember, Match } from '../types';

interface TipsSummaryProps {
  title: string;
  tippers: FamilyMember[];
  matches: Match[];
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

  // --- Calculate Round Winners --- 
  const allMatchesComplete = matches.length > 0 && matches.every(m => m.is_complete);
  let roundWinners: FamilyMember[] = [];

  if (allMatchesComplete) {
    const scores: Record<string, number> = {};
    tippers.forEach(tipper => {
      scores[tipper.id] = 0;
      matches.forEach(match => {
        const tip = roundTips.find(t => t.tipper_id === tipper.id && String(t.match_id) === String(match.id));
        if (tip && isTipCorrectSummary(tip, match)) {
          scores[tipper.id]++;
        }
      });
    });

    const highestScore = Math.max(0, ...Object.values(scores)); 
    if (highestScore > 0) { // Only declare winners if score > 0
      roundWinners = tippers.filter(tipper => scores[tipper.id] === highestScore);
    }
  }
  // --- End Calculate Round Winners ---

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 sm:py-1 px-2 text-left font-medium">Game</th>
              {tippers.map(tipper => {
                const isWinner = allMatchesComplete && roundWinners.some(winner => winner.id === tipper.id);
                return (
                  <th key={tipper.id} className="py-2 sm:py-1 px-2 text-left font-medium">
                    {tipper.name.split(' ')[0]} {/* Show only first name */}
                    {isWinner && ' 🏆'} {/* Add trophy if winner */}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matches.map(match => {
              // Get full team objects for easier comparison
              const homeTeam = match.home_team;
              const awayTeam = match.away_team;

              return (
                <tr key={match.id} className="border-b last:border-0">
                  <td className="py-2 sm:py-1 px-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span>{homeTeam.abbreviation}</span>
                      <span className="text-gray-400">v</span>
                      <span>{awayTeam.abbreviation}</span>
                      {match.is_complete && match.winner === 'draw' && (
                        <span className="ml-1 text-blue-600 font-semibold">(Draw)</span>
                      )}
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
                    // For draws, all tips are correct
                    const isCorrect = match.is_complete && (
                      match.winner === 'draw' || // All tips correct for draws
                      (tippedTeamObject && match.winner &&
                       (tippedTeamObject.name === match.winner || tippedTeamObject.abbreviation === match.winner))
                    );

                    // --- Render Tip Cell ---
                    return (
                      <td key={tipper.id} className="py-2 sm:py-1 px-2">
                        {tipValue ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1.5 sm:py-0.5 rounded text-xs
                            ${match.is_complete 
                              ? isCorrect // Use the robust check (includes draws)
                                ? 'bg-green-100 text-green-800' // Correct tip (including draws)
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

// Helper function to check tip correctness (similar to RoundConfirmation)
function isTipCorrectSummary(tip: { team_tipped: string }, match: Match): boolean {
  if (!match.is_complete || !match.winner) {
    return false;
  }

  // For draws, all tips are correct
  if (match.winner === 'draw') {
    return true;
  }

  // Find the winning team object (home or away)
  const winningTeam = 
    match.home_team.name === match.winner || match.home_team.abbreviation === match.winner
    ? match.home_team
    : match.away_team.name === match.winner || match.away_team.abbreviation === match.winner
    ? match.away_team
    : null;

  if (!winningTeam) {
    return false; 
  }

  // Check if the tipped team matches the winner's name OR abbreviation
  return tip.team_tipped === winningTeam.name || tip.team_tipped === winningTeam.abbreviation;
}