import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palette, 
  Sliders, 
  HardDrive, 
  Trash2, 
  Check, 
  Bell, 
  Home, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  Headphones,
  Sparkles, 
  Smartphone, 
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Volume2,
  Lock,
  Battery,
  Paintbrush,
  Clock,
  Mic,
  Music2,
  FolderPlus,
  Play,
  Layers
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { notificationService } from '../services/notificationService';

const ACCENT_COLORS = [
  { name: 'Electric Purple', value: '#7C6EFF' },
  { name: 'Electric Blue', value: '#3B82F6' },
  { name: 'Emerald Wave', value: '#10B981' },
  { name: 'Sunset Amber', value: '#F59E0B' },
  { name: 'Crimson Rose', value: '#F43F5E' },
  { name: 'AMOLED Cyan', value: '#06B6D4' },
  { name: 'Violet Neon', value: '#A855F7' },
];

const THEMES = [
  // Dark Themes
  { id: 'amoled', name: 'AMOLED Black', mode: 'dark', bg: '#000000', border: '#262626' },
  { id: 'dark', name: 'Dark Carbon', mode: 'dark', bg: '#121216', border: '#2a2a30' },
  { id: 'midnight', name: 'Midnight', mode: 'dark', bg: '#100E1C', border: '#26203a' },
  { id: 'slate', name: 'Slate', mode: 'dark', bg: '#0F172A', border: '#1e293b' },
  // Light Themes (Requested Color/Light screen mode)
  { id: 'light', name: 'One UI Light', mode: 'light', bg: '#F2F4F8', border: '#D5DAE5' },
  { id: 'light-silver', name: 'Pure White', mode: 'light', bg: '#FFFFFF', border: '#E5E7EB' },
  { id: 'warm-light', name: 'Warm Cream', mode: 'light', bg: '#FAF7F2', border: '#E7DFD5' },
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
    setCarModeOpen,
    setIEMModalOpen,
    iemSoundStage,
    updateIEMSoundStage,
    setLockScreenOpen,
    setSleepTimerOpen,
    tracks,
    isInstallable,
    promptInstall,
    requestNotificationPermission,
  } = usePlayer();

  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';

  // Expanded sections state (can expand/collapse or open modals)
  const [expandedSection, setExpandedSection] = useState<string | null>('display');

  const toggleSection = (sectionId: string) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  const [cacheCleared, setCacheCleared] = useState(false);
  const [customHex, setCustomHex] = useState(settings.accentColor);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [notifBlockedNotice, setNotifBlockedNotice] = useState(false);
  const [installSuccessNotice, setInstallSuccessNotice] = useState(false);

  useEffect(() => {
    setNotifPermission(notificationService.getPermissionStatus());
  }, []);

  const handleRequestNotificationPermission = async () => {
    const current = notificationService.getPermissionStatus();
    if (current === 'denied') {
      setNotifBlockedNotice(true);
      setTimeout(() => setNotifBlockedNotice(false), 5000);
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(notificationService.getPermissionStatus());
    if (granted && updateSettings) {
      updateSettings({ systemNotificationsEnabled: true });
    }
  };

  const handleInstallAppClick = async () => {
    const success = await promptInstall();
    if (success) {
      setInstallSuccessNotice(true);
      setTimeout(() => setInstallSuccessNotice(false), 4000);
    }
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

  const matchesSearch = (_terms: string[]) => true;

  return (
    <div className="space-y-4 pb-48 px-3 sm:px-5 select-none animate-in fade-in duration-200 max-w-xl mx-auto relative">

      {/* ============================================================== */}
      {/* GROUP 1: MODES, SOUNDS & NOTIFICATIONS (Matches Screenshot Top) */}
      {/* ============================================================== */}
      {(matchesSearch(['modes and routines', 'sleep timer', 'autoplay', 'loop']) ||
        matchesSearch(['sounds and vibration', 'crossfade', 'gapless', 'soundalive', 'transition']) ||
        matchesSearch(['notifications', 'lock screen shade', 'media session'])) && (
        <div className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#18191E] border-white/5'
        }`}>
          {/* Row 1: Modes and Routines (Purple Circle) */}
          {matchesSearch(['modes and routines', 'sleep timer', 'autoplay', 'loop']) && (
            <div>
              <div 
                onClick={() => toggleSection('modes')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#6366F1] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Modes and Routines
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Sleep timer, auto-advance loop, infinite play
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {settings.autoAdvanceLoop && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                      Loop ON
                    </span>
                  )}
                  {expandedSection === 'modes' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'modes' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Auto-Advance Queue Loop</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Loop back to top when last track ends</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ autoAdvanceLoop: !settings.autoAdvanceLoop })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.autoAdvanceLoop ? 'bg-indigo-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.autoAdvanceLoop ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Sleep Timer</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Automatic music shutoff</div>
                    </div>
                    <button
                      onClick={() => setSleepTimerOpen(true)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600 text-white shadow active:scale-95 transition-transform"
                    >
                      Set Timer
                    </button>
                  </div>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 2: Sounds and vibration (Blue Circle) */}
          {matchesSearch(['sounds and vibration', 'crossfade', 'gapless', 'soundalive', 'transition']) && (
            <div>
              <div 
                onClick={() => toggleSection('sounds')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Volume2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Sounds and vibration
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Crossfade {settings.crossfadeSecs}s • Gapless {settings.gapless ? 'ON' : 'OFF'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedSection === 'sounds' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'sounds' && (
                <div className={`px-4 pb-4 pt-1 space-y-4 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  {/* Song Transition Delay */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Song Transition Delay</span>
                      <span className="text-xs font-mono font-bold text-emerald-500">
                        {settings.transitionDelaySecs <= 0.005 ? '0.005s (Ultra-Instant)' : `${settings.transitionDelaySecs}s`}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0.005, 0.5, 1, 2, 3].map((val) => {
                        const isSelected = settings.transitionDelaySecs === val || (val === 0.005 && settings.transitionDelaySecs <= 0.005);
                        return (
                          <button
                            key={val}
                            onClick={() => updateSettings({ transitionDelaySecs: val })}
                            className={`py-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow'
                                : isLight
                                  ? 'border-neutral-200 bg-white text-neutral-700'
                                  : 'border-white/10 bg-white/5 text-white/70'
                            }`}
                          >
                            {val === 0.005 ? '0.005s' : `${val}s`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Crossfade */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Crossfade Blend</span>
                      <span className="text-xs font-mono font-bold text-blue-500">
                        {settings.crossfadeSecs === 0 ? 'Off' : `${settings.crossfadeSecs}s`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={settings.crossfadeSecs}
                      onChange={(e) => updateCrossfade(Number(e.target.value))}
                      className="w-full accent-blue-600 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Gapless Playback Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Gapless Playback</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Zero silence between live album tracks</div>
                    </div>
                    <button
                      onClick={toggleGapless}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.gapless ? 'bg-blue-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.gapless ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* SoundAlive Spectrum */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>SoundAlive Live Spectrum</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Dynamic real-time waveform visualizer</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ soundAliveSpectrum: !settings.soundAliveSpectrum })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.soundAliveSpectrum ? 'bg-blue-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.soundAliveSpectrum ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Dedicated IEM Audiophile Stage (Emerald Circle) */}
          {matchesSearch(['iem', 'headphone', 'earphone', 'harman', 'audiophile', 'crossfeed']) && (
            <div>
              <div 
                onClick={() => setIEMModalOpen(true)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Headphones className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                        IEM Audiophile Stage
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        iemSoundStage.enabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : isLight ? 'bg-neutral-200 text-neutral-600' : 'bg-white/10 text-white/50'
                      }`}>
                        {iemSoundStage.enabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      {iemSoundStage.enabled 
                        ? `${iemSoundStage.targetCurve.replace('-', ' ').toUpperCase()} • Crossfeed ${iemSoundStage.crossfeed}`
                        : 'Harman In-Ear curve, sub-bass rumble & crossfeed stage'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                </div>
              </div>

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 3: Notifications (Orange Circle) */}
          {matchesSearch(['notifications', 'lock screen shade', 'media session']) && (
            <div>
              <div 
                onClick={() => toggleSection('notifications')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Bell className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Notifications
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Media controls & lock screen notification shade
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {notifPermission === 'granted' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                      Enable
                    </span>
                  )}
                  {expandedSection === 'notifications' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'notifications' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>System Notification Controls</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Lock screen playback widget & notifications</div>
                    </div>
                    {notifPermission === 'granted' ? (
                      <button
                        onClick={() => updateSettings({ systemNotificationsEnabled: !settings.systemNotificationsEnabled })}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.systemNotificationsEnabled ? 'bg-orange-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                          settings.systemNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    ) : (
                      <button
                        onClick={handleRequestNotificationPermission}
                        className="text-xs font-bold px-3 py-1 rounded-full bg-orange-600 text-white shadow active:scale-95 transition-transform"
                      >
                        Allow
                      </button>
                    )}
                  </div>

                  {notifBlockedNotice && (
                    <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                      Notifications are currently blocked in your browser. Tap the tune/lock icon in your address bar to set Notifications to "Allow".
                    </div>
                  )}

                  {/* Native Android Media Notification Info */}
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[11px] font-bold text-white block">Android Live Notification & Lock Screen:</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                      Plays directly through Android's Native MediaSession engine. Shows album artwork, song title, artist, live scrubber, and prev/play/pause/next buttons on your phone lock screen and notification shade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated Home Screen App Icon Card */}
          <div className={`p-4 border-t ${isLight ? 'border-neutral-100 bg-neutral-50/50' : 'border-white/5 bg-white/[0.01]'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/icon-192.png" 
                  alt="NOVA Logo" 
                  className="w-10 h-10 rounded-2xl shadow-lg border border-white/10 shrink-0" 
                />
                <div>
                  <h4 className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                    Phone Home Screen App Logo
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                    {installSuccessNotice 
                      ? '✅ App logo installed on your phone home screen!'
                      : isInstallable 
                        ? 'Install official NOVA icon to phone launcher'
                        : 'Installed or ready in browser menu (Add to Home screen)'}
                  </p>
                </div>
              </div>

              {isInstallable && (
                <button
                  onClick={handleInstallAppClick}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 active:scale-95 transition-all shrink-0"
                >
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GROUP 2: DISPLAY & BATTERY (Matches Screenshot Middle)         */}
      {/* ============================================================== */}
      {(matchesSearch(['display', 'light mode', 'dark mode', 'color', 'screen', 'theme']) ||
        matchesSearch(['battery', 'storage', 'cache', 'folders'])) && (
        <div className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#18191E] border-white/5'
        }`}>
          {/* Row 1: Display (Sun Lime/Yellow Circle) */}
          {matchesSearch(['display', 'light mode', 'dark mode', 'color', 'screen', 'theme']) && (
            <div>
              <div 
                onClick={() => toggleSection('display')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#84CC16] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Sun className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Display
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      {isLight ? 'Light mode' : 'Dark mode'} • Top status bar • Layout
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLight ? 'bg-amber-500/10 text-amber-600' : 'bg-neutral-700 text-neutral-300'
                  }`}>
                    {isLight ? 'Light' : 'Dark'}
                  </span>
                  {expandedSection === 'display' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'display' && (
                <div className={`px-4 pb-5 pt-2 space-y-4 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  
                  {/* Authentic Samsung One UI Display Preview: Light vs Dark Side-by-Side Selector */}
                  <div className="space-y-2">
                    <div className={`text-xs font-bold tracking-tight uppercase ${isLight ? 'text-neutral-600' : 'text-white/50'}`}>
                      Appearance Mode
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Light Mode Preview Phone */}
                      <button
                        type="button"
                        onClick={() => updateTheme('light')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center ${
                          isLight 
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        {/* Mini Phone Screen Mockup */}
                        <div className="w-24 h-32 rounded-xl border border-neutral-300 bg-[#F2F4F8] p-2 flex flex-col justify-between shadow-sm overflow-hidden">
                          <div className="space-y-1.5">
                            <div className="w-8 h-1.5 rounded-full bg-neutral-400" />
                            <div className="w-full h-7 rounded-lg bg-white border border-neutral-200 p-1 flex items-center gap-1">
                              <div className="w-4 h-4 rounded bg-blue-500 shrink-0" />
                              <div className="w-8 h-1 rounded bg-neutral-300" />
                            </div>
                            <div className="w-full h-5 rounded-lg bg-white border border-neutral-200 p-1">
                              <div className="w-10 h-1 rounded bg-neutral-300" />
                            </div>
                          </div>
                          <div className="w-10 h-1 rounded-full bg-neutral-400 mx-auto" />
                        </div>
                        {/* Radio selector */}
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isLight ? 'border-blue-500 bg-blue-500' : 'border-neutral-400'
                          }`}>
                            {isLight && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            Light
                          </span>
                        </div>
                      </button>

                      {/* Dark Mode Preview Phone */}
                      <button
                        type="button"
                        onClick={() => updateTheme('amoled')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2.5 transition-all text-center ${
                          !isLight 
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30' 
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        {/* Mini Phone Screen Mockup */}
                        <div className="w-24 h-32 rounded-xl border border-neutral-800 bg-[#000000] p-2 flex flex-col justify-between shadow-sm overflow-hidden">
                          <div className="space-y-1.5">
                            <div className="w-8 h-1.5 rounded-full bg-neutral-600" />
                            <div className="w-full h-7 rounded-lg bg-[#18191E] border border-white/10 p-1 flex items-center gap-1">
                              <div className="w-4 h-4 rounded bg-blue-500 shrink-0" />
                              <div className="w-8 h-1 rounded bg-neutral-600" />
                            </div>
                            <div className="w-full h-5 rounded-lg bg-[#18191E] border border-white/10 p-1">
                              <div className="w-10 h-1 rounded bg-neutral-600" />
                            </div>
                          </div>
                          <div className="w-10 h-1 rounded-full bg-neutral-600 mx-auto" />
                        </div>
                        {/* Radio selector */}
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            !isLight ? 'border-blue-500 bg-blue-500' : 'border-neutral-400'
                          }`}>
                            {!isLight && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-xs font-bold ${!isLight ? 'text-white' : 'text-neutral-900'}`}>
                            Dark
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Now Playing Artwork Layout */}
                  <div className="space-y-2 pt-1">
                    <span className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>
                      Now Playing Screen Style
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'immersive-backdrop', label: 'Backdrop' },
                        { id: 'curved-card', label: 'Curved UI' },
                        { id: 'vinyl-disc', label: '3D Vinyl' },
                      ].map((opt) => {
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
                            className="p-2 rounded-xl border text-center text-xs font-semibold transition-all"
                            style={{
                              borderColor: isSelected ? settings.accentColor : isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
                              backgroundColor: isSelected ? `${settings.accentColor}20` : isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                              color: isSelected ? settings.accentColor : isLight ? '#374151' : 'rgba(255,255,255,0.7)'
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Status Bar Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Top Status Bar</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Hi-Res audio indicators & DSP tag</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ showTopStatusBar: !settings.showTopStatusBar })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.showTopStatusBar ? 'bg-lime-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.showTopStatusBar ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 2: Battery & Storage (Green Circle) */}
          {matchesSearch(['battery', 'storage', 'cache', 'folders']) && (
            <div>
              <div 
                onClick={() => toggleSection('storage')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Battery className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Battery and storage
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      {tracks.length} tracks cached • Folder auto-scanner
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedSection === 'storage' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'storage' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Local Folder Scanner</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Scan MP3, FLAC, WAV from device storage</div>
                    </div>
                    <button
                      onClick={() => setScannerOpen(true)}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow active:scale-95 transition-transform"
                    >
                      Scan
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5">
                    <button
                      onClick={handleClearCache}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Track Cache ({tracks.length})</span>
                    </button>

                    {cacheCleared && (
                      <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Cache Cleared
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* GROUP 3: WALLPAPER, THEMES & HOME SCREEN (Matches Screenshot)  */}
      {/* ============================================================== */}
      {(matchesSearch(['wallpaper and style', 'accent color', 'color', 'palette']) ||
        matchesSearch(['themes', 'light theme', 'dark theme', 'amoled', 'slate', 'cream']) ||
        matchesSearch(['home screen', 'shelves', 'quick picks', 'mood', 'resume card']) ||
        matchesSearch(['lock screen', 'widget'])) && (
        <div className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#18191E] border-white/5'
        }`}>
          {/* Row 1: Wallpaper and style (Pink Circle) */}
          {matchesSearch(['wallpaper and style', 'accent color', 'color', 'palette']) && (
            <div>
              <div 
                onClick={() => toggleSection('wallpaper')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EC4899] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Palette className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Wallpaper and style
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Accent palette & custom color theme
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div 
                    className="w-5 h-5 rounded-full ring-2 ring-white/30"
                    style={{ backgroundColor: settings.accentColor }}
                  />
                  {expandedSection === 'wallpaper' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'wallpaper' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="space-y-1.5 pt-2">
                    <span className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Accent Color Palette</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ACCENT_COLORS.map((col) => {
                        const isSelected = settings.accentColor.toLowerCase() === col.value.toLowerCase();
                        return (
                          <button
                            key={col.value}
                            onClick={() => updateAccentColor(col.value)}
                            className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
                              isSelected ? 'ring-2 ring-offset-2 ring-black scale-110 shadow-md' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: col.value }}
                            title={col.name}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex input */}
                  <form onSubmit={handleCustomHexSubmit} className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      placeholder="#7C6EFF"
                      className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-mono uppercase ${
                        isLight 
                          ? 'bg-white border-neutral-300 text-neutral-900' 
                          : 'bg-white/5 border-white/10 text-white'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-600 text-white shadow"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 2: Themes (Magenta Circle) */}
          {matchesSearch(['themes', 'light theme', 'dark theme', 'amoled', 'slate', 'cream']) && (
            <div>
              <div 
                onClick={() => toggleSection('themes')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#D946EF] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Paintbrush className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Themes
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      AMOLED, Slate, One UI Light, Warm Cream
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedSection === 'themes' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'themes' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {THEMES.map((theme) => {
                      const isSelected = settings.theme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => updateTheme(theme.id as any)}
                          className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/20 shadow-sm' 
                              : isLight ? 'border-neutral-200 bg-white hover:border-neutral-300' : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                          style={{
                            backgroundColor: isSelected ? (theme.mode === 'light' ? '#ffffff' : '#1a1824') : undefined
                          }}
                        >
                          <div>
                            <div className={`text-xs font-bold ${
                              isSelected ? 'text-fuchsia-500' : isLight ? 'text-neutral-800' : 'text-white'
                            }`}>
                              {theme.name}
                            </div>
                            <div className={`text-[10px] uppercase font-mono ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>
                              {theme.mode}
                            </div>
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full border border-black/20"
                            style={{ backgroundColor: theme.bg }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 3: Home screen (Royal Blue Circle) */}
          {matchesSearch(['home screen', 'shelves', 'quick picks', 'mood', 'resume card']) && (
            <div>
              <div 
                onClick={() => toggleSection('home-screen')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Home className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Home screen
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Hero resume card, recently played, mood shelves
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expandedSection === 'home-screen' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'home-screen' && (
                <div className={`px-4 pb-4 pt-1 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Hero Resume Card</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Floating artwork with live progress bar</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ homeShowResumeCard: !settings.homeShowResumeCard })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.homeShowResumeCard ? 'bg-blue-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.homeShowResumeCard ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className={`text-xs font-bold ${isLight ? 'text-neutral-800' : 'text-white'}`}>Recently Played Shelf</div>
                      <div className={`text-[11px] ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>Carousel of recent listening history</div>
                    </div>
                    <button
                      onClick={() => updateSettings({ homeShowRecent: !settings.homeShowRecent })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        settings.homeShowRecent ? 'bg-blue-600' : isLight ? 'bg-neutral-300' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
                        settings.homeShowRecent ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setCustomizerOpen(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-600 text-white shadow active:scale-95 transition-transform"
                    >
                      Customize Full Home Layout
                    </button>
                  </div>
                </div>
              )}

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Row 4: Lock screen (Cyan Circle) */}
          {matchesSearch(['lock screen', 'widget']) && (
            <div>
              <div 
                onClick={() => setLockScreenOpen(true)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#06B6D4] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Lock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Lock screen
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      OLED ambient cover art & touch controls
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500">
                    Preview
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* GROUP 4: AUDIO & DSP ENGINE + CAR MODE                         */}
      {/* ============================================================== */}
      {(matchesSearch(['equalizer', 'dsp', 'dolby', '8d audio', 'bass']) ||
        matchesSearch(['car mode', 'driving'])) && (
        <div className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#18191E] border-white/5'
        }`}>
          {/* Audio & DSP Studio (Red Circle) */}
          {matchesSearch(['equalizer', 'dsp', 'dolby', '8d audio', 'bass']) && (
            <div>
              <div 
                onClick={() => setEqualizerOpen(true)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EF4444] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Sliders className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Audio & DSP Equalizer
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      10–Band EQ, Dolby Atmos Cinema, 360° 8D Spatial
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                    Open EQ
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                </div>
              </div>

              {/* Inset Divider */}
              <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />
            </div>
          )}

          {/* Car Mode (Amber Circle) */}
          {matchesSearch(['car mode', 'driving']) && (
            <div>
              <div 
                onClick={() => setCarModeOpen(true)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Car className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      Car Mode
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Oversized road controls for safe driving
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                </div>
              </div>
            </div>
          )}

          {/* Inset Divider */}
          <div className={`h-[1px] ml-16 mr-3 ${isLight ? 'bg-neutral-100' : 'bg-white/[0.06]'}`} />

          {/* App Permissions & System Access (Emerald Shield) */}
          {matchesSearch(['permission', 'access', 'storage', 'notification', 'media session', 'battery', 'wake lock']) && (
            <div>
              <div 
                onClick={() => toggleSection('permissions')}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-neutral-50 active:bg-neutral-100' : 'hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-[15px] font-semibold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      App Permissions & System Access
                    </h3>
                    <p className={`text-xs truncate ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                      Storage, Notifications, Wake Lock & Background Playback
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    5 Active
                  </span>
                  {expandedSection === 'permissions' ? (
                    <ChevronDown className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-white/30'}`} />
                  )}
                </div>
              </div>

              {expandedSection === 'permissions' && (
                <div className={`px-4 pb-4 pt-2 space-y-3 ${isLight ? 'bg-neutral-50/70' : 'bg-black/20'}`}>
                  <p className={`text-xs leading-relaxed ${isLight ? 'text-neutral-600' : 'text-white/60'}`}>
                    NOVA Player requires minimal device permissions to guarantee smooth background audio, lock screen controls, and offline song storage without battery drain.
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* 1. Storage & Files */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <HardDrive className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            Storage & Local Media Access
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Granted
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          Allows scanning offline MP3/M4A/FLAC files from your device folders and caching Telegram songs in IndexedDB for offline play.
                        </p>
                      </div>
                    </div>

                    {/* 2. Media Notifications & Lock Screen */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <Bell className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            System Notifications & Media Session
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          Enables Android lock screen controls, pull-down notification shade playback controls, and track progress scrubbing.
                        </p>
                      </div>
                    </div>

                    {/* 3. Screen Wake Lock & Background Audio */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <Battery className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            Screen Wake Lock & Keep-Alive
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Automatic
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          Prevents Android OS from pausing music playback when the screen turns off or while using other applications.
                        </p>
                      </div>
                    </div>

                    {/* 4. Microphone (Speech Search) */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <Mic className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            Microphone (Voice Search)
                          </span>
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            On-Demand
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          Only accessed when you tap the microphone button in search to speak song or artist names. Never active in the background.
                        </p>
                      </div>
                    </div>

                    {/* 5. Network Access (Telegram Private Cloud) */}
                    <div className={`p-3 rounded-2xl border flex items-start gap-3 ${
                      isLight ? 'bg-white border-neutral-200' : 'bg-white/5 border-white/5'
                    }`}>
                      <Smartphone className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                            High-Speed Network Streaming
                          </span>
                          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Connected
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug mt-1 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
                          Direct high-speed streaming from Telegram Bot API CDN and real-time lyrics synchronization.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* GROUP 5: ABOUT NOVA PLAYER (RESTORED CARD BY SOURAV PHUKAN)   */}
      {/* ============================================================== */}
      {matchesSearch(['about', 'sourav phukan', 'version', 'nova player', 'developer']) && (
        <div className={`p-6 rounded-3xl border shadow-xl text-center space-y-5 transition-all ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#18191E] border-white/5'
        }`}>
          {/* App Icon */}
          <div 
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl transition-transform"
            style={{ backgroundColor: settings.accentColor }}
          >
            <Smartphone className="w-10 h-10 text-black stroke-[2.2]" />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h2 className={`text-2xl font-black tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              NOVA Player
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
              Proxy UI High-Fidelity Audio Player
            </p>
          </div>

          {/* Creator & Lead Engineer Banner */}
          <div 
            className="p-4 rounded-2xl border text-center space-y-1"
            style={{ 
              backgroundColor: `${settings.accentColor}12`, 
              borderColor: `${settings.accentColor}30` 
            }}
          >
            <div className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-neutral-500' : 'text-white/40'}`}>
              CREATOR & LEAD ENGINEER
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm sm:text-base font-extrabold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                Developed by Sourav Phukan
              </span>
              <span 
                className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" 
                style={{ backgroundColor: settings.accentColor }} 
              />
            </div>
          </div>

          {/* App Specs Card (Clean version without DEVELOPER / DESIGN LANGUAGE box) */}
          <div className={`p-4 rounded-2xl border grid grid-cols-2 gap-4 text-left ${
            isLight ? 'bg-neutral-50 border-neutral-200/80' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <div className={`text-[10px] font-bold tracking-wider uppercase ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>
                APP VERSION
              </div>
              <div className={`text-sm font-bold mt-0.5 ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                v3.5.0 Release
              </div>
            </div>
            <div>
              <div className={`text-[10px] font-bold tracking-wider uppercase ${isLight ? 'text-neutral-400' : 'text-white/40'}`}>
                DSP ENGINE
              </div>
              <div className="text-sm font-bold text-emerald-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>10–Band Studio DSP</span>
              </div>
            </div>
          </div>

          {/* Dedication Quote */}
          <p className={`text-xs italic px-2 leading-relaxed ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>
            "Crafted with dedication by Sourav Phukan for music lovers who appreciate pristine audio quality."
          </p>

          {/* Cloud & Audio Guarantee */}
          <div className={`pt-3 border-t flex items-center justify-center gap-2 text-[11px] font-medium ${
            isLight ? 'border-neutral-100 text-neutral-500' : 'border-white/10 text-white/45'
          }`}>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Cloud Streaming & Local Playback • Zero Tracking • Studio Audio</span>
          </div>
        </div>
      )}

    </div>
  );
};
