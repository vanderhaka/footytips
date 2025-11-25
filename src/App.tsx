import { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { TipEntry } from './components/TipEntry';
import { Leaderboard } from './components/Leaderboard';
import { RoundConfirmation } from './components/RoundConfirmation';
import { Season } from './components/Season';
import { PastRounds } from './components/PastRounds';
import { Admin } from './components/Admin';
import { Login } from './components/Login';
import { TipsSummary } from './components/TipsSummary';
import { OverviewTabs, OverviewTabValue } from './components/OverviewTabs';
import { FixtureList } from './components/FixtureList';
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
  const [activeOverviewTab, setActiveOverviewTab] = useState<OverviewTabValue>('leaderboard');

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

        const currentTips = await getTips(round);
        setRoundTips(currentTips || []);
        setLoading(false);

        if (round > 1) {
          const previousTips = await getTips(round - 1);
          setPreviousRoundTips(previousTips || []);
        } else {
          setPreviousRoundTips([]);
        }
        setLoadingPrevious(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
        setLoadingPrevious(false);
      }
    };
    loadData();
  }, []);

  const handleTipsSubmitted = async () => {
    const tips = await getTips(currentRound);
    setRoundTips(tips || []);
    setSelectedMemberId('');
    setShowConfirmation(true);
  };

  const hasMemberEnteredTips = (memberId: string) => {
    if (!Array.isArray(roundTips)) return false;
    return roundTips.some(tip => tip.tipper_id === memberId);
  };

  // Memoized filtered data
  const completedMatches = useMemo(
    () => matches.filter(m => m.is_complete),
    [matches]
  );

  const currentRoundMatches = useMemo(
    () => matches.filter(m => m.round === currentRound),
    [matches, currentRound]
  );

  const previousRound = currentRound > 1 ? currentRound - 1 : null;

  const previousRoundMatches = useMemo(
    () => (previousRound ? matches.filter(m => m.round === previousRound) : []),
    [matches, previousRound]
  );

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleViewChange = (view: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips') => {
    setCurrentView(view);
    setSelectedMemberId('');
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
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
            <EnterTipsView
              tippers={tippers}
              selectedMemberId={selectedMemberId}
              showConfirmation={showConfirmation}
              currentRound={currentRound}
              hasMemberEnteredTips={hasMemberEnteredTips}
              onSelectMember={setSelectedMemberId}
              onTipsSubmitted={handleTipsSubmitted}
              onBackToSelect={() => setShowConfirmation(false)}
            />
          ) : (
            <Login onSuccess={() => setIsAuthenticated(true)} />
          )
        ) : (
          <OverviewView
            activeTab={activeOverviewTab}
            onTabChange={setActiveOverviewTab}
            tippers={tippers}
            matches={matches}
            currentRound={currentRound}
            currentRoundMatches={currentRoundMatches}
            roundTips={roundTips}
            previousRound={previousRound}
            previousRoundMatches={previousRoundMatches}
            previousRoundTips={previousRoundTips}
            loadingPrevious={loadingPrevious}
            completedMatches={completedMatches}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components to reduce App complexity

interface EnterTipsViewProps {
  tippers: FamilyMember[];
  selectedMemberId: string;
  showConfirmation: boolean;
  currentRound: number;
  hasMemberEnteredTips: (memberId: string) => boolean;
  onSelectMember: (memberId: string) => void;
  onTipsSubmitted: () => void;
  onBackToSelect: () => void;
}

function EnterTipsView({
  tippers,
  selectedMemberId,
  showConfirmation,
  currentRound,
  hasMemberEnteredTips,
  onSelectMember,
  onTipsSubmitted,
  onBackToSelect
}: EnterTipsViewProps) {
  if (showConfirmation) {
    return (
      <>
        <RoundConfirmation round={currentRound} tippers={tippers} />
        <button
          className="mt-6 mx-auto block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={onBackToSelect}
        >
          Back to Select Member
        </button>
      </>
    );
  }

  if (selectedMemberId && tippers.find(m => m.id === selectedMemberId)) {
    return (
      <TipEntry
        familyMember={tippers.find(m => m.id === selectedMemberId)!}
        onTipsSubmitted={onTipsSubmitted}
      />
    );
  }

  return (
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
              onClick={() => onSelectMember(member.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{member.name}</span>
                {hasEnteredTips && <Check className="text-green-500" size={20} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface OverviewViewProps {
  activeTab: OverviewTabValue;
  onTabChange: (tab: OverviewTabValue) => void;
  tippers: FamilyMember[];
  matches: Match[];
  currentRound: number;
  currentRoundMatches: Match[];
  roundTips: any[];
  previousRound: number | null;
  previousRoundMatches: Match[];
  previousRoundTips: any[];
  loadingPrevious: boolean;
  completedMatches: Match[];
}

function OverviewView({
  activeTab,
  onTabChange,
  tippers,
  matches,
  currentRound,
  currentRoundMatches,
  roundTips,
  previousRound,
  previousRoundMatches,
  previousRoundTips,
  loadingPrevious,
  completedMatches
}: OverviewViewProps) {
  const showPreviousRound = !loadingPrevious && previousRound !== null && previousRoundMatches.length > 0;

  return (
    <>
      <OverviewTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        currentRound={currentRound}
        previousRound={previousRound}
        showPreviousRound={showPreviousRound}
      />

      {activeTab === 'leaderboard' && (
        <Leaderboard tippers={tippers} matches={matches} />
      )}

      {activeTab === 'current' && (
        <TipsSummary
          title={`${getRoundLabel(currentRound)} Tips`}
          tippers={tippers}
          matches={currentRoundMatches}
          roundTips={roundTips}
        />
      )}

      {activeTab === 'previous' && showPreviousRound && (
        <TipsSummary
          title={`${getRoundLabel(previousRound!)} Results`}
          tippers={tippers}
          matches={previousRoundMatches}
          roundTips={previousRoundTips}
        />
      )}

      {activeTab === 'fixture' && (
        <FixtureList
          matches={matches}
          currentRound={currentRound}
          completedMatches={completedMatches}
        />
      )}
    </>
  );
}

export default App;
