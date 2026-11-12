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
        <div class="hud-indicator">
          <div class="hud-label">SENTER [F] <span id="hud-battery-text">100%</span></div>
          <div class="hud-bar"><div class="fill" id="hud-battery-fill" style="width: 100%;"></div></div>
        </div>
        <div class="hud-indicator">
          <div class="hud-label">STAMINA [SHIFT] <span id="hud-stamina-text">100%</span></div>
          <div class="hud-bar"><div class="fill" id="hud-stamina-fill" style="width: 100%;"></div></div>
        </div>
        <div class="hud-actions">
          <span id="hud-btn-map" class="hud-action-btn" title="Buka Peta">[M] PETA</span>
          <span id="hud-btn-tutorial" class="hud-action-btn" title="Buka Tutorial">[H] TUTORIAL</span>
          <span id="hud-btn-tab" class="hud-action-btn" title="Menu Jeda">[TAB] PAUSE</span>
        </div>
      </div>
      <div class="hud-objective" id="hud-objective-box">
        <div class="hud-label hud-objective-header">
          <span>TARGET SAAT INI <span id="hud-objective-progress"></span></span>
          <span class="hud-hint">[M] PETA</span>
        </div>
        <div id="hud-objective-text">Masuk ke Sektor 09 dan periksa Ruang Kontrol Keamanan.</div>
        <div id="hud-nav-guidance" class="hud-guidance">PANDUAN: Ruang Kontrol Keamanan (Lobi Tengah)</div>
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

    // Jumpscare Overlay (Black Anomaly Horror Event)
    this.jumpscareOverlay = document.createElement('div');
    this.jumpscareOverlay.id = 'jumpscare-overlay';
    this.jumpscareOverlay.innerHTML = `
      <div class="jumpscare-vignette"></div>
      <div class="jumpscare-noise"></div>
      <div class="jumpscare-face">
        <div class="jumpscare-eyes">
          <div class="eye eye-left"></div>
          <div class="eye eye-right"></div>
        </div>
        <div class="jumpscare-mouth"></div>
      </div>
      <div class="jumpscare-glitch-text">ANOMALI HITAM // JANGAN BERBALIK</div>
    `;
    document.body.appendChild(this.jumpscareOverlay);

    // Cache elements
    this.batteryFill = document.getElementById('hud-battery-fill');
    this.batteryText = document.getElementById('hud-battery-text');
    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.staminaText = document.getElementById('hud-stamina-text');
    this.nightTitle = document.getElementById('hud-night-title');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.objectiveProgress = document.getElementById('hud-objective-progress');
    this.guidanceText = document.getElementById('hud-nav-guidance');
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
    const v = Math.max(0, Math.min(100, Math.round(pct)));
    if (this.batteryFill) {
      this.batteryFill.style.width = `${v}%`;
      if (v < 20) this.batteryFill.dataset.state = 'critical';
      else if (v < 40) this.batteryFill.dataset.state = 'low';
      else this.batteryFill.dataset.state = 'normal';
    }
    if (this.batteryText) {
      this.batteryText.textContent = `${v}%`;
      this.batteryText.dataset.state = this.batteryFill ? this.batteryFill.dataset.state : 'normal';
    }
  }

  updateStamina(pct) {
    const v = Math.max(0, Math.min(100, Math.round(pct)));
    if (this.staminaFill) {
      this.staminaFill.style.width = `${v}%`;
      if (v < 25) this.staminaFill.dataset.state = 'critical';
      else if (v < 50) this.staminaFill.dataset.state = 'low';
      else this.staminaFill.dataset.state = 'normal';
    }
    if (this.staminaText) {
      this.staminaText.textContent = `${v}%`;
      this.staminaText.dataset.state = this.staminaFill ? this.staminaFill.dataset.state : 'normal';
    }
  }

  updateObjectiveProgress(completed, total) {
    if (!this.objectiveProgress) return;
    if (typeof total === 'number' && total > 0) {
      this.objectiveProgress.textContent = `(${completed}/${total})`;
    } else {
      this.objectiveProgress.textContent = '';
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

  updateGuidance(text) {
    if (!this.guidanceText) {
      this.guidanceText = document.getElementById('hud-nav-guidance');
    }
    if (this.guidanceText) {
      if (text) {
        this.guidanceText.style.display = 'flex';
        this.guidanceText.textContent = text;
      } else {
        this.guidanceText.style.display = 'none';
      }
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

  triggerJumpscare(duration = 1100, onComplete) {
    if (!this.jumpscareOverlay) return;
    this.jumpscareOverlay.classList.add('active');
    document.body.classList.add('jumpscare-shaking');

    setTimeout(() => {
      this.jumpscareOverlay.classList.remove('active');
      document.body.classList.remove('jumpscare-shaking');
      if (onComplete) onComplete();
    }, duration);
  }
}
