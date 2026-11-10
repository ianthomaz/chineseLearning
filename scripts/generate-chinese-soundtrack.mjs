import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const DURATION = 120.0; // 120 seconds = 2 minutes
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// Left & Right channel buffers
const leftBuffer = new Float32Array(TOTAL_SAMPLES);
const rightBuffer = new Float32Array(TOTAL_SAMPLES);

// Pentatonic Frequencies (Key of D)
// D, E, F#, A, B
const NOTES = {
  D2: 73.42,
  A2: 110.0,
  D3: 146.83,
  E3: 164.81,
  Fs3: 185.00,
  A3: 220.00,
  B3: 246.94,
  D4: 293.66,
  E4: 329.63,
  Fs4: 369.99,
  A4: 440.00,
  B4: 493.88,
  D5: 587.33,
  E5: 659.25,
  Fs5: 739.99,
  A5: 880.00,
  B5: 987.77,
  D6: 1174.66,
  E6: 1318.51,
  Fs6: 1479.98,
};

// --- SYNTHESIZERS ---

// 1. Guzheng / Pipa (Plucked string with harmonics and left-hand bend)
function pluckNote(freq, startTime, duration, velocity = 0.8, pan = 0.0, bend = 0.0) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  // Pluck attack & decay
  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    // microtonal bend
    const fCur = freq * (1.0 + bend * Math.sin(Math.min(1, t / 0.4) * Math.PI * 0.5));
    
    // Harmonics: fundamental, 2nd, 3rd, 4th, 5th
    const decay = Math.exp(-t * (1.8 + freq * 0.0025));
    const h1 = Math.sin(2 * Math.PI * fCur * t);
    const h2 = 0.55 * Math.sin(2 * Math.PI * fCur * 2 * t) * Math.exp(-t * 2.5);
    const h3 = 0.35 * Math.sin(2 * Math.PI * fCur * 3 * t) * Math.exp(-t * 3.8);
    const h4 = 0.20 * Math.sin(2 * Math.PI * fCur * 4 * t) * Math.exp(-t * 5.5);
    const h5 = 0.12 * Math.sin(2 * Math.PI * fCur * 5 * t) * Math.exp(-t * 7.0);

    // Initial sharp transient click (finger nail / plectrum)
    const attack = Math.min(1.0, t / 0.003);
    const click = t < 0.008 ? (Math.random() * 2 - 1) * Math.exp(-t / 0.002) * 0.3 : 0.0;

    const val = (h1 + h2 + h3 + h4 + h5 + click) * decay * attack * velocity * 0.45;

    // Pan calculation (-1 left, +1 right)
    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    leftBuffer[i] += val * leftGain;
    rightBuffer[i] += val * rightGain;
  }
}

// 2. Dizi (Bamboo Flute - breathy, expressive vibrato, sweet tone)
function fluteNote(freq, startTime, duration, velocity = 0.7, pan = -0.2) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const relT = t / duration;

    // ADSR Envelope
    let env = 1.0;
    const attackTime = 0.07;
    const releaseTime = 0.12;
    if (t < attackTime) {
      env = Math.sin((t / attackTime) * Math.PI * 0.5);
    } else if (duration - t < releaseTime) {
      env = Math.sin(((duration - t) / releaseTime) * Math.PI * 0.5);
    }

    // Vibrato: swells in after 0.18s
    const vibDelay = Math.min(1.0, Math.max(0.0, (t - 0.18) / 0.25));
    const vibrato = 1.0 + 0.012 * vibDelay * Math.sin(2 * Math.PI * 5.4 * t);
    const curFreq = freq * vibrato;

    // Bamboo flute harmonics + membrane buzz (di mo)
    const f1 = Math.sin(2 * Math.PI * curFreq * t);
    const f2 = 0.28 * Math.sin(2 * Math.PI * curFreq * 2 * t);
    const f3 = 0.18 * Math.sin(2 * Math.PI * curFreq * 3 * t);
    const f4 = 0.08 * Math.sin(2 * Math.PI * curFreq * 4 * t);
    // subtle breath noise
    const breath = (Math.random() * 2 - 1) * 0.04;

    const val = (f1 + f2 + f3 + f4 + breath) * env * velocity * 0.38;

    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    leftBuffer[i] += val * leftGain;
    rightBuffer[i] += val * rightGain;
  }
}

// 3. Erhu (Expressive bowed strings, warm wood resonance)
function erhuNote(freq, startTime, duration, velocity = 0.65, pan = 0.25) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;

    // Bowing envelope
    let env = 1.0;
    const attackTime = 0.12;
    const releaseTime = 0.2;
    if (t < attackTime) {
      env = t / attackTime;
    } else if (duration - t < releaseTime) {
      env = (duration - t) / releaseTime;
    }

    // Emotional vibrato: 5.8Hz
    const vibDepth = 0.015 * Math.min(1.0, t / 0.2);
    const vibrato = 1.0 + vibDepth * Math.sin(2 * Math.PI * 5.8 * t);
    const curFreq = freq * vibrato;

    // Bowed saw/pulse wave with body resonance
    let wave = 0.0;
    for (let k = 1; k <= 7; k++) {
      const hGain = (1.0 / (k * 0.9)) * Math.exp(-k * 0.15);
      wave += hGain * Math.sin(2 * Math.PI * curFreq * k * t);
    }

    const val = wave * env * velocity * 0.28;

    const leftGain = Math.cos((pan + 1) * Math.PI / 4);
    const rightGain = Math.sin((pan + 1) * Math.PI / 4);

    leftBuffer[i] += val * leftGain;
    rightBuffer[i] += val * rightGain;
  }
}

// 4. Percussion: Muyu (Wood Block), Qing (Singing Bowl / Bell), Tanggu (Low Drum)
function playMuyu(startTime, velocity = 0.6, pan = -0.15) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const duration = 0.08;
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const pitch = 880 * Math.exp(-t * 25);
    const val = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * 55) * velocity * 0.45;
    leftBuffer[i] += val * Math.cos((pan + 1) * Math.PI / 4);
    rightBuffer[i] += val * Math.sin((pan + 1) * Math.PI / 4);
  }
}

function playQingBell(startTime, velocity = 0.7, pan = 0.3) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const duration = 4.0;
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const b1 = Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 0.8);
    const b2 = 0.6 * Math.sin(2 * Math.PI * 3520 * t) * Math.exp(-t * 1.4);
    const b3 = 0.35 * Math.sin(2 * Math.PI * 5280 * t) * Math.exp(-t * 2.2);
    const shimmer = 0.2 * Math.sin(2 * Math.PI * 1774 * t) * Math.exp(-t * 0.9); // beat frequency
    const val = (b1 + b2 + b3 + shimmer) * velocity * 0.32;
    leftBuffer[i] += val * Math.cos((pan + 1) * Math.PI / 4);
    rightBuffer[i] += val * Math.sin((pan + 1) * Math.PI / 4);
  }
}

function playTangguDrum(startTime, velocity = 0.8) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const duration = 0.7;
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const pitch = 110 * Math.exp(-t * 8) + 55;
    const click = t < 0.005 ? (Math.random() * 2 - 1) * 0.5 : 0;
    const val = (Math.sin(2 * Math.PI * pitch * t) + click) * Math.exp(-t * 4.2) * velocity * 0.6;
    leftBuffer[i] += val * 0.707;
    rightBuffer[i] += val * 0.707;
  }
}

// Low ambient cello/drone chord for grounding
function playAmbientDrone(startTime, duration, baseFreq = 73.42) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const sampleCount = Math.floor(duration * SAMPLE_RATE);
  const endSample = Math.min(TOTAL_SAMPLES, startSample + sampleCount);

  for (let i = startSample; i < endSample; i++) {
    const t = (i - startSample) / SAMPLE_RATE;
    const env = Math.min(1.0, t / 1.5) * Math.min(1.0, (duration - t) / 1.5);
    const w1 = Math.sin(2 * Math.PI * baseFreq * t);
    const w2 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t); // Fifth
    const val = (w1 + w2) * env * 0.12;
    leftBuffer[i] += val;
    rightBuffer[i] += val;
  }
}

// --- FULL 2-MINUTE SCORE COMPOSITION ---
console.log("Composing 2-minute Chinese Instrumental Masterpiece...");

// Tempo: 75 BPM -> 1 beat = 0.8 seconds. 1 bar = 3.2 seconds.
const BEAT = 0.8;

// SECTION 1: Intro (0s - 20s) - Atmospheric Qing chime, Guzheng cascade, gentle flute intro
playQingBell(0.2, 0.9, 0.4);
playAmbientDrone(0.5, 20.0, NOTES.D2);

// Gentle introductory Guzheng arpeggios
const introGuzheng = [
  { note: NOTES.D4, t: 1.0, dur: 2.5, vel: 0.7, pan: -0.3 },
  { note: NOTES.A4, t: 1.8, dur: 2.2, vel: 0.75, pan: 0.3 },
  { note: NOTES.D5, t: 2.6, dur: 3.0, vel: 0.8, pan: 0.0 },
  { note: NOTES.Fs5, t: 4.2, dur: 2.5, vel: 0.75, pan: -0.25 },
  { note: NOTES.E5, t: 5.6, dur: 2.0, vel: 0.7, pan: 0.25 },
  { note: NOTES.D5, t: 7.0, dur: 3.5, vel: 0.85, pan: 0.0, bend: 0.04 },
  
  // Cascade
  { note: NOTES.A3, t: 9.0, dur: 1.5, vel: 0.6, pan: -0.4 },
  { note: NOTES.D4, t: 9.3, dur: 1.5, vel: 0.65, pan: -0.2 },
  { note: NOTES.E4, t: 9.6, dur: 1.5, vel: 0.7, pan: 0.0 },
  { note: NOTES.Fs4, t: 9.9, dur: 1.5, vel: 0.75, pan: 0.2 },
  { note: NOTES.A4, t: 10.2, dur: 1.5, vel: 0.8, pan: 0.4 },
  { note: NOTES.B4, t: 10.5, dur: 2.5, vel: 0.85, pan: 0.2, bend: -0.03 },
  { note: NOTES.A4, t: 12.0, dur: 3.0, vel: 0.75, pan: -0.1 },
];

introGuzheng.forEach(n => pluckNote(n.note, n.t, n.dur, n.vel, n.pan, n.bend || 0));

// Flute introduces the main motif
fluteNote(NOTES.D5, 12.8, 1.8, 0.7, -0.2);
fluteNote(NOTES.E5, 14.6, 0.9, 0.72, -0.2);
fluteNote(NOTES.Fs5, 15.5, 2.2, 0.8, -0.2);
fluteNote(NOTES.A5, 17.7, 1.2, 0.75, -0.2);
fluteNote(NOTES.Fs5, 18.9, 1.8, 0.7, -0.2);


// SECTION 2: 20s - 42s (Theme A - Playful & Rhythmic - Phrase Game)
playQingBell(20.0, 0.8, -0.4);
playTangguDrum(20.0, 0.9);
playAmbientDrone(20.0, 22.0, NOTES.D2);

// Muyu rhythm + Tanggu on downbeats
for (let t = 20.0; t < 41.5; t += BEAT) {
  playMuyu(t, 0.55, -0.2);
  playMuyu(t + BEAT * 0.5, 0.4, 0.2);
}
for (let t = 20.0; t < 41.5; t += BEAT * 4) {
  playTangguDrum(t, 0.85);
  playTangguDrum(t + BEAT * 2.5, 0.6);
}

// Bouncy Guzheng ostinato
for (let t = 20.0; t < 41.0; t += BEAT * 2) {
  pluckNote(NOTES.D3, t, 1.2, 0.7, -0.3);
  pluckNote(NOTES.A3, t + BEAT * 0.5, 0.8, 0.65, 0.2);
  pluckNote(NOTES.D4, t + BEAT, 1.0, 0.75, -0.1);
  pluckNote(NOTES.Fs4, t + BEAT * 1.5, 0.8, 0.7, 0.3);
}

// Theme A Flute & Pipa call and response
const themeAMelody = [
  { note: NOTES.A5, t: 21.6, dur: 1.0, vel: 0.85 },
  { note: NOTES.Fs5, t: 22.8, dur: 0.7, vel: 0.75 },
  { note: NOTES.E5, t: 23.6, dur: 1.2, vel: 0.8 },
  { note: NOTES.D5, t: 25.0, dur: 1.8, vel: 0.85 },

  { note: NOTES.B4, t: 27.2, dur: 0.8, vel: 0.75 },
  { note: NOTES.D5, t: 28.0, dur: 0.8, vel: 0.8 },
  { note: NOTES.E5, t: 28.8, dur: 1.5, vel: 0.85 },
  { note: NOTES.Fs5, t: 30.4, dur: 2.2, vel: 0.9 },

  { note: NOTES.A5, t: 33.0, dur: 1.0, vel: 0.85 },
  { note: NOTES.B5, t: 34.2, dur: 1.2, vel: 0.9 },
  { note: NOTES.A5, t: 35.6, dur: 0.8, vel: 0.8 },
  { note: NOTES.Fs5, t: 36.4, dur: 1.2, vel: 0.85 },
  { note: NOTES.E5, t: 37.8, dur: 1.0, vel: 0.8 },
  { note: NOTES.D5, t: 39.0, dur: 2.6, vel: 0.9 },
];
themeAMelody.forEach(m => fluteNote(m.note, m.t, m.dur, m.vel, -0.25));

// Pipa ornamental accents
const pipaAccents = [
  { note: NOTES.D5, t: 22.0 },
  { note: NOTES.A5, t: 25.4 },
  { note: NOTES.Fs5, t: 28.4 },
  { note: NOTES.D6, t: 32.0 },
  { note: NOTES.B5, t: 37.0 },
  { note: NOTES.A5, t: 40.2 },
];
pipaAccents.forEach(p => pluckNote(p.note, p.t, 1.2, 0.85, 0.35, 0.05));


// SECTION 3: 42s - 65s (Theme B - Elegant Calligraphy & Stroke Flow)
playQingBell(42.0, 0.9, 0.4);
playAmbientDrone(42.0, 23.0, NOTES.D2);

// Sweeping Guzheng glissandos
function runGlissando(startTime, up = true) {
  const scale = [NOTES.D3, NOTES.E3, NOTES.Fs3, NOTES.A3, NOTES.B3, NOTES.D4, NOTES.E4, NOTES.Fs4, NOTES.A4, NOTES.B4, NOTES.D5];
  const list = up ? scale : scale.slice().reverse();
  list.forEach((n, idx) => {
    pluckNote(n, startTime + idx * 0.05, 1.6, 0.65, (idx / scale.length) * 0.8 - 0.4);
  });
}

runGlissando(42.5, true);
runGlissando(53.0, true);
runGlissando(63.5, false);

// Erhu leads Theme B with lush warmth
const erhuMelody = [
  { note: NOTES.Fs4, t: 44.0, dur: 2.2, vel: 0.75 },
  { note: NOTES.A4, t: 46.4, dur: 1.6, vel: 0.8 },
  { note: NOTES.B4, t: 48.2, dur: 2.4, vel: 0.85 },
  { note: NOTES.D5, t: 50.8, dur: 2.0, vel: 0.9 },
  { note: NOTES.E5, t: 53.0, dur: 1.4, vel: 0.8 },
  { note: NOTES.Fs5, t: 54.6, dur: 2.8, vel: 0.9 },

  { note: NOTES.E5, t: 57.8, dur: 1.6, vel: 0.8 },
  { note: NOTES.D5, t: 59.6, dur: 1.8, vel: 0.85 },
  { note: NOTES.B4, t: 61.6, dur: 1.5, vel: 0.75 },
  { note: NOTES.A4, t: 63.2, dur: 2.5, vel: 0.8 },
];
erhuMelody.forEach(m => erhuNote(m.note, m.t, m.dur, m.vel, 0.25));

// Soft counter-melody on flute
fluteNote(NOTES.D5, 48.0, 2.0, 0.6, -0.3);
fluteNote(NOTES.Fs5, 54.0, 2.2, 0.65, -0.3);
fluteNote(NOTES.A5, 60.0, 2.5, 0.7, -0.3);


// SECTION 4: 65s - 88s (Theme C - Modern Routine & Widget Habit)
playTangguDrum(65.0, 0.9);
playAmbientDrone(65.0, 23.0, NOTES.D2);

// Steady modern groove
for (let t = 65.0; t < 87.5; t += BEAT) {
  playMuyu(t, 0.5, -0.2);
  if ((t - 65.0) % (BEAT * 2) === 0) {
    playTangguDrum(t, 0.75);
  }
}

// Guzheng rhythmic pattern
for (let t = 65.0; t < 87.0; t += BEAT * 4) {
  pluckNote(NOTES.D3, t, 1.5, 0.8, -0.3);
  pluckNote(NOTES.Fs3, t + BEAT, 1.2, 0.7, 0.1);
  pluckNote(NOTES.A3, t + BEAT * 2, 1.5, 0.8, -0.1);
  pluckNote(NOTES.D4, t + BEAT * 3, 1.2, 0.75, 0.3);
}

// Interplay Flute + Pipa
const widgetTheme = [
  { note: NOTES.D5, t: 66.5, dur: 1.2 },
  { note: NOTES.E5, t: 68.0, dur: 0.9 },
  { note: NOTES.Fs5, t: 69.0, dur: 1.5 },
  { note: NOTES.A5, t: 70.8, dur: 2.0 },
  { note: NOTES.Fs5, t: 73.0, dur: 1.0 },
  { note: NOTES.E5, t: 74.2, dur: 1.0 },
  { note: NOTES.D5, t: 75.4, dur: 2.2 },

  { note: NOTES.A4, t: 78.0, dur: 1.0 },
  { note: NOTES.B4, t: 79.2, dur: 1.0 },
  { note: NOTES.D5, t: 80.4, dur: 1.5 },
  { note: NOTES.E5, t: 82.0, dur: 1.8 },
  { note: NOTES.D5, t: 84.0, dur: 3.0 },
];
widgetTheme.forEach(w => {
  fluteNote(w.note, w.t, w.dur, 0.8, -0.2);
  pluckNote(w.note, w.t + 0.05, w.dur * 0.8, 0.65, 0.3);
});


// SECTION 5: 88s - 108s (Theme D - Ensemble Grandeur & Progress)
playQingBell(88.0, 0.95, 0.3);
playTangguDrum(88.0, 1.0);
playAmbientDrone(88.0, 20.0, NOTES.D2);

runGlissando(88.2, true);
runGlissando(97.5, true);

// Full ensemble rhythmic foundation
for (let t = 88.0; t < 107.5; t += BEAT) {
  playMuyu(t, 0.6, -0.2);
  playMuyu(t + BEAT * 0.5, 0.45, 0.2);
}
for (let t = 88.0; t < 107.5; t += BEAT * 2) {
  playTangguDrum(t, 0.85);
}

// Grand Erhu + Flute in unison and thirds
const grandTheme = [
  { flute: NOTES.D6, erhu: NOTES.D5, t: 89.6, dur: 1.4 },
  { flute: NOTES.B5, erhu: NOTES.B4, t: 91.2, dur: 1.2 },
  { flute: NOTES.A5, erhu: NOTES.A4, t: 92.6, dur: 1.8 },
  { flute: NOTES.Fs5, erhu: NOTES.Fs4, t: 94.6, dur: 2.2 },

  { flute: NOTES.E5, erhu: NOTES.E4, t: 97.0, dur: 1.2 },
  { flute: NOTES.Fs5, erhu: NOTES.Fs4, t: 98.4, dur: 1.2 },
  { flute: NOTES.A5, erhu: NOTES.A4, t: 99.8, dur: 2.0 },
  { flute: NOTES.B5, erhu: NOTES.B4, t: 102.0, dur: 2.2 },
  { flute: NOTES.D6, erhu: NOTES.D5, t: 104.5, dur: 3.2 },
];
grandTheme.forEach(g => {
  fluteNote(g.flute, g.t, g.dur, 0.85, -0.3);
  erhuNote(g.erhu, g.t, g.dur, 0.8, 0.3);
  pluckNote(g.flute, g.t, 1.5, 0.7, 0.0);
});


// SECTION 6: 108s - 120s (Coda / Harmonious Resolution)
playQingBell(108.0, 1.0, 0.0);
playAmbientDrone(108.0, 12.0, NOTES.D2);

// Gentle fading Guzheng arpeggio upward to D6
const codaNotes = [
  { note: NOTES.D3, t: 108.5 },
  { note: NOTES.A3, t: 109.5 },
  { note: NOTES.D4, t: 110.5 },
  { note: NOTES.Fs4, t: 111.5 },
  { note: NOTES.A4, t: 112.5 },
  { note: NOTES.D5, t: 113.5 },
  { note: NOTES.Fs5, t: 114.5 },
  { note: NOTES.A5, t: 115.5 },
  { note: NOTES.D6, t: 116.5, bend: 0.03 },
];
codaNotes.forEach(c => pluckNote(c.note, c.t, 3.5, 0.75, (c.t - 108) * 0.06 - 0.3, c.bend || 0));

// Final bell strike on serene ending
playQingBell(116.5, 0.8, 0.0);

// --- NORMALIZE & EXPORT WAV ---
console.log("Normalizing audio channels...");
let peak = 0.0001;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  if (Math.abs(leftBuffer[i]) > peak) peak = Math.abs(leftBuffer[i]);
  if (Math.abs(rightBuffer[i]) > peak) peak = Math.abs(rightBuffer[i]);
}

const targetPeak = 0.92;
const gain = targetPeak / peak;
console.log(`Peak detected: ${peak.toFixed(4)}, applying gain factor: ${gain.toFixed(4)}`);

// Encode to 16-bit PCM WAV
const byteRate = SAMPLE_RATE * 2 * 2; // 2 channels, 16 bits = 4 bytes per sample
const dataSize = TOTAL_SAMPLES * 4;
const headerSize = 44;
const wavBuffer = Buffer.alloc(headerSize + dataSize);

// RIFF header
wavBuffer.write("RIFF", 0);
wavBuffer.writeUInt32LE(36 + dataSize, 4);
wavBuffer.write("WAVE", 8);

// fmt chunk
wavBuffer.write("fmt ", 12);
wavBuffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
wavBuffer.writeUInt16LE(1, 20);  // PCM format
wavBuffer.writeUInt16LE(2, 22);  // 2 channels
wavBuffer.writeUInt32LE(SAMPLE_RATE, 24);
wavBuffer.writeUInt32LE(byteRate, 28);
wavBuffer.writeUInt16LE(4, 32);  // block align
wavBuffer.writeUInt16LE(16, 34); // bits per sample

// data chunk
wavBuffer.write("data", 36);
wavBuffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const leftSample = Math.max(-1, Math.min(1, leftBuffer[i] * gain));
  const rightSample = Math.max(-1, Math.min(1, rightBuffer[i] * gain));

  const leftInt = leftSample < 0 ? Math.floor(leftSample * 32768) : Math.floor(leftSample * 32767);
  const rightInt = rightSample < 0 ? Math.floor(rightSample * 32768) : Math.floor(rightSample * 32767);

  wavBuffer.writeInt16LE(leftInt, offset);
  wavBuffer.writeInt16LE(rightInt, offset + 2);
  offset += 4;
}

const outDir = join(process.cwd(), "appMobile/store/audio");
mkdirSync(outDir, { recursive: true });

const masterWav = join(outDir, "chinese_instrumental_2min_master.wav");
writeFileSync(masterWav, wavBuffer);
console.log(`Saved master WAV: ${masterWav} (${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

// Use ffmpeg to generate high quality MP3
const masterMp3 = join(outDir, "chinese_instrumental_2min_master.mp3");
try {
  execFileSync("/opt/homebrew/bin/ffmpeg", ["-y", "-i", masterWav, "-b:a", "256k", masterMp3]);
  console.log(`Generated master MP3: ${masterMp3}`);
} catch (e) {
  console.error("ffmpeg conversion error:", e.message);
}

// Extract the designated slices for our 6 Reels + Store Assets
const cuts = [
  { name: "store_ambient_header.mp3", start: "00:00:01", dur: "10" },
  { name: "reel1_daily_routine.mp3", start: "00:01:05", dur: "10" },
  { name: "reel2_visual_hanzi.mp3", start: "00:01:28", dur: "10" },
  { name: "reel3_phrases_action.mp3", start: "00:00:12", dur: "10" },
  { name: "reel4_phrase_game.mp3", start: "00:00:20", dur: "12" },
  { name: "reel5_widget_home.mp3", start: "00:01:08", dur: "12" },
  { name: "reel6_stroke_calligraphy.mp3", start: "00:00:44", dur: "12" },
];

for (const cut of cuts) {
  const cutPath = join(outDir, cut.name);
  try {
    execFileSync("/opt/homebrew/bin/ffmpeg", [
      "-y",
      "-ss", cut.start,
      "-i", masterWav,
      "-t", cut.dur,
      "-af", "afade=t=in:ss=0:d=0.3,afade=t=out:st=" + (parseFloat(cut.dur) - 0.5) + ":d=0.5",
      "-b:a", "192k",
      cutPath
    ]);
    console.log(`Cut ready: ${cut.name} (${cut.dur}s from ${cut.start})`);
  } catch (e) {
    console.error(`Error cutting ${cut.name}:`, e.message);
  }
}
