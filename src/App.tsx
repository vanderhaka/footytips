import { useState, useEffect, useCallback } from 'react';
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
import { useAuth, useData } from './contexts';
import { getRoundLabel } from './lib/roundLabels';
import { FamilyMember, DatabaseTip, Match } from './types';

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    matches,
    tippers,
    currentRound,
    isLoading: dataLoading,
    completedMatches,
    currentRoundMatches,
    previousRound,
    previousRoundMatches,
    roundTips,
    loadTipsForRound,
    refreshTipsForRound
  } = useData();

  const [currentView, setCurrentView] = useState<'tips' | 'season' | 'past' | 'admin' | 'enter_tips'>('tips');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeOverviewTab, setActiveOverviewTab] = useState<OverviewTabValue>('leaderboard');
  const [loadingPrevious, setLoadingPrevious] = useState(true);

  // Load current and previous round tips on mount
  useEffect(() => {
    if (!dataLoading && currentRound > 0) {
      const loadInitialTips = async () => {
        await loadTipsForRound(currentRound);
        if (currentRound > 1) {
          await loadTipsForRound(currentRound - 1);
        }
        setLoadingPrevious(false);
      };
      loadInitialTips();
    }
  }, [dataLoading, currentRound, loadTipsForRound]);

  const handleTipsSubmitted = useCallback(async () => {
    await refreshTipsForRound(currentRound);
    setSelectedMemberId('');
    setShowConfirmation(true);
  }, [currentRound, refreshTipsForRound]);

  const hasMemberEnteredTips = useCallback((memberId: string): boolean => {
    const tips = roundTips[currentRound] || [];
    return tips.some(tip => tip.tipper_id === memberId);
  }, [roundTips, currentRound]);

  if (authLoading || dataLoading) {
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

  const currentTips = roundTips[currentRound] || [];
  const previousTips = previousRound ? (roundTips[previousRound] || []) : [];

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
            <Login />
          )
        ) : currentView === 'admin' ? (
          isAuthenticated ? (
            <Admin />
          ) : (
            <Login />
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
            <Login />
          )
        ) : (
          <OverviewView
            activeTab={activeOverviewTab}
            onTabChange={setActiveOverviewTab}
            tippers={tippers}
            matches={matches}
            currentRound={currentRound}
            currentRoundMatches={currentRoundMatches}
            roundTips={currentTips}
            previousRound={previousRound}
            previousRoundMatches={previousRoundMatches}
            previousRoundTips={previousTips}
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
  roundTips: DatabaseTip[];
  previousRound: number | null;
  previousRoundMatches: Match[];
  previousRoundTips: DatabaseTip[];
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
