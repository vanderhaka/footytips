import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { FamilyMember, Match } from '../types';
import { saveTip, fetchMatches, getCurrentRound, getTips } from '../data';
import { ConfirmDialog } from './ConfirmDialog';

interface TipEntryProps {
  familyMember: FamilyMember;
  onTipsSubmitted: () => void;
  selectedRound?: number;
  showToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export function TipEntry({ familyMember, onTipsSubmitted, selectedRound, showToast }: TipEntryProps) {
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [showPartialWarning, setShowPartialWarning] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [countdownColor, setCountdownColor] = useState('text-gray-500');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, round] = await Promise.all([
          fetchMatches(),
          selectedRound !== undefined ? Promise.resolve(selectedRound) : getCurrentRound()
        ]);
        setMatches(matchesData);
        const roundToUse = selectedRound !== undefined ? selectedRound : round;
        setCurrentRound(roundToUse);

        // Load existing tips
        const tips = await getTips(roundToUse);
        const existingTips = tips?.reduce((acc: Record<string, string>, tip: any) => {
          if (tip.tipper_id === familyMember.id) {
            acc[String(tip.match_id)] = tip.team_tipped;
          }
          return acc;
        }, {});
        setSelectedTeams(existingTips || {});

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [selectedRound, familyMember.id]);

  useEffect(() => {
    if (!matches.length || !currentRound) return;

    const roundMatches = matches.filter(m => m.round === currentRound);
    const datesWithValues = roundMatches
      .map(m => m.match_date)
      .filter((d): d is string => d !== null)
      .map(d => new Date(d).getTime());

    if (!datesWithValues.length) return;

    const deadline = Math.min(...datesWithValues);

    const updateCountdown = () => {
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setCountdown('Tips closed');
        setCountdownColor('text-red-500');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d ${hours}h remaining`);
        setCountdownColor('text-gray-500');
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m remaining`);
        setCountdownColor(hours < 1 ? 'text-orange-500' : 'text-gray-500');
      } else {
        setCountdown(`${minutes}m remaining`);
        setCountdownColor('text-orange-500');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [matches, currentRound]);

  const handleTeamSelect = (matchId: string, team: string) => {
    setSelectedTeams(prev => ({
      ...prev,
      [matchId]: team
    }));
  };

  const doSave = async () => {
    try {
      setSaving(true);
      const roundMatches = matches.filter(match => match.round === currentRound);

      await Promise.all(
        roundMatches
          .filter(match => selectedTeams[String(match.id)])
          .map(match => {
            const matchIdStr = String(match.id);
            return saveTip({
              tipper_id: familyMember.id,
              round: currentRound,
              match_id: match.id,
              team_tipped: selectedTeams[matchIdStr]
            });
          })
      );

      showToast({ message: 'Tips saved!', type: 'success' });
      onTipsSubmitted();
    } catch (error) {
      console.error('Error saving tips:', error);
      showToast({ message: 'Failed to save tips. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const roundMatches = matches.filter(match => match.round === currentRound);
    const tippedCount = roundMatches.filter(m => selectedTeams[String(m.id)]).length;
    const totalCount = roundMatches.length;

    if (tippedCount < totalCount && tippedCount > 0) {
      setShowPartialWarning(true);
      return;
    }

    if (tippedCount === 0) {
      showToast({ message: 'Please select at least one tip', type: 'error' });
      return;
    }

    await doSave();
  };

  if (loading) {
    return <div className="text-center py-4">Loading matches...</div>;
  }

  // Filter matches again for rendering (ensure it uses the state variable)
  const roundMatchesForRender = matches.filter(match => match.round === currentRound);

  const formatMatchDateTime = (dateString: string | null) => {
    if (!dateString) return 'Date TBC';
    const date = new Date(dateString);
    
    // The dates are stored in UTC but represent AEST/AEDT times
    // We need to display them as-is without timezone conversion
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Australia/Melbourne'
    };
    
    return date.toLocaleString('en-AU', options);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">
        Tips for {familyMember.name} - Round {currentRound}
      </h2>

      {countdown && (
        <div className={`flex items-center gap-1 text-sm mb-2 ${countdownColor}`}>
          <Clock size={14} />
          <span>{countdown}</span>
        </div>
      )}

      {(() => {
        const tippedCount = roundMatchesForRender.filter(m => selectedTeams[String(m.id)]).length;
        const totalCount = roundMatchesForRender.length;
        const progress = totalCount > 0 ? (tippedCount / totalCount) * 100 : 0;
        return (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className={tippedCount === totalCount ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {tippedCount === totalCount ? 'All tipped!' : `${tippedCount} of ${totalCount} tipped`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${tippedCount === totalCount ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })()}

      <div className="space-y-4">
        {roundMatchesForRender.map(match => {
          const matchIdStr = String(match.id);
          const homeTeam = match.home_team;
          const awayTeam = match.away_team;
          const selectedTipValue = selectedTeams[matchIdStr];
          
          // Determine if home/away team was selected, checking name OR abbreviation
          const isHomeSelected = selectedTipValue && (selectedTipValue === homeTeam.name || selectedTipValue === homeTeam.abbreviation);
          const isAwaySelected = selectedTipValue && (selectedTipValue === awayTeam.name || selectedTipValue === awayTeam.abbreviation);
          
          return (
            <div key={matchIdStr} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-600">
                  {formatMatchDateTime(match.match_date)}
                </p>
                <p className="text-sm text-gray-600">{match.venue}</p>
              </div>
              <div className="flex gap-4">
                {/* Add onClick handler and cursor-pointer to home team div */}
                <div 
                  className={`flex-1 p-3 rounded-lg border cursor-pointer ${ 
                  isHomeSelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                  }`}
                  onClick={() => handleTeamSelect(matchIdStr, homeTeam.abbreviation)}
                >
                  <div className="text-center">{homeTeam.name}</div>
                </div>
                <span className="flex items-center text-gray-500">vs</span>
                {/* Add onClick handler and cursor-pointer to away team div */}
                <div 
                  className={`flex-1 p-3 rounded-lg border cursor-pointer ${ 
                  isAwaySelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                  }`}
                  onClick={() => handleTeamSelect(matchIdStr, awayTeam.abbreviation)}
                >
                  <div className="text-center">{awayTeam.name}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={saving} 
        className="mt-6 w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : (() => {
          const tippedCount = roundMatchesForRender.filter(m => selectedTeams[String(m.id)]).length;
          const totalCount = roundMatchesForRender.length;
          return tippedCount < totalCount ? `Save ${tippedCount} of ${totalCount} Tips` : 'Save Tips';
        })()}
      </button>

      <ConfirmDialog
        isOpen={showPartialWarning}
        title="Incomplete Tips"
        message={`You've tipped ${roundMatchesForRender.filter(m => selectedTeams[String(m.id)]).length} of ${roundMatchesForRender.length} matches. Save anyway?`}
        confirmLabel="Save Anyway"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setShowPartialWarning(false);
          doSave();
        }}
        onCancel={() => setShowPartialWarning(false)}
      />
    </div>
  );
}