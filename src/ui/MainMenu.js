import { SaveManager } from '../game/SaveManager.js';

export class MainMenu {
  constructor() {
    this.onNewGame = null;
    this.onContinue = null;
    this.onSettings = null;
    this.onCloudSave = null;

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
      <button id="btn-cloud-save" style="border-color:#38bdf8; color:#38bdf8;">☁ CLOUD SAVE // SUPABASE</button>
      <button id="btn-settings">SETTINGS</button>
      <button id="btn-credits">CREDITS</button>

      <div style="margin-top: 2.5rem; font-size: 0.7rem; color: #444; letter-spacing: 1px;">
        SECTOR 09 EMERGENCY MONITORING DIVISION // VER 2049.5
      </div>
    `;
    document.body.appendChild(this.container);

    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnContinue = document.getElementById('btn-continue');
    this.btnCloudSave = document.getElementById('btn-cloud-save');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnCredits = document.getElementById('btn-credits');

    this.btnNewGame.addEventListener('click', () => {
      if (this.onNewGame) this.onNewGame();
    });

    this.btnContinue.addEventListener('click', () => {
      if (this.onContinue) this.onContinue();
    });

    this.btnCloudSave.addEventListener('click', () => {
      if (this.onCloudSave) this.onCloudSave();
    });

    this.btnSettings.addEventListener('click', () => {
      if (this.onSettings) this.onSettings();
    });

    this.btnCredits.addEventListener('click', () => {
      alert(`THE LAST SIGNAL: REALITY ERROR\n\nDirected & Developed by: Antigravity Game Studio\nTechnology: Three.js, Web Audio API, Vite\nStory & Design: Sector 09 Research Division\n\nThank you for playing.`);
    });

    this._refreshContinueButton();
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
