import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { getRoundLabel } from '../lib/roundLabels';
import { formatDate } from '../lib/formatDate';
import { Match } from '../types';

interface FixtureViewProps {
  currentRound: number;
  currentRoundMatches: Match[];
  completedMatches: Match[];
}

export function FixtureView({ currentRound, currentRoundMatches, completedMatches }: FixtureViewProps) {
  const getTeamForm = (teamName: string) => {
    const teamMatches = completedMatches
      .filter(m => m.home_team.name === teamName || m.away_team.name === teamName)
      .sort((a, b) => new Date(b.match_date!).getTime() - new Date(a.match_date!).getTime())
      .slice(0, 5);

    return teamMatches.map(match => ({
      id: match.id,
      win: match.winner === 'draw' ? null : match.winner === teamName,
      round: match.round,
      location: match.home_team.name === teamName ? 'home' : 'away'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 md:px-6 py-3 md:py-4 border-b">
        <h2 className="text-lg md:text-xl font-bold text-blue-900">{getRoundLabel(currentRound)} Fixture</h2>
      </div>
      {/* Form Guide Legend */}
      <div className="px-4 md:px-6 pt-3 pb-2 text-xs text-gray-600 flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1">
        <span className="font-semibold self-center">Key:</span>
        {/* Home Win */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-green-500">
            <span className="text-xs font-bold leading-none text-green-600">W</span>
          </div>
           = Home Win
        </span>
        {/* Home Loss */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-red-500">
            <span className="text-xs font-bold leading-none text-red-600">L</span>
          </div>
           = Home Loss
        </span>
        {/* Home Draw */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-full border-blue-500">
            <span className="text-xs font-bold leading-none text-blue-600">D</span>
          </div>
           = Home Draw
        </span>
        {/* Away Win */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-green-500">
            <span className="text-xs font-bold leading-none text-green-600">W</span>
          </div>
           = Away Win
        </span>
        {/* Away Loss */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-red-500">
            <span className="text-xs font-bold leading-none text-red-600">L</span>
          </div>
           = Away Loss
        </span>
        {/* Away Draw */}
        <span className="flex items-center gap-1">
          <div className="w-5 h-5 flex items-center justify-center border-2 rounded-sm border-blue-500">
            <span className="text-xs font-bold leading-none text-blue-600">D</span>
          </div>
           = Away Draw
        </span>
      </div>

      {currentRoundMatches.length === 0 ? (
        <div className="px-4 md:px-6 py-8 text-center text-gray-500">No matches found for this round.</div>
      ) : (
        <div className="divide-y">
          {currentRoundMatches.map(match => {
            const homeForm = getTeamForm(match.home_team.name);
            const awayForm = getTeamForm(match.away_team.name);

            return (
              <div key={match.id} className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 text-left">
                    <div className="text-base md:text-lg font-semibold text-gray-900">
                      {match.home_team.name}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {homeForm.length > 0 ? (
                        homeForm.map(form => (
                          <div key={`${match.id}-h-${form.id}`} className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 leading-none mb-0.5">R{form.round}</span>
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 ${form.location === 'home' ? 'rounded-full' : 'rounded-sm'} ${form.win === null ? 'border-blue-500' : form.win ? 'border-green-500' : 'border-red-500'}`}
                            >
                              <span
                                className={`text-xs font-bold leading-none ${form.win === null ? 'text-blue-600' : form.win ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {form.win === null ? 'D' : form.win ? 'W' : 'L'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No recent form</span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mx-2 pt-1">vs</div>

                  <div className="flex-1 text-right">
                    <div className="text-base md:text-lg font-semibold text-gray-900">
                      {match.away_team.name}
                    </div>
                    <div className="flex gap-1.5 mt-1 justify-end">
                      {awayForm.length > 0 ? (
                        awayForm.map(form => (
                          <div key={`${match.id}-a-${form.id}`} className="flex flex-col items-center">
                            <span className="text-xs text-gray-400 leading-none mb-0.5">R{form.round}</span>
                            <div
                              className={`w-5 h-5 flex items-center justify-center border-2 ${form.location === 'home' ? 'rounded-full' : 'rounded-sm'} ${form.win === null ? 'border-blue-500' : form.win ? 'border-green-500' : 'border-red-500'}`}
                            >
                              <span
                                className={`text-xs font-bold leading-none ${form.win === null ? 'text-blue-600' : form.win ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {form.win === null ? 'D' : form.win ? 'W' : 'L'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No recent form</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center text-gray-600 text-xs md:text-sm mt-2">
                  {match.match_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatDate(match.match_date)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle size={16} />
                      <span>Date TBC</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={16} />
                    <span>{match.venue}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
