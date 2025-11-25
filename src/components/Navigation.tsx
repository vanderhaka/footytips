import { useState } from 'react';
import { Users, Calendar, History, Trophy, LogOut, Edit3, Menu, X, LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts';

type ViewType = 'tips' | 'season' | 'past' | 'admin' | 'enter_tips';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isAuthenticated: boolean;
}

interface NavItemConfig {
  view: ViewType;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
  authLabel?: string; // Different label when authenticated (e.g., "Admin" -> "Results")
}

const navItems: NavItemConfig[] = [
  { view: 'tips', label: 'Overview', icon: Users },
  { view: 'enter_tips', label: 'Enter Tips', icon: Edit3, requiresAuth: true },
  { view: 'past', label: 'Past Rounds', icon: History, requiresAuth: true },
  { view: 'season', label: 'Season', icon: Calendar },
  { view: 'admin', label: 'Admin', icon: Trophy, authLabel: 'Results' },
];

interface NavButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant: 'desktop' | 'mobile';
  className?: string;
}

function NavButton({ icon: Icon, label, isActive, onClick, variant, className }: NavButtonProps) {
  const iconSize = variant === 'desktop' ? 16 : 18;

  const baseClasses = variant === 'desktop'
    ? 'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5'
    : 'w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2';

  const activeClasses = variant === 'desktop'
    ? 'bg-blue-50 text-blue-600'
    : 'bg-blue-50 text-blue-700';

  const inactiveClasses = variant === 'desktop'
    ? 'text-gray-600 hover:bg-gray-50'
    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${className || ''}`}
    >
      <Icon size={iconSize} />
      {label}
    </button>
  );
}

export function Navigation({ currentView, onViewChange, isAuthenticated }: NavigationProps) {
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    // Navigate to overview after sign out instead of reloading
    onViewChange('tips');
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  // Filter and map nav items based on auth state
  const getVisibleItems = () => {
    return navItems
      .filter(item => !item.requiresAuth || isAuthenticated)
      .map(item => ({
        ...item,
        label: isAuthenticated && item.authLabel ? item.authLabel : item.label,
      }));
  };

  const visibleItems = getVisibleItems();

  const renderNavItems = (variant: 'desktop' | 'mobile') =>
    visibleItems.map(item => (
      <NavButton
        key={item.view}
        icon={item.icon}
        label={item.label}
        isActive={currentView === item.view}
        onClick={() => handleViewChange(item.view)}
        variant={variant}
      />
    ));

  const renderSignOut = (variant: 'desktop' | 'mobile') => {
    if (!isAuthenticated) return null;

    const classes = variant === 'desktop'
      ? 'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-red-600 hover:bg-red-50'
      : 'w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700';

    return (
      <button onClick={handleSignOut} className={classes}>
        <LogOut size={variant === 'desktop' ? 16 : 18} />
        Sign Out
      </button>
    );
  };

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleViewChange('tips')}
          >
            <Users className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">Family Footy</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-4">
            {renderNavItems('desktop')}
            {renderSignOut('desktop')}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {renderNavItems('mobile')}
          {renderSignOut('mobile')}
        </div>
      </div>
    </nav>
  );
}
