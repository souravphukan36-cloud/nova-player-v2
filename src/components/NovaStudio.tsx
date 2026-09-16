import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  Unlock, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Search, 
  Music, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Image as ImageIcon, 
  Sliders, 
  FileText, 
  ArrowLeft,
  Headphones,
  CheckCircle2,
  Upload,
  UploadCloud,
  PlusCircle,
  X
} from 'lucide-react';
import { Track, LyricLine } from '../types';

interface NovaStudioProps {
  onClose?: () => void;
}

export const NovaStudio: React.FC<NovaStudioProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nova_studio_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Tracks and state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState<string>('');
  const [editArtist, setEditArtist] = useState<string>('');
  const [editAlbum, setEditAlbum] = useState<string>('');
  const [editGenre, setEditGenre] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [editCoverArt, setEditCoverArt] = useState<string>('');
  const [editLyricsText, setEditLyricsText] = useState<string>('');
  const [editSynthPreset, setEditSynthPreset] = useState<string>('acoustic');

  // File upload states
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [showNewTrackModal, setShowNewTrackModal] = useState<boolean>(false);
  const [uploadAudioFile, setUploadAudioFile] = useState<File | null>(null);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newAlbum, setNewAlbum] = useState<string>('');
  const [isUploadingTrack, setIsUploadingTrack] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isPrewarming, setIsPrewarming] = useState<boolean>(false);

  // Load tracks from server
  const fetchTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telegram/tracks');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tracks)) {
          setTracks(data.tracks);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tracks in Studio:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTracks();
    }
  }, [isAuthenticated]);

  // Handle PIN Submission
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        sessionStorage.setItem('nova_studio_auth', 'true');
        sessionStorage.setItem('nova_studio_auth_pin', pinInput.trim());
      } else {
        setAuthError(data.error || 'Incorrect PIN. Default is 7788.');
      }
    } catch (err) {
      setAuthError('Network error connecting to studio auth.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Select track to edit
  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
    setEditTitle(track.title || '');
    setEditArtist(track.artist || '');
    setEditAlbum(track.album || '');
    setEditGenre(track.genre || '');
    setEditYear(track.year ? String(track.year) : '');
    setEditCoverArt(track.coverArt || '');
    setEditSynthPreset(track.synthPreset || 'acoustic');

    // Parse lyrics into clean readable text
    if (track.lyrics && Array.isArray(track.lyrics)) {
      const formatted = track.lyrics.map(l => `[${formatTime(l.time)}] ${l.text}`).join('\n');
      setEditLyricsText(formatted);
    } else {
      setEditLyricsText('');
    }

    setSaveStatus('idle');
    setSaveMessage('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse text back into LyricLine array
  const parseLyricsFromText = (text: string): LyricLine[] => {
    const lines = text.split('\n');
    const result: LyricLine[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for timestamp [mm:ss] or [mm:ss.xx]
      const match = trimmed.match(/^\[(\d{1,2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/);
      if (match) {
        const mins = parseFloat(match[1]);
        const secs = parseFloat(match[2]);
        const lyricText = match[3] || '';
        result.push({ time: Math.round(mins * 60 + secs), text: lyricText });
      } else {
        // Plain line without timestamp -> distribute evenly
        result.push({ time: result.length * 4, text: trimmed });
      }
    }
    return result;
  };

  // Save changes to Server
  const handleSaveChanges = async () => {
    if (!selectedTrack) return;
    setSaveStatus('saving');
    setSaveMessage('');

    try {
      const parsedLyrics = editLyricsText.trim() ? parseLyricsFromText(editLyricsText) : [];

      const payload = {
        trackId: selectedTrack.id,
        title: editTitle.trim(),
        artist: editArtist.trim(),
        album: editAlbum.trim(),
        genre: editGenre.trim(),
        year: editYear.trim() ? parseInt(editYear) : undefined,
        coverArt: editCoverArt.trim(),
        synthPreset: editSynthPreset,
        lyrics: parsedLyrics,
      };

      const res = await fetch('/api/tracks/metadata/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('saved');
        setSaveMessage('Saved to cloud server! Live everywhere.');

        // Update local tracks state
        setTracks(prev => prev.map(t => (t.id === selectedTrack.id ? data.track : t)));
        setSelectedTrack(data.track);

        // Notify client app player context
        try {
          window.dispatchEvent(new CustomEvent('nova-cloud-tracks-updated', { detail: [data.track] }));
        } catch {}

        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setSaveMessage(data.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage('Network error saving metadata.');
    }
  };

  // Revert back to Telegram Default
  const handleResetTrack = async () => {
    if (!selectedTrack) return;
    if (!confirm(`Revert "${selectedTrack.title}" back to original Telegram tags?`)) return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/tracks/metadata/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: selectedTrack.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('saved');
        setSaveMessage('Reverted to Telegram original!');
        setTracks(prev => prev.map(t => (t.id === selectedTrack.id ? data.track : t)));
        handleSelectTrack(data.track);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setSaveMessage('Failed to reset track.');
    }
  };

  // Prewarm audio cache for extreme playback speed
  const handlePrewarmCache = async () => {
    setIsPrewarming(true);
    try {
      await fetch('/api/admin/prewarm', { method: 'POST' });
      setSaveStatus('saved');
      setSaveMessage('High-speed pre-warm triggered for all tracks!');
      setTimeout(() => setSaveStatus('idle'), 3500);
    } catch {
      setSaveStatus('error');
      setSaveMessage('Prewarm request failed.');
    } finally {
      setIsPrewarming(false);
    }
  };

  // Upload an image file for track cover artwork
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size must be less than 15MB.');
      return;
    }

    setIsUploadingImage(true);
    setSaveMessage('Uploading cover art...');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const pin = sessionStorage.getItem('nova_studio_auth_pin') || '7788';
          const res = await fetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pin,
              fileName: file.name,
              imageData: base64
            })
          });

          const data = await res.json();
          if (res.ok && data.url) {
            setEditCoverArt(data.url);
            setSaveStatus('saved');
            setSaveMessage('Image uploaded and set as cover art!');
            setTimeout(() => setSaveStatus('idle'), 3000);
          } else {
            setSaveStatus('error');
            setSaveMessage(data.error || 'Failed to upload image.');
          }
        } catch {
          setSaveStatus('error');
          setSaveMessage('Network error during image upload.');
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingImage(false);
      setSaveStatus('error');
      setSaveMessage('Error reading selected image.');
    }
  };

  // Upload a brand new audio song + cover art
  const handleUploadNewTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadAudioFile) {
      alert('Please select an audio file (MP3, M4A, FLAC, WAV).');
      return;
    }

    if (!newTitle.trim()) {
      alert('Please enter a track title.');
      return;
    }

    setIsUploadingTrack(true);
    setUploadProgress('Preparing files...');

    try {
      const pin = sessionStorage.getItem('nova_studio_auth_pin') || '7788';

      // 1. If cover file selected, upload image first
      let coverUrl: string | undefined = undefined;
      if (uploadCoverFile) {
        setUploadProgress('Uploading cover image...');
        const coverBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(uploadCoverFile);
        });

        const imgRes = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin,
            fileName: uploadCoverFile.name,
            imageData: coverBase64
          })
        });
        const imgData = await imgRes.json();
        if (imgRes.ok && imgData.url) {
          coverUrl = imgData.url;
        }
      }

      // 2. Upload audio file
      setUploadProgress('Uploading audio file (this might take a few seconds)...');
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(uploadAudioFile);
      });

      const audioRes = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          fileName: uploadAudioFile.name,
          audioData: audioBase64,
          title: newTitle.trim(),
          artist: newArtist.trim() || 'Custom Artist',
          album: newAlbum.trim() || 'Uploaded Singles',
          coverArt: coverUrl
        })
      });

      const audioData = await audioRes.json();
      if (audioRes.ok && audioData.success && audioData.track) {
        setTracks(prev => [audioData.track, ...prev]);
        handleSelectTrack(audioData.track);
        setShowNewTrackModal(false);
        setUploadAudioFile(null);
        setUploadCoverFile(null);
        setNewTitle('');
        setNewArtist('');
        setNewAlbum('');
        setSaveStatus('saved');
        setSaveMessage(`Song "${audioData.track.title}" uploaded and added to library!`);

        // Notify client app
        try {
          window.dispatchEvent(new CustomEvent('nova-cloud-tracks-updated', { detail: [audioData.track] }));
        } catch {}

        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        alert(audioData.error || 'Failed to upload song.');
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Network error'}`);
    } finally {
      setIsUploadingTrack(false);
      setUploadProgress('');
    }
  };

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  // If not logged in, show sleek login gate
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Header background glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">NOVA Studio</h2>
                <p className="text-xs text-white/50">Private Creator Portal • Spotify Edition</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            Enter your secret Studio PIN to edit track names, artists, custom album art, and timed lyrics.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/50 mb-1.5">
                Studio Access PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (Default: 7788)"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-center text-lg tracking-widest font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating || !pinInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {isAuthenticating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Enter Studio Console</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
            <span>Server: Dedicated Express CDN</span>
            <span className="text-emerald-400 font-mono">PIN: 7788</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0c10] text-white select-none overflow-hidden">
      {/* Top Studio Navbar */}
      <header className="h-16 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-black/60 backdrop-blur-lg shrink-0">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Return to Player"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">NOVA Studio</h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  Owner Active
                </span>
              </div>
              <p className="text-[11px] text-white/50">Spotify-Grade Track & Metadata Management</p>
            </div>
          </div>
        </div>

        {/* Global Studio Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewTrackModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
            title="Upload new song and artwork"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload Song</span>
          </button>

          <button
            onClick={handlePrewarmCache}
            disabled={isPrewarming}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors"
            title="Pre-cache audio files for instant playback"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPrewarming ? 'animate-bounce' : ''}`} />
            <span>{isPrewarming ? 'Pre-warming...' : 'Speed Pre-warm'}</span>
          </button>

          <button
            onClick={fetchTracks}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Refresh Library"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('nova_studio_auth');
              setIsAuthenticated(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
          >
            Lock Studio
          </button>
        </div>
      </header>

      {/* Main Studio Work Area: Split Grid */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Track List */}
        <div className="w-full md:w-5/12 lg:w-4/12 border-r border-white/10 flex flex-col bg-neutral-950/50">
          {/* Search bar inside list */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks or singers..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/50 px-1 mt-2">
              <span>{filteredTracks.length} tracks detected</span>
              <span className="text-emerald-400">Unlimited Telegram Storage</span>
            </div>
          </div>

          {/* Track scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-white/40 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Loading tracks from server...</span>
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-xs">
                No tracks found matching "{searchQuery}"
              </div>
            ) : (
              filteredTracks.map((t, idx) => {
                const isSelected = selectedTrack?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrack(t)}
                    className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/40'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="text-[11px] font-mono text-white/30 w-4 text-center">
                      {idx + 1}
                    </span>

                    {/* Cover Art preview */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 relative">
                      {t.coverArt ? (
                        <img
                          src={t.coverArt}
                          alt={t.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                          <Music className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate block">
                          {t.title}
                        </span>
                        {(t as any).hasCustomMetadata && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Custom metadata active" />
                        )}
                      </div>
                      <span className="text-[11px] text-white/50 truncate block">
                        {t.artist || 'Unknown Artist'}
                      </span>
                    </div>

                    <Edit3 className={`w-4 h-4 shrink-0 transition-opacity ${isSelected ? 'text-emerald-400 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Track Studio Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-900/30">
          {selectedTrack ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header card with cover preview */}
              <div className="p-5 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/60 border border-white/20 shrink-0 relative group shadow-lg">
                  {editCoverArt ? (
                    <img
                      src={editCoverArt}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white/80 font-mono text-center p-1">
                    Live Preview
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      Track ID: {selectedTrack.id}
                    </span>
                    {(selectedTrack as any).hasCustomMetadata && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Customized
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-white truncate">{editTitle || 'Untitled Track'}</h2>
                  <p className="text-xs text-white/60 truncate">{editArtist || 'Unknown Artist'}</p>
                </div>

                {/* Reset to Telegram defaults */}
                {(selectedTrack as any).hasCustomMetadata && (
                  <button
                    onClick={handleResetTrack}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-white/60 text-xs flex items-center gap-1.5 transition-colors self-start sm:self-center"
                    title="Revert back to Telegram tags"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Edit Form */}
              <div className="p-6 rounded-3xl bg-neutral-900/60 border border-white/10 shadow-xl space-y-5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Metadata & Tags</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Song Title *
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Arz Kiya Hai"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Artist */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Artist / Singer *
                    </label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      placeholder="e.g. Anuv Jain"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Album */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Album Name
                    </label>
                    <input
                      type="text"
                      value={editAlbum}
                      onChange={(e) => setEditAlbum(e.target.value)}
                      placeholder="e.g. Coke Studio Special"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Genre
                    </label>
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder="e.g. Indie Pop / Acoustic"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Release Year
                    </label>
                    <input
                      type="number"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* DSP Sound Preset */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5">
                      Audio DSP Preset
                    </label>
                    <select
                      value={editSynthPreset}
                      onChange={(e) => setEditSynthPreset(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="acoustic">Acoustic Warmth (Gentle)</option>
                      <option value="pop">Crisp Vocal & Pop</option>
                      <option value="electronic">Deep Sub-Bass EDM</option>
                      <option value="ambient">Space & Wide Ambient</option>
                    </select>
                  </div>
                </div>

                {/* HD Cover Art URL & Upload */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5 flex items-center justify-between">
                    <span>High-Definition Cover Art</span>
                    <span className="text-white/30 text-[10px] lowercase font-normal">paste URL or upload image file directly</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={editCoverArt}
                      onChange={(e) => setEditCoverArt(e.target.value)}
                      placeholder="https://images.unsplash.com/... or Spotify artwork URL"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 cursor-pointer transition-colors shrink-0">
                      <Upload className={`w-3.5 h-3.5 text-emerald-400 ${isUploadingImage ? 'animate-bounce' : ''}`} />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Synchronized Lyrics Editor */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/50 mb-1.5 flex items-center justify-between">
                    <span>Synchronized Lyrics Editor (.lrc format or plain lines)</span>
                    <span className="text-emerald-400 text-[10px] font-mono">[mm:ss] text</span>
                  </label>
                  <textarea
                    rows={7}
                    value={editLyricsText}
                    onChange={(e) => setEditLyricsText(e.target.value)}
                    placeholder={`[00:15] First line of song starts here...\n[00:32] Chorus vocals drop in...\n[01:05] Guitar solo segment`}
                    className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-emerald-300 font-mono placeholder-white/20 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-white/40 mt-1">
                    Tip: If you don't provide timestamps, lines will automatically pace evenly during playback.
                  </p>
                </div>

                {/* Save Feedback Banner */}
                {saveMessage && (
                  <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
                    saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{saveMessage}</span>
                  </div>
                )}

                {/* Primary Save Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={handleSaveChanges}
                    disabled={saveStatus === 'saving' || !editTitle.trim() || !editArtist.trim()}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-extrabold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    {saveStatus === 'saving' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save & Deploy Live</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white/80">Select a Song to Edit</h3>
              <p className="text-xs text-white/50 max-w-sm">
                Pick any track from the left panel to modify its title, artist, album art, or add timed lyrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Song Modal */}
      {showNewTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Upload New Song</h3>
              </div>
              <button
                onClick={() => !isUploadingTrack && setShowNewTrackModal(false)}
                disabled={isUploadingTrack}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewTrack} className="space-y-4">
              {/* Audio File Selection */}
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1.5">
                  Audio File (MP3, M4A, FLAC, WAV) *
                </label>
                <div className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-colors bg-white/5">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.m4a,.flac,.wav"
                    id="new-audio-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadAudioFile(file);
                        if (!newTitle) {
                          // Auto fill title from file name
                          const cleanName = file.name.replace(/\.[^/.]+$/, '');
                          setNewTitle(cleanName);
                        }
                      }
                    }}
                  />
                  <label htmlFor="new-audio-upload" className="cursor-pointer block">
                    <Music className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    {uploadAudioFile ? (
                      <div>
                        <p className="text-xs font-bold text-white truncate">{uploadAudioFile.name}</p>
                        <p className="text-[10px] text-white/50">{(uploadAudioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-white">Click or tap to choose audio file</p>
                        <p className="text-[10px] text-white/40 mt-0.5">High-fidelity files are automatically served at instant speed</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Track Title */}
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Song Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tum Hi Ho / Kesariya"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Artist and Album */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">Artist / Singer</label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Arijit Singh"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1">Album / Playlist</label>
                  <input
                    type="text"
                    value={newAlbum}
                    onChange={(e) => setNewAlbum(e.target.value)}
                    placeholder="e.g. Aashiqui 2 / Single"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Cover Art Image File (Optional) */}
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Cover Artwork Image (Optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id="new-cover-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadCoverFile(file);
                    }}
                  />
                  <label
                    htmlFor="new-cover-upload"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">
                      {uploadCoverFile ? uploadCoverFile.name : 'Choose image file...'}
                    </span>
                    <ImageIcon className="w-4 h-4 text-white/40 shrink-0 ml-2" />
                  </label>
                  {uploadCoverFile && (
                    <button
                      type="button"
                      onClick={() => setUploadCoverFile(null)}
                      className="p-2 text-white/40 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress feedback */}
              {uploadProgress && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTrackModal(false)}
                  disabled={isUploadingTrack}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingTrack || !uploadAudioFile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  {isUploadingTrack ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Add to App</span>
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
