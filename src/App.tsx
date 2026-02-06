import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { TipEntry } from './components/TipEntry';
import { Leaderboard } from './components/Leaderboard';
import { RoundConfirmation } from './components/RoundConfirmation';
import { Season } from './components/Season';
import { PastRounds } from './components/PastRounds';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { TipsSummary } from './components/TipsSummary';
import { FixtureView } from './components/FixtureView';
import { getTips, fetchTippers, getCurrentRound, fetchMatches } from './data';
import { getRoundLabel } from './lib/roundLabels';
import { getSession } from './lib/auth';
import { FamilyMember, Match } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'tips' | 'season' | 'past' | 'admin' | 'enter_tips'>('tips');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundTips, setRoundTips] = useState<any[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [previousRoundTips, setPreviousRoundTips] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [activeOverviewTab, setActiveOverviewTab] = useState<'leaderboard' | 'current' | 'previous' | 'fixture'>('leaderboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (t: { message: string; type: 'success' | 'error' }) => setToast(t);

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

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentRoundMatches = matches.filter(m => m.round === currentRound);
  const completedMatches = matches.filter(m => m.is_complete);
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
            <Admin showToast={showToast} />
          ) : (
            <Login onSuccess={() => setIsAuthenticated(true)} />
          )
        ) : currentView === 'enter_tips' ? (
          isAuthenticated ? (
            <>
              {!selectedMemberId && !showConfirmation && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Family Member</h2>
                  {(() => {
                    const now = new Date();
                    const allComplete = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.is_complete);
                    const anyStarted = currentRoundMatches.some(m => m.match_date && new Date(m.match_date) < now);
                    const status = allComplete ? 'completed' : anyStarted ? 'in_progress' : 'open';
                    const badge = {
                      open: { text: 'Open for Tips', color: 'bg-green-100 text-green-800' },
                      in_progress: { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
                      completed: { text: 'Completed', color: 'bg-gray-100 text-gray-600' },
                    }[status];
                    return (
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                    );
                  })()}
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
                            <div>
                              <span className="font-medium">{member.name}</span>
                              <div className="text-xs text-gray-500">
                                {roundTips.filter(t => t.tipper_id === member.id && t.round === currentRound).length}/{currentRoundMatches.length} tipped
                              </div>
                            </div>
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
                  showToast={showToast}
                />
              )}

              {showConfirmation && (
                <>
                  <RoundConfirmation
                    round={currentRound}
                    tippers={tippers}
                    onEditTips={(memberId) => {
                      setSelectedMemberId(memberId);
                      setShowConfirmation(false);
                    }}
                  />
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
            <div className="mb-6">
              {/* Desktop Tabs (md and up) */}
              <div className="hidden md:block border-b border-gray-200">
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
                    {getRoundLabel(currentRound)} Tips
                  </button>
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
                  {!loadingPrevious && previousRound && previousRoundMatches.length > 0 && (
                    <button
                      onClick={() => setActiveOverviewTab('previous')}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                        activeOverviewTab === 'previous'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {getRoundLabel(previousRound)} Results
                    </button>
                  )}
                </nav>
              </div>
              {/* Mobile Dropdown (screens smaller than md) */}
              <div className="block md:hidden">
                <label htmlFor="overview-tabs" className="sr-only">Select a tab</label>
                <select
                  id="overview-tabs"
                  name="overview-tabs"
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  value={activeOverviewTab}
                  onChange={(e) => setActiveOverviewTab(e.target.value as 'leaderboard' | 'current' | 'previous' | 'fixture')}
                >
                  <option value="leaderboard">Leaderboard</option>
                  <option value="current">{getRoundLabel(currentRound)} Tips</option>
                  <option value="fixture">Upcoming Matches</option>
                  {!loadingPrevious && previousRound && previousRoundMatches.length > 0 && (
                    <option value="previous">{getRoundLabel(previousRound)} Results</option>
                  )}
                </select>
              </div>
            </div>

            {/* Conditional Content based on active tab */}
            <>
            {activeOverviewTab === 'leaderboard' && (
              <Leaderboard tippers={tippers} matches={matches} />
            )}

            {activeOverviewTab === 'current' && (
              <TipsSummary
                title={`${getRoundLabel(currentRound)} Tips`}
                tippers={tippers}
                matches={currentRoundMatches}
                roundTips={roundTips}
              />
            )}

            {activeOverviewTab === 'previous' && !loadingPrevious && previousRound && previousRoundMatches.length > 0 && (
              <TipsSummary
                title={`${getRoundLabel(previousRound)} Results`}
                tippers={tippers}
                matches={previousRoundMatches}
                roundTips={previousRoundTips}
              />
            )}

            {activeOverviewTab === 'fixture' && (
              <FixtureView
                currentRound={currentRound}
                currentRoundMatches={currentRoundMatches}
                completedMatches={completedMatches}
              />
            )}
            </>
          </>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
