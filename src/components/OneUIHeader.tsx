import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Bell, Sparkles } from 'lucide-react';

interface OneUIHeaderProps {
  title?: string;
  subtitle?: string;
  onOpenSettings?: () => void;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({ 
  title, 
  subtitle,
}) => {
  const { 
    settings, 
    setEqualizerOpen,
    setIEMModalOpen,
    iemSoundStage,
    equalizer,
    requestNotificationPermission, 
  } = usePlayer();

  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';

  // Format the IEM label for top pill
  const getIEMLabel = () => {
    switch (iemSoundStage.targetCurve) {
      case 'dynamic-slam': return 'IEM: DYNAMIC';
      case 'harman-in-ear': return 'IEM: HARMAN';
      case 'crinacle-neutral': return 'IEM: STUDIO';
      case 'fun-v-shaped': return 'IEM: V-SHAPE';
      case 'balanced-armature': return 'IEM: VOCAL';
      case 'planar-speed': return 'IEM: PLANAR';
      default: return 'IEM: DYNAMIC';
    }
  };

  return (
    <header className="w-full px-4 sm:px-6 pt-2.5 pb-2 flex flex-col gap-2 select-none shrink-0 z-20">
      {/* 1. Top Status Bar Pills (IEM curve + 10-Band DSP) */}
      <div className="flex items-center justify-between">
        {/* Left: IEM Curve Pill */}
        <button
          onClick={() => setIEMModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-[#062118]/80 text-emerald-400 hover:bg-[#092f23] active:scale-95 transition-all text-xs font-semibold shadow-sm"
          title="In-Ear Monitor Target Tuning & Soundstage"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tracking-wide text-[11px] font-bold">{getIEMLabel()}</span>
        </button>

        {/* Right: 10-Band DSP Pill */}
        <button
          onClick={() => setEqualizerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-[#081f18]/80 text-white hover:bg-[#0c2e24] active:scale-95 transition-all text-xs font-semibold shadow-sm"
          title="Open 10-Band Studio DSP Equalizer"
        >
          <span className={`w-2 h-2 rounded-full ${equalizer.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500/40'} shrink-0`} />
          <span className="font-mono text-[11px] font-bold text-emerald-300 tracking-wider">10-BAND DSP</span>
        </button>
      </div>

      {/* 2. Brand Identity Row: NOVA NATURAL AUDIO + Live Alert */}
      <div className="flex items-center justify-between pt-0.5">
        {/* Brand Logo & Name (Tap 3x opens Admin Portal) */}
        <div 
          onClick={() => {
            const current = Number(sessionStorage.getItem('logo_taps') || '0') + 1;
            sessionStorage.setItem('logo_taps', String(current));
            if (current >= 3) {
              sessionStorage.removeItem('logo_taps');
              window.location.href = '/admin';
            } else {
              setTimeout(() => sessionStorage.removeItem('logo_taps'), 2000);
            }
          }}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          title="NOVA Natural Audio (Tap 3x to open Admin Portal)"
        >
          {/* Official Squircle Star Logo */}
          <div className="w-9 h-9 rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black flex items-center justify-center shrink-0">
            <img 
              src="/logo.png" 
              alt="NOVA" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className={`text-base font-black tracking-wider uppercase ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              NOVA
            </span>
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">
              NATURAL AUDIO
            </span>
          </div>
        </div>

        {/* Live Alert Green Pill Button */}
        <button
          onClick={() => requestNotificationPermission()}
          title="Enable Live Notification & Lock Screen Controls"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-[#051c14] hover:bg-[#092a1f] text-emerald-400 active:scale-95 transition-all text-xs font-bold shadow-sm"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Live Alert</span>
        </button>
      </div>

      {/* 3. Section Title & Subtitle (Shown on Settings, Library, etc.) */}
      {title ? (
        <div className="mt-1">
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {subtitle}
            </p>
          )}
        </div>
      ) : null}
    </header>
  );
};
