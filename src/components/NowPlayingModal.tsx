import React, { useState, useRef } from 'react';
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
  ListMusic, 
  MoreVertical,
  Music,
  Plus,
  Trash2,
  GripVertical,
  Infinity,
  Sparkles,
  SlidersHorizontal,
  Car,
  Headphones,
  Upload,
  Download,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { usePlayer, usePlaybackTime } from '../context/PlayerContext';
import { getTrackDynamicPalette, isCoverArtImage, DEFAULT_FALLBACK_ART, getResolvedCoverArt, getTrackCoverArt } from '../utils/dynamicColor';

export const NowPlayingModal: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
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
    carModeOpen,
    setCarModeOpen,
    iemModalOpen,
    setIEMModalOpen,
    iemSoundStage,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seek,
    toggleFavorite,
    setShuffle,
    setRepeat,
    removeFromQueue,
    clearQueue,
    playTrack,
    sleepTimer,
    settings,
    updateSettings,
    downloadedTrackIds,
  } = usePlayer();
  const currentTime = usePlaybackTime();

  const [showTrackDetails, setShowTrackDetails] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [cardDragX, setCardDragX] = useState(0);
  const touchStartYRef = useRef<number | null>(null);
  const cardTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);

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

  // Card Touch / Swipe Handlers for One-Hand Use (Swipe Left: Next, Swipe Right: Prev, Swipe Down: Minimize)
  const handleCardTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    cardTouchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleCardTouchMove = (e: React.TouchEvent) => {
    if (!cardTouchRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - cardTouchRef.current.x;
    const diffY = touch.clientY - cardTouchRef.current.y;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setCardDragX(Math.max(-80, Math.min(80, diffX * 0.6)));
    } else if (diffY > 0) {
      setDragY(Math.min(150, diffY * 0.7));
    }
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    if (!cardTouchRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - cardTouchRef.current.x;
    const diffY = touch.clientY - cardTouchRef.current.y;
    const elapsed = Date.now() - cardTouchRef.current.time;

    setCardDragX(0);
    cardTouchRef.current = null;

    // Horizontal Swipe (Next / Prev track)
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) && elapsed < 500) {
      if (diffX < 0) {
        nextTrack();
      } else {
        prevTrack();
      }
      return;
    }

    // Downward Swipe (Minimize)
    if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      setNowPlayingOpen(false);
    }
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
      {/* Dynamic Edge-to-Edge Backdrop: Fullscreen ambient blur matching artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img 
          src={getTrackCoverArt(currentTrack)} 
          alt="Backdrop" 
          className="w-full h-full object-cover blur-3xl scale-125 opacity-35 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        <div 
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[140px] opacity-40 pointer-events-none transition-all duration-700"
          style={{ background: palette.primary || settings.accentColor }}
        />
      </div>

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
      <div className="relative z-10 flex items-center justify-between px-5 py-2 max-w-lg mx-auto w-full">
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
            id="np-btn-iem"
            onClick={() => setIEMModalOpen(true)}
            className={`p-2.5 rounded-full hover:bg-white/10 transition-colors relative ${
              iemSoundStage.enabled ? 'text-emerald-400' : 'text-white/80 hover:text-white'
            }`}
            title="IEM Audiophile Stage (Headphone Monitor DSP)"
          >
            <Headphones className="w-5 h-5" />
            {iemSoundStage.enabled && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
            )}
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

      {/* Main Full-Screen Body */}
      <div className="relative z-10 flex-1 flex flex-col justify-between px-6 py-2 max-w-md mx-auto w-full min-h-0 overflow-y-auto no-scrollbar">
        {queueOpen ? (
          // Queue Drawer
          <div className="flex-1 flex flex-col py-2 max-h-[500px]">
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
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow bg-neutral-800"
                      >
                        <img 
                          src={getTrackCoverArt(track)} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const img = e.currentTarget as HTMLImageElement;
                            img.onerror = null;
                            img.src = DEFAULT_FALLBACK_ART;
                          }}
                        />
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
          // Full-Screen Artwork Stage with One-Handed Swipe
          <div 
            className="flex flex-col items-center justify-center flex-1 my-auto w-full touch-pan-y py-2"
            onTouchStart={handleCardTouchStart}
            onTouchMove={handleCardTouchMove}
            onTouchEnd={handleCardTouchEnd}
          >
            {npConfig.layoutStyle === 'vinyl-disc' ? (
              // 3D Vinyl Disc Mode
              <div 
                className="relative w-[78vw] max-w-[340px] aspect-square flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: cardDragX !== 0 ? `translateX(${cardDragX}px) rotate(${cardDragX * 0.08}deg)` : 'none'
                }}
              >
                <div 
                  className={`w-full h-full rounded-full bg-neutral-900 border-4 border-neutral-800 shadow-2xl flex items-center justify-center ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '12s', boxShadow: '0 0 35px rgba(0,0,0,0.9)' }}
                >
                  <div className="w-4/5 h-4/5 rounded-full border border-neutral-800/80 flex items-center justify-center">
                    <div className="w-3/5 h-3/5 rounded-full border border-neutral-800/60 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-inner">
                        <img 
                          src={getTrackCoverArt(currentTrack)} 
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
              // Full-Screen Card Artwork
              <div 
                className="relative group w-[82vw] max-w-[350px] aspect-square rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center transition-transform duration-200 cursor-grab active:cursor-grabbing"
                style={{
                  transform: cardDragX !== 0 ? `translateX(${cardDragX}px) rotate(${cardDragX * 0.06}deg)` : 'none',
                  boxShadow: `0 20px 50px -10px rgba(0,0,0,0.8), 0 0 40px ${palette.glow || 'rgba(0,0,0,0.5)'}`
                }}
              >
                <img
                  src={getTrackCoverArt(currentTrack)}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = DEFAULT_FALLBACK_ART;
                  }}
                />
              </div>
            )}

            {/* Subtle One-Hand Gesture Indicator */}
            <div className="text-[10px] text-white/35 font-medium tracking-wider uppercase mt-3 select-none flex items-center gap-2">
              <span>‹ Swipe for Prev</span>
              <span>•</span>
              <span>Next ›</span>
            </div>
          </div>
        )}

        {/* Track Details Modal popup */}
        {showTrackDetails && (
          <div className="p-4 rounded-2xl bg-neutral-900/95 border border-white/15 my-2 text-xs space-y-1.5 shadow-2xl animate-in zoom-in-95">
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
              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-white/10">
                <span className="text-white/40">Storage:</span>
                <span className={downloadedTrackIds.has(currentTrack.id) || currentTrack.isDownloaded ? "text-emerald-400 font-semibold" : "text-white/50"}>
                  {downloadedTrackIds.has(currentTrack.id) || currentTrack.isDownloaded ? "✓ Downloaded (0s Offline Play)" : "Cloud Stream"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lower Controls Section: Title, Timeline, Playback, and Modes (Volume bar removed as requested) */}
        <div className="w-full space-y-4 pt-2">
          {/* Song Title, Artist, Heart & 3-Dots */}
          <div className="w-full flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-3">
              <h2 className="text-2xl font-black text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-medium text-white/65 truncate">
                  {currentTrack.artist}
                </p>
                {iemSoundStage.enabled && (
                  <button 
                    onClick={() => setIEMModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0 active:scale-95"
                  >
                    <Headphones className="w-2.5 h-2.5" />
                    <span>IEM: {iemSoundStage.targetCurve.split('-')[0].toUpperCase()}</span>
                  </button>
                )}
              </div>
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

          {/* Scrub Bar (Timeline with Elapsed & Negative Remaining Time) */}
          <div className="w-full">
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

          {/* Primary Controls: Previous, Big Play/Pause, Next */}
          <div className="w-full flex items-center justify-center gap-8 py-1">
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

          {/* Bottom Mode Icons: Shuffle, Repeat, Infinite Autoplay (∞), and Queue */}
          <div className="w-full flex items-center justify-around pt-2 pb-6">
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

            {/* Infinite Autoplay Loop (∞) */}
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
              onClick={() => setQueueOpen(!queueOpen)}
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
    </div>
  );
};

