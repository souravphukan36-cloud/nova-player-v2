const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// 17 default track filenames
const TRACK_FILES = [
  'arz-kiya-hai.wav',
  'aaoge-tum-kabhi.wav',
  'husn.wav',
  'baarishein.wav',
  'alag-aasmaan.wav',
  'somewhere-only-we-know.wav',
  'jo-tum-mere-ho.wav',
  'dil-jhoom.wav',
  'halka-halka-suroor.wav',
  'qismat-badaldi-vekhi.wav',
  'surili-akhiyon-wale.wav',
  'bairan.wav',
  'faasle.wav',
  'come-and-get-your-love.wav',
  'the-last-letter.wav',
  'black-star.wav',
  'muntazir.wav'
];

// Generate a valid, melodic 16-bit PCM stereo WAV file
function createMelodicWav(filename, baseFreq, progressionType) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const durationSec = 30; // 30-second seamless looping preview file
  const totalSamples = sampleRate * durationSec;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Musical chord progressions (frequencies in Hz)
  const progressions = {
    acoustic: [
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5], // I
      [baseFreq * 0.84, baseFreq * 1.05, baseFreq * 1.26], // vi
      [baseFreq * 0.75, baseFreq * 0.9375, baseFreq * 1.125], // IV
      [baseFreq * 0.89, baseFreq * 1.12, baseFreq * 1.33], // V
    ],
    indie: [
      [baseFreq, baseFreq * 1.2, baseFreq * 1.5], // minor I
      [baseFreq * 0.8, baseFreq, baseFreq * 1.2], // VI
      [baseFreq * 0.9, baseFreq * 1.125, baseFreq * 1.35], // VII
      [baseFreq, baseFreq * 1.25, baseFreq * 1.5], // I
    ]
  };

  const chords = progressions[progressionType] || progressions.acoustic;
  const chordDuration = durationSec / chords.length;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const chordLocalTime = t % chordDuration;

    // Guitar pluck envelope (exponential decay every 0.5s)
    const pluckRate = 0.5;
    const pluckTime = chordLocalTime % pluckRate;
    const env = Math.exp(-pluckTime * 6.0) * 0.8 + 0.2;

    // Rich harmonic synthesis (fundamental + warm 2nd & 3rd harmonics)
    let leftSample = 0;
    let rightSample = 0;

    chord.forEach((freq, noteIdx) => {
      const detuneL = 1.0 + (noteIdx * 0.001);
      const detuneR = 1.0 - (noteIdx * 0.001);
      const f1L = Math.sin(2 * Math.PI * (freq * detuneL) * t);
      const f2L = Math.sin(2 * Math.PI * (freq * 2 * detuneL) * t) * 0.4;
      const f3L = Math.sin(2 * Math.PI * (freq * 3 * detuneL) * t) * 0.15;

      const f1R = Math.sin(2 * Math.PI * (freq * detuneR) * t);
      const f2R = Math.sin(2 * Math.PI * (freq * 2 * detuneR) * t) * 0.4;
      const f3R = Math.sin(2 * Math.PI * (freq * 3 * detuneR) * t) * 0.15;

      leftSample += (f1L + f2L + f3L) * env;
      rightSample += (f1R + f2R + f3R) * env;
    });

    // Sub-bass root note for deep audiophile resonance
    const subBassFreq = chord[0] * 0.5;
    const subBass = Math.sin(2 * Math.PI * subBassFreq * t) * 0.45;
    leftSample += subBass;
    rightSample += subBass;

    // Soft master gain & soft clipper to prevent harsh digital clipping
    const masterGain = 0.22;
    leftSample = Math.tanh(leftSample * masterGain);
    rightSample = Math.tanh(rightSample * masterGain);

    // Convert to 16-bit signed integer (-32768 to 32767)
    const intSampleL = Math.max(-32768, Math.min(32767, Math.floor(leftSample * 32767)));
    const intSampleR = Math.max(-32768, Math.min(32767, Math.floor(rightSample * 32767)));

    buffer.writeInt16LE(intSampleL, offset);
    offset += 2;
    buffer.writeInt16LE(intSampleR, offset);
    offset += 2;
  }

  const outPath = path.join(AUDIO_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated audio: ${filename} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

const baseFreqs = [220, 246.94, 196, 261.63, 174.61, 293.66, 164.81, 220, 246.94, 196, 261.63, 220, 196, 261.63, 220, 174.61, 246.94];

TRACK_FILES.forEach((f, idx) => {
  createMelodicWav(f, baseFreqs[idx % baseFreqs.length], idx % 2 === 0 ? 'acoustic' : 'indie');
});

console.log('All 17 default acoustic master tracks generated successfully in /public/audio!');
