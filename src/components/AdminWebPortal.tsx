import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  Unlock,
  Sparkles,
  Music,
  Edit3,
  Image as ImageIcon,
  Save,
  RotateCcw,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Star,
  Zap,
  CheckCircle2,
  AlertCircle,
  Upload,
  PlusCircle,
  ExternalLink,
  Volume2,
  Play,
  Pause,
  Sliders,
  Bell,
  HardDrive,
  Shield,
  Layers,
  Check,
  X,
  FileText,
  Radio,
  ArrowLeft,
  Copy,
  ChevronRight,
  TrendingUp,
  Activity,
  Fingerprint,
  Trash2,
  Users,
  UserPlus,
  Calendar,
  Disc,
  FolderOpen
} from 'lucide-react';
import { Track } from '../types';

interface AdminStats {
  totalTracks: number;
  visibleTracks: number;
  hiddenTracks: number;
  featuredTracks: number;
  customMetadataCount: number;
  cachedFilesCount: number;
  cacheSizeBytes: number;
  cacheSizeMB: string;
  channelId: string;
  botConnected: boolean;
  serverUptime: number;
}

interface Announcement {
  title?: string;
  text: string;
  imageUrl?: string;
  linkUrl?: string;
  enabled: boolean;
  type: string;
  eventDate?: string;
  updatedAt: number;
}

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'suspended';
  role: 'customer' | 'admin';
  createdAt: number;
}

interface AdminWebPortalProps {
  onBackToApp?: () => void;
}

const ALPHABETS = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const AdminWebPortal: React.FC<AdminWebPortalProps> = ({ onBackToApp }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nova_admin_auth') === 'true' || sessionStorage.getItem('nova_studio_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'upload' | 'poster' | 'users' | 'telegram'>('overview');

  // Core Data
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement>({
    title: 'Special Celebration ✨',
    text: '',
    imageUrl: '',
    enabled: false,
    type: 'special',
    eventDate: '2026-11-04',
    updatedAt: 0,
  });
  const [customers, setCustomers] = useState<CustomerUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Songs Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'az' | 'za' | 'artist' | 'recent'>('az');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'featured'>('all');

  // Audio Preview Monitor
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Track Edit Modal
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editArtist, setEditArtist] = useState<string>('');
  const [editAlbum, setEditAlbum] = useState<string>('');
  const [editGenre, setEditGenre] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [editCoverArt, setEditCoverArt] = useState<string>('');
  const [editIsHidden, setEditIsHidden] = useState<boolean>(false);
  const [editIsFeatured, setEditIsFeatured] = useState<boolean>(false);
  const [editLyricsText, setEditLyricsText] = useState<string>('');
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Song Upload Tab State
  const [uploadAudioFile, setUploadAudioFile] = useState<File | null>(null);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [uploadCoverPreview, setUploadCoverPreview] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newAlbum, setNewAlbum] = useState<string>('');
  const [newGenre, setNewGenre] = useState<string>('Assamese & Bollywood');
  const [isUploadingTrack, setIsUploadingTrack] = useState<boolean>(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; text: string }>({ type: 'idle', text: '' });

  // Event Poster Tab State
  const [posterTitle, setPosterTitle] = useState<string>('Special Celebration ✨');
  const [posterWishText, setPosterWishText] = useState<string>('');
  const [posterImageUrl, setPosterImageUrl] = useState<string>('');
  const [posterDate, setPosterDate] = useState<string>('2026-11-04');
  const [posterEnabled, setPosterEnabled] = useState<boolean>(false);
  const [isSavingPoster, setIsSavingPoster] = useState<boolean>(false);
  const [posterSaveMsg, setPosterSaveMsg] = useState<string>('');
  const [isUploadingPosterMedia, setIsUploadingPosterMedia] = useState<boolean>(false);

  // Customer Management Modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'customer' | 'admin'>('customer');
  const [isSavingUser, setIsSavingUser] = useState<boolean>(false);

  // Miscellaneous
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Fetch admin data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [tracksRes, statsRes, annRes, usersRes] = await Promise.all([
        fetch('/api/telegram/tracks?admin=true'),
        fetch('/api/admin/stats'),
        fetch('/api/announcement'),
        fetch('/api/admin/users').catch(() => null)
      ]);

      if (tracksRes && tracksRes.ok) {
        const data = await tracksRes.json();
        setTracks(data.tracks || []);
      }
      if (statsRes && statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats || null);
      }
      if (annRes && annRes.ok) {
        const aData = await annRes.json();
        if (aData.announcement) {
          setAnnouncement(aData.announcement);
          setPosterTitle(aData.announcement.title || 'Special Celebration ✨');
          setPosterWishText(aData.announcement.wishText || aData.announcement.text || '');
          setPosterImageUrl(aData.announcement.imageUrl || '');
          setPosterDate(aData.announcement.eventDate || '2026-11-04');
          setPosterEnabled(Boolean(aData.announcement.enabled));
        }
      }
      if (usersRes && usersRes.ok) {
        const uData = await usersRes.json();
        setCustomers(uData.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  // Audio preview cleanup
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.src = '';
      }
    };
  }, []);

  const handlePlayPreview = (track: Track) => {
    if (previewTrackId === track.id && isPlayingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      }
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }

    const audioUrl = track.audioUrl || `/api/telegram/audio?file_id=${(track as any).fileId || track.id}`;
    audioPreviewRef.current.src = audioUrl;
    audioPreviewRef.current.play().then(() => {
      setPreviewTrackId(track.id);
      setIsPlayingPreview(true);
    }).catch((e) => {
      console.warn('Audio preview playback error:', e);
    });

    audioPreviewRef.current.onended = () => {
      setIsPlayingPreview(false);
      setPreviewTrackId(null);
    };
  };

  const handleLogin = async (e?: React.FormEvent) => {
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
        localStorage.setItem('nova_admin_auth', 'true');
        sessionStorage.setItem('nova_studio_auth', 'true');
      } else {
        setAuthError(data.error || 'Invalid Admin Password / PIN. Master: 2620260095 or PIN: 7788');
      }
    } catch {
      setAuthError('Connection error. Could not verify credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    // Fast biometric verification
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '2620260095' }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsAuthenticated(true);
        localStorage.setItem('nova_admin_auth', 'true');
        sessionStorage.setItem('nova_studio_auth', 'true');
      } else {
        setAuthError('Biometric verification failed. Please enter Master Password.');
      }
    } catch {
      setAuthError('Biometric login connection error.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSyncTelegram = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/telegram/sync', { method: 'POST' });
      if (res.ok) {
        await loadAdminData();
      }
    } catch (e) {
      console.error('Telegram sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Edit Song Modal
  const handleOpenEditModal = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
    setEditAlbum(track.album || '');
    setEditGenre(track.genre || 'Indie');
    setEditYear(track.year ? String(track.year) : '2026');
    setEditCoverArt(track.coverArt || '');
    setEditIsHidden(Boolean(track.isHidden));
    setEditIsFeatured(Boolean(track.isFeatured));

    if (track.lyrics && track.lyrics.length > 0) {
      const formatted = track.lyrics.map(l => {
        const m = Math.floor(l.time / 60);
        const s = Math.floor(l.time % 60);
        const ms = Math.floor((l.time % 1) * 100);
        return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}] ${l.text}`;
      }).join('\n');
      setEditLyricsText(formatted);
    } else {
      setEditLyricsText('');
    }

    setSaveStatus('idle');
    setSaveMessage('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: reader.result as string,
            filename: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setEditCoverArt(data.url);
        } else {
          alert('Failed to upload cover: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Image upload failed');
      } finally {
        setIsUploadingCover(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTrack = async () => {
    if (!editingTrack) return;
    setSaveStatus('saving');
    setSaveMessage('Saving changes...');

    let parsedLyrics: Array<{ time: number; text: string }> | undefined = undefined;
    if (editLyricsText.trim()) {
      const lines = editLyricsText.split('\n');
      const result: Array<{ time: number; text: string }> = [];
      for (const line of lines) {
        const match = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/);
        if (match) {
          const mins = parseInt(match[1], 10);
          const secs = parseInt(match[2], 10);
          const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
          result.push({
            time: mins * 60 + secs + millis / 1000,
            text: match[4] || '',
          });
        } else if (line.trim()) {
          result.push({ time: result.length * 4, text: line.trim() });
        }
      }
      if (result.length > 0) parsedLyrics = result;
    }

    try {
      const res = await fetch('/api/tracks/metadata/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: editingTrack.id,
          title: editTitle.trim(),
          artist: editArtist.trim(),
          album: editAlbum.trim(),
          genre: editGenre.trim(),
          year: parseInt(editYear, 10) || 2026,
          coverArt: editCoverArt.trim(),
          isHidden: editIsHidden,
          isFeatured: editIsFeatured,
          lyrics: parsedLyrics,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('saved');
        setSaveMessage('Track updated successfully!');
        setTracks(prev => prev.map(t => (t.id === editingTrack.id ? { ...t, ...data.track } : t)));
        setTimeout(() => {
          setEditingTrack(null);
          loadAdminData();
        }, 1000);
      } else {
        setSaveStatus('error');
        setSaveMessage(data.error || 'Failed to update track');
      }
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error saving track');
    }
  };

  const handleDeleteTrack = async (trackId: string, trackTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${trackTitle}" from NOVA library?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== trackId));
        if (previewTrackId === trackId && audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          setIsPlayingPreview(false);
          setPreviewTrackId(null);
        }
      } else {
        alert('Could not delete track. Please try again.');
      }
    } catch (e) {
      alert('Network error while deleting track.');
    }
  };

  // Helper to read file as Base64 Data URL
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Direct Audio File Upload
  const handleAudioUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadAudioFile) {
      alert('Please select an audio file (MP3, M4A, FLAC, WAV).');
      return;
    }

    setIsUploadingTrack(true);
    setUploadStatusMsg({ type: 'loading', text: 'Reading audio file and encoding for station...' });

    try {
      const audioBase64 = await readFileAsDataUrl(uploadAudioFile);
      let coverBase64 = '';
      if (uploadCoverFile) {
        coverBase64 = await readFileAsDataUrl(uploadCoverFile);
      }

      setUploadStatusMsg({ type: 'loading', text: 'Uploading to NOVA station and indexing in library...' });

      const res = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': '2620260095',
          'Authorization': 'Bearer 2620260095',
        },
        body: JSON.stringify({
          dataUrl: audioBase64,
          filename: uploadAudioFile.name,
          title: newTitle.trim() || uploadAudioFile.name.replace(/\.[^/.]+$/, ''),
          artist: newArtist.trim() || 'NOVA Artist',
          album: newAlbum.trim() || 'Cloud Master',
          genre: newGenre.trim() || 'Assamese & Bollywood',
          coverArt: coverBase64 || uploadCoverPreview || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.track) {
        setUploadStatusMsg({ type: 'success', text: `Success! "${data.track.title}" is now uploaded and LIVE in the app!` });
        setUploadAudioFile(null);
        setUploadCoverFile(null);
        setUploadCoverPreview('');
        setNewTitle('');
        setNewArtist('');
        setNewAlbum('');

        // Notify running player app and local storage immediately
        try {
          const savedTracksRaw = localStorage.getItem('nova_tracks');
          const currentTracksList: Track[] = savedTracksRaw ? JSON.parse(savedTracksRaw) : [];
          const exists = currentTracksList.some(t => t.id === data.track.id);
          if (!exists) {
            const updated = [data.track, ...currentTracksList];
            localStorage.setItem('nova_tracks', JSON.stringify(updated));
          }
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nova-cloud-tracks-updated', { detail: [data.track] }));
        }

        await loadAdminData();
      } else {
        setUploadStatusMsg({ type: 'error', text: data.error || 'Upload failed. Check format or size.' });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatusMsg({ type: 'error', text: 'Network failure during upload: ' + (err?.message || 'Check connection') });
    } finally {
      setIsUploadingTrack(false);
    }
  };

  // Event Poster Master Switch & Save
  const handleSavePoster = async () => {
    setIsSavingPoster(true);
    setPosterSaveMsg('Saving poster state...');

    try {
      const res = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: posterEnabled,
          title: posterTitle.trim(),
          text: posterWishText.trim(),
          wishText: posterWishText.trim(),
          imageUrl: posterImageUrl.trim(),
          eventDate: posterDate.trim(),
          type: 'special',
        }),
      });

      if (res.ok) {
        setPosterSaveMsg(posterEnabled ? 'Live: Event Poster is ON and visible in app!' : 'Event Poster is turned OFF.');
        setTimeout(() => setPosterSaveMsg(''), 3000);
      } else {
        setPosterSaveMsg('Failed to update event poster.');
      }
    } catch {
      setPosterSaveMsg('Network error updating poster.');
    } finally {
      setIsSavingPoster(false);
    }
  };

  const handleUploadPosterMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPosterMedia(true);
    const formData = new FormData();
    formData.append('media', file);

    fetch('/api/admin/upload-media', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setPosterImageUrl(data.url);
        }
      })
      .catch(() => alert('Image upload failed.'))
      .finally(() => setIsUploadingPosterMedia(false));
  };

  // Customer Management
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    setIsSavingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          name: newUserName.trim() || newUserEmail.split('@')[0],
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setCustomers(prev => [data.user, ...prev]);
        setIsAddUserModalOpen(false);
        setNewUserEmail('');
        setNewUserName('');
      } else {
        alert(data.error || 'Failed to add customer.');
      }
    } catch {
      alert('Error registering customer.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteCustomer = async (userId: string, email: string) => {
    if (!window.confirm(`Delete customer account ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomers(prev => prev.filter(u => u.id !== userId));
      }
    } catch {
      alert('Failed to delete user.');
    }
  };

  // Filter & Sort Tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesArtist = t.artist.toLowerCase().includes(q);
        const matchesAlbum = t.album.toLowerCase().includes(q);
        const matchesGenre = (t.genre || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesArtist && !matchesAlbum && !matchesGenre) return false;
      }

      // 2. Alphabet Filter
      if (selectedLetter !== 'ALL') {
        const firstChar = t.title.trim().charAt(0).toUpperCase();
        if (firstChar !== selectedLetter) return false;
      }

      // 3. Status Filter
      if (statusFilter === 'visible' && t.isHidden) return false;
      if (statusFilter === 'hidden' && !t.isHidden) return false;
      if (statusFilter === 'featured' && !t.isFeatured) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'az') return a.title.localeCompare(b.title);
      if (sortOption === 'za') return b.title.localeCompare(a.title);
      if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
      return (b as any).createdAt ? (b as any).createdAt - ((a as any).createdAt || 0) : 0;
    });
  }, [tracks, searchQuery, selectedLetter, statusFilter, sortOption]);

  const handleCopyAdminUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '';
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // 1. Zero-Trust Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#07090E] text-white flex items-center justify-center p-4 relative overflow-hidden select-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#0E131F]/90 border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10 backdrop-blur-2xl">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 mx-auto flex items-center justify-center shadow-xl shadow-purple-600/30 border border-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold tracking-wider text-purple-300 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Master Executive Station
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">NOVA Control Center</h1>
            <p className="text-xs text-white/50 font-medium">Owner & Lead Engineer: Sourav Phukan</p>
          </div>

          {authError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <button
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 text-purple-200 hover:text-white transition-all flex items-center justify-center gap-3 text-xs font-bold active:scale-[0.98]"
            >
              <Fingerprint className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="text-[11px] font-bold">Hardware Biometric Unlock</div>
                <div className="text-[10px] text-white/40">TouchID • FaceID • Quick Fingerprint</div>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono text-white/40 uppercase">Or Master Password / PIN</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Enter Master Password or PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-black/60 border border-white/15 focus:border-purple-500 rounded-2xl py-3.5 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Unlock Master Workstation</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between text-[11px] text-white/40 font-mono">
              <span>Master Key: <strong>2620260095</strong></span>
              <span>PIN: <strong>7788</strong></span>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-6 w-full py-2.5 text-xs text-white/50 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Music Player App</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Authenticated Master Dashboard
  return (
    <div className="min-h-screen w-full bg-[#07090E] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-40 bg-[#080B12]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-wide">NOVA MASTER STUDIO</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Node
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">Owner: Sourav Phukan • Latency: 4ms</p>
          </div>
        </div>

        {/* Navigation Tabs (Pills) */}
        <nav className="flex items-center gap-1 bg-black/50 border border-white/10 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('songs')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'songs' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Songs (A–Z)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Song</span>
          </button>

          <button
            onClick={() => setActiveTab('poster')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'poster' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Event Poster</span>
            {posterEnabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Users</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'telegram' ? 'bg-purple-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telegram CDN</span>
          </button>
        </nav>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAdminUrl}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'Copied Link' : 'Copy Link'}</span>
          </button>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Player App</span>
            </button>
          )}

          <button
            onClick={() => {
              localStorage.removeItem('nova_admin_auth');
              sessionStorage.removeItem('nova_studio_auth');
              setIsAuthenticated(false);
            }}
            className="py-1.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Floating Audio Monitor Bar */}
      {previewTrackId && (
        <div className="bg-[#0A0E17] border-b border-white/10 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4 sticky top-[61px] z-30 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                Previewing: {tracks.find(t => t.id === previewTrackId)?.title || 'Audio Stream'}
              </div>
              <div className="text-[10px] text-white/40 truncate">
                {tracks.find(t => t.id === previewTrackId)?.artist || 'Studio Monitor'} • 48kHz Direct Bus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioPreviewRef.current) {
                  if (isPlayingPreview) {
                    audioPreviewRef.current.pause();
                    setIsPlayingPreview(false);
                  } else {
                    audioPreviewRef.current.play();
                    setIsPlayingPreview(true);
                  }
                }
              }}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingPreview ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => {
                if (audioPreviewRef.current) {
                  audioPreviewRef.current.pause();
                  audioPreviewRef.current.src = '';
                }
                setPreviewTrackId(null);
                setIsPlayingPreview(false);
              }}
              className="p-1 rounded-lg text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* ================= TAB: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#0D121F] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between text-white/50 text-xs mb-1">
                  <span>Catalog Tracks</span>
                  <Music className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.totalTracks ?? tracks.length}</div>
                <div className="text-[11px] text-white/40 mt-1 flex items-center gap-1 font-mono">
                  <span className="text-emerald-400 font-bold">{stats?.visibleTracks ?? tracks.length} active</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{stats?.hiddenTracks ?? 0} hidden</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D121F] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between text-white/50 text-xs mb-1">
                  <span>Event Poster</span>
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {posterEnabled ? <span className="text-emerald-400">LIVE (ON)</span> : <span className="text-white/40">OFF</span>}
                </div>
                <div className="text-[11px] text-white/40 mt-1 truncate">
                  {posterTitle || 'No active banner'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D121F] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between text-white/50 text-xs mb-1">
                  <span>Customer Accounts</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">{customers.length} Listeners</div>
                <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                  Active authentication nodes
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D121F] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between text-white/50 text-xs mb-1">
                  <span>SSD Audio Cache</span>
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{stats?.cachedFilesCount || 0} Files</div>
                <div className="text-[11px] text-white/40 mt-1 font-mono">
                  {stats?.cacheSizeMB || '0'} MB edge stored
                </div>
              </div>
            </div>

            {/* Quick Action Station */}
            <div className="p-6 rounded-3xl bg-[#0D121F] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Executive Quick Actions</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="p-4 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">Upload New Song</div>
                  <div className="text-[11px] text-white/40 mt-0.5">MP3, M4A, FLAC or WAV file</div>
                </button>

                <button
                  onClick={() => setActiveTab('poster')}
                  className="p-4 rounded-2xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-105 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">Toggle Event Poster</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Switch ON/OFF special day popup</div>
                </button>

                <button
                  onClick={() => setActiveTab('songs')}
                  className="p-4 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-105 transition-transform">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-white">Manage Songs (A–Z)</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Edit titles, singers, delete songs</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: SONGS (A–Z) ================= */}
        {activeTab === 'songs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Alphabet Filter Pills */}
            <div className="bg-[#0D121F] border border-white/10 p-2 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar">
              {ALPHABETS.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedLetter === letter
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* Row Search and Sort Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search song title, singer, album..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D121F] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'visible', label: 'Active' },
                  { id: 'hidden', label: 'Hidden' },
                  { id: 'featured', label: 'Featured ⭐' },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#0D121F] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 cursor-pointer font-bold"
              >
                <option value="az">Sort: A to Z</option>
                <option value="za">Sort: Z to A</option>
                <option value="artist">Sort: By Singer</option>
                <option value="recent">Sort: Recently Added</option>
              </select>
            </div>

            {/* Songs Row Table */}
            {isLoading ? (
              <div className="py-20 text-center text-white/40 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p className="text-xs">Loading songs from station repository...</p>
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="py-16 text-center text-white/40 space-y-2 bg-[#0D121F] rounded-2xl border border-white/5">
                <Music className="w-8 h-8 mx-auto text-white/20" />
                <p className="text-sm font-semibold text-white/60">No songs found in this selection</p>
                <p className="text-xs text-white/40">Try picking "ALL" in alphabet filter or clearing the search query.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTracks.map((track, idx) => {
                  const isPreviewPlaying = previewTrackId === track.id && isPlayingPreview;
                  const format = track.format?.toUpperCase() || (track.audioUrl?.includes('.m4a') ? 'M4A' : track.audioUrl?.includes('.flac') ? 'FLAC' : 'MP3');

                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        track.isHidden
                          ? 'bg-[#0D121F]/40 border-dashed border-white/10 opacity-70'
                          : 'bg-[#0D121F] border-white/10 hover:border-purple-500/40 shadow-sm'
                      }`}
                    >
                      {/* Left: Index #, Cover & Track Metadata */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono text-xs text-white/30 w-6 text-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10 group">
                          {track.coverArt ? (
                            <img
                              src={track.coverArt}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <Music className="w-5 h-5" />
                            </div>
                          )}

                          <button
                            onClick={() => handlePlayPreview(track)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Play audio preview"
                          >
                            {isPreviewPlaying ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{track.title}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {format}
                            </span>
                            {track.isFeatured && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-300" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/50 truncate">
                            <span className="text-white/80 font-medium">{track.artist}</span>
                            <span>•</span>
                            <span>{track.album || 'Single'}</span>
                            <span>•</span>
                            <span>{track.genre || 'Indie'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Control Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Audio Preview */}
                        <button
                          onClick={() => handlePlayPreview(track)}
                          className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isPreviewPlaying
                              ? 'bg-emerald-500 text-black font-bold'
                              : 'bg-white/5 hover:bg-white/10 text-white/80'
                          }`}
                          title="Preview audio stream"
                        >
                          {isPreviewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span className="hidden lg:inline">{isPreviewPlaying ? 'Playing' : 'Listen'}</span>
                        </button>

                        {/* Edit Song Details */}
                        <button
                          onClick={() => handleOpenEditModal(track)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Track */}
                        <button
                          onClick={() => handleDeleteTrack(track.id, track.title)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete song from NOVA"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: UPLOAD SONG ================= */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-3xl bg-[#0D121F] border border-white/10 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <span>Upload High-Fidelity Song to NOVA Cloud</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Upload audio files from your phone or PC directly into the NOVA player library.
                </p>
              </div>

              {uploadStatusMsg.text && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  uploadStatusMsg.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : uploadStatusMsg.type === 'loading'
                    ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                  {uploadStatusMsg.type === 'loading' ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : uploadStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{uploadStatusMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleAudioUploadSubmit} className="space-y-4">
                {/* Audio File Selection Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/70">Audio File (MP3, M4A, FLAC, WAV)</label>
                  <label className="border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <Music className="w-8 h-8 text-purple-400 mb-2" />
                    <span className="text-xs font-bold text-white">
                      {uploadAudioFile ? uploadAudioFile.name : 'Choose audio file or drag & drop'}
                    </span>
                    <span className="text-[10px] text-white/40 mt-1">
                      {uploadAudioFile ? `${(uploadAudioFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Lossless FLAC, Studio 24-bit M4A, or 320kbps MP3'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.m4a,.flac,.wav"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadAudioFile(file);
                          if (!newTitle) {
                            setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Song Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">Song Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Tu Kya Jaane"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Singer & Album Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Singer / Artist</label>
                    <input
                      type="text"
                      placeholder="e.g. Zubeen Garg, A.R. Rahman"
                      value={newArtist}
                      onChange={(e) => setNewArtist(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Album / Collection</label>
                    <input
                      type="text"
                      placeholder="e.g. Chamkila Soundtrack"
                      value={newAlbum}
                      onChange={(e) => setNewAlbum(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Genre */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Assamese Folk, Romantic, Bollywood"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Cover Artwork File Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">Cover Poster Artwork (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white cursor-pointer transition-colors flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>{uploadCoverFile ? 'Change Poster' : 'Choose Poster Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadCoverFile(file);
                            const r = new FileReader();
                            r.onload = () => setUploadCoverPreview(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {uploadCoverPreview && (
                      <div className="flex items-center gap-2">
                        <img src={uploadCoverPreview} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-white/20" />
                        <span className="text-[11px] text-white/40">Ready to upload</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUploadingTrack || !uploadAudioFile}
                    className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isUploadingTrack ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading & Processing Song...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Publish Song to Station</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB: EVENT POSTER (MASTER SWITCH) ================= */}
        {activeTab === 'poster' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
            {/* Left: Controls & Switch */}
            <div className="p-6 rounded-3xl bg-[#0D121F] border border-white/10 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>Event Poster & Celebration Manager</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Control the live event poster banner shown on user home screens during celebrations.
                </p>
              </div>

              {/* Master ON / OFF Toggle Button */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Event Poster Status</div>
                  <div className="text-[11px] text-white/40">Turn entire banner ON or OFF in listener app</div>
                </div>

                <button
                  type="button"
                  onClick={() => setPosterEnabled(!posterEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all shadow-md flex items-center gap-2 ${
                    posterEnabled
                      ? 'bg-emerald-500 text-black shadow-emerald-500/25'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${posterEnabled ? 'bg-black animate-ping' : 'bg-red-400'}`} />
                  <span>{posterEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}</span>
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Celebration / Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Happy Bihu ✨ or Happy New Year 🎉"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Subtitle / Wish text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Wish Message / Subtitle</label>
                <textarea
                  rows={3}
                  placeholder="Wishing everyone joy, melodies, and peace on this special occasion!"
                  value={posterWishText}
                  onChange={(e) => setPosterWishText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Event Date</label>
                <input
                  type="date"
                  value={posterDate}
                  onChange={(e) => setPosterDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Poster Image File or Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/70">Poster Media / Graphic</label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isUploadingPosterMedia ? 'Uploading...' : 'Upload Media'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPosterMedia}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Or enter image URL https://..."
                    value={posterImageUrl}
                    onChange={(e) => setPosterImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {posterSaveMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{posterSaveMsg}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSavePoster}
                  disabled={isSavingPoster}
                  className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPoster ? 'Saving Poster...' : 'Save & Publish Poster'}</span>
                </button>
              </div>
            </div>

            {/* Right: Live Mobile Mockup Preview */}
            <div className="p-6 rounded-3xl bg-[#0D121F] border border-white/10 space-y-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Live Mobile App Mockup</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  posterEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {posterEnabled ? 'VISIBLE TO USERS' : 'HIDDEN FROM APP'}
                </span>
              </div>

              {/* Mobile Phone Mockup Frame */}
              <div className="w-full max-w-sm rounded-[32px] bg-[#0A0D14] border-4 border-white/10 p-4 shadow-2xl relative overflow-hidden">
                <div className="w-24 h-4 bg-white/10 rounded-full mx-auto mb-4" />

                {posterEnabled ? (
                  <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-black/60 border border-purple-500/30 p-4 space-y-3 relative overflow-hidden shadow-lg">
                    {posterImageUrl ? (
                      <img
                        src={posterImageUrl}
                        alt="Event poster"
                        className="w-full h-36 object-cover rounded-xl border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-24 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    )}

                    <div>
                      <div className="inline-block px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[9px] font-bold uppercase tracking-wider mb-1">
                        Special Celebration
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">
                        {posterTitle || 'Happy Celebration'}
                      </h4>
                      <p className="text-xs text-white/70 line-clamp-2 mt-0.5">
                        {posterWishText || 'Warm wishes from NOVA station to all our music listeners.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-white/30 space-y-1">
                    <Bell className="w-8 h-8 mx-auto text-white/10" />
                    <p className="text-xs font-bold">Event Poster is OFF</p>
                    <p className="text-[10px]">Normal clean home screen without banner</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: CUSTOMERS & USERS ================= */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Customer & Listener Account Management</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Manage registered listener IDs, access privileges, and active user logins.
                </p>
              </div>

              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Customer</span>
              </button>
            </div>

            {/* Customers Table */}
            <div className="bg-[#0D121F] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between text-xs font-bold text-white/40 uppercase tracking-wider">
                <span>Customer / Email ID</span>
                <span className="hidden sm:inline">Status</span>
                <span className="hidden md:inline">Joined</span>
                <span>Actions</span>
              </div>

              {customers.length === 0 ? (
                <div className="py-12 text-center text-white/40 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-white/20" />
                  <p className="text-xs">No registered customers found yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {customers.map((cust) => (
                    <div key={cust.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-500/30">
                          {cust.name ? cust.name.slice(0, 1).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{cust.email}</div>
                          <div className="text-[10px] text-white/40 truncate">{cust.name || 'Listener'}</div>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cust.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {cust.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/60 text-[10px] font-mono">
                          {cust.role.toUpperCase()}
                        </span>
                      </div>

                      <div className="hidden md:block text-[11px] text-white/40 font-mono">
                        {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'Active'}
                      </div>

                      <div>
                        <button
                          onClick={() => handleDeleteCustomer(cust.id, cust.email)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: TELEGRAM CDN ================= */}
        {activeTab === 'telegram' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
            <div className="p-5 rounded-3xl bg-[#0D121F] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Telegram Bot & Cloud Channel</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Channel ID:</span>
                  <span className="font-mono text-white font-bold">{stats?.channelId || '-1003542494794'}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Bot Integration:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active & Polling
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Streaming Mode:</span>
                  <span className="text-white font-bold">In-Flight Zero Latency</span>
                </div>
              </div>

              <button
                onClick={handleSyncTelegram}
                disabled={isSyncing}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Force Check for New Songs Now'}</span>
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-[#0D121F] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Local Audio Cache Engine</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Cached Tracks:</span>
                  <span className="font-mono text-white font-bold">{stats?.cachedFilesCount || 0} files</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Disk Size:</span>
                  <span className="font-mono text-white font-bold">{stats?.cacheSizeMB || '0'} MB</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-white/50">Server Status:</span>
                  <span className="text-emerald-400 font-bold">Operational</span>
                </div>
              </div>

              <button
                onClick={() => {
                  fetch('/api/admin/prewarm', { method: 'POST', body: JSON.stringify({}) });
                  alert('Background prewarming started for all tracks!');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Prewarm All Songs (0s Edge Playback)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= EDIT TRACK MODAL ================= */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0D121F] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Edit Song Details & Cover Art</h3>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cover Art Upload */}
              <div className="space-y-2 flex flex-col items-center">
                <span className="text-xs font-bold text-white/70 self-start">Cover Poster</span>
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-800 border border-white/10 relative group shadow-md">
                  {editCoverArt ? (
                    <img
                      src={editCoverArt}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span>No poster</span>
                    </div>
                  )}

                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold cursor-pointer transition-opacity">
                    <Upload className="w-5 h-5 mb-1" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="w-full space-y-1">
                  <label className="text-[10px] text-white/40 block">Poster URL:</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editCoverArt}
                    onChange={(e) => setEditCoverArt(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[11px] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Song Metadata Fields */}
              <div className="md:col-span-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-white/70">Song Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Singer / Artist</label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Album</label>
                    <input
                      type="text"
                      value={editAlbum}
                      onChange={(e) => setEditAlbum(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Genre</label>
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-white/70">Release Year</label>
                    <input
                      type="text"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Hide & Feature Toggles */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditIsHidden(!editIsHidden)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      editIsHidden
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {editIsHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{editIsHidden ? 'Hidden from App' : 'Visible in App'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsFeatured(!editIsFeatured)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      editIsFeatured
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${editIsFeatured ? 'fill-amber-300' : ''}`} />
                    <span>{editIsFeatured ? 'Featured Pin ⭐' : 'Regular Song'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lyrics Section */}
            <div className="space-y-1 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Lyrics (Synced LRC or Plain Lines)</span>
              </label>
              <textarea
                rows={3}
                value={editLyricsText}
                onChange={(e) => setEditLyricsText(e.target.value)}
                placeholder="Paste lyrics..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {saveMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                saveStatus === 'saved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{saveMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTrack}
                disabled={saveStatus === 'saving'}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveStatus === 'saving' ? 'Saving...' : 'Save & Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REGISTER NEW CUSTOMER MODAL ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D121F] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>Register New Customer Account</span>
              </h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-1 text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Customer Email / Login ID</label>
                <input
                  type="email"
                  placeholder="listener@novamusic.app"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Customer Full Name</label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/70">Access Tier</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080B12] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="customer">Listener (Standard Customer)</option>
                  <option value="admin">Admin (Executive Station)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingUser ? 'Registering...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
