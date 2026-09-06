import { Track, EqualizerState } from '../types';
import { getStoredAudio } from './storageDb';

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

      // 5-band EQ frequencies: 60Hz, 230Hz, 910Hz, 3600Hz, 14000Hz
      const frequencies = [60, 230, 910, 3600, 14000];
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

      // Prepare HTML5 Audio for uploaded files
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onTimeUpdateCallback && !this.isSynthPlaying) {
          this.onTimeUpdateCallback(this.audioElement.currentTime);
          // Android & WebView fallback: If track reached end without firing native 'ended' event
          if (
            this.audioElement.duration > 0 &&
            this.audioElement.currentTime >= this.audioElement.duration - 0.25 &&
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
        if (!this.hasTriggeredEnded) {
          this.hasTriggeredEnded = true;
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      });

      // Hook media source with direct fallback for Android WebView
      try {
        this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
        this.mediaSourceNode.connect(this.bassBoostFilter);
      } catch (mediaErr) {
        console.warn('createMediaElementSource failed (using direct HTML5 audio routing):', mediaErr);
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
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setCallbacks(onTimeUpdate: (t: number) => void, onEnded: () => void) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
  }

  public async playTrack(track: Track, startTime: number = 0, crossfadeSecs: number = 0) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('Could not resume AudioContext:', err);
      }
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
        if (track.file) {
          this.audioElement.src = URL.createObjectURL(track.file);
        } else if (track.audioUrl) {
          this.audioElement.src = track.audioUrl;
        }
        this.audioElement.currentTime = startTime;
        this.audioElement.volume = this.isMuted ? 0 : this.volume;
        this.audioElement.muted = this.isMuted;
        try {
          await this.audioElement.play();
        } catch (e) {
          console.warn('HTML5 audio play error, fallback to synth', e);
          this.startSynth(track, startTime);
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

  public resume() {
    if (!this.currentTrack) return;
    this.isPlaying = true;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.audioElement && this.audioElement.src && !this.isSynthPlaying) {
      if (this.synthTime > 0) {
        try {
          this.audioElement.currentTime = this.synthTime;
        } catch {
          // ignore
        }
      }
      this.audioElement.play().catch(() => {});
    } else if (this.currentTrack.file || this.currentTrack.audioUrl) {
      this.audioElement?.play().catch(() => {});
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

    // Apply 5 bands
    eq.bands.forEach((val, idx) => {
      if (this.eqFilters[idx]) {
        const gain = eq.enabled ? val : 0;
        this.eqFilters[idx].gain.setTargetAtTime(gain, now, 0.05);
      }
    });

    // Bass boost
    if (this.bassBoostFilter) {
      const bassGain = eq.enabled ? (eq.bassBoost / 100) * 12 : 0;
      this.bassBoostFilter.gain.setTargetAtTime(bassGain, now, 0.05);
    }

    // Reverb
    if (this.reverbGain) {
      const revGain = eq.enabled ? (eq.reverb / 100) * 0.45 : 0;
      this.reverbGain.gain.setTargetAtTime(revGain, now, 0.05);
    }

    // Stereo Widening
    if (this.stereoPanner) {
      // Subtle pan movement or widening simulated
      const panAmount = eq.enabled ? (eq.stereoWidening / 100) * 0.2 : 0;
      this.stereoPanner.pan.setTargetAtTime(panAmount, now, 0.05);
    }
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  private silentAudioCarrier: string = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A';

  // Real-time Procedural Musical Synthesizer for default tracks
  private startSynth(track: Track, startTime: number) {
    this.stopSynth();
    this.isSynthPlaying = true;
    this.synthTime = startTime;
    this.hasTriggeredEnded = false;

    // Keep Android 14/15/16 OS Media Notification alive by playing silent audio loop
    if (this.audioElement) {
      try {
        this.audioElement.src = this.silentAudioCarrier;
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

      if (this.synthTime >= track.duration) {
        this.stopSynth();
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
        return;
      }

      // Schedule notes based on rhythm
      const currentBeat = Math.floor((this.synthTime / beatDuration) * 4);
      if (currentBeat !== step) {
        step = currentBeat;
        this.playProceduralNote(track.synthPreset || 'synthwave', step % 16);
      }
    }, 100);
  }

  private playProceduralNote(preset: string, step: number) {
    if (!this.ctx || !this.bassBoostFilter) return;

    try {
      const now = this.ctx.currentTime;

      // Bassline note generator
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        // Scale notes: A minor / Pentatonic
        const bassFreqs = [55, 55, 65.41, 48.99, 55, 73.42, 65.41, 43.65];
        const f = bassFreqs[Math.floor(step / 2) % bassFreqs.length];

        bassOsc.type = preset === 'lofi' ? 'triangle' : preset === 'cyberbass' ? 'sawtooth' : 'sine';
        bassOsc.frequency.setValueAtTime(f, now);

        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        bassOsc.connect(bassGain);
        bassGain.connect(this.bassBoostFilter);

        bassOsc.start(now);
        bassOsc.stop(now + 0.36);
      }

      // Kick drum
      if (step === 0 || step === 4 || step === 8 || step === 12 || (preset === 'cyberbass' && step === 10)) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

        kickGain.gain.setValueAtTime(0.6, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bassBoostFilter);

        kickOsc.start(now);
        kickOsc.stop(now + 0.2);
      }

      // Snare / Clap / Brush
      if (step === 4 || step === 12) {
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = preset === 'lofi' ? 1200 : 2400;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.bassBoostFilter);

        noise.start(now);
      }

      // Melodic Chord / Arpeggio
      if (step % 2 === 1 || step % 4 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        const melodies = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25];
        const pitch = melodies[(step * 3) % melodies.length];

        leadOsc.type = preset === 'ambient' ? 'sine' : preset === 'synthwave' ? 'sawtooth' : 'triangle';
        leadOsc.frequency.setValueAtTime(pitch, now);

        leadGain.gain.setValueAtTime(0.12, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        leadOsc.connect(leadGain);
        leadGain.connect(this.bassBoostFilter);

        leadOsc.start(now);
        leadOsc.stop(now + 0.42);
      }
    } catch {
      // Audio node scheduling safe catch
    }
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.audioElement && this.audioElement.src.startsWith('data:audio/wav')) {
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }
    }
  }

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      try {
        const artworkUrl = (track.coverArt && (track.coverArt.startsWith('http') || track.coverArt.startsWith('blob:') || track.coverArt.startsWith('data:')))
          ? track.coverArt
          : '/assets/aistudio/logo.png';

        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: [
            { src: artworkUrl, sizes: '512x512', type: 'image/png' }
          ]
        });

        navigator.mediaSession.playbackState = 'playing';

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
