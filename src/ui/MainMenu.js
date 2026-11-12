import { SaveManager } from '../game/SaveManager.js';

export class MainMenu {
  constructor() {
    this.onNewGame = null;
    this.onContinue = null;
    this.onSettings = null;
    this.onCloudSave = null;
    this.onTutorial = null;
    this.onCredits = null;
    this.onDifficultyChange = null;

    this.difficulties = ['easy', 'normal', 'nightmare'];
    this.difficultyLabels = {
      easy: 'CASUAL / PENELITI',
      normal: 'STANDARD / OPERATOR',
      nightmare: 'NIGHTMARE / ANOMALI'
    };
    this.difficultyColors = {
      easy: '#8a8f98',
      normal: '#9aa0aa',
      nightmare: '#b71c1c'
    };

    const savedSettings = SaveManager.loadSettings();
    this.currentDifficulty = (savedSettings && savedSettings.difficulty) || 'normal';

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'main-menu';
    this.container.innerHTML = `
      <div class="menu-bg-overlay"></div>
      <div class="menu-bg-fade" id="menu-bg-fade"></div>
      <div class="menu-content">
        <div class="menu-title">THE LAST SIGNAL</div>
        <div class="menu-subline">REALITY ERROR</div>
        <div class="menu-subtitle">"The truth is not what you see. The truth is what remains when everything disappears."</div>

        <div class="menu-location" id="menu-location-label">SECTOR 09 // LIVE FEED</div>

        <div class="menu-buttons">
          <button id="btn-new-game">NEW GAME</button>
          <button id="btn-continue">CONTINUE</button>
          <button id="btn-difficulty">
            DIFFICULTY: ${this.difficultyLabels[this.currentDifficulty]} [GANTI]
          </button>
          <button id="btn-tutorial">TUTORIAL // PANDUAN BERMAIN</button>
          <button id="btn-cloud-save">CLOUD SAVE // SUPABASE</button>
          <button id="btn-settings">SETTINGS</button>
          <button id="btn-credits">CREDITS // TIM PENGEMBANG</button>
        </div>

        <div class="menu-footer">SECTOR 09 EMERGENCY MONITORING DIVISION // VER 2049.5</div>
      </div>
    `;
    document.body.appendChild(this.container);
    this.locationLabel = document.getElementById('menu-location-label');
    this.bgFade = document.getElementById('menu-bg-fade');

    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnContinue = document.getElementById('btn-continue');
    this.btnDifficulty = document.getElementById('btn-difficulty');
    this.btnTutorial = document.getElementById('btn-tutorial');
    this.btnCloudSave = document.getElementById('btn-cloud-save');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnCredits = document.getElementById('btn-credits');

    this.btnNewGame.addEventListener('click', () => {
      if (this.onNewGame) this.onNewGame();
    });

    this.btnContinue.addEventListener('click', () => {
      if (this.onContinue) this.onContinue();
    });

    this.btnDifficulty.addEventListener('click', () => {
      const idx = this.difficulties.indexOf(this.currentDifficulty);
      const nextIdx = (idx + 1) % this.difficulties.length;
      this.setDifficulty(this.difficulties[nextIdx]);
      if (this.onDifficultyChange) this.onDifficultyChange(this.currentDifficulty);
    });

    this.btnTutorial.addEventListener('click', () => {
      if (this.onTutorial) this.onTutorial();
    });

    this.btnCloudSave.addEventListener('click', () => {
      if (this.onCloudSave) this.onCloudSave();
    });

    this.btnSettings.addEventListener('click', () => {
      if (this.onSettings) this.onSettings();
    });

    this.btnCredits.addEventListener('click', () => {
      if (this.onCredits) this.onCredits();
    });

    this._refreshContinueButton();
  }

  setDifficulty(diff) {
    if (!this.difficulties.includes(diff)) return;
    this.currentDifficulty = diff;
    if (this.btnDifficulty) {
      this.btnDifficulty.textContent = `DIFFICULTY: ${this.difficultyLabels[diff]} [GANTI]`;
    }
    const settings = SaveManager.loadSettings() || {};
    settings.difficulty = diff;
    SaveManager.saveSettings(settings);
  }

  _refreshContinueButton() {
    if (this.btnContinue) {
      const hasSave = SaveManager.hasSave();
      this.btnContinue.disabled = !hasSave;
      this.btnContinue.style.opacity = hasSave ? '1' : '0.35';
      this.btnContinue.style.cursor = hasSave ? 'pointer' : 'not-allowed';
    }
  }

  setLocationLabel(text) {
    if (this.locationLabel) this.locationLabel.textContent = text || 'SECTOR 09 // LIVE FEED';
  }

  async transitionShot(label, applyShot) {
    if (!this.bgFade) {
      if (applyShot) applyShot();
      this.setLocationLabel(label);
      return;
    }
    this.bgFade.classList.add('active');
    await new Promise(r => setTimeout(r, 450));
    if (applyShot) applyShot();
    this.setLocationLabel(label);
    await new Promise(r => setTimeout(r, 80));
    this.bgFade.classList.remove('active');
  }

  show() {
    this._refreshContinueButton();
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
