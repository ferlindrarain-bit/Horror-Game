export class PauseMenu {
  constructor() {
    this.onResume = null;
    this.onSettings = null;
    this.onCloudSave = null;
    this.onMainMenu = null;
    this.onTutorial = null;
    this.onCredits = null;
    this.onMap = null;

    this.isOpen = false;
    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pause-menu';
    this.container.innerHTML = `
      <h2>GAME DIJEDA</h2>
      <button id="btn-pause-resume">LANJUTKAN PERMAINAN</button>
      <button id="btn-pause-objectives">DAFTAR TARGET MISI</button>
      <button id="btn-pause-map" style="border-color:#38bdf8; color:#38bdf8;">🗺 PETA FASILITAS [M]</button>
      <button id="btn-pause-tutorial" style="border-color:#f59e0b; color:#fbbf24;">📖 PANDUAN & CARA MAIN [H]</button>
      <button id="btn-pause-cloud" style="border-color:#38bdf8; color:#38bdf8;">☁ PENYIMPANAN CLOUD</button>
      <button id="btn-pause-settings">PENGATURAN</button>
      <button id="btn-pause-credits">KREDIT & PENGEMBANG</button>
      <button id="btn-pause-menu">KEMBALI KE MENU UTAMA</button>

      <div id="objectives-panel">
        <h3>TARGET MISI AKTIF</h3>
        <div id="obj-list-container"></div>
        <button id="btn-close-obj" style="margin-top: 15px; width: 100%; padding: 6px 0;">TUTUP</button>
      </div>
    `;
    document.body.appendChild(this.container);

    this.btnResume = document.getElementById('btn-pause-resume');
    this.btnObjectives = document.getElementById('btn-pause-objectives');
    this.btnMap = document.getElementById('btn-pause-map');
    this.btnTutorial = document.getElementById('btn-pause-tutorial');
    this.btnCloud = document.getElementById('btn-pause-cloud');
    this.btnSettings = document.getElementById('btn-pause-settings');
    this.btnCredits = document.getElementById('btn-pause-credits');
    this.btnMainMenu = document.getElementById('btn-pause-menu');
    this.objPanel = document.getElementById('objectives-panel');
    this.objContainer = document.getElementById('obj-list-container');
    this.btnCloseObj = document.getElementById('btn-close-obj');

    this.btnResume.addEventListener('click', () => {
      this.hide();
      if (this.onResume) this.onResume();
    });

    this.btnObjectives.addEventListener('click', () => {
      this.objPanel.classList.toggle('active');
    });

    this.btnMap.addEventListener('click', () => {
      this.hide();
      if (this.onMap) this.onMap();
    });

    this.btnTutorial.addEventListener('click', () => {
      if (this.onTutorial) this.onTutorial();
    });

    this.btnCloud.addEventListener('click', () => {
      if (this.onCloudSave) this.onCloudSave();
    });

    this.btnCredits.addEventListener('click', () => {
      if (this.onCredits) this.onCredits();
    });

    this.btnCloseObj.addEventListener('click', () => {
      this.objPanel.classList.remove('active');
    });

    this.btnSettings.addEventListener('click', () => {
      if (this.onSettings) this.onSettings();
    });

    this.btnMainMenu.addEventListener('click', () => {
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });
  }

  setObjectives(objectivesList) {
    if (!this.objContainer) return;
    this.objContainer.innerHTML = '';
    (objectivesList || []).forEach(obj => {
      const item = document.createElement('div');
      item.className = `obj-item ${obj.completed ? 'completed' : ''}`;
      item.textContent = `${obj.completed ? '[✓]' : '[ ]'} ${obj.text}`;
      this.objContainer.appendChild(item);
    });
  }

  show(objectives) {
    this.isOpen = true;
    if (objectives) this.setObjectives(objectives);
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    this.objPanel.classList.remove('active');
  }
}
