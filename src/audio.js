// Procedural Web Audio Engine for Paws & Play: 3D Pet Daycare

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
    this.chordIndex = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.startBgmLoop();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ====================================================
  // COZY BACKGROUND CHORD LOOP (Marimba & Warm Bell Chords)
  // ====================================================
  startBgmLoop() {
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;

    // Cozy Daycare Chord Progressions (C - G - Am - F) in pentatonic tuning
    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C Major (C4, E4, G4, C5)
      [196.00, 246.94, 293.66, 392.00], // G Major (G3, B3, D4, G4)
      [220.00, 261.63, 329.63, 440.00], // A Minor (A3, C4, E4, A4)
      [174.61, 220.00, 261.63, 349.23]  // F Major (F3, A3, C4, F4)
    ];

    const playStep = () => {
      if (!this.ctx || !this.isBgmPlaying) return;
      const currentChord = chords[this.chordIndex];
      this.chordIndex = (this.chordIndex + 1) % chords.length;

      const now = this.ctx.currentTime;
      currentChord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.16);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, now);

        gain.gain.setValueAtTime(0.001, now + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.06, now + i * 0.16 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.16 + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 1.25);
      });

      // Occasional sweet outdoor bird chirp
      if (Math.random() < 0.35) {
        setTimeout(() => this.playBirdChirp(), 800 + Math.random() * 800);
      }

      this.bgmTimer = setTimeout(playStep, 2100);
    };

    playStep();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }

  // ====================================================
  // PROCEDURAL SOUND EFFECTS
  // ====================================================

  // Reception Desk Service Bell
  playBell() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [1760, 2637].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.85);
    });
  }

  // Dog Joyful Bark
  playBark() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.setValueAtTime(2.5, now);

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Cat Meow
  playMeow() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);

    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(510, now + 0.38);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // Cat Purr
  playPurr() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);

    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(20, now);

    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.62);
    osc.stop(now + 0.62);
  }

  // Bunny Sniff / Squeak
  playSqueak() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.15);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Guinea Pig Joyful Wheek ("WHEEK! WHEEK!")
  playWheek() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    [0, 0.16].forEach(delay => {
      const t = now + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(2600, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2200, t + 0.14);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // Capybara Contented Chirp / Whistle-Purr
  playCapybaraChirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(560, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Zen Singing Bowl / Hot Spa Chime
  playZenChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [528, 1056].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  // Food Munching / Crunch
  playMunch() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(240 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  // Water Drinking / Lap
  playDrink() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.05);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  // Bath Splash & Soap Bubbles
  playSplash() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Splash noise burst
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // Bubble pops
    [800, 1200, 1600].forEach((freq, idx) => {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      const bt = now + 0.06 + idx * 0.06;
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(freq, bt);
      bOsc.frequency.exponentialRampToValueAtTime(freq * 1.6, bt + 0.04);
      bGain.gain.setValueAtTime(0.1, bt);
      bGain.gain.exponentialRampToValueAtTime(0.001, bt + 0.05);

      bOsc.connect(bGain);
      bGain.connect(this.sfxGain);
      bOsc.start(bt);
      bOsc.stop(bt + 0.06);
    });
  }

  // Ball Throw & Bounce
  playBounce() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Petting Snuggle Chime
  playSnuggle() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  // Coins / Cash Register Clink
  playCoin() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  // 5-Star Victory Fanfare
  playFanfare() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.11;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const dur = idx === notes.length - 1 ? 0.7 : 0.22;
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  }

  // Outdoor Songbird Chirp
  playBirdChirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(3400 + Math.random() * 400, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(2900, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Fresh Water Pouring
  playWaterPour() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  // Squeaky Rubber Toy
  playSqueakToy() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(2300, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.16);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Supply Cabin Restock Chime & Wooden Crate Resonator
  playRestockChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Subtle wooden crate slide / open click
    const crateOsc = this.ctx.createOscillator();
    const crateGain = this.ctx.createGain();
    crateOsc.type = 'triangle';
    crateOsc.frequency.setValueAtTime(140, now);
    crateOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    crateGain.gain.setValueAtTime(0.2, now);
    crateGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    crateOsc.connect(crateGain);
    crateGain.connect(this.sfxGain);
    crateOsc.start(now);
    crateOsc.stop(now + 0.1);

    // 2. Uplifting Ascending Restock Arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }
}

