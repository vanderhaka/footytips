import { useMemo } from 'react';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { Match } from '../types';
import { getRoundLabel } from '../lib/roundLabels';
import { formatMatchDateTime } from '../lib/formatDate';
import { FormGuideLegend } from './FormGuideLegend';

interface TeamForm {
  id: string;
  win: boolean | null;
  round: number;
  location: 'home' | 'away';
}

interface FixtureListProps {
  matches: Match[];
  currentRound: number;
  completedMatches: Match[];
}

/**
 * Displays the fixture list for the current round with team form guide.
 */
export function FixtureList({ matches, currentRound, completedMatches }: FixtureListProps) {
  const currentRoundMatches = useMemo(
    () => matches.filter(m => m.round === currentRound),
    [matches, currentRound]
  );

  const getTeamForm = (teamName: string): TeamForm[] => {
    const teamMatches = completedMatches
      .filter(m => m.home_team.name === teamName || m.away_team.name === teamName)
      .sort((a, b) => new Date(b.match_date || '').getTime() - new Date(a.match_date || '').getTime())
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
        <h2 className="text-lg md:text-xl font-bold text-blue-900">
          {getRoundLabel(currentRound)} Fixture
        </h2>
      </div>

      <FormGuideLegend />

      {currentRoundMatches.length === 0 ? (
        <div className="px-4 md:px-6 py-8 text-center text-gray-500">
          No matches found for this round.
        </div>
      ) : (
        <div className="divide-y">
          {currentRoundMatches.map(match => {
            const homeForm = getTeamForm(match.home_team.name);
            const awayForm = getTeamForm(match.away_team.name);

            return (
              <div key={match.id} className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex justify-between items-start mb-2">
                  {/* Home Team */}
                  <div className="flex-1 text-left">
                    <div className="text-base md:text-lg font-semibold text-gray-900">
                      {match.home_team.name}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      {homeForm.length > 0 ? (
                        homeForm.map(form => (
                          <FormBadge key={`${match.id}-h-${form.id}`} form={form} />
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No recent form</span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mx-2 pt-1">vs</div>

                  {/* Away Team */}
                  <div className="flex-1 text-right">
                    <div className="text-base md:text-lg font-semibold text-gray-900">
                      {match.away_team.name}
                    </div>
                    <div className="flex gap-1.5 mt-1 justify-end">
                      {awayForm.length > 0 ? (
                        awayForm.map(form => (
                          <FormBadge key={`${match.id}-a-${form.id}`} form={form} />
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No recent form</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="flex flex-col items-center text-gray-600 text-xs md:text-sm mt-2">
                  {match.match_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{formatMatchDateTime(match.match_date)}</span>
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

/**
 * Individual form badge showing W/L/D with home/away styling.
 */
function FormBadge({ form }: { form: TeamForm }) {
  const borderColor = form.win === null ? 'border-blue-500' : form.win ? 'border-green-500' : 'border-red-500';
  const textColor = form.win === null ? 'text-blue-600' : form.win ? 'text-green-600' : 'text-red-600';
  const shape = form.location === 'home' ? 'rounded-full' : 'rounded-sm';
  const label = form.win === null ? 'D' : form.win ? 'W' : 'L';

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-gray-400 leading-none mb-0.5">R{form.round}</span>
      <div className={`w-5 h-5 flex items-center justify-center border-2 ${shape} ${borderColor}`}>
        <span className={`text-xs font-bold leading-none ${textColor}`}>{label}</span>
      </div>
    </div>
  );
}
