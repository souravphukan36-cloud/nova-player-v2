import React from 'react';
import { X, Check, Headphones, Sparkles, Sliders, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { IEMTargetCurve } from '../types';

interface IEMSoundStageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IEMSoundStageModal: React.FC<IEMSoundStageModalProps> = ({ isOpen, onClose }) => {
  const { iemSoundStage, updateIEMSoundStage } = usePlayer();

  if (!isOpen) return null;

  const TARGET_CURVES: {
    id: IEMTargetCurve;
    name: string;
    badge: string;
    desc: string;
  }[] = [
    {
      id: 'dynamic-slam',
      name: 'Dynamic Slam',
      badge: 'Punchy',
      desc: 'Enhanced sub-bass depth with crystalline highs for modern electronic & pop beats.',
    },
    {
      id: 'harman-in-ear',
      name: 'Harman Target 2019',
      badge: 'Audiophile Ref',
      desc: 'Industry standard reference response with smooth vocal clarity and controlled bass.',
    },
    {
      id: 'crinacle-neutral',
      name: 'Crinacle Neutral',
      badge: 'Studio Monitor',
      desc: 'Mastering response optimized for acoustic instruments, classical and flat separation.',
    },
    {
      id: 'fun-v-shaped',
      name: 'Fun V-Shaped',
      badge: 'Thump & Air',
      desc: 'Rich low-end rumble with elevated high-energy treble sparkle.',
    },
    {
      id: 'balanced-armature',
      name: 'Balanced Armature',
      badge: 'Vocal Micro-Detail',
      desc: 'Elevated mid-range presence for intimate, articulate vocal reproduction.',
    },
    {
      id: 'planar-speed',
      name: 'Planar Speed',
      badge: 'Ultrawide Stage',
      desc: 'Fast transient attack with deep holographic soundstage imaging.',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full sm:max-w-lg bg-[#12151f] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 text-white max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">IEM Audiophile Stage</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {iemSoundStage.enabled ? 'ACTIVE' : 'BYPASS'}
                </span>
              </div>
              <p className="text-xs text-white/50">In-Ear Monitor acoustic tuning & DSP impulse curve</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Active Toggle */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">Enable IEM Acoustic DSP</div>
            <div className="text-xs text-white/50">Apply target frequency curve & spatial soundstage</div>
          </div>
          <button
            onClick={() => updateIEMSoundStage({ enabled: !iemSoundStage.enabled })}
            className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
              iemSoundStage.enabled ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow ${
              iemSoundStage.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Target Curves List */}
        <div className="space-y-2">
          <label className="text-xs font-bold tracking-wider uppercase text-neutral-400 block">
            Select IEM Target Tuning
          </label>
          <div className="space-y-2">
            {TARGET_CURVES.map((curve) => {
              const isSelected = iemSoundStage.targetCurve === curve.id;
              return (
                <div
                  key={curve.id}
                  onClick={() => updateIEMSoundStage({ targetCurve: curve.id, enabled: true })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-950/40'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {curve.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {curve.badge}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">
                      {curve.desc}
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 border-emerald-500 text-black' 
                      : 'border-white/20 text-transparent'
                  }`}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sliders: Sub-Bass Rumble & Treble Air */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/80">Sub-Bass Depth (20Hz–80Hz)</span>
              <span className="font-mono text-emerald-400 font-bold">{iemSoundStage.subBassRumble || 60}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={iemSoundStage.subBassRumble || 60}
              onChange={(e) => updateIEMSoundStage({ subBassRumble: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 rounded-lg bg-white/15 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-white/80">Treble Extension (10kHz–16kHz)</span>
              <span className="font-mono text-emerald-400 font-bold">{iemSoundStage.trebleAir || 50}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={iemSoundStage.trebleAir || 50}
              onChange={(e) => updateIEMSoundStage({ trebleAir: Number(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 rounded-lg bg-white/15 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2 text-[11px] text-white/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Real-time WebAudio Biquad & Convolution DSP Filter Active</span>
        </div>
      </div>
    </div>
  );
};
