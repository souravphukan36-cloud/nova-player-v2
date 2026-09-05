import React from 'react';
import { ChevronDown, Sliders, Volume2, Sparkles, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { EQPreset } from '../types';

const PRESETS: EQPreset[] = [
  'Normal',
  'Bass Boost',
  'Rock',
  'Pop',
  'Jazz',
  'Classical',
  'EDM',
  'Vocal',
  'Custom',
];

const FREQUENCIES = [
  { label: '60Hz', desc: 'Sub-bass' },
  { label: '230Hz', desc: 'Bass' },
  { label: '910Hz', desc: 'Mid' },
  { label: '3.6kHz', desc: 'Presence' },
  { label: '14kHz', desc: 'Treble' },
];

export const EqualizerModal: React.FC = () => {
  const {
    equalizer,
    equalizerOpen,
    setEqualizerOpen,
    setEQPreset,
    setEQBand,
    setBassBoost,
    setReverb,
    setStereoWidening,
    toggleDolbyAtmos,
    toggleEQEnabled,
    settings,
  } = usePlayer();

  if (!equalizerOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300"
      style={{ backgroundColor: settings.theme === 'amoled' ? '#000000' : '#0E1118' }}
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            id="eq-btn-close"
            onClick={() => setEqualizerOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>NOVA Equalizer</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 uppercase font-mono">
                5-Band DSP
              </span>
            </h2>
            <p className="text-xs text-white/50">Custom 5-Band DSP & Spatial Audio</p>
          </div>
        </div>

        {/* Master EQ Power Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            id="eq-switch-master"
            type="checkbox"
            checked={equalizer.enabled}
            onChange={toggleEQEnabled}
            className="sr-only peer"
          />
          <div 
            className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
            style={{ backgroundColor: equalizer.enabled ? settings.accentColor : undefined }}
          />
        </label>
      </div>

      <div className={`p-6 max-w-lg mx-auto w-full space-y-6 ${!equalizer.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Presets Horizontal Scroll Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Presets</span>
            <span className="text-xs font-medium text-white/40">Active: {equalizer.preset}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {PRESETS.map((p) => {
              const isSelected = equalizer.preset === p;
              return (
                <button
                  key={p}
                  onClick={() => setEQPreset(p)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-black font-bold shadow-md scale-105'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                  style={{ backgroundColor: isSelected ? settings.accentColor : undefined }}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Vertical Graphical Equalizer */}
        <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">5-Band Equalizer</span>
            <span className="text-[11px] font-mono text-white/40">Scale: -12dB to +12dB</span>
          </div>

          <div className="grid grid-cols-5 gap-2 h-44 items-center justify-items-center">
            {equalizer.bands.map((gain, idx) => (
              <div key={idx} className="flex flex-col items-center justify-between h-full w-full">
                {/* Current dB readout */}
                <span className="text-[11px] font-mono font-semibold" style={{ color: gain !== 0 ? settings.accentColor : '#9ca3af' }}>
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>

                {/* Vertical Slider */}
                <div className="relative flex items-center justify-center h-28 my-1">
                  {/* Zero dB center marker */}
                  <div className="absolute w-6 h-[1px] bg-white/20 z-0 pointer-events-none" />
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={gain}
                    onChange={(e) => setEQBand(idx, parseInt(e.target.value))}
                    className="w-24 h-1.5 bg-white/20 rounded-lg cursor-pointer appearance-none -rotate-90 origin-center"
                    style={{ accentColor: settings.accentColor }}
                  />
                </div>

                {/* Frequency label */}
                <div className="text-center">
                  <p className="text-xs font-bold text-white tracking-tight">{FREQUENCIES[idx].label}</p>
                  <p className="text-[9px] text-white/40">{FREQUENCIES[idx].desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOVA Advanced Effects: Bass Boost & Reverb & Stereo Widening */}
        <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>NOVA Audio Enhancements</span>
            </span>
          </div>

          {/* Bass Boost Dial / Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Bass Boost (Dynamic Low-end)</span>
              </span>
              <span className="font-mono text-white/60">{equalizer.bassBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.bassBoost}
              onChange={(e) => setBassBoost(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
              style={{ accentColor: settings.accentColor }}
            />
          </div>

          {/* Reverb / Concert Hall Effect */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Concert Hall & Reverb Ambience</span>
              </span>
              <span className="font-mono text-white/60">{equalizer.reverb}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.reverb}
              onChange={(e) => setReverb(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
              style={{ accentColor: settings.accentColor }}
            />
          </div>

          {/* Stereo Widening / 3D Surround */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Stereo Widening & 3D Stage</span>
              </span>
              <span className="font-mono text-white/60">{equalizer.stereoWidening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.stereoWidening}
              onChange={(e) => setStereoWidening(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer"
              style={{ accentColor: settings.accentColor }}
            />
          </div>

          {/* Dolby Atmos Simulation Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <p className="text-xs font-semibold text-white">Dolby Atmos Simulation</p>
              <p className="text-[11px] text-white/50">Immersive panoramic soundfield</p>
            </div>
            <button
              onClick={toggleDolbyAtmos}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                equalizer.dolbyAtmos
                  ? 'text-black shadow-md'
                  : 'bg-white/10 text-white/50'
              }`}
              style={{ backgroundColor: equalizer.dolbyAtmos ? settings.accentColor : undefined }}
            >
              {equalizer.dolbyAtmos ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Apply & Reset button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setEQPreset('Normal')}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Reset to Flat
          </button>
          <button
            onClick={() => setEqualizerOpen(false)}
            className="flex-1 py-3 rounded-2xl text-xs font-bold text-black shadow-xl transition-transform active:scale-95"
            style={{ backgroundColor: settings.accentColor }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
