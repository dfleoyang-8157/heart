
// Web Audio API Context
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const ensureContext = () => {
  if (typeof window !== 'undefined' && !audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        // Increased volume from 0.3 to 0.6 for better audibility
        masterGain.gain.value = 0.6;
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(err => console.warn("Audio Context resume failed", err));
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol: number = 0.5) => {
  if (!audioCtx || !masterGain) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.connect(masterGain);
  osc.connect(gain);

  // Softer Envelope (Adsr-like but simpler)
  // Start at 0 to avoid clicking
  gain.gain.setValueAtTime(0, startTime);
  // Slower attack for a "breathing" gentle feel
  gain.gain.linearRampToValueAtTime(vol, startTime + (duration * 0.15)); 
  // Long exponential decay
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

// 1. Soft Click (Water drop style - Clean Sine)
export const playSoftClick = () => {
  ensureContext();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  // High pitch, very fast decay = Water drop
  playTone(800, 'sine', 0.1, now, 0.2);
};

// 2. Message Sent (Gentle ascending intervals)
export const playMessageSent = () => {
  ensureContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  // Soft major 3rd interval
  playTone(440, 'sine', 0.3, now, 0.3); // A4
  playTone(554.37, 'sine', 0.4, now + 0.1, 0.25); // C#5
};

// 3. Message Received (Warm Major 7th Chord)
export const playMessageReceived = () => {
  ensureContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  // F Major 7 (F - A - C - E) - Very warm and therapeutic
  // Staggered entry (arpeggiated chord)
  playTone(174.61, 'sine', 2.0, now, 0.3); // F3
  playTone(220.00, 'sine', 2.0, now + 0.05, 0.25); // A3
  playTone(261.63, 'sine', 2.0, now + 0.1, 0.25); // C4
  playTone(329.63, 'sine', 2.0, now + 0.15, 0.2); // E4
};

// 4. Story Unlock (Ethereal Wind Chimes)
export const playStoryUnlock = () => {
  ensureContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  
  // Pentatonic scale run (C D E G A) - Dreamy
  const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; 
  
  freqs.forEach((f, i) => {
    // Overlapping tones with varying volumes
    playTone(f, 'sine', 1.5, now + (i * 0.12), 0.15);
  });
};

// 5. Notification (Soft Bell)
export const playNotification = () => {
  ensureContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  // Fundamental + Harmonic
  playTone(880, 'sine', 1.2, now, 0.3);
  playTone(1760, 'sine', 0.8, now, 0.05); // Sparkle
};
