import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { FamilyMember } from '../types';
import { saveTip, fetchMatches, getCurrentRound, getTips } from '../data';

interface TipEntryProps {
  familyMember: FamilyMember;
  onTipsSubmitted: () => void;
  selectedRound?: number;
}

export function TipEntry({ familyMember, onTipsSubmitted, selectedRound }: TipEntryProps) {
  // +++ DEBUG: Log props on initial render +++
  useEffect(() => {
    console.log('>>> TipEntry Mounted - Props Received <<<', {
      familyMemberName: familyMember.name,
      selectedRoundProp: selectedRound
    });
  }, [familyMember, selectedRound]); // Log only when these props change

  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // +++ DEBUG: Log data loading start +++
      console.log('>>> TipEntry loadData Start <<<');
      try {
        const [matchesData, round] = await Promise.all([
          fetchMatches(),
          selectedRound !== undefined ? Promise.resolve(selectedRound) : getCurrentRound()
        ]);
        setMatches(matchesData);
        const roundToUse = selectedRound !== undefined ? selectedRound : round;
        setCurrentRound(roundToUse);

        // +++ DEBUG: Check matches for the target round +++
        const roundMatches = matchesData.filter(m => m.round === roundToUse);
        console.log(`>>> TipEntry loadData - Round ${roundToUse} Matches <<<`, {
          count: roundMatches.length,
          matchIds: roundMatches.map(m => m.id),
          includes217: roundMatches.some(m => String(m.id) === '217')
        });

        // Check if round is locked
        const now = new Date();
        const isLocked = roundMatches.some(match => {
          const matchDate = new Date(match.match_date);
          return matchDate <= now;
        });
        setIsRoundLocked(isLocked);
        console.log(`>>> TipEntry loadData - Round ${roundToUse} Locked? <<<`, isLocked);

        // Load existing tips
        const tips = await getTips(roundToUse);
        const existingTips = tips?.reduce((acc: Record<string, string>, tip: any) => {
          if (tip.tipper_id === familyMember.id) {
            // Ensure match_id is stored as string key
            acc[String(tip.match_id)] = tip.team_tipped;
          }
          return acc;
        }, {});
        setSelectedTeams(existingTips || {});

        // +++ DEBUG: Log loaded tips +++
        console.log(`>>> TipEntry loadData - Round ${roundToUse} Tips Loaded for ${familyMember.name} <<<`, {
          tipCount: Object.keys(existingTips || {}).length,
          tipsMap: existingTips,
          tipFor217: existingTips?.['217'] || 'Not Found' // Check specifically for 217
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [selectedRound, familyMember.id]); // Ensure dependency array is present

  // Comment out or remove the unused handleTeamSelect function if it's truly not needed
  /* 
  const handleTeamSelect = (matchId: string, team: string) => {
    if (isRoundLocked) return;
    
    setSelectedTeams(prev => ({
      ...prev,
      [matchId]: team
    }));
  };
  */

  const handleSubmit = async () => {
    if (isRoundLocked) return;

    try {
      setSaving(true);
      const roundMatches = matches.filter(match => match.round === currentRound);
      
      // Save each tip to the database, but only for matches where a team has been selected
      await Promise.all(
        roundMatches
          .filter(match => selectedTeams[match.id]) // Only include matches with a selected team
          .map(match => 
            saveTip({
              tipper_id: familyMember.id,
              round: currentRound,
              match_id: match.id,
              team_tipped: selectedTeams[match.id]
            })
          )
      );
      
      onTipsSubmitted();
    } catch (error) {
      console.error('Error saving tips:', error);
      alert('Failed to save tips. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading matches...</div>;
  }

  // Filter matches again for rendering (ensure it uses the state variable)
  const roundMatchesForRender = matches.filter(match => match.round === currentRound);

  const formatMatchDateTime = (dateString: string | null) => {
    if (!dateString) return 'Date TBC';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  if (isRoundLocked) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6 text-amber-600">
          <AlertCircle size={24} />
          <h2 className="text-2xl font-bold">Round {currentRound} is Locked</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Tips can no longer be entered or modified for this round as matches have already started.
        </p>
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
                  <div className={`flex-1 p-3 rounded-lg border ${ 
                    isHomeSelected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800' 
                  }`}>
                    <div className="text-center">{homeTeam.name}</div>
                  </div>
                  <span className="flex items-center text-gray-500">vs</span>
                  <div className={`flex-1 p-3 rounded-lg border ${ 
                    isAwaySelected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800' 
                  }`}>
                    <div className="text-center">{awayTeam.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">
        Tips for {familyMember.name} - Round {currentRound}
      </h2>
      
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
                <div className={`flex-1 p-3 rounded-lg border ${ 
                  isHomeSelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800' 
                }`}>
                  <div className="text-center">{homeTeam.name}</div>
                </div>
                <span className="flex items-center text-gray-500">vs</span>
                <div className={`flex-1 p-3 rounded-lg border ${ 
                  isAwaySelected
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800' 
                }`}>
                  <div className="text-center">{awayTeam.name}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isRoundLocked && (
        <button 
          onClick={handleSubmit} 
          disabled={saving} 
          className="mt-6 w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Tips'}
        </button>
      )}
    </div>
  );
}