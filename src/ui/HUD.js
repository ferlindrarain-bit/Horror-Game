export class HUD {
  constructor() {
    this._createDOM();
  }

  _createDOM() {
    // Top HUD
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud';
    this.hudContainer.innerHTML = `
      <div class="hud-left">
        <div class="hud-label" id="hud-facility-label">STATUS FASILITAS // SEKTOR 09</div>
        <div class="hud-value" id="hud-night-title">MALAM 1 : KEDATANGAN</div>
      </div>
      <div class="hud-right">
        <div class="flashlight-indicator">
          <div class="hud-label">SENTER [F]</div>
          <div class="battery-bar"><div class="fill" id="hud-battery-fill" style="width: 100%;"></div></div>
        </div>
        <div class="stamina-indicator" style="display: flex; align-items: center; gap: 6px;">
          <div class="hud-label">STAMINA [SHIFT]</div>
          <div class="stamina-bar"><div class="fill" id="hud-stamina-fill" style="width: 100%;"></div></div>
        </div>
        <div style="font-size: 0.65rem; color: #38bdf8; letter-spacing: 1.2px; margin-top: 6px; text-align: right; display: flex; justify-content: flex-end; gap: 6px; pointer-events: auto;">
          <span id="hud-btn-map" style="cursor: pointer; padding: 2px 6px; border: 1px solid rgba(56,189,248,0.45); background: rgba(3,7,18,0.7); border-radius: 2px; user-select: none;" title="Buka Denah Peta Fasilitas">[M] PETA</span>
          <span id="hud-btn-tutorial" style="cursor: pointer; padding: 2px 6px; border: 1px solid rgba(245,158,11,0.45); color: #f59e0b; background: rgba(3,7,18,0.7); border-radius: 2px; user-select: none;" title="Buka Panduan & Tutorial">[H] TUTORIAL</span>
          <span id="hud-btn-tab" style="cursor: pointer; padding: 2px 6px; border: 1px solid rgba(148,163,184,0.45); color: #94a3b8; background: rgba(3,7,18,0.7); border-radius: 2px; user-select: none;" title="Menu Jeda & Daftar Objektif">[TAB] PAUSE</span>
        </div>
      </div>
      <div class="hud-objective" id="hud-objective-box">
        <div class="hud-label" style="margin-bottom: 4px;">TARGET SAAT INI</div>
        <div id="hud-objective-text">Masuk ke Sektor 09 dan periksa Ruang Kontrol Keamanan.</div>
      </div>
      <div class="interact-prompt" id="hud-interact-prompt">[E] Interaksi</div>
    `;
    document.body.appendChild(this.hudContainer);

    this.onOpenMap = null;
    this.onOpenTutorial = null;
    this.onOpenObjectives = null;

    const btnMap = document.getElementById('hud-btn-map');
    const btnTut = document.getElementById('hud-btn-tutorial');
    const btnTab = document.getElementById('hud-btn-tab');

    if (btnMap) {
      btnMap.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onOpenMap) this.onOpenMap();
      });
    }
    if (btnTut) {
      btnTut.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onOpenTutorial) this.onOpenTutorial();
      });
    }
    if (btnTab) {
      btnTab.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onOpenObjectives) this.onOpenObjectives();
      });
    }

    // Crosshair dot
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'crosshair';
    document.body.appendChild(this.crosshair);

    // Notification toast
    this.notification = document.createElement('div');
    this.notification.className = 'notification';
    document.body.appendChild(this.notification);

    // Night transition overlay
    this.nightOverlay = document.createElement('div');
    this.nightOverlay.id = 'night-transition';
    this.nightOverlay.innerHTML = `
      <div class="night-label" id="trans-night-title">NIGHT 1</div>
      <div class="night-subtitle" id="trans-night-subtitle">THE ARRIVAL</div>
    `;
    document.body.appendChild(this.nightOverlay);

    // Film grain & vignette
    const grain = document.createElement('div');
    grain.id = 'film-grain';
    document.body.appendChild(grain);

    const vignette = document.createElement('div');
    vignette.id = 'vignette';
    document.body.appendChild(vignette);
    this.vignette = vignette;

    // Cache elements
    this.batteryFill = document.getElementById('hud-battery-fill');
    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.nightTitle = document.getElementById('hud-night-title');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.interactPrompt = document.getElementById('hud-interact-prompt');
    this.currentNightTitle = '';
    this.currentNightSubtitle = '';
  }

  show() {
    this.hudContainer.classList.add('active');
    this.crosshair.classList.add('active');
    if (this.currentNightTitle) {
      this.updateNight(this.currentNightTitle, this.currentNightSubtitle);
    }
  }

  hide() {
    this.hudContainer.classList.remove('active');
    this.crosshair.classList.remove('active');
  }

  updateBattery(pct) {
    if (this.batteryFill) {
      this.batteryFill.style.width = `${pct}%`;
      this.batteryFill.style.background = pct < 20 ? '#ef4444' : '#eab308';
    }
  }

  updateStamina(pct) {
    if (this.staminaFill) {
      this.staminaFill.style.width = `${pct}%`;
    }
  }

  updateNight(title, subtitle) {
    if (title) {
      this.currentNightTitle = title;
      this.currentNightSubtitle = subtitle || '';
    }
    if (!this.nightTitle) {
      this.nightTitle = document.getElementById('hud-night-title');
    }
    if (this.nightTitle && this.currentNightTitle) {
      this.nightTitle.textContent = this.currentNightSubtitle
        ? `${this.currentNightTitle} : ${this.currentNightSubtitle}`
        : this.currentNightTitle;
    }
  }

  updateObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.textContent = text;
    }
  }

  showInteractPrompt(promptText) {
    if (this.interactPrompt) {
      if (promptText) {
        this.interactPrompt.textContent = promptText;
        this.interactPrompt.classList.add('visible');
        if (this.crosshair) this.crosshair.classList.add('hovering');
      } else {
        this.interactPrompt.classList.remove('visible');
        if (this.crosshair) this.crosshair.classList.remove('hovering');
      }
    }
  }

  showNotification(text, duration = 3500) {
    if (this.notification) {
      this.notification.textContent = text;
      this.notification.classList.add('show');
      setTimeout(() => {
        this.notification.classList.remove('show');
      }, duration);
    }
  }

  playNightTransition(title, subtitle, onComplete) {
    const titleEl = document.getElementById('trans-night-title');
    const subEl = document.getElementById('trans-night-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;

    this.nightOverlay.classList.add('active');
    setTimeout(() => {
      this.nightOverlay.classList.remove('active');
      if (onComplete) onComplete();
    }, 2800);
  }
}
