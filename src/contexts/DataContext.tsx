import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { fetchMatches, fetchTippers, getCurrentRound, getTips } from '../data';
import { FamilyMember, Match, DatabaseTip } from '../types';

interface DataContextValue {
  matches: Match[];
  tippers: FamilyMember[];
  currentRound: number;
  isLoading: boolean;
  // Computed data
  completedMatches: Match[];
  currentRoundMatches: Match[];
  previousRound: number | null;
  previousRoundMatches: Match[];
  // Tips data with lazy loading
  roundTips: Record<number, DatabaseTip[]>;
  loadTipsForRound: (round: number) => Promise<DatabaseTip[]>;
  refreshTipsForRound: (round: number) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tippers, setTippers] = useState<FamilyMember[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [roundTips, setRoundTips] = useState<Record<number, DatabaseTip[]>>({});

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [matchesData, tippersData, round] = await Promise.all([
          fetchMatches(),
          fetchTippers(),
          getCurrentRound()
        ]);
        setMatches(matchesData);
        setTippers(tippersData);
        setCurrentRound(round);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Lazy load tips for a round (returns cached if available)
  const loadTipsForRound = useCallback(async (round: number): Promise<DatabaseTip[]> => {
    if (roundTips[round] !== undefined) {
      return roundTips[round];
    }

    try {
      const tips = await getTips(round);
      const tipData = (tips || []) as DatabaseTip[];
      setRoundTips(prev => ({ ...prev, [round]: tipData }));
      return tipData;
    } catch (error) {
      console.error(`Error loading tips for round ${round}:`, error);
      return [];
    }
  }, [roundTips]);

  // Force refresh tips for a round
  const refreshTipsForRound = useCallback(async (round: number): Promise<void> => {
    try {
      const tips = await getTips(round);
      const tipData = (tips || []) as DatabaseTip[];
      setRoundTips(prev => ({ ...prev, [round]: tipData }));
    } catch (error) {
      console.error(`Error refreshing tips for round ${round}:`, error);
    }
  }, []);

  // Memoized computed values
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

  const value: DataContextValue = {
    matches,
    tippers,
    currentRound,
    isLoading,
    completedMatches,
    currentRoundMatches,
    previousRound,
    previousRoundMatches,
    roundTips,
    loadTipsForRound,
    refreshTipsForRound
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
