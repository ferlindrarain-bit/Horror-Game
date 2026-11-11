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
        <div class="hud-label" id="hud-facility-label">SECTOR 09 // FACILITY STATUS</div>
        <div class="hud-value" id="hud-night-title">NIGHT 1 : THE ARRIVAL</div>
      </div>
      <div class="hud-right">
        <div class="flashlight-indicator">
          <div class="hud-label">FLASHLIGHT [F]</div>
          <div class="battery-bar"><div class="fill" id="hud-battery-fill" style="width: 100%;"></div></div>
        </div>
        <div class="stamina-indicator" style="display: flex; align-items: center; gap: 6px;">
          <div class="hud-label">STAMINA [SHIFT]</div>
          <div class="stamina-bar"><div class="fill" id="hud-stamina-fill" style="width: 100%;"></div></div>
        </div>
        <div style="font-size: 0.65rem; color: #38bdf8; letter-spacing: 1.5px; margin-top: 4px; text-align: right;">
          [M] TACTICAL MAP | [TAB] OBJECTIVES
        </div>
      </div>
      <div class="hud-objective" id="hud-objective-box">
        <div class="hud-label" style="margin-bottom: 4px;">CURRENT OBJECTIVE</div>
        <div id="hud-objective-text">Enter Sector 09 and investigate the security control room.</div>
      </div>
      <div class="interact-prompt" id="hud-interact-prompt">[E] Interact</div>
    `;
    document.body.appendChild(this.hudContainer);

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

    // Cache elements
    this.batteryFill = document.getElementById('hud-battery-fill');
    this.staminaFill = document.getElementById('hud-stamina-fill');
    this.nightTitle = document.getElementById('hud-night-title');
    this.objectiveText = document.getElementById('hud-objective-text');
    this.interactPrompt = document.getElementById('hud-interact-prompt');
  }

  show() {
    this.hudContainer.classList.add('active');
    this.crosshair.classList.add('active');
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
    if (this.nightTitle) {
      this.nightTitle.textContent = `${title} : ${subtitle}`;
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
