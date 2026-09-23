import React from 'react';
import { Home, Library, Search, Settings } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { MainTab } from '../types';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { settings } = usePlayer();

  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl px-4 pt-1.5 pb-3 flex items-center justify-around select-none transition-colors duration-300 ${
      isLight 
        ? 'bg-white/95 border-t border-neutral-200/90 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]' 
        : 'bg-black/95 border-t border-white/10'
    }`}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            id={`nav-btn-${id}`}
            onClick={() => onSelectTab(id)}
            className="flex flex-col items-center justify-center py-1 px-3 relative group transition-all"
          >
            {/* Active Pill background */}
            <div 
              className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                isActive ? 'scale-105' : 'bg-transparent group-hover:bg-black/5'
              }`}
              style={{ backgroundColor: isActive ? `${settings.accentColor}25` : undefined }}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${
                  isActive 
                    ? 'scale-110' 
                    : isLight 
                      ? 'text-neutral-500 group-hover:text-neutral-800' 
                      : 'text-white/50 group-hover:text-white/80'
                }`}
                style={{ color: isActive ? settings.accentColor : undefined }}
              />
            </div>
            <span 
              className={`text-[11px] font-bold tracking-tight transition-colors mt-0.5 ${
                isActive 
                  ? isLight ? 'text-neutral-900' : 'text-white' 
                  : isLight ? 'text-neutral-500 group-hover:text-neutral-800' : 'text-white/50 group-hover:text-white/80'
              }`}
              style={{ color: isActive ? settings.accentColor : undefined }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
