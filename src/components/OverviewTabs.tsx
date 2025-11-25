import { getRoundLabel } from '../lib/roundLabels';

export type OverviewTabValue = 'leaderboard' | 'current' | 'previous' | 'fixture';

interface OverviewTabsProps {
  activeTab: OverviewTabValue;
  onTabChange: (tab: OverviewTabValue) => void;
  currentRound: number;
  previousRound: number | null;
  showPreviousRound: boolean;
}

/**
 * Tab navigation for the Overview page.
 * Renders desktop tabs (md+) and mobile dropdown (< md).
 */
export function OverviewTabs({
  activeTab,
  onTabChange,
  currentRound,
  previousRound,
  showPreviousRound
}: OverviewTabsProps) {
  const tabs: { value: OverviewTabValue; label: string; show: boolean }[] = [
    { value: 'leaderboard', label: 'Leaderboard', show: true },
    { value: 'current', label: `${getRoundLabel(currentRound)} Tips`, show: true },
    { value: 'fixture', label: 'Upcoming Matches', show: true },
    {
      value: 'previous',
      label: previousRound ? `${getRoundLabel(previousRound)} Results` : '',
      show: showPreviousRound && previousRound !== null
    }
  ];

  const visibleTabs = tabs.filter(t => t.show);

  return (
    <div className="mb-6">
      {/* Desktop Tabs (md and up) */}
      <div className="hidden md:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Dropdown (screens smaller than md) */}
      <div className="block md:hidden">
        <label htmlFor="overview-tabs" className="sr-only">Select a tab</label>
        <select
          id="overview-tabs"
          name="overview-tabs"
          className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as OverviewTabValue)}
        >
          {visibleTabs.map(tab => (
            <option key={tab.value} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
