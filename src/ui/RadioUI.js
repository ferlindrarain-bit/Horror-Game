export class RadioUI {
  constructor(radioSystem, audioManager) {
    this.radio = radioSystem;
    this.audio = audioManager;
    this.isOpen = false;
    this.onClose = null;

    this._createDOM();
    this._bindEvents();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'radio-ui';
    this.container.innerHTML = `
      <div class="radio-header">
        <span>RADIO PENERIMA // FREKUENSI 47.3 MHz</span>
        <span id="radio-close-btn" style="cursor:pointer; color:#888;">[ TUTUP × ]</span>
      </div>
      <div class="radio-body" id="radio-body-el"></div>
      <div class="radio-choices" id="radio-choices-el" style="display:none;"></div>
    `;
    document.body.appendChild(this.container);

    this.bodyEl = document.getElementById('radio-body-el');
    this.choicesEl = document.getElementById('radio-choices-el');
    document.getElementById('radio-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { this.hide(); return; }
      if (e.code === 'KeyE') {
        if (performance.now() - (this.openTimestamp || 0) < 280) return;
        this.hide();
      }
    });
  }

  _bindEvents() {
    this.radio.onMessage = (sender, text) => {
      this.show();
      this.addMessage(sender, text);
      if (this.audio) this.audio.playRadioStatic(0.4);
    };

    this.radio.onChoices = (choices) => {
      this.showChoices(choices);
    };

    this.radio.onComplete = () => {
      setTimeout(() => {
        if (!this.radio.isPlaying && !this.radio.activeChoices) {
          // Keep visible briefly then collapse
        }
      }, 4000);
    };
  }

  addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'radio-message';

    let senderColor = '#38bdf8';
    if (sender === 'CONTROL') senderColor = '#eab308';
    else if (sender === 'UNKNOWN') senderColor = '#ef4444';
    else if (sender === 'ECHO') senderColor = '#a855f7';
    else if (sender === 'DOCTOR') senderColor = '#22c55e';

    msgDiv.innerHTML = `
      <div class="sender" style="color: ${senderColor};">[${sender}]</div>
      <div class="text">${text}</div>
    `;
    this.bodyEl.appendChild(msgDiv);
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
  }

  showChoices(choices) {
    this.choicesEl.innerHTML = '';
    this.choicesEl.style.display = 'block';

    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.textContent = `> ${choice.text}`;
      btn.addEventListener('click', () => {
        this.choicesEl.style.display = 'none';
        this.radio.selectChoice(idx);
      });
      this.choicesEl.appendChild(btn);
    });
  }

  show() {
    this.isOpen = true;
    this.openTimestamp = performance.now();
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    if (this.onClose) this.onClose();
  }

  clear() {
    this.bodyEl.innerHTML = '';
    this.choicesEl.innerHTML = '';
    this.choicesEl.style.display = 'none';
  }
}
