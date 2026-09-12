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
  private dspInput: GainNode | null = null;
  private dolbyPreLow: BiquadFilterNode | null = null;
  private dolbyPreHigh: BiquadFilterNode | null = null;
  private dolbyDialogue: BiquadFilterNode | null = null;
  private dolbyCompressor: DynamicsCompressorNode | null = null;
  private headShadowFilter: BiquadFilterNode | null = null;

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

  // WakeLock & background audio stabilization
  private wakeLock: any = null;
  private preloaderAudio: HTMLAudioElement | null = null;

  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } catch {
        // Safe fallback if wakeLock is restricted
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  public prebufferNextTrack(nextTrack: Track | undefined) {
    if (!nextTrack) return;
    try {
      if (!this.preloaderAudio) {
        this.preloaderAudio = new Audio();
        this.preloaderAudio.preload = 'auto';
        this.preloaderAudio.volume = 0;
      }
      let url = nextTrack.audioUrl ? resolveAudioStreamUrl(nextTrack.audioUrl) : '';
      if (url && this.preloaderAudio.src !== url) {
        this.preloaderAudio.src = url;
        this.preloaderAudio.load();
      }
    } catch {
      // ignore
    }
  }

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

      // Master DSP Input node
      this.dspInput = this.ctx.createGain();
      this.dspInput.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Dolby Atmos processing nodes
      this.dolbyPreLow = this.ctx.createBiquadFilter();
      this.dolbyPreLow.type = 'lowshelf';
      this.dolbyPreLow.frequency.value = 65;
      this.dolbyPreLow.gain.value = 0;

      this.dolbyPreHigh = this.ctx.createBiquadFilter();
      this.dolbyPreHigh.type = 'highshelf';
      this.dolbyPreHigh.frequency.value = 11500;
      this.dolbyPreHigh.gain.value = 0;

      this.dolbyDialogue = this.ctx.createBiquadFilter();
      this.dolbyDialogue.type = 'peaking';
      this.dolbyDialogue.frequency.value = 2400;
      this.dolbyDialogue.Q.value = 1.3;
      this.dolbyDialogue.gain.value = 0;

      this.dolbyCompressor = this.ctx.createDynamicsCompressor();
      this.dolbyCompressor.threshold.value = 0;
      this.dolbyCompressor.knee.value = 14;
      this.dolbyCompressor.ratio.value = 1;
      this.dolbyCompressor.attack.value = 0.012;
      this.dolbyCompressor.release.value = 0.22;

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

      // Head-Shadow pinna filter for 360° behind-the-head acoustic attenuation
      this.headShadowFilter = this.ctx.createBiquadFilter();
      this.headShadowFilter.type = 'lowpass';
      this.headShadowFilter.frequency.value = 20000;

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

      // Connect DSP chain:
      // dspInput -> dolbyPreLow -> dolbyPreHigh -> dolbyDialogue -> dolbyCompressor -> bassBoost -> EQ[0..9] -> headShadow -> stereoPanner -> (reverb split) -> mainGain -> analyser -> destination
      this.dspInput.connect(this.dolbyPreLow);
      this.dolbyPreLow.connect(this.dolbyPreHigh);
      this.dolbyPreHigh.connect(this.dolbyDialogue);
      this.dolbyDialogue.connect(this.dolbyCompressor);
      this.dolbyCompressor.connect(this.bassBoostFilter);

      let lastNode: AudioNode = this.bassBoostFilter;
      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      lastNode.connect(this.headShadowFilter);
      lastNode = this.headShadowFilter;

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
      this.audioElement.crossOrigin = 'anonymous';
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

      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        this.requestWakeLock();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        window.dispatchEvent(new CustomEvent('nova-play-state', { detail: { isPlaying: true } }));
      });

      this.audioElement.addEventListener('pause', () => {
        if (!this.isSynthPlaying) {
          this.isPlaying = false;
          this.releaseWakeLock();
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
          window.dispatchEvent(new CustomEvent('nova-play-state', { detail: { isPlaying: false } }));
        }
      });

      // Route HTML5 Audio into Web Audio DSP Graph
      // Enables real-time Equalizer, Bass Boost, 360° Spatial Audio, Dolby Atmos, and Visualizer
      if (!this.mediaSourceNode && this.audioElement && this.dspInput) {
        try {
          this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.mediaSourceNode.connect(this.dspInput);
        } catch (sourceErr) {
          console.warn('Could not attach createMediaElementSource to DSP graph, playing via direct hardware audio:', sourceErr);
        }
      }
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

  public preloadNextTrack(track: Track) {
    if (!track) return;
    getStoredAudio(track.id).then(stored => {
      if (stored) return; // already stored in IndexedDB offline
      if (track.audioUrl) {
        resolveAudioStreamUrlAsync(track.audioUrl).then(url => {
          if (url && typeof window !== 'undefined') {
            const preloader = new Audio();
            preloader.preload = 'auto';
            preloader.src = url;
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  public async playTrack(track: Track, startTime: number = 0, crossfadeSecs: number = 0) {
    this.init();
    this.requestWakeLock();
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

    // 1. Check if stored in IndexedDB first for instant 0-second offline playback
    let streamUrl = '';
    try {
      const storedBlob = await getStoredAudio(track.id);
      if (storedBlob) {
        streamUrl = URL.createObjectURL(storedBlob);
      }
    } catch {}

    if (!streamUrl) {
      if (track.file) {
        streamUrl = URL.createObjectURL(track.file);
      } else if (track.audioUrl) {
        streamUrl = await resolveAudioStreamUrlAsync(track.audioUrl);
      }
    }

    if (streamUrl) {
      // Local, offline IndexedDB or Telegram CDN audio playback
      this.stopSynth();

      if (this.ctx && this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume();
        } catch {}
      }

      if (this.mainGain && this.ctx) {
        this.mainGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0.2, this.volume || 0.85), this.ctx.currentTime);
      }

      if (this.audioElement) {
        const targetUrl = streamUrl.startsWith('/') && typeof window !== 'undefined'
          ? `${window.location.origin}${streamUrl}`
          : streamUrl;

        if (this.audioElement.src !== targetUrl) {
          this.audioElement.src = targetUrl;
          try {
            this.audioElement.load();
          } catch {}
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
            // Attempt reload with fresh local proxy query
            try {
              const fileId = extractFileId(track.audioUrl);
              if (fileId) {
                const retryUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/api/telegram/audio?file_id=${encodeURIComponent(fileId)}&retry=1`
                  : `/api/telegram/audio?file_id=${encodeURIComponent(fileId)}&retry=1`;
                this.audioElement.src = retryUrl;
                this.audioElement.load();
                await this.audioElement.play();
                return;
              }
              if (streamUrl) {
                this.audioElement.src = targetUrl;
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
    this.releaseWakeLock();
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
    this.requestWakeLock();
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
      const extra8DReverb = (eq.enabled && eq.eightDAudio && eq.eightDDistance === 'far') ? 0.08 : 0;
      const revGain = eq.enabled ? ((eq.reverb / 100) * 0.48 + extra8DReverb) : 0;
      this.reverbGain.gain.setTargetAtTime(revGain, now, 0.05);
    }

    // Dolby Atmos Multiband Soundstage & Dialogue Clarity
    const dolbyActive = eq.enabled && eq.dolbyAtmos;
    const profile = eq.dolbyProfile || 'cinema';
    const dialogueAmount = eq.dolbyDialogueClarity ?? 60;

    if (this.dolbyPreLow && this.dolbyPreHigh && this.dolbyDialogue && this.dolbyCompressor) {
      if (dolbyActive) {
        if (profile === 'cinema') {
          // Cinema Profile: Sub-bass resonance, airy high-end, wide dynamic control
          this.dolbyPreLow.gain.setTargetAtTime(4.2, now, 0.05);
          this.dolbyPreHigh.gain.setTargetAtTime(3.8, now, 0.05);
          this.dolbyDialogue.gain.setTargetAtTime(1.5 + (dialogueAmount / 100) * 3.5, now, 0.05);
          this.dolbyCompressor.threshold.setTargetAtTime(-20, now, 0.05);
          this.dolbyCompressor.ratio.setTargetAtTime(3.6, now, 0.05);
        } else if (profile === 'music') {
          // Music Profile: Tight punchy mid-bass, crisp presence, dynamic groove
          this.dolbyPreLow.gain.setTargetAtTime(3.0, now, 0.05);
          this.dolbyPreHigh.gain.setTargetAtTime(3.2, now, 0.05);
          this.dolbyDialogue.gain.setTargetAtTime(1.2 + (dialogueAmount / 100) * 2.8, now, 0.05);
          this.dolbyCompressor.threshold.setTargetAtTime(-16, now, 0.05);
          this.dolbyCompressor.ratio.setTargetAtTime(2.6, now, 0.05);
        } else {
          // Vocal / Speech Profile: Maximum vocal articulation, clear speech intimacy
          this.dolbyPreLow.gain.setTargetAtTime(1.2, now, 0.05);
          this.dolbyPreHigh.gain.setTargetAtTime(2.0, now, 0.05);
          this.dolbyDialogue.gain.setTargetAtTime(3.5 + (dialogueAmount / 100) * 4.5, now, 0.05);
          this.dolbyCompressor.threshold.setTargetAtTime(-18, now, 0.05);
          this.dolbyCompressor.ratio.setTargetAtTime(3.2, now, 0.05);
        }
      } else {
        // Flat Dolby bypass
        this.dolbyPreLow.gain.setTargetAtTime(0, now, 0.05);
        this.dolbyPreHigh.gain.setTargetAtTime(0, now, 0.05);
        this.dolbyDialogue.gain.setTargetAtTime(0, now, 0.05);
        this.dolbyCompressor.threshold.setTargetAtTime(0, now, 0.05);
        this.dolbyCompressor.ratio.setTargetAtTime(1, now, 0.05);
      }
    }

    // 360° / 8D Dynamic Binaural Spatial Audio Engine
    if (this.eightDInterval) {
      clearInterval(this.eightDInterval);
      this.eightDInterval = null;
    }

    if (eq.enabled && eq.eightDAudio && this.stereoPanner) {
      const speed = eq.eightDSpeed || 'medium';
      const distance = eq.eightDDistance || 'medium';
      const mode = eq.eightDMode || 'orbit';

      const speedIncrement = speed === 'slow' ? 0.03 : speed === 'fast' ? 0.09 : 0.055;
      const depthMultiplier = distance === 'near' ? 0.65 : distance === 'far' ? 0.96 : 0.82;

      this.eightDInterval = window.setInterval(() => {
        if (!this.stereoPanner || !this.ctx) return;
        this.eightDAngle += speedIncrement;
        if (this.eightDAngle > Math.PI * 2) {
          this.eightDAngle -= Math.PI * 2;
        }

        let pan = 0;
        if (mode === 'pendulum') {
          // Pendulum mode: smooth 180° swing across left-center-right
          pan = Math.sin(this.eightDAngle) * depthMultiplier;
        } else {
          // Orbit mode: full 360° circular trajectory with head-shadow frequency filtering
          pan = Math.sin(this.eightDAngle) * depthMultiplier;
          if (this.headShadowFilter) {
            const cos = Math.cos(this.eightDAngle);
            // When in front (cos >= 0), audio is unobstructed
            // When behind (cos < 0), pinna attenuation filters high frequencies
            const cutoff = cos >= 0 ? 20000 : 3800 + (cos + 1) * 8000;
            this.headShadowFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.04);
          }
        }

        this.stereoPanner.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.035);

        // Notify UI components for real-time 360 visual radar
        window.dispatchEvent(new CustomEvent('nova-360-angle', { 
          detail: { 
            angle: this.eightDAngle, 
            pan, 
            mode, 
            speed, 
            distance 
          } 
        }));
      }, 40);
    } else {
      // Normal stereo widening & reset filters
      if (this.stereoPanner) {
        const panAmount = eq.enabled ? (eq.stereoWidening / 100) * 0.25 : 0;
        this.stereoPanner.pan.setTargetAtTime(panAmount, now, 0.05);
      }
      if (this.headShadowFilter) {
        this.headShadowFilter.frequency.setTargetAtTime(20000, now, 0.05);
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
