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
        <span>SEKTOR 09 // TERMINAL PEMANTAUAN PUSAT [TTY-01]</span>
        <span class="close-btn" id="term-close-btn">[ ESC / TUTUP ]</span>
      </div>
      <div class="terminal-body" id="term-body">
====================================================================
SISTEM OPERASI SEKTOR-OS (VERSI 4.9.2)
Hak Cipta (c) 2049 Komando Pertahanan Sektor 09
Ketik 'bantuan' untuk daftar perintah atau 'ls' untuk melihat file.

[CATATAN TERTEMPEL DI SAMPING MONITOR]:
  • Kata Sandi Subjek 12 : 997  (Catatan Medis Sesi #47)
  • Kata Sandi Proyek    : ECHO (Proyek Riset Laboratorium C)
  • Kode Pintu Reaktor   : 47.3 (Frekuensi Pembawa Sinyal)
  • Lapor Temuan Malam 2 : Ketik 'lapor' atau klik tombol di bawah!
====================================================================
      </div>
      <div class="terminal-quick-actions" id="term-quick-actions">
        <span class="term-quick-label">PINTASAN:</span>
        <button type="button" class="term-quick-btn" data-cmd="ls">📁 LIHAT FILE [ls]</button>
        <button type="button" class="term-quick-btn" data-cmd="lapor" style="border-color: #38bdf8; color: #38bdf8;">📢 LAPOR TEMUAN [lapor]</button>
        <button type="button" class="term-quick-btn" data-cmd="unlock 997">🔓 BUKA 997</button>
        <button type="button" class="term-quick-btn" data-cmd="unlock echo">🔓 BUKA ECHO</button>
        <button type="button" class="term-quick-btn" data-cmd="override chamber 47.3">⚡ BUKA REAKTOR 47.3</button>
        <button type="button" class="term-quick-btn" data-cmd="unlock all">✨ BUKA SEMUA FILE</button>
        <button type="button" class="term-quick-btn" data-cmd="codes">📋 CATATAN SANDI</button>
        <button type="button" class="term-quick-btn" data-cmd="help">❓ BANTUAN</button>
      </div>
      <div class="terminal-input">
        <span>&gt;</span>
        <input type="text" id="term-input" placeholder="Ketik perintah di sini (contoh: lapor, ls, unlock 997, bantuan)..." autocomplete="off" spellcheck="false" />
      </div>
    `;
    document.body.appendChild(this.container);

    this.bodyEl = document.getElementById('term-body');
    this.inputEl = document.getElementById('term-input');
    this.closeBtn = document.getElementById('term-close-btn');

    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    const quickBtns = this.container.querySelectorAll('.term-quick-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        if (cmd) {
          if (this.audio) this.audio.playTerminalBeep(900);
          this.inputEl.value = '';
          this._handleCommand(cmd);
          this.inputEl.focus();
        }
      });
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
