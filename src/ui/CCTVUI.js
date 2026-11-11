export class CCTVUI {
  constructor(cctvSystem, anomalyManager, audioManager) {
    this.cctv = cctvSystem;
    this.anomalyManager = anomalyManager;
    this.audio = audioManager;
    this.isOpen = false;
    this.onClose = null;

    this.feedCanvases = [];
    this.feedContexts = [];
    this.focusedCamIndex = -1; // -1 = 2x2 grid, 0..3 = focused single cam

    this.lastRenderTime = 0;
    this.fpsInterval = 1000 / 12; // 12 FPS security camera refresh rate

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'cctv-ui';
    this.container.innerHTML = `
      <div class="cctv-header">
        <div style="display:flex; align-items:center; gap:12px;">
          <span id="cctv-header-title">SECURITY SURVEILLANCE NETWORK // 4 CHANNELS ACTIVE</span>
          <span style="font-size:0.7rem; color:#22c55e; background:#062312; border:1px solid #166534; padding:2px 6px; border-radius:2px;">● LIVE TELEMETRY</span>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button id="cctv-header-grid-btn" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; cursor:pointer; padding:5px 12px; font-family:'Courier New',monospace; font-size:0.75rem; font-weight:bold;">[ ⛶ 2x2 GRID ]</button>
          <button id="cctv-close-btn" style="background:#450a0a; border:1px solid #ef4444; color:#fca5a5; cursor:pointer; padding:5px 14px; font-family:'Courier New',monospace; font-size:0.75rem; font-weight:bold;">[ ✖ CLOSE (ESC/E) ]</button>
        </div>
      </div>
      
      <div class="cctv-grid" id="cctv-grid-container"></div>
      
      <div class="cctv-controls">
        <div style="display:flex; gap:6px;">
          <button id="cctv-btn-all" class="active" style="border-color:#38bdf8; color:#38bdf8;">GRID (2x2)</button>
          <button id="cctv-btn-cam1">CAM 01: HUB</button>
          <button id="cctv-btn-cam2">CAM 02: LAB</button>
          <button id="cctv-btn-cam3">CAM 03: HALL</button>
          <button id="cctv-btn-cam4">CAM 04: CORE</button>
        </div>
        
        <div style="display:flex; gap:8px; align-items:center;">
          <select id="cctv-anomaly-select" style="background:#111; color:#da4; border:1px solid #444; padding:5px 8px; font-family:'Courier New',monospace; font-size:0.75rem;">
            <option value="">-- SELECT DETECTED ANOMALY --</option>
            <option value="figure">Humanoid Figure / Shadow</option>
            <option value="object_moved">Displaced Object / Equipment</option>
            <option value="camera_distortion">Camera Static / Video Glitch</option>
            <option value="impossible_room">Room Layout Contradiction</option>
            <option value="writing_wall">Writing / Blood On Surface</option>
            <option value="light_flicker">Electrical / Lighting Anomaly</option>
          </select>
          <button id="cctv-report-submit-btn" style="border-color:#ef4444; color:#ef4444; font-weight:bold; cursor:pointer; padding:5px 14px; font-family:'Courier New',monospace;">[ TRANSMIT REPORT ]</button>
        </div>
      </div>
      
      <div id="cctv-report-feedback" style="display:none; padding:8px 14px; background:#0c1a12; border-top:1px solid #166534; color:#4ade80; font-size:0.75rem; letter-spacing:1px;"></div>
    `;
    document.body.appendChild(this.container);

    const grid = document.getElementById('cctv-grid-container');
    const feeds = this.cctv.getFeeds();

    feeds.forEach((feed, idx) => {
      const feedDiv = document.createElement('div');
      feedDiv.className = 'cctv-feed';
      feedDiv.id = `cctv-feed-box-${idx}`;
      feedDiv.innerHTML = `
        <canvas width="320" height="240"></canvas>
        <div class="scanlines"></div>
        <div class="feed-label">${feed.id} : ${feed.name}</div>
        <div class="feed-time" id="feed-time-${idx}">00:00:00</div>
        <div class="feed-overlay-btn" id="feed-overlay-btn-${idx}" style="display:none; position:absolute; top:12px; left:12px; z-index:25; background:rgba(15,23,42,0.95); border:1px solid #38bdf8; color:#38bdf8; font-size:0.75rem; padding:8px 16px; cursor:pointer; font-weight:bold; font-family:'Courier New',monospace; box-shadow:0 0 12px rgba(0,0,0,0.9);">◀ RETURN TO 4-CAM GRID (ESC)</div>
        <div class="feed-overlay-exit" id="feed-overlay-exit-${idx}" style="display:none; position:absolute; top:12px; right:12px; z-index:25; background:rgba(153,27,27,0.95); border:1px solid #ef4444; color:#fff; font-size:0.75rem; padding:8px 16px; cursor:pointer; font-weight:bold; font-family:'Courier New',monospace; box-shadow:0 0 12px rgba(0,0,0,0.9);">✖ CLOSE SURVEILLANCE (E)</div>
      `;

      // Direct listeners on overlay buttons for 100% reliable clicks
      const ovBtn = feedDiv.querySelector(`#feed-overlay-btn-${idx}`);
      const ovExit = feedDiv.querySelector(`#feed-overlay-exit-${idx}`);
      ovBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleFocus(-1);
      });
      ovExit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });

      // Clicking feed body toggles between single cam focus and 2x2 grid
      feedDiv.addEventListener('click', (e) => {
        if (e.target && (e.target.classList.contains('feed-overlay-exit') || e.target.classList.contains('feed-overlay-btn'))) {
          return;
        }
        if (this.focusedCamIndex === idx) {
          this._toggleFocus(-1);
        } else {
          this._toggleFocus(idx);
        }
      });
      grid.appendChild(feedDiv);

      const canvas = feedDiv.querySelector('canvas');
      this.feedCanvases.push(canvas);
      this.feedContexts.push(canvas.getContext('2d'));
    });

    // Control buttons
    document.getElementById('cctv-close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });
    document.getElementById('cctv-header-grid-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleFocus(-1);
    });
    document.getElementById('cctv-btn-all').addEventListener('click', () => this._toggleFocus(-1));
    document.getElementById('cctv-btn-cam1').addEventListener('click', () => this._toggleFocus(0));
    document.getElementById('cctv-btn-cam2').addEventListener('click', () => this._toggleFocus(1));
    document.getElementById('cctv-btn-cam3').addEventListener('click', () => this._toggleFocus(2));
    document.getElementById('cctv-btn-cam4').addEventListener('click', () => this._toggleFocus(3));

    // Anomaly report button
    document.getElementById('cctv-report-submit-btn').addEventListener('click', () => {
      const select = document.getElementById('cctv-anomaly-select');
      const val = select.value;
      if (!val) {
        this._showFeedback('PLEASE SELECT AN ANOMALY CATEGORY FROM THE DROPDOWN.', '#fbbf24');
        return;
      }

      if (this.anomalyManager) {
        const res = this.anomalyManager.reportAnomaly(val);
        this._showFeedback(res.text, res.correct ? '#4ade80' : '#f87171');
        if (this.audio) {
          if (res.correct) this.audio.playNotification();
          else this.audio.playRadioStatic(0.5);
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (this.focusedCamIndex !== -1) {
          // If in focused camera view, first Escape returns to 4-camera grid
          this._toggleFocus(-1);
        } else {
          // If in 4-camera grid, Escape closes CCTV
          this.hide();
        }
      } else if (e.code === 'KeyE') {
        // Debounce: ignore KeyE if CCTV was opened less than 280ms ago to prevent instant auto-close
        if (performance.now() - (this.openTimestamp || 0) < 280) return;
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  _showFeedback(text, color) {
    const el = document.getElementById('cctv-report-feedback');
    if (!el) return;
    el.style.display = 'block';
    el.style.color = color;
    el.textContent = text;
    setTimeout(() => {
      el.style.display = 'none';
    }, 4500);
  }

  _toggleFocus(idx) {
    if (this.focusedCamIndex === idx && idx !== -1) {
      idx = -1;
    }
    this.focusedCamIndex = idx;
    if (this.audio) this.audio.playRadioStatic(0.18);

    const grid = document.getElementById('cctv-grid-container');
    const headerTitle = document.getElementById('cctv-header-title');

    // Update bottom button highlights
    const btnIds = ['cctv-btn-cam1', 'cctv-btn-cam2', 'cctv-btn-cam3', 'cctv-btn-cam4'];
    document.getElementById('cctv-btn-all').style.borderColor = (idx === -1) ? '#38bdf8' : '#334155';
    document.getElementById('cctv-btn-all').style.color = (idx === -1) ? '#38bdf8' : '#94a3b8';
    btnIds.forEach((id, i) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.style.borderColor = (idx === i) ? '#38bdf8' : '#334155';
        btn.style.color = (idx === i) ? '#38bdf8' : '#94a3b8';
      }
    });

    if (idx === -1) {
      // 2x2 grid mode
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr 1fr';
      grid.style.gridTemplateRows = '1fr 1fr';
      for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`cctv-feed-box-${i}`);
        if (box) {
          box.style.display = 'flex';
          box.style.height = '100%';
        }
        const overlayBtn = document.getElementById(`feed-overlay-btn-${i}`);
        if (overlayBtn) overlayBtn.style.display = 'none';
        const overlayExit = document.getElementById(`feed-overlay-exit-${i}`);
        if (overlayExit) overlayExit.style.display = 'none';
      }
      headerTitle.textContent = 'SECURITY SURVEILLANCE NETWORK // 4 CHANNELS ACTIVE';
    } else {
      // Single focused camera
      grid.style.display = 'flex';
      for (let i = 0; i < 4; i++) {
        const box = document.getElementById(`cctv-feed-box-${i}`);
        if (box) {
          box.style.display = (i === idx) ? 'flex' : 'none';
          box.style.height = '100%';
          box.style.width = '100%';
        }
        const overlayBtn = document.getElementById(`feed-overlay-btn-${i}`);
        if (overlayBtn) overlayBtn.style.display = (i === idx) ? 'block' : 'none';
        const overlayExit = document.getElementById(`feed-overlay-exit-${i}`);
        if (overlayExit) overlayExit.style.display = (i === idx) ? 'block' : 'none';
      }
      const feeds = this.cctv.getFeeds();
      headerTitle.textContent = `FOCUSED VIEW: ${feeds[idx].id} - ${feeds[idx].name} (CLICK ANYWHERE OR ESC TO RETURN TO GRID)`;
    }
  }

  show() {
    this.openTimestamp = performance.now();
    this.isOpen = true;
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    this._toggleFocus(-1);
    if (this.onClose) this.onClose();
  }

  update() {
    if (!this.isOpen) return;

    const now = performance.now();
    if (now - this.lastRenderTime < this.fpsInterval) return;
    this.lastRenderTime = now;

    // Render 3D CCTV views into render targets
    this.cctv.renderFeeds();

    const feeds = this.cctv.getFeeds();
    const d = new Date();
    const timeStr = d.toTimeString().split(' ')[0] + '.' + Math.floor(d.getMilliseconds() / 100);

    const activeAnomalies = this.anomalyManager ? this.anomalyManager.activeAnomalies : new Map();

    for (let i = 0; i < feeds.length; i++) {
      // Skip if in focused mode and not this camera
      if (this.focusedCamIndex !== -1 && this.focusedCamIndex !== i) continue;

      const ctx = this.feedContexts[i];
      const rt = feeds[i].renderTarget;
      const width = rt.width;
      const height = rt.height;

      const buffer = new Uint8Array(width * height * 4);
      this.cctv.renderer.readRenderTargetPixels(rt, 0, 0, width, height, buffer);

      const imgData = ctx.createImageData(width, height);
      const isCorrupted = activeAnomalies.has('camera_distortion') && (i === 1 || i === 3);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIdx = (y * width + x) * 4;
          const dstIdx = ((height - 1 - y) * width + x) * 4;

          const r = buffer[srcIdx];
          const g = buffer[srcIdx + 1];
          const b = buffer[srcIdx + 2];
          let lum = r * 0.3 + g * 0.59 + b * 0.11;

          if (isCorrupted && Math.random() < 0.25) {
            lum = Math.random() * 255; // static glitch
          }

          // Authentic CCTV phosphor green grading
          imgData.data[dstIdx] = lum * 0.55;
          imgData.data[dstIdx + 1] = Math.min(255, lum * 0.95 + 15);
          imgData.data[dstIdx + 2] = lum * 0.65;
          imgData.data[dstIdx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Render overlay anomaly silhouettes or warnings directly on canvas!
      if (activeAnomalies.has('cctv_figure_behind') && i === 0) {
        // Draw eerie shadowy humanoid figure on CAM 01
        ctx.fillStyle = 'rgba(5, 5, 8, 0.88)';
        ctx.beginPath();
        ctx.arc(160, 95, 14, 0, Math.PI * 2); // head
        ctx.fill();
        ctx.fillRect(145, 110, 30, 75); // torso
        // Glowing white pinprick eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(156, 94, 2, 2);
        ctx.fillRect(162, 94, 2, 2);
      }

      if (activeAnomalies.has('shadow_hallway') && i === 2) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(190 + Math.sin(now * 0.002) * 20, 80, 45, 120);
      }

      // Timestamp
      const timeEl = document.getElementById(`feed-time-${i}`);
      if (timeEl) timeEl.textContent = timeStr;
    }
  }
}
