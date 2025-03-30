import React, { useState } from 'react';
import { Users, Calendar, History, Trophy, LogOut, Edit3, Menu, X } from 'lucide-react';
import { signOut } from '../lib/auth';

interface NavigationProps {
  currentView: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips';
  onViewChange: (view: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips') => void;
  isAuthenticated: boolean;
}

export function Navigation({ currentView, onViewChange, isAuthenticated }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const handleViewChange = (view: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleViewChange('tips')}>
            <Users className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">
              Family Footy
            </h1>
          </div>
          
          <div className="hidden md:flex md:gap-4">
            <button
              onClick={() => handleViewChange('tips')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                currentView === 'tips'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={16} />
              Overview
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleViewChange('enter_tips')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                  currentView === 'enter_tips'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Edit3 size={16} />
                Enter Tips
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => handleViewChange('past')}
                 className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                  currentView === 'past'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
             >
                <History size={16} />
                Past Rounds
              </button>
            )}
            <button
              onClick={() => handleViewChange('season')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                currentView === 'season'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={16} />
              Season
            </button>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Trophy size={16} />
                  Results
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => handleViewChange('admin')}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 text-gray-600 hover:bg-gray-50"
              >
                <Trophy size={16} />
                Admin
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
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

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
           <button
              onClick={() => handleViewChange('tips')}
              className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                currentView === 'tips'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users size={18} />
              Overview
            </button>
          {isAuthenticated && (
              <button
                onClick={() => handleViewChange('enter_tips')}
                className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                  currentView === 'enter_tips'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Edit3 size={18} />
                Enter Tips
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => handleViewChange('past')}
                 className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                  currentView === 'past'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
             >
                <History size={18} />
                Past Rounds
              </button>
            )}
            <button
              onClick={() => handleViewChange('season')}
              className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                currentView === 'season'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Calendar size={18} />
              Season
            </button>
             {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 ${
                    currentView === 'admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Trophy size={18} />
                  Results
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => handleViewChange('admin')}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium flex items-center gap-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Trophy size={18} />
                Admin
              </button>
            )}
        </div>
      </div>
    </nav>
  );
}