export class TerminalUI {
  constructor(computerSystem, audioManager) {
    this.computer = computerSystem;
    this.audio = audioManager;
    this.onClose = null;
    this.isOpen = false;

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'terminal-ui';
    this.container.innerHTML = `
      <div class="terminal-header">
        <span>SECTOR 09 // CENTRAL MONITORING TERMINAL [TTY-01]</span>
        <span class="close-btn" id="term-close-btn">[ ESC / CLOSE ]</span>
      </div>
      <div class="terminal-body" id="term-body">
====================================================================
SECTOR-OS (TM) VERSION 4.9.2 (x86_64-sector-posix)
Copyright (c) 2049 Sector 09 Defense Systems
Type 'help' for command reference or 'ls' to view directory files.

[STICKY NOTE TAPED BESIDE MONITOR]:
  • Password Subject 12 : 997  (Medical Log #47)
  • Password Echo       : ECHO (Research Project)
  • Chamber Override    : 47.3 (Carrier Frequency)
  -> Quick command: type 'unlock 997', 'unlock echo', or 'unlock 47.3'
====================================================================
      </div>
      <div class="terminal-input">
        <span>&gt;</span>
        <input type="text" id="term-input" placeholder="Type command here (e.g. ls, cat, unlock)..." autocomplete="off" spellcheck="false" />
      </div>
    `;
    document.body.appendChild(this.container);

    this.bodyEl = document.getElementById('term-body');
    this.inputEl = document.getElementById('term-input');
    this.closeBtn = document.getElementById('term-close-btn');

    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    this.inputEl.addEventListener('keydown', (e) => {
      if (this.audio) this.audio.playTerminalBeep(700 + Math.random() * 200);

      if (e.key === 'Enter') {
        const val = this.inputEl.value;
        this.inputEl.value = '';
        this._handleCommand(val);
      } else if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  _handleCommand(cmd) {
    if (!cmd.trim()) return;

    // Append user input
    this.printLine(`> ${cmd}`, '#86efac');

    const res = this.computer.execute(cmd);
    if (res.text === '__CLEAR__') {
      this.bodyEl.innerHTML = '';
      return;
    }

    let color = '#4ade80';
    if (res.type === 'error') color = '#f87171';
    else if (res.type === 'warning') color = '#fbbf24';
    else if (res.type === 'success') color = '#38bdf8';

    this.printLine(res.text, color);
  }

  printLine(text, color = '#4ade80') {
    const p = document.createElement('div');
    p.style.color = color;
    p.style.whiteSpace = 'pre-wrap';
    p.style.marginBottom = '6px';
    p.textContent = text;
    this.bodyEl.appendChild(p);
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
  }

  show() {
    this.isOpen = true;
    this.container.classList.add('active');
    setTimeout(() => {
      this.inputEl.focus();
    }, 100);
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    if (this.onClose) this.onClose();
  }
}
