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

    const vol = isSprinting ? 0.18 : 0.10;
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

    // Muted mechanical toggle click — short filtered noise snap
    const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.006));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.setValueAtTime(1.2, t);

    // Subtle low metallic thud underneath
    const thud = this.ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, t);
    thud.frequency.exponentialRampToValueAtTime(45, t + 0.04);
    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.06, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(t);
    thud.stop(t + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.04);
  }

  playDoor(isOpen = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Heavy metallic door mechanism — low filtered thud + creaking noise
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isOpen ? 80 : 110, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);

    // Metallic scrape/creak overlay
    const bufSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.sin(Math.PI * i / bufSize);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const creakFilter = this.ctx.createBiquadFilter();
    creakFilter.type = 'bandpass';
    creakFilter.frequency.setValueAtTime(isOpen ? 350 : 240, t);
    creakFilter.Q.setValueAtTime(3, t);

    const creakGain = this.ctx.createGain();
    creakGain.gain.setValueAtTime(0.06, t);
    creakGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    src.connect(creakFilter);
    creakFilter.connect(creakGain);
    creakGain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.45);
  }

  playTerminalBeep(freq = 880) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Muted low-frequency terminal confirmation — soft sine pulse with decay
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(Math.min(freq * 0.22, 200), t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);

    // Tiny static pop for that old-tech feel
    const popBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
    const popData = popBuf.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
      popData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.004));
    }
    const popSrc = this.ctx.createBufferSource();
    popSrc.buffer = popBuf;
    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.025, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    popSrc.connect(popGain);
    popGain.connect(this.sfxGain);
    popSrc.start(t);
    popSrc.stop(t + 0.02);
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
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
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

    // Subtle dark pickup — muffled metallic clink with low resonance
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // Soft secondary ring (muted metallic overtone)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(560, t + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.03, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.02);
    osc2.stop(t + 0.18);
  }

  playInteractFocus() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Whisper-quiet filtered noise tick — like brushing metal in the dark
    const bufSize = Math.floor(this.ctx.sampleRate * 0.025);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.005));
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 0.025);
  }

  playElectricBuzz() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Realistic soft spark crackle (filtered noise snap, no annoying tonal beep)
    const bufSize = Math.floor(this.ctx.sampleRate * 0.05);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.012));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, t); // Very soft, realistic spark snap
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
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

    // Dark muted notification — low eerie bell tone with subtle dissonance
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, t); // G3 — dark register
    osc.frequency.exponentialRampToValueAtTime(165, t + 0.5); // E3 subtle pitch drop

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.55);

    // Ghost overtone (subtle dissonant tritone shimmer)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(277.2, t); // C#4 tritone against G3
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.02, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.03);
    osc2.stop(t + 0.4);
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

  /** Alert warning — eerie low alarm pulse (dark siren) */
  playCutsceneAlert() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Deep ominous alarm pulse — low sine with slow pulse modulation
    for (let i = 0; i < 3; i++) {
      const offset = i * 0.4;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t + offset);
      osc.frequency.exponentialRampToValueAtTime(65, t + offset + 0.32);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t + offset);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.35);
    }

    // Noise hiss undertone (old speaker crackle)
    const bufSize = Math.floor(this.ctx.sampleRate * 1.0);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(300, t);
    nFilter.Q.setValueAtTime(3, t);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.03, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    src.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + 1.0);
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

  /** Start looping terrifying psychological horror soundtrack engine */
  startHorrorMusic() {
    if (!this.ctx || this.horrorMusicActive) return;
    this.horrorMusicActive = true;
    this.horrorTimeouts = this.horrorTimeouts || [];
    const t = this.ctx.currentTime;

    // Layer 1: Deep Subterranean Abyss Drone (43.6Hz F1 + 61.7Hz B1 demonic tritone)
    const drone1 = this.ctx.createOscillator();
    drone1.type = 'sawtooth';
    drone1.frequency.setValueAtTime(43.65, t); // F1
    const drone2 = this.ctx.createOscillator();
    drone2.type = 'sawtooth';
    drone2.frequency.setValueAtTime(61.74, t); // B1 (diabolus in musica)

    // Slow organic pitch detuning
    const droneLfo = this.ctx.createOscillator();
    droneLfo.frequency.setValueAtTime(0.06, t);
    const droneLfoGain = this.ctx.createGain();
    droneLfoGain.gain.setValueAtTime(2.2, t);
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(drone2.frequency);
    droneLfo.start(t);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(110, t);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.12, t);

    drone1.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone1.start(t);
    drone2.start(t);

    // Layer 2: Ghostly Choir Vocal Formant Hum (Lost Souls in the Concrete)
    const choirOsc = this.ctx.createOscillator();
    choirOsc.type = 'sawtooth';
    choirOsc.frequency.setValueAtTime(82.41, t); // E2
    const choirVibrato = this.ctx.createOscillator();
    choirVibrato.frequency.setValueAtTime(4.2, t);
    const choirVibGain = this.ctx.createGain();
    choirVibGain.gain.setValueAtTime(1.8, t);
    choirVibrato.connect(choirVibGain);
    choirVibGain.connect(choirOsc.frequency);
    choirVibrato.start(t);

    const choirFormant1 = this.ctx.createBiquadFilter();
    choirFormant1.type = 'bandpass';
    choirFormant1.frequency.setValueAtTime(380, t); // Vocal 'Ooo' formant
    choirFormant1.Q.setValueAtTime(4.5, t);

    const choirGain = this.ctx.createGain();
    choirGain.gain.setValueAtTime(0.045, t);

    choirOsc.connect(choirFormant1);
    choirFormant1.connect(choirGain);
    choirGain.connect(this.musicGain);
    choirOsc.start(t);

    // Layer 3: Freezing Tunnel Draft Wind with Spectral Shimmer
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
    windFilter.frequency.setValueAtTime(260, t);
    windFilter.Q.setValueAtTime(2.8, t);

    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.04, t);
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.setValueAtTime(140, t);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start(t);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.055, t);
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.musicGain);
    windSrc.start(t);

    // Layer 4: Infrasound Horror Throb (24Hz Subconscious Anxiety Thump)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(24, t);
    const subLfo = this.ctx.createOscillator();
    subLfo.frequency.setValueAtTime(0.42, t);
    const subLfoGain = this.ctx.createGain();
    subLfoGain.gain.setValueAtTime(0.08, t);
    subLfo.connect(subLfoGain);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.08, t);
    subLfoGain.connect(subGain.gain);
    subOsc.connect(subGain);
    subGain.connect(this.musicGain);
    subOsc.start(t);
    subLfo.start(t);

    this.horrorNodes = [
      drone1, drone2, droneLfo, droneVibGain => droneLfoGain,
      choirOsc, choirVibrato, windSrc, windLfo, subOsc, subLfo
    ];

    // ── 5. GENERATIVE TERROR MELODY: HAUNTING DETUNED MUSIC BOX & CLUSTERS ──
    // The broken antique music box melody that plays out-of-tune notes down the halls
    const creepyMelody = [
      622.25, 587.33, 739.99, 659.25, 466.16, 523.25, 415.30, 311.13,
      440.00, 369.99, 493.88, 329.63, 554.37, 415.30, 277.18
    ];
    let noteIdx = 0;

    const scheduleNextChime = () => {
      if (!this.horrorMusicActive) return;
      const note = creepyMelody[noteIdx % creepyMelody.length];
      noteIdx++;
      this.playCreepyChime(note);

      // Random spacing between notes (2.4s to 5.2s) like an old broken spring mechanism
      const delay = 2400 + Math.random() * 2800;
      const timer = setTimeout(scheduleNextChime, delay);
      this.horrorTimeouts.push(timer);
    };

    const scheduleNextDeepImpact = () => {
      if (!this.horrorMusicActive) return;
      if (Math.random() < 0.55) {
        this.playHorrorPianoChord();
      } else {
        this.playWaterphoneScrape();
      }
      const delay = 18000 + Math.random() * 16000;
      const timer = setTimeout(scheduleNextDeepImpact, delay);
      this.horrorTimeouts.push(timer);
    };

    // Begin generative nightmare sequences after subtle introductory breath
    const startChimeTimer = setTimeout(scheduleNextChime, 1800);
    const startImpactTimer = setTimeout(scheduleNextDeepImpact, 8000);
    this.horrorTimeouts.push(startChimeTimer, startImpactTimer);
  }

  /** Plays an out-of-tune, antique music box note echoing down dark corridors */
  playCreepyChime(freq = 622.25) {
    if (!this.ctx || !this.horrorMusicActive) return;
    const t = this.ctx.currentTime;
    const dur = 2.6;

    // Primary music-box tine
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    // Slight detune for that eerie abandoned antique feel
    const microDetune = (Math.random() - 0.5) * 4.5;
    osc1.frequency.setValueAtTime(freq + microDetune, t);

    // Metallic bell overtone
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.76, t);

    // Tape wow and flutter pitch drift (analog distortion)
    const flutter = this.ctx.createOscillator();
    flutter.frequency.setValueAtTime(1.2 + Math.random() * 0.8, t);
    const flutterGain = this.ctx.createGain();
    flutterGain.gain.setValueAtTime(3.8, t);
    flutter.connect(flutterGain);
    flutterGain.connect(osc1.frequency);
    flutter.start(t);
    flutter.stop(t + dur);

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.045, t);
    gain1.gain.exponentialRampToValueAtTime(0.0004, t + dur);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.018, t);
    gain2.gain.exponentialRampToValueAtTime(0.0004, t + dur * 0.7);

    osc1.connect(gain1);
    gain1.connect(this.musicGain);
    osc2.connect(gain2);
    gain2.connect(this.musicGain);

    osc1.start(t);
    osc1.stop(t + dur);
    osc2.start(t);
    osc2.stop(t + dur * 0.7);
  }

  /** Distant ominous low piano cluster chord */
  playHorrorPianoChord() {
    if (!this.ctx || !this.horrorMusicActive) return;
    const t = this.ctx.currentTime;
    const dur = 4.2;
    // Discordant horror tritone cluster (C2, F#2, G2, C#3)
    const cluster = [65.41, 92.50, 98.00, 138.59];

    cluster.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.992, t + dur);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0004, t + dur);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + dur);
    });
  }

  /** Bowed waterphone / screeching cello glissando */
  playWaterphoneScrape() {
    if (!this.ctx || !this.horrorMusicActive) return;
    const t = this.ctx.currentTime;
    const dur = 3.4;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(280 + Math.random() * 320, t + dur);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.Q.setValueAtTime(4.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.038, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0004, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur);
  }

  /** Stop horror ambient music */
  stopHorrorMusic() {
    if (!this.horrorMusicActive) return;
    this.horrorMusicActive = false;
    if (this.horrorTimeouts) {
      this.horrorTimeouts.forEach(t => clearTimeout(t));
      this.horrorTimeouts = [];
    }
    if (this.horrorNodes) {
      this.horrorNodes.forEach(n => {
        try { n.stop(); } catch(e) { /* already stopped */ }
      });
      this.horrorNodes = [];
    }
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

  /** Electronic glitch / radio interference crackle (realistic static, no tonal square wave beeps) */
  playElectricGlitch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = 0.12;

    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.4 ? 1 : 0);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
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
