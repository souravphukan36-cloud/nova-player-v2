import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Volume2, 
  VolumeX,
  Volume1,
  RotateCw, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Sliders,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';

export const NotificationShadeModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    notificationShadeOpen,
    setNotificationShadeOpen,
    setEqualizerOpen,
    setNowPlayingOpen,
    equalizer,
    toggleDolbyAtmos,
    toggleEightDAudio,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    settings,
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [time, setTime] = useState('');
  const [wifiActive, setWifiActive] = useState(true);
  const [bluetoothActive, setBluetoothActive] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [showScreenTorch, setShowScreenTorch] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const torchStreamRef = React.useRef<MediaStream | null>(null);

  const triggerToast = (msg: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Toggle Real Phone Camera Flashlight
  const handleToggleTorch = async () => {
    if (flashlight || torchStreamRef.current) {
      // Turn OFF
      try {
        if (torchStreamRef.current) {
          const track = torchStreamRef.current.getVideoTracks()[0];
          if (track) {
            await (track as any).applyConstraints({ advanced: [{ torch: false }] });
            track.stop();
          }
        }
      } catch {}
      torchStreamRef.current = null;
      setFlashlight(false);
      setShowScreenTorch(false);
      triggerToast('Flashlight: Turned OFF');
    } else {
      // Turn ON real camera flash
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          const track = stream.getVideoTracks()[0];
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities && 'torch' in capabilities) {
            await (track as any).applyConstraints({ advanced: [{ torch: true }] });
            torchStreamRef.current = stream;
            setFlashlight(true);
            triggerToast('Real Phone Camera Flashlight: ON 🔦');
            return;
          }
        }
      } catch (err) {
        console.warn('Camera torch not accessible:', err);
      }
      // Fallback to high brightness Screen Torch
      setShowScreenTorch(true);
      setFlashlight(true);
      triggerToast('Screen Torch: Full Brightness Active 💡');
    }
  };

  // Bluetooth Device Connect
  const handleBluetooth = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        triggerToast('Scanning for Bluetooth Headphones / Speakers...');
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service']
        });
        if (device) {
          setBluetoothActive(true);
          triggerToast(`Connected: ${device.name || 'Wireless Audio Device'}`);
        }
      } else {
        setBluetoothActive(!bluetoothActive);
        triggerToast(!bluetoothActive ? 'Bluetooth Audio: Output Connected' : 'Bluetooth Audio: Disconnected');
      }
    } catch {
      triggerToast('Bluetooth Scanner: Cancelled or Paired');
    }
  };

  // Wi-Fi / Data Saver Mode
  const handleWifi = () => {
    const next = !wifiActive;
    setWifiActive(next);
    if (!next) {
      triggerToast('Data Saver: ON (Offline Mode to save mobile 5G data)');
    } else {
      triggerToast('Online Mode: Wi-Fi / 5G Streaming Active');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup camera stream if open
      if (torchStreamRef.current) {
        try {
          const track = torchStreamRef.current.getVideoTracks()[0];
          track?.stop();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!notificationShadeOpen) return null;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-3xl text-white select-none overflow-y-auto animate-in slide-in-from-top duration-300">
      {/* Top Header of Android / One UI Quick Settings */}
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-light tracking-tight text-white">{time || '10:18'}</span>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">Device Controls & Notifications</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              id="notif-btn-eq"
              onClick={() => {
                setNotificationShadeOpen(false);
                setEqualizerOpen(true);
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 active:scale-95 transition-transform"
              title="10-Band Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button 
              id="notif-btn-close"
              onClick={() => setNotificationShadeOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 active:scale-95 transition-transform"
              title="Close Notification Shade"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Toast feedback pill */}
        {toastMessage && (
          <div className="mt-3 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium text-center flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Quick Settings Icon Tiles (Samsung One UI style with 2 rows of real functional controls) */}
        <div className="grid grid-cols-4 gap-2.5 mt-4">
          {/* Wi-Fi / Data Saver Button */}
          <button
            id="panel-btn-wifi"
            onClick={handleWifi}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              wifiActive 
                ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <Wifi className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">Wi-Fi</span>
            <span className="text-[9px] opacity-75">{wifiActive ? 'Online' : 'Data Saver'}</span>
          </button>

          {/* Bluetooth Audio Button */}
          <button
            id="panel-btn-bluetooth"
            onClick={handleBluetooth}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              bluetoothActive 
                ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <Bluetooth className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">Bluetooth</span>
            <span className="text-[9px] opacity-75">{bluetoothActive ? 'Connect' : 'Off'}</span>
          </button>

          {/* Sound / Mute Toggle */}
          <button
            id="panel-btn-sound"
            onClick={() => {
              toggleMute();
              triggerToast(isMuted ? 'Sound: Restored' : 'Sound: Muted');
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              !isMuted 
                ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-rose-500 text-white font-extrabold border-rose-400 shadow-lg shadow-rose-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5 mb-1" /> : <Volume2 className="w-5 h-5 mb-1" />}
            <span className="text-[11px] leading-tight">{isMuted ? 'Muted' : 'Sound'}</span>
            <span className="text-[9px] opacity-75">{isMuted ? 'Silent' : `${Math.round(volume * 100)}%`}</span>
          </button>

          {/* Dolby Atmos Toggle */}
          <button
            id="panel-btn-dolby"
            onClick={() => {
              toggleDolbyAtmos();
              triggerToast(!equalizer.dolbyAtmos ? 'Dolby Atmos: Spatial Audio Enabled' : 'Dolby Atmos: Disabled');
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              equalizer.dolbyAtmos 
                ? 'bg-cyan-500 text-black font-extrabold border-cyan-400 shadow-lg shadow-cyan-500/20' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">Dolby</span>
            <span className="text-[9px] opacity-75">{equalizer.dolbyAtmos ? 'Atmos ON' : 'Off'}</span>
          </button>

          {/* 8D Audio Toggle */}
          <button
            id="panel-btn-8d"
            onClick={() => {
              toggleEightDAudio();
              triggerToast(!equalizer.eightDAudio ? '8D Spatial Orbit Audio Activated' : '8D Audio Disabled');
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              equalizer.eightDAudio 
                ? 'bg-purple-500 text-white font-extrabold border-purple-400 shadow-lg shadow-purple-500/20' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <Headphones className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">8D Audio</span>
            <span className="text-[9px] opacity-75">{equalizer.eightDAudio ? 'Orbit ON' : 'Off'}</span>
          </button>

          {/* Auto-Rotate Button */}
          <button
            id="panel-btn-rotate"
            onClick={() => {
              const next = !autoRotate;
              setAutoRotate(next);
              triggerToast(next ? 'Auto-Rotate: On' : 'Portrait Lock: On');
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              autoRotate 
                ? 'bg-emerald-500 text-black font-extrabold border-emerald-400' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <RotateCw className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">Rotate</span>
            <span className="text-[9px] opacity-75">{autoRotate ? 'Auto' : 'Locked'}</span>
          </button>

          {/* Real Phone Torch / Flashlight Button */}
          <button
            id="panel-btn-torch"
            onClick={handleToggleTorch}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 border ${
              flashlight 
                ? 'bg-amber-400 text-black font-extrabold border-amber-300 shadow-lg shadow-amber-400/20' 
                : 'bg-white/10 text-white/60 border-white/5'
            }`}
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-tight">Torch</span>
            <span className="text-[9px] opacity-75">{flashlight ? 'Flash ON' : 'Off'}</span>
          </button>

          {/* SoundAlive / High Res Audio */}
          <button
            id="panel-btn-hires"
            onClick={() => {
              setNotificationShadeOpen(false);
              setEqualizerOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/80 border border-white/5 active:scale-95 transition-all"
          >
            <Sliders className="w-5 h-5 mb-1 text-emerald-400" />
            <span className="text-[11px] leading-tight">SoundAlive</span>
            <span className="text-[9px] text-emerald-400">10-Band</span>
          </button>
        </div>
      </div>

      {/* Media Notification Card (Samsung One UI Media Player) */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between text-xs text-white/60 mb-2 px-1">
          <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Playback Output
          </span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80 font-mono">
            {bluetoothActive ? 'Headphones' : 'Built-in Speaker'}
          </span>
        </div>

        {currentTrack ? (
          <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/95 border border-white/15 shadow-2xl space-y-3.5">
            <div className="flex items-center gap-3.5">
              {/* Cover Art with Real Image */}
              <div 
                onClick={() => {
                  setNotificationShadeOpen(false);
                  setNowPlayingOpen(true);
                }}
                className="w-14 h-14 rounded-2xl flex-shrink-0 cursor-pointer shadow-lg overflow-hidden relative group"
                style={{ background: currentTrack.coverArt }}
              >
                {currentTrack.coverArt && (currentTrack.coverArt.startsWith('http') || currentTrack.coverArt.startsWith('blob:') || currentTrack.coverArt.startsWith('data:')) ? (
                  <img 
                    src={currentTrack.coverArt} 
                    alt={currentTrack.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    referrerPolicy="no-referrer" 
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold">
                  {isPlaying ? '▶' : '♫'}
                </div>
              </div>

              <div 
                onClick={() => {
                  setNotificationShadeOpen(false);
                  setNowPlayingOpen(true);
                }}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    NOVA Music
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-white/70 uppercase">
                    {currentTrack.format}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white truncate tracking-tight mt-0.5">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-white/60 truncate">
                  {currentTrack.artist} • {currentTrack.album}
                </p>
              </div>
            </div>

            {/* Notification Seek bar */}
            <div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-emerald-400"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Notification Controls */}
            <div className="flex items-center justify-center gap-7 pt-1">
              <button
                id="panel-btn-prev"
                onClick={prevTrack}
                className="p-2.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                id="panel-btn-playpause"
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold shadow-xl active:scale-95 transition-transform bg-emerald-400 hover:bg-emerald-300"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                id="panel-btn-next"
                onClick={nextTrack}
                className="p-2.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-neutral-900/80 text-center text-xs text-white/40 border border-white/5">
            No active media playback. Choose a song to start listening.
          </div>
        )}
      </div>

      {/* Swipe up / close bar */}
      <div className="mt-auto pb-6 text-center">
        <button
          onClick={() => setNotificationShadeOpen(false)}
          className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
        >
          <span>Tap to close panel</span>
        </button>
      </div>

      {/* Fullscreen High-Brightness White Screen Torch Overlay */}
      {showScreenTorch && (
        <div 
          onClick={handleToggleTorch}
          className="fixed inset-0 z-50 bg-white text-black flex flex-col items-center justify-center p-6 text-center cursor-pointer animate-in fade-in"
        >
          <Zap className="w-16 h-16 mb-4 text-amber-500 animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Screen Flashlight ON</h2>
          <p className="text-sm text-neutral-600 mt-1 max-w-xs">Full screen white light. Tap anywhere on the screen to turn off.</p>
          <button
            onClick={handleToggleTorch}
            className="mt-6 px-6 py-3 rounded-full bg-black text-white font-bold text-sm shadow-xl active:scale-95"
          >
            Turn Off Flashlight
          </button>
        </div>
      )}
    </div>
  );
};

