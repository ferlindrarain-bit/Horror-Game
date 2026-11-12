export class CreditsUI {
  constructor(audioManager) {
    this.audio = audioManager;
    this.isOpen = false;
    this.onClose = null;
    this.scrollSpeed = 0.6;
    this.isAutoScroll = true;
    this.animFrameId = null;

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'credits-ui';
    this.container.style.cssText = `
      position: fixed; inset: 0; z-index: 16000; background: #030712;
      display: none; flex-direction: column; font-family: 'Courier New', monospace;
      color: #e2e8f0; overflow: hidden;
    `;

    this.container.innerHTML = `
      <!-- Scanlines overlay -->
      <div style="position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px); z-index: 10;"></div>
      
      <!-- Top Bar -->
      <div style="position: absolute; top: 0; left: 0; right: 0; padding: 14px 24px; background: linear-gradient(180deg, rgba(3,7,18,0.95) 0%, transparent 100%); display: flex; justify-content: space-between; align-items: center; z-index: 20;">
        <div style="font-size: 0.85rem; color: #9aa0aa; font-weight: bold; letter-spacing: 2px;">
          THE LAST SIGNAL &bull; TRANSMISSION ARCHIVE CREDITS
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button id="cred-toggle-scroll" style="background: rgba(30,41,59,0.8); border: 1px solid #64748b; color: #94a3b8; padding: 5px 12px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.72rem;">[ AUTO-SCROLL: ON ]</button>
          <button id="cred-close-btn" style="background: #2a0f12; border: 1px solid #b71c1c; color: #c7ccd4; padding: 5px 16px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: bold;">[ ✖ KEMBALI ]</button>
        </div>
      </div>

      <!-- Scrolling Credits Body -->
      <div id="cred-scroll-viewport" style="flex: 1; overflow-y: auto; scroll-behavior: smooth; display: flex; justify-content: center; position: relative;">
        <div id="cred-scroll-content" style="max-width: 680px; width: 100%; padding: 120px 24px 180px; text-align: center; display: flex; flex-direction: column; gap: 42px;">
          
          <div style="margin-bottom: 24px;">
            <div style="font-size: 2.4rem; font-weight: bold; color: #9aa0aa; letter-spacing: 8px; text-shadow: 0 0 20px rgba(56,189,248,0.5);">
              THE LAST SIGNAL
            </div>
            <div style="font-size: 1.1rem; color: #b71c1c; letter-spacing: 4px; margin-top: 6px;">
              REALITY ERROR // DIRECTOR'S CUT
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 10px; letter-spacing: 2px;">
              SECTOR 09 SUBTERRANEAN ANOMALOUS INVESTIGATION
            </div>
          </div>

          <!-- LEAD CREATORS: RAIN & DAVE -->
          <div style="display: flex; flex-direction: column; gap: 8px; padding: 18px; background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.3); border-radius: 4px;">
            <div style="font-size: 0.8rem; color: #9aa0aa; letter-spacing: 3px; font-weight: bold;">CREATOR & LEAD DEVELOPER // PEMBUAT UTAMA</div>
            <div style="font-size: 1.7rem; color: #f8fafc; font-weight: bold; letter-spacing: 3px; text-shadow: 0 0 16px rgba(56,189,248,0.7);">RAIN</div>
            <div style="font-size: 0.82rem; color: #94a3b8;">Game Vision, Lead Architecture, Direction & World Building</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; padding: 18px; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.3); border-radius: 4px;">
            <div style="font-size: 0.8rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">CO-CREATOR & GAME DESIGNER // PEMBUAT & DESAIN GAME</div>
            <div style="font-size: 1.7rem; color: #f8fafc; font-weight: bold; letter-spacing: 3px; text-shadow: 0 0 16px rgba(245,158,11,0.7);">DAVE</div>
            <div style="font-size: 0.82rem; color: #94a3b8;">Co-Creator, Game Systems, Mechanics & Level Design</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">ENGINEERING & TECHNICAL ARCHITECTURE</div>
            <div style="font-size: 1.15rem; color: #f8fafc; font-weight: bold;">Antigravity Pair Programming Engineering</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Google DeepMind Advanced Agentic Coding</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">CORE 3D GRAPHICS & SIMULATION ENGINE</div>
            <div style="font-size: 1.05rem; color: #f8fafc; font-weight: bold;">Three.js WebGL Architecture</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Physically-Based Shading, Volumetric Fog & Dynamic Lighting</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">PROCEDURAL SOUNDSCAPES & AUDIO SYNTHESIS</div>
            <div style="font-size: 1.05rem; color: #f8fafc; font-weight: bold;">HTML5 Web Audio API</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Frequency Oscillators, Spatial Panning & Distortion Filters</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">CLOUD INFRASTRUCTURE & CROSS-DEVICE SAVE</div>
            <div style="font-size: 1.05rem; color: #f8fafc; font-weight: bold;">Supabase PostgreSQL Backend</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Real-time Telemetry, Shift State & Achievement Tracking</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">NARRATIVE DESIGN & COGNITIVE LORE</div>
            <div style="font-size: 1.05rem; color: #f8fafc; font-weight: bold;">Project Echo Research Group</div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Simulated Reality Theory & Psychological Horror Storyline</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 0.75rem; color: #8a8f98; letter-spacing: 3px; font-weight: bold;">SPECIAL THANKS</div>
            <div style="font-size: 0.95rem; color: #f8fafc;">To all brave operators who descended into Sector 09,</div>
            <div style="font-size: 0.85rem; color: #cbd5e1;">faced the echoes of forgotten transmissions,</div>
            <div style="font-size: 0.85rem; color: #9aa0aa;">and sought the truth behind the screens.</div>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 28px; margin-top: 18px;">
            <div style="font-size: 0.85rem; color: #64748b; letter-spacing: 2px;">
              &ldquo;The signal never truly ends. It only shifts its frequency.&rdquo;
            </div>
            <div style="font-size: 0.7rem; color: #475569; margin-top: 14px;">
              &copy; 2049 SECTOR 09 SIMULATION DIVISION. ALL RIGHTS RESERVED.
            </div>
          </div>

          <div style="margin-top: 40px;">
            <button id="cred-bottom-close-btn" style="background: transparent; border: 1px solid #9aa0aa; color: #9aa0aa; padding: 10px 28px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: bold; letter-spacing: 2px;">
              [ KEMBALI KE MENU UTAMA ]
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Prevent clicks from engaging pointer lock
    this.container.addEventListener('click', (e) => e.stopPropagation());
    this.container.addEventListener('mousedown', (e) => e.stopPropagation());

    this.viewport = document.getElementById('cred-scroll-viewport');
    this.closeBtn = document.getElementById('cred-close-btn');
    this.bottomCloseBtn = document.getElementById('cred-bottom-close-btn');
    this.toggleScrollBtn = document.getElementById('cred-toggle-scroll');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.bottomCloseBtn.addEventListener('click', () => this.hide());

    this.toggleScrollBtn.addEventListener('click', () => {
      this.isAutoScroll = !this.isAutoScroll;
      this.toggleScrollBtn.textContent = `[ AUTO-SCROLL: ${this.isAutoScroll ? 'ON' : 'OFF'} ]`;
      this.toggleScrollBtn.style.color = this.isAutoScroll ? '#9aa0aa' : '#94a3b8';
    });

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  show() {
    this.isOpen = true;
    this.container.style.display = 'flex';
    if (this.viewport) this.viewport.scrollTop = 0;
    this.isAutoScroll = true;
    if (this.toggleScrollBtn) {
      this.toggleScrollBtn.textContent = '[ AUTO-SCROLL: ON ]';
      this.toggleScrollBtn.style.color = '#9aa0aa';
    }

    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const loop = () => {
      if (!this.isOpen) return;
      if (this.isAutoScroll && this.viewport) {
        this.viewport.scrollTop += this.scrollSpeed;
        if (this.viewport.scrollTop + this.viewport.clientHeight >= this.viewport.scrollHeight - 4) {
          this.isAutoScroll = false;
          if (this.toggleScrollBtn) this.toggleScrollBtn.textContent = '[ AUTO-SCROLL: FINISHED ]';
        }
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.style.display = 'none';
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.onClose) this.onClose();
  }
}
