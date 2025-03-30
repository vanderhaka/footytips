import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { FamilyMember } from '../types';
import { saveTip, fetchMatches, getCurrentRound, getTips } from '../data';

interface TipEntryProps {
  familyMember: FamilyMember;
  onTipsSubmitted: () => void;
  selectedRound?: number;
}

export function TipEntry({ familyMember, onTipsSubmitted, selectedRound }: TipEntryProps) {
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);

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

        // Check if round is locked (any match has started)
        const roundMatches = matchesData.filter(m => m.round === roundToUse);
        const now = new Date();
        const isLocked = roundMatches.some(match => {
          const matchDate = new Date(match.match_date);
          return matchDate <= now;
        });
        setIsRoundLocked(isLocked);

        // Load existing tips for both current and past rounds
        const tips = await getTips(roundToUse);
        const existingTips = tips?.reduce((acc: Record<string, string>, tip: any) => {
          if (tip.tipper_id === familyMember.id) {
            acc[tip.match_id] = tip.team_tipped;
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

  const handleTeamSelect = (matchId: string, team: string) => {
    if (isRoundLocked) return;
    
    setSelectedTeams(prev => ({
      ...prev,
      [matchId]: team
    }));
  };

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

  const roundMatches = matches.filter(match => match.round === currentRound);
  const isComplete = roundMatches.every(match => selectedTeams[match.id]);

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
          {roundMatches.map(match => (
            <div key={match.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-600">
                  {formatMatchDateTime(match.match_date)}
                </p>
                <p className="text-sm text-gray-600">{match.venue}</p>
              </div>
              <div className="flex gap-4">
                <div className={`flex-1 p-3 rounded-lg border ${
                  selectedTeams[match.id] === match.home_team.name
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-center">{match.home_team.name}</div>
                </div>
                <span className="flex items-center text-gray-500">vs</span>
                <div className={`flex-1 p-3 rounded-lg border ${
                  selectedTeams[match.id] === match.away_team.name
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-center">{match.away_team.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">
        Enter Tips for {familyMember.name} - Round {currentRound}
      </h2>
      
      <div className="space-y-4">
        {roundMatches.map(match => (
          <div key={match.id} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm text-gray-600">
                {formatMatchDateTime(match.match_date)}
              </p>
              <p className="text-sm text-gray-600">{match.venue}</p>
            </div>
            <div className="flex gap-4">
              <button
                className={`flex-1 p-3 rounded-lg border transition-colors ${
                  selectedTeams[match.id] === match.home_team.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-50'
                }`}
                onClick={() => handleTeamSelect(match.id, match.home_team.name)}
                disabled={saving}
              >
                {match.home_team.name}
              </button>
              <span className="flex items-center text-gray-500">vs</span>
              <button
                className={`flex-1 p-3 rounded-lg border transition-colors ${
                  selectedTeams[match.id] === match.away_team.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-blue-50'
                }`}
                onClick={() => handleTeamSelect(match.id, match.away_team.name)}
                disabled={saving}
              >
                {match.away_team.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className={`mt-6 w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 ${
          isComplete && !saving
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleSubmit}
        disabled={!isComplete || saving}
      >
        <Check size={20} />
        {saving ? 'Saving...' : 'Submit Tips'}
      </button>
    </div>
  );
}