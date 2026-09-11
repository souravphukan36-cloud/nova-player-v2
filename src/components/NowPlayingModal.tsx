import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  Music,
  Plus,
  Trash2,
  GripVertical,
  Infinity,
  Sparkles,
  SlidersHorizontal,
  Car,
  Upload
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { getTrackDynamicPalette, isCoverArtImage, DEFAULT_FALLBACK_ART, getResolvedCoverArt } from '../utils/dynamicColor';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
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
    setCustomizerOpen,
    queueOpen,
    setQueueOpen,
    lyricsOpen,
    setLyricsOpen,
    carModeOpen,
    setCarModeOpen,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleFavorite,
    setShuffle,
    setRepeat,
    removeFromQueue,
    clearQueue,
    playTrack,
    sleepTimer,
    settings,
    updateSettings,
    linkAudioFileToTrack,
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [showTrackDetails, setShowTrackDetails] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartYRef = useRef<number | null>(null);
  const activeLyricRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll active lyric into view (Unconditional hook)
  useEffect(() => {
    if (nowPlayingOpen && lyricsOpen && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime, lyricsOpen, nowPlayingOpen]);

  if (!nowPlayingOpen || !currentTrack) return null;

  const palette = getTrackDynamicPalette(currentTrack);
  const npConfig = settings.nowPlayingConfig;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diffY = e.touches[0].clientY - touchStartYRef.current;
    if (diffY > 0) {
      setDragY(Math.min(150, diffY * 0.7));
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 70) {
      setNowPlayingOpen(false);
    }
    setDragY(0);
    touchStartYRef.current = null;
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRemainingTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '-0:00';
    const rem = Math.max(0, duration - secs);
    const m = Math.floor(rem / 60);
    const s = Math.floor(rem % 60);
    return `-${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find active lyric line
  const activeLyricIndex = currentTrack.lyrics
    ? currentTrack.lyrics.reduce((acc, curr, idx) => {
        if (currentTime >= curr.time) return idx;
        return acc;
      }, 0)
    : -1;

  const activeLyricText = currentTrack.lyrics && activeLyricIndex >= 0 
    ? currentTrack.lyrics[activeLyricIndex]?.text 
    : 'Finding the right words...';

  const toggleInfiniteAutoplay = () => {
    updateSettings({
      nowPlayingConfig: {
        ...npConfig,
        infiniteAutoplay: !npConfig.infiniteAutoplay
      },
      autoAdvanceLoop: !npConfig.infiniteAutoplay
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden animate-in fade-in slide-in-from-bottom duration-300"
      style={{ 
        backgroundColor: settings.theme === 'amoled' ? '#000000' : '#0B0D13',
        transform: dragY > 0 ? `translateY(${dragY}px)` : 'none',
        transition: dragY === 0 ? 'transform 0.2s ease-out' : 'none'
      }}
    >
      {/* Dynamic Background: Fullscreen Backdrop or Material You Ambient Mesh Glow */}
      {npConfig.layoutStyle === 'immersive-backdrop' && currentTrack.coverArt ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img 
            src={currentTrack.coverArt} 
            alt="Backdrop" 
            className="w-full h-full object-cover blur-2xl scale-125 opacity-40 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
        </div>
      ) : (
        <>
          <div 
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full blur-[140px] opacity-35 pointer-events-none transition-all duration-700"
            style={{ background: palette.primary || settings.accentColor }}
          />
          <div 
            className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full blur-[120px] opacity-25 pointer-events-none transition-all duration-700"
            style={{ background: palette.glow }}
          />
        </>
      )}

      {/* Top Drag Handle Pill */}
      <div 
        className="relative z-10 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button 
          onClick={() => setNowPlayingOpen(false)}
          className="w-12 h-1.5 rounded-full bg-white/30 hover:bg-white/60 transition-colors"
          title="Drag down or tap to minimize"
        />
      </div>

      {/* Top Bar Navigation */}
      <div className="relative z-10 flex items-center justify-between px-5 py-2">
        <button
          id="np-btn-collapse"
          onClick={() => setNowPlayingOpen(false)}
          className="p-2.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors"
          title="Minimize"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-1">
          <button
            id="np-btn-carmode"
            onClick={() => {
              setNowPlayingOpen(false);
              setCarModeOpen(true);
            }}
            className="p-2.5 rounded-full hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors"
            title="Car / Driving Mode"
          >
            <Car className="w-5 h-5" />
          </button>

          <button
            id="np-btn-customize-player"
            onClick={() => setCustomizerOpen(true)}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Customize Player Style"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" style={{ color: palette.primary || settings.accentColor }} />
          </button>

          <button
            id="np-btn-sleep"
            onClick={() => setSleepTimerOpen(true)}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-colors ${
              sleepTimer.remainingSeconds !== null ? 'text-amber-400' : 'text-white/80 hover:text-white'
            }`}
            title="Sleep Timer"
          >
            <Moon className="w-5 h-5" />
          </button>

          <button
            id="np-btn-eq"
            onClick={() => setEqualizerOpen(true)}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="NOVA Equalizer"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <button
            id="np-btn-info"
            onClick={() => setShowTrackDetails(!showTrackDetails)}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Track Details"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Artwork / Lyrics / Queue View */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 overflow-y-auto no-scrollbar">
        {lyricsOpen ? (
          // Full Synchronized Lyrics View
          <div className="flex-1 flex flex-col justify-center py-4 text-center">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Synchronized Lyrics
              </span>
              <button 
                onClick={() => setLyricsOpen(false)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Close Lyrics
              </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4 max-h-[380px] overflow-y-auto no-scrollbar py-8">
              {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
                currentTrack.lyrics.map((lyric, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <button
                      key={idx}
                      ref={isActive ? activeLyricRef : undefined}
                      onClick={() => seek(lyric.time)}
                      className={`block w-full text-center transition-all duration-300 font-medium ${
                        isActive
                          ? 'text-lg sm:text-xl font-extrabold scale-105'
                          : 'text-sm text-white/40 hover:text-white/70'
                      }`}
                      style={{ color: isActive ? (palette.primary || settings.accentColor) : undefined }}
                    >
                      {lyric.text}
                    </button>
                  );
                })
              ) : (
                <div className="text-white/40 py-12">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Finding the right words...</p>
                </div>
              )}
            </div>
          </div>
        ) : queueOpen ? (
          // Queue Drawer
          <div className="flex-1 flex flex-col py-2 max-h-[440px]">
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
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20"
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
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors ${
                      isCurrent ? 'bg-white/10 border border-white/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <div 
                      onClick={() => playTrack(track, queue)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow"
                        style={{ background: track.coverArt }}
                      >
                        {isCoverArtImage(track.coverArt) ? (
                          <img 
                            src={track.coverArt} 
                            alt="" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              img.onerror = null;
                              img.src = DEFAULT_FALLBACK_ART;
                            }}
                          />
                        ) : (
                          isCurrent && isPlaying ? '▶' : idx + 1
                        )}
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
                      <div className="p-1 text-white/30">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Artwork Stage (Card, Fullscreen Backdrop, or Vinyl Disc)
          <div className="flex flex-col items-center justify-center my-auto w-full">
            {npConfig.layoutStyle === 'vinyl-disc' ? (
              // 3D Vinyl Disc Mode
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                <div 
                  className={`w-full h-full rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '12s', boxShadow: '0 0 35px rgba(0,0,0,0.9)' }}
                >
                  {/* Vinyl Grooves */}
                  <div className="w-4/5 h-4/5 rounded-full border border-neutral-800/80 flex items-center justify-center">
                    <div className="w-3/5 h-3/5 rounded-full border border-neutral-800/60 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                        <img 
                          src={getResolvedCoverArt(currentTrack.coverArt)} 
                          alt={currentTrack.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.onerror = null;
                            img.src = DEFAULT_FALLBACK_ART;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Card / Immersive Artwork
              <div 
                className={`relative group w-64 h-64 sm:w-72 sm:h-72 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-transform duration-300 ${
                  npConfig.layoutStyle === 'immersive-backdrop' ? 'shadow-black/80' : ''
                }`}
              >
                {isCoverArtImage(currentTrack.coverArt) ? (
                  <img
                    src={getResolvedCoverArt(currentTrack.coverArt)}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = DEFAULT_FALLBACK_ART;
                    }}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
                    style={{ background: currentTrack.coverArt || '#1e1e24' }}
                  >
                    <Music className="w-16 h-16 text-white/40 mb-3" />
                    <span className="text-sm font-bold text-white/80 line-clamp-1">{currentTrack.album}</span>
                  </div>
                )}
              </div>
            )}

            {/* Song Title, Artist, Heart & 3-Dots (Photo 2 layout) */}
            <div className="w-full max-w-sm mt-6 px-3 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm font-medium text-white/65 mt-0.5 truncate">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Heart and 3-dots buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  id="np-btn-favorite"
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className={`p-2.5 rounded-full hover:bg-white/10 transition-transform active:scale-125 ${
                    currentTrack.isFavorite ? 'text-rose-500' : 'text-white/70 hover:text-white'
                  }`}
                  title="Toggle Favorite"
                >
                  <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => setShowTrackDetails(!showTrackDetails)}
                  className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live Lyrics Sneak-Peek Line (Photo 2: "Finding the right words") */}
            {npConfig.showLyricsLine && (
              <div className="w-full max-w-sm px-3 mt-3">
                <button
                  onClick={() => {
                    setLyricsOpen(true);
                    setQueueOpen(false);
                  }}
                  className="w-full text-left py-1 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-white/60 group-hover:text-white truncate">
                    {activeLyricText}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider ml-2 flex-shrink-0" style={{ color: settings.accentColor }}>
                    Lyrics
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Track Details Modal popup */}
        {showTrackDetails && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-white/15 my-2 text-xs space-y-1.5 shadow-2xl animate-in zoom-in-95">
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

        {/* Scrub Bar (Timeline with Elapsed & Negative Remaining Time from Photo 2) */}
        <div className="w-full max-w-sm mx-auto mt-4 px-3">
          <div className="relative group">
            <input
              id="np-slider-seek"
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg cursor-pointer accent-white"
            />
            {/* Custom filled track */}
            <div 
              className="absolute top-0 left-0 h-1 rounded-lg pointer-events-none transition-all"
              style={{ 
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                backgroundColor: palette.primary || settings.accentColor 
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono font-medium text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>{formatRemainingTime(currentTime)}</span>
          </div>
        </div>

        {/* Primary Controls: Previous, Big Play/Pause, Next (Photo 2) */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-center gap-8 mt-2">
          <button
            id="np-btn-prev"
            onClick={prevTrack}
            className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            title="Previous"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>

          <button
            id="np-btn-play"
            onClick={togglePlayPause}
            className="w-18 h-18 rounded-full flex items-center justify-center text-black font-extrabold shadow-2xl transition-transform active:scale-95"
            style={{ 
              backgroundColor: palette.primary || settings.accentColor,
              boxShadow: `0 0 30px ${palette.glow}` 
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            id="np-btn-next"
            onClick={nextTrack}
            className="p-3 rounded-full hover:bg-white/10 text-white transition-transform active:scale-90"
            title="Next"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
        </div>

        {/* Dedicated Volume Slider (Photo 2) */}
        {npConfig.showVolumeBar && (
          <div className="w-full max-w-sm mx-auto flex items-center gap-3 mt-4 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/5">
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
            <span className="text-[10px] font-mono text-white/50 w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}

        {/* Bottom Mode Icons: Shuffle, Repeat, Infinite Autoplay (∞), and Queue (Photo 2) */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-around mt-4 pt-2 pb-6">
          {/* Shuffle */}
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

          {/* Repeat */}
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

          {/* Infinite Autoplay Loop (∞) - Photo 2 */}
          <button
            id="np-btn-infinite-radio"
            onClick={toggleInfiniteAutoplay}
            className={`p-2.5 rounded-full transition-all ${
              npConfig.infiniteAutoplay ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
            style={{ color: npConfig.infiniteAutoplay ? settings.accentColor : undefined }}
            title={`Infinite Autoplay Loop: ${npConfig.infiniteAutoplay ? 'Enabled' : 'Disabled'}`}
          >
            <Infinity className="w-5 h-5" />
          </button>

          {/* Queue / Up Next */}
          <button
            id="np-btn-queue-toggle"
            onClick={() => {
              setQueueOpen(!queueOpen);
              setLyricsOpen(false);
            }}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-colors ${
              queueOpen ? 'text-white bg-white/15' : 'text-white/70 hover:text-white'
            }`}
            title={`Up Next Queue (${queue.length})`}
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
