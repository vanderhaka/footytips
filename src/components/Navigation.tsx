import React from 'react';
import { Users, Calendar, History, Trophy, LogOut, Edit3 } from 'lucide-react';
import { signOut } from '../lib/auth';

interface NavigationProps {
  currentView: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips';
  onViewChange: (view: 'tips' | 'season' | 'past' | 'admin' | 'enter_tips') => void;
  isAuthenticated: boolean;
}

export function Navigation({ currentView, onViewChange, isAuthenticated }: NavigationProps) {
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">
              Family Footy Tipping
            </h1>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => onViewChange('tips')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                currentView === 'tips'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              Overview
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onViewChange('enter_tips')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentView === 'enter_tips'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Edit3 size={18} />
                Enter Tips
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => onViewChange('past')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  currentView === 'past'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <History size={18} />
                Past Rounds
              </button>
            )}
            <button
              onClick={() => onViewChange('season')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                currentView === 'season'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar size={18} />
              Season
            </button>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => onViewChange('admin')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    currentView === 'admin'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Trophy size={18} />
                  Results
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => onViewChange('admin')}
                className="px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50"
              >
                <Trophy size={18} />
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}