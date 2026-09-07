import React from 'react';
import { 
  X, 
  Sliders, 
  Sparkles, 
  Layers, 
  Smartphone, 
  Palette, 
  Check, 
  RotateCcw,
  Volume2,
  FileText,
  Repeat
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const ACCENT_COLORS = [
  { name: 'Emerald Nature', hex: '#10B981' },
  { name: 'Coke Studio Crimson', hex: '#E11D48' },
  { name: 'Cyber Violet', hex: '#8B5CF6' },
  { name: 'Sunset Amber', hex: '#F59E0B' },
  { name: 'Ocean Cyan', hex: '#06B6D4' },
  { name: 'Sapphire Blue', hex: '#3B82F6' },
  { name: 'Pure Platinum', hex: '#E2E8F0' },
];

export const CustomizerModal: React.FC = () => {
  const { 
    customizerOpen, 
    setCustomizerOpen, 
    settings, 
    updateSettings, 
    updateAccentColor 
  } = usePlayer();

  if (!customizerOpen) return null;

  const shelves = settings.homeShelves;
  const npConfig = settings.nowPlayingConfig;

  const toggleShelf = (key: keyof typeof shelves) => {
    updateSettings({
      homeShelves: {
        ...shelves,
        [key]: !shelves[key]
      }
    });
  };

  const setCardStyle = (style: 'portrait' | 'square' | 'compact') => {
    updateSettings({
      homeShelves: {
        ...shelves,
        cardStyle: style
      }
    });
  };

  const setNpLayout = (layout: 'immersive-backdrop' | 'curved-card' | 'vinyl-disc') => {
    updateSettings({
      nowPlayingConfig: {
        ...npConfig,
        layoutStyle: layout
      }
    });
  };

  const toggleNpConfig = (key: keyof typeof npConfig) => {
    updateSettings({
      nowPlayingConfig: {
        ...npConfig,
        [key]: !npConfig[key]
      }
    });
  };

  const resetToDefault = () => {
    updateSettings({
      homeShelves: {
        showRecentlyPlayed: true,
        showQuickPicks: true,
        showMoodTherapy: true,
        showArtistSpotlight: true,
        showAlbumsSingles: true,
        showAllTracks: true,
        cardStyle: 'portrait',
      },
      nowPlayingConfig: {
        layoutStyle: 'immersive-backdrop',
        showLyricsLine: true,
        showVolumeBar: true,
        infiniteAutoplay: true,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div 
        className="w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] text-white"
        style={{ borderColor: `${settings.accentColor}35` }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: settings.accentColor, color: '#000000' }}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Customize Experience</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                  Custom
                </span>
              </h2>
              <p className="text-xs text-white/50">Personalize Home feed, Shelves & Now Playing</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetToDefault}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCustomizerOpen(false)}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Settings Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Section 1: Accent Palette */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-white/70" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Theme Color Accent</h3>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
              {ACCENT_COLORS.map(c => {
                const isSelected = settings.accentColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    onClick={() => updateAccentColor(c.hex)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-200 hover:scale-105"
                    style={{
                      borderColor: isSelected ? c.hex : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? `${c.hex}20` : 'rgba(255,255,255,0.03)'
                    }}
                    title={c.name}
                  >
                    <div 
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform"
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-white/60 font-medium truncate max-w-[54px]">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Home Shelves Visibility */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-white/70" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
                Home Feed Shelves
              </h3>
            </div>

            {/* Card style selection */}
            <div className="mb-3.5 p-1 bg-white/5 rounded-2xl flex items-center gap-1 border border-white/10">
              <button
                onClick={() => setCardStyle('portrait')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  shelves.cardStyle === 'portrait' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Tall Cards (BitChord style)
              </button>
              <button
                onClick={() => setCardStyle('square')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  shelves.cardStyle === 'square' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Square Boxes (One UI)
              </button>
              <button
                onClick={() => setCardStyle('compact')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  shelves.cardStyle === 'compact' ? 'bg-white text-black shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                Compact
              </button>
            </div>

            <div className="space-y-2">
              {[
                { key: 'showRecentlyPlayed', label: 'Recently Played Shelf', desc: 'Atif Aslam & latest listened tracks' },
                { key: 'showQuickPicks', label: 'Quick Picks Grid', desc: 'Fast suggestions & favorites' },
                { key: 'showMoodTherapy', label: 'Rain Therapy & Cozy Tea ☘️🌧️', desc: 'Mood soundscapes for relaxation' },
                { key: 'showArtistSpotlight', label: 'Artist Spotlight (Thaikkudam Bridge / Atif)', desc: 'Dedicated featured artist row' },
                { key: 'showAlbumsSingles', label: 'Albums & Singles Shelf', desc: 'Album artwork carousel' },
                { key: 'showAllTracks', label: 'All Songs List', desc: 'Vertical track rows with format badges' },
              ].map(({ key, label, desc }) => {
                const isEnabled = Boolean(shelves[key as keyof typeof shelves]);
                return (
                  <div
                    key={key}
                    onClick={() => toggleShelf(key as keyof typeof shelves)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[11px] text-white/50">{desc}</p>
                    </div>
                    <div 
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                      style={{ backgroundColor: isEnabled ? settings.accentColor : undefined }}
                    >
                      <div 
                        className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Now Playing Screen Customization */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-white/70" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">
                Now Playing Screen Style
              </h3>
            </div>

            {/* Layout selector */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'immersive-backdrop', label: 'Immersive Backdrop', badge: 'Photo 2' },
                { id: 'curved-card', label: 'Curved One UI Card', badge: 'Clean' },
                { id: 'vinyl-disc', label: '3D Vinyl Disc', badge: 'Retro' },
              ].map(opt => {
                const isSelected = npConfig.layoutStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setNpLayout(opt.id as any)}
                    className="p-3 rounded-2xl border text-left flex flex-col justify-between transition-all"
                    style={{
                      borderColor: isSelected ? settings.accentColor : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? `${settings.accentColor}18` : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <span className="text-[10px] uppercase font-bold text-white/50">{opt.badge}</span>
                    <span className={`text-xs font-bold mt-1 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Now Playing Features */}
            <div className="space-y-2">
              <div 
                onClick={() => toggleNpConfig('showLyricsLine')}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-white/60" />
                  <div>
                    <p className="text-xs font-semibold text-white">Live Lyrics Sneak-Peek</p>
                    <p className="text-[11px] text-white/50">Shows "Finding the right words" or real-time lyric under title</p>
                  </div>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    npConfig.showLyricsLine ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                  style={{ backgroundColor: npConfig.showLyricsLine ? settings.accentColor : undefined }}
                >
                  <div 
                    className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform ${
                      npConfig.showLyricsLine ? 'translate-x-5' : 'translate-x-0'
                    }`} 
                  />
                </div>
              </div>

              <div 
                onClick={() => toggleNpConfig('showVolumeBar')}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-white/60" />
                  <div>
                    <p className="text-xs font-semibold text-white">Dedicated Volume Slider</p>
                    <p className="text-[11px] text-white/50">Quick volume adjustment slider directly on player</p>
                  </div>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    npConfig.showVolumeBar ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                  style={{ backgroundColor: npConfig.showVolumeBar ? settings.accentColor : undefined }}
                >
                  <div 
                    className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform ${
                      npConfig.showVolumeBar ? 'translate-x-5' : 'translate-x-0'
                    }`} 
                  />
                </div>
              </div>

              <div 
                onClick={() => toggleNpConfig('infiniteAutoplay')}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Repeat className="w-4 h-4 text-white/60" />
                  <div>
                    <p className="text-xs font-semibold text-white">Infinite Autoplay Loop (∞)</p>
                    <p className="text-[11px] text-white/50">Keep continuous music playing automatically</p>
                  </div>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    npConfig.infiniteAutoplay ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                  style={{ backgroundColor: npConfig.infiniteAutoplay ? settings.accentColor : undefined }}
                >
                  <div 
                    className={`w-4 h-4 rounded-full bg-black shadow-md transition-transform ${
                      npConfig.infiniteAutoplay ? 'translate-x-5' : 'translate-x-0'
                    }`} 
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-neutral-900/60 flex items-center justify-end">
          <button
            onClick={() => setCustomizerOpen(false)}
            className="px-6 py-2.5 rounded-2xl text-xs font-extrabold text-black transition-transform active:scale-95 shadow-lg"
            style={{ backgroundColor: settings.accentColor }}
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
