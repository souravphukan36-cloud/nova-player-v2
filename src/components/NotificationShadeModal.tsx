import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Volume2, 
  Sun, 
  Moon, 
  RotateCw, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  Settings as SettingsIcon,
  ChevronDown,
  Sliders
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const NotificationShadeModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    notificationShadeOpen,
    setNotificationShadeOpen,
    setEqualizerOpen,
    setNowPlayingOpen,
    settings,
  } = usePlayer();

  const [time, setTime] = useState('');
  const [wifiActive, setWifiActive] = useState(true);
  const [bluetoothActive, setBluetoothActive] = useState(true);
  const [soundMode, setSoundMode] = useState<'sound' | 'vibrate' | 'mute'>('sound');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
  }, []);

  if (!notificationShadeOpen) return null;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-2xl text-white select-none overflow-y-auto animate-in slide-in-from-top duration-300">
      {/* Top Header of Android Quick Settings */}
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tracking-tight text-white">{time || '10:18'}</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setEqualizerOpen(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
              title="Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setNotificationShadeOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
              title="Close Notification Shade"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Settings Icon Tiles (Samsung One UI style) */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => setWifiActive(!wifiActive)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors ${
              wifiActive ? 'text-black font-bold' : 'bg-white/10 text-white/70'
            }`}
            style={{ backgroundColor: wifiActive ? settings.accentColor : undefined }}
          >
            <Wifi className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Wi-Fi</span>
          </button>

          <button
            onClick={() => setSoundMode(s => s === 'sound' ? 'vibrate' : s === 'vibrate' ? 'mute' : 'sound')}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors ${
              soundMode === 'sound' ? 'text-black font-bold' : 'bg-white/10 text-white/70'
            }`}
            style={{ backgroundColor: soundMode === 'sound' ? settings.accentColor : undefined }}
          >
            <Volume2 className="w-5 h-5 mb-1" />
            <span className="text-[11px] capitalize">{soundMode}</span>
          </button>

          <button
            onClick={() => setBluetoothActive(!bluetoothActive)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-colors ${
              bluetoothActive ? 'text-black font-bold' : 'bg-white/10 text-white/70'
            }`}
            style={{ backgroundColor: bluetoothActive ? settings.accentColor : undefined }}
          >
            <Bluetooth className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Bluetooth</span>
          </button>

          <button
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/10 text-white/70"
          >
            <RotateCw className="w-5 h-5 mb-1" />
            <span className="text-[11px]">Auto-rotate</span>
          </button>
        </div>
      </div>

      {/* Media Notification Card */}
      <div className="px-5 py-2">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1.5 px-1">
          <span className="font-semibold uppercase tracking-wider">Media Output • NOVA Player</span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">This phone</span>
        </div>

        {currentTrack ? (
          <div className="p-4 rounded-3xl bg-neutral-900/90 border border-white/15 shadow-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => {
                  setNotificationShadeOpen(false);
                  setNowPlayingOpen(true);
                }}
                className="w-13 h-13 rounded-2xl flex-shrink-0 cursor-pointer shadow-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: currentTrack.coverArt }}
              >
                {isPlaying ? '▶' : '■'}
              </div>

              <div 
                onClick={() => {
                  setNotificationShadeOpen(false);
                  setNowPlayingOpen(true);
                }}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
              </div>

              {/* Close notification button */}
              <button 
                onClick={() => setNotificationShadeOpen(false)}
                className="text-white/40 hover:text-white p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Seek bar */}
            <div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-white"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mt-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Notification Controls */}
            <div className="flex items-center justify-center gap-6 pt-1">
              <button
                onClick={prevTrack}
                className="p-2 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                title="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: settings.accentColor }}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 rounded-full hover:bg-white/10 text-white active:scale-90 transition-transform"
                title="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-neutral-900 text-center text-xs text-white/40">
            No active media playback.
          </div>
        )}
      </div>

      {/* Swipe up bar */}
      <div className="mt-auto pb-6 text-center">
        <button
          onClick={() => setNotificationShadeOpen(false)}
          className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1 px-4 py-2 rounded-full bg-white/5"
        >
          <span>Close Notification Shade</span>
        </button>
      </div>
    </div>
  );
};
