import React from 'react';
import { ChevronDown, Sliders, Volume2, Sparkles, Check, Headphones, Radio, RotateCcw, Compass, Zap, Disc, Mic } from 'lucide-react';
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

const FREQUENCIES_5 = [
  { label: '60Hz', desc: 'Sub-bass' },
  { label: '230Hz', desc: 'Bass' },
  { label: '910Hz', desc: 'Mid' },
  { label: '3.6kHz', desc: 'Presence' },
  { label: '14kHz', desc: 'Treble' },
];

const FREQUENCIES_10 = [
  { label: '31Hz', desc: 'Sub-low' },
  { label: '62Hz', desc: 'Sub-bass' },
  { label: '125Hz', desc: 'Bass' },
  { label: '250Hz', desc: 'Low-mid' },
  { label: '500Hz', desc: 'Mid' },
  { label: '1kHz', desc: 'Center' },
  { label: '2kHz', desc: 'Upper-mid' },
  { label: '4kHz', desc: 'Presence' },
  { label: '8kHz', desc: 'Brilliance' },
  { label: '16kHz', desc: 'Air' },
];

// Touch and Pointer friendly Vertical EQ Band Column
const EQBandColumn: React.FC<{
  label: string;
  desc: string;
  gain: number;
  idx: number;
  accentColor: string;
  onChange: (newGain: number) => void;
}> = ({ label, desc, gain, idx, accentColor, onChange }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const calculateDbFromEvent = (clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;
    const offsetY = Math.max(0, Math.min(height, clientY - rect.top));
    // 0 at bottom (-12), height at top (+12)
    const ratio = 1 - (offsetY / height);
    const db = Math.round((ratio * 24) - 12);
    onChange(Math.max(-12, Math.min(12, db)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    calculateDbFromEvent(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    calculateDbFromEvent(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Percentage from bottom (0% = -12dB, 50% = 0dB, 100% = +12dB)
  const pct = Math.max(0, Math.min(100, ((gain + 12) / 24) * 100));

  return (
    <div className="flex flex-col items-center justify-between h-full w-full select-none">
      {/* dB readout & tap to reset */}
      <button
        onClick={() => onChange(0)}
        title="Tap to reset to 0dB"
        className="text-[10px] font-mono font-bold hover:scale-110 active:scale-95 transition-transform"
        style={{ color: gain !== 0 ? accentColor : '#9ca3af' }}
      >
        {gain > 0 ? `+${gain}` : gain}
      </button>

      {/* Quick increment + */}
      <button
        onClick={() => onChange(Math.min(12, gain + 1))}
        className="w-5 h-4 flex items-center justify-center text-[11px] font-bold text-white/50 hover:text-white active:scale-90"
        title="Increase +1dB"
      >
        +
      </button>

      {/* Vertical Interactive Slider Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
        className="relative w-full min-w-[24px] max-w-[34px] h-28 flex items-center justify-center cursor-pointer touch-none my-0.5 group"
      >
        {/* Track background groove */}
        <div className="w-1.5 h-full rounded-full bg-white/15 relative overflow-hidden">
          {/* Zero center indicator mark */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white/40 -translate-y-1/2 z-10" />

          {/* Active fill bar from 0dB */}
          {gain > 0 && (
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: '50%',
                height: `${(gain / 12) * 50}%`,
                backgroundColor: accentColor,
              }}
            />
          )}
          {gain < 0 && (
            <div
              className="absolute left-0 right-0 bg-rose-500"
              style={{
                top: '50%',
                height: `${(Math.abs(gain) / 12) * 50}%`,
              }}
            />
          )}
        </div>

        {/* Center line marker across width */}
        <div className="absolute top-1/2 left-1 right-1 h-[1px] bg-white/20 pointer-events-none -translate-y-1/2" />

        {/* Draggable Knob Thumb */}
        <div
          className={`absolute w-4 h-4 rounded-full bg-white shadow-lg pointer-events-none transition-transform ${
            isDragging ? 'scale-125 ring-2 ring-emerald-400' : 'group-hover:scale-110'
          }`}
          style={{
            bottom: `calc(${pct}% - 8px)`,
          }}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full mx-auto mt-[5px]"
            style={{ backgroundColor: gain !== 0 ? accentColor : '#6b7280' }}
          />
        </div>
      </div>

      {/* Quick decrement - */}
      <button
        onClick={() => onChange(Math.max(-12, gain - 1))}
        className="w-5 h-4 flex items-center justify-center text-[11px] font-bold text-white/50 hover:text-white active:scale-90"
        title="Decrease -1dB"
      >
        -
      </button>

      {/* Frequency label & description */}
      <div className="text-center mt-1">
        <p className="text-[10px] sm:text-xs font-bold text-white tracking-tight">{label}</p>
        <p className="text-[8px] text-white/40 leading-none">{desc}</p>
      </div>
    </div>
  );
};

// Real-time 360° Binaural Radar Visualizer
const RadarVisualizer: React.FC<{ active: boolean; mode: 'orbit' | 'pendulum' }> = ({ active, mode }) => {
  const [angle, setAngle] = React.useState(0);
  const [pan, setPan] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    const handleAngle = (e: any) => {
      if (e.detail) {
        setAngle(e.detail.angle);
        setPan(e.detail.pan);
      }
    };
    window.addEventListener('nova-360-angle', handleAngle);
    return () => window.removeEventListener('nova-360-angle', handleAngle);
  }, [active]);

  if (!active) return null;

  // Calculate radar point on 100x100 box with center (50, 50)
  const radius = 35;
  const x = mode === 'pendulum' 
    ? 50 + pan * radius 
    : 50 + Math.sin(angle) * radius;
  const y = mode === 'pendulum'
    ? 50 - Math.abs(Math.cos(angle)) * (radius * 0.4)
    : 50 - Math.cos(angle) * radius;

  const deg = Math.round((angle * (180 / Math.PI)) % 360);

  return (
    <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center select-none">
      {/* Concentric radar rings */}
      <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping opacity-20 pointer-events-none" />
      <div className="absolute inset-2 rounded-full border border-purple-500/25 bg-purple-950/20" />
      <div className="absolute inset-6 rounded-full border border-dashed border-purple-500/35" />
      <div className="absolute inset-10 rounded-full border border-purple-500/20" />

      {/* Axis crosshairs */}
      <div className="absolute w-full h-[1px] bg-purple-500/20" />
      <div className="absolute h-full w-[1px] bg-purple-500/20" />

      {/* Direction indicators */}
      <span className="absolute top-1 text-[8px] font-mono text-purple-300/70 font-bold">FRONT</span>
      <span className="absolute bottom-1 text-[8px] font-mono text-purple-300/70 font-bold">BEHIND</span>
      <span className="absolute left-1 text-[8px] font-mono text-purple-300/70 font-bold">L</span>
      <span className="absolute right-1 text-[8px] font-mono text-purple-300/70 font-bold">R</span>

      {/* Center Listener Head */}
      <div className="relative z-10 w-11 h-11 rounded-full bg-purple-900/90 border border-purple-400/60 flex flex-col items-center justify-center shadow-lg shadow-purple-950/80">
        <Headphones className="w-5 h-5 text-purple-200" />
        <span className="text-[7px] font-extrabold text-purple-300 tracking-tighter">LISTENER</span>
      </div>

      {/* Orbiting Sound Source */}
      <div 
        className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/90 transition-all duration-75 flex items-center justify-center pointer-events-none z-20"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>

      {/* Degree readout */}
      <div className="absolute bottom-1 right-1 text-[9px] font-mono text-purple-300 font-bold bg-purple-950/90 px-1.5 py-0.5 rounded border border-purple-500/40 shadow">
        {deg}°
      </div>
    </div>
  );
};

export const EqualizerModal: React.FC = () => {
  const {
    equalizer,
    equalizerOpen,
    setEqualizerOpen,
    setEQPreset,
    setEQBand,
    setEQBandMode,
    setBassBoost,
    setReverb,
    setStereoWidening,
    toggleDolbyAtmos,
    setDolbyProfile,
    setDolbyDialogueClarity,
    toggleEightDAudio,
    setEightDSpeed,
    setEightDDistance,
    setEightDMode,
    toggleEQEnabled,
    settings,
  } = usePlayer();

  if (!equalizerOpen) return null;

  const is10Band = (equalizer.bandMode || '10-band') === '10-band';
  const frequencies = is10Band ? FREQUENCIES_10 : FREQUENCIES_5;

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
              <span>NOVA SoundAlive</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                {is10Band ? '10-Band Pro' : '5-Band Standard'}
              </span>
            </h2>
            <p className="text-xs text-white/50">Studio Equalizer & 8D Spatial Audio</p>
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

      <div className={`p-5 sm:p-6 max-w-lg mx-auto w-full space-y-5 ${!equalizer.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Band Mode Switcher: 10-Band vs 5-Band */}
        <div className="flex items-center justify-between bg-neutral-900/90 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setEQBandMode('10-band')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              is10Band ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            10-Band Studio DSP (SoundAlive)
          </button>
          <button
            onClick={() => setEQBandMode('5-band')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !is10Band ? 'bg-emerald-500 text-black shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            5-Band Simple
          </button>
        </div>

        {/* Presets Horizontal Scroll Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Presets</span>
            <span className="text-xs font-medium text-emerald-400">Preset: {equalizer.preset}</span>
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

        {/* Vertical Graphical Equalizer Sliders */}
        <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                {is10Band ? '10-Band Pro Studio DSP' : '5-Band Standard Sliders'}
              </span>
              <p className="text-[10px] text-white/40">Drag sliders vertically, tap + / - to fine-tune</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  frequencies.forEach((_, idx) => setEQBand(idx, 0));
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/70 hover:text-white transition-colors"
                title="Reset all bands to 0dB"
              >
                Reset Flat
              </button>
              <span className="text-[10px] font-mono text-white/40">±12dB</span>
            </div>
          </div>

          <div className={`grid ${is10Band ? 'grid-cols-10 gap-0.5 sm:gap-1' : 'grid-cols-5 gap-2'} h-56 items-center justify-items-center`}>
            {frequencies.map((freq, idx) => {
              const gain = equalizer.bands[idx] ?? 0;
              return (
                <EQBandColumn
                  key={idx}
                  idx={idx}
                  label={freq.label}
                  desc={freq.desc}
                  gain={gain}
                  accentColor={settings.accentColor}
                  onChange={(newGain) => setEQBand(idx, newGain)}
                />
              );
            })}
          </div>
        </div>

        {/* 360° / 8D Spatial Audio Engine Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/90 border border-purple-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">360° / 8D Spatial Audio</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 font-mono font-bold">
                    Binaural Engine
                  </span>
                </div>
                <p className="text-[11px] text-white/60">360° dynamic spatial orbit with pinna head-shadow filter</p>
              </div>
            </div>

            <button
              onClick={toggleEightDAudio}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                equalizer.eightDAudio 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40 scale-105' 
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {equalizer.eightDAudio ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Interactive options when 8D Audio is turned on */}
          {equalizer.eightDAudio ? (
            <div className="space-y-4 pt-2 border-t border-purple-500/20 animate-in fade-in duration-300">
              {/* Live 360° Radar */}
              <RadarVisualizer active={equalizer.eightDAudio} mode={equalizer.eightDMode || 'orbit'} />

              {/* Mode Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-300/80">Motion Trajectory</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEightDMode('orbit')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      (equalizer.eightDMode || 'orbit') === 'orbit'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <Disc className="w-3.5 h-3.5" />
                    <span>360° Orbit</span>
                  </button>
                  <button
                    onClick={() => setEightDMode('pendulum')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      equalizer.eightDMode === 'pendulum'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>180° Pendulum</span>
                  </button>
                </div>
              </div>

              {/* Speed Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-300/80">Rotation Speed</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'medium', 'fast'] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setEightDSpeed(spd)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        (equalizer.eightDSpeed || 'medium') === spd
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {spd === 'slow' ? 'Slow (12s)' : spd === 'medium' ? 'Normal (6s)' : 'Fast (3s)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soundstage Distance / Depth */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-purple-300/80">Virtual Soundstage Depth</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['near', 'medium', 'far'] as const).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setEightDDistance(dist)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all ${
                        (equalizer.eightDDistance || 'medium') === dist
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {dist === 'near' ? 'In-Ear' : dist === 'medium' ? 'Balanced' : 'Concert'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-purple-300/50 italic">
              Tap ACTIVE above to simulate immersive 360° audio circling your head.
            </p>
          )}
        </div>

        {/* Dolby Atmos Cinema & Multiband Soundstage Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/90 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dolby Atmos Simulation</h4>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    Spatial HDR
                  </span>
                </div>
                <p className="text-[11px] text-white/60">Multiband studio dynamic compression & dialogue clarity</p>
              </div>
            </div>

            <button
              onClick={toggleDolbyAtmos}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                equalizer.dolbyAtmos
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 scale-105'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {equalizer.dolbyAtmos ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {equalizer.dolbyAtmos && (
            <div className="space-y-4 pt-2 border-t border-cyan-500/20 animate-in fade-in duration-300">
              {/* Profile Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-cyan-300/80">Atmos Sound Profile</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDolbyProfile('cinema')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      (equalizer.dolbyProfile || 'cinema') === 'cinema'
                        ? 'bg-cyan-400 text-black shadow-md'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    Cinema
                  </button>
                  <button
                    onClick={() => setDolbyProfile('music')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      equalizer.dolbyProfile === 'music'
                        ? 'bg-cyan-400 text-black shadow-md'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    Music
                  </button>
                  <button
                    onClick={() => setDolbyProfile('vocal')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      equalizer.dolbyProfile === 'vocal'
                        ? 'bg-cyan-400 text-black shadow-md'
                        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    Vocal
                  </button>
                </div>
              </div>

              {/* Profile Description */}
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200">
                {(equalizer.dolbyProfile || 'cinema') === 'cinema' && (
                  <span>🎬 <b>Cinema Profile:</b> Expansive sub-bass weight, open panoramic soundstage, and theatrical dynamic range compression.</span>
                )}
                {equalizer.dolbyProfile === 'music' && (
                  <span>🎵 <b>Music Profile:</b> Punchy low-end transients, crisp presence air, and studio master compression.</span>
                )}
                {equalizer.dolbyProfile === 'vocal' && (
                  <span>🎙️ <b>Vocal Profile:</b> Direct center channel dialogue isolation and high vocal articulation.</span>
                )}
              </div>

              {/* Dialogue Clarity Enhancer Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dialogue & Vocal Clarity</span>
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{equalizer.dolbyDialogueClarity ?? 70}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={equalizer.dolbyDialogueClarity ?? 70}
                  onChange={(e) => setDolbyDialogueClarity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* NOVA Acoustic Enhancements: Bass Boost, Reverb, Stereo Widening */}
        <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acoustic Engine Enhancements</span>
            </span>
          </div>

          {/* Bass Boost Dial / Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Deep Sub-Bass Boost</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{equalizer.bassBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.bassBoost}
              onChange={(e) => setBassBoost(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Reverb / Concert Hall Effect */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Concert Hall & Stage Reverb</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">{equalizer.reverb}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.reverb}
              onChange={(e) => setReverb(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-amber-400"
            />
          </div>

          {/* Stereo Widening / 3D Surround */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/80 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Stereo Widening (Panoramic)</span>
              </span>
              <span className="font-mono text-purple-400 font-bold">{equalizer.stereoWidening}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={equalizer.stereoWidening}
              onChange={(e) => setStereoWidening(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-purple-400"
            />
          </div>
        </div>

        {/* Real-time status & Quick Reset Actions (No intrusive Apply button) */}
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>All adjustments apply instantly in real time</span>
          </div>
          <button
            onClick={() => {
              setEQPreset('Normal');
              frequencies.forEach((_, idx) => setEQBand(idx, 0));
              setBassBoost(0);
              setReverb(0);
              setStereoWidening(0);
            }}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      </div>
    </div>
  );
};

