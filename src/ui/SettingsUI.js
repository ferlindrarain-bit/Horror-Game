import { SaveManager } from '../game/SaveManager.js';

export class SettingsUI {
  constructor(audioManager, playerController) {
    this.audio = audioManager;
    this.player = playerController;
    this.onClose = null;
    this.isOpen = false;

    this.settings = {
      masterVolume: 80,
      sfxVolume: 80,
      musicVolume: 60,
      mouseSensitivity: 50,
      brightness: 100,
      subtitles: true,
      reducedFlashing: false,
      difficulty: 'normal'
    };

    this.onDifficultyChange = null;

    this._loadSavedSettings();
    this._createDOM();
  }

  _loadSavedSettings() {
    const loaded = SaveManager.loadSettings();
    if (loaded) {
      Object.assign(this.settings, loaded);
      this._applySettings();
    }
  }

  _applySettings() {
    if (this.audio) {
      this.audio.setMasterVolume(this.settings.masterVolume / 100);
      this.audio.setSfxVolume(this.settings.sfxVolume / 100);
      this.audio.setMusicVolume(this.settings.musicVolume / 100);
    }
    if (this.player) {
      // Maps 1..100 to 0.0008..0.0045
      const sens = 0.0008 + (this.settings.mouseSensitivity / 100) * 0.0037;
      this.player.setSensitivity(sens);
    }
    document.body.style.filter = `brightness(${this.settings.brightness}%)`;
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'settings-ui';
    this.container.innerHTML = `
      <div class="close-btn" id="settings-close-btn">&times;</div>
      <h3>SYSTEM CONFIGURATION // SETTINGS</h3>

      <div class="setting-row">
        <label>Master Volume</label>
        <input type="range" id="set-master" min="0" max="100" value="${this.settings.masterVolume}" />
      </div>

      <div class="setting-row">
        <label>Sound Effects Volume</label>
        <input type="range" id="set-sfx" min="0" max="100" value="${this.settings.sfxVolume}" />
      </div>

      <div class="setting-row">
        <label>Music & Ambience Volume</label>
        <input type="range" id="set-music" min="0" max="100" value="${this.settings.musicVolume}" />
      </div>

      <div class="setting-row">
        <label>Mouse Look Sensitivity</label>
        <input type="range" id="set-sens" min="1" max="100" value="${this.settings.mouseSensitivity}" />
      </div>

      <div class="setting-row">
        <label>Display Brightness</label>
        <input type="range" id="set-bright" min="50" max="150" value="${this.settings.brightness}" />
      </div>

      <div class="setting-row" style="margin-top: 15px;">
        <label>Simulation Difficulty</label>
        <select id="set-difficulty" style="background: #0f172a; border: 1px solid #9aa0aa; color: #9aa0aa; padding: 5px 8px; font-family: monospace; font-size: 0.78rem; cursor: pointer; border-radius: 2px;">
          <option value="easy" ${this.settings.difficulty === 'easy' ? 'selected' : ''}>CASUAL / PENELITI (Mudah - Senter & Stamina 2x)</option>
          <option value="normal" ${this.settings.difficulty === 'normal' || !this.settings.difficulty ? 'selected' : ''}>STANDARD / OPERATOR (Normal)</option>
          <option value="nightmare" ${this.settings.difficulty === 'nightmare' ? 'selected' : ''}>NIGHTMARE / ANOMALI (Sulit - Kegelapan Ekstrem)</option>
        </select>
      </div>

      <div class="setting-row" style="margin-top: 12px;">
        <label>Subtitles</label>
        <input type="checkbox" id="set-subs" ${this.settings.subtitles ? 'checked' : ''} />
      </div>

      <div class="setting-row">
        <label>Reduced Flashing Effects</label>
        <input type="checkbox" id="set-flash" ${this.settings.reducedFlashing ? 'checked' : ''} />
      </div>

      <button id="settings-save-btn" style="margin-top: 25px; padding: 10px; background: transparent; border: 1px solid #e04040; color: #e04040; cursor: pointer; text-transform: uppercase;">SAVE & APPLY</button>
    `;
    document.body.appendChild(this.container);

    this.closeBtn = document.getElementById('settings-close-btn');
    this.saveBtn = document.getElementById('settings-save-btn');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.saveBtn.addEventListener('click', () => {
      this._saveCurrent();
      this.hide();
    });

    // Real-time input updates
    document.getElementById('set-master').addEventListener('input', (e) => {
      this.settings.masterVolume = parseInt(e.target.value);
      this._applySettings();
    });
    document.getElementById('set-sfx').addEventListener('input', (e) => {
      this.settings.sfxVolume = parseInt(e.target.value);
      this._applySettings();
    });
    document.getElementById('set-music').addEventListener('input', (e) => {
      this.settings.musicVolume = parseInt(e.target.value);
      this._applySettings();
    });
    document.getElementById('set-sens').addEventListener('input', (e) => {
      this.settings.mouseSensitivity = parseInt(e.target.value);
      this._applySettings();
    });
    document.getElementById('set-bright').addEventListener('input', (e) => {
      this.settings.brightness = parseInt(e.target.value);
      document.body.style.filter = `brightness(${this.settings.brightness}%)`;
    });
    const diffEl = document.getElementById('set-difficulty');
    if (diffEl) {
      diffEl.addEventListener('change', (e) => {
        this.settings.difficulty = e.target.value;
        if (this.onDifficultyChange) this.onDifficultyChange(this.settings.difficulty);
      });
    }
    document.getElementById('set-subs').addEventListener('change', (e) => {
      this.settings.subtitles = e.target.checked;
    });
    document.getElementById('set-flash').addEventListener('change', (e) => {
      this.settings.reducedFlashing = e.target.checked;
    });
  }

  _saveCurrent() {
    SaveManager.saveSettings(this.settings);
  }

  show() {
    this.isOpen = true;
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    if (this.onClose) this.onClose();
  }
}
