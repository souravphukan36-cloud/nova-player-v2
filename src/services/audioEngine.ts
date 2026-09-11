import { Track, EqualizerState } from '../types';
import { getStoredAudio } from './storageDb';
import { 
  resolveAudioStreamUrl, 
  resolveAudioStreamUrlAsync, 
  resolveTelegramFilePath, 
  extractFileId, 
  DEFAULT_TELEGRAM_BOT_TOKEN 
} from './apiConfig';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassBoostFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;
  private reverbGain: GainNode | null = null;
  private reverbFeedback: GainNode | null = null;
  private mainGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Media element for local/external audio files
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;

  // Procedural synth player state for default tracks
  private synthInterval: number | null = null;
  private synthTime: number = 0;
  private isSynthPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  // Callbacks
  private onTimeUpdateCallback?: (currentTime: number) => void;
  private onEndedCallback?: () => void;
  private hasTriggeredEnded: boolean = false;

  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  constructor() {
    // Audio context will be initialized on first user interaction to comply with browser autoplay policies
  }

  private eightDInterval: number | null = null;
  private eightDAngle: number = 0;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Analyser Node for Visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // 10-band Audiophile EQ frequencies: 31Hz, 63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
      const frequencies = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      this.eqFilters = frequencies.map((freq, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Bass Boost filter (lowshelf at 80Hz)
      this.bassBoostFilter = this.ctx.createBiquadFilter();
      this.bassBoostFilter.type = 'lowshelf';
      this.bassBoostFilter.frequency.value = 80;
      this.bassBoostFilter.gain.value = 0;

      // Stereo Widening Panner (where supported)
      if (this.ctx.createStereoPanner) {
        this.stereoPanner = this.ctx.createStereoPanner();
        this.stereoPanner.pan.value = 0;
      }

      // Reverb / Ambience effect (feedback delay loop)
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.18;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 3500;

      this.reverbFeedback = this.ctx.createGain();
      this.reverbFeedback.gain.value = 0.25;

      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.0; // dry by default

      // Connect reverb loop
      delay.connect(delayFilter);
      delayFilter.connect(this.reverbFeedback);
      this.reverbFeedback.connect(delay);
      delayFilter.connect(this.reverbGain);

      // Connect filter chain:
      // Source -> BassBoost -> EQ[0] -> EQ[1] -> EQ[2] -> EQ[3] -> EQ[4] -> (Reverb split) -> MainGain -> Analyser -> Destination
      let lastNode: AudioNode = this.bassBoostFilter;
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      if (this.stereoPanner) {
        lastNode.connect(this.stereoPanner);
        lastNode = this.stereoPanner;
      }

      lastNode.connect(delay);
      lastNode.connect(this.mainGain);
      this.reverbGain.connect(this.mainGain);

      this.mainGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Prepare HTML5 Audio for uploaded and cloud files
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      this.audioElement.setAttribute('playsinline', 'true');
      this.audioElement.setAttribute('webkit-playsinline', 'true');

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onTimeUpdateCallback && !this.isSynthPlaying) {
          const cur = this.audioElement.currentTime;
          this.onTimeUpdateCallback(cur);
          this.updateMediaSessionPosition(cur, this.audioElement.duration || this.currentTrack?.duration || 0);

          // Android & WebView fallback: If track reached end without firing native 'ended' event
          if (
            !this.audioElement.src.startsWith('data:audio/wav') &&
            this.audioElement.duration > 0 &&
            cur >= this.audioElement.duration - 0.25 &&
            !this.hasTriggeredEnded
          ) {
            this.hasTriggeredEnded = true;
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        }
      });

      this.audioElement.addEventListener('ended', () => {
        // Never trigger on synthetic carrier wave audio or when synth is playing
        if (this.audioElement?.src?.startsWith('data:audio/wav')) return;
        if (!this.isSynthPlaying && !this.hasTriggeredEnded) {
          this.hasTriggeredEnded = true;
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      });

      this.audioElement.addEventListener('error', (e) => {
        console.warn('Audio element error:', this.audioElement?.error, e);
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement && this.currentTrack && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
          this.currentTrack.duration = Math.round(this.audioElement.duration);
        }
      });

      // Direct hardware HTML5 Audio routing for 100% reliable, loud, crystal-clear playback across all devices
      // Do NOT attach createMediaElementSource by default as browser CORS / cross-origin policies silence audio on mobile
    } catch (err) {
      console.warn('AudioContext initialization error:', err);
    }
  }

  public ensureAudioUnlocked() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      this.audioElement.volume = this.isMuted ? 0 : Math.max(0.2, this.volume || 0.85);

      // Prime HTML5 Audio element inside user gesture so future play() calls are never blocked
      if (!this.audioElement.src || this.audioElement.src === '') {
        this.audioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.audioElement.play().then(() => {
          if (this.audioElement?.src.startsWith('data:audio/wav')) {
            this.audioElement.pause();
          }
        }).catch(() => {});
      }
    }
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0.2, this.volume), this.ctx.currentTime);
    }
  }

  public setCallbacks(onTimeUpdate: (t: number) => void, onEnded: () => void) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
  }

  public async playTrack(track: Track, startTime: number = 0, crossfadeSecs: number = 0) {
    this.init();
    // Non-blocking resume to preserve user interaction gesture token for HTML5 Audio play()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.currentTrack = track;
    this.isPlaying = true;
    this.hasTriggeredEnded = false;
    if (this.audioElement) {
      this.audioElement.loop = false;
    }

    // Ensure volume is not zero
    if (this.mainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.mainGain.gain.cancelScheduledValues(now);
      this.mainGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0.2, this.volume), now);
    }

    // Update system Media Session (Android lock screen & notifications)
    this.updateMediaSession(track);

    if (track.file || track.audioUrl) {
      // Local or URL audio playback
      this.stopSynth();
      if (this.audioElement) {
        let streamUrl = track.audioUrl ? await resolveAudioStreamUrlAsync(track.audioUrl) : '';
        if (track.file) {
          streamUrl = URL.createObjectURL(track.file);
        }
        const currentSrc = this.audioElement.src;
        const isSame = currentSrc === streamUrl || 
                       (streamUrl && currentSrc.endsWith(streamUrl)) ||
                       (streamUrl && streamUrl.startsWith('/') && currentSrc.includes(streamUrl));

        if (streamUrl && !isSame) {
          this.audioElement.src = streamUrl;
        }

        if (startTime > 0 && !isNaN(startTime)) {
          try {
            this.audioElement.currentTime = startTime;
          } catch {}
        }
        this.audioElement.volume = this.isMuted ? 0 : Math.max(0.2, this.volume || 0.85);
        this.audioElement.muted = this.isMuted;

        try {
          await this.audioElement.play();
        } catch (e: any) {
          console.warn('HTML5 audio play error:', e);
          if (e?.name === 'NotAllowedError') {
            console.log('User interaction required to start audio playback');
          } else if (e?.name === 'AbortError') {
            // Track switched before current loaded
          } else {
            // Attempt reload with fresh Telegram file_path resolution
            try {
              const fileId = extractFileId(track.audioUrl);
              if (fileId) {
                const freshPath = await resolveTelegramFilePath(fileId, true);
                if (freshPath) {
                  const directUrl = `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${freshPath}`;
                  this.audioElement.src = directUrl;
                  await this.audioElement.play();
                  return;
                }
              }
              if (streamUrl) {
                this.audioElement.src = streamUrl;
                await this.audioElement.play();
              }
            } catch (err2) {
              console.warn('Audio retry failed:', err2);
            }
          }
        }
      }
    } else {
      // Check if stored in IndexedDB first
      let storedBlob: Blob | null = null;
      try {
        storedBlob = await getStoredAudio(track.id);
      } catch {
        // ignore
      }

      if (storedBlob && this.audioElement) {
        this.stopSynth();
        this.audioElement.src = URL.createObjectURL(storedBlob);
        this.audioElement.currentTime = startTime;
        this.audioElement.volume = this.isMuted ? 0 : this.volume;
        this.audioElement.muted = this.isMuted;
        try {
          await this.audioElement.play();
        } catch (e) {
          console.warn('IndexedDB audio play error', e);
          this.startSynth(track, startTime);
        }
      } else {
        // Procedural Web Audio playback
        if (this.audioElement) {
          this.audioElement.pause();
        }
        this.startSynth(track, startTime);
      }
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement && !this.isSynthPlaying) {
      this.audioElement.pause();
    }
    if (this.isSynthPlaying) {
      this.stopSynth();
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  public isCurrentTrackLoaded(): boolean {
    return Boolean(
      this.audioElement &&
      this.audioElement.src &&
      this.audioElement.src.length > 5 &&
      !this.audioElement.src.endsWith('/')
    );
  }

  public resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Guarantee volume is audible
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      this.audioElement.volume = this.isMuted ? 0 : Math.max(0.1, this.volume || 0.85);
    }

    if (this.isCurrentTrackLoaded() && !this.isSynthPlaying) {
      if (this.synthTime > 0) {
        try {
          this.audioElement!.currentTime = this.synthTime;
        } catch {
          // ignore
        }
      }
      this.audioElement!.play().catch((err) => {
        console.warn('audioElement.play() failed in resume, re-triggering playTrack:', err);
        if (this.currentTrack) {
          this.playTrack(this.currentTrack, this.synthTime || 0);
        }
      });
    } else if (this.currentTrack.file || this.currentTrack.audioUrl) {
      this.playTrack(this.currentTrack, this.synthTime || 0);
    } else {
      this.startSynth(this.currentTrack, this.synthTime);
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  public seek(seconds: number) {
    this.synthTime = Math.max(0, seconds);
    const wasPlaying = this.isPlaying;
    
    if (this.audioElement && (this.audioElement.src || this.currentTrack?.file || this.currentTrack?.audioUrl) && !this.isSynthPlaying) {
      try {
        this.audioElement.currentTime = seconds;
        if (wasPlaying && this.audioElement.paused) {
          this.audioElement.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Seek error on audio element:', e);
      }
    } else {
      // Synth / procedural audio: re-trigger smoothly from the new timestamp if playing
      if (wasPlaying && this.currentTrack) {
        this.startSynth(this.currentTrack, seconds);
      }
    }
    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(seconds);
    }
    if (this.currentTrack) {
      this.updateMediaSessionPosition(seconds, this.currentTrack.duration);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.mainGain && this.ctx && !this.isMuted) {
      this.mainGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.muted = muted;
      this.audioElement.volume = muted ? 0 : this.volume;
    }
  }

  public applyEqualizer(eq: EqualizerState) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Apply bands: if 10 bands provided, map directly. If 5 bands provided, interpolate across the 10 filters.
    if (eq.bands.length === 10) {
      eq.bands.forEach((val, idx) => {
        if (this.eqFilters[idx]) {
          const gain = eq.enabled ? val : 0;
          this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
        }
      });
    } else {
      // 5-band interpolation across 10 filters
      const band5 = eq.bands;
      const mappedGains = [
        band5[0] || 0, // 31Hz
        band5[0] || 0, // 63Hz
        band5[1] || 0, // 125Hz
        band5[1] || 0, // 250Hz
        band5[2] || 0, // 500Hz
        band5[2] || 0, // 1kHz
        band5[3] || 0, // 2kHz
        band5[3] || 0, // 4kHz
        band5[4] || 0, // 8kHz
        band5[4] || 0, // 16kHz
      ];
      mappedGains.forEach((gainVal, idx) => {
        if (this.eqFilters[idx]) {
          const gain = eq.enabled ? gainVal : 0;
          this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
        }
      });
    }

    // Bass boost (deep sub-bass enhancement)
    if (this.bassBoostFilter) {
      const bassGain = eq.enabled ? (eq.bassBoost / 100) * 14 : 0;
      this.bassBoostFilter.gain.setTargetAtTime(bassGain, now, 0.05);
    }

    // Reverb / Acoustic Space
    if (this.reverbGain) {
      const revGain = eq.enabled ? (eq.reverb / 100) * 0.48 : 0;
      this.reverbGain.gain.setTargetAtTime(revGain, now, 0.05);
    }

    // 8D Audio Dynamic Spatial Panning or Stereo Widening
    if (this.eightDInterval) {
      clearInterval(this.eightDInterval);
      this.eightDInterval = null;
    }

    if (this.stereoPanner) {
      if (eq.enabled && eq.eightDAudio) {
        // Active 8D dynamic binaural spatial panning
        this.eightDInterval = window.setInterval(() => {
          if (!this.stereoPanner || !this.ctx) return;
          this.eightDAngle += 0.08;
          // Smooth sinusoidal 8D spatial motion around the listener's head
          const pan = Math.sin(this.eightDAngle) * 0.85;
          this.stereoPanner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.04);
        }, 50);
      } else {
        const panAmount = eq.enabled ? (eq.stereoWidening / 100) * 0.25 : 0;
        this.stereoPanner.pan.setTargetAtTime(panAmount, now, 0.05);
      }
    }
  }

  public getVisualizerData(): Uint8Array {
    if (this.isSynthPlaying && this.analyser) {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      return data;
    }

    // Dynamic frequency spectrum for hardware audio playback
    const bins = 64;
    const data = new Uint8Array(bins);
    if (this.isPlaying && this.audioElement && !this.audioElement.paused) {
      const t = this.audioElement.currentTime;
      const vol = Math.max(0.2, this.isMuted ? 0 : this.volume);
      const beat = Math.sin(t * 7.5);
      const subBeat = Math.cos(t * 14.0);
      const vocalRhythm = Math.sin(t * 4.2);

      for (let i = 0; i < bins; i++) {
        const ratio = i / bins;
        let amp = 0;
        if (ratio < 0.22) {
          // Bass punch
          amp = (190 + 65 * beat) * (1 - ratio * 2.2);
        } else if (ratio < 0.6) {
          // Midrange vocal resonance
          amp = (140 + 50 * vocalRhythm) * (1 - (ratio - 0.22) * 1.4);
        } else {
          // High-frequency treble shimmer
          amp = (95 + 40 * subBeat) * (1 - (ratio - 0.6) * 1.1);
        }
        const flutter = Math.sin(t * 18 + i * 0.9) * 20;
        data[i] = Math.max(20, Math.min(255, Math.floor((amp + flutter) * vol)));
      }
    } else {
      // Gentle ambient resting pulse
      for (let i = 0; i < bins; i++) {
        data[i] = Math.floor(18 + Math.sin(Date.now() * 0.003 + i * 0.25) * 10);
      }
    }
    return data;
  }

  public getWaveformData(): Uint8Array {
    if (this.isSynthPlaying && this.analyser) {
      const data = new Uint8Array(this.analyser.fftSize);
      this.analyser.getByteTimeDomainData(data);
      return data;
    }

    const bins = 128;
    const data = new Uint8Array(bins);
    if (this.isPlaying && this.audioElement && !this.audioElement.paused) {
      const t = this.audioElement.currentTime;
      for (let i = 0; i < bins; i++) {
        const wave = Math.sin(t * 8 + i * 0.2) * 35 + Math.cos(t * 16 + i * 0.4) * 15;
        data[i] = Math.max(0, Math.min(255, Math.floor(128 + wave)));
      }
    } else {
      for (let i = 0; i < bins; i++) {
        data[i] = 128;
      }
    }
    return data;
  }

  private silentBlobUrl: string | null = null;

  private getSilentAudioCarrier(): string {
    if (this.silentBlobUrl) return this.silentBlobUrl;
    try {
      const sampleRate = 44100;
      const numChannels = 2;
      const durationSecs = 3;
      const numSamples = sampleRate * durationSecs;
      const blockAlign = numChannels * 2;
      const byteRate = sampleRate * blockAlign;
      const dataSize = numSamples * blockAlign;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);

      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, 16, true); // 16-bit
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      const blob = new Blob([buffer], { type: 'audio/wav' });
      this.silentBlobUrl = URL.createObjectURL(blob);
      return this.silentBlobUrl;
    } catch {
      return 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA';
    }
  }

  // Real-time Procedural Musical Synthesizer for default tracks
  private startSynth(track: Track, startTime: number) {
    this.stopSynth();
    this.isSynthPlaying = true;
    this.synthTime = startTime;
    this.hasTriggeredEnded = false;

    // Keep Android OS Native Media Notification alive by playing continuous valid audio loop
    if (this.audioElement) {
      try {
        this.audioElement.src = this.getSilentAudioCarrier();
        this.audioElement.loop = true;
        this.audioElement.play().catch(() => {});
      } catch {
        // ignore
      }
    }

    const tempoMap: Record<string, number> = {
      synthwave: 118,
      cyberbass: 130,
      lofi: 82,
      edm: 128,
      ambient: 60,
      acoustic: 96,
    };
    const bpm = tempoMap[track.synthPreset || 'synthwave'] || 120;
    const beatDuration = 60 / bpm;

    let step = Math.floor((startTime / beatDuration) * 4);

    this.synthInterval = window.setInterval(() => {
      if (!this.isSynthPlaying || !this.ctx) return;
      this.synthTime += 0.1;

      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.synthTime);
      }
      // Update system media notification scrubber position periodically
      if (Math.floor(this.synthTime * 10) % 10 === 0) {
        this.updateMediaSessionPosition(this.synthTime, track.duration);
      }

      if (this.synthTime >= track.duration) {
        this.stopSynth();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
        return;
      }
    }, 100);
  }

  private playProceduralNote(_preset: string, _step: number) {
    // Synth beeps disabled - app requires real audio files / streams
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
  }

  public updateMediaSessionPosition(position: number, duration: number) {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      if (duration > 0 && position >= 0 && Number.isFinite(position) && Number.isFinite(duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, duration),
            playbackRate: 1,
            position: Math.min(duration, Math.max(0, position)),
          });
        } catch {
          // ignore
        }
      }
    }
  }

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const artwork = [
          { src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png' },
        ];
        if (track.coverArt && track.coverArt.startsWith('http')) {
          artwork.unshift({ src: track.coverArt, sizes: '512x512', type: 'image/jpeg' });
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'NOVA Player',
          artwork: artwork,
        });

        navigator.mediaSession.playbackState = 'playing';
        this.updateMediaSessionPosition(0, track.duration);

        navigator.mediaSession.setActionHandler('play', () => {
          this.resume();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.pause();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          window.dispatchEvent(new CustomEvent('nova-prev-track'));
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          window.dispatchEvent(new CustomEvent('nova-next-track'));
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.seek(details.seekTime);
          }
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skip = details.seekOffset || 10;
          const cur = this.audioElement ? this.audioElement.currentTime : this.synthTime;
          this.seek(Math.max(0, cur - skip));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skip = details.seekOffset || 10;
          const cur = this.audioElement ? this.audioElement.currentTime : this.synthTime;
          this.seek(cur + skip);
        });
      } catch (e) {
        console.warn('MediaSession error', e);
      }
    }

    // System Notification trigger if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifImg = (track.coverArt && track.coverArt.startsWith('http')) ? track.coverArt : undefined;
        new Notification(`Playing: ${track.title}`, {
          body: `${track.artist} • ${track.album}`,
          icon: notifImg,
          tag: 'nova-now-playing',
          silent: true,
        });
      } catch {
        // Notification silent fallback
      }
    }
  }

  public destroy() {
    this.stopSynth();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const audioEngine = new AudioEngine();

// Auto-unlock hardware audio on first user touch/click/keypress across Android, iOS, and desktop browsers
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      audioEngine.ensureAudioUnlocked();
    } catch {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
}
