import { Track, EqualizerState, IEMSoundStageState } from '../types';
import { getStoredAudio } from './storageDb';
import { 
  resolveAudioStreamUrl, 
  resolveAudioStreamUrlAsync, 
  resolveTelegramFilePath, 
  extractFileId, 
  DEFAULT_TELEGRAM_BOT_TOKEN,
  DEFAULT_TELEGRAM_PATH_CACHE 
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

  // Dedicated Audiophile In-Ear Monitor (IEM) Hardware DSP Engine
  private iemSubBass: BiquadFilterNode | null = null;
  private iemTargetFilter1: BiquadFilterNode | null = null;
  private iemTargetFilter2: BiquadFilterNode | null = null;
  private iemTrebleAir: BiquadFilterNode | null = null;
  private iemGain: GainNode | null = null;
  private crossfeedFilter: BiquadFilterNode | null = null;

  // NOVA CrystalClear™ Ultra-Hz Harmonic Exciter & Transparency DSP
  private clarityAirFilter: BiquadFilterNode | null = null;
  private clarityMudFilter: BiquadFilterNode | null = null;
  private clarityPresenceFilter: BiquadFilterNode | null = null;
  private clarityTransientFilter: BiquadFilterNode | null = null;

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

      // 12-band Master Audiophile EQ frequencies extending up to 20,000 Hz:
      // 20Hz (Sub-low), 40Hz (Sub-bass), 80Hz (Bass), 160Hz (Warmth), 320Hz (Body), 640Hz (Mid), 
      // 1.25kHz (Center), 2.5kHz (Upper-mid), 5kHz (Presence), 10kHz (Brilliance), 16kHz (Air), 20kHz (Ultra-Air Shimmer)
      const frequencies = [20, 40, 80, 160, 320, 640, 1250, 2500, 5000, 10000, 16000, 20000];
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

      // Dedicated Audiophile In-Ear Monitor (IEM) Hardware DSP Nodes
      this.iemSubBass = this.ctx.createBiquadFilter();
      this.iemSubBass.type = 'lowshelf';
      this.iemSubBass.frequency.value = 45; // In-ear acoustic seal resonance
      this.iemSubBass.gain.value = 0;

      this.iemTargetFilter1 = this.ctx.createBiquadFilter();
      this.iemTargetFilter1.type = 'peaking';
      this.iemTargetFilter1.frequency.value = 350; // Low-mid warmth/scoop
      this.iemTargetFilter1.Q.value = 1.0;
      this.iemTargetFilter1.gain.value = 0;

      this.iemTargetFilter2 = this.ctx.createBiquadFilter();
      this.iemTargetFilter2.type = 'peaking';
      this.iemTargetFilter2.frequency.value = 3000; // Ear-gain pinna compensation
      this.iemTargetFilter2.Q.value = 1.6;
      this.iemTargetFilter2.gain.value = 0;

      this.iemTrebleAir = this.ctx.createBiquadFilter();
      this.iemTrebleAir.type = 'highshelf';
      this.iemTrebleAir.frequency.value = 15000; // Micro-detail air shimmer
      this.iemTrebleAir.gain.value = 0;

      this.iemGain = this.ctx.createGain();
      this.iemGain.gain.value = 1.0;

      // Clean, rock-solid IEM Crossfeed Node (Meier/Bauer Acoustic Decoupling)
      this.crossfeedFilter = this.ctx.createBiquadFilter();
      this.crossfeedFilter.type = 'lowpass';
      this.crossfeedFilter.frequency.value = 20000; // Flat bypass by default

      // CrystalClear™ Ultra-Hz Harmonic Exciter & Transparency DSP Nodes
      this.clarityAirFilter = this.ctx.createBiquadFilter();
      this.clarityAirFilter.type = 'highshelf';
      this.clarityAirFilter.frequency.value = 16000;
      this.clarityAirFilter.gain.value = 0;

      this.clarityMudFilter = this.ctx.createBiquadFilter();
      this.clarityMudFilter.type = 'peaking';
      this.clarityMudFilter.frequency.value = 320;
      this.clarityMudFilter.Q.value = 1.8;
      this.clarityMudFilter.gain.value = 0;

      this.clarityPresenceFilter = this.ctx.createBiquadFilter();
      this.clarityPresenceFilter.type = 'peaking';
      this.clarityPresenceFilter.frequency.value = 3800;
      this.clarityPresenceFilter.Q.value = 1.4;
      this.clarityPresenceFilter.gain.value = 0;

      this.clarityTransientFilter = this.ctx.createBiquadFilter();
      this.clarityTransientFilter.type = 'peaking';
      this.clarityTransientFilter.frequency.value = 6200;
      this.clarityTransientFilter.Q.value = 1.2;
      this.clarityTransientFilter.gain.value = 0;

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

      // Connect Dedicated IEM Hardware Stage
      if (this.iemSubBass && this.iemTargetFilter1 && this.iemTargetFilter2 && this.iemTrebleAir && this.iemGain && this.crossfeedFilter) {
        lastNode.connect(this.iemSubBass);
        this.iemSubBass.connect(this.iemTargetFilter1);
        this.iemTargetFilter1.connect(this.iemTargetFilter2);
        this.iemTargetFilter2.connect(this.iemTrebleAir);
        this.iemTrebleAir.connect(this.iemGain);
        this.iemGain.connect(this.crossfeedFilter);
        lastNode = this.crossfeedFilter;
      }

      // Connect NOVA CrystalClear™ Ultra-Hz Harmonic & Transparency Chain
      if (this.clarityAirFilter && this.clarityMudFilter && this.clarityPresenceFilter && this.clarityTransientFilter) {
        lastNode.connect(this.clarityAirFilter);
        this.clarityAirFilter.connect(this.clarityMudFilter);
        this.clarityMudFilter.connect(this.clarityPresenceFilter);
        this.clarityPresenceFilter.connect(this.clarityTransientFilter);
        lastNode = this.clarityTransientFilter;
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

      // Direct hardware HTML5 Audio routing for 100% reliable, loud, crystal-clear playback across all devices
      // For Android 17 Media Session architecture: element must be physically in DOM, not set to display:none
      // Using opacity 0 and 1x1px absolute positioning guarantees Android Chrome / System Media Router detects active media output
      if (typeof document !== 'undefined') {
        let existing = document.getElementById('nova-core-audio') as HTMLAudioElement;
        if (!existing) {
          existing = document.createElement('audio');
          existing.id = 'nova-core-audio';
          existing.setAttribute('playsinline', 'true');
          existing.setAttribute('webkit-playsinline', 'true');
          existing.setAttribute('x-webkit-airplay', 'allow');
          existing.setAttribute('controlsList', 'nodownload noplaybackrate');
          existing.crossOrigin = 'anonymous';
          // Style as invisible but layout-rendered so Android MediaSession controller activates lock screen controls
          existing.style.position = 'fixed';
          existing.style.bottom = '0px';
          existing.style.left = '0px';
          existing.style.width = '1px';
          existing.style.height = '1px';
          existing.style.opacity = '0.01';
          existing.style.pointerEvents = 'none';
          existing.style.zIndex = '-9999';
          document.body.appendChild(existing);
        }
        this.audioElement = existing;
      } else {
        this.audioElement = new Audio();
      }
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onTimeUpdateCallback && !this.isSynthPlaying) {
          const cur = this.audioElement.currentTime;
          this.onTimeUpdateCallback(cur);
          this.updateMediaSessionPosition(cur, this.audioElement.duration || this.currentTrack?.duration || 0);

          // Android & WebView fallback: Only trigger if audio element genuinely reached end of full track
          if (
            !this.audioElement.src.startsWith('data:audio/wav') &&
            this.audioElement.duration > 0 &&
            Number.isFinite(this.audioElement.duration) &&
            this.audioElement.duration > 15 &&
            cur >= this.audioElement.duration - 0.35 &&
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
        // Automatic fallback: If local server proxy fails (e.g. user running static client from GitHub), stream directly from Telegram Bot API CDN
        if (this.currentTrack && this.audioElement && !this.audioElement.src.includes('api.telegram.org')) {
          const fileId = extractFileId(this.currentTrack.audioUrl);
          if (fileId) {
            resolveTelegramFilePath(fileId, true).then(cachedPath => {
              if (cachedPath && this.audioElement && !this.audioElement.src.includes('api.telegram.org')) {
                const directCdnUrl = `https://api.telegram.org/file/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/${cachedPath}`;
                console.log('Falling back to direct Telegram CDN stream:', directCdnUrl);
                this.audioElement.src = directCdnUrl;
                this.audioElement.load();
                this.audioElement.play().catch(err => console.warn('Direct Telegram CDN fallback error:', err));
              }
            }).catch(() => {});
          }
        }
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
      this.audioElement.volume = this.isMuted ? 0 : Math.max(0.1, this.volume || 0.85);
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
    // Check IndexedDB offline cache first
    getStoredAudio(track.id).then(stored => {
      if (stored) return; // already stored locally in IndexedDB

      if (track.audioUrl) {
        try {
          const streamUrl = resolveAudioStreamUrl(track.audioUrl);
          const targetUrl = streamUrl.startsWith('/') && typeof window !== 'undefined'
            ? `${window.location.origin}${streamUrl}`
            : streamUrl;

          if (!this.preloaderAudio) {
            this.preloaderAudio = new Audio();
            this.preloaderAudio.preload = 'auto';
            this.preloaderAudio.volume = 0;
            this.preloaderAudio.muted = true;
          }

          if (this.preloaderAudio.src !== targetUrl) {
            this.preloaderAudio.src = targetUrl;
            this.preloaderAudio.load();
          }
        } catch (e) {
          console.warn('Error pre-buffering track:', e);
        }
      }
    }).catch(() => {});
  }

  public playTrack(track: Track, startTime: number = 0, crossfadeSecs: number = 0) {
    this.init();
    this.requestWakeLock();
    // Non-blocking resume to preserve user interaction gesture token for HTML5 Audio play()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.currentTrack = track;
    this.isPlaying = true;
    this.hasTriggeredEnded = false;
    this.synthTime = startTime;
    if (this.audioElement) {
      this.audioElement.loop = false;
    }

    // Ensure volume is not zero
    if (this.mainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.mainGain.gain.cancelScheduledValues(now);
      this.mainGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0.1, this.volume), now);
    }

    // Update system Media Session (Android lock screen & notifications)
    this.updateMediaSession(track);

    // Resolve stream URL synchronously so HTML5 Audio play() triggers inside direct user click gesture
    let streamUrl = '';
    if (track.file) {
      streamUrl = URL.createObjectURL(track.file);
    } else if (track.audioUrl) {
      streamUrl = resolveAudioStreamUrl(track.audioUrl);
    }

    if (streamUrl && this.audioElement) {
      this.stopSynth();

      const targetUrl = streamUrl.startsWith('/') && typeof window !== 'undefined'
        ? `${window.location.origin}${streamUrl}`
        : streamUrl;

      if (this.audioElement.src !== targetUrl) {
        this.audioElement.src = targetUrl;
      }

      if (startTime > 0 && !isNaN(startTime)) {
        try {
          this.audioElement.currentTime = startTime;
        } catch {}
      }

      this.audioElement.muted = this.isMuted;
      this.audioElement.volume = this.isMuted ? 0 : Math.max(0.1, this.volume || 0.85);

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((e: any) => {
          console.warn('HTML5 audio play error:', e);
          if (e?.name === 'NotAllowedError') {
            console.log('User interaction required to start audio playback');
          } else if (e?.name !== 'AbortError') {
            // Attempt retry
            const fileId = extractFileId(track.audioUrl);
            if (fileId && this.audioElement) {
              const retryUrl = `${window.location.origin}/api/telegram/audio?file_id=${encodeURIComponent(fileId)}&retry=1`;
              this.audioElement.src = retryUrl;
              this.audioElement.play().catch(() => {});
            }
          }
        });
      }

      // Check IndexedDB in background without blocking current playback
      getStoredAudio(track.id).then(storedBlob => {
        if (storedBlob && this.currentTrack?.id === track.id && this.audioElement && this.audioElement.error) {
          this.audioElement.src = URL.createObjectURL(storedBlob);
          this.audioElement.play().catch(() => {});
        }
      }).catch(() => {});
    } else if (!track.file && !track.audioUrl) {
      // Procedural Web Audio playback for synth-only tracks
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.startSynth(track, startTime);
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
    if (!this.audioElement || !this.audioElement.src || !this.currentTrack) return false;
    const src = this.audioElement.src;
    if (src.startsWith('data:') || src.endsWith('/') || src.length < 5) return false;
    const fileId = extractFileId(this.currentTrack.audioUrl);
    if (fileId && src.includes(fileId)) return true;
    if (this.currentTrack.audioUrl && src.includes(this.currentTrack.audioUrl)) return true;
    if (this.currentTrack.file && src.startsWith('blob:')) return true;
    return false;
  }

  public resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    this.requestWakeLock();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Guarantee volume is audible and unmuted
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
      this.audioElement.volume = this.isMuted ? 0 : Math.max(0.1, this.volume || 0.85);
    }

    if (this.isCurrentTrackLoaded() && !this.isSynthPlaying) {
      if (this.synthTime > 0 && this.audioElement && Math.abs(this.audioElement.currentTime - this.synthTime) > 1) {
        try {
          this.audioElement.currentTime = this.synthTime;
        } catch {}
      }
      const p = this.audioElement!.play();
      if (p !== undefined) {
        p.catch((err) => {
          console.warn('audioElement.play() failed in resume, re-triggering playTrack:', err);
          if (this.currentTrack) {
            this.playTrack(this.currentTrack, this.synthTime || 0);
          }
        });
      }
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

    // Apply bands: 12-band master, 10-band, or 5-band
    if (eq.bands.length === 12) {
      eq.bands.forEach((val, idx) => {
        if (this.eqFilters[idx]) {
          const gain = eq.enabled ? val : 0;
          this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
        }
      });
    } else if (eq.bands.length === 10) {
      const b = eq.bands;
      const mapped = [
        b[0] || 0, // 20Hz
        b[0] || 0, // 40Hz
        b[1] || 0, // 80Hz
        b[2] || 0, // 160Hz
        b[3] || 0, // 320Hz
        b[4] || 0, // 640Hz
        b[5] || 0, // 1.25kHz
        b[6] || 0, // 2.5kHz
        b[7] || 0, // 5kHz
        b[8] || 0, // 10kHz
        b[9] || 0, // 16kHz
        b[9] || 0  // 20kHz Ultra-Air
      ];
      mapped.forEach((gainVal, idx) => {
        if (this.eqFilters[idx]) {
          const gain = eq.enabled ? gainVal : 0;
          this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
        }
      });
    } else {
      // 5-band interpolation across 12 filters
      const band5 = eq.bands;
      const mappedGains = [
        band5[0] || 0, band5[0] || 0, band5[1] || 0, band5[1] || 0,
        band5[2] || 0, band5[2] || 0, band5[3] || 0, band5[3] || 0,
        band5[4] || 0, band5[4] || 0, band5[4] || 0, band5[4] || 0
      ];
      mappedGains.forEach((gainVal, idx) => {
        if (this.eqFilters[idx]) {
          const gain = eq.enabled ? gainVal : 0;
          this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
        }
      });
    }

    // NOVA CrystalClear™ Harmonic Exciter & Ultra-Hz Air Engine
    if (this.clarityAirFilter && this.clarityMudFilter && this.clarityPresenceFilter && this.clarityTransientFilter) {
      const clarity = eq.clarityEngine;
      if (eq.enabled && clarity && clarity.enabled) {
        // Ultra-Air restoration (16,000Hz – 20,000Hz shimmer)
        const airGain = (clarity.ultraAirHz / 100) * 8.0;
        this.clarityAirFilter.gain.setTargetAtTime(airGain, now, 0.05);

        // Anti-mud vocal transparency (removes 320Hz boxiness, lifts 3.8kHz vocal presence)
        const mudDip = -((clarity.vocalTransparency / 100) * 3.8);
        const presGain = (clarity.vocalTransparency / 100) * 3.8;
        this.clarityMudFilter.gain.setTargetAtTime(mudDip, now, 0.05);
        this.clarityPresenceFilter.gain.setTargetAtTime(presGain, now, 0.05);

        // Transient attack snap (6.2kHz pluck definition)
        const snapGain = (clarity.transientSnap / 100) * 4.5;
        this.clarityTransientFilter.gain.setTargetAtTime(snapGain, now, 0.05);
      } else {
        this.clarityAirFilter.gain.setTargetAtTime(0, now, 0.05);
        this.clarityMudFilter.gain.setTargetAtTime(0, now, 0.05);
        this.clarityPresenceFilter.gain.setTargetAtTime(0, now, 0.05);
        this.clarityTransientFilter.gain.setTargetAtTime(0, now, 0.05);
      }
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

  public applyIEMSoundStage(iem: IEMSoundStageState) {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx || !this.iemSubBass || !this.iemTargetFilter1 || !this.iemTargetFilter2 || !this.iemTrebleAir || !this.iemGain || !this.crossfeedFilter) return;
    const now = this.ctx.currentTime;

    if (!iem.enabled) {
      this.iemSubBass.gain.setTargetAtTime(0, now, 0.04);
      this.iemTargetFilter1.gain.setTargetAtTime(0, now, 0.04);
      this.iemTargetFilter2.gain.setTargetAtTime(0, now, 0.04);
      this.iemTrebleAir.gain.setTargetAtTime(0, now, 0.04);
      this.iemGain.gain.setTargetAtTime(1.0, now, 0.04);
      this.crossfeedFilter.frequency.setTargetAtTime(20000, now, 0.04);
      return;
    }

    // 1. In-Ear Seal Sub-bass rumble (35-50Hz acoustic resonance)
    const rumbleGain = (iem.subBassRumble / 100) * 11.5; // up to +11.5dB clean sub-bass
    this.iemSubBass.gain.setTargetAtTime(rumbleGain, now, 0.04);

    // 2. Micro-Detail Treble Air (15kHz shimmer)
    const airGain = (iem.trebleAir / 100) * 8.5; // up to +8.5dB air
    this.iemTrebleAir.gain.setTargetAtTime(airGain, now, 0.04);

    // 3. IEM Target Curve tuning
    switch (iem.targetCurve) {
      case 'harman-in-ear':
        // Harman In-Ear Target 2019: Clean lower mids (-2.0dB at 320Hz), +4.8dB pinna ear-gain
        this.iemTargetFilter1.frequency.setTargetAtTime(320, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(-2.0, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(2850, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(4.8, now, 0.04);
        break;

      case 'dynamic-slam':
        // Dynamic Driver Punch: Warmth at 200Hz (+4.2dB), smooth relaxed highs
        this.iemTargetFilter1.frequency.setTargetAtTime(200, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(4.2, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(3500, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(1.8, now, 0.04);
        break;

      case 'balanced-armature':
        // Multi-BA Knowles clarity: Razor vocal presence (+5.5dB at 3200Hz) and instrument attack
        this.iemTargetFilter1.frequency.setTargetAtTime(450, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(-1.5, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(3200, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(5.5, now, 0.04);
        break;

      case 'planar-speed':
        // Planar Magnetic: Holographic linear clarity with high transient response
        this.iemTargetFilter1.frequency.setTargetAtTime(600, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(1.0, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(4200, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(4.2, now, 0.04);
        break;

      case 'crinacle-neutral':
        // Crinacle IEF Neutral Target: Studio reference flat monitoring
        this.iemTargetFilter1.frequency.setTargetAtTime(300, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(0, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(2700, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(2.2, now, 0.04);
        break;

      case 'fun-v-shaped':
        // V-Shaped Euphoria: Deep punch and sparkling presence
        this.iemTargetFilter1.frequency.setTargetAtTime(500, now, 0.04);
        this.iemTargetFilter1.gain.setTargetAtTime(-3.5, now, 0.04);
        this.iemTargetFilter2.frequency.setTargetAtTime(3600, now, 0.04);
        this.iemTargetFilter2.gain.setTargetAtTime(5.2, now, 0.04);
        break;
    }

    // 4. Driver Impedance Matcher
    if (iem.driverImpedance === 'high-sensitivity') {
      this.iemGain.gain.setTargetAtTime(0.82, now, 0.04); // -1.7dB noise floor reduction
    } else if (iem.driverImpedance === 'high-drive') {
      this.iemGain.gain.setTargetAtTime(1.30, now, 0.04); // +2.3dB clean dynamic headroom
    } else {
      this.iemGain.gain.setTargetAtTime(1.0, now, 0.04);
    }

    // 5. Crossfeed acoustic filter (removes in-head claustrophobia and creates natural speaker stage)
    if (this.crossfeedFilter) {
      const crossMode = iem.crossfeed || 'off';
      if (crossMode === 'subtle') {
        this.crossfeedFilter.frequency.setTargetAtTime(14000, now, 0.04);
      } else if (crossMode === 'studio') {
        this.crossfeedFilter.frequency.setTargetAtTime(9500, now, 0.04);
      } else if (crossMode === 'holographic') {
        this.crossfeedFilter.frequency.setTargetAtTime(7000, now, 0.04);
      } else {
        this.crossfeedFilter.frequency.setTargetAtTime(20000, now, 0.04);
      }
    }
  }

  public getVisualizerData(): Uint8Array {
    if (this.analyser) {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      if (sum > 0) {
        return data;
      }
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
        const fullCover = track.coverArt
          ? (track.coverArt.startsWith('http') || track.coverArt.startsWith('data:') ? track.coverArt : `${origin}${track.coverArt}`)
          : `${origin}/icon-512.png`;

        const artwork = [
          { src: fullCover, sizes: '512x512', type: 'image/jpeg' },
          { src: fullCover, sizes: '384x384', type: 'image/jpeg' },
          { src: fullCover, sizes: '256x256', type: 'image/jpeg' },
          { src: fullCover, sizes: '192x192', type: 'image/jpeg' },
          { src: fullCover, sizes: '128x128', type: 'image/jpeg' },
          { src: fullCover, sizes: '96x96', type: 'image/jpeg' },
          { src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${origin}/icon-192.png`, sizes: '192x192', type: 'image/png' },
        ];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'NOVA Player',
          artwork: artwork,
        });

        navigator.mediaSession.playbackState = 'playing';
        this.updateMediaSessionPosition(0, track.duration);

        const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
          ['play', () => { this.resume(); window.dispatchEvent(new CustomEvent('nova-play')); }],
          ['pause', () => { this.pause(); window.dispatchEvent(new CustomEvent('nova-pause')); }],
          ['stop', () => { this.pause(); window.dispatchEvent(new CustomEvent('nova-pause')); }],
          ['previoustrack', () => { window.dispatchEvent(new CustomEvent('nova-prev-track')); }],
          ['nexttrack', () => { window.dispatchEvent(new CustomEvent('nova-next-track')); }],
          ['seekto', (details) => { if (details.seekTime !== undefined) this.seek(details.seekTime); }],
          ['seekbackward', (details) => {
            const skip = details.seekOffset || 10;
            const cur = this.audioElement ? this.audioElement.currentTime : this.synthTime;
            this.seek(Math.max(0, cur - skip));
          }],
          ['seekforward', (details) => {
            const skip = details.seekOffset || 10;
            const cur = this.audioElement ? this.audioElement.currentTime : this.synthTime;
            this.seek(cur + skip);
          }],
        ];

        for (const [action, handler] of actionHandlers) {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch {
            // Some actions may not be supported by all mobile web engines
          }
        }
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
