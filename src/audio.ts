// Web Audio API Synthesizer for lag-free retro-modern sound effects

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Lazy initialize to bypass browser autoplay policies
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const setMutedState = (muted: boolean) => {
  isMuted = muted;
};

export const getMutedState = () => isMuted;

// Play a cute, short bubbly pluck sound on tap
export const playTapSound = (frequencyMultiplier: number = 1) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Play around C5 - E5 range
  const baseFreq = 440 * (1 + (frequencyMultiplier - 1) * 0.1);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  // Pitch slide down for a bubbly pluck feel
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.start();
  osc.stop(ctx.currentTime + 0.15);
};

// Play a sparkling, high-pitched crystal bell sound on Critical Tap
export const playCritSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
  osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15); // E6

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1975.53, ctx.currentTime); // B6

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.25);
  osc2.stop(ctx.currentTime + 0.25);
};

// Play a delightful ascending chiptune scale when buying an upgrade
export const playUpgradeSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  const duration = 0.08;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * duration);

    gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * duration);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx + 1) * duration);

    osc.start(ctx.currentTime + idx * duration);
    osc.stop(ctx.currentTime + (idx + 1) * duration + 0.05);
  });
};

// Play a magical arpeggio when unlocking/claiming a pack or a legendary skin
export const playClaimSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // C major 7th chord arpeggio
  const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77];
  const duration = 0.06;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * duration);

    gain.gain.setValueAtTime(0.07, ctx.currentTime + idx * duration);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx + 1) * duration + 0.1);

    osc.start(ctx.currentTime + idx * duration);
    osc.stop(ctx.currentTime + (idx + 1) * duration + 0.15);
  });
};

// Play a futuristic energetic siren sound when Fever Mode starts
export const playFeverSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
  osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.5);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);
};

// Play a sharp glittering chime for the Golden Spawn
export const playGoldenSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
};
