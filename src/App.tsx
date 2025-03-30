import React, { useState, useEffect } from 'react';
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
import { getTips, fetchTippers, getCurrentRound, fetchMatches } from './data';
import { getSession } from './lib/auth';
import { FamilyMember } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'tips' | 'season' | 'past' | 'admin'>('tips');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundTips, setRoundTips] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
        const tips = await getTips(round);
        setRoundTips(tips || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
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

      <div className="max-w-4xl mx-auto px-4 py-8">
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
        ) : (
          <>
            {!selectedMemberId && !showConfirmation && (
              <>
                <div className="grid gap-6 md:grid-cols-2 mb-8">
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
                  <Leaderboard tippers={tippers} />
                </div>
                <TipsSummary 
                  tippers={tippers}
                  matches={currentRoundMatches}
                  roundTips={roundTips}
                />
              </>
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
                  Back to Tips
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;