import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  Music, 
  Edit3, 
  Trash2, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Search, 
  FileAudio, 
  X, 
  Save, 
  RefreshCw,
  FolderPlus,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track, AudioFormat, LyricLine } from '../types';
import { extractId3Metadata } from '../services/id3Parser';

// Curated high quality artistic cover presets
const COVER_PRESETS = [
  { id: 'nature', name: 'Emerald Nature', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80' },
  { id: 'night', name: 'Midnight Violet', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80' },
  { id: 'sunset', name: 'Golden Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
  { id: 'acoustic', name: 'Acoustic Guitar', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
  { id: 'lofi', name: 'Lo-Fi Cozy', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80' },
  { id: 'neon', name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80' },
  { id: 'ocean', name: 'Deep Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop&q=80' },
  { id: 'vinyl', name: 'Classic Vinyl', url: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&auto=format&fit=crop&q=80' }
];

const GENRE_OPTIONS = [
  'Bollywood',
  'Indie Acoustic',
  'Romantic',
  'Lo-Fi & Chill',
  'Pop',
  'Rock',
  'Classical & Sufi',
  'EDM & Dance',
  'Hip-Hop / Rap',
  'Instrumental'
];

export const SongManagerTab: React.FC = () => {
  const { 
    tracks, 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlayPause, 
    addTracks, 
    updateTrack, 
    deleteTrack,
    settings 
  } = usePlayer();

  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';

  // Mode: upload vs edit
  const [activeMode, setActiveMode] = useState<'upload' | 'edit'>('upload');

  // =================== UPLOAD FORM STATE ===================
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadAlbum, setUploadAlbum] = useState('');
  const [uploadGenre, setUploadGenre] = useState('Indie Acoustic');
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear());
  const [uploadCoverArt, setUploadCoverArt] = useState(COVER_PRESETS[0].url);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);
  const [uploadLyrics, setUploadLyrics] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessTrack, setUploadSuccessTrack] = useState<Track | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isExtractingId3, setIsExtractingId3] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  // Parse file when selected and extract original ID3 metadata & embedded cover art
  const handleAudioSelect = async (file: File) => {
    setAudioFile(file);
    setUploadError(null);
    setUploadSuccessTrack(null);
    setIsExtractingId3(true);
    setExtractedNotice(null);

    // Initial fallback from filename
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    let detectedTitle = rawName;
    let detectedArtist = 'Indie Artist';

    if (rawName.includes(' - ')) {
      const parts = rawName.split(' - ');
      detectedArtist = parts[0].trim();
      detectedTitle = parts[1].trim();
    } else if (rawName.includes('-')) {
      const parts = rawName.split('-');
      detectedArtist = parts[0].trim();
      detectedTitle = parts[1].trim();
    } else {
      detectedTitle = rawName.replace(/_/g, ' ').replace(/-/g, ' ');
    }

    setUploadTitle(detectedTitle);
    setUploadArtist(detectedArtist);
    setUploadAlbum(detectedTitle + ' - Single');

    // Deep ID3 / M4A / FLAC extraction
    try {
      const id3 = await extractId3Metadata(file);
      if (id3.title && id3.title.trim()) {
        setUploadTitle(id3.title.trim());
      }
      if (id3.artist && id3.artist.trim() && id3.artist !== 'Unknown Artist') {
        setUploadArtist(id3.artist.trim());
      }
      if (id3.album && id3.album.trim()) {
        setUploadAlbum(id3.album.trim());
      }
      if (id3.genre && id3.genre.trim()) {
        setUploadGenre(id3.genre.trim());
      }
      if (id3.year && Number.isFinite(id3.year)) {
        setUploadYear(id3.year);
      }
      if (id3.coverArtUrl) {
        setUploadCoverArt(id3.coverArtUrl);
        setExtractedNotice('✨ Original embedded album cover & metadata successfully extracted!');
      } else {
        setExtractedNotice('Song details extracted from audio tag!');
      }
    } catch (e) {
      console.warn('ID3 metadata extraction notice:', e);
    } finally {
      setIsExtractingId3(false);
    }

    // Read audio duration
    try {
      const audioUrl = URL.createObjectURL(file);
      const audioObj = new Audio(audioUrl);
      audioObj.addEventListener('loadedmetadata', () => {
        if (audioObj.duration && !isNaN(audioObj.duration)) {
          setAudioDuration(Math.round(audioObj.duration));
        }
      });
    } catch {}
  };

  // Handle custom cover image selection
  const handleCoverSelect = (file: File) => {
    setCustomCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadCoverArt(String(e.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit audio upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setUploadError('Please choose an audio file (.mp3, .wav, .flac, .m4a)');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a song title');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. If custom cover image file or base64 ID3 cover art, upload image to server
      let finalCover = uploadCoverArt;
      if (customCoverFile) {
        try {
          const reader = new FileReader();
          const coverBase64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(customCoverFile);
          });
          const imgRes = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: coverBase64,
              filename: customCoverFile.name
            })
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData?.url) finalCover = imgData.url;
          }
        } catch {}
      } else if (finalCover && finalCover.startsWith('data:image/')) {
        try {
          const imgRes = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl: finalCover,
              filename: `${uploadTitle || 'cover'}.jpg`
            })
          });
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData?.url) finalCover = imgData.url;
          }
        } catch {}
      }

      // 2. Read audio file as base64 and upload to server
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(audioFile);
      });

      const res = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: audioBase64,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim() || 'Indie Artist',
          album: uploadAlbum.trim() || 'Uploaded Master',
          duration: audioDuration || 210,
          coverArt: finalCover
        })
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedTrack: Track = data.track || {
          id: `upload_${Date.now()}`,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim() || 'Indie Artist',
          album: uploadAlbum.trim() || 'Uploaded Master',
          duration: audioDuration || 210,
          format: 'mp3',
          coverArt: finalCover,
          audioUrl: URL.createObjectURL(audioFile),
          genre: uploadGenre,
          folder: 'NOVA Studio / Uploads',
          year: uploadYear,
          playCount: 0,
          isFavorite: false,
          dateAdded: Date.now()
        };

        // If lyrics were provided, save them
        if (uploadLyrics.trim()) {
          const lines: LyricLine[] = uploadLyrics.split('\n')
            .filter(l => l.trim().length > 0)
            .map((line, idx) => ({
              time: Math.round((idx / Math.max(1, uploadLyrics.split('\n').length)) * (audioDuration || 210)),
              text: line.trim()
            }));
          uploadedTrack.lyrics = lines;
          updateTrack(uploadedTrack.id, { lyrics: lines });
        }

        addTracks([uploadedTrack]);
        setUploadSuccessTrack(uploadedTrack);
        // Reset form
        setAudioFile(null);
        setCustomCoverFile(null);
      } else {
        // Fallback for client-only / offline
        const localTrack: Track = {
          id: `local_${Date.now()}`,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim() || 'Indie Artist',
          album: uploadAlbum.trim() || 'Local Audio',
          duration: audioDuration || 210,
          format: 'mp3',
          coverArt: finalCover,
          audioUrl: URL.createObjectURL(audioFile),
          genre: uploadGenre,
          folder: 'My Device',
          year: uploadYear,
          playCount: 0,
          isFavorite: false,
          dateAdded: Date.now()
        };
        addTracks([localTrack]);
        setUploadSuccessTrack(localTrack);
        setAudioFile(null);
        setCustomCoverFile(null);
      }
    } catch (err: any) {
      console.warn('Backend upload fell back to local player:', err);
      if (audioFile) {
        const localTrack: Track = {
          id: `local_${Date.now()}`,
          title: uploadTitle.trim(),
          artist: uploadArtist.trim() || 'Indie Artist',
          album: uploadAlbum.trim() || 'Local Audio',
          duration: audioDuration || 210,
          format: 'mp3',
          coverArt: uploadCoverArt,
          audioUrl: URL.createObjectURL(audioFile),
          genre: uploadGenre,
          folder: 'My Device',
          year: uploadYear,
          playCount: 0,
          isFavorite: false,
          dateAdded: Date.now()
        };
        addTracks([localTrack]);
        setUploadSuccessTrack(localTrack);
        setAudioFile(null);
      } else {
        setUploadError(err?.message || 'Failed to upload song');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // =================== EDIT FORM STATE ===================
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editSearch, setEditSearch] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editYear, setEditYear] = useState<number>(2024);
  const [editCoverArt, setEditCoverArt] = useState('');
  const [editLyricsText, setEditLyricsText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const startEditingTrack = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album);
    setEditGenre(track.genre || 'Indie');
    setEditYear(track.year || 2024);
    setEditCoverArt(track.coverArt);
    const lyricsString = track.lyrics ? track.lyrics.map(l => l.text).join('\n') : '';
    setEditLyricsText(lyricsString);
    setEditSuccessMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    setIsSavingEdit(true);
    setEditSuccessMsg(null);

    const lyricLines: LyricLine[] = editLyricsText.trim()
      ? editLyricsText.split('\n').filter(l => l.trim().length > 0).map((l, idx) => ({
          time: Math.round((idx / Math.max(1, editLyricsText.split('\n').length)) * editingTrack.duration),
          text: l.trim()
        }))
      : [];

    const updates: Partial<Track> = {
      title: editTitle.trim(),
      artist: editArtist.trim(),
      album: editAlbum.trim(),
      genre: editGenre.trim(),
      year: editYear,
      coverArt: editCoverArt.trim(),
      lyrics: lyricLines.length > 0 ? lyricLines : undefined
    };

    await updateTrack(editingTrack.id, updates);
    setIsSavingEdit(false);
    setEditSuccessMsg(`Song "${editTitle}" updated successfully!`);
    setTimeout(() => {
      setEditingTrack(null);
      setEditSuccessMsg(null);
    }, 1500);
  };

  // Filtered tracks for edit search
  const filteredTracks = useMemo(() => {
    if (!editSearch.trim()) return tracks;
    const q = editSearch.toLowerCase();
    return tracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.artist.toLowerCase().includes(q) || 
      t.album.toLowerCase().includes(q)
    );
  }, [tracks, editSearch]);

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const rem = Math.floor(s % 60);
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className={`space-y-6 pb-48 px-4 sm:px-6 select-none animate-in fade-in duration-300 ${
      isLight ? 'text-neutral-900' : 'text-neutral-100'
    }`}>
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b pb-5" style={{
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
      }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10">
              <FolderPlus className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Song Studio & Manager</h1>
          </div>
          <p className="text-xs sm:text-sm mt-1 opacity-60">
            Upload new audio files or edit track details, artist, album, and artwork cleanly.
          </p>
        </div>

        {/* 2 Top Mode Tabs */}
        <div className="flex items-center p-1 rounded-2xl border" style={{
          backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'upload'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Song</span>
          </button>
          <button
            onClick={() => setActiveMode('edit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'edit'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Songs ({tracks.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== UPLOAD TAB ===================== */}
      {activeMode === 'upload' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {uploadSuccessTrack && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <img 
                  src={uploadSuccessTrack.coverArt} 
                  alt={uploadSuccessTrack.title}
                  className="w-12 h-12 rounded-xl object-cover shadow"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Song Added to Library!</span>
                  </div>
                  <h4 className="text-sm font-black">{uploadSuccessTrack.title}</h4>
                  <p className="text-xs opacity-70">{uploadSuccessTrack.artist} • {uploadSuccessTrack.album}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playTrack(uploadSuccessTrack)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Now</span>
                </button>
                <button
                  onClick={() => setUploadSuccessTrack(null)}
                  className="p-2 rounded-xl hover:bg-white/10 opacity-70 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Step 1: File Chooser */}
            <div className="rounded-2xl border p-5 transition-all" style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <span>Select Audio File</span>
                </h3>
                <span className="text-xs opacity-50">MP3, WAV, FLAC, M4A, OGG</span>
              </div>

              <input 
                type="file" 
                ref={audioInputRef}
                accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAudioSelect(e.target.files[0]);
                  }
                }}
              />

              <div 
                onClick={() => audioInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  audioFile 
                    ? 'border-emerald-500/50 bg-emerald-500/5' 
                    : isLight 
                      ? 'border-neutral-300 hover:border-emerald-500 hover:bg-neutral-50' 
                      : 'border-white/15 hover:border-emerald-500 hover:bg-white/5'
                }`}
              >
                {audioFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="p-3 rounded-full bg-emerald-500 text-white shadow-lg">
                      <FileAudio className="w-6 h-6" />
                    </span>
                    <p className="font-bold text-sm truncate max-w-sm">{audioFile.name}</p>
                    <p className="text-xs opacity-60">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • {audioDuration ? `${formatSecs(audioDuration)} duration` : 'Ready to upload'}
                    </p>
                    <span className="text-xs text-emerald-400 font-bold underline mt-1">Tap to change file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="p-3 rounded-full bg-white/10 opacity-70">
                      <Upload className="w-6 h-6" />
                    </span>
                    <p className="font-bold text-sm">Click here to browse audio from device</p>
                    <p className="text-xs opacity-50">Choose any song from your phone storage or computer</p>
                  </div>
                )}
              </div>

              {isExtractingId3 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reading audio file... Extracting original embedded cover art & song tags</span>
                </div>
              )}

              {extractedNotice && !isExtractingId3 && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{extractedNotice}</span>
                </div>
              )}
            </div>

            {/* Step 2: Song Info */}
            <div className="rounded-2xl border p-5" style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <span>Track Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1.5">Song Title *</label>
                  <input 
                    type="text" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Tum Hi Ho / Choo Lo"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1.5">Artist / Singer *</label>
                  <input 
                    type="text" 
                    value={uploadArtist}
                    onChange={(e) => setUploadArtist(e.target.value)}
                    placeholder="e.g. Arijit Singh / The Local Train"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1.5">Album Name</label>
                  <input 
                    type="text" 
                    value={uploadAlbum}
                    onChange={(e) => setUploadAlbum(e.target.value)}
                    placeholder="e.g. Aashiqui 2"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1.5">Genre</label>
                  <select 
                    value={uploadGenre}
                    onChange={(e) => setUploadGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : '#12141C',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  >
                    {GENRE_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Cover Artwork */}
            <div className="rounded-2xl border p-5" style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">3</span>
                  <span>Album Artwork / Cover Photo</span>
                </h3>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image File</span>
                </button>
              </div>

              <input 
                type="file" 
                ref={coverInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCoverSelect(e.target.files[0]);
                  }
                }}
              />

              {/* Cover Presets Carousel */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 mb-3">
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setUploadCoverArt(preset.url);
                      setCustomCoverFile(null);
                    }}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                      uploadCoverArt === preset.url && !customCoverFile
                        ? 'border-emerald-500 scale-105 shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {uploadCoverArt === preset.url && !customCoverFile && (
                      <span className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Cover Art URL or Preview */}
              <div className="flex items-center gap-3">
                <img 
                  src={uploadCoverArt} 
                  alt="Selected Cover" 
                  className="w-14 h-14 rounded-xl object-cover border"
                  style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                />
                <input 
                  type="text"
                  value={uploadCoverArt}
                  onChange={(e) => {
                    setUploadCoverArt(e.target.value);
                    setCustomCoverFile(null);
                  }}
                  placeholder="Paste Image URL or select from presets above"
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-emerald-500"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                  }}
                />
              </div>
            </div>

            {/* Step 4: Optional Lyrics */}
            <div className="rounded-2xl border p-5" style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-neutral-500 text-white text-[10px] font-black flex items-center justify-center">4</span>
                <span>Lyrics (Optional)</span>
              </h3>
              <p className="text-xs opacity-50 mb-2">Paste lyrics line-by-line to see synchronized lyrics while playing.</p>
              <textarea 
                value={uploadLyrics}
                onChange={(e) => setUploadLyrics(e.target.value)}
                placeholder="Dekho deewane aaye hain...&#10;Husn tera taareefein kare..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 font-mono"
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                  borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isUploading || !audioFile}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Audio & Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Song & Add to Music Library</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== EDIT TAB ===================== */}
      {activeMode === 'edit' && (
        <div className="space-y-6">
          {/* Edit Success Notice */}
          {editSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{editSuccessMsg}</span>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
            <input 
              type="text" 
              value={editSearch}
              onChange={(e) => setEditSearch(e.target.value)}
              placeholder="Search by song name, singer, or album..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:border-emerald-500 transition-colors"
              style={{
                backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
                borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'
              }}
            />
          </div>

          {/* Songs List */}
          <div className="space-y-2">
            {filteredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id}
                  className="flex items-center justify-between p-3 rounded-2xl border transition-all hover:border-emerald-500/40"
                  style={{
                    backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.03)',
                    borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={track.coverArt} 
                      alt={track.title}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate flex items-center gap-2">
                        <span>{track.title}</span>
                        {track.hasCustomMetadata && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            Edited
                          </span>
                        )}
                      </h4>
                      <p className="text-xs opacity-60 truncate">
                        {track.artist} • {track.album} • {formatSecs(track.duration)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        if (isCurrent) togglePlayPause();
                        else playTrack(track);
                      }}
                      className="p-2 rounded-xl hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                      title="Play Song"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </button>

                    <button
                      onClick={() => startEditingTrack(track)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all border border-emerald-500/20 active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit Details</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${track.title}" from library?`)) {
                          deleteTrack(track.id);
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-rose-400 opacity-60 hover:opacity-100 transition-colors"
                      title="Delete Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTracks.length === 0 && (
              <div className="p-8 text-center opacity-50 text-xs">
                No songs found matching "{editSearch}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== EDIT TRACK MODAL ===================== */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            style={{
              backgroundColor: isLight ? '#FFFFFF' : '#12141C',
              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}>
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-base">Edit Song Metadata</h3>
              </div>
              <button 
                onClick={() => setEditingTrack(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold opacity-70 mb-1">Song Title</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1">Artist / Singer</label>
                  <input 
                    type="text" 
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500"
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1">Album</label>
                  <input 
                    type="text" 
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500"
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1">Genre</label>
                  <input 
                    type="text" 
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500"
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-70 mb-1">Year</label>
                  <input 
                    type="number" 
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500"
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                      borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold opacity-70">Album Cover Picture</label>
                  <label className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Picture from Device</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const r = new FileReader();
                          r.onload = (ev) => {
                            if (ev.target?.result) {
                              setEditCoverArt(String(ev.target.result));
                            }
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <img 
                    src={editCoverArt} 
                    alt="Cover preview" 
                    className="w-14 h-14 rounded-xl object-cover border shadow-sm shrink-0"
                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="text" 
                      value={editCoverArt}
                      onChange={(e) => setEditCoverArt(e.target.value)}
                      placeholder="Paste image URL or upload above"
                      className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-emerald-500"
                      style={{
                        backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                        borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                      }}
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {COVER_PRESETS.slice(0, 5).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditCoverArt(preset.url)}
                          className="text-[10px] px-2 py-0.5 rounded-lg border font-medium whitespace-nowrap transition-colors"
                          style={{
                            backgroundColor: editCoverArt === preset.url ? '#10B981' : (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)'),
                            color: editCoverArt === preset.url ? '#FFFFFF' : 'inherit',
                            borderColor: editCoverArt === preset.url ? '#10B981' : (isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)')
                          }}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold opacity-70 mb-1">Lyrics</label>
                <textarea 
                  value={editLyricsText}
                  onChange={(e) => setEditLyricsText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-emerald-500 font-mono"
                  style={{
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(0,0,0,0.4)',
                    borderColor: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                  }}
                  placeholder="Paste synchronized or plain lyrics..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold opacity-70 hover:opacity-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-40"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
