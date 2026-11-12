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
      easy: '#22c55e',
      normal: '#38bdf8',
      nightmare: '#ef4444'
    };

    const savedSettings = SaveManager.loadSettings();
    this.currentDifficulty = (savedSettings && savedSettings.difficulty) || 'normal';

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'main-menu';
    this.container.innerHTML = `
      <div class="menu-title">THE LAST SIGNAL</div>
      <div style="font-size: 1.1rem; color: #ef4444; letter-spacing: 4px; margin-bottom: 0.6rem;">REALITY ERROR</div>
      <div class="menu-subtitle">"The truth is not what you see. The truth is what remains when everything disappears."</div>
      
      <button id="btn-new-game">NEW GAME</button>
      <button id="btn-continue">CONTINUE</button>
      <button id="btn-difficulty" style="border-color: ${this.difficultyColors[this.currentDifficulty]}; color: ${this.difficultyColors[this.currentDifficulty]}; font-size: 0.8rem; letter-spacing: 1.5px;">
        DIFFICULTY: ${this.difficultyLabels[this.currentDifficulty]} [GANTI]
      </button>
      <button id="btn-tutorial" style="border-color:#f59e0b; color:#fbbf24;">📖 TUTORIAL // PANDUAN BERMAIN</button>
      <button id="btn-cloud-save" style="border-color:#38bdf8; color:#38bdf8;">☁ CLOUD SAVE // SUPABASE</button>
      <button id="btn-settings">SETTINGS</button>
      <button id="btn-credits">CREDITS // TIM PENGEMBANG</button>

      <div style="margin-top: 2.5rem; font-size: 0.7rem; color: #444; letter-spacing: 1px;">
        SECTOR 09 EMERGENCY MONITORING DIVISION // VER 2049.5
      </div>
    `;
    document.body.appendChild(this.container);

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
      this.btnDifficulty.style.borderColor = this.difficultyColors[diff];
      this.btnDifficulty.style.color = this.difficultyColors[diff];
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

  show() {
    this._refreshContinueButton();
    this.container.style.display = 'flex';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
