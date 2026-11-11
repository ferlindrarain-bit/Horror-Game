export class PauseMenu {
  constructor() {
    this.onResume = null;
    this.onSettings = null;
    this.onCloudSave = null;
    this.onMainMenu = null;

    this.isOpen = false;
    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'pause-menu';
    this.container.innerHTML = `
      <h2>SIMULATION PAUSED</h2>
      <button id="btn-pause-resume">RESUME</button>
      <button id="btn-pause-objectives">OBJECTIVES</button>
      <button id="btn-pause-cloud" style="border-color:#38bdf8; color:#38bdf8;">☁ CLOUD SAVE</button>
      <button id="btn-pause-settings">SETTINGS</button>
      <button id="btn-pause-menu">MAIN MENU</button>

      <div id="objectives-panel">
        <h3>ACTIVE OBJECTIVES</h3>
        <div id="obj-list-container"></div>
        <button id="btn-close-obj" style="margin-top: 15px; width: 100%; padding: 6px 0;">CLOSE</button>
      </div>
    `;
    document.body.appendChild(this.container);

    this.btnResume = document.getElementById('btn-pause-resume');
    this.btnObjectives = document.getElementById('btn-pause-objectives');
    this.btnCloud = document.getElementById('btn-pause-cloud');
    this.btnSettings = document.getElementById('btn-pause-settings');
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

    this.btnCloud.addEventListener('click', () => {
      if (this.onCloudSave) this.onCloudSave();
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
