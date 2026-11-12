export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.initialized = false;

    this.masterVolume = 0.85;
    this.sfxVolume = 0.85;
    this.musicVolume = 0.65;

    this.ambientOsc = null;
    this.ambientGain = null;
    this.humGain = null;
    this.alarmInterval = null;

    this.lastCreakTime = 0;

    // Horror ambient music nodes
    this.horrorMusicActive = false;
    this.horrorNodes = [];
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbience();
    } catch (e) {
      console.warn('AudioContext init blocked or failed:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
  }

  startAmbience() {
    if (!this.ctx || this.ambientOsc) return;

    // Deep sub-drone at 47.3 Hz
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.setValueAtTime(47.3, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(85, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.musicGain);
    this.ambientOsc.start();

    // Secondary subtle ventilation noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(240, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(this.humGain);
    this.humGain.connect(this.musicGain);
    whiteNoise.start();
  }

  playFootstep(isSprinting = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 65 + Math.random() * 30;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(18, t + 0.12);

    const vol = isSprinting ? 0.38 : 0.22;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playFlashlightClick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.035);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  playDoor(isOpen = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isOpen ? 130 : 190, t);
    osc.frequency.exponentialRampToValueAtTime(isOpen ? 260 : 35, t + 0.45);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  playTerminalBeep(freq = 880) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playRadioStatic(duration = 1.0) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start();
  }

  playJumpscare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. Massive Sub-Bass Impact Boom (chest-thumping low-end slam)
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(22, t + 0.55);
    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.9);

    // 2. Horrific Screeching Discordant Stinger
    const freqs = [311.1, 329.6, 440.0, 466.1, 622.2, 880.0, 1174.6];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f * 0.7, t);
      osc.frequency.exponentialRampToValueAtTime(f * 2.8, t + 0.35);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.85);
    });

    // 3. Harsh Guttural Noise Screamer Burst
    const noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.7, this.ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    // 4. Follow-up panic heartbeats
    setTimeout(() => {
      this.playHeartbeat();
      setTimeout(() => this.playHeartbeat(), 320);
      setTimeout(() => this.playHeartbeat(), 680);
    }, 450);
  }

  playHeartbeat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const beat = (timeOffset, f, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(25, t + timeOffset + dur);

      gain.gain.setValueAtTime(0.42, t + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + timeOffset + dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + timeOffset);
      osc.stop(t + timeOffset + dur);
    };

    beat(0, 75, 0.12);
    beat(0.18, 65, 0.14);
  }

  playItemPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, t + 0.18); // C6

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playInteractFocus() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, t);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.025);
  }

  playElectricBuzz() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t); // 120 Hz mains hum buzz
    osc.frequency.setValueAtTime(240, t + 0.08);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playPipeCreak() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.8);
    osc.frequency.linearRampToValueAtTime(70, t + 1.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.8);
  }

  playNotification() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.08); // A5

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // ─── CUTSCENE SOUND EFFECTS ──────────────────────────────────────

  /** Single typewriter key click */
  playCutsceneKeystroke() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const freq = 3200 + Math.random() * 1800;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.015);

    gain.gain.setValueAtTime(0.04 + Math.random() * 0.02, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  /** Classified stamp — sharp impact with reverb decay */
  playCutsceneStamp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Impact thud
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g1.gain.setValueAtTime(0.5, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(g1);
    g1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // High frequency crack
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(2200, t);
    osc2.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    g2.gain.setValueAtTime(0.2, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc2.connect(g2);
    g2.connect(this.sfxGain);
    osc2.start(t);
    osc2.stop(t + 0.08);
  }

  /** Alert warning — two-tone klaxon beep */
  playCutsceneAlert() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const offset = i * 0.3;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, t + offset);
      osc.frequency.setValueAtTime(660, t + offset + 0.12);
      gain.gain.setValueAtTime(0.15, t + offset);
      gain.gain.setValueAtTime(0.12, t + offset + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.25);
    }
  }

  /** Radio static burst — grainy noise with bandpass */
  playCutsceneRadioStatic(duration = 2.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Modulated static — intermittent crackle
    for (let i = 0; i < bufferSize; i++) {
      const mod = Math.sin(i / this.ctx.sampleRate * 6.28 * 3.5) * 0.4 + 0.6;
      output[i] = (Math.random() * 2 - 1) * mod;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.setValueAtTime(0.18, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  }

  /** Deep ominous drone — rising low frequency */
  playCutsceneDrone(duration = 5.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(35, t);
    osc.frequency.linearRampToValueAtTime(55, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + duration * 0.3);
    gain.gain.setValueAtTime(0.22, t + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  /** Slide transition — soft low whoosh */
  playCutsceneTransition() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Filtered noise whoosh
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.4);
  }

  /** Creepy whisper — dissonant chord with tremolo */
  playCutsceneWhisper(duration = 3.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Dissonant tritone chord played very softly
    const freqs = [185, 261.6, 277.2];
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      // LFO tremolo
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4 + Math.random() * 3, t);
      lfoGain.gain.setValueAtTime(0.04, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.5);
      gain.gain.setValueAtTime(0.07, t + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + duration);
    });

    // Add breathy noise
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(600, t);
    nFilter.Q.setValueAtTime(8, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0, t);
    nGain.gain.linearRampToValueAtTime(0.04, t + 0.8);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.musicGain);
    src.start(t);
    src.stop(t + duration);
  }

  /** Title card reveal — cinematic boom + shimmer */
  playCutsceneTitleReveal() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Deep boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, t);
    boom.frequency.exponentialRampToValueAtTime(25, t + 1.2);
    boomGain.gain.setValueAtTime(0.5, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(t);
    boom.stop(t + 1.5);

    // Metallic shimmer
    const shimmerFreqs = [1174.66, 1567.98, 2093]; // D6, G6, C7
    shimmerFreqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + 0.05 * i);
      gain.gain.setValueAtTime(0.06, t + 0.05 * i);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + 0.05 * i);
      osc.stop(t + 2.5);
    });

    // Noise crash impact
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.2, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.6);
  }

  /** Dossier page flip — paper rustle */
  playCutscenePageFlip() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin(Math.PI * i / bufferSize);
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.25);
  }

  /** Elevator mechanical descent — grinding low rumble */
  playCutsceneElevator(duration = 4.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Mechanical rumble
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(45, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);

    // Vibrato for grinding feel
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(12, t);
    lfoGain.gain.setValueAtTime(8, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.5);
    gain.gain.setValueAtTime(0.15, t + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);

    // Metal chain rattle (high frequency clicks)
    const rattleSize = Math.floor(this.ctx.sampleRate * duration);
    const rattleBuf = this.ctx.createBuffer(1, rattleSize, this.ctx.sampleRate);
    const rOut = rattleBuf.getChannelData(0);
    for (let i = 0; i < rattleSize; i++) {
      rOut[i] = Math.random() < 0.02 ? (Math.random() * 2 - 1) : 0;
    }
    const rattleSrc = this.ctx.createBufferSource();
    rattleSrc.buffer = rattleBuf;
    const rFilter = this.ctx.createBiquadFilter();
    rFilter.type = 'bandpass';
    rFilter.frequency.setValueAtTime(3500, t);
    rFilter.Q.setValueAtTime(1, t);
    const rGain = this.ctx.createGain();
    rGain.gain.setValueAtTime(0.06, t);
    rGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    rattleSrc.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(this.sfxGain);
    rattleSrc.start(t);
    rattleSrc.stop(t + duration);
  }

  // ─── HORROR AMBIENT MUSIC & ENVIRONMENTAL SFX ─────────────────────

  /** Start looping horror ambient music layers */
  startHorrorMusic() {
    if (!this.ctx || this.horrorMusicActive) return;
    this.horrorMusicActive = true;
    const t = this.ctx.currentTime;

    // Layer 1: Deep minor drone pad (D2 ~73Hz + Ab2 ~104Hz tritone)
    const drone1 = this.ctx.createOscillator();
    drone1.type = 'sawtooth';
    drone1.frequency.setValueAtTime(73.42, t);
    const drone2 = this.ctx.createOscillator();
    drone2.type = 'sawtooth';
    drone2.frequency.setValueAtTime(103.83, t); // tritone dissonance
    // Slow detune LFO
    const droneLfo = this.ctx.createOscillator();
    droneLfo.frequency.setValueAtTime(0.08, t);
    const droneLfoGain = this.ctx.createGain();
    droneLfoGain.gain.setValueAtTime(2.5, t);
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(drone2.frequency);
    droneLfo.start(t);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(150, t);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.10, t);

    drone1.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone1.start(t);
    drone2.start(t);

    // Layer 2: Evolving dissonant chord (minor 2nd intervals, LFO modulated)
    const chord1 = this.ctx.createOscillator();
    chord1.type = 'sine';
    chord1.frequency.setValueAtTime(146.83, t); // D3
    const chord2 = this.ctx.createOscillator();
    chord2.type = 'sine';
    chord2.frequency.setValueAtTime(155.56, t); // Eb3 - minor 2nd
    const chordLfo = this.ctx.createOscillator();
    chordLfo.frequency.setValueAtTime(0.15, t);
    const chordLfoGain = this.ctx.createGain();
    chordLfoGain.gain.setValueAtTime(3, t);
    chordLfo.connect(chordLfoGain);
    chordLfoGain.connect(chord1.frequency);
    chordLfo.start(t);

    const chordGain = this.ctx.createGain();
    chordGain.gain.setValueAtTime(0.04, t);
    chord1.connect(chordGain);
    chord2.connect(chordGain);
    chordGain.connect(this.musicGain);
    chord1.start(t);
    chord2.start(t);

    // Layer 3: Filtered wind/breath noise with slow sweep
    const windBufSize = this.ctx.sampleRate * 4;
    const windBuf = this.ctx.createBuffer(1, windBufSize, this.ctx.sampleRate);
    const windData = windBuf.getChannelData(0);
    for (let i = 0; i < windBufSize; i++) {
      windData[i] = Math.random() * 2 - 1;
    }
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = windBuf;
    windSrc.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(300, t);
    windFilter.Q.setValueAtTime(3, t);

    // Sweep filter with LFO
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.05, t);
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.setValueAtTime(150, t);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start(t);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.06, t);
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.musicGain);
    windSrc.start(t);

    // Layer 4: Very low sub-bass pulse (heartbeat-like infrasound throb)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(28, t);
    const subLfo = this.ctx.createOscillator();
    subLfo.frequency.setValueAtTime(0.35, t); // slow sinister pulse
    const subLfoGain = this.ctx.createGain();
    subLfoGain.gain.setValueAtTime(0.09, t);
    subLfo.connect(subLfoGain);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.09, t);
    subLfoGain.connect(subGain.gain);
    subOsc.connect(subGain);
    subGain.connect(this.musicGain);
    subOsc.start(t);
    subLfo.start(t);

    // Layer 5: Haunting high tension pitch (tinnitus of the void: 2960Hz & 3120Hz tritone beat)
    const eerieHigh1 = this.ctx.createOscillator();
    eerieHigh1.type = 'sine';
    eerieHigh1.frequency.setValueAtTime(2960, t);
    const eerieHigh2 = this.ctx.createOscillator();
    eerieHigh2.type = 'sine';
    eerieHigh2.frequency.setValueAtTime(3120, t); // Binaural dissonance
    const highGain = this.ctx.createGain();
    highGain.gain.setValueAtTime(0.015, t);
    eerieHigh1.connect(highGain);
    eerieHigh2.connect(highGain);
    highGain.connect(this.musicGain);
    eerieHigh1.start(t);
    eerieHigh2.start(t);

    this.horrorNodes = [drone1, drone2, droneLfo, chord1, chord2, chordLfo, windSrc, windLfo, subOsc, subLfo, eerieHigh1, eerieHigh2];
  }

  /** Stop horror ambient music */
  stopHorrorMusic() {
    if (!this.horrorMusicActive) return;
    this.horrorMusicActive = false;
    this.horrorNodes.forEach(n => {
      try { n.stop(); } catch(e) { /* already stopped */ }
    });
    this.horrorNodes = [];
  }

  // ─── RANDOM ENVIRONMENTAL HORROR SFX ──────────────────────────────

  /** Distant metallic bang/impact */
  playDistantBang() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25 + Math.random() * 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.2);

    // High-freq metallic clang overlay
    const clang = this.ctx.createOscillator();
    clang.type = 'triangle';
    clang.frequency.setValueAtTime(800 + Math.random() * 600, t);
    clang.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    const clangGain = this.ctx.createGain();
    clangGain.gain.setValueAtTime(0.08, t);
    clangGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    clang.connect(clangGain);
    clangGain.connect(this.sfxGain);
    clang.start(t);
    clang.stop(t + 0.5);
  }

  /** Water dripping sound */
  playWaterDrip() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const numDrops = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numDrops; i++) {
      const offset = i * (0.3 + Math.random() * 0.4);
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      const freq = 2800 + Math.random() * 1200;
      osc.frequency.setValueAtTime(freq, t + offset);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + offset + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06 + Math.random() * 0.03, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.12);
    }
  }

  /** Creepy environmental whisper */
  playCreepyWhisper() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.5 + Math.random() * 2;

    // Breathy filtered noise with formant-like bands
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.sin(Math.PI * i / bufSize);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    // Formant filter for "voice" quality
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(500 + Math.random() * 400, t);
    formant.Q.setValueAtTime(6 + Math.random() * 4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.3);
    gain.gain.setValueAtTime(0.04, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(formant);
    formant.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);

    // Dissonant tone underneath
    const tone = this.ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(185 + Math.random() * 80, t);
    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0, t);
    toneGain.gain.linearRampToValueAtTime(0.02, t + 0.5);
    toneGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    tone.connect(toneGain);
    toneGain.connect(this.sfxGain);
    tone.start(t);
    tone.stop(t + duration);
  }

  /** Distant scream / wailing */
  playDistantScream() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.0 + Math.random() * 1.5;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300 + Math.random() * 200, t);
    osc.frequency.linearRampToValueAtTime(800 + Math.random() * 400, t + duration * 0.3);
    osc.frequency.linearRampToValueAtTime(200, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(5, t);

    const distortion = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.tanh(x * 2);
    }
    distortion.curve = curve;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  /** Wind howling through corridors */
  playWindHowl() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 3.0 + Math.random() * 4;

    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.linearRampToValueAtTime(600, t + duration * 0.4);
    filter.frequency.linearRampToValueAtTime(150, t + duration);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + duration * 0.2);
    gain.gain.setValueAtTime(0.06, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  }

  /** Metal structure groaning */
  playMetalGroan() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.5 + Math.random() * 2;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const baseFreq = 40 + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.8, t + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, t);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  /** Electronic glitch / interference */
  playElectricGlitch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const numGlitches = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numGlitches; i++) {
      const offset = i * (0.04 + Math.random() * 0.06);
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200 + Math.random() * 3000, t + offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06 + Math.random() * 0.04, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.03 + Math.random() * 0.02);
    }
  }

  /** Door slam / sudden bang */
  playDoorSlam() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sharp impact
    const impact = this.ctx.createOscillator();
    impact.type = 'sine';
    impact.frequency.setValueAtTime(120, t);
    impact.frequency.exponentialRampToValueAtTime(25, t + 0.3);
    const impactGain = this.ctx.createGain();
    impactGain.gain.setValueAtTime(0.35, t);
    impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    impact.connect(impactGain);
    impactGain.connect(this.sfxGain);
    impact.start(t);
    impact.stop(t + 0.5);

    // Resonant wood/metal decay
    const res = this.ctx.createOscillator();
    res.type = 'sawtooth';
    res.frequency.setValueAtTime(250, t);
    res.frequency.exponentialRampToValueAtTime(60, t + 0.6);
    const resFilter = this.ctx.createBiquadFilter();
    resFilter.type = 'lowpass';
    resFilter.frequency.setValueAtTime(400, t);
    const resGain = this.ctx.createGain();
    resGain.gain.setValueAtTime(0.12, t);
    resGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    res.connect(resFilter);
    resFilter.connect(resGain);
    resGain.connect(this.sfxGain);
    res.start(t);
    res.stop(t + 0.8);
  }

  /** Tension stinger — sudden dissonant chord for scare moments */
  playTensionStinger() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const freqs = [185, 196, 277.2, 370, 466.2]; // cluster dissonance
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f * 0.9, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 1.2);
    });

    // Impact noise burst
    const bufSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.3);
  }

  /** Breathing / wheezing sound */
  playBreathing() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 3.0 + Math.random() * 2;
    const breathRate = 0.35; // ~1 breath per 2.8s

    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      // Breathing rhythm via amplitude modulation
      const breathEnv = Math.abs(Math.sin(2 * Math.PI * breathRate * i / this.ctx.sampleRate));
      data[i] = (Math.random() * 2 - 1) * breathEnv;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.Q.setValueAtTime(5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.5);
    gain.gain.setValueAtTime(0.04, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  }

  /** Play a random horror ambient SFX. Returns the name of the SFX played. */
  playRandomHorrorSFX() {
    const sfxList = [
      'distantBang', 'waterDrip', 'creepyWhisper', 'metalGroan',
      'windHowl', 'electricGlitch', 'doorSlam', 'distantScream', 'breathing'
    ];
    const pick = sfxList[Math.floor(Math.random() * sfxList.length)];
    switch (pick) {
      case 'distantBang': this.playDistantBang(); break;
      case 'waterDrip': this.playWaterDrip(); break;
      case 'creepyWhisper': this.playCreepyWhisper(); break;
      case 'metalGroan': this.playMetalGroan(); break;
      case 'windHowl': this.playWindHowl(); break;
      case 'electricGlitch': this.playElectricGlitch(); break;
      case 'doorSlam': this.playDoorSlam(); break;
      case 'distantScream': this.playDistantScream(); break;
      case 'breathing': this.playBreathing(); break;
    }
    return pick;
  }
}
