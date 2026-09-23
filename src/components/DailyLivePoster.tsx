import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Radio, 
  Calendar, 
  Music, 
  Volume2, 
  ChevronRight, 
  X,
  Disc3,
  Flame,
  Heart
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';

export interface DailyEventInfo {
  id: string;
  dayName: string;
  eventTitle: string;
  badge: string;
  tagline: string;
  description: string;
  posterImage: string;
  accentColor: string;
  genreKeywords: string[];
  vibe: string;
}

// 7 Signature Daily Events (one for each day of the week)
export const WEEKLY_EVENTS: DailyEventInfo[] = [
  {
    id: 'sunday-acoustic',
    dayName: 'Sunday',
    eventTitle: 'Sunday Acoustic & Soulful Unwind',
    badge: 'LIVE SUNDAY EVENT',
    tagline: 'Deep Strings • Raw Vocals • Serene Harmonies',
    description: 'Slow down and recharge with pure acoustic guitars, tender pianos, and soul-stirring ballads.',
    posterImage: '/covers/choo-lo.jpg',
    accentColor: '#f59e0b', // Warm Amber
    genreKeywords: ['choo lo', 'kaise hua', 'faasle', 'somewhere only we know', 'bairan', 'acoustic'],
    vibe: 'Soulful & Peaceful'
  },
  {
    id: 'monday-indie',
    dayName: 'Monday',
    eventTitle: 'Monday Momentum • Indie Discovery',
    badge: 'LIVE MONDAY EVENT',
    tagline: 'Fresh Energy • Modern Indie • Driving Beats',
    description: 'Kickstart your new week with inspiring indie anthems, energetic rhythms, and resonant lyrics.',
    posterImage: '/covers/nadaan-parinde.jpg',
    accentColor: '#3b82f6', // Electric Blue
    genreKeywords: ['nadaan parinde', 'choo lo', 'the local train', 'indie', 'rock'],
    vibe: 'Inspiring & Energized'
  },
  {
    id: 'tuesday-romance',
    dayName: 'Tuesday',
    eventTitle: 'Tuesday Romance • Cinematic Heartstrings',
    badge: 'LIVE TUESDAY EVENT',
    tagline: 'Golden Hours • Melodic Violins • Timeless Love',
    description: 'Immerse yourself in lush Bollywood romances, sweeping orchestral strings, and heartfelt poetry.',
    posterImage: '/covers/raabta.jpg',
    accentColor: '#ec4899', // Rose Velvet
    genreKeywords: ['raabta', 'dil jhoom', 'kaise hua', 'surili akhiyon wale', 'romantic'],
    vibe: 'Romantic & Melodic'
  },
  {
    id: 'wednesday-sufi',
    dayName: 'Wednesday',
    eventTitle: 'Midweek Sufi & Spiritual Harmony',
    badge: 'LIVE WEDNESDAY EVENT',
    tagline: 'Mystic Sarangi • Divine Harmonium • Soulful Kalam',
    description: 'Transcend the midweek rush with meditative Sufi melodies, spiritual rhythms, and haunting vocals.',
    posterImage: '/covers/kaahe-mose.jpg',
    accentColor: '#8b5cf6', // Violet
    genreKeywords: ['kaahe mose', 'faasle', 'surili akhiyon wale', 'nadaan parinde', 'sufi'],
    vibe: 'Spiritual & Transcendent'
  },
  {
    id: 'thursday-throwback',
    dayName: 'Thursday',
    eventTitle: 'Thursday Throwback • Analog Masters',
    badge: 'LIVE THURSDAY EVENT',
    tagline: '70s Funk Grooves • 90s Vinyl • Nostalgic Warmth',
    description: 'Celebrate classic sonic eras with warm tape grit, analog basslines, and evergreen melodies.',
    posterImage: '/covers/come-and-get-your-love.jpg',
    accentColor: '#f97316', // Warm Orange
    genreKeywords: ['come and get your love', 'black star', 'radiohead', 'redbone', 'retro'],
    vibe: 'Retro & Nostalgic'
  },
  {
    id: 'friday-rock',
    dayName: 'Friday',
    eventTitle: 'Friday Euphoria • Stadium Rock & Anthems',
    badge: 'LIVE FRIDAY EVENT',
    tagline: 'Pounding Drums • Electric Solos • Weekend Kickoff',
    description: 'Crank up the volume! Soaring guitar riffs, relentless energy, and anthems made for Friday night.',
    posterImage: '/covers/black-star.jpg',
    accentColor: '#10b981', // Emerald
    genreKeywords: ['black star', 'nadaan parinde', 'choo lo', 'rock', 'alternative'],
    vibe: 'High Voltage & Euphoric'
  },
  {
    id: 'saturday-lofi',
    dayName: 'Saturday',
    eventTitle: 'Saturday Midnight Lo-Fi & Stargazing',
    badge: 'LIVE SATURDAY EVENT',
    tagline: 'Tape Warbles • Mellow Keys • Midnight Atmosphere',
    description: 'Drift through relaxed ambient soundscapes, dreamy lo-fi keys, and contemplative night grooves.',
    posterImage: '/covers/the-last-letter.jpg',
    accentColor: '#6366f1', // Indigo
    genreKeywords: ['the last letter', 'jo tum mere ho', 'muntazir', 'bairan', 'lo-fi', 'ambient'],
    vibe: 'Dreamy & Chill'
  }
];

interface DailyLivePosterProps {
  announcement?: {
    title?: string;
    text: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaType?: 'image' | 'video';
    linkUrl?: string;
    enabled: boolean;
    type?: string;
    wishText?: string;
    eventDate?: string;
    themeColor?: string;
  } | null;
  onTrackPlay?: (track: Track) => void;
}

export const DailyLivePoster: React.FC<DailyLivePosterProps> = ({
  announcement,
  onTrackPlay
}) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    settings
  } = usePlayer();

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => new Date().getDay());
  const [showDayPicker, setShowDayPicker] = useState<boolean>(false);

  // Formatted date
  const todayFormatted = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    const dayNumber = now.getDate();
    return `${dayName}, ${monthName} ${dayNumber}`;
  }, []);

  const todayDayIndex = new Date().getDay();
  const currentEvent = WEEKLY_EVENTS[selectedDayIndex % 7];

  // Prioritize Admin announcement if explicitly customized with title/image/video
  const mediaSrc = announcement?.videoUrl || announcement?.imageUrl || '';
  const isVideoPoster = Boolean(
    announcement?.mediaType === 'video' ||
    (announcement?.videoUrl && (
      announcement.videoUrl.endsWith('.mp4') || 
      announcement.videoUrl.endsWith('.webm') ||
      announcement.videoUrl.endsWith('.mov') ||
      announcement.videoUrl.endsWith('.m4v') ||
      announcement.videoUrl.includes('event_vid')
    )) ||
    (announcement?.imageUrl && (
      announcement.imageUrl.endsWith('.mp4') || 
      announcement.imageUrl.endsWith('.webm') ||
      announcement.imageUrl.endsWith('.mov') ||
      announcement.imageUrl.endsWith('.m4v') ||
      announcement.imageUrl.includes('event_vid')
    ))
  );
  const displayVideo = isVideoPoster ? (announcement?.videoUrl || announcement?.imageUrl || '') : '';

  const hasCustomAdminPoster = Boolean(
    announcement && 
    announcement.enabled && 
    (announcement.imageUrl || announcement.videoUrl || (announcement.title && announcement.text) || announcement.wishText)
  );

  const displayTitle = hasCustomAdminPoster && announcement?.title 
    ? announcement.title 
    : currentEvent.eventTitle;

  const displayDescription = hasCustomAdminPoster && announcement?.text 
    ? announcement.text 
    : currentEvent.description;

  const displayPoster = hasCustomAdminPoster && announcement?.imageUrl 
    ? announcement.imageUrl 
    : currentEvent.posterImage;

  const displayBadge = hasCustomAdminPoster 
    ? (isVideoPoster 
        ? 'LIVE VIDEO BROADCAST' 
        : announcement?.type === 'special' 
          ? 'SPECIAL DAY CELEBRATION' 
          : 'LIVE EVENT POSTER') 
    : currentEvent.badge;

  const displayTagline = hasCustomAdminPoster 
    ? (announcement?.eventDate ? `Event Date: ${announcement.eventDate}` : 'Curated Live Broadcast') 
    : currentEvent.tagline;

  const activeAccent = announcement?.themeColor || (hasCustomAdminPoster ? settings.accentColor : currentEvent.accentColor);

  // Find tracks that match today's event keywords
  const eventTracks = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    
    // Filter matching tracks based on keywords
    const keywords = currentEvent.genreKeywords;
    const matched = tracks.filter(t => {
      const titleLower = t.title.toLowerCase();
      const artistLower = t.artist.toLowerCase();
      const genreLower = (t.genre || '').toLowerCase();
      return keywords.some(k => 
        titleLower.includes(k) || 
        artistLower.includes(k) || 
        genreLower.includes(k)
      );
    });

    // If fewer than 3 matched, append top tracks
    if (matched.length < 4) {
      const remaining = tracks.filter(t => !matched.some(m => m.id === t.id));
      return [...matched, ...remaining].slice(0, 4);
    }
    return matched.slice(0, 4);
  }, [tracks, currentEvent]);

  // Check if current playing track is part of today's event
  const isPlayingEvent = useMemo(() => {
    if (!isPlaying || !currentTrack) return false;
    return eventTracks.some(t => t.id === currentTrack.id);
  }, [isPlaying, currentTrack, eventTracks]);

  const handleToggleEventPlayback = () => {
    if (isPlayingEvent) {
      togglePlayPause();
      return;
    }
    if (eventTracks.length > 0) {
      const targetTrack = eventTracks[0];
      if (onTrackPlay) {
        onTrackPlay(targetTrack);
      } else {
        playTrack(targetTrack);
      }
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div 
      id="live-daily-event-poster"
      className="relative overflow-hidden rounded-3xl border shadow-2xl transition-all duration-300 group"
      style={{
        backgroundColor: '#0a0a12',
        borderColor: `${activeAccent}35`,
      }}
    >
      {/* Background Ambient Poster Art with Cinematic Blur & Gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {isVideoPoster ? (
          <video
            src={displayVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center filter blur-xl scale-110 opacity-35 transition-transform duration-700"
          />
        ) : (
          <img 
            src={displayPoster} 
            alt={displayTitle}
            className="w-full h-full object-cover object-center filter blur-xl scale-110 opacity-30 transition-transform duration-700 group-hover:scale-115"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/covers/choo-lo.jpg';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a12] via-[#0a0a12]/85 to-[#0a0a12]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 p-4 sm:p-6">
        
        {/* Top Header: Prominent Day Name, Live Badge, Today's Date & Day Picker */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Prominent Day Name */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentEvent.dayName}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-white/60">
                • {todayFormatted.split(',')[1]?.trim() || todayFormatted}
              </span>
            </div>

            {/* Pulsing Live Badge */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-md"
              style={{
                backgroundColor: `${activeAccent}25`,
                color: activeAccent,
                border: `1px solid ${activeAccent}50`
              }}
            >
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: activeAccent }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: activeAccent }}
                />
              </span>
              <span>{displayBadge}</span>
            </div>
          </div>

          {/* Right Action: Day Switcher & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              id="btn-day-schedule"
              onClick={() => setShowDayPicker(!showDayPicker)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 transition-all flex items-center gap-1 border border-white/10"
              title="Browse 7-Day Live Event Schedule"
            >
              <Calendar className="w-3.5 h-3.5 text-white/60" />
              <span>Schedule</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/50" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss for today"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Schedule Picker Drawer (When opened) */}
        {showDayPicker && (
          <div className="mb-4 p-3 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="text-[11px] font-bold text-white/50 px-2 py-1 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Weekly Event Lineup</span>
              <span>Tap to switch day vibe</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKLY_EVENTS.map((ev, idx) => {
                const isSelected = idx === selectedDayIndex;
                const isRealToday = idx === todayDayIndex;
                return (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setSelectedDayIndex(idx);
                      setShowDayPicker(false);
                    }}
                    className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center gap-0.5 ${
                      isSelected 
                        ? 'bg-white text-black font-black shadow-lg scale-102' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{ev.dayName.slice(0, 3)}</span>
                    {isRealToday && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? '#000' : activeAccent }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Full-Sized Edge-to-Edge Poster Visual */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[360px] rounded-2xl overflow-hidden shadow-2xl border border-white/15 group-hover:border-white/25 transition-all bg-black mb-4">
          {isVideoPoster ? (
            <video
              src={displayVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={displayPoster} 
              alt={displayTitle}
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-103"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/covers/choo-lo.jpg';
              }}
            />
          )}

          {/* Vignette Gradients for cinematic visual depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Overlay Tag on Top of Poster */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span 
              className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-lg"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.70)',
                color: activeAccent,
                border: `1px solid ${activeAccent}60`
              }}
            >
              {isVideoPoster ? 'VIDEO POSTER' : currentEvent.vibe}
            </span>
          </div>

          {/* Live Audio Waves when playing on bottom right of the image */}
          {isPlayingEvent && (
            <div 
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl backdrop-blur-md"
              style={{ backgroundColor: `${activeAccent}f0` }}
            >
              <span className="text-[11px] font-black text-black uppercase mr-1">Playing Live</span>
              <span className="w-1.5 h-3.5 bg-black rounded-full animate-pulse" />
              <span className="w-1.5 h-5 bg-black rounded-full animate-pulse delay-75" />
              <span className="w-1.5 h-2.5 bg-black rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Structured Event Details Underneath Poster Image */}
        <div className="space-y-3 px-0.5">
          {/* Tagline & Title */}
          <div>
            <span 
              className="text-xs font-extrabold uppercase tracking-wider block mb-1"
              style={{ color: activeAccent }}
            >
              {displayTagline}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {displayTitle}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 font-normal leading-relaxed mt-1.5">
              {displayDescription}
            </p>
          </div>

          {/* Special Day Wish Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
            <span className="flex-1 leading-snug">
              {announcement?.wishText || `Have an inspiring and musical ${currentEvent.dayName}! ✨`}
            </span>
          </div>

          {/* Action Row: Play Event Button (Clean & focused, no suggested tracks clutter) */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <button
              id="btn-play-daily-event"
              onClick={handleToggleEventPlayback}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 group/btn"
              style={{
                backgroundColor: activeAccent,
                color: '#000'
              }}
            >
              {isPlayingEvent ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Event Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current transition-transform group-hover/btn:scale-110" />
                  <span>Play {currentEvent.dayName} Event</span>
                </>
              )}
            </button>

            {/* Quick Share / Link if announcement has one */}
            {announcement?.linkUrl && (
              <a
                href={announcement.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
              >
                <span>View Event Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
