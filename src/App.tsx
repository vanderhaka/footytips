import React, { useState, useEffect } from 'react';
import { Check, Calendar, MapPin, AlertCircle, X } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { TipEntry } from './components/TipEntry';
import { Leaderboard } from './components/Leaderboard';
import { RoundConfirmation } from './components/RoundConfirmation';
import { Season } from './components/Season';
import { PastRounds } from './components/PastRounds';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { TipsSummary } from './components/TipsSummary';
import { getTips, fetchTippers, getCurrentRound, fetchMatches } from './data';
import { getSession } from './lib/auth';
import { FamilyMember } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'tips' | 'season' | 'past' | 'admin' | 'enter_tips'>('tips');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundTips, setRoundTips] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [previousRoundTips, setPreviousRoundTips] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [activeOverviewTab, setActiveOverviewTab] = useState<'leaderboard' | 'current' | 'previous' | 'fixture'>('leaderboard');

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      setIsAuthenticated(!!session);
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingPrevious(true);
      try {
        const [tippersData, round, matchesData] = await Promise.all([
          fetchTippers(),
          getCurrentRound(),
          fetchMatches()
        ]);
        setTippers(tippersData);
        setCurrentRound(round);
        setMatches(matchesData);

        // Fetch tips for the current round
        const currentTips = await getTips(round);
        setRoundTips(currentTips || []);
        setLoading(false); // Current round data loaded

        // Fetch tips for the previous round (if round > 1)
        if (round > 1) {
          const prevRound = round - 1;
          const previousTips = await getTips(prevRound);
          setPreviousRoundTips(previousTips || []);
        } else {
          setPreviousRoundTips([]); // No previous round for round 1
        }
        setLoadingPrevious(false); // Previous round data loaded

      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
        setLoadingPrevious(false);
      }
    };
    loadData();
  }, []);

  const handleTipsSubmitted = async () => {
    // Refresh tips after submission
    const tips = await getTips(currentRound);
    setRoundTips(tips || []);
    setSelectedMemberId('');
    setShowConfirmation(true);
  };

  const hasMemberEnteredTips = (memberId: string) => {
    if (!Array.isArray(roundTips)) return false;
    return roundTips.some(tip => 
      tip.tipper_id === memberId && 
      tip.round === currentRound
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBC';
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const completedMatches = matches.filter(m => m.is_complete);

  const getTeamForm = (teamName: string) => {
    const teamMatches = completedMatches
      .filter(m => m.home_team.name === teamName || m.away_team.name === teamName)
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()) // Sort recent first
      .slice(0, 5); // Get last 5

    return teamMatches.map(match => ({
      id: match.id,
      win: match.winner === teamName,
      round: match.round,
      location: match.home_team.name === teamName ? 'home' : 'away'
    }));
  };

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentRoundMatches = matches.filter(m => m.round === currentRound);
  const previousRound = currentRound > 1 ? currentRound - 1 : null;
  const previousRoundMatches = previousRound ? matches.filter(m => m.round === previousRound) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedMemberId('');
          setShowConfirmation(false);
        }}
        isAuthenticated={isAuthenticated}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {currentView === 'season' ? (
          <Season />
        ) : currentView === 'past' ? (
          isAuthenticated ? (
            <PastRounds tippers={tippers} />
          ) : (
            <Login onSuccess={() => setIsAuthenticated(true)} />
          )
        ) : currentView === 'admin' ? (
          isAuthenticated ? (
            <Admin />
          ) : (
            <Login onSuccess={() => setIsAuthenticated(true)} />
          )
        ) : currentView === 'enter_tips' ? (
          isAuthenticated ? (
            <>
              {!selectedMemberId && !showConfirmation && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Family Member</h2>
                  <div className="grid gap-3">
                    {tippers.map(member => {
                      const hasEnteredTips = hasMemberEnteredTips(member.id);
                      return (
                        <button
                          key={member.id}
                          className={`p-4 text-left rounded-lg transition-all ${
                            hasEnteredTips 
                              ? 'bg-green-50 hover:bg-green-100' 
                              : 'bg-white hover:bg-gray-50'
                          } shadow-sm hover:shadow-md`}
                          onClick={() => setSelectedMemberId(member.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{member.name}</span>
                            {hasEnteredTips && (
                              <Check className="text-green-500" size={20} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedMemberId && (
                <TipEntry
                  familyMember={tippers.find(m => m.id === selectedMemberId)!}
                  onTipsSubmitted={handleTipsSubmitted}
                />
              )}

              {showConfirmation && (
                <>
                  <RoundConfirmation round={currentRound} tippers={tippers} />
                  <button
                    className="mt-6 mx-auto block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Back to Select Member
                  </button>
                </>
              )}
            </>
          ) : (
            <Login onSuccess={() => setIsAuthenticated(true)} />
          )
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveOverviewTab('leaderboard')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeOverviewTab === 'leaderboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveOverviewTab('current')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeOverviewTab === 'current'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Round {currentRound} Tips
                </button>
                {/* Upcoming Fixture Tab */}
                <button
                  onClick={() => setActiveOverviewTab('fixture')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeOverviewTab === 'fixture'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Upcoming Matches
                </button>
                {/* Only show Previous Round tab if it exists */}
                {!loadingPrevious && previousRound && previousRoundMatches.length > 0 && (
                  <button
                    onClick={() => setActiveOverviewTab('previous')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                      activeOverviewTab === 'previous'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Round {previousRound} Results
                  </button>
                )}
              </nav>
            </div>

            {/* Conditional Content based on active tab */}
            {activeOverviewTab === 'leaderboard' && (
              <Leaderboard tippers={tippers} matches={matches} />
            )}
            
            {activeOverviewTab === 'current' && (
              <TipsSummary
                title={`Round ${currentRound} Tips`}
                tippers={tippers}
                matches={currentRoundMatches}
                roundTips={roundTips}
              />
            )}

            {activeOverviewTab === 'previous' && !loadingPrevious && previousRound && previousRoundMatches.length > 0 && (
              <TipsSummary
                title={`Round ${previousRound} Results`}
                tippers={tippers}
                matches={previousRoundMatches}
                roundTips={previousRoundTips}
              />
            )}

            {activeOverviewTab === 'fixture' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b">
                  <h2 className="text-xl font-bold text-blue-900">Round {currentRound} Fixture</h2>
                </div>
                {/* Form Guide Legend */}
                <div className="px-6 pt-3 pb-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
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
                </div>

                {currentRoundMatches.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No matches found for this round.</div>
                ) : (
                  <div className="divide-y">
                    {currentRoundMatches.map(match => {
                      const homeForm = getTeamForm(match.home_team.name);
                      const awayForm = getTeamForm(match.away_team.name);

                      return (
                        <div key={match.id} className="px-6 py-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 text-left">
                              <div className="text-lg font-semibold text-gray-900">
                                {match.home_team.name}
                              </div>
                              <div className="flex gap-1.5 mt-1">
                                {homeForm.length > 0 ? (
                                  homeForm.map(form => (
                                    <div key={`${match.id}-h-${form.id}`} className="flex flex-col items-center">
                                      <span className="text-xs text-gray-400 leading-none mb-0.5">R{form.round}</span>
                                      <div 
                                        className={`w-5 h-5 flex items-center justify-center border-2 ${form.location === 'home' ? 'rounded-full' : 'rounded-sm'} ${form.win ? 'border-green-500' : 'border-red-500'}`}
                                      >
                                        <span 
                                          className={`text-xs font-bold leading-none ${form.win ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {form.win ? 'W' : 'L'}
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
                              <div className="text-lg font-semibold text-gray-900">
                                {match.away_team.name}
                              </div>
                              <div className="flex gap-1.5 mt-1 justify-end">
                                {awayForm.length > 0 ? (
                                  awayForm.map(form => (
                                    <div key={`${match.id}-a-${form.id}`} className="flex flex-col items-center">
                                      <span className="text-xs text-gray-400 leading-none mb-0.5">R{form.round}</span>
                                      <div 
                                        className={`w-5 h-5 flex items-center justify-center border-2 ${form.location === 'home' ? 'rounded-full' : 'rounded-sm'} ${form.win ? 'border-green-500' : 'border-red-500'}`}
                                      >
                                        <span 
                                          className={`text-xs font-bold leading-none ${form.win ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {form.win ? 'W' : 'L'}
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
                          <div className="flex flex-col items-center text-gray-600 text-sm mt-2">
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;