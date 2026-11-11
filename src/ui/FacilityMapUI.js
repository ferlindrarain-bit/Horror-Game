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
        name: 'SECURITY HUB',
        code: 'SEC-01',
        x: 0, z: 0, w: 14, d: 14,
        color: '#38bdf8',
        subtext: 'MAIN CONTROL / CCTV / RADIO'
      },
      'corridor': {
        name: 'TRANSIT SPINE CORRIDOR',
        code: 'TRN-02',
        x: 4, z: 12.5, w: 80, d: 5,
        color: '#64748b',
        subtext: 'MAIN INTERCONNECTING TUNNEL'
      },
      'research_lab': {
        name: 'RESEARCH LAB C',
        code: 'LAB-03',
        x: 0, z: -23, w: 18, d: 16,
        color: '#06b6d4',
        subtext: 'SPECIMEN CONTAINMENT & ANALYSIS'
      },
      'electrical_room': {
        name: 'ELECTRICAL SUBSTATION',
        code: 'PWR-04',
        x: -20, z: 4, w: 12, d: 12,
        color: '#f59e0b',
        subtext: 'GENERATORS & BREAKER ARRAY'
      },
      'medical_room': {
        name: 'MEDICAL & QUARANTINE',
        code: 'MED-05',
        x: 20, z: 4, w: 12, d: 12,
        color: '#10b981',
        subtext: 'SURGICAL TRAUMA & SUPPLIES'
      },
      'storage_room': {
        name: 'STORAGE BAY A',
        code: 'STR-06',
        x: -20, z: 21, w: 12, d: 12,
        color: '#d97706',
        subtext: 'HEAVY CARGO & PARTS CACHE'
      },
      'comm_room': {
        name: 'COMMUNICATIONS ARRAY',
        code: 'COM-07',
        x: 20, z: 21, w: 12, d: 12,
        color: '#facc15',
        subtext: 'RF MONITORING & RECORDINGS'
      },
      'elevator': {
        name: 'INDUSTRIAL ELEVATOR',
        code: 'LIFT-08',
        x: -39, z: 12.5, w: 6, d: 6,
        color: '#ef4444',
        subtext: 'SURFACE HOIST SHAFT (INOPERABLE)'
      },
      'archive_room': {
        name: 'RESTRICTED ARCHIVE',
        code: 'ARC-09',
        x: 44, z: -11, w: 16, d: 14,
        color: '#3b82f6',
        locked: true,
        unlockKey: 'archive_keycard',
        subtext: 'CLASSIFIED RESEARCH CLASSIFICATION'
      },
      'secret_chamber': {
        name: 'PROJECT ECHO CORE',
        code: 'CORE-10',
        x: 44, z: -27, w: 18, d: 18,
        color: '#a855f7',
        locked: true,
        unlockKey: 'chamber_code',
        subtext: 'RESONANCE TRANSMITTER APPARATUS'
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
      border: 2px solid #38bdf8; display: none; flex-direction: column;
      font-family: 'Courier New', monospace; box-shadow: 0 0 60px rgba(56,189,248,0.3);
      backdrop-filter: blur(12px); overflow: hidden;
    `;

    this.container.innerHTML = `
      <div style="padding: 10px 18px; background: #0b1329; border-bottom: 2px solid #1e293b; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="color: #38bdf8; font-weight: bold; font-size: 0.95rem; letter-spacing: 2px;">SECTOR 09 // TACTICAL ARCHITECTURAL BLUEPRINT</span>
          <span style="font-size: 0.7rem; color: #22c55e; background: #062312; border: 1px solid #166534; padding: 2px 8px; border-radius: 2px;">● LIVE RADAR SWEEP ACTIVE</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span style="font-size: 0.72rem; color: #94a3b8;">PRESS [M], [ESC] OR [E] TO EXIT</span>
          <button id="map-close-btn" style="background: #450a0a; border: 1px solid #ef4444; color: #fca5a5; padding: 4px 14px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.75rem; font-weight: bold;">[ ✖ CLOSE (ESC/E) ]</button>
        </div>
      </div>

      <div style="flex: 1; min-height: 0; position: relative; overflow: hidden; display: flex;">
        <canvas id="map-canvas" style="flex: 1; width: 100%; height: 100%; display: block; background: #020610;"></canvas>

        <div style="width: 320px; background: rgba(11,19,41,0.96); border-left: 2px solid #1e293b; padding: 18px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex-shrink: 0;">
          <div style="font-size: 0.8rem; color: #38bdf8; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            MISSION TELEMETRY
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8;">
            CURRENT SHIFT: <span id="map-night-val" style="color: #f59e0b; font-weight: bold;">NIGHT 1 : THE ARRIVAL</span>
          </div>
          <div style="font-size: 0.75rem; color: #94a3b8;">
            ACTIVE DIRECTIVE:
            <div id="map-obj-val" style="color: #e2e8f0; margin-top: 6px; font-size: 0.72rem; line-height: 1.5; border-left: 3px solid #ef4444; padding-left: 10px; background: rgba(239,68,68,0.06); padding-top: 4px; padding-bottom: 4px;">
              Restore facility main power.
            </div>
          </div>

          <div style="font-size: 0.8rem; color: #38bdf8; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-top: 8px;">
            FACILITY SURVEILLANCE
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.72rem;">
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 01: SECURITY HUB</span> <span style="color:#22c55e;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 02: RESEARCH LAB</span> <span style="color:#22c55e;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 03: TRANSIT HALL</span> <span style="color:#22c55e;">[ONLINE]</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
              <span>CAM 04: ECHO CORE</span> <span style="color:#f59e0b;">[ANOMALOUS]</span>
            </div>
          </div>

          <div style="font-size: 0.8rem; color: #38bdf8; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-top: 8px;">
            BLUEPRINT LEGEND
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.72rem; color: #cbd5e1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#ef4444; font-size:1.1rem; line-height:1;">▲</span> <span>PLAYER LOCATION & HEADING</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#38bdf8; font-size:1rem; line-height:1;">◉</span> <span>CCTV SURVEILLANCE CAMERA</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:12px; height:12px; background:rgba(56,189,248,0.25); border:1px solid #38bdf8;"></span> <span>EXPLORED / ACTIVE AREA</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:12px; height:12px; background:rgba(15,23,42,0.6); border:1px dashed #64748b;"></span> <span>UNEXPLORED BLUEPRINT SECTOR</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#ef4444; font-weight:bold;">[LOCKED]</span> <span>SECURITY ACCESS GATE</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:#22c55e; font-weight:bold;">[OPEN]</span> <span>SECURITY OVERRIDE UNLOCKED</span>
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
      if (e.code === 'KeyM') {
        this.toggle();
      } else if (this.isOpen && e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      } else if (this.isOpen && e.code === 'KeyE') {
        if (performance.now() - (this.openTimestamp || 0) < 280) return;
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  _resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  toggle() {
    if (this.isOpen) this.hide();
    else this.show();
  }

  show() {
    this.openTimestamp = performance.now();
    this.isOpen = true;
    this.container.style.display = 'flex';
    this._resizeCanvas();

    const loop = () => {
      if (!this.isOpen) return;
      this.radarAngle += 0.025;
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  hide() {
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

    // Draw Rooms & Corridors
    for (const [id, def] of Object.entries(this.roomDefs)) {
      const isDiscovered = this.discoveredRooms.has(id);
      const rx = toScreenX(def.x - def.w / 2);
      const ry = toScreenY(def.z - def.d / 2);
      const rw = def.w * scale;
      const rd = def.d * scale;

      if (isDiscovered) {
        // Explored room: Bright high-tech architectural floor
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(rx, ry, rw, rd);

        // Architectural wall boundary
        ctx.strokeStyle = def.color || '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(rx, ry, rw, rd);

        // Corner structural brackets
        const bSize = Math.min(6, scale * 0.8);
        ctx.fillStyle = def.color || '#38bdf8';
        ctx.fillRect(rx, ry, bSize, bSize);
        ctx.fillRect(rx + rw - bSize, ry, bSize, bSize);
        ctx.fillRect(rx, ry + rd - bSize, bSize, bSize);
        ctx.fillRect(rx + rw - bSize, ry + rd - bSize, bSize);

        // Room Header & Code
        ctx.fillStyle = def.color || '#38bdf8';
        ctx.font = `bold ${Math.max(10, Math.floor(scale * 1.6))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.name, rx + rw / 2, ry + rd / 2 - 6);

        // Subtext / Room Code
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${Math.max(8, Math.floor(scale * 1.1))}px monospace`;
        ctx.fillText(def.code + ' // ' + (def.subtext || ''), rx + rw / 2, ry + rd / 2 + 10);
      } else {
        // Unexplored room: Visible blueprint blueprint schematic with diagonal crosshatch
        ctx.fillStyle = 'rgba(11, 19, 41, 0.5)';
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
        ctx.fillText(def.code + ' [UNEXPLORED]', rx + rw / 2, ry + rd / 2 + 10);
      }

      // Security access badge
      if (def.locked) {
        const isUnlocked = this.story && this.story.hasItem('archive_keycard') && id === 'archive_room';
        const isChamberOpen = this.story && this.story.currentNightIndex >= 4;
        const open = isUnlocked || isChamberOpen;

        ctx.fillStyle = open ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(open ? '[SECURITY OVERRIDE: OPEN]' : '[RESTRICTED: KEYCARD REQUIRED]', rx + rw / 2, ry + rd - 8);
      }
    }

    // Render Corridor Interconnections & Door Openings
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';

    // North Hub Door
    ctx.fillRect(toScreenX(-1.5), toScreenY(-7.2), 3 * scale, 2);
    // South Hub Door
    ctx.fillRect(toScreenX(-1.5), toScreenY(6.8), 3 * scale, 2);
    // Lab Door
    ctx.fillRect(toScreenX(-1.5), toScreenY(-15.2), 3 * scale, 2);
    // Electrical Door
    ctx.fillRect(toScreenX(-20.5), toScreenY(9.8), 3 * scale, 2);
    // Medical Door
    ctx.fillRect(toScreenX(18.5), toScreenY(9.8), 3 * scale, 2);
    // Storage Door
    ctx.fillRect(toScreenX(-20.5), toScreenY(14.8), 3 * scale, 2);
    // Comm Door
    ctx.fillRect(toScreenX(18.5), toScreenY(14.8), 3 * scale, 2);

    // Render CCTV Camera Icons with animated Scanning FOV Cones
    this.cameras.forEach((cam, i) => {
      const cx = toScreenX(cam.x);
      const cy = toScreenY(cam.z);

      // Camera base icon
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Sweeping vision cone
      const swing = Math.sin(this.radarAngle * 1.5 + i) * 0.35;
      const fovAngle = cam.dirAngle + swing;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 28 * scale * 0.6, fovAngle - 0.45, fovAngle + 0.45);
      ctx.closePath();
      ctx.fill();

      // Camera label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cam.id, cx, cy - 7);
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
      ctx.fillStyle = '#ef4444';
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
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`YOU [X:${pos.x.toFixed(1)} Z:${pos.z.toFixed(1)}]`, px, py + 18);
    }

    // Update Telemetry Panel text
    if (this.story) {
      const currNight = this.story.getCurrentNight();
      const nightEl = document.getElementById('map-night-val');
      const objEl = document.getElementById('map-obj-val');

      if (nightEl && currNight) nightEl.textContent = `${currNight.title} : ${currNight.subtitle}`;
      if (objEl && currNight) {
        const pending = currNight.objectives.find(o => !o.completed);
        objEl.textContent = pending ? pending.text : 'All active shift protocols fulfilled.';
      }
    }
  }
}