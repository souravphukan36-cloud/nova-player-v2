import React from 'react';
import { 
  ChevronDown, 
  Headphones, 
  Sparkles, 
  Check, 
  Radio, 
  RotateCcw, 
  Volume2, 
  Zap, 
  Compass, 
  ShieldCheck, 
  Sliders,
  Layers,
  Activity
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { IEMTargetCurve } from '../types';

interface TargetCurveOption {
  id: IEMTargetCurve;
  name: string;
  subtitle: string;
  badge: string;
  desc: string;
  color: string;
  points: string;
}

const TARGET_CURVES: TargetCurveOption[] = [
  {
    id: 'harman-in-ear',
    name: 'Harman In-Ear 2019',
    subtitle: 'Audiophile Gold Standard',
    badge: 'HARMAN TARGET',
    desc: 'Scientifically validated target for in-ear monitors: deep sub-bass extension, clean vocal separation, and natural ear-gain presence.',
    color: '#10B981', // Emerald
    points: 'M 0 50 Q 40 25 80 50 T 160 52 T 220 28 T 280 45 T 340 38'
  },
  {
    id: 'dynamic-slam',
    name: 'Dynamic Driver Slam',
    subtitle: 'Punchy Sub-Bass & Warmth',
    badge: 'DEEP PUNCH',
    desc: 'Optimized for dynamic driver IEMs with tactile low-end rumble, rich lower midrange warmth, and non-fatiguing smooth highs.',
    color: '#F59E0B', // Amber
    points: 'M 0 20 Q 50 20 90 40 T 160 48 T 220 38 T 280 50 T 340 45'
  },
  {
    id: 'balanced-armature',
    name: 'Multi-BA Knowles Clarity',
    subtitle: 'Vocal Intimacy & Micro-Detail',
    badge: 'VOCAL MASTER',
    desc: 'Precision balanced armature tuning with maximum midrange transparency, rapid transient speed, and micro-detail resolution.',
    color: '#8B5CF6', // Purple
    points: 'M 0 55 Q 50 55 90 52 T 160 50 T 220 18 T 280 32 T 340 28'
  },
  {
    id: 'planar-speed',
    name: 'Planar Magnetic Hologram',
    subtitle: 'Ultrawide Separation & Speed',
    badge: 'PLANAR SPEED',
    desc: 'Linear planar speed with holographic instrument positioning, effortless separation in complex tracks, and low harmonic distortion.',
    color: '#06B6D4', // Cyan
    points: 'M 0 45 Q 50 42 90 46 T 160 48 T 220 25 T 280 25 T 340 22'
  },
  {
    id: 'crinacle-neutral',
    name: 'Crinacle IEF Neutral',
    subtitle: 'Studio Reference Monitor',
    badge: 'FLAT REFERENCE',
    desc: 'Uncolored, highly accurate studio reference monitoring with unboosted mids and linear tonal balance as mastered.',
    color: '#64748B', // Slate
    points: 'M 0 48 Q 50 48 90 49 T 160 50 T 220 35 T 280 44 T 340 42'
  },
  {
    id: 'fun-v-shaped',
    name: 'V-Shaped Euphoria',
    subtitle: 'Exciting Bass & Treble Sparkle',
    badge: 'DYNAMIC GROOVE',
    desc: 'High energy tuning with deep punchy bass, scooped lower mids, and crisp treble sparkle for Pop, Rock, Hip-Hop, and EDM.',
    color: '#EC4899', // Pink
    points: 'M 0 22 Q 50 25 100 45 T 160 62 T 220 24 T 280 22 T 340 20'
  }
];

export const IEMStageModal: React.FC = () => {
  const {
    iemModalOpen,
    setIEMModalOpen,
    iemSoundStage,
    updateIEMSoundStage,
    settings
  } = usePlayer();

  const [abBypass, setAbBypass] = React.useState(false);

  if (!iemModalOpen) return null;

  const currentCurve = TARGET_CURVES.find(c => c.id === iemSoundStage.targetCurve) || TARGET_CURVES[0];
  const accent = iemSoundStage.enabled ? currentCurve.color : '#64748B';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div 
        className="w-full sm:max-w-lg bg-[#08090D] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 bg-[#0C0E14]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-lg"
              style={{ 
                backgroundColor: iemSoundStage.enabled ? `${currentCurve.color}25` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${iemSoundStage.enabled ? currentCurve.color : 'rgba(255,255,255,0.1)'}`
              }}
            >
              <Headphones className="w-5 h-5" style={{ color: iemSoundStage.enabled ? currentCurve.color : '#94A3B8' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">IEM Audiophile Stage</h3>
                {iemSoundStage.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    ACTIVE DSP
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">Dedicated In-Ear Monitor Engine • Separate from EQ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Toggle Switch */}
            <button
              onClick={() => updateIEMSoundStage({ enabled: !iemSoundStage.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                iemSoundStage.enabled ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  iemSoundStage.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <button
              onClick={() => setIEMModalOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scroll">

          {/* Quick Notice Banner */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-white/70 space-y-0.5">
              <span className="font-bold text-white block">Why a Dedicated IEM Engine?</span>
              <p className="text-[11px] text-white/50 leading-relaxed">
                In-ear monitors sit deep in the ear canal and bypass the outer ear (pinna). This creates sound isolation, but also "in-head" soundstage fatigue. This dedicated DSP solves in-ear staging with acoustic crossfeed, seal resonance, and Harman target curves without interfering with your personal EQ bands.
              </p>
            </div>
          </div>

          {/* Frequency Response Target Curve Graph */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-white/50 uppercase">
                Acoustic Frequency Curve • {currentCurve.name}
              </span>
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase"
                style={{ backgroundColor: `${currentCurve.color}20`, color: currentCurve.color }}
              >
                {currentCurve.badge}
              </span>
            </div>

            {/* Target Curve Line Graph */}
            <div className="relative h-20 w-full flex items-center">
              <svg className="w-full h-full" viewBox="0 0 340 70" preserveAspectRatio="none">
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="340" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3"/>
                <line x1="0" y1="35" x2="340" y2="35" stroke="rgba(255,255,255,0.1)"/>
                <line x1="0" y1="50" x2="340" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3"/>

                {/* Active curve with neon glow */}
                <path 
                  d={currentCurve.points} 
                  fill="none" 
                  stroke={iemSoundStage.enabled ? currentCurve.color : '#64748B'} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
            </div>

            {/* Frequency Markers */}
            <div className="flex items-center justify-between text-[9px] font-mono text-white/40 pt-1 border-t border-white/5">
              <span>20Hz (Sub-bass)</span>
              <span>250Hz</span>
              <span>1kHz</span>
              <span>3kHz (Ear Gain)</span>
              <span>16kHz (Air)</span>
            </div>
          </div>

          {/* 1. Target Curve Selector Carousel */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>IEM Audiophile Sound Profile</span>
              </label>
              <span className="text-[10px] font-medium text-white/40">Select your preferred acoustic flavor</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {TARGET_CURVES.map((curve) => {
                const isSelected = iemSoundStage.targetCurve === curve.id;
                return (
                  <button
                    key={curve.id}
                    onClick={() => updateIEMSoundStage({ targetCurve: curve.id, enabled: true })}
                    className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-white/10 border-white/30 shadow-lg scale-[1.02]' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white/70 hover:text-white'
                    }`}
                    style={{
                      borderColor: isSelected ? curve.color : undefined
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: curve.color }}
                        />
                        {isSelected && (
                          <Check className="w-3.5 h-3.5" style={{ color: curve.color }} />
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{curve.name}</h4>
                      <p className="text-[10px] text-white/50 leading-tight mt-0.5">{curve.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-white/40 mt-2 italic px-1">
              "{currentCurve.desc}"
            </p>
          </div>

          {/* 2. In-Ear Seal Sub-Bass Rumble Slider */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>In-Ear Seal Sub-Bass Rumble (35Hz–55Hz)</span>
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {iemSoundStage.subBassRumble}%
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-normal">
              Emulates the deep acoustic visceral resonance transferred directly into the ear canal by silicone or memory foam ear tips.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={iemSoundStage.subBassRumble}
              onChange={(e) => updateIEMSoundStage({ subBassRumble: Number(e.target.value), enabled: true })}
              className="w-full accent-amber-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3. Micro-Detail Treble Air Shimmer Slider */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Micro-Detail Air Shimmer (14kHz–18kHz)</span>
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {iemSoundStage.trebleAir}%
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-normal">
              Reveals microscopic vocal breath, acoustic guitar finger slides, and delicate cymbal decay often damped by in-ear nozzle filters.
            </p>
            <input
              type="range"
              min="0"
              max="100"
              value={iemSoundStage.trebleAir}
              onChange={(e) => updateIEMSoundStage({ trebleAir: Number(e.target.value), enabled: true })}
              className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* 4. Binaural Out-Of-Head Crossfeed Soundstage Expander */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Binaural Out-Of-Head Soundstage (Crossfeed)</span>
              </label>
              <span className="text-[10px] uppercase font-bold text-purple-300 font-mono">
                {iemSoundStage.crossfeed}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-normal">
              Removes hard-panned stereo fatigue by applying subtle interaural delay (ITD), projecting instruments in front of your head like physical studio speakers.
            </p>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(['off', 'subtle', 'studio', 'holographic'] as const).map((mode) => {
                const active = iemSoundStage.crossfeed === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => updateIEMSoundStage({ crossfeed: mode, enabled: true })}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold capitalize transition-all ${
                      active 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. IEM Driver Impedance Matcher */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>IEM Driver Sensitivity Matcher</span>
              </label>
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                {iemSoundStage.driverImpedance}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-normal">
              Optimizes the output gain stage for ultra-sensitive Chi-Fi IEMs or high-impedance studio monitors.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'high-sensitivity', label: '16Ω High Sensitivity', sub: 'Zero Hiss Floor' },
                { id: 'standard', label: '32Ω Standard', sub: 'Balanced Unity' },
                { id: 'high-drive', label: 'High Drive', sub: '+2dB Dynamic Headroom' }
              ].map((imp) => {
                const active = iemSoundStage.driverImpedance === imp.id;
                return (
                  <button
                    key={imp.id}
                    onClick={() => updateIEMSoundStage({ driverImpedance: imp.id as any, enabled: true })}
                    className={`py-2.5 px-2 rounded-xl text-center transition-all border ${
                      active 
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold' 
                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{imp.label}</span>
                    <span className="text-[9px] text-white/40 block mt-0.5">{imp.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom Quick Bar: Instant A/B Comparison & Reset */}
        <div className="p-4 border-t border-white/10 bg-[#0C0E14] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              updateIEMSoundStage({
                enabled: false,
                targetCurve: 'harman-in-ear',
                crossfeed: 'studio',
                subBassRumble: 60,
                trebleAir: 50,
                driverImpedance: 'standard'
              });
            }}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white py-2 px-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset IEM</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIEMModalOpen(false)}
              className="py-2.5 px-6 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 active:scale-95 transition-all shadow-lg"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
