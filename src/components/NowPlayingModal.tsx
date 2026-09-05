import React, { useState } from 'react';
import { 
  ChevronDown, 
  Sliders, 
  Moon, 
  Heart, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ListMusic, 
  FileText, 
  Info,
  Trash2,
  GripVertical
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { WaveformVisualizer } from './WaveformVisualizer';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    queueIndex,
    nowPlayingOpen,
    setNowPlayingOpen,
    setEqualizerOpen,
    setSleepTimerOpen,
    queueOpen,
    setQueueOpen,
    lyricsOpen,
    setLyricsOpen,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    setShuffle,
    setRepeat,
    reorderQueue,
    removeFromQueue,
    clearQueue,
    playTrack,
    sleepTimer,
    settings,
  } = usePlayer();

  const [showTrackDetails, setShowTrackDetails] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<'mirror' | 'wave' | 'bars'>('mirror');

  if (!nowPlayingOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find active lyric line
  const activeLyricIndex = currentTrack.lyrics
    ? currentTrack.lyrics.reduce((acc, curr, idx) => {
        if (currentTime >= curr.time) return idx;
        return acc;
      }, 0)
    : -1;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden animate-in fade-in slide-in-from-bottom duration-300"
      style={{ backgroundColor: settings.theme === 'amoled' ? '#000000' : '#0B0D13' }}
    >
      {/* Background Ambient Glow */}
      <div 
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[140px] opacity-20 pointer-events-none"
        style={{ background: settings.accentColor }}
      />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <button
          id="np-btn-collapse"
          onClick={() => setNowPlayingOpen(false)}
          className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Playing From Library
          </span>
          <p className="text-xs font-medium text-white/80 truncate max-w-[200px]">
            {queueIndex + 1} of {queue.length} in Queue
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="np-btn-sleep"
            onClick={() => setSleepTimerOpen(true)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
              sleepTimer.remainingSeconds !== null ? 'text-amber-400' : 'text-white/70 hover:text-white'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-5 h-5" />
          </button>

          <button
            id="np-btn-eq"
            onClick={() => setEqualizerOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="NOVA Equalizer"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            id="np-btn-info"
            onClick={() => setShowTrackDetails(!showTrackDetails)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Track Details"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Artwork / Visualizer / Lyrics / Queue View */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 overflow-y-auto no-scrollbar">
        {lyricsOpen ? (
          // Synced Lyrics View
          <div className="flex-1 flex flex-col justify-center py-4 text-center">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Synchronized Lyrics</span>
              <button 
                onClick={() => setLyricsOpen(false)}
                className="text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              >
                Close Lyrics
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4 max-h-[360px] overflow-y-auto no-scrollbar py-8">
              {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
                currentTrack.lyrics.map((lyric, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => seek(lyric.time)}
                      className={`block w-full text-center transition-all duration-300 font-medium ${
                        isActive
                          ? 'text-lg md:text-xl font-bold scale-105'
                          : 'text-sm text-white/40 hover:text-white/70'
                      }`}
                      style={{ color: isActive ? settings.accentColor : undefined }}
                    >
                      {lyric.text}
                    </button>
                  );
                })
              ) : (
                <div className="text-white/40 py-12">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No synchronized lyrics available for this track.</p>
                </div>
              )}
            </div>
          </div>
        ) : queueOpen ? (
          // Queue Management Drawer
          <div className="flex-1 flex flex-col py-2 max-h-[420px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Up Next</h3>
                <span className="text-xs text-white/50">{queue.length} tracks in queue</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearQueue}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={() => setQueueOpen(false)}
                  className="text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-1">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                      isCurrent ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <div 
                      onClick={() => playTrack(track, queue)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: track.coverArt }}
                      >
                        {isCurrent && isPlaying ? '▶' : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : 'text-white/80'}`}
                          style={{ color: isCurrent ? settings.accentColor : undefined }}
                        >
                          {track.title}
                        </p>
                        <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/40 font-mono">{formatTime(track.duration)}</span>
                      {queue.length > 1 && (
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="p-1.5 text-white/40 hover:text-rose-400 transition-colors"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="p-1 text-white/30 cursor-grab">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Standard Artwork & Live Visualizer
          <div className="flex flex-col items-center justify-center my-auto">
            {/* Album Artwork Card */}
            <div className="relative group w-64 h-64 sm:w-72 sm:h-72 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-transform duration-300">
              <div 
                className="absolute inset-0"
                style={{ background: currentTrack.coverArt }}
              />

              {/* Vinyl Groove Rings Simulation */}
              <div className="absolute inset-0 rounded-3xl border-[8px] border-white/5 pointer-events-none" />
              <div className="absolute inset-4 rounded-2xl border-[1px] border-white/10 pointer-events-none" />

              {/* Center Vinyl Label */}
              <div className="relative w-20 h-20 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-center p-2 shadow-xl">
                <div className="w-5 h-5 rounded-full bg-black border border-white/40 shadow-inner" />
              </div>
            </div>

            {/* Interactive Live Waveform Visualizer */}
            <div className="w-full max-w-xs mt-6 px-2">
              <div className="flex items-center justify-between mb-1 text-[10px] text-white/40 uppercase font-semibold">
                <span>SoundAlive Spectrum</span>
                <button
                  onClick={() => setVisualizerMode(m => m === 'mirror' ? 'wave' : m === 'wave' ? 'bars' : 'mirror')}
                  className="hover:text-white transition-colors"
                >
                  Mode: {visualizerMode}
                </button>
              </div>
              <WaveformVisualizer mode={visualizerMode} className="w-full h-12 bg-white/5 p-1 border border-white/5" />
            </div>
          </div>
        )}

        {/* Track Details Modal popup */}
        {showTrackDetails && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-white/15 my-2 text-xs space-y-1.5 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-bold text-white">Track Metadata</span>
              <button 
                onClick={() => setShowTrackDetails(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-white/70 pt-1">
              <div><span className="text-white/40">Format:</span> {currentTrack.format.toUpperCase()}</div>
              <div><span className="text-white/40">Bitrate:</span> {currentTrack.bitRate || '320 kbps'}</div>
              <div><span className="text-white/40">Genre:</span> {currentTrack.genre}</div>
              <div><span className="text-white/40">Play Count:</span> {currentTrack.playCount} times</div>
              <div className="col-span-2 truncate"><span className="text-white/40">Folder:</span> {currentTrack.folder}</div>
            </div>
          </div>
        )}

        {/* Title, Artist, and Favorite button */}
        <div className="flex items-center justify-between mt-4">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-xl font-extrabold text-white truncate tracking-tight">
              {currentTrack.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-medium text-white/60 truncate">
                {currentTrack.artist} • {currentTrack.album}
              </p>
              <span 
                className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-black flex-shrink-0"
                style={{ backgroundColor: settings.accentColor }}
              >
                {currentTrack.format}
              </span>
            </div>
          </div>

          <button
            id="np-btn-favorite"
            onClick={() => toggleFavorite(currentTrack.id)}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-transform active:scale-125 ${
              currentTrack.isFavorite ? 'text-rose-500' : 'text-white/60 hover:text-white'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="mt-4">
          <div className="relative group">
            <input
              id="np-slider-seek"
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg cursor-pointer accent-white"
            />
            {/* Custom filled track */}
            <div 
              className="absolute top-0 left-0 h-1.5 rounded-lg pointer-events-none transition-all"
              style={{ 
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                backgroundColor: settings.accentColor 
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
        <div className="flex items-center justify-between mt-4 px-2">
          <button
            id="np-btn-shuffle"
            onClick={() => setShuffle(shuffle === 'off' ? 'all' : 'off')}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-colors ${
              shuffle === 'all' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
            style={{ color: shuffle === 'all' ? settings.accentColor : undefined }}
            title={`Shuffle: ${shuffle}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            id="np-btn-prev"
            onClick={prevTrack}
            className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            title="Previous"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            id="np-btn-play"
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full flex items-center justify-center text-black font-extrabold shadow-2xl transition-transform active:scale-95"
            style={{ backgroundColor: settings.accentColor }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            id="np-btn-next"
            onClick={nextTrack}
            className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            title="Next"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            id="np-btn-repeat"
            onClick={() => {
              if (repeat === 'off') setRepeat('all');
              else if (repeat === 'all') setRepeat('one');
              else setRepeat('off');
            }}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-colors ${
              repeat !== 'off' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
            style={{ color: repeat !== 'off' ? settings.accentColor : undefined }}
            title={`Repeat: ${repeat}`}
          >
            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 mt-4 px-3 py-1 bg-white/5 rounded-xl">
          <button 
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            id="np-slider-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-white"
          />
          <span className="text-[10px] font-mono text-white/50 w-7 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Bottom Drawer Actions: Lyrics & Queue */}
        <div className="flex items-center justify-around mt-4 pt-3 pb-6 border-t border-white/10">
          <button
            id="np-btn-lyrics-toggle"
            onClick={() => {
              setLyricsOpen(!lyricsOpen);
              setQueueOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              lyricsOpen ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>

          <button
            id="np-btn-queue-toggle"
            onClick={() => {
              setQueueOpen(!queueOpen);
              setLyricsOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              queueOpen ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue ({queue.length})</span>
          </button>

          <button
            id="np-btn-eq-shortcut"
            onClick={() => setEqualizerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Equalizer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
