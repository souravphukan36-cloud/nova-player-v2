const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Track configs: distinct musical keys, tempos, and instruments
const trackConfigs = [
  { file: 'aaoge-tum-kabhi.wav', bpm: 120, key: 0, style: 'indie-rock' },
  { file: 'choo-lo.wav', bpm: 88, key: 5, style: 'acoustic' },
  { file: 'kaahe-mose.wav', bpm: 92, key: 2, style: 'classical' },
  { file: 'raabta.wav', bpm: 104, key: 9, style: 'romance' },
  { file: 'somewhere-only-we-know.wav', bpm: 86, key: 7, style: 'piano' },
  { file: 'jo-tum-mere-ho.wav', bpm: 95, key: 4, style: 'lofi' },
  { file: 'dil-jhoom.wav', bpm: 110, key: 11, style: 'groove' },
  { file: 'halka-halka-suroor.wav', bpm: 100, key: 2, style: 'sufi' },
  { file: 'qismat-badaldi-vekhi.wav', bpm: 82, key: 1, style: 'ballad' },
  { file: 'surili-akhiyon-wale.wav', bpm: 90, key: 5, style: 'classical' },
  { file: 'bairan.wav', bpm: 96, key: 4, style: 'folk' },
  { file: 'faasle.wav', bpm: 84, key: 7, style: 'acoustic' },
  { file: 'come-and-get-your-love.wav', bpm: 124, key: 0, style: 'funk' },
  { file: 'the-last-letter.wav', bpm: 80, key: 9, style: 'lofi' },
  { file: 'black-star.wav', bpm: 98, key: 2, style: 'rock' },
  { file: 'muntazir.wav', bpm: 88, key: 4, style: 'coke-studio' }
];

// Scale intervals (semitones): Major / Minor chords
const NOTES = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88]; // C4 to B4

function generateMusicalWav(filename, durationSecs, bpm, keyOffset) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSecs);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Chord progression: I - V - vi - IV
  const chordRoots = [0, 7, 9, 5].map(deg => (deg + keyOffset) % 12);
  const secondsPerBeat = 60 / bpm;
  const beatsPerChord = 4;
  const chordDuration = secondsPerBeat * beatsPerChord;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDuration) % chordRoots.length;
    const rootSemi = chordRoots[chordIdx];
    const rootFreq = NOTES[rootSemi] || 261.63;
    const fifthFreq = rootFreq * 1.5;
    const thirdFreq = rootFreq * (chordIdx === 2 ? 1.2 : 1.25); // minor on vi
    const bassFreq = rootFreq * 0.5;

    // Arpeggio note selector (16th notes)
    const subBeat = Math.floor((t % secondsPerBeat) * 4);
    let noteFreq = rootFreq;
    if (subBeat === 1) noteFreq = thirdFreq;
    else if (subBeat === 2) noteFreq = fifthFreq;
    else if (subBeat === 3) noteFreq = rootFreq * 2;

    // Pluck envelope for acoustic arpeggio
    const pluckTime = (t % (secondsPerBeat / 4));
    const pluckEnv = Math.exp(-pluckTime * 12);

    // Bass warmth
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.28;
    // Harmonic warm pad
    const pad = (Math.sin(2 * Math.PI * rootFreq * t) + Math.sin(2 * Math.PI * fifthFreq * t)) * 0.12;
    // Arpeggiated melody
    const melody = (Math.sin(2 * Math.PI * noteFreq * t) + 0.4 * Math.sin(4 * Math.PI * noteFreq * t)) * pluckEnv * 0.32;

    // Subtle stereo spread
    const leftSample = Math.max(-1, Math.min(1, bass + pad * 0.9 + melody * 1.1));
    const rightSample = Math.max(-1, Math.min(1, bass + pad * 1.1 + melody * 0.9));

    // Master fade-in (1s) and fade-out (2s)
    let masterGain = 1.0;
    if (t < 1.0) masterGain = t;
    if (t > durationSecs - 2.0) masterGain = Math.max(0, (durationSecs - t) / 2.0);

    const intLeft = Math.round(leftSample * masterGain * 24000);
    const intRight = Math.round(rightSample * masterGain * 24000);

    buffer.writeInt16LE(intLeft, offset);
    buffer.writeInt16LE(intRight, offset + 2);
    offset += 4;
  }

  const targetPath = path.join(audioDir, filename);
  fs.writeFileSync(targetPath, buffer);
  console.log(`Generated high-fidelity master: ${filename} (${Math.round(buffer.length / 1024)} KB)`);
}

// Generate for all tracks (30s rich loopable master audio each)
for (const conf of trackConfigs) {
  const p = path.join(audioDir, conf.file);
  if (!fs.existsSync(p)) {
    generateMusicalWav(conf.file, 60, conf.bpm, conf.key);
  }
}
console.log('All fallback audio files ready!');
