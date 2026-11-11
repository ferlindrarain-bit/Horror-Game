/**
 * IntroCutscene — Cinematic opening sequence for THE LAST SIGNAL: REALITY ERROR
 *
 * Story premise:
 *   Year 2049. After a global cataclysm known as "The Collapse", the government
 *   established underground monitoring sectors to study residual electromagnetic
 *   anomalies. Sector 09 went dark 3 weeks ago. You are a replacement operator
 *   dispatched to restore contact and resume surveillance operations.
 *   Nobody told you what happened to the previous operator.
 */
export class IntroCutscene {
  constructor(audioManager) {
    this.audio = audioManager;
    this.onComplete = null;
    this.abortController = null;
    this._createDOM();
  }

  // ─── SLIDE DATA ────────────────────────────────────────────────────
  _getSlides() {
    return [
      // ─ ACT 1: CONTEXT ──────────────────────────
      {
        type: 'classified',
        header: 'CLASSIFIED // EYES ONLY',
        lines: [
          'DOCUMENT REF: GOV-SECTOR-09/BRIEF/2049-12-03',
          'CLASSIFICATION: ULTRAVIOLET — COMPARTMENTED',
          'RECIPIENT: EMERGENCY MONITORING DIVISION',
        ],
        duration: 4000,
      },
      {
        type: 'narration',
        lines: [
          'Tahun 2049.',
          'Sebuah bencana elektromagnetik global yang dikenal sebagai',
          '"The Collapse" menghancurkan 70% infrastruktur komunikasi dunia.',
        ],
        duration: 7000,
      },
      {
        type: 'narration',
        lines: [
          'Pemerintah membangun jaringan bunker bawah tanah—',
          'Sektor-sektor pemantauan untuk meneliti anomali frekuensi',
          'yang tersisa setelah kehancuran.',
        ],
        duration: 6500,
      },
      {
        type: 'narration',
        lines: [
          'Sektor 09 adalah fasilitas riset paling rahasia.',
          'Berlokasi 200 meter di bawah permukaan,',
          'dengan satu-satunya akses: elevator darurat terkunci.',
        ],
        duration: 6500,
      },

      // ─ ACT 2: INCIDENT ─────────────────────────
      {
        type: 'alert',
        lines: [
          '⚠ PERINGATAN: KEHILANGAN KONTAK',
          '',
          'Sektor 09 berhenti mengirim laporan 3 minggu yang lalu.',
          'Transmisi radio terakhir yang tercatat:',
        ],
        duration: 5500,
      },
      {
        type: 'radio_transcript',
        sender: 'OPERATOR SEBELUMNYA',
        freq: '47.3 MHz',
        lines: [
          '"...ini Sektor 09, seseorang... atau sesuatu...',
          'ada di dalam fasilitas bersama saya...',
          'sinyal 47.3 Hz tidak berhenti... tidak pernah berhenti...',
          'jangan kirim siapa pun lagi— ulangi, JANGAN—"',
          '',
          '[TRANSMISI TERPUTUS]',
        ],
        duration: 9000,
      },
      {
        type: 'narration',
        lines: [
          'Tim penyelamat yang dikirim tidak pernah kembali.',
          'Tidak ada mayat. Tidak ada tanda kekerasan.',
          'Hanya keheningan.',
        ],
        duration: 6000,
      },

      // ─ ACT 3: YOUR MISSION ─────────────────────
      {
        type: 'dossier',
        header: 'BRIEFING MISI',
        fields: [
          { label: 'KODE OPERASI', value: 'LAST SIGNAL' },
          { label: 'TARGET', value: 'SEKTOR 09 — FASILITAS BAWAH TANAH' },
          { label: 'PERSONEL', value: 'ANDA (OPERATOR PENGGANTI)' },
          { label: 'TUJUAN', value: 'PULIHKAN SISTEM, LANJUTKAN PEMANTAUAN' },
          { label: 'STATUS', value: 'RESIKO TINGGI — KELANGSUNGAN HIDUP TIDAK DIJAMIN' },
        ],
        duration: 8000,
      },
      {
        type: 'narration',
        lines: [
          'Mereka memilih Anda karena tidak ada yang mau.',
          'Anda turun sendirian melalui elevator darurat,',
          'ke dalam kegelapan Sektor 09.',
        ],
        sfx: 'elevator',
        duration: 6000,
      },
      {
        type: 'narration',
        lines: [
          'Begitu elevator tertutup di belakang Anda...',
          'sebuah suara berbisik melalui speaker yang seharusnya mati:',
        ],
        duration: 5000,
      },
      {
        type: 'whisper',
        lines: [
          '"Kamu seharusnya tidak datang kembali."',
        ],
        duration: 4500,
      },

      // ─ FINAL: GAME START ───────────────────────
      {
        type: 'title_card',
        title: 'THE LAST SIGNAL',
        subtitle: 'REALITY ERROR',
        tagline: 'NIGHT 1 — THE ARRIVAL',
        duration: 5000,
      },
    ];
  }

  // ─── DOM ───────────────────────────────────────────────────────────
  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'intro-cutscene';
    this.container.innerHTML = `
      <div class="cutscene-content" id="cutscene-content"></div>
      <div class="cutscene-skip" id="cutscene-skip">
        TEKAN <span style="color:#38bdf8;">ENTER</span> ATAU <span style="color:#38bdf8;">KLIK</span> UNTUK SKIP
      </div>
      <div class="cutscene-scanlines"></div>
    `;
    document.body.appendChild(this.container);

    this.contentEl = document.getElementById('cutscene-content');
    this.skipEl = document.getElementById('cutscene-skip');
  }

  // ─── PLAY ──────────────────────────────────────────────────────────
  async play() {
    this.container.style.display = 'flex';
    this.abortController = new AbortController();

    // Skip listeners
    const skipPromise = new Promise(resolve => {
      const handler = (e) => {
        if (e.type === 'keydown' && e.code !== 'Enter' && e.code !== 'Space') return;
        resolve('skipped');
      };
      window.addEventListener('keydown', handler, { signal: this.abortController.signal });
      this.container.addEventListener('click', handler, { signal: this.abortController.signal });
    });

    // Show skip hint after 2s
    setTimeout(() => {
      if (this.skipEl) this.skipEl.classList.add('visible');
    }, 2000);

    const slides = this._getSlides();

    for (let i = 0; i < slides.length; i++) {
      const result = await Promise.race([
        this._playSlide(slides[i], i),
        skipPromise,
      ]);
      if (result === 'skipped') break;
    }

    // Cleanup
    this.abortController.abort();
    await this._fadeOut();
    this.container.style.display = 'none';
    if (this.onComplete) this.onComplete();
  }

  // ─── SLIDE RENDERERS ──────────────────────────────────────────────
  async _playSlide(slide, index) {
    this.contentEl.innerHTML = '';
    this.contentEl.style.opacity = '0';

    // Play transition sound between slides (not on the first one)
    if (index > 0 && this.audio) {
      this.audio.playCutsceneTransition();
    }

    // Play slide-specific entry sound
    this._playSlideSFX(slide);

    switch (slide.type) {
      case 'classified':
        this._renderClassified(slide);
        break;
      case 'narration':
        this._renderNarration(slide);
        break;
      case 'alert':
        this._renderAlert(slide);
        break;
      case 'radio_transcript':
        this._renderRadioTranscript(slide);
        break;
      case 'dossier':
        this._renderDossier(slide);
        break;
      case 'whisper':
        this._renderWhisper(slide);
        break;
      case 'title_card':
        this._renderTitleCard(slide);
        break;
    }

    // Fade in
    await this._fadeElement(this.contentEl, 0, 1, 600);

    // Typewriter effect for text elements
    await this._typewriterAll();

    // Hold
    const holdTime = Math.max(slide.duration - 1200, 1500);
    await this._wait(holdTime);

    // Fade out
    await this._fadeElement(this.contentEl, 1, 0, 500);
  }

  _renderClassified(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-classified">
        <div class="cs-stamp">${slide.header}</div>
        <div class="cs-divider"></div>
        ${slide.lines.map(l => `<div class="cs-line cs-typewrite">${l}</div>`).join('')}
        <div class="cs-divider"></div>
      </div>
    `;
  }

  _renderNarration(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-narration">
        ${slide.lines.map(l => `<div class="cs-line cs-typewrite">${l}</div>`).join('')}
      </div>
    `;
  }

  _renderAlert(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-alert">
        ${slide.lines.map((l, i) => {
          if (i === 0) return `<div class="cs-alert-header cs-typewrite">${l}</div>`;
          if (l === '') return `<div class="cs-spacer"></div>`;
          return `<div class="cs-line cs-typewrite">${l}</div>`;
        }).join('')}
      </div>
    `;
  }

  _renderRadioTranscript(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-radio">
        <div class="cs-radio-header">
          <span class="cs-radio-dot">●</span>
          <span>REKAMAN TRANSMISI — ${slide.freq}</span>
        </div>
        <div class="cs-radio-sender cs-typewrite">[${slide.sender}]</div>
        ${slide.lines.map(l => {
          if (l === '') return `<div class="cs-spacer"></div>`;
          return `<div class="cs-line cs-radio-line cs-typewrite">${l}</div>`;
        }).join('')}
      </div>
    `;
  }

  _renderDossier(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-dossier">
        <div class="cs-dossier-header cs-typewrite">${slide.header}</div>
        <div class="cs-divider"></div>
        ${slide.fields.map(f => `
          <div class="cs-dossier-row">
            <span class="cs-dossier-label">${f.label}:</span>
            <span class="cs-dossier-value cs-typewrite">${f.value}</span>
          </div>
        `).join('')}
        <div class="cs-divider"></div>
      </div>
    `;
  }

  _renderWhisper(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-whisper">
        ${slide.lines.map(l => `<div class="cs-whisper-text cs-typewrite">${l}</div>`).join('')}
      </div>
    `;
  }

  _renderTitleCard(slide) {
    this.contentEl.innerHTML = `
      <div class="cs-title-card">
        <div class="cs-title-main">${slide.title}</div>
        <div class="cs-title-sub">${slide.subtitle}</div>
        <div class="cs-title-divider"></div>
        <div class="cs-title-tagline cs-typewrite">${slide.tagline}</div>
      </div>
    `;
  }

  // ─── SLIDE SOUND EFFECTS ───────────────────────────────────────────
  _playSlideSFX(slide) {
    if (!this.audio) return;
    switch (slide.type) {
      case 'classified':
        this.audio.playCutsceneStamp();
        break;
      case 'alert':
        this.audio.playCutsceneAlert();
        break;
      case 'radio_transcript':
        this.audio.playCutsceneRadioStatic(Math.min(slide.duration / 1000, 6));
        break;
      case 'dossier':
        this.audio.playCutscenePageFlip();
        break;
      case 'whisper':
        this.audio.playCutsceneWhisper(slide.duration / 1000);
        break;
      case 'title_card':
        this.audio.playCutsceneTitleReveal();
        break;
      case 'narration':
        // Start a subtle background drone on the first narration slide
        if (!this._droneStarted) {
          this._droneStarted = true;
          this.audio.playCutsceneDrone(25);
        }
        // Per-slide extra SFX
        if (slide.sfx === 'elevator') {
          this.audio.playCutsceneElevator(5);
        }
        break;
    }
  }

  // ─── TYPEWRITER ───────────────────────────────────────────────────
  async _typewriterAll() {
    const elements = this.contentEl.querySelectorAll('.cs-typewrite');
    for (const el of elements) {
      const fullText = el.textContent;
      el.textContent = '';
      el.style.visibility = 'visible';

      for (let i = 0; i < fullText.length; i++) {
        el.textContent += fullText[i];
        // Play keystroke sound every few characters
        const ch = fullText[i];
        if (this.audio && ch !== ' ' && i % 3 === 0) {
          this.audio.playCutsceneKeystroke();
        }
        // Vary speed: faster for spaces, slower for punctuation
        let delay = 28;
        if (ch === ' ') delay = 12;
        else if ('.,;:—…'.includes(ch)) delay = 90;
        else if (ch === '"' || ch === '"' || ch === '"') delay = 60;

        await this._wait(delay);
      }
      // Brief pause between lines
      await this._wait(150);
    }
  }

  // ─── UTILITIES ────────────────────────────────────────────────────
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _fadeElement(el, from, to, durationMs) {
    return new Promise(resolve => {
      el.style.opacity = String(from);
      el.style.transition = `opacity ${durationMs}ms ease`;
      // Force reflow
      el.offsetHeight; // eslint-disable-line no-unused-expressions
      el.style.opacity = String(to);
      setTimeout(resolve, durationMs);
    });
  }

  _fadeOut() {
    return new Promise(resolve => {
      this.container.style.transition = 'opacity 800ms ease';
      this.container.style.opacity = '0';
      setTimeout(resolve, 800);
    });
  }
}
