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
  Copy
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

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

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateTheme,
    updateAccentColor,
    updateCrossfade,
    toggleGapless,
    clearCache,
    setScannerOpen,
    setEqualizerOpen,
    tracks,
  } = usePlayer();

  const [cacheCleared, setCacheCleared] = useState(false);
  const [customHex, setCustomHex] = useState(settings.accentColor);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction alert / toggle
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
    <div className="space-y-6 pb-28 px-5 select-none animate-in fade-in duration-200">
      {/* 1. Theme & Appearance */}
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
                  onClick={() => updateTheme(theme.id as typeof settings.theme)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: theme.bg }}
                    />
                    <span className="text-xs font-medium text-white">{theme.name.split(' ')[0]}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5" style={{ color: settings.accentColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Picker */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/60">Purple Accent & Colors</span>
            <span className="text-xs font-mono font-bold" style={{ color: settings.accentColor }}>
              {settings.accentColor}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {ACCENT_COLORS.map((col) => {
              const isSelected = settings.accentColor.toLowerCase() === col.value.toLowerCase();
              return (
                <button
                  key={col.value}
                  onClick={() => updateAccentColor(col.value)}
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-transform ${
                    isSelected ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-black font-bold" />}
                </button>
              );
            })}
          </div>

          {/* Custom Hex input */}
          <form onSubmit={handleCustomHexSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              placeholder="#7C6EFF"
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono uppercase focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-black"
              style={{ backgroundColor: settings.accentColor }}
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      {/* 2. Audio Quality & Playback Settings */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4" style={{ color: settings.accentColor }} />
            <span>Audio Quality & Playback</span>
          </div>
          <button
            onClick={() => setEqualizerOpen(true)}
            className="text-xs font-semibold hover:underline"
            style={{ color: settings.accentColor }}
          >
            Equalizer
          </button>
        </div>

        {/* Crossfade duration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/80 font-medium">Crossfade Transition</span>
            <span className="font-mono text-white/50">{settings.crossfadeSecs} seconds</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={settings.crossfadeSecs}
            onChange={(e) => updateCrossfade(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
            style={{ accentColor: settings.accentColor }}
          />
          <p className="text-[11px] text-white/40">Fades smoothly between tracks when skipping</p>
        </div>

        {/* Gapless Playback Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div>
            <p className="text-xs font-semibold text-white">Gapless Playback</p>
            <p className="text-[11px] text-white/40">Removes silence between continuous tracks</p>
          </div>
          <button
            onClick={toggleGapless}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              settings.gapless ? 'text-black' : 'bg-white/10 text-white/50'
            }`}
            style={{ backgroundColor: settings.gapless ? settings.accentColor : undefined }}
          >
            {settings.gapless ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Audio Output Engine Details */}
        <div className="p-3 rounded-2xl bg-white/5 text-[11px] text-white/60 space-y-1">
          <div className="flex justify-between">
            <span>Audio Engine:</span>
            <span className="font-semibold text-white">Web Audio DSP (32-bit float)</span>
          </div>
          <div className="flex justify-between">
            <span>Output Sample Rate:</span>
            <span className="font-semibold text-white">48,000 Hz Stereo</span>
          </div>
        </div>
      </div>

      {/* 3. Scan Folders Management & Storage */}
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

        {/* Scanned directories */}
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

      {/* 4. Install App on Phone (PWA) */}
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

      {/* 5. Cache & Storage Management */}
      <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <HardDrive className="w-4 h-4 text-rose-400" />
          <span>Cache & Memory Management</span>
        </div>
        <p className="text-xs text-white/50">
          Stored metadata, playlists, and cached audio data for {tracks.length} tracks.
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

      {/* 5. About NOVA Player */}
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
            <p className="text-xs text-white/50 mt-0.5">High-Fidelity Offline Audio Player</p>
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
              <span className="text-white/40 block text-[10px] uppercase font-bold">Platform</span>
              <span className="font-bold text-white">Android (Flutter)</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">App Version</span>
              <span className="font-semibold text-white">v3.4.0 Release</span>
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
    </div>
  );
};
