export class FacilityMapUI {
  constructor(storyManager, playerController) {
    this.story = storyManager;
    this.player = playerController;
    this.isOpen = false;
    this.onClose = null;
    this.animFrameId = null;
    this.radarAngle = 0;

    // Discovered rooms set (starts with control_room and corridor revealed, but blueprint shows all architectural zones)
    this.discoveredRooms = new Set(['control_room', 'corridor']);

    // Architectural layout metadata for 2D Tactical Blueprint rendering
    this.roomDefs = {
      'control_room': {
        name: 'RUANG KONTROL',
        code: 'SEC-01',
        x: 0, z: 0, w: 14, d: 14,
        color: '#9aa0aa',
        subtext: 'TERMINAL UTAMA / CCTV / RADIO'
      },
      'corridor': {
        name: 'LORONG UTAMA TRANSIT',
        code: 'TRN-02',
        x: 4, z: 12.5, w: 80, d: 5,
        color: '#64748b',
        subtext: 'TEROWONGAN PENGHUBUNG BUNKER'
      },
      'research_lab': {
        name: 'LABORATORIUM RISET C',
        code: 'LAB-03',
        x: 0, z: -23, w: 18, d: 16,
        color: '#7a808a',
        subtext: 'ISOLASI SPESIMEN & ANALISIS'
      },
      'electrical_room': {
        name: 'SUBSTASI LISTRIK',
        code: 'PWR-04',
        x: -20, z: 4, w: 12, d: 12,
        color: '#8a8f98',
        subtext: 'GENERATOR DIESEL & SAKLAR UTAMA'
      },
      'medical_room': {
        name: 'RUANG MEDIS & KARANTINA',
        code: 'MED-05',
        x: 20, z: 4, w: 12, d: 12,
        color: '#7a808a',
        subtext: 'RANJANG TRAUMA & REKAM MEDIS'
      },
      'storage_room': {
        name: 'STORAGE BAY A (GUDANG)',
        code: 'STR-06',
        x: -20, z: 21, w: 12, d: 12,
        color: '#6b7280',
        subtext: 'RAK LOGISTIK & KARTU AKSES'
      },
      'comm_room': {
        name: 'RUANG KOMUNIKASI RF',
        code: 'COM-07',
        x: 20, z: 21, w: 12, d: 12,
        color: '#a3aab5',
        subtext: 'PEMANCAR FREKUENSI 47.3 HZ'
      },
      'elevator': {
        name: 'ELEVATOR PERMUKAAN',
        code: 'LIFT-08',
        x: -39, z: 12.5, w: 6, d: 6,
        color: '#b71c1c',
        subtext: 'POROS HOIST DARURAT (TERKUNCI)'
      },
      'archive_room': {
        name: 'RUANG ARSIP TERLARANG',
        code: 'ARC-09',
        x: 44, z: -11, w: 16, d: 14,
        color: '#6b7280',
        locked: true,
        unlockKey: 'archive_keycard',
        subtext: 'DOKUMEN RAHASIA PROYEK ECHO'
      },
      'secret_chamber': {
        name: 'RUANG REAKTOR ECHO',
        code: 'CORE-10',
        x: 44, z: -27, w: 18, d: 18,
        color: '#7a808a',
        locked: true,
        unlockKey: 'chamber_code',
        subtext: 'KONSOL PEMANCAR KESADARAN'
      }
    };

    // CCTV camera locations on tactical blueprint
    this.cameras = [
      { id: 'CAM 01', name: 'SEC HUB', x: 0, z: -2.2, dirAngle: Math.PI / 2 },
      { id: 'CAM 02', name: 'RESEARCH LAB', x: 0, z: -23, dirAngle: -Math.PI / 2 },
      { id: 'CAM 03', name: 'TRANSIT HALL', x: 0, z: 12.5, dirAngle: 0 },
      { id: 'CAM 04', name: 'ECHO CORE', x: 44, z: -27, dirAngle: -Math.PI / 2 }
    ];

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'facility-map-ui';
    this.container.style.cssText = `
      position: fixed; inset: 24px; z-index: 14000; background: rgba(3, 7, 18, 0.98);
      border: 2px solid #9aa0aa; display: none; flex-direction: column;
      font-family: 'Courier New', monospace; box-shadow: 0 0 60px rgba(56,189,248,0.3);
      backdrop-filter: blur(12px); overflow: hidden;
    `;

    this.container.innerHTML = `
      <div style="padding: 10px 18px; background: #0b1329; border-bottom: 2px solid #1e293b; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="color: #9aa0aa; font-weight: bold; font-size: 0.95rem; letter-spacing: 2px;">SEKTOR 09 // CETAK BIRU TAKTIS FASILITAS</span>
          <span style="font-size: 0.7rem; color: #8a8f98; background: #111827; border: 1px solid #374151; padding: 2px 8px; border-radius: 2px;">● RADAR PEMANTAU AKTIF</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span style="font-size: 0.72rem; color: #94a3b8;">TEKAN [M], [ESC] ATAU [E] UNTUK KELUAR</span>
          <button id="map-close-btn" style="background: #2a0f12; border: 1px solid #b71c1c; color: #c7ccd4; padding: 4px 14px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: bold;">[ ✖ TUTUP (ESC/E) ]</button>
        </div>
      </div>

      <div style="flex: 1; min-height: 0; position: relative; overflow: hidden; display: flex;">
        <canvas id="map-canvas" style="flex: 1; width: 100%; height: 100%; display: block; background: #020610;"></canvas>

        <div style="width: 320px; background: rgba(11,19,41,0.96); border-left: 2px solid #1e293b; padding: 18px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex-shrink: 0;">
          <div style="font-size: 0.8rem; color: #9aa0aa; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            TELEMETRI MISI
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8;">
            GILIRAN JAGA: <span id="map-night-val" style="color: #8a8f98; font-weight: bold;">MALAM 1 : KEDATANGAN</span>
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8;">
            TARGET UTAMA:
            <div id="map-obj-val" style="color: #e2e8f0; margin-top: 6px; font-size: 0.72rem; line-height: 1.5; border-left: 3px solid #b71c1c; padding-left: 10px; background: rgba(239,68,68,0.06); padding-top: 4px; padding-bottom: 4px;">
              Pulihkan listrik fasilitas.
            </div>
          </div>

          <div style="font-size: 0.8rem; color: #9aa0aa; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-top: 8px;">
            PENGAWASAN KAMERA CCTV
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.72rem;">
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 01: SECURITY HUB</span> <span style="color:#8a8f98;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 02: RESEARCH LAB</span> <span style="color:#8a8f98;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 03: TRANSIT HALL</span> <span style="color:#8a8f98;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 04: ECHO CORE</span> <span style="color:#8a8f98;">[ANOMALOUS]</span>
            </div>
          </div>

          <div style="font-size: 0.8rem; color: #9aa0aa; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-top: 8px;">
            LEGENDA CETAK BIRU
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.72rem; color: #cbd5e1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#b71c1c; font-size:1.1rem; line-height:1;">▲</span> <span>LOKASI & ARAH PANDANG PEMAIN</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#9aa0aa; font-size:1rem; line-height:1;">◉</span> <span>TITIK KAMERA PENGAWAS CCTV</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:12px; height:12px; background:rgba(56,189,248,0.25); border:1px solid #9aa0aa;"></span> <span>AREA SUDAH DIJELAJAHI</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:12px; height:12px; background:rgba(15,23,42,0.6); border:1px dashed #64748b;"></span> <span>SEKTOR BELUM DIJELAJAHI</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#b71c1c; font-weight:bold;">[TERKUNCI]</span> <span>PINTU AKSES KEAMANAN</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#8a8f98; font-weight:bold;">[TERBUKA]</span> <span>PINTU BERHASIL DIBUKA</span>
            </div>
          </div>

          <div style="margin-top: auto; font-size: 0.68rem; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 10px;">
            TELEMETRY FREQ: 47.3 MHz<br/>
            FACILITY DEPTH: -84.2 METERS SUB-SURFACE<br/>
            RADIATION: 0.04 mSv/h (NOMINAL)<br/>
            STATUS: REALITY DEVIATION 2.4%
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Prevent map interactions from leaking to 3D canvas / pointer lock
    this.container.addEventListener('click', (e) => e.stopPropagation());
    this.container.addEventListener('mousedown', (e) => e.stopPropagation());

    this.canvas = document.getElementById('map-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.closeBtn = document.getElementById('map-close-btn');

    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    window.addEventListener('resize', () => {
      if (this.isOpen) this._resizeCanvas();
    });

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && (e.code === 'KeyM' || e.code === 'Escape' || e.code === 'KeyE')) {
        if (e.code === 'KeyE' && performance.now() - (this.openTimestamp || 0) < 280) return;
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor(rect.width) || this.canvas.clientWidth || 800;
    const h = Math.floor(rect.height) || this.canvas.clientHeight || 600;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  toggle() {
    if (this.isOpen) this.hide();
    else this.show();
  }

  show() {
    this.openTimestamp = performance.now();
    this.isOpen = true;
    this.container.style.display = 'flex';

    if (this.player && typeof this.player.unlock === 'function') {
      this.player.unlock();
    }
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    // Update telemetry sidebar with real live story data
    const nightEl = document.getElementById('map-night-val');
    const objEl = document.getElementById('map-obj-val');
    if (this.story) {
      const curr = this.story.getCurrentNight();
      if (curr && nightEl) {
        nightEl.textContent = `NIGHT ${this.story.currentNight} : ${curr.title.toUpperCase()}`;
      }
      if (curr && objEl && curr.objectives) {
        const active = curr.objectives.find(o => !o.completed) || curr.objectives[curr.objectives.length - 1];
        if (active) objEl.textContent = active.text;
      }
    }

    requestAnimationFrame(() => {
      this._resizeCanvas();
      this.render();
    });

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    const loop = () => {
      if (!this.isOpen) return;
      this.radarAngle += 0.025;
      this.render();
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

  updatePlayerDiscovery(playerPos) {
    if (!playerPos) return;

    for (const [id, def] of Object.entries(this.roomDefs)) {
      const hw = def.w / 2 + 1.5;
      const hd = def.d / 2 + 1.5;
      if (
        playerPos.x >= def.x - hw && playerPos.x <= def.x + hw &&
        playerPos.z >= def.z - hd && playerPos.z <= def.z + hd
      ) {
        this.discoveredRooms.add(id);
      }
    }
  }

  render() {
    if (!this.isOpen || !this.ctx) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#020610';
    ctx.fillRect(0, 0, w, h);

    // Draw architectural blueprint coordinate grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Coordinate conversion
    const scale = Math.min(w / 115, h / 80);
    const originX = w / 2 - 2 * scale;
    const originY = h / 2 + 4 * scale;

    const toScreenX = (x3d) => originX + x3d * scale;
    const toScreenY = (z3d) => originY + z3d * scale;

    // Draw Outer Bunker Perimeter Envelope
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(toScreenX(-46), toScreenY(-37), 104 * scale, 68 * scale);
    ctx.setLineDash([]);

    // ── 1. RENDER INTERCONNECTING ARCHITECTURAL CORRIDORS ──
    const drawCorridor = (x1, z1, x2, z2, width = 4.5) => {
      const sx = toScreenX(Math.min(x1, x2) - width / 2);
      const sy = toScreenY(Math.min(z1, z2) - width / 2);
      const sw = (Math.abs(x2 - x1) || width) * scale;
      const sh = (Math.abs(z2 - z1) || width) * scale;

      // Floor
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(sx, sy, sw, sh);

      // Floor tiles center guide line
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toScreenX(x1), toScreenY(z1));
      ctx.lineTo(toScreenX(x2), toScreenY(z2));
      ctx.stroke();
      ctx.setLineDash([]);

      // Walls
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx, sy, sw, sh);
    };

    // Main East-West Transit Highway
    drawCorridor(-38, 12.5, 32, 12.5, 4.8);
    // North Hub Corridor to Lab
    drawCorridor(0, -7, 0, -15, 4.0);
    // South Hub Connector to Main Corridor
    drawCorridor(0, 7, 0, 12.5, 4.0);
    // West Wing Corridors to Electrical & Storage
    drawCorridor(-20, 10, -20, 12.5, 4.0);
    drawCorridor(-20, 12.5, -20, 15, 4.0);
    // East Wing Corridors to Medical & Comms
    drawCorridor(20, 10, 20, 12.5, 4.0);
    drawCorridor(20, 12.5, 20, 15, 4.0);
    // Far East Approach to Archive & Secret Chamber
    drawCorridor(30, 12.5, 44, 12.5, 4.0);
    drawCorridor(44, 12.5, 44, -4, 4.2);
    // Secret Chamber Catwalk Corridor
    drawCorridor(44, -18, 44, -20, 3.6);

    // ── 2. RENDER ROOMS WITH REAL ARCHITECTURAL SCHEMATICS ──
    for (const [id, def] of Object.entries(this.roomDefs)) {
      if (id === 'corridor') continue; // Handled by detailed corridor renderer
      const isDiscovered = this.discoveredRooms.has(id);
      const rx = toScreenX(def.x - def.w / 2);
      const ry = toScreenY(def.z - def.d / 2);
      const rw = def.w * scale;
      const rd = def.d * scale;

      if (isDiscovered) {
        // Explored room: High-tech architectural blueprint floor
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.fillRect(rx, ry, rw, rd);

        // Internal room sub-grid (2-meter tile lines)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 0.8;
        const tileStep = 3 * scale;
        for (let gx = rx + tileStep; gx < rx + rw; gx += tileStep) {
          ctx.beginPath(); ctx.moveTo(gx, ry); ctx.lineTo(gx, ry + rd); ctx.stroke();
        }
        for (let gy = ry + tileStep; gy < ry + rd; gy += tileStep) {
          ctx.beginPath(); ctx.moveTo(rx, gy); ctx.lineTo(rx + rw, gy); ctx.stroke();
        }

        // Reinforced double concrete walls
        ctx.strokeStyle = def.color || '#9aa0aa';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx, ry, rw, rd);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx + 2, ry + 2, rw - 4, rd - 4);

        // Corner structural reinforced pillars
        const bSize = Math.min(6, scale * 0.9);
        ctx.fillStyle = def.color || '#9aa0aa';
        ctx.fillRect(rx, ry, bSize, bSize);
        ctx.fillRect(rx + rw - bSize, ry, bSize, bSize);
        ctx.fillRect(rx, ry + rd - bSize, bSize, bSize);
        ctx.fillRect(rx + rw - bSize, ry + rd - bSize, bSize);

        // ── 3. INTERNAL ARCHITECTURAL FURNITURE & MACHINERY SCHEMATICS ──
        this._drawInternalSchematics(ctx, id, rx, ry, rw, rd, scale, toScreenX, toScreenY);

        // Room Header & Code
        ctx.fillStyle = def.color || '#9aa0aa';
        ctx.font = `bold ${Math.max(10, Math.floor(scale * 1.5))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.name, rx + rw / 2, ry + 12);

        // Subtext / Room Code
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${Math.max(7.5, Math.floor(scale * 1.05))}px monospace`;
        ctx.fillText(def.code + ' // ' + (def.subtext || ''), rx + rw / 2, ry + 24);
      } else {
        // Unexplored room: Blueprint schematic with diagonal crosshatch
        ctx.fillStyle = 'rgba(11, 19, 41, 0.55)';
        ctx.fillRect(rx, ry, rw, rd);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(rx, ry, rw, rd);
        ctx.setLineDash([]);

        // Room Schematic Name
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = `bold ${Math.max(9, Math.floor(scale * 1.3))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.name, rx + rw / 2, ry + rd / 2 - 4);

        ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.font = `${Math.max(7, Math.floor(scale * 0.95))}px monospace`;
        ctx.fillText(def.code + ' [BELUM DIJELAJAHI]', rx + rw / 2, ry + rd / 2 + 10);
      }

      // Security access badge
      if (def.locked) {
        const isUnlocked = this.story && this.story.hasItem('archive_keycard') && id === 'archive_room';
        const isChamberOpen = this.story && this.story.currentNightIndex >= 4;
        const open = isUnlocked || isChamberOpen;

        ctx.fillStyle = open ? '#8a8f98' : '#b71c1c';
        ctx.font = 'bold 8.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(open ? '🔓 [OTORISASI TERBUKA]' : '🔒 [AKSES TERKUNCI: BUTUH KUNCI/KODE]', rx + rw / 2, ry + rd - 9);
      }
    }

    // ── 4. RENDER ARCHITECTURAL DOORWAYS & SWING ARCS ──
    const drawDoorArc = (x, z, width = 3.2, isVertical = false, swingDir = 1) => {
      const dx = toScreenX(x);
      const dy = toScreenY(z);
      const dw = width * scale;

      // Door opening frame
      ctx.fillStyle = '#8a8f98';
      if (isVertical) {
        ctx.fillRect(dx - 2, dy - dw / 2, 4, dw);
      } else {
        ctx.fillRect(dx - dw / 2, dy - 2, dw, 4);
      }

      // Door swing dashed arc (classic architectural CAD symbol)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      if (isVertical) {
        ctx.arc(dx, dy - dw / 2, dw, 0, Math.PI / 2 * swingDir);
      } else {
        ctx.arc(dx - dw / 2, dy, dw, 0, Math.PI / 2 * swingDir);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawDoorArc(0, -7.0, 3.2, false, 1);   // Control North Door
    drawDoorArc(0, 7.0, 3.2, false, -1);   // Control South Door
    drawDoorArc(0, -15.0, 3.2, false, 1);  // Lab C Entrance Door
    drawDoorArc(-20, 10.0, 3.2, false, 1); // Electrical Door
    drawDoorArc(-20, 15.0, 3.2, false, -1);// Storage Bay A Door
    drawDoorArc(20, 10.0, 3.2, false, 1);  // Medical Ward Door
    drawDoorArc(20, 15.0, 3.2, false, -1); // Comm Room Door
    drawDoorArc(44, -4.0, 3.2, false, 1);  // Archive Vault Door
    drawDoorArc(44, -18.0, 3.2, false, 1); // Secret Chamber Door

    // ── 5. RENDER CCTV CAMERA SCAN CONES ──
    this.cameras.forEach((cam, i) => {
      const cx = toScreenX(cam.x);
      const cy = toScreenY(cam.z);

      // Camera base icon
      ctx.fillStyle = '#9aa0aa';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping vision cone
      const swing = Math.sin(this.radarAngle * 1.5 + i) * 0.35;
      const fovAngle = cam.dirAngle + swing;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 26 * scale * 0.6, fovAngle - 0.45, fovAngle + 0.45);
      ctx.closePath();
      ctx.fill();

      // Camera label
      ctx.fillStyle = '#9aa0aa';
      ctx.font = 'bold 7.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cam.id, cx, cy - 6);
    });

    // Radar Sweep Line across entire map
    const sweepCenterX = originX + 4 * scale;
    const sweepCenterY = originY + 12.5 * scale;
    const sweepRadius = 55 * scale;
    const endX = sweepCenterX + Math.cos(this.radarAngle) * sweepRadius;
    const endY = sweepCenterY + Math.sin(this.radarAngle) * sweepRadius;

    const grad = ctx.createLinearGradient(sweepCenterX, sweepCenterY, endX, endY);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sweepCenterX, sweepCenterY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Render Real-Time Animated Player Marker
    if (this.player) {
      const pos = this.player.getPosition();
      const px = toScreenX(pos.x);
      const py = toScreenY(pos.z);
      const dir = this.player.getDirection();
      const angle = Math.atan2(dir.x, -dir.z);

      // Player pulse ring
      const time = performance.now() * 0.005;
      const pulseR = 9 + Math.sin(time) * 4;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary wider ripple
      const rippleR = 14 + ((time * 8) % 18);
      const rippleAlpha = Math.max(0, 1 - (rippleR - 14) / 18) * 0.4;
      ctx.strokeStyle = `rgba(239, 68, 68, ${rippleAlpha})`;
      ctx.beginPath();
      ctx.arc(px, py, rippleR, 0, Math.PI * 2);
      ctx.stroke();

      // Heading cone / Flashlight beam
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 35, -Math.PI / 5, Math.PI / 5);
      ctx.closePath();
      ctx.fill();

      // Red Player triangle
      ctx.fillStyle = '#b71c1c';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(-6, -6);
      ctx.lineTo(6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Player coordinates display below marker
      ctx.fillStyle = '#c7ccd4';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`YOU [X:${pos.x.toFixed(1)} Z:${pos.z.toFixed(1)}]`, px, py + 18);
    }

    // Render Active Objective Waypoint Target Beacon
    const targetLoc = this._getTargetLocation();
    if (targetLoc) {
      const tx = toScreenX(targetLoc.x);
      const ty = toScreenY(targetLoc.z);

      const time = performance.now() * 0.004;
      const pulseR = 12 + Math.sin(time * 2) * 5;

      // Pulsing golden ring
      ctx.strokeStyle = '#8a8f98';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // Outer expanding radar ping
      const pingR = 14 + ((time * 12) % 20);
      const pingAlpha = Math.max(0, 1 - (pingR - 14) / 20) * 0.7;
      ctx.strokeStyle = `rgba(245, 158, 11, ${pingAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, pingR, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair brackets
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      const bSize = 6;
      ctx.beginPath();
      ctx.moveTo(tx - bSize - 4, ty); ctx.lineTo(tx - 4, ty);
      ctx.moveTo(tx + 4, ty); ctx.lineTo(tx + bSize + 4, ty);
      ctx.moveTo(tx, ty - bSize - 4); ctx.lineTo(tx, ty - 4);
      ctx.moveTo(tx, ty + 4); ctx.lineTo(tx, ty + bSize + 4);
      ctx.stroke();

      // Target Label
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🎯 ${targetLoc.name}`, tx, ty - pulseR - 6);
      ctx.fillStyle = '#8a8f98';
      ctx.font = '7.5px monospace';
      ctx.fillText(`[${targetLoc.hint}]`, tx, ty + pulseR + 10);
    }

    // Update Telemetry Panel text
    if (this.story) {
      const currNight = this.story.getCurrentNight();
      const nightEl = document.getElementById('map-night-val');
      const objEl = document.getElementById('map-obj-val');

      if (nightEl && currNight) nightEl.textContent = `${currNight.title} : ${currNight.subtitle}`;
      if (objEl && currNight) {
        const pending = currNight.objectives.find(o => !o.completed);
        objEl.textContent = pending ? pending.text : 'Semua protokol aktif telah terpenuhi.';
      }
    }
  }

  _getTargetLocation() {
    if (!this.story) return null;
    const currNight = this.story.getCurrentNight();
    if (!currNight || !currNight.objectives) return null;
    const active = currNight.objectives.find(o => !o.completed);
    if (!active) return null;

    const targets = {
      'n1_enter': { x: 0, z: 0, name: 'RUANG KONTROL', hint: 'Lobi Tengah (SEC-01)' },
      'n1_power': { x: -20, z: 4, name: 'SUBSTASI LISTRIK', hint: 'Lorong Barat (PWR-04)' },
      'n1_cctv': { x: 1.8, z: -1.8, name: 'KONSOL CCTV', hint: 'Meja Ruang Kontrol' },
      'n1_report': { x: -1.8, z: -1.8, name: 'TERMINAL KOMPUTER', hint: 'Meja Ruang Kontrol' },
      'n1_radio': { x: 0, z: -2.2, name: 'TRANSCEIVER RADIO', hint: 'Meja Ruang Kontrol' },
      'n2_cctv': { x: 1.8, z: -1.8, name: 'KONSOL CCTV', hint: 'Meja Ruang Kontrol' },
      'n2_medical': { x: 20, z: 4, name: 'RUANG MEDIS', hint: 'Lorong Timur (MED-05)' },
      'n2_document': { x: 16.5, z: 4.0, name: 'DOKUMEN SUBJEK 12', hint: 'Meja Ruang Medis' },
      'n2_password': { x: -1.8, z: -1.8, name: 'TERMINAL KOMPUTER', hint: 'Ruang Kontrol (Kode 997)' },
      'n2_report': { x: -1.8, z: -1.8, name: 'TERMINAL KOMPUTER', hint: 'Ruang Kontrol (Ketik lapor)' },
      'n3_comms': { x: 20, z: 21, name: 'RUANG KOMUNIKASI', hint: 'Lorong Timur Selatan (COM-07)' },
      'n3_listen': { x: 0, z: -2.2, name: 'RADIO KOMUNIKASI', hint: 'Ruang Kontrol / Komunikasi' },
      'n3_recording': { x: 19.6, z: 24.5, name: 'TUNER FREKUENSI', hint: 'Ruang Komunikasi (47.3 Hz)' },
      'n3_compare': { x: 21.6, z: 24.5, name: 'CATATAN DOKUMEN', hint: 'Meja Ruang Komunikasi' },
      'n3_decide': { x: 0, z: -2.2, name: 'RADIO KOMUNIKASI', hint: 'Ruang Kontrol' },
      'n4_leave': { x: 0, z: 12.5, name: 'LORONG UTAMA', hint: 'Keluar ke Lorong Transit' },
      'n4_power': { x: -20, z: 4, name: 'SUBSTASI LISTRIK', hint: 'Lorong Barat (PWR-04)' },
      'n4_keycard': { x: -20, z: 21, name: 'KARTU AKSES ARSIP', hint: 'Meja Storage Bay A (Gudang Barat)' },
      'n4_escape': { x: 30, z: 12.5, name: 'LORONG TIMUR', hint: 'Menuju Ruang Arsip' },
      'n4_archive': { x: 44, z: -3.9, name: 'PINTU ARSIP', hint: 'Pintu Sisi Timur (ARC-09)' },
      'n4_evidence': { x: 39.0, z: -11.0, name: 'BUKTI PROYEK ECHO', hint: 'Di Dalam Ruang Arsip' },
      'n5_chamber': { x: 44, z: -17.9, name: 'PINTU REAKTOR', hint: 'Secret Chamber di balik Arsip' },
      'n5_truth': { x: 43.3, z: -21.5, name: 'DOKUMEN KEBENARAN', hint: 'Ruang Reaktor Rahasia' },
      'n5_logs': { x: 44, z: -11.0, name: 'CATATAN DR. VASQUEZ', hint: 'Meja Ruang Arsip' },
      'n5_signal': { x: 44, z: -20.5, name: 'KONSOL REAKTOR', hint: 'Ruang Reaktor Rahasia' },
      'n5_choice': { x: 44, z: -20.5, name: 'KONSOL PEMANCAR', hint: 'Keputusan Akhir di Reaktor' }
    };

    return targets[active.id] || null;
  }

  _drawInternalSchematics(ctx, id, rx, ry, rw, rd, scale, toScreenX, toScreenY) {
    ctx.save();
    switch (id) {
      case 'control_room': {
        // Center Horseshoe Security Command Desk
        const dw = 7.5 * scale;
        const dd = 4.2 * scale;
        const dx = rx + (rw - dw) / 2;
        const dy = ry + (rd - dd) / 2 + 3 * scale;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = '#9aa0aa';
        ctx.lineWidth = 1.2;
        ctx.fillRect(dx, dy, dw, dd);
        ctx.strokeRect(dx, dy, dw, dd);

        // Screens: Terminal (left), Radio (center), CCTV (right)
        ctx.fillStyle = '#8a8f98';
        ctx.fillRect(dx + 4, dy + 3, dw * 0.25, 4);
        ctx.fillStyle = '#8a8f98';
        ctx.fillRect(dx + dw * 0.38, dy + 2, dw * 0.24, 4);
        ctx.fillStyle = '#9aa0aa';
        ctx.fillRect(dx + dw * 0.7, dy + 3, dw * 0.25, 4);

        // Server Racks on North Wall
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.fillRect(rx + 8, ry + 32, rw - 16, 5 * scale);
        ctx.strokeRect(rx + 8, ry + 32, rw - 16, 5 * scale);

        // Operator Chair
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(dx + dw / 2, dy + dd + 6, 4, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'electrical_room': {
        // Dual Heavy Industrial Generator Turbines
        const tRadius = 2.2 * scale;
        const cy = ry + rd / 2 + 5;

        // Turbine 1
        const cx1 = rx + rw * 0.32;
        ctx.strokeStyle = '#8a8f98';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx1, cy, tRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx1, cy, tRadius * 0.4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#8a8f98';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GEN-A', cx1, cy + 2);

        // Turbine 2
        const cx2 = rx + rw * 0.68;
        ctx.beginPath(); ctx.arc(cx2, cy, tRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx2, cy, tRadius * 0.4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillText('GEN-B', cx2, cy + 2);

        // Breaker Switch Panel on North Wall with lightning bolt ⚡
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = '#b71c1c';
        ctx.fillRect(rx + rw * 0.25, ry + 32, rw * 0.5, 4);
        ctx.strokeRect(rx + rw * 0.25, ry + 32, rw * 0.5, 4);
        ctx.fillStyle = '#b71c1c';
        ctx.fillText('⚡ SAKLAR UTAMA ⚡', rx + rw / 2, ry + 44);
        break;
      }

      case 'medical_room': {
        // 3 Hospital Trauma Beds
        const bedW = 2.2 * scale;
        const bedD = 4.2 * scale;
        const bedY = ry + rd / 2 - 2;

        for (let i = 0; i < 3; i++) {
          const bx = rx + rw * 0.22 + i * (rw * 0.28);
          ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
          ctx.strokeStyle = '#7a808a';
          ctx.lineWidth = 1;
          ctx.fillRect(bx, bedY, bedW, bedD);
          ctx.strokeRect(bx, bedY, bedW, bedD);

          // Pillow
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(bx + 2, bedY + 2, bedW - 4, 3);
        }

        // Quarantine Partition Line
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(rx + 6, ry + rd - 18);
        ctx.lineTo(rx + rw - 6, ry + rd - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // Medical Cross Symbol ✚
        ctx.fillStyle = '#7a808a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✚ KARANTINA MEDIS', rx + rw / 2, ry + rd - 24);
        break;
      }

      case 'storage_room': {
        // 3 Industrial Warehouse Pallet Storage Racks
        const rackW = rw * 0.75;
        const rackH = 2.5 * scale;
        const startX = rx + (rw - rackW) / 2;

        for (let i = 0; i < 3; i++) {
          const sy = ry + 34 + i * (rackH + 7);
          ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1;
          ctx.fillRect(startX, sy, rackW, rackH);
          ctx.strokeRect(startX, sy, rackW, rackH);

          // Box cargo slots inside rack
          for (let b = 0; b < 4; b++) {
            ctx.strokeRect(startX + 4 + b * (rackW / 4.4), sy + 2, rackW / 6, rackH - 4);
          }
        }

        // Keycard Desk Table Indicator
        ctx.fillStyle = '#8a8f98';
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('💳 MEJA KARTU AKSES', rx + rw / 2, ry + rd - 20);
        break;
      }

      case 'comm_room': {
        // Long Communications Terminal Console
        const cw = rw * 0.8;
        const cd = 3.2 * scale;
        const cx = rx + (rw - cw) / 2;
        const cy = ry + rd / 2 + 2;

        ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
        ctx.strokeStyle = '#a3aab5';
        ctx.lineWidth = 1.2;
        ctx.fillRect(cx, cy, cw, cd);
        ctx.strokeRect(cx, cy, cw, cd);

        // RF Frequency Dial 47.3 MHz
        ctx.fillStyle = '#a3aab5';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('〰 FREKUENSI RF 47.3 MHz 〰', cx + cw / 2, cy + cd / 2 + 2);

        // Antenna Racks
        ctx.strokeRect(rx + 6, ry + 32, 6, rd * 0.4);
        ctx.strokeRect(rx + rw - 12, ry + 32, 6, rd * 0.4);
        break;
      }

      case 'archive_room': {
        // 4 Parallel High-Density Archive Bookshelf Stacks
        const shelfW = rw * 0.8;
        const shelfH = 2.0 * scale;
        const sx = rx + (rw - shelfW) / 2;

        for (let i = 0; i < 4; i++) {
          const sy = ry + 34 + i * (shelfH + 6);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1;
          ctx.fillRect(sx, sy, shelfW, shelfH);
          ctx.strokeRect(sx, sy, shelfW, shelfH);

          // Filing dividers
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(sx + shelfW * 0.33, sy); ctx.lineTo(sx + shelfW * 0.33, sy + shelfH);
          ctx.moveTo(sx + shelfW * 0.66, sy); ctx.lineTo(sx + shelfW * 0.66, sy + shelfH);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = '#60a5fa';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DOKUMEN RAHASIA SUBJEK 12', rx + rw / 2, ry + rd - 20);
        break;
      }

      case 'secret_chamber': {
        // Colossal Circular Quantum Accelerator Core
        const coreX = rx + rw / 2;
        const coreY = ry + rd / 2 + 4;
        const r1 = rw * 0.32;
        const r2 = rw * 0.20;
        const r3 = rw * 0.08;

        // Outer Containment Ring
        ctx.strokeStyle = '#7a808a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(coreX, coreY, r1, 0, Math.PI * 2); ctx.stroke();

        // Magnetic Guide Ring with animated dashed rotation
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(coreX, coreY, r2, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // Pulsating Core Singularity
        const corePulse = 2 + Math.sin(performance.now() * 0.005) * 1.5;
        ctx.fillStyle = '#9aa0aa';
        ctx.beginPath(); ctx.arc(coreX, coreY, r3 + corePulse, 0, Math.PI * 2); ctx.fill();

        // Suspended Catwalk Bridge
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(coreX, ry + rd);
        ctx.lineTo(coreX, coreY + r2);
        ctx.stroke();

        // Final Console
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(coreX - 5, coreY + r2 - 3, 10, 6);
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ KONSOL REAKTOR ⚡', coreX, coreY - r1 - 4);
        break;
      }

      case 'research_lab': {
        // Specimen Tube in Center
        const lx = rx + rw / 2;
        const ly = ry + rd / 2 + 6;
        const sRadius = 2.8 * scale;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.strokeStyle = '#7a808a';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(lx, ly, sRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeRect(lx - sRadius * 1.3, ly - sRadius * 1.3, sRadius * 2.6, sRadius * 2.6);

        ctx.fillStyle = '#7a808a';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TABUNG SPESIMEN', lx, ly + 2);
        break;
      }
    }
    ctx.restore();
  }
}