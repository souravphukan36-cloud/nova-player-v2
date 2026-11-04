import React from 'react';
import { 
  Home, 
  Library, 
  Search, 
  Sliders, 
  Settings as SettingsIcon,
  Moon, 
  Sun, 
  Palette, 
  Radio, 
  Check, 
  Sparkles,
  Music2,
  X,
  Volume2
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { MainTab } from '../types';

interface SidebarNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ 
  currentTab, 
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { 
    settings, 
    updateSettings, 
    updateTheme, 
    setEqualizerOpen, 
    tracks 
  } = usePlayer();

  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';
  const isColor = settings.theme.startsWith('color-');

  // Navigation Items arranged cleanly line-by-line from top to bottom
  const navItems: {
    id: MainTab | 'equalizer';
    label: string;
    subLabel?: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    badge?: string | number;
    action?: () => void;
  }[] = [
    { 
      id: 'home', 
      label: 'Home', 
      subLabel: 'Discover & Daily Vibe',
      icon: Home 
    },
    { 
      id: 'library', 
      label: 'Music Library', 
      subLabel: 'Tracks, Playlists, Artists',
      icon: Library,
      badge: tracks.length 
    },
    { 
      id: 'search', 
      label: 'Search', 
      subLabel: 'Find tracks & lyrics',
      icon: Search 
    },
    { 
      id: 'equalizer', 
      label: 'Equalizer & FX', 
      subLabel: '10-Band Studio EQ',
      icon: Sliders,
      action: () => setEqualizerOpen(true)
    },
    { 
      id: 'settings', 
      label: 'Settings & About', 
      subLabel: 'App Details & Developer',
      icon: SettingsIcon 
    },
  ];

  // Theme options
  const handleThemeSelect = (mode: 'dark' | 'light' | 'color', colorVariant?: string) => {
    if (mode === 'dark') {
      updateTheme('dark');
      updateSettings({ accentColor: '#10B981' });
    } else if (mode === 'light') {
      updateTheme('light');
      updateSettings({ accentColor: '#059669' });
    } else if (mode === 'color') {
      const variant = colorVariant || 'color-emerald';
      updateTheme(variant as any);
      if (variant === 'color-emerald') updateSettings({ accentColor: '#10B981' });
      else if (variant === 'color-violet') updateSettings({ accentColor: '#8B5CF6' });
      else if (variant === 'color-sunset') updateSettings({ accentColor: '#F43F5E' });
      else if (variant === 'color-cyan') updateSettings({ accentColor: '#06B6D4' });
    }
  };

  const navContent = (
    <div className={`h-full flex flex-col justify-between p-4 select-none ${
      isLight ? 'text-neutral-900' : 'text-neutral-100'
    }`}>
      {/* 1. Header / Branding */}
      <div>
        <div className="flex items-center justify-between pb-5 border-b mb-4" style={{
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
        }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${settings.accentColor}, #059669)` 
              }}
            >
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none">Nature Music</h2>
              <span className="text-[11px] font-medium opacity-50 tracking-wider uppercase mt-1 block">
                Pure Audiophile
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl hover:bg-white/10 md:hidden opacity-70 hover:opacity-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Line by Line Navigation Menu */}
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider opacity-40 px-3 py-1 mb-1">
            Menu Options
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onSelectTab(item.id as MainTab);
                  }
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-all group ${
                  isActive
                    ? 'font-bold shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive 
                    ? (isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)')
                    : undefined,
                  borderLeft: isActive ? `3px solid ${settings.accentColor}` : '3px solid transparent'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className={`p-2 rounded-xl transition-all ${
                      isActive ? 'text-white' : 'group-hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: isActive ? settings.accentColor : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                      color: isActive ? '#ffffff' : (isLight ? '#374151' : '#d1d5db')
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold block truncate">
                      {item.label}
                    </span>
                    {item.subLabel && (
                      <span className="text-[10px] opacity-50 block truncate font-normal">
                        {item.subLabel}
                      </span>
                    )}
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1"
                    style={{
                      backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? settings.accentColor : undefined
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Controls in Sidebar: Live Event Switch + Dark/Light/Color Theme Switcher */}
      <div className="pt-4 border-t space-y-3 mt-4" style={{
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
      }}>
        {/* Live Event OFF / ON Button */}
        <div className="p-3 rounded-2xl border" style={{
          backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
          borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.showLiveEvent ? 'bg-rose-500 animate-pulse' : 'bg-neutral-500'}`} />
              <div>
                <p className="text-xs font-bold leading-none">Live Event Poster</p>
                <p className="text-[10px] opacity-50 mt-0.5">
                  {settings.showLiveEvent ? 'Currently Visible' : 'Turned OFF'}
                </p>
              </div>
            </div>

            <button
              onClick={() => updateSettings({ showLiveEvent: !settings.showLiveEvent })}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all active:scale-95 border ${
                settings.showLiveEvent
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
              title="Toggle Live Event on or off"
            >
              {settings.showLiveEvent ? 'Turn OFF' : 'Turn ON'}
            </button>
          </div>
        </div>

        {/* Theme Switcher: Dark, Light, Color */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-black uppercase tracking-wider opacity-40 px-1">
            Website Theme
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border" style={{
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
            borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
          }}>
            {/* Dark */}
            <button
              onClick={() => handleThemeSelect('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !isLight && !isColor
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            {/* Light */}
            <button
              onClick={() => handleThemeSelect('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isLight
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            {/* Color */}
            <button
              onClick={() => handleThemeSelect('color', 'color-emerald')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isColor
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title="Color Theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Color</span>
            </button>
          </div>

          {/* Color palette pills when color mode is active */}
          {isColor && (
            <div className="flex items-center justify-between px-1 pt-1 animate-in fade-in">
              <span className="text-[10px] opacity-50">Vibe:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'color-emerald', bg: '#10B981', title: 'Emerald' },
                  { id: 'color-violet', bg: '#8B5CF6', title: 'Violet' },
                  { id: 'color-sunset', bg: '#F43F5E', title: 'Sunset' },
                  { id: 'color-cyan', bg: '#06B6D4', title: 'Ocean' },
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleThemeSelect('color', c.id)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      settings.theme === c.id ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.bg }}
                    title={c.title}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside 
        className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r h-full overflow-y-auto no-scrollbar transition-colors duration-300"
        style={{
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
          backgroundColor: isLight ? '#FFFFFF' : (settings.theme === 'color-emerald' ? '#041d14' : settings.theme === 'color-violet' ? '#0f0c20' : settings.theme === 'color-sunset' ? '#1c0b14' : settings.theme === 'color-cyan' ? '#041525' : '#0B0D13')
        }}
      >
        {navContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div 
            className="relative w-72 max-w-[85vw] h-full shadow-2xl flex flex-col z-10 transition-colors duration-300 animate-in slide-in-from-left duration-200"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#10121A'
            }}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
