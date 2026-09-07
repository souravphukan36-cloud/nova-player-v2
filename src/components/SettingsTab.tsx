import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sliders, 
  FolderPlus, 
  HardDrive, 
  Info, 
  Trash2, 
  Check, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Download,
  Share2,
  Copy,
  Bell,
  Eye,
  SlidersHorizontal,
  Home,
  Music2,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle,
  FastForward,
  Zap
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { notificationService } from '../services/notificationService';

const ACCENT_COLORS = [
  { name: 'Electric Purple (Default)', value: '#7C6EFF' },
  { name: 'Electric Blue', value: '#3B82F6' },
  { name: 'Emerald Wave', value: '#10B981' },
  { name: 'Sunset Amber', value: '#F59E0B' },
  { name: 'Crimson Rose', value: '#F43F5E' },
  { name: 'AMOLED Cyan', value: '#06B6D4' },
  { name: 'Violet Neon', value: '#A855F7' },
];

const THEMES = [
  { id: 'amoled', name: 'Dark AMOLED (True Black)', bg: '#000000' },
  { id: 'dark', name: 'Dark Carbon', bg: '#121216' },
  { id: 'midnight', name: 'Midnight Purple', bg: '#100E1C' },
  { id: 'slate', name: 'Deep Slate', bg: '#0F172A' },
];

const LIBRARY_SUB_TABS = [
  { id: 'tracks', label: 'Tracks / Songs' },
  { id: 'albums', label: 'Albums' },
  { id: 'artists', label: 'Artists' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'folders', label: 'Folders' },
  { id: 'genres', label: 'Genres' },
];

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateTheme,
    updateAccentColor,
    updateCrossfade,
    toggleGapless,
    clearCache,
    setScannerOpen,
    setEqualizerOpen,
    setCustomizerOpen,
    tracks,
  } = usePlayer();

  const [cacheCleared, setCacheCleared] = useState(false);
  const [customHex, setCustomHex] = useState(settings.accentColor);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    // Check notification permission
    setNotifPermission(notificationService.getPermissionStatus());

    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleRequestNotificationPermission = async () => {
    const current = notificationService.getPermissionStatus();
    if (current === 'denied') {
      alert("Samsung Android 14/15/16 Notification Step:\n\n1. Go to phone Home Screen\n2. Long-press 'NOVA Player' app icon and tap (i) App info\n3. Tap 'Notifications'\n4. Turn ON 'Allow notifications'\n\nAfter turning it on, notifications and lock screen player will start working!");
      return;
    }
    const granted = await notificationService.requestPermission();
    setNotifPermission(notificationService.getPermissionStatus());
    if (granted && updateSettings) {
      updateSettings({ systemNotificationsEnabled: true });
    } else if (!granted) {
      alert("Notification was not enabled by Android.\n\nTo enable on Samsung:\n1. Long-press NOVA Player icon on home screen > App info (i)\n2. Tap Notifications > Turn ON 'Allow notifications'.");
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install NOVA Player on your phone:\n\n1. Open this page in Chrome or Samsung Internet\n2. Tap the 3 dots (⋮) menu in top right\n3. Tap 'Install app' or 'Add to Home screen'\n\nNOVA Player will be installed to your phone's app drawer!");
    }
  };

  const handleCopyUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleClearCache = () => {
    clearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleCustomHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^#[0-9A-F]{6}$/i.test(customHex)) {
      updateAccentColor(customHex);
    }
  };

  return (
    <div className="space-y-6 pb-36 px-5 select-none animate-in fade-in duration-200">
      {/* 0. Home Feed & Player Customization (BitChord-inspired & Customizable) */}
      <div 
        className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4"
        style={{ borderColor: `${settings.accentColor}30` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4" style={{ color: settings.accentColor }} />
            <span>Home Shelves & Now Playing Customizer</span>
          </div>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="text-xs font-extrabold px-3 py-1.5 rounded-full text-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
            style={{ backgroundColor: settings.accentColor }}
          >
            <span>Customize</span>
          </button>
        </div>
        <p className="text-xs text-white/50">
          Personalize home carousels (Recently played, Quick picks, Rain Therapy ☘️🌧️, Artist spotlight) and player layouts (Immersive backdrop, Proxy UI curved, 3D Vinyl disc).
        </p>

        {/* Quick layout selector */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: 'immersive-backdrop', label: 'Immersive Backdrop' },
            { id: 'curved-card', label: 'Curved Proxy UI' },
            { id: 'vinyl-disc', label: '3D Vinyl Disc' },
          ].map(opt => {
            const isSelected = settings.nowPlayingConfig.layoutStyle === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => updateSettings({
                  nowPlayingConfig: {
                    ...settings.nowPlayingConfig,
                    layoutStyle: opt.id as any
                  }
                })}
                className="p-2.5 rounded-2xl border text-center text-xs font-bold transition-all"
                style={{
                  borderColor: isSelected ? settings.accentColor : 'rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? `${settings.accentColor}20` : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Top Status Bar Customization (User Request 7) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Eye className="w-4 h-4 text-rose-400" />
          <span>Top Status Bar Customization</span>
        </div>
        <p className="text-xs text-white/50">
          Clean status bar without clutter. Only shows red words (LOCK • TIME • EQ • PANEL) or hide completely.
        </p>

        {/* Toggle Show/Hide Top Status Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Top Status Bar</span>
            <span className="text-[11px] text-white/50">Show or completely hide the top status bar</span>
          </div>
          <button
            onClick={() => updateSettings?.({ showTopStatusBar: !settings.showTopStatusBar })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.showTopStatusBar !== false ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.showTopStatusBar !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle Red Accent Words */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Red Accent Status Words</span>
            <span className="text-[11px] text-white/50">
              Highlight LOCK, TIME, EQ, PANEL in prominent red
            </span>
          </div>
          <button
            onClick={() => updateSettings?.({ topBarRedAccent: !settings.topBarRedAccent })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.topBarRedAccent !== false ? 'bg-rose-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.topBarRedAccent !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Audio & SoundAlive Spectrum (User Request 3) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Activity className="w-4 h-4" style={{ color: settings.accentColor }} />
            <span>Audio & SoundAlive Visualizer</span>
          </div>
          <button
            onClick={() => setEqualizerOpen(true)}
            className="text-xs font-bold px-3 py-1 rounded-full text-black flex items-center gap-1.5"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Equalizer</span>
          </button>
        </div>

        {/* SoundAlive Visualizer Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">SoundAlive Spectrum Visualizer</span>
            <span className="text-[11px] text-white/50">
              Live spectrum frequency bars (Off by default for cleaner screen)
            </span>
          </div>
          <button
            onClick={() => updateSettings?.({ soundAliveSpectrum: !settings.soundAliveSpectrum })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.soundAliveSpectrum ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundAliveSpectrum ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Crossfade Duration */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-white/70">Crossfade Between Tracks</span>
            <span className="font-bold text-white" style={{ color: settings.accentColor }}>
              {settings.crossfadeSecs}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={settings.crossfadeSecs}
            onChange={(e) => updateCrossfade(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Song Transition Delay (User Request: Ek song ke baad dusra song jaldi play hona) */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-white/90">Song Transition Delay</span>
            </div>
            <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-white/10" style={{ color: settings.accentColor }}>
              {settings.transitionDelaySecs === 0 ? '0s (Instant)' : `${settings.transitionDelaySecs}s Delay`}
            </span>
          </div>
          <p className="text-[11px] text-white/50">
            Ek song khatam hone ke baad agla song kitne second me play hoga. 0s chune taaki turant bina rukaawat agla song baj jaye.
          </p>

          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={settings.transitionDelaySecs ?? 0}
            onChange={(e) => updateSettings?.({ transitionDelaySecs: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[
              { label: '⚡ 0s Instant', val: 0 },
              { label: '0.5s', val: 0.5 },
              { label: '1.0s', val: 1.0 },
              { label: '2.0s', val: 2.0 },
              { label: '3.0s', val: 3.0 },
            ].map((preset) => {
              const isSelected = (settings.transitionDelaySecs ?? 0) === preset.val;
              return (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => updateSettings?.({ transitionDelaySecs: preset.val })}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-md scale-105'
                      : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continuous Loop Queue at End */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <span className="text-xs font-semibold text-white block">Auto-Loop Playlist</span>
            <span className="text-[11px] text-white/50">Aakhiri gaane ke baad dobara shuru se bajana jari rakhein</span>
          </div>
          <button
            onClick={() => updateSettings?.({ autoAdvanceLoop: settings.autoAdvanceLoop === false ? true : false })}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              settings.autoAdvanceLoop !== false
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {settings.autoAdvanceLoop !== false ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Gapless Playback Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-xs font-semibold text-white block">Gapless Playback</span>
            <span className="text-[11px] text-white/50">Zero pause between consecutive tracks</span>
          </div>
          <button
            onClick={toggleGapless}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              settings.gapless 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-white/10 text-white/60'
            }`}
          >
            {settings.gapless ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* 3. System Permission & Notifications (User Request 5) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>System Permissions & Notifications</span>
        </div>
        <p className="text-xs text-white/50">
          Receive playback status, song singer name, album art, and controls in phone notification shade.
        </p>

        {/* Status Badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div className="flex items-center gap-2">
            {notifPermission === 'granted' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
            <div>
              <span className="text-xs font-semibold text-white block">Notification Permission</span>
              <span className="text-[11px] text-white/50">
                {notifPermission === 'granted'
                  ? 'Permission is active'
                  : 'Permission required for background notification'}
              </span>
            </div>
          </div>

          {notifPermission !== 'granted' && notifPermission !== 'unsupported' ? (
            <button
              onClick={handleRequestNotificationPermission}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-black"
              style={{ backgroundColor: settings.accentColor }}
            >
              Allow Permission
            </button>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              GRANTED
            </span>
          )}
        </div>

        {/* System Notifications Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Active Playback Notification</span>
            <span className="text-[11px] text-white/50">
              Display song details and singer name in system notification
            </span>
          </div>
          <button
            onClick={() => updateSettings?.({ systemNotificationsEnabled: !settings.systemNotificationsEnabled })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.systemNotificationsEnabled ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.systemNotificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Home Screen Customization (User Request 8) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Home className="w-4 h-4 text-sky-400" />
          <span>Home Screen Sections</span>
        </div>
        <p className="text-xs text-white/50">
          Choose which sections appear on the main Home dashboard.
        </p>

        {/* Toggle Resume Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Now Playing / Resume Card</span>
            <span className="text-[11px] text-white/50">Hero card with quick play/pause controls</span>
          </div>
          <button
            onClick={() => updateSettings?.({ homeShowResumeCard: !settings.homeShowResumeCard })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.homeShowResumeCard !== false ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.homeShowResumeCard !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle Recent Section */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Recently Played</span>
            <span className="text-[11px] text-white/50">Horizontal carousel of recently played tracks</span>
          </div>
          <button
            onClick={() => updateSettings?.({ homeShowRecent: !settings.homeShowRecent })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.homeShowRecent !== false ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.homeShowRecent !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle Most Played Section */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Most Played / Top Tracks</span>
            <span className="text-[11px] text-white/50">Tracks with the highest playback count</span>
          </div>
          <button
            onClick={() => updateSettings?.({ homeShowMostPlayed: !settings.homeShowMostPlayed })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.homeShowMostPlayed !== false ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.homeShowMostPlayed !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 5. Library Screen Customization (User Request 8) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Music2 className="w-4 h-4 text-emerald-400" />
          <span>Library Customization</span>
        </div>
        <p className="text-xs text-white/50">
          Configure default tab and layout density in your music library.
        </p>

        {/* Default Sub-Tab Selection */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-white/70">Default Library Tab</span>
          <div className="grid grid-cols-3 gap-2">
            {LIBRARY_SUB_TABS.map((tab) => {
              const isSelected = (settings.libraryDefaultSubTab || 'tracks') === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => updateSettings?.({ libraryDefaultSubTab: tab.id as any })}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? 'border-white text-white font-bold shadow-md'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isSelected ? settings.accentColor : undefined,
                    color: isSelected ? '#000000' : undefined,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Display Density</span>
            <span className="text-[11px] text-white/50">
              {settings.libraryViewMode === 'comfortable' ? 'Comfortable spacing' : 'Compact high-density'}
            </span>
          </div>
          <div className="flex rounded-xl bg-white/10 p-1">
            <button
              onClick={() => updateSettings?.({ libraryViewMode: 'compact' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                settings.libraryViewMode !== 'comfortable' ? 'bg-white text-black' : 'text-white/60'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => updateSettings?.({ libraryViewMode: 'comfortable' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                settings.libraryViewMode === 'comfortable' ? 'bg-white text-black' : 'text-white/60'
              }`}
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {/* 6. Search Screen Customization (User Request 8) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Search className="w-4 h-4 text-violet-400" />
          <span>Search Customization</span>
        </div>
        <p className="text-xs text-white/50">
          Configure how fast and dynamically search responds to your queries.
        </p>

        {/* Instant Search Filter */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
          <div>
            <span className="text-xs font-semibold text-white block">Instant Live Filter</span>
            <span className="text-[11px] text-white/50">
              Filter songs, singers, and albums instantly on every keystroke
            </span>
          </div>
          <button
            onClick={() => updateSettings?.({ searchInstantFilter: !settings.searchInstantFilter })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.searchInstantFilter !== false ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.searchInstantFilter !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 7. Theme & Appearance */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Palette className="w-4 h-4" style={{ color: settings.accentColor }} />
          <span>UI & Design Themes</span>
        </div>

        {/* Theme Options */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-white/60">Theme Selection</span>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => {
              const isSelected = settings.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id as any)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-white bg-white/10 shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bg }}
                    />
                    <span className="text-xs font-semibold text-white truncate">{theme.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Palettes */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-semibold text-white/60">One UI Accent Colors</span>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_COLORS.map((col) => {
              const isSelected = settings.accentColor.toLowerCase() === col.value.toLowerCase();
              return (
                <button
                  key={col.value}
                  onClick={() => updateAccentColor(col.value)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105' : ''
                  }`}
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-black font-extrabold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Code Picker */}
        <form onSubmit={handleCustomHexSubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            placeholder="#7C6EFF"
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: settings.accentColor }}
          >
            Apply Hex
          </button>
        </form>
      </div>

      {/* 8. Scan Folders & Storage */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <FolderPlus className="w-4 h-4" style={{ color: settings.accentColor }} />
            <span>Scan Folders & File Formats</span>
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="text-xs font-bold px-3 py-1 rounded-full text-black"
            style={{ backgroundColor: settings.accentColor }}
          >
            Scan Now
          </button>
        </div>

        {/* Monitored directories */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-white/60">Monitored Music Folders</span>
          {settings.scanFolders.map((folder) => (
            <div key={folder} className="p-2.5 rounded-xl bg-white/5 text-xs text-white/70 font-mono truncate">
              {folder}
            </div>
          ))}
        </div>

        {/* Supported Audio Formats */}
        <div className="pt-2 border-t border-white/10">
          <span className="text-xs font-semibold text-white/60 block mb-2">Supported Local Formats</span>
          <div className="flex flex-wrap gap-1.5">
            {['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'].map((fmt) => (
              <span key={fmt} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white/80">
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 9. Install App on Phone (PWA) */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Download className="w-4 h-4" style={{ color: settings.accentColor }} />
            <span>Install on Android Phone</span>
          </div>
          {isInstalled && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              INSTALLED
            </span>
          )}
        </div>

        <p className="text-xs text-white/60">
          NOVA Player ko apne phone ke home screen aur app drawer me native app ki tarah install karein.
        </p>

        {/* Action Buttons: Direct Install or Copy Link */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-black shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? 'Open / Reinstall' : 'Install App'}</span>
          </button>

          <button
            onClick={handleCopyUrl}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? 'Copied Link!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* 3 Easy Steps Guide */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs text-white/70">
          <span className="font-bold text-white text-[11px] uppercase tracking-wider block">
            Phone me install karne ka tarika:
          </span>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white">1</span>
            <span>Apne phone ke <b>Chrome</b> ya <b>Samsung Internet</b> browser me ye link kholein.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white">2</span>
            <span>Upar daayein kone me <b>3 dots (⋮)</b> menu par tap karein.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white">3</span>
            <span><b>"Install app"</b> ya <b>"Add to Home screen"</b> (होम स्क्रीन पर जोड़ें) dabayein.</span>
          </div>
        </div>
      </div>

      {/* 10. Cache & Storage Management */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <HardDrive className="w-4 h-4 text-rose-400" />
          <span>Cache & Memory Management</span>
        </div>
        <p className="text-xs text-white/50">
          Stored metadata, playlists, and persistent audio data for {tracks.length} tracks.
        </p>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cache & Reset Library</span>
          </button>

          {cacheCleared && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Cache Cleared
            </span>
          )}
        </div>
      </div>

      {/* 11. About NOVA Player */}
      <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl space-y-4 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: settings.accentColor }}
        />

        <div className="relative z-10 space-y-3">
          <div 
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-black font-extrabold text-2xl shadow-xl transition-transform hover:scale-105"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Smartphone className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-black text-white tracking-tight">NOVA Player</h3>
            <p className="text-xs text-white/50 mt-0.5">Proxy UI High-Fidelity Audio Player</p>
          </div>

          {/* Prominent Developed by Sourav Phukan Banner */}
          <div 
            className="p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1 shadow-lg"
            style={{ 
              backgroundColor: `${settings.accentColor}18`,
              borderColor: `${settings.accentColor}40`
            }}
          >
            <span className="text-[11px] uppercase tracking-widest text-white/60 font-semibold">
              Creator & Lead Engineer
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white tracking-tight">
                Developed by Sourav Phukan
              </span>
              <span 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: settings.accentColor }}
              />
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-white/5 p-3.5 rounded-2xl border border-white/5 text-white/80">
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold">Developer</span>
              <span className="font-bold text-white">Sourav Phukan</span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px] uppercase font-bold">Design Language</span>
              <span className="font-bold text-white">Proxy UI</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">App Version</span>
              <span className="font-semibold text-white">v3.5.0 Release</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">DSP Engine</span>
              <span className="font-semibold text-white">5-Band Studio DSP</span>
            </div>
          </div>

          <p className="text-xs text-white/50 italic px-2">
            "Crafted with dedication by Sourav Phukan for music lovers who appreciate pristine audio quality."
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40 pt-1 border-t border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Offline • Zero Tracking • Local Storage</span>
          </div>
        </div>
      </div>

      {/* Bottom spacer for miniplayer and bottom navigation */}
      <div className="h-28 w-full" aria-hidden="true" />
    </div>
  );
};
