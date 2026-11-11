export class EndingUI {
  constructor() {
    this.isOpen = false;
    this.onRestart = null;
    this.onMainMenu = null;
    this.onChoiceSelected = null;

    this._createDOM();
  }

  _createDOM() {
    // 1. Ending Narrative Resolution Screen
    this.container = document.createElement('div');
    this.container.id = 'ending-screen';
    this.container.innerHTML = `
      <div class="ending-title" id="ending-title-el">ENDING A: THE BAD SIGNAL</div>
      <div style="font-size: 0.95rem; color: #f59e0b; margin-bottom: 1.5rem; letter-spacing:2px;" id="ending-sub-el">The cycle repeats.</div>
      <div class="ending-text" id="ending-text-el">Narrative epilogue goes here...</div>
      
      <div style="display: flex; gap: 18px; margin-top:20px;">
        <button id="ending-restart-btn">PLAY AGAIN</button>
        <button id="ending-menu-btn">MAIN MENU</button>
      </div>
    `;
    document.body.appendChild(this.container);

    this.titleEl = document.getElementById('ending-title-el');
    this.subEl = document.getElementById('ending-sub-el');
    this.textEl = document.getElementById('ending-text-el');

    document.getElementById('ending-restart-btn').addEventListener('click', () => {
      this.hide();
      if (this.onRestart) this.onRestart();
    });

    document.getElementById('ending-menu-btn').addEventListener('click', () => {
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });

    // 2. Interactive Final Decision Modal (Replacing browser prompt)
    this.choiceModal = document.createElement('div');
    this.choiceModal.id = 'final-choice-modal';
    this.choiceModal.style.cssText = `
      position: fixed; inset: 0; z-index: 9700; background: rgba(3, 5, 8, 0.96);
      display: none; flex-direction: column; align-items: center; justify-content: center;
      padding: 30px; font-family: 'Courier New', monospace;
    `;
    this.choiceModal.innerHTML = `
      <div style="font-size: 1.8rem; color: #38bdf8; letter-spacing: 5px; margin-bottom: 0.4rem; text-shadow: 0 0 25px rgba(56,189,248,0.5);">
        CONSCIOUSNESS RESONANCE TRANSMITTER
      </div>
      <div style="font-size: 0.85rem; color: #888; margin-bottom: 2.2rem; font-style: italic;">
        "The signal is ready. Choose the resolution of the experiment."
      </div>

      <div style="display: flex; gap: 20px; max-width: 900px; width: 100%;">
        <!-- CHOICE A -->
        <div id="choice-card-a" style="flex:1; background:rgba(20,25,32,0.8); border:1px solid #334155; padding:22px; cursor:pointer; transition:all 0.25s;">
          <div style="color:#eab308; font-size:1.1rem; font-weight:bold; margin-bottom:10px;">[A] SUSTAIN THE LOOP</div>
          <div style="color:#aaa; font-size:0.75rem; line-height:1.6; margin-bottom:16px;">
            Obey Central Command. Keep the 47.3 Hz transmission array active. Protect the facility structure and accept your role as the perpetual observer.
          </div>
          <button style="width:100%; padding:8px 0; background:transparent; border:1px solid #eab308; color:#eab308; font-family:'Courier New',monospace; font-size:0.8rem; cursor:pointer;">
            SELECT CHOICE A
          </button>
        </div>

        <!-- CHOICE B -->
        <div id="choice-card-b" style="flex:1; background:rgba(20,25,32,0.8); border:1px solid #334155; padding:22px; cursor:pointer; transition:all 0.25s;">
          <div style="color:#ef4444; font-size:1.1rem; font-weight:bold; margin-bottom:10px;">[B] DESTROY THE SIGNAL</div>
          <div style="color:#aaa; font-size:0.75rem; line-height:1.6; margin-bottom:16px;">
            Engage the frequency inverter. Shatter the resonance array and force open the surface blast doors. Escape Sector 09 forever.
          </div>
          <button style="width:100%; padding:8px 0; background:transparent; border:1px solid #ef4444; color:#ef4444; font-family:'Courier New',monospace; font-size:0.8rem; cursor:pointer;">
            SELECT CHOICE B
          </button>
        </div>

        <!-- CHOICE C -->
        <div id="choice-card-c" style="flex:1; background:rgba(20,25,32,0.8); border:1px solid #334155; padding:22px; cursor:pointer; transition:all 0.25s;">
          <div style="color:#38bdf8; font-size:1.1rem; font-weight:bold; margin-bottom:10px;">[C] MERGE WITH THE SIGNAL</div>
          <div style="color:#aaa; font-size:0.75rem; line-height:1.6; margin-bottom:16px;">
            Synchronize your consciousness with the core frequency. Dissolve the simulation boundary and discover the true reality behind Sector 09.
          </div>
          <button style="width:100%; padding:8px 0; background:transparent; border:1px solid #38bdf8; color:#38bdf8; font-family:'Courier New',monospace; font-size:0.8rem; cursor:pointer;">
            SELECT CHOICE C (TRUE)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.choiceModal);

    // Bind choice cards
    const bindChoice = (id, key) => {
      const card = document.getElementById(id);
      card.addEventListener('mouseenter', () => { card.style.borderColor = '#fff'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = '#334155'; });
      card.addEventListener('click', () => {
        this.choiceModal.style.display = 'none';
        if (this.onChoiceSelected) this.onChoiceSelected(key);
      });
    };
    bindChoice('choice-card-a', 'A');
    bindChoice('choice-card-b', 'B');
    bindChoice('choice-card-c', 'C');
  }

  showChoiceModal(onSelect) {
    this.onChoiceSelected = onSelect;
    this.choiceModal.style.display = 'flex';
  }

  showEnding(endingData) {
    this.titleEl.textContent = endingData.title;
    this.subEl.textContent = endingData.subtitle;
    this.textEl.textContent = endingData.text;

    this.isOpen = true;
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    this.choiceModal.style.display = 'none';
  }
}
