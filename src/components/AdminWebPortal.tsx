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
  Fingerprint
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
  updatedAt: number;
}

interface AdminWebPortalProps {
  onBackToApp?: () => void;
}

export const AdminWebPortal: React.FC<AdminWebPortalProps> = ({ onBackToApp }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('nova_admin_auth') === 'true' || sessionStorage.getItem('nova_studio_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Data state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement>({
    text: '',
    enabled: false,
    type: 'info',
    updatedAt: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tracks' | 'categories' | 'announcements' | 'users' | 'system'>('tracks');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'featured' | 'custom'>('all');
  const [artistFilter, setArtistFilter] = useState<string>('all');

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

  // Audio Preview state
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // New Song Upload
  const [uploadAudioFile, setUploadAudioFile] = useState<File | null>(null);
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newArtist, setNewArtist] = useState<string>('');
  const [newAlbum, setNewAlbum] = useState<string>('');
  const [isUploadingTrack, setIsUploadingTrack] = useState<boolean>(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string>('');

  // Announcement edit
  const [announcementTitle, setAnnouncementTitle] = useState<string>('Special Celebration ✨');
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [announcementImageUrl, setAnnouncementImageUrl] = useState<string>('');
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(true);
  const [announcementType, setAnnouncementType] = useState<string>('special');
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState<boolean>(false);
  const [announcementSaved, setAnnouncementSaved] = useState<boolean>(false);
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState<boolean>(false);

  // Category Edit Modal (Singers / Artists & Albums)
  const [categoryModalMode, setCategoryModalMode] = useState<'artist' | 'album' | null>(null);
  const [categoryOldName, setCategoryOldName] = useState<string>('');
  const [categoryNewName, setCategoryNewName] = useState<string>('');
  const [categoryCoverArt, setCategoryCoverArt] = useState<string>('');
  const [categoryGenre, setCategoryGenre] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  const [categorySaveMsg, setCategorySaveMsg] = useState<string>('');

  // Prewarm state
  const [prewarmingId, setPrewarmingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Fetch all tracks including hidden ones for admin
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [tracksRes, statsRes, annRes] = await Promise.all([
        fetch('/api/telegram/tracks?admin=true'),
        fetch('/api/admin/stats'),
        fetch('/api/announcement'),
      ]);

      if (tracksRes.ok) {
        const data = await tracksRes.json();
        setTracks(data.tracks || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats || null);
      }
      if (annRes.ok) {
        const aData = await annRes.json();
        if (aData.announcement) {
          setAnnouncement(aData.announcement);
          setAnnouncementTitle(aData.announcement.title || 'Special Celebration ✨');
          setAnnouncementText(aData.announcement.text || '');
          setAnnouncementImageUrl(aData.announcement.imageUrl || '');
          setAnnouncementEnabled(aData.announcement.enabled ?? true);
          setAnnouncementType(aData.announcement.type || 'special');
        }
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

  // Audio Preview Player Controller
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
      console.warn('Audio preview failed:', e);
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
        setAuthError(data.error || 'Invalid Admin Password/PIN. (Master: 2620260095 or PIN: 7788)');
      }
    } catch {
      setAuthError('Connection error. Could not verify PIN.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    // If WebAuthn is supported on the phone/browser
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Try WebAuthn authentication ceremony
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
          }
        }).catch(() => null);

        if (assertion) {
          setIsAuthenticated(true);
          localStorage.setItem('nova_admin_auth', 'true');
          sessionStorage.setItem('nova_studio_auth', 'true');
          setIsAuthenticating(false);
          return;
        }
      } catch {
        // Fallback below
      }
    }

    // Direct hardware biometric handshake fallback with server
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
        setAuthError('Biometric authentication failed. Please enter Master Password.');
      }
    } catch {
      setAuthError('Connection error during biometric login.');
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
          alert('Failed to upload image: ' + (data.error || 'Unknown error'));
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

    // Parse lyrics if any
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
        // Update local tracks list
        setTracks(prev => prev.map(t => (t.id === editingTrack.id ? { ...t, ...data.track } : t)));
        setTimeout(() => {
          setEditingTrack(null);
          loadAdminData();
        }, 1200);
      } else {
        setSaveStatus('error');
        setSaveMessage(data.error || 'Failed to update track');
      }
    } catch {
      setSaveStatus('error');
      setSaveMessage('Network error saving track');
    }
  };

  const handleToggleHide = async (track: Track) => {
    const nextHidden = !track.isHidden;
    try {
      const res = await fetch('/api/tracks/metadata/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          isHidden: nextHidden,
        }),
      });
      if (res.ok) {
        setTracks(prev => prev.map(t => (t.id === track.id ? { ...t, isHidden: nextHidden } : t)));
        if (stats) {
          setStats({
            ...stats,
            hiddenTracks: stats.hiddenTracks + (nextHidden ? 1 : -1),
            visibleTracks: stats.visibleTracks + (nextHidden ? -1 : 1),
          });
        }
      }
    } catch (e) {
      console.error('Failed to toggle hide:', e);
    }
  };

  const handleToggleFeatured = async (track: Track) => {
    const nextFeatured = !track.isFeatured;
    try {
      const res = await fetch('/api/tracks/metadata/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          isFeatured: nextFeatured,
        }),
      });
      if (res.ok) {
        setTracks(prev => prev.map(t => (t.id === track.id ? { ...t, isFeatured: nextFeatured } : t)));
      }
    } catch (e) {
      console.error('Failed to toggle featured:', e);
    }
  };

  const handlePrewarmTrack = async (track: Track) => {
    setPrewarmingId(track.id);
    const fileId = (track as any).fileId || track.id;
    try {
      await fetch('/api/admin/prewarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
      await loadAdminData();
    } catch (e) {
      console.error('Prewarm failed:', e);
    } finally {
      setTimeout(() => setPrewarmingId(null), 1500);
    }
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBannerImg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: reader.result as string,
            filename: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setAnnouncementImageUrl(data.url);
        } else {
          alert('Failed to upload media from phone: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Media upload from device failed');
      } finally {
        setIsUploadingBannerImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          text: announcementText.trim(),
          imageUrl: announcementImageUrl.trim(),
          enabled: announcementEnabled,
          type: announcementType,
        }),
      });
      if (res.ok) {
        setAnnouncementSaved(true);
        setTimeout(() => setAnnouncementSaved(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save announcement:', e);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleOpenCategoryModal = (mode: 'artist' | 'album', currentName: string) => {
    setCategoryModalMode(mode);
    setCategoryOldName(currentName);
    setCategoryNewName(currentName);
    // Find a representative track for current cover and genre
    const sample = tracks.find(t => 
      mode === 'artist' ? t.artist.toLowerCase().trim() === currentName.toLowerCase().trim() :
      t.album.toLowerCase().trim() === currentName.toLowerCase().trim()
    );
    setCategoryCoverArt(sample?.coverArt || '');
    setCategoryGenre(sample?.genre || '');
    setCategorySaveMsg('');
  };

  const handleSaveCategory = async () => {
    if (!categoryModalMode || !categoryOldName || !categoryNewName.trim()) return;
    setIsSavingCategory(true);
    setCategorySaveMsg('Updating category across all songs...');

    try {
      const res = await fetch('/api/tracks/category/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: categoryModalMode,
          oldName: categoryOldName,
          newName: categoryNewName.trim(),
          coverArt: categoryCoverArt.trim(),
          genre: categoryGenre.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategorySaveMsg(`Success! Updated ${data.affectedCount || 0} songs.`);
        setTimeout(() => {
          setCategoryModalMode(null);
          loadAdminData();
        }, 1200);
      } else {
        setCategorySaveMsg(data.error || 'Failed to update category');
      }
    } catch {
      setCategorySaveMsg('Network error updating category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCopyAdminUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/admin` : '';
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Distinct artists list
  const distinctArtists = useMemo(() => {
    const map = new Map<string, { name: string; count: number; coverArt?: string; genre?: string }>();
    tracks.forEach(t => {
      const name = (t.artist || 'Unknown Artist').trim();
      const existing = map.get(name);
      if (existing) {
        existing.count++;
        if (!existing.coverArt && t.coverArt) existing.coverArt = t.coverArt;
      } else {
        map.set(name, { name, count: 1, coverArt: t.coverArt, genre: t.genre });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [tracks]);

  // Distinct albums list
  const distinctAlbums = useMemo(() => {
    const map = new Map<string, { name: string; artist: string; count: number; coverArt?: string; genre?: string }>();
    tracks.forEach(t => {
      const name = (t.album || 'Single Tracks').trim();
      const existing = map.get(name);
      if (existing) {
        existing.count++;
        if (!existing.coverArt && t.coverArt) existing.coverArt = t.coverArt;
      } else {
        map.set(name, { name, artist: t.artist, count: 1, coverArt: t.coverArt, genre: t.genre });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [tracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      // Status filter
      if (statusFilter === 'visible' && t.isHidden) return false;
      if (statusFilter === 'hidden' && !t.isHidden) return false;
      if (statusFilter === 'featured' && !t.isFeatured) return false;
      if (statusFilter === 'custom' && !t.hasCustomMetadata) return false;

      // Artist filter
      if (artistFilter !== 'all' && t.artist !== artistFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchArtist = t.artist.toLowerCase().includes(q);
        const matchAlbum = (t.album || '').toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchAlbum) return false;
      }

      return true;
    });
  }, [tracks, statusFilter, artistFilter, searchQuery]);

  // 1. PIN Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Top Logo & Branding */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mx-auto flex items-center justify-center text-white shadow-2xl shadow-purple-500/20 border border-white/10">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">NOVA Cloud Admin</h1>
            <p className="text-xs text-white/50">Private Music & Telegram Bot Management Portal</p>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 font-medium">
              <span>Lead Engineer:</span>
              <span className="text-purple-400 font-semibold">Sourav Phukan</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Admin Authentication</span>
              </h2>
              <p className="text-xs text-white/50">Enter your secure Studio PIN to manage songs, metadata, and users.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter Master Password or PIN (2620260095)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-center text-base tracking-wider placeholder:tracking-normal placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="submit"
                  disabled={isAuthenticating || !pinInput.trim()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Portal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={isAuthenticating}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  <span>Fingerprint / Face</span>
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
              <span>Master Key: <strong>2620260095</strong></span>
              <span>PIN: <strong>7788</strong></span>
            </div>
          </div>

          {/* Quick return button */}
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="w-full py-2.5 text-xs text-white/50 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Music Player App</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Main Authenticated Admin Portal
  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[#0f0f16]/95 border-b border-white/10 backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Creator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">NOVA Admin Portal</h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                  Web Console
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                NOVA Music Player • Creator: <span className="text-purple-300 font-semibold">Sourav Phukan</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Portal URL copy */}
            <button
              onClick={handleCopyAdminUrl}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors"
              title="Copy secret link for PC or browser"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied Link!' : 'Copy Portal URL'}</span>
            </button>

            {/* Telegram Sync Button */}
            <button
              onClick={handleSyncTelegram}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-all active:scale-95 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Telegram'}</span>
            </button>

            {/* Switch to Player App */}
            {onBackToApp ? (
              <button
                onClick={onBackToApp}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Player App</span>
              </button>
            ) : (
              <a
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Player App</span>
              </a>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                localStorage.removeItem('nova_admin_auth');
                sessionStorage.removeItem('nova_studio_auth');
                setIsAuthenticated(false);
              }}
              className="p-1.5 rounded-xl text-white/40 hover:text-rose-400 transition-colors"
              title="Lock Admin Console"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1">
              <span>Total Songs</span>
              <Music className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.totalTracks ?? tracks.length}</div>
            <div className="text-[11px] text-white/40 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{stats?.visibleTracks ?? tracks.length} active</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{stats?.hiddenTracks ?? 0} hidden</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1">
              <span>Instant Disk Cache</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.cachedFilesCount ?? 0} Tracks</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <span>0-second delay playback ready</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1">
              <span>Telegram Channel</span>
              <Radio className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-base font-bold text-white truncate">NOVA Cloud</div>
            <div className="text-[11px] text-white/40 mt-1 truncate">
              ID: {stats?.channelId || '-1003542494794'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1">
              <span>Custom Posters & Metadata</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats?.customMetadataCount ?? 0} Overrides</div>
            <div className="text-[11px] text-white/40 mt-1">
              Custom titles, artists & HD artwork
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tracks'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Manage All Songs ({tracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Artists & Albums ({distinctArtists.length + distinctAlbums.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Special Day & Banners</span>
            {announcement.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>User Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bot & Cloud Server</span>
          </button>
        </div>

        {/* TAB 1: ALL TRACKS MANAGEMENT */}
        {activeTab === 'tracks' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by song name, artist, or album..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Songs' },
                  { id: 'visible', label: 'Active in App' },
                  { id: 'hidden', label: 'Hidden / Draft' },
                  { id: 'featured', label: 'Featured ⭐' },
                  { id: 'custom', label: 'Edited' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Artist dropdown filter */}
              {distinctArtists.length > 0 && (
                <select
                  value={artistFilter}
                  onChange={(e) => setArtistFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">All Artists ({distinctArtists.length})</option>
                  {distinctArtists.map((art) => (
                    <option key={art.name} value={art.name}>
                      {art.name} ({art.count})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tracks List / Table */}
            {isLoading ? (
              <div className="py-16 text-center text-white/40 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p className="text-xs">Loading tracks from Telegram Cloud & local cache...</p>
              </div>
            ) : filteredTracks.length === 0 ? (
              <div className="py-16 text-center text-white/40 space-y-2 bg-neutral-900/40 rounded-2xl border border-white/5">
                <Music className="w-8 h-8 mx-auto text-white/20" />
                <p className="text-sm font-semibold text-white/60">No songs found matching your criteria</p>
                <p className="text-xs text-white/40">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredTracks.map((track) => {
                  const isHidden = track.isHidden;
                  const isFeatured = track.isFeatured;
                  const isPreviewPlaying = previewTrackId === track.id && isPlayingPreview;
                  const isThisPrewarming = prewarmingId === track.id;

                  return (
                    <div
                      key={track.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isHidden
                          ? 'bg-neutral-900/40 border-dashed border-white/10 opacity-75'
                          : 'bg-neutral-900/80 border-white/10 hover:border-white/20 shadow-md'
                      }`}
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Cover thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 border border-white/10">
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

                          {/* Quick preview audio button overlay */}
                          <button
                            onClick={() => handlePlayPreview(track)}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                            title="Play audio preview"
                          >
                            {isPreviewPlaying ? (
                              <Pause className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Play className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>

                        {/* Title, Artist, & Badges */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
                            {isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-300" />
                                <span>Featured</span>
                              </span>
                            )}
                            {isHidden && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" />
                                <span>Hidden</span>
                              </span>
                            )}
                            {track.hasCustomMetadata && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                                Custom Poster
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-white/50 truncate">
                            <span className="text-white/80 font-medium">{track.artist}</span>
                            <span>•</span>
                            <span>{track.album || 'Cloud Single'}</span>
                            <span>•</span>
                            <span>{track.genre || 'Indie'}</span>
                            {track.duration > 0 && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Audio Preview toggle button */}
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
                          <span className="hidden md:inline">{isPreviewPlaying ? 'Playing' : 'Listen'}</span>
                        </button>

                        {/* Prewarm to disk */}
                        <button
                          onClick={() => handlePrewarmTrack(track)}
                          disabled={isThisPrewarming}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-emerald-400 transition-colors"
                          title="Pre-cache track on server disk for 0s play"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isThisPrewarming ? 'animate-bounce text-emerald-400' : ''}`} />
                        </button>

                        {/* Featured Star Toggle */}
                        <button
                          onClick={() => handleToggleFeatured(track)}
                          className={`p-2 rounded-xl transition-colors ${
                            isFeatured ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/40 hover:text-white'
                          }`}
                          title={isFeatured ? 'Remove from Featured' : 'Pin to Featured'}
                        >
                          <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-300' : ''}`} />
                        </button>

                        {/* Hide / Unhide Toggle */}
                        <button
                          onClick={() => handleToggleHide(track)}
                          className={`p-2 rounded-xl transition-colors ${
                            isHidden
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-white/5 text-white/40 hover:text-emerald-400'
                          }`}
                          title={isHidden ? 'Publish to App' : 'Hide from App'}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(track)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: CATEGORY EDITING (Singers / Artists & Albums Bulk Management) */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Category-Wise Management (Singers & Albums)</span>
                </h2>
                <p className="text-xs text-white/50 mt-0.5">
                  Fix or customize singer names, album titles, and album poster artwork across all songs in one single click.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  {distinctArtists.length} Singers
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  {distinctAlbums.length} Albums
                </span>
              </div>
            </div>

            {/* Section 1: Singers / Artists Category */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Singers & Artists Directory</span>
                  <span className="text-xs font-semibold text-white/40">({distinctArtists.length})</span>
                </h3>
                <span className="text-[11px] text-white/40">Click "Edit Singer" to update across all their tracks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {distinctArtists.map((artist) => (
                  <div
                    key={artist.name}
                    className="p-3.5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0 border border-white/10">
                        {artist.coverArt ? (
                          <img src={artist.coverArt} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold">
                            {artist.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{artist.name}</h4>
                        <span className="text-[11px] text-purple-300 font-semibold">{artist.count} {artist.count === 1 ? 'song' : 'songs'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCategoryModal('artist', artist.name)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-purple-600 text-white/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0 border border-white/5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Singer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Albums Category */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Albums & Collections Directory</span>
                  <span className="text-xs font-semibold text-white/40">({distinctAlbums.length})</span>
                </h3>
                <span className="text-[11px] text-white/40">Click "Edit Album" to update title & album artwork</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {distinctAlbums.map((album) => (
                  <div
                    key={album.name}
                    className="p-3.5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800 overflow-hidden flex-shrink-0 border border-white/10">
                        {album.coverArt ? (
                          <img src={album.coverArt} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30">
                            <Music className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{album.name}</h4>
                        <span className="text-[11px] text-indigo-300 font-semibold">{album.count} {album.count === 1 ? 'track' : 'tracks'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenCategoryModal('album', album.name)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600 text-white/80 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0 border border-white/5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Album</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: USER ACCOUNTS & MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-5 max-w-3xl animate-in fade-in duration-300">
            <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Listener Accounts & Access Controls</span>
                </h2>
                <p className="text-xs text-white/50">
                  Manage user profiles, accounts, and listenership status for NOVA Player users.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold">
                      SP
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Sourav Phukan (Creator & Super Admin)</h4>
                      <p className="text-[11px] text-white/40">souravphukan36@gmail.com • Full Master Privileges</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                    Master Admin
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Public Listener Web Login</h4>
                    <p className="text-[11px] text-white/40">Dedicated login page for your friends & users to stream and save favorites</p>
                  </div>
                  <a
                    href="/login.html"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Open User Login Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPECIAL DAY & CREATOR ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-5 max-w-3xl">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Live Special Day & User Announcement Banner</span>
              </h2>
              <p className="text-xs text-white/50">
                Signify important days (festivals, celebrations, releases) with a dedicated photo banner, title, and message at the top of the listener app.
              </p>
            </div>

            <div className="space-y-4">
              {/* Enable / Disable Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <span className="text-xs font-bold text-white block">Banner Active Status</span>
                  <span className="text-[11px] text-white/40">When turned on, banner appears immediately on the listener app</span>
                </div>
                <button
                  onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    announcementEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {announcementEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
                </button>
              </div>

              {/* Banner Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/70">Banner Occasion / Style</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'special', label: 'Special Day 🎉' },
                    { id: 'festival', label: 'Festival / Celebration 🪔' },
                    { id: 'update', label: 'Song Update 🎵' },
                    { id: 'info', label: 'Announcement 📢' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAnnouncementType(t.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        announcementType === t.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/70">Occasion / Banner Title</label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Happy Bihu! 🎉 or Special Weekend Vibes ✨"
                  className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-semibold"
                />
              </div>

              {/* Banner Photo / Video from Phone Storage */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/80 flex items-center justify-between">
                  <span>📱 Event Media (Upload from Phone Storage / Gallery)</span>
                  {isUploadingBannerImg && <span className="text-[11px] text-purple-400 animate-pulse font-mono">Uploading from device...</span>}
                </label>

                {/* Big Direct Phone Upload Card */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/15 text-center transition-all">
                  {announcementImageUrl ? (
                    <div className="space-y-3">
                      <div className="relative max-w-sm mx-auto h-36 rounded-xl overflow-hidden border border-purple-500/40 bg-black/60 shadow-lg">
                        {announcementImageUrl.match(/\.(mp4|webm|mov|m4v)/i) || announcementImageUrl.includes('event_vid') ? (
                          <video src={announcementImageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={announcementImageUrl} alt="Uploaded Event Poster" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur text-[10px] font-bold font-mono text-purple-300 border border-purple-500/30">
                          <span>📱 ATTACHED FROM STORAGE</span>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white cursor-pointer shadow-md transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Change Photo / Video File</span>
                        <input
                          type="file"
                          accept="image/*,video/*,.mp4,.webm,.mov,.m4v"
                          onChange={handleBannerImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-2 cursor-pointer group">
                      <div className="w-11 h-11 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">
                        Tap to Select Photo or Video from Phone
                      </span>
                      <span className="text-[11px] text-white/50">
                        Gallery • Camera Roll • Phone Files (MP4, WebM, JPG, PNG)
                      </span>
                      <div className="mt-1 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md">
                        📁 Open Gallery / Storage
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/*,.mp4,.webm,.mov,.m4v"
                        onChange={handleBannerImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Collapsible Web Link Fallback */}
                <details className="text-[11px] text-white/40 pt-0.5">
                  <summary className="cursor-pointer hover:text-white/70 font-medium">Or paste web link instead (optional)</summary>
                  <input
                    type="text"
                    value={announcementImageUrl}
                    onChange={(e) => setAnnouncementImageUrl(e.target.value)}
                    placeholder="https://... image link"
                    className="w-full mt-1.5 p-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 font-mono"
                  />
                </details>
              </div>

              {/* Banner Message Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/70">Announcement Words / Description</label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="e.g., Wishing everyone joy, good health, and memorable melodies this auspicious day!"
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Live Preview of Special Day Banner */}
              {announcementEnabled && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">Live Listener App Preview</span>
                  <div className="p-3.5 sm:p-4 rounded-3xl bg-[#12121a] border border-purple-500/30 flex items-center gap-3.5 shadow-xl relative overflow-hidden">
                    {announcementImageUrl ? (
                      <img
                        src={announcementImageUrl}
                        alt="Special Banner"
                        className="w-13 h-13 rounded-2xl object-cover border border-white/10 shadow-md flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300">
                          {announcementType}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {announcementTitle || 'Special Day Title'}
                        </h4>
                      </div>
                      <p className="text-xs text-white/80 font-medium line-clamp-2 mt-0.5">
                        {announcementText || 'Your celebration message or update words will appear here.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleSaveAnnouncement}
                  disabled={isSavingAnnouncement}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAnnouncement ? 'Saving...' : 'Publish Special Day Banner'}</span>
                </button>
                {announcementSaved && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Published live to user app!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM & BOT CONTROLS */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Telegram Channel Details */}
            <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
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
                <span>Force Check for New Songs Now</span>
              </button>
            </div>

            {/* Cache & Edge Speed */}
            <div className="p-5 rounded-3xl bg-neutral-900/80 border border-white/10 space-y-4">
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
                  <span className="text-white/50">Server Uptime:</span>
                  <span className="text-white font-bold">{stats?.serverUptime ? `${Math.floor(stats.serverUptime / 60)} mins` : 'Online'}</span>
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

      {/* EDIT MODAL DIALOG */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#12121a] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Edit Song & Cover Art</h3>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1 rounded-lg text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Poster & Basic Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cover Art Upload / Preview */}
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

                  {/* Upload overlay */}
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
                  <label className="text-[10px] text-white/40 block">Or Poster Image URL:</label>
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

                {/* Toggles: Hide & Feature */}
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
                rows={4}
                value={editLyricsText}
                onChange={(e) => setEditLyricsText(e.target.value)}
                placeholder="Paste LRC format [00:15.00] lyrics or plain song lyrics..."
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Save Status Banner */}
            {saveMessage && (
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                saveStatus === 'saved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{saveMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
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

      {/* Category (Singer / Album) Edit Modal */}
      {categoryModalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#12121a] border border-white/10 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Edit {categoryModalMode === 'artist' ? 'Singer / Artist' : 'Album / Collection'}
                  </h3>
                  <p className="text-[11px] text-white/40">
                    Changes will apply to all songs under "{categoryOldName}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCategoryModalMode(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Name field */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold block">
                  {categoryModalMode === 'artist' ? 'Singer Name' : 'Album Name'}
                </label>
                <input
                  type="text"
                  value={categoryNewName}
                  onChange={(e) => setCategoryNewName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:outline-none focus:border-purple-500"
                  placeholder="Enter new name..."
                />
              </div>

              {/* Cover Art field */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold block">
                  {categoryModalMode === 'artist' ? 'Artist Profile Photo URL' : 'Album Poster / Cover Artwork URL'}
                </label>
                <input
                  type="text"
                  value={categoryCoverArt}
                  onChange={(e) => setCategoryCoverArt(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:outline-none focus:border-purple-500"
                  placeholder="https://... cover image link"
                />
                {categoryCoverArt && (
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={categoryCoverArt}
                      alt="Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] text-white/40">Poster preview</span>
                  </div>
                )}
              </div>

              {/* Genre (optional) */}
              <div className="space-y-1">
                <label className="text-white/70 font-bold block">Primary Genre (Optional)</label>
                <input
                  type="text"
                  value={categoryGenre}
                  onChange={(e) => setCategoryGenre(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Assamese Folk, Romantic, Bollywood, EDM"
                />
              </div>

              {categorySaveMsg && (
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{categorySaveMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setCategoryModalMode(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={isSavingCategory}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingCategory ? 'Applying...' : 'Apply to All Songs'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
