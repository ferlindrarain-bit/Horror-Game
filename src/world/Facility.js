import * as THREE from 'three';

export class Facility {
  constructor() {
    this.group = new THREE.Group();
    this.collidables = [];
    this.interactables = [];
    this.doors = new Map();
    this.roomBounds = new Map();
    this.blinkingLights = [];
    this.sparks = [];
    this.animatedFans = [];
    this.animatedReels = [];
    this.animatedRings = [];
    this.sparkTimer = 0;
    this.sparkLight = null;
    this.entityMesh = null;

    this._initMaterials();
    this._buildFloorAndCeilingPlan();
    this._buildWallsAndCorridors();
    this._buildDoorFramesAndArches();
    this._buildSignage();
    this._buildArchitecturalBeamsAndDucts();
    this._buildIndustrialCeilingLights();
    this._buildWallMountedDetails();
    this._buildAllRoomProps();
    this._buildObserverEntity();
    this._buildDustParticles();
  }

  _initMaterials() {
    // 1. Procedural Concrete Tile Floor with Grime & Specular Highlights
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512; floorCanvas.height = 512;
    const fctx = floorCanvas.getContext('2d');
    fctx.fillStyle = '#1c2024';
    fctx.fillRect(0, 0, 512, 512);
    fctx.strokeStyle = '#282d33';
    fctx.lineWidth = 6;
    for (let x = 0; x < 512; x += 128) {
      for (let y = 0; y < 512; y += 128) {
        fctx.strokeRect(x, y, 128, 128);
      }
    }
    for (let i = 0; i < 4000; i++) {
      const v = Math.random();
      fctx.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)';
      fctx.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(24, 24);

    this.matFloor = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.25
    });

    // 2. Concrete Facility Walls with Panel Seams & Baseboards
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512; wallCanvas.height = 512;
    const wctx = wallCanvas.getContext('2d');
    wctx.fillStyle = '#262b33';
    wctx.fillRect(0, 0, 512, 512);
    wctx.fillStyle = '#15181e';
    wctx.fillRect(0, 440, 512, 72);
    wctx.fillStyle = '#b45309';
    wctx.fillRect(0, 432, 512, 8);
    wctx.strokeStyle = '#1d2128';
    wctx.lineWidth = 4;
    wctx.strokeRect(10, 10, 492, 492);
    wctx.strokeRect(256, 10, 246, 492);
    for (let i = 0; i < 4000; i++) {
      wctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
      wctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
    const wallTex = new THREE.CanvasTexture(wallCanvas);
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 1);

    this.matWall = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.8,
      metalness: 0.2
    });

    // 3. Dark Modular Ceiling
    this.matCeil = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.85,
      metalness: 0.2
    });

    // 4. Materials for Equipment & Details
    this.matMetal = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.85 });
    this.matDarkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.8 });
    this.matIndustrialSteel = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.9 });
    this.matPipe = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.85 });
    this.matPipeYellow = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.7 });
    this.matWarning = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.4 });
    this.matRedAlarm = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.85 });
    this.matGreenGlow = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matCyanGlow = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matScreen = new THREE.MeshBasicMaterial({ color: 0x064e3b });
    this.matScreenGlow = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    this.matScreenOsc = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matBlood = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.9 });
    this.matPaper = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
    this.matLeather = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    this.matWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    this.matGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 });
    this.matFabric = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });

    // 5. Advanced Industrial Surfaces & Decals
    this.matPuddle = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.8
    });

    // Diagonal Warning Hazard Stripes (Black & Yellow)
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 256; hazardCanvas.height = 256;
    const hctx = hazardCanvas.getContext('2d');
    hctx.fillStyle = '#eab308';
    hctx.fillRect(0, 0, 256, 256);
    hctx.fillStyle = '#0f172a';
    for (let i = -256; i < 512; i += 64) {
      hctx.beginPath();
      hctx.moveTo(i, 0);
      hctx.lineTo(i + 32, 0);
      hctx.lineTo(i - 256 + 32, 256);
      hctx.lineTo(i - 256, 256);
      hctx.closePath();
      hctx.fill();
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    this.matHazard = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4, metalness: 0.3 });

    // Metal Diamond-Tread Grate Floor
    const grateCanvas = document.createElement('canvas');
    grateCanvas.width = 128; grateCanvas.height = 128;
    const gctx = grateCanvas.getContext('2d');
    gctx.fillStyle = '#1e293b';
    gctx.fillRect(0, 0, 128, 128);
    gctx.strokeStyle = '#64748b';
    gctx.lineWidth = 3;
    for (let i = 0; i < 128; i += 16) {
      gctx.beginPath(); gctx.moveTo(i, 0); gctx.lineTo(i, 128); gctx.stroke();
      gctx.beginPath(); gctx.moveTo(0, i); gctx.lineTo(128, i); gctx.stroke();
    }
    const grateTex = new THREE.CanvasTexture(grateCanvas);
    grateTex.wrapS = THREE.RepeatWrapping;
    grateTex.wrapT = THREE.RepeatWrapping;
    grateTex.repeat.set(4, 4);
    this.matMetalGrate = new THREE.MeshStandardMaterial({ map: grateTex, roughness: 0.35, metalness: 0.85 });

    // Whiteboard Material with Research Notes & Formulas
    const wbCanvas = document.createElement('canvas');
    wbCanvas.width = 512; wbCanvas.height = 256;
    const wbctx = wbCanvas.getContext('2d');
    wbctx.fillStyle = '#f8fafc';
    wbctx.fillRect(0, 0, 512, 256);
    wbctx.strokeStyle = '#0284c7';
    wbctx.lineWidth = 3;
    wbctx.strokeRect(6, 6, 500, 244);
    wbctx.fillStyle = '#dc2626';
    wbctx.font = 'bold 22px monospace';
    wbctx.fillText('PROJECT ECHO // COGNITIVE RESONANCE', 20, 36);
    wbctx.fillStyle = '#1e293b';
    wbctx.font = '16px monospace';
    wbctx.fillText('Carrier Freq = 47.300 MHz [LOCKED]', 20, 70);
    wbctx.fillText('Ψ(t) = exp(-iHt/ħ) * RESONANCE_CORE', 20, 95);
    wbctx.fillText('Observer Discrepancy: Δt -> 0 at Core', 20, 120);
    wbctx.fillStyle = '#7c3aed';
    wbctx.fillText('DO NOT DEVIATE CARRIER SIGNAL', 20, 160);
    wbctx.fillText('SUB-OBSERVER 12: MEMORY DRIFT DETECTED', 20, 190);
    const wbTex = new THREE.CanvasTexture(wbCanvas);
    this.matWhiteboard = new THREE.MeshStandardMaterial({ map: wbTex, roughness: 0.25, metalness: 0.1 });

    this.matRust = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85, metalness: 0.5 });
    this.matPlasma = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.matGlowAmber = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.matGlowRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.matGlowGreen = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    // Cardboard boxes
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 128; cardCanvas.height = 128;
    const cctx = cardCanvas.getContext('2d');
    cctx.fillStyle = '#b45309';
    cctx.fillRect(0, 0, 128, 128);
    cctx.strokeStyle = '#78350f';
    cctx.lineWidth = 4;
    cctx.strokeRect(4, 4, 120, 120);
    cctx.fillStyle = '#1e293b';
    cctx.font = 'bold 12px monospace';
    cctx.fillText('FRAGILE', 32, 64);
    const cardTex = new THREE.CanvasTexture(cardCanvas);
    this.matCardboard = new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.85 });

    // Medical X-Ray Illuminated Film
    const xrayCanvas = document.createElement('canvas');
    xrayCanvas.width = 256; xrayCanvas.height = 256;
    const xctx = xrayCanvas.getContext('2d');
    xctx.fillStyle = '#050c18';
    xctx.fillRect(0, 0, 256, 256);
    xctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    xctx.lineWidth = 3;
    xctx.beginPath();
    xctx.moveTo(128, 30); xctx.lineTo(128, 220);
    for (let r = 50; r <= 190; r += 20) {
      const rw = 25 + (r > 120 ? (190 - r) * 0.4 : (r - 50) * 0.5);
      xctx.moveTo(128 - rw, r); xctx.quadraticCurveTo(128, r - 10, 128 + rw, r);
    }
    xctx.stroke();
    xctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    xctx.beginPath();
    xctx.arc(155, 110, 18, 0, Math.PI * 2);
    xctx.fill();
    const xrayTex = new THREE.CanvasTexture(xrayCanvas);
    this.matXRay = new THREE.MeshStandardMaterial({
      map: xrayTex,
      emissive: 0x38bdf8,
      emissiveMap: xrayTex,
      emissiveIntensity: 0.65,
      roughness: 0.2
    });

    // Oscilloscope Screen
    const oscCanvas = document.createElement('canvas');
    oscCanvas.width = 256; oscCanvas.height = 128;
    const oscctx = oscCanvas.getContext('2d');
    oscctx.fillStyle = '#021810';
    oscctx.fillRect(0, 0, 256, 128);
    oscctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
    oscctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 16) { oscctx.beginPath(); oscctx.moveTo(x, 0); oscctx.lineTo(x, 128); oscctx.stroke(); }
    for (let y = 0; y < 128; y += 16) { oscctx.beginPath(); oscctx.moveTo(0, y); oscctx.lineTo(256, y); oscctx.stroke(); }
    oscctx.strokeStyle = '#4ade80';
    oscctx.lineWidth = 2.5;
    oscctx.beginPath();
    for (let x = 0; x < 256; x++) {
      const y = 64 + Math.sin(x * 0.08) * 38;
      if (x === 0) oscctx.moveTo(x, y); else oscctx.lineTo(x, y);
    }
    oscctx.stroke();
    const oscTex = new THREE.CanvasTexture(oscCanvas);
    this.matOscilloscope = new THREE.MeshBasicMaterial({ map: oscTex });

    // Acoustic Foam Baffles
    const foamCanvas = document.createElement('canvas');
    foamCanvas.width = 128; foamCanvas.height = 128;
    const foamCtx = foamCanvas.getContext('2d');
    foamCtx.fillStyle = '#0b1120';
    foamCtx.fillRect(0, 0, 128, 128);
    foamCtx.strokeStyle = '#1e293b';
    foamCtx.lineWidth = 2;
    for (let x = 0; x < 128; x += 16) {
      for (let y = 0; y < 128; y += 16) {
        foamCtx.strokeRect(x, y, 16, 16);
      }
    }
    const foamTex = new THREE.CanvasTexture(foamCanvas);
    foamTex.wrapS = THREE.RepeatWrapping;
    foamTex.wrapT = THREE.RepeatWrapping;
    foamTex.repeat.set(4, 4);
    this.matAcousticFoam = new THREE.MeshStandardMaterial({ map: foamTex, roughness: 0.95 });

    this.matRedBinder = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    this.matBlackRubber = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  }

  _buildFloorAndCeilingPlan() {
    const createFloorAndCeil = (x, z, w, d) => {
      // Continuous solid floor (Y = -0.2 to 0.0)
      const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), this.matFloor);
      floor.position.set(x, -0.2, z);
      floor.receiveShadow = true;
      this.group.add(floor);

      // Solid ceiling (Y = 4.2 to 4.6)
      const ceil = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), this.matCeil);
      ceil.position.set(x, 4.4, z);
      this.group.add(ceil);
    };

    // 1. Control Room (Hub): 14x14
    createFloorAndCeil(0, 0, 14, 14);
    // 2. North Hub Connector: 5x8
    createFloorAndCeil(0, -11, 5, 8);
    // 3. Research Laboratory C: 18x16
    createFloorAndCeil(0, -23, 18, 16);
    // 4. South Hub Connector: 5x3
    createFloorAndCeil(0, 8.5, 5, 3);
    // 5. Main East-West Corridor: 80x5
    createFloorAndCeil(4, 12.5, 80, 5);
    // 6. Electrical Substation: 12x12
    createFloorAndCeil(-20, 4, 12, 12);
    // 7. Medical & Trauma Ward: 12x12
    createFloorAndCeil(20, 4, 12, 12);
    // 8. Storage Bay A: 12x12
    createFloorAndCeil(-20, 21, 12, 12);
    // 9. Communications Room: 12x12
    createFloorAndCeil(20, 21, 12, 12);
    // 10. Underground Elevator Shaft: 6x6
    createFloorAndCeil(-39, 12.5, 6, 6);
    // 11. Archive Approach Corridor: 6x19
    createFloorAndCeil(44, 5.5, 6, 19);
    // 12. Restricted Archive Room: 16x14
    createFloorAndCeil(44, -11, 16, 14);
    // 13. Secret Research Chamber: 18x18
    createFloorAndCeil(44, -27, 18, 18);
  }

  _addWallBox(x, z, w, d, height = 4.2) {
    const geo = new THREE.BoxGeometry(w, height, d);
    const mesh = new THREE.Mesh(geo, this.matWall);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.collidables.push(mesh);
    return mesh;
  }

  _addWallHeader(x, z, w, d, height = 1.2) {
    const geo = new THREE.BoxGeometry(w, height, d);
    const mesh = new THREE.Mesh(geo, this.matWall);
    mesh.position.set(x, 4.2 - height / 2, z);
    this.group.add(mesh);
  }

  _buildWallsAndCorridors() {
    const T = 0.4; // Wall thickness

    // 1. Control Room Walls (X: -7..+7, Z: -7..+7)
    this._addWallBox(-7, 0, T, 14);
    this._addWallBox(7, 0, T, 14);
    this._addWallBox(-4.25, -7, 5.5, T);
    this._addWallBox(4.25, -7, 5.5, T);
    this._addWallHeader(0, -7, 3, T, 1.2);
    this._addWallBox(-4.25, 7, 5.5, T);
    this._addWallBox(4.25, 7, 5.5, T);
    this._addWallHeader(0, 7, 3, T, 1.2);

    // 2. North Hub Connector Walls
    this._addWallBox(-2.5, -11, T, 8);
    this._addWallBox(2.5, -11, T, 8);

    // 3. Research Laboratory Walls
    this._addWallBox(-5.25, -15, 7.5, T);
    this._addWallBox(5.25, -15, 7.5, T);
    this._addWallHeader(0, -15, 3, T, 1.2);
    this._addWallBox(0, -31, 18, T);
    this._addWallBox(-9, -23, T, 16);
    this._addWallBox(9, -23, T, 16);

    // 4. South Hub Connector Walls
    this._addWallBox(-2.5, 8.5, T, 3);
    this._addWallBox(2.5, 8.5, T, 3);

    // 5. Main East-West Corridor Walls (Z: 10..15)
    this._addWallBox(-31, 10, 10, T);
    this._addWallHeader(-20, 10, 3, T, 1.2);
    this._addWallBox(-10.5, 10, 16, T);
    this._addWallBox(10.5, 10, 16, T);
    this._addWallHeader(20, 10, 3, T, 1.2);
    this._addWallBox(31.25, 10, 19.5, T);

    this._addWallBox(-31, 15, 10, T);
    this._addWallHeader(-20, 15, 3, T, 1.2);
    this._addWallBox(0, 15, 37, T);
    this._addWallHeader(20, 15, 3, T, 1.2);
    this._addWallBox(34.25, 15, 25.5, T);

    // 6. Electrical Room Walls
    this._addWallBox(-26, 4, T, 12);
    this._addWallBox(-14, 4, T, 12);
    this._addWallBox(-20, -2, 12, T);
    this._addWallBox(-23.75, 10, 4.5, T);
    this._addWallBox(-16.25, 10, 4.5, T);

    // 7. Medical Room Walls
    this._addWallBox(14, 4, T, 12);
    this._addWallBox(26, 4, T, 12);
    this._addWallBox(20, -2, 12, T);
    this._addWallBox(16.25, 10, 4.5, T);
    this._addWallBox(23.75, 10, 4.5, T);

    // 8. Storage Room Walls
    this._addWallBox(-26, 21, T, 12);
    this._addWallBox(-14, 21, T, 12);
    this._addWallBox(-20, 27, 12, T);
    this._addWallBox(-23.75, 15, 4.5, T);
    this._addWallBox(-16.25, 15, 4.5, T);

    // 9. Communication Room Walls
    this._addWallBox(14, 21, T, 12);
    this._addWallBox(26, 21, T, 12);
    this._addWallBox(20, 27, 12, T);
    this._addWallBox(16.25, 15, 4.5, T);
    this._addWallBox(23.75, 15, 4.5, T);

    // 10. Underground Elevator Shaft
    this._addWallBox(-42, 12.5, T, 6);
    this._addWallBox(-39, 9.5, 6, T);
    this._addWallBox(-39, 15.5, 6, T);
    const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 5.0), this.matIndustrialSteel);
    gateMesh.position.set(-36, 1.6, 12.5);
    this.group.add(gateMesh);
    this.collidables.push(gateMesh);

    // 11. Archive Approach Corridor Walls
    this._addWallBox(41, 3, T, 14);
    this._addWallBox(47, 3, T, 14);

    // 12. Restricted Archive Room Walls & Security Door
    this._addWallBox(36, -11, T, 14);
    this._addWallBox(52, -11, T, 14);
    this._addWallBox(38.5, -4, 5, T);
    this._addWallBox(49.5, -4, 5, T);
    this._addWallHeader(44, -4, 3, T, 1.2);
    this._buildSecurityDoor('archive_room_door', 44, -4, 3.0, 3.0, false, 'RESTRICTED ARCHIVE');

    // 13. Secret Research Chamber Walls & Vault Door
    this._addWallBox(39.5, -18, 7, T);
    this._addWallBox(48.5, -18, 7, T);
    this._addWallHeader(44, -18, 3, T, 1.2);
    this._buildSecurityDoor('secret_chamber_door', 44, -18, 3.0, 3.0, false, 'PROJECT ECHO CORE');

    this._addWallBox(35, -27, T, 18);
    this._addWallBox(53, -27, T, 18);
    this._addWallBox(44, -36, 18, T);
  }

  _buildSecurityDoor(doorId, x, z, dw, dh, isZAxis, labelText) {
    const doorGroup = new THREE.Group();

    // Heavy steel door slab
    const slabGeo = new THREE.BoxGeometry(dw - 0.1, dh - 0.1, 0.25);
    const slab = new THREE.Mesh(slabGeo, this.matIndustrialSteel);
    slab.position.y = dh / 2;
    doorGroup.add(slab);

    // Hazard stripe plate
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(dw - 0.3, 0.4, 0.3), this.matWarning);
    stripe.position.y = dh * 0.65;
    doorGroup.add(stripe);

    // Electronic Card Reader / Keypad
    const reader = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.15), this.matRedAlarm);
    reader.position.set(dw / 2 + 0.3, 1.4, 0.1);
    doorGroup.add(reader);

    doorGroup.position.set(x, 0, z);
    this.group.add(doorGroup);

    this.collidables.push(slab);
    this.doors.set(doorId, {
      group: doorGroup,
      slab: slab,
      reader: reader,
      locked: true,
      id: doorId
    });

    this.interactables.push({
      mesh: slab,
      type: 'door',
      id: doorId,
      prompt: `[E] ${labelText} (LOCKED)`,
      data: { doorId }
    });
  }

  _buildSignage() {
    const makeSign = (text, x, y, z, rotY = 0) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);

      const tex = new THREE.CanvasTexture(canvas);
      const signMat = new THREE.MeshBasicMaterial({ map: tex });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), signMat);
      signMesh.position.set(x, y, z);
      signMesh.rotation.y = rotY;
      this.group.add(signMesh);
    };

    makeSign('MAIN CORRIDOR >>', 0, 3.4, 6.75, Math.PI);
    makeSign('<< SECURITY HUB', 0, 3.4, 7.25, 0);

    makeSign('RESEARCH LAB C >>', 0, 3.4, -6.75, 0);
    makeSign('<< SECURITY HUB', 0, 3.4, -7.25, Math.PI);

    makeSign('ELECTRICAL WING', -20, 3.4, 9.75, 0);
    makeSign('STORAGE BAY A', -20, 3.4, 15.25, Math.PI);

    makeSign('MEDICAL WARD', 20, 3.4, 9.75, 0);
    makeSign('COMMUNICATIONS', 20, 3.4, 15.25, Math.PI);

    makeSign('RESTRICTED ARCHIVE', 44, 3.4, -3.75, 0);
    makeSign('PROJECT ECHO CORE', 44, 3.4, -17.75, 0);

    makeSign('ELEVATOR SHAFTS [OUT]', -36, 3.4, 12.5, Math.PI / 2);
  }

  _buildArchitecturalBeamsAndDucts() {
    // 1. Galvanized Rectangular Ventilation Ducts running overhead
    const createDuct = (start, end, w, h) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const duct = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), this.matDarkMetal);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      duct.position.copy(mid);
      duct.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
      this.group.add(duct);
    };

    // Main Corridor Duct
    createDuct(new THREE.Vector3(-35, 3.8, 11.5), new THREE.Vector3(42, 3.8, 11.5), 0.8, 0.5);
    // North Lab Duct
    createDuct(new THREE.Vector3(0, 3.8, -7), new THREE.Vector3(0, 3.8, -30), 0.8, 0.5);

    // 2. Industrial Pipes (Piping Runs)
    const createPipe = (start, end, r, mat) => {
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      pipe.position.copy(mid);
      pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      this.group.add(pipe);
    };

    createPipe(new THREE.Vector3(-35, 3.9, 13.8), new THREE.Vector3(42, 3.9, 13.8), 0.09, this.matPipeYellow);
    createPipe(new THREE.Vector3(-35, 3.7, 14.2), new THREE.Vector3(42, 3.7, 14.2), 0.12, this.matPipe);

    // 3. Wall Conduit Boxes with Blinking LEDs & Fire Extinguishers
    for (let x = -30; x <= 35; x += 12) {
      // Conduit Box
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.2), this.matDarkMetal);
      box.position.set(x, 2.2, 10.15);
      this.group.add(box);

      const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), this.matGreenGlow);
      led.position.set(x, 2.35, 10.27);
      this.group.add(led);
      this.blinkingLights.push(led);

      // Fire Extinguisher (alternating sides)
      if (x % 24 === 0) {
        const extGroup = new THREE.Group();
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 8), this.matRedAlarm);
        tank.position.y = 0.35;
        const hose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), this.matDarkMetal);
        hose.position.set(0.12, 0.35, 0);
        extGroup.add(tank);
        extGroup.add(hose);
        extGroup.position.set(x + 2, 1.4, 10.2);
        this.group.add(extGroup);
      }
    }
  }

  // =========================================================================
  // HEAVY INDUSTRIAL DOOR FRAMES & BULKHEAD CORRIDOR ARCHES
  // =========================================================================
  _buildDoorFramesAndArches() {
    // 1. Reinforced Steel Bulkhead Support Arches across Main Corridor (Z = 12.5)
    const corridorArchX = [-28, -12, 0, 12, 28, 36];
    corridorArchX.forEach((x, idx) => {
      const arch = new THREE.Group();

      // Left Column (North wall side)
      const colL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), this.matIndustrialSteel);
      colL.position.set(0, 2.1, -2.3);
      arch.add(colL);

      // Right Column (South wall side)
      const colR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), this.matIndustrialSteel);
      colR.position.set(0, 2.1, 2.3);
      arch.add(colR);

      // Overhead Heavy Cross-Beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 5.0), this.matDarkMetal);
      beam.position.set(0, 3.85, 0);
      arch.add(beam);

      // Diagonal Hazard Warning Stripe Plate
      const hazardPlate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 4.4), this.matHazard);
      hazardPlate.position.set(0, 3.85, 0);
      arch.add(hazardPlate);

      // Bulkhead Stencil Sign Plaque
      const plaqueCanvas = document.createElement('canvas');
      plaqueCanvas.width = 256; plaqueCanvas.height = 64;
      const pctx = plaqueCanvas.getContext('2d');
      pctx.fillStyle = '#0f172a';
      pctx.fillRect(0, 0, 256, 64);
      pctx.strokeStyle = '#eab308';
      pctx.lineWidth = 3;
      pctx.strokeRect(3, 3, 250, 58);
      pctx.fillStyle = '#eab308';
      pctx.font = 'bold 20px monospace';
      pctx.textAlign = 'center';
      pctx.textBaseline = 'middle';
      pctx.fillText(`BULKHEAD 0${idx + 1}`, 128, 32);

      const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
      const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTex });
      const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), plaqueMat);
      plaqueMesh.position.set(-0.27, 3.85, 0);
      plaqueMesh.rotation.y = -Math.PI / 2;
      arch.add(plaqueMesh);

      arch.position.set(x, 0, 12.5);
      this.group.add(arch);
    });

    // 2. Physical 3D Door Frames at Room Entrances
    const createDoorFrame = (x, z, width = 3.0, height = 3.0, rotY = 0, label = 'DOOR') => {
      const frame = new THREE.Group();

      const halfW = width / 2;
      // Left Door Post
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, 0.5), this.matIndustrialSteel);
      postL.position.set(-halfW - 0.15, height / 2, 0);
      frame.add(postL);

      // Right Door Post
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, 0.5), this.matIndustrialSteel);
      postR.position.set(halfW + 0.15, height / 2, 0);
      frame.add(postR);

      // Overhead Lintel Casing
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.4, 0.55), this.matDarkMetal);
      lintel.position.set(0, height + 0.2, 0);
      frame.add(lintel);

      // Hazard Warning Stripe Strip on Lintel
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.18, 0.58), this.matHazard);
      stripe.position.set(0, height + 0.2, 0);
      frame.add(stripe);

      // Pneumatic Hydraulic Door Closer Cylinder above door
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, width * 0.7, 8), this.matMetal);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.set(0, height + 0.45, 0.2);
      frame.add(cylinder);

      // Keypad / Card Reader Unit on frame
      const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.15), this.matDarkMetal);
      keypad.position.set(halfW + 0.25, 1.4, 0.26);
      frame.add(keypad);

      const keyLed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), this.matGreenGlow);
      keyLed.position.set(halfW + 0.25, 1.52, 0.35);
      frame.add(keyLed);
      this.blinkingLights.push(keyLed);

      frame.position.set(x, 0, z);
      frame.rotation.y = rotY;
      this.group.add(frame);
    };

    // Place heavy door frames at each major portal
    createDoorFrame(0, -7, 3.0, 3.0, 0, 'LABORATORY C');
    createDoorFrame(0, 7, 3.0, 3.0, 0, 'SECURITY HUB');
    createDoorFrame(0, -15, 3.0, 3.0, 0, 'RESEARCH ACCESS');
    createDoorFrame(-20, 10, 3.0, 3.0, 0, 'SUBSTATION 09');
    createDoorFrame(-20, 15, 3.0, 3.0, 0, 'STORAGE BAY A');
    createDoorFrame(20, 10, 3.0, 3.0, 0, 'TRAUMA WARD');
    createDoorFrame(20, 15, 3.0, 3.0, 0, 'RF COMMUNICATIONS');
    createDoorFrame(44, -4, 3.0, 3.0, 0, 'RESTRICTED ARCHIVE');
    createDoorFrame(44, -18, 3.0, 3.0, 0, 'PROJECT ECHO CORE');
  }

  // =========================================================================
  // DETAILED INDUSTRIAL CEILING LIGHT FIXTURES
  // =========================================================================
  _buildIndustrialCeilingLights() {
    const createTroffer = (x, y, z, rotY = 0, tubeColor = 0x67e8f9) => {
      const fixture = new THREE.Group();

      // Steel troffer housing
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 1.6), this.matDarkMetal);
      housing.position.y = -0.07;
      fixture.add(housing);

      // Glowing tube material
      const tubeMat = new THREE.MeshBasicMaterial({ color: tubeColor });

      // 2 Fluorescent light tubes
      const tubeGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.4, 8);
      tubeGeo.rotateX(Math.PI / 2);

      const tube1 = new THREE.Mesh(tubeGeo, tubeMat);
      tube1.position.set(-0.1, -0.12, 0);
      fixture.add(tube1);

      const tube2 = new THREE.Mesh(tubeGeo, tubeMat);
      tube2.position.set(0.1, -0.12, 0);
      fixture.add(tube2);

      // Wire suspension mounts
      const mount1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), this.matMetal);
      mount1.position.set(0, 0.1, -0.6);
      fixture.add(mount1);

      const mount2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), this.matMetal);
      mount2.position.set(0, 0.1, 0.6);
      fixture.add(mount2);

      fixture.position.set(x, y, z);
      fixture.rotation.y = rotY;
      this.group.add(fixture);
    };

    // Security Hub
    createTroffer(0, 4.2, -2.0, 0, 0x38bdf8);
    createTroffer(0, 4.2, 3.5, 0, 0x94a3b8);

    // North & South Hub Connectors
    createTroffer(0, 4.2, -11, 0, 0x94a3b8);
    createTroffer(0, 4.2, 8.5, 0, 0xfef08a);

    // Main Corridor
    createTroffer(-28, 4.2, 12.5, Math.PI / 2, 0xf87171); // Reddish near elevator
    createTroffer(-14, 4.2, 12.5, Math.PI / 2, 0xfef08a);
    createTroffer(0, 4.2, 12.5, Math.PI / 2, 0x94a3b8);
    createTroffer(14, 4.2, 12.5, Math.PI / 2, 0xfef08a);
    createTroffer(28, 4.2, 12.5, Math.PI / 2, 0x67e8f9);

    // Research Lab C
    createTroffer(0, 4.2, -23, 0, 0x67e8f9);
    createTroffer(-4, 4.2, -27, Math.PI / 2, 0x38bdf8);
    createTroffer(4, 4.2, -27, Math.PI / 2, 0x38bdf8);

    // Electrical Substation
    createTroffer(-20, 4.2, 4, 0, 0xf59e0b);

    // Medical Ward
    createTroffer(20, 4.2, 4, 0, 0x86efac);

    // Storage Bay A
    createTroffer(-20, 4.2, 21, Math.PI / 2, 0xd97706);

    // Communications Room
    createTroffer(20, 4.2, 21, 0, 0xfbbf24);

    // Restricted Archive
    createTroffer(44, 4.2, -11, 0, 0x38bdf8);

    // Secret Research Chamber
    createTroffer(44, 4.2, -21, Math.PI / 2, 0x38bdf8);
    createTroffer(39, 4.2, -27, 0, 0x38bdf8);
    createTroffer(49, 4.2, -27, 0, 0x38bdf8);
  }

  // =========================================================================
  // WALL-MOUNTED FIRST AID, EYEWASH, FANS, CONES & SEVERED CABLES
  // =========================================================================
  _buildWallMountedDetails() {
    // 1. Emergency Eyewash & Chemical Safety Station
    const createEyewash = (x, y, z, rotY = 0) => {
      const station = new THREE.Group();

      // Green wall placard
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.04), this.matGreenGlow);
      plate.position.y = 0.45;
      station.add(plate);

      // Stainless steel catch basin
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.16, 12), this.matMetal);
      basin.position.set(0, 0.2, 0.25);
      station.add(basin);

      // Dual spray nozzles
      const noz1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), this.matIndustrialSteel);
      noz1.position.set(-0.08, 0.3, 0.25);
      const noz2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6), this.matIndustrialSteel);
      noz2.position.set(0.08, 0.3, 0.25);
      station.add(noz1);
      station.add(noz2);

      station.position.set(x, y, z);
      station.rotation.y = rotY;
      this.group.add(station);
    };

    createEyewash(-4, 1.2, 10.15, 0);
    createEyewash(-8.8, 1.2, -20, Math.PI / 2);

    // 2. Wall-Mounted Metal First Aid Kits
    const createFirstAidBox = (x, y, z, rotY = 0) => {
      const box = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), this.matFabric);
      body.position.y = 0.3;
      box.add(body);

      // Red cross symbol
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.02), this.matRedAlarm);
      crossV.position.set(0, 0.3, 0.11);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.02), this.matRedAlarm);
      crossH.position.set(0, 0.3, 0.11);
      box.add(crossV);
      box.add(crossH);

      box.position.set(x, y, z);
      box.rotation.y = rotY;
      this.group.add(box);
    };

    createFirstAidBox(6.8, 1.4, 2.0, -Math.PI / 2);
    createFirstAidBox(18, 1.4, 10.15, 0);
    createFirstAidBox(14.2, 1.4, 2.0, Math.PI / 2);

    // 3. Wall Fire Hose Reel Cabinets
    const createHoseCabinet = (x, y, z, rotY = 0) => {
      const cab = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.35), this.matRedAlarm);
      body.position.y = 0.55;
      cab.add(body);

      // Glass door
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), this.matGlass);
      glass.position.set(0, 0.55, 0.18);
      cab.add(glass);

      // Red coiled hose
      const hose = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16), this.matDarkMetal);
      hose.position.set(0, 0.55, 0.05);
      cab.add(hose);

      cab.position.set(x, y, z);
      cab.rotation.y = rotY;
      this.group.add(cab);
    };

    createHoseCabinet(-18, 1.2, 14.85, Math.PI);
    createHoseCabinet(22, 1.2, 14.85, Math.PI);

    // 4. Folding Yellow "CAUTION WET FLOOR" Signs
    const createCautionSign = (x, z, rotY = 0) => {
      const sign = new THREE.Group();
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.04), this.matWarning);
      legL.rotation.x = 0.2;
      legL.position.set(0, 0.32, -0.06);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.04), this.matWarning);
      legR.rotation.x = -0.2;
      legR.position.set(0, 0.32, 0.06);
      sign.add(legL);
      sign.add(legR);

      sign.position.set(x, 0, z);
      sign.rotation.y = rotY;
      this.group.add(sign);
    };

    createCautionSign(-5.5, 13.5, 0.4);
    createCautionSign(23.5, 11.8, -0.3);

    // 5. Wall Ventilation Fan Units with Spinning Blades
    const createWallFan = (x, y, z, rotY = 0) => {
      const fanGroup = new THREE.Group();

      // Square duct casing
      const duct = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.25), this.matDarkMetal);
      fanGroup.add(duct);

      // Protective wire grille
      const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 12), this.matMetal);
      grille.rotation.x = Math.PI / 2;
      grille.position.z = 0.12;
      fanGroup.add(grille);

      // Rotating 4-blade propeller
      const propGroup = new THREE.Group();
      propGroup.position.z = 0.05;
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.02), this.matIndustrialSteel);
        blade.position.y = 0.22;
        blade.rotation.z = (i * Math.PI) / 2;
        const bladeHolder = new THREE.Group();
        bladeHolder.rotation.z = (i * Math.PI) / 2;
        bladeHolder.add(blade);
        propGroup.add(bladeHolder);
      }
      fanGroup.add(propGroup);
      this.animatedFans.push(propGroup);

      fanGroup.position.set(x, y, z);
      fanGroup.rotation.y = rotY;
      this.group.add(fanGroup);
    };

    createWallFan(-10, 2.8, 10.15, 0);
    createWallFan(10, 2.8, 14.85, Math.PI);
    createWallFan(-8.8, 2.8, -27, Math.PI / 2);

    // 6. Dangling Severed Electrical Cables with Sparking Tip
    const createDanglingCables = (x, z) => {
      const cableGroup = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const len = 0.8 + Math.random() * 0.8;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 6), this.matDarkMetal);
        c.position.set((Math.random() - 0.5) * 0.3, 4.2 - len / 2, (Math.random() - 0.5) * 0.3);
        c.rotation.z = (Math.random() - 0.5) * 0.25;
        cableGroup.add(c);
      }
      // Spark discharge particle dummy
      const sparkMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), this.matPlasma);
      sparkMesh.position.set(0, 3.1, 0);
      sparkMesh.visible = false;
      cableGroup.add(sparkMesh);
      this.sparks.push(sparkMesh);

      cableGroup.position.set(x, 0, z);
      this.group.add(cableGroup);
    };

    createDanglingCables(-24, 12.5);
    createDanglingCables(-36, 12.5);
    createDanglingCables(-18, 2.5); // Electrical room dangling wires
  }

  // =========================================================================
  // REUSABLE PROCEDURAL PROP CREATION HELPERS
  // =========================================================================

  _createChair(x, y, z, rotY = 0) {
    const chair = new THREE.Group();
    // 5-Spoke Wheel Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 8), this.matDarkMetal);
    base.position.y = 0.05;
    chair.add(base);

    // Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), this.matMetal);
    stem.position.y = 0.25;
    chair.add(stem);

    // Padded Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), this.matLeather);
    seat.position.y = 0.48;
    chair.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.06), this.matLeather);
    back.position.set(0, 0.8, -0.25);
    chair.add(back);

    // Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.35), this.matDarkMetal);
    armL.position.set(-0.28, 0.62, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.35), this.matDarkMetal);
    armR.position.set(0.28, 0.62, 0);
    chair.add(armL);
    chair.add(armR);

    chair.position.set(x, y, z);
    chair.rotation.y = rotY;
    this.group.add(chair);
    this.collidables.push(seat);
    return chair;
  }

  _createFileCabinet(x, y, z, rotY = 0) {
    const cab = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.4, 0.6), this.matIndustrialSteel);
    body.position.y = 0.7;
    cab.add(body);

    // 4 Drawers with handles
    for (let i = 0; i < 4; i++) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.04), this.matWarning);
      handle.position.set(0, 0.3 + i * 0.32, 0.31);
      cab.add(handle);
    }

    cab.position.set(x, y, z);
    cab.rotation.y = rotY;
    this.group.add(cab);
    this.collidables.push(body);
    return cab;
  }

  _createLockerBank(x, y, z, rotY = 0) {
    const lockers = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.6), this.matIndustrialSteel);
    body.position.y = 1.1;
    lockers.add(body);

    for (let i = -0.5; i <= 0.5; i += 0.5) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), this.matDarkMetal);
      vent.position.set(i, 1.8, 0.31);
      lockers.add(vent);
    }

    lockers.position.set(x, y, z);
    lockers.rotation.y = rotY;
    this.group.add(lockers);
    this.collidables.push(body);
    return lockers;
  }

  _createHospitalBed(x, y, z, rotY = 0) {
    const bed = new THREE.Group();
    // 4 Corner Steel Support Legs to floor
    for (const lx of [-0.62, 0.62]) {
      for (const lz of [-1.3, 1.3]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), this.matDarkMetal);
        leg.position.set(lx, 0.2, lz);
        bed.add(leg);
      }
    }
    // Tubular Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 2.8), this.matMetal);
    frame.position.y = 0.4;
    bed.add(frame);

    // Mattress with sheet
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.25, 2.65), this.matFabric);
    mattress.position.y = 0.72;
    bed.add(mattress);

    // Pillow
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.4), this.matFabric);
    pillow.position.set(0, 0.88, -1.0);
    bed.add(pillow);

    // Headboard & Footboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.08), this.matDarkMetal);
    headboard.position.set(0, 0.8, -1.35);
    const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.08), this.matDarkMetal);
    footboard.position.set(0, 0.7, 1.35);
    bed.add(headboard);
    bed.add(footboard);

    bed.position.set(x, y, z);
    bed.rotation.y = rotY;
    this.group.add(bed);
    this.collidables.push(frame);
    return bed;
  }

  _createWheelchair(x, y, z, rotY = 0) {
    const chair = new THREE.Group();
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelL = new THREE.Mesh(wheelGeo, this.matDarkMetal);
    wheelL.position.set(-0.35, 0.35, 0);
    const wheelR = new THREE.Mesh(wheelGeo, this.matDarkMetal);
    wheelR.position.set(0.35, 0.35, 0);
    chair.add(wheelL);
    chair.add(wheelR);

    // Seat & Back
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.55), this.matLeather);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.05), this.matLeather);
    back.position.set(0, 0.75, -0.27);
    chair.add(seat);
    chair.add(back);

    chair.position.set(x, y, z);
    chair.rotation.y = rotY;
    this.group.add(chair);
    this.collidables.push(seat);
    return chair;
  }

  _createIndustrialGenerator(x, y, z, rotY = 0) {
    const gen = new THREE.Group();
    // Heavy Generator Block
    const block = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 3.8), this.matDarkMetal);
    block.position.y = 0.9;
    gen.add(block);

    // Cylindrical Rotor Housing
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.2, 16), this.matIndustrialSteel);
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(0, 1.1, 0);
    gen.add(rotor);

    // Exhaust Pipe rising into ceiling
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 8), this.matPipe);
    exhaust.position.set(0.9, 2.4, -1.2);
    gen.add(exhaust);

    // Warning / Control Panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.15), this.matWarning);
    panel.position.set(-1.31, 1.1, 0.5);
    panel.rotation.y = -Math.PI / 2;
    gen.add(panel);

    gen.position.set(x, y, z);
    gen.rotation.y = rotY;
    this.group.add(gen);
    this.collidables.push(block);
    return gen;
  }

  _createStorageRack(x, y, z, rotY = 0) {
    const rack = new THREE.Group();
    // Industrial Uprights (4 columns)
    const colGeo = new THREE.BoxGeometry(0.08, 3.4, 0.08);
    for (const cx of [-0.6, 0.6]) {
      for (const cz of [-1.6, 1.6]) {
        const col = new THREE.Mesh(colGeo, this.matWarning); // Industrial orange upright
        col.position.set(cx, 1.7, cz);
        rack.add(col);
      }
    }

    // 3 Shelving Tiers
    const shelfGeo = new THREE.BoxGeometry(1.2, 0.06, 3.2);
    for (const sy of [0.6, 1.6, 2.6]) {
      const shelf = new THREE.Mesh(shelfGeo, this.matIndustrialSteel);
      shelf.position.y = sy;
      rack.add(shelf);

      // Cardboard boxes & crates on shelves
      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), this.matWood);
      box1.position.set(0, sy + 0.28, -0.7);
      rack.add(box1);

      const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), this.matDarkMetal);
      box2.position.set(0, sy + 0.25, 0.6);
      rack.add(box2);
    }

    // Main collision box
    const collisionMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 3.2), this.matDarkMetal);
    collisionMesh.position.y = 1.7;
    collisionMesh.visible = false;
    rack.add(collisionMesh);

    rack.position.set(x, y, z);
    rack.rotation.y = rotY;
    this.group.add(rack);
    this.collidables.push(collisionMesh);
    return rack;
  }

  _createOilDrum(x, y, z, color = 0x334155, fallen = false) {
    const drumMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.7 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.1, 12), drumMat);

    if (fallen) {
      drum.rotation.z = Math.PI / 2;
      drum.position.set(x, 0.38, z);
      // Puddle on floor
      const puddle = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), this.matPuddle);
      puddle.rotation.x = -Math.PI / 2;
      puddle.position.set(x + 0.5, 0.01, z);
      this.group.add(puddle);
    } else {
      drum.position.set(x, 0.55, z);
    }

    this.group.add(drum);
    this.collidables.push(drum);
    return drum;
  }

  _createLabWorkbench(x, y, z, rotY = 0) {
    const bench = new THREE.Group();
    // Stainless steel table
    const table = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.4), this.matIndustrialSteel);
    table.position.y = 0.45;
    bench.add(table);

    // Reagent rack with glass beakers
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.25), this.matDarkMetal);
    rack.position.set(-0.8, 1.05, -0.4);
    bench.add(rack);

    // Microscope
    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), this.matMetal);
    scope.position.set(0.6, 1.12, 0);
    bench.add(scope);

    bench.position.set(x, y, z);
    bench.rotation.y = rotY;
    this.group.add(bench);
    this.collidables.push(table);
    return bench;
  }

  // =========================================================================
  // POPULATE ALL 10 AREAS WITH HIGH-DENSITY DETAILS
  // =========================================================================

  _buildAllRoomProps() {
    // -------------------------------------------------------------
    // AREA 1: SECURITY CONTROL ROOM (Main Hub)
    // -------------------------------------------------------------
    // Main L-Shaped Security Desk Console
    const mainDesk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 2.0), this.matDarkMetal);
    mainDesk.position.set(0, 0.45, -2.2);
    this.group.add(mainDesk);
    this.collidables.push(mainDesk);

    // Operator Swivel Chair
    this._createChair(0, 0, -0.9, 0);
    // Secondary Visitor Chairs
    this._createChair(-4.8, 0, 0, Math.PI / 2);
    this._createChair(4.8, 0, 0, -Math.PI / 2);

    // Terminal Monitor #1 (Main Interactive Terminal)
    const mon1Stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.15, 8), this.matDarkMetal);
    mon1Stand.position.set(-1.0, 0.96, -2.2);
    this.group.add(mon1Stand);

    const mon1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.2), this.matMetal);
    mon1.position.set(-1.0, 1.35, -2.2);
    const screen1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), this.matScreenGlow);
    screen1.position.set(-1.0, 1.35, -2.09);
    this.group.add(mon1);
    this.group.add(screen1);

    this.interactables.push({
      mesh: mon1,
      type: 'terminal',
      id: 'main_terminal',
      prompt: '[E] Access Security Terminal (SECTOR-OS)',
      data: { system: 'terminal' }
    });

    // Bank of CCTV Surveillance Monitors
    const cctvStand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.25), this.matDarkMetal);
    cctvStand.position.set(1.2, 0.94, -2.2);
    this.group.add(cctvStand);

    const cctvBank = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.3), this.matMetal);
    cctvBank.position.set(1.2, 1.45, -2.2);
    const cctvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.9), this.matScreen);
    cctvScreen.position.set(1.2, 1.45, -2.04);
    this.group.add(cctvBank);
    this.group.add(cctvScreen);

    this.interactables.push({
      mesh: cctvBank,
      type: 'cctv',
      id: 'cctv_console',
      prompt: '[E] Monitor CCTV Surveillance Cameras',
      data: { system: 'cctv' }
    });

    // Radio Communication Station
    const radioMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), this.matWarning);
    radioMesh.position.set(-2.0, 1.15, -2.1);
    this.group.add(radioMesh);

    this.interactables.push({
      mesh: radioMesh,
      type: 'radio',
      id: 'radio_station',
      prompt: '[E] Access RF Radio Communications',
      data: { system: 'radio' }
    });

    // Initial Research Report Document on Desk
    const doc1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.5), this.matPaper);
    doc1.position.set(-0.2, 0.91, -1.6);
    this.group.add(doc1);

    this.interactables.push({
      mesh: doc1,
      type: 'document',
      id: 'initial_report',
      prompt: '[E] Read Sector 09 Initial Assessment Report',
      data: { docId: 'initial_report' }
    });

    // Details: Keyboards, Coffee Mug, Paper Stacks, Desk Lamp
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.25), this.matDarkMetal);
    kb.position.set(-1.0, 0.92, -1.6);
    this.group.add(kb);

    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), this.matPaper);
    mug.position.set(0.6, 0.96, -1.6);
    this.group.add(mug);

    // File Cabinets & Lockers in Control Room
    this._createFileCabinet(-5.5, 0, -4.5, Math.PI / 2);
    this._createFileCabinet(-5.5, 0, -3.5, Math.PI / 2);
    this._createLockerBank(5.5, 0, -4.5, -Math.PI / 2);

    // Dual Floor-to-Ceiling Server Racks on West Wall
    const sRack1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.8, 1.2), this.matDarkMetal);
    sRack1.position.set(-6.4, 1.4, 2.5);
    this.group.add(sRack1);
    this.collidables.push(sRack1);

    const sRack2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.8, 1.2), this.matDarkMetal);
    sRack2.position.set(-6.4, 1.4, 4.0);
    this.group.add(sRack2);
    this.collidables.push(sRack2);

    // Blinking Server Activity LEDs
    for (let sy = 0.6; sy <= 2.4; sy += 0.35) {
      for (const sz of [2.2, 2.5, 2.8, 3.7, 4.0, 4.3]) {
        const sLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), Math.random() < 0.5 ? this.matGreenGlow : this.matCyanGlow);
        sLed.position.set(-5.96, sy, sz);
        this.group.add(sLed);
        this.blinkingLights.push(sLed);
      }
    }

    // Coffee Break Counter on East Wall
    const coffeeCounter = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 1.8), this.matDarkMetal);
    coffeeCounter.position.set(6.4, 0.45, 2.5);
    this.group.add(coffeeCounter);
    this.collidables.push(coffeeCounter);

    const potMachine = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.3), this.matIndustrialSteel);
    potMachine.position.set(6.3, 1.12, 2.2);
    this.group.add(potMachine);

    const glassCarafe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.18, 8), this.matGlass);
    glassCarafe.position.set(6.3, 1.05, 2.6);
    this.group.add(glassCarafe);

    // Investigative Evidence Corkboard on East Wall
    const corkboard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 2.4), this.matWood);
    corkboard.position.set(6.96, 2.2, -1.8);
    this.group.add(corkboard);

    // Overturned Wastebasket with crumpled memo papers
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.4, 8), this.matMetal);
    bin.rotation.z = Math.PI / 2.3;
    bin.position.set(-1.8, 0.15, -1.2);
    this.group.add(bin);

    for (let p = 0; p < 4; p++) {
      const paperBall = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), this.matPaper);
      paperBall.position.set(-1.8 + (Math.random() - 0.5) * 0.4, 0.05, -1.2 + (Math.random() - 0.5) * 0.4);
      this.group.add(paperBall);
    }

    // Wall Clock on North Wall
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16), this.matPaper);
    clock.rotation.x = Math.PI / 2;
    clock.position.set(-2.5, 2.8, -6.9);
    this.group.add(clock);

    // Industrial UPS Battery Backup Cabinet (West Wall)
    const upsCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 1.2), this.matDarkMetal);
    upsCabinet.position.set(-6.4, 0.9, 5.5);
    this.group.add(upsCabinet);
    this.collidables.push(upsCabinet);

    for (let uy = 0.4; uy <= 1.4; uy += 0.3) {
      const uLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), this.matGreenGlow);
      uLed.position.set(-5.96, uy, 5.5);
      this.group.add(uLed);
    }

    // Emergency Facility Master Key Cabinet on North Wall
    const keyCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.12), this.matMetal);
    keyCabinet.position.set(-3.8, 2.0, -6.9);
    this.group.add(keyCabinet);
    const keyGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), this.matGlass);
    keyGlass.position.set(-3.8, 2.0, -6.83);
    this.group.add(keyGlass);

    // Vintage Desktop Dial Telephone on Security Desk
    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), this.matDarkMetal);
    phoneBase.position.set(-2.2, 0.95, -1.7);
    this.group.add(phoneBase);
    const phoneHandset = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.32), this.matIndustrialSteel);
    phoneHandset.position.set(-2.2, 1.02, -1.7);
    this.group.add(phoneHandset);

    // Desk Angle-Poise Task Lamp with warm pool of light
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), this.matIndustrialSteel);
    lampBase.position.set(-1.8, 0.92, -2.1);
    this.group.add(lampBase);
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), this.matMetal);
    lampArm.rotation.z = -0.3;
    lampArm.position.set(-1.75, 1.12, -2.1);
    this.group.add(lampArm);
    const lampCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 12, 1, true), this.matIndustrialSteel);
    lampCone.rotation.z = Math.PI / 2.8;
    lampCone.position.set(-1.62, 1.3, -2.1);
    this.group.add(lampCone);
    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), this.matPaper);
    lampBulb.position.set(-1.62, 1.28, -2.1);
    this.group.add(lampBulb);

    // Red Emergency Protocol Binders on Desk
    for (let b = 0; b < 3; b++) {
      const binder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.25), this.matRedBinder);
      binder.position.set(0.2 + b * 0.1, 1.06, -1.7);
      binder.rotation.y = (b * 0.08) - 0.1;
      this.group.add(binder);
    }

    // -------------------------------------------------------------
    // AREA 2: MAIN CORRIDOR DETAILS (Transit Spine & Hub Connectors)
    // -------------------------------------------------------------
    // Additional scattered crates & supply boxes in corridor alcoves
    const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const cr1 = new THREE.Mesh(crateGeo, this.matWood);
    cr1.position.set(-8, 0.6, 14.1);
    this.group.add(cr1);
    this.collidables.push(cr1);

    const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), this.matWood);
    cr2.position.set(8, 0.45, 10.9);
    this.group.add(cr2);
    this.collidables.push(cr2);

    const cr3 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), this.matWood);
    cr3.position.set(-28, 0.55, 14.0);
    this.group.add(cr3);
    this.collidables.push(cr3);

    const cr4 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), this.matWood);
    cr4.position.set(28, 0.4, 14.1);
    this.group.add(cr4);
    this.collidables.push(cr4);

    // Wet floor puddles in corridor
    const pud1 = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.5), this.matPuddle);
    pud1.rotation.x = -Math.PI / 2;
    pud1.position.set(-5, 0.01, 12.5);
    this.group.add(pud1);

    const pud2 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.0), this.matPuddle);
    pud2.rotation.x = -Math.PI / 2;
    pud2.position.set(24, 0.01, 12.5);
    this.group.add(pud2);

    const pud3 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.8), this.matPuddle);
    pud3.rotation.x = -Math.PI / 2;
    pud3.position.set(-22, 0.01, 12.2);
    this.group.add(pud3);

    // Industrial Chemical / Hazard Drums along transit corridor
    const barrelPositions = [
      { x: -33, z: 14.2, r: 0, mat: this.matHazard },
      { x: -32, z: 14.1, r: 0.3, mat: this.matDarkMetal },
      { x: -14, z: 10.8, r: 0, mat: this.matHazard },
      { x: 13, z: 14.2, r: -0.4, mat: this.matDarkMetal },
      { x: 35, z: 10.9, r: 0, mat: this.matHazard },
      { x: 42, z: 1.5, r: 0.2, mat: this.matDarkMetal }
    ];
    barrelPositions.forEach(bp => {
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), bp.mat);
      bMesh.position.set(bp.x, 0.48, bp.z);
      bMesh.rotation.y = bp.r;
      this.group.add(bMesh);
      this.collidables.push(bMesh);
    });

    // Knocked-over Leaking Barrel at X: -14.8
    const fallenBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.95, 12), this.matHazard);
    fallenBarrel.rotation.z = Math.PI / 2;
    fallenBarrel.rotation.y = 0.4;
    fallenBarrel.position.set(-14.8, 0.38, 11.2);
    this.group.add(fallenBarrel);
    this.collidables.push(fallenBarrel);

    // Yellow Floor Warning Cones ("CAUTION WET FLOOR")
    const conePositions = [
      { x: -6.5, z: 12.8 },
      { x: 22.5, z: 12.8 },
      { x: 0, z: -10 }
    ];
    conePositions.forEach(cp => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 4), this.matHazard);
      cone.position.set(cp.x, 0.33, cp.z);
      cone.rotation.y = Math.PI / 4;
      this.group.add(cone);
    });

    // Wheeled Emergency Medical Stretcher in Transit Corridor near Medical Door (X: 16.5, Z: 11)
    const gurney = new THREE.Group();
    const gFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.8), this.matIndustrialSteel);
    gFrame.position.set(0, 0.75, 0);
    gurney.add(gFrame);
    const gMat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.75), this.matPaper);
    gMat.position.set(0, 0.85, 0);
    gurney.add(gMat);
    for (const legX of [-0.9, 0.9]) {
      for (const legZ of [-0.35, 0.35]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), this.matIndustrialSteel);
        leg.position.set(legX, 0.38, legZ);
        gurney.add(leg);
      }
    }
    gurney.position.set(16.5, 0, 11.0);
    gurney.rotation.y = 0.15;
    this.group.add(gurney);
    this.collidables.push(gFrame);

    // Mobile Janitorial Cart with mop and bucket in corridor (X: -2.8, Z: 14.1)
    const janitorCart = new THREE.Group();
    // 4 Caster Wheels to floor
    for (const wx of [-0.35, 0.35]) {
      for (const wz of [-0.18, 0.18]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), this.matBlackRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.05, wz);
        janitorCart.add(wheel);
      }
    }
    const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.5), this.matDarkMetal);
    cBase.position.set(0, 0.35, 0);
    janitorCart.add(cBase);
    const cBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.32, 8), this.matHazard);
    cBucket.position.set(-0.2, 0.8, 0);
    janitorCart.add(cBucket);
    const cHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), this.matWood);
    cHandle.rotation.z = -0.3;
    cHandle.position.set(-0.1, 1.3, 0);
    janitorCart.add(cHandle);
    janitorCart.position.set(-2.8, 0, 14.1);
    this.group.add(janitorCart);
    this.collidables.push(cBase);

    // Wall-mounted Red Fire Axe emergency glass boxes along corridor
    for (const axPos of [{ x: -10, z: 10.2 }, { x: 10, z: 10.2 }, { x: -30, z: 10.2 }, { x: 30, z: 10.2 }]) {
      const axCase = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.14), this.matWarning);
      axCase.position.set(axPos.x, 2.1, axPos.z);
      this.group.add(axCase);
      const axGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.8), this.matGlass);
      axGlass.position.set(axPos.x, 2.1, axPos.z + 0.08);
      this.group.add(axGlass);
    }

    // Heavy snaking industrial conduits with blinking status nodes along corridor floor edges
    for (let cx = -36; cx <= 36; cx += 6) {
      if (Math.abs(cx) < 2) continue; // skip hub entrance
      const conduitBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.2), this.matIndustrialSteel);
      conduitBox.position.set(cx, 1.5, 10.2);
      this.group.add(conduitBox);

      const statusLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), Math.random() < 0.3 ? this.matRedGlow : this.matGreenGlow);
      statusLed.position.set(cx, 1.5, 10.32);
      this.group.add(statusLed);
      this.blinkingLights.push(statusLed);
    }

    // Overhead Industrial Cable Tray Ladders running the full length of Main Corridor
    for (let tx = -36; tx <= 42; tx += 4) {
      const trayCross = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.4), this.matIndustrialSteel);
      trayCross.position.set(tx, 3.95, 12.5);
      this.group.add(trayCross);

      // Hanging colored industrial cables in tray
      for (const cz of [12.2, 12.5, 12.8]) {
        const cColor = cz === 12.2 ? this.matRedAlarm : (cz === 12.5 ? this.matPipeYellow : this.matDarkMetal);
        const cableRun = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.0, 6), cColor);
        cableRun.rotation.z = Math.PI / 2;
        cableRun.position.set(tx, 3.98, cz);
        this.group.add(cableRun);
      }
    }

    // Decontamination Airlock Step-in Floor Grate at Research Lab Threshold (X: 0, Z: -14.5)
    const decontamGrate = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), this.matMetalGrate);
    decontamGrate.rotation.x = -Math.PI / 2;
    decontamGrate.position.set(0, 0.015, -14.5);
    this.group.add(decontamGrate);

    const decontamBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), this.matWarning);
    decontamBeacon.position.set(1.4, 3.2, -14.8);
    this.group.add(decontamBeacon);
    this.blinkingLights.push(decontamBeacon);

    // Broken Ceiling Section with Dangling Insulation Panel (X: -26, Z: 12.5)
    const brokenTile = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 1.4), this.matIndustrialSteel);
    brokenTile.position.set(-26, 3.7, 12.5);
    brokenTile.rotation.z = 0.35;
    brokenTile.rotation.x = -0.2;
    this.group.add(brokenTile);

    // Wall-Mounted Emergency Blue Intercom Call Boxes
    for (const iboxX of [-20, 20]) {
      const iBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.18), this.matIndustrialSteel);
      iBox.position.set(iboxX, 1.8, 14.85);
      this.group.add(iBox);
      const iBtn = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), this.matCyanGlow);
      iBtn.position.set(iboxX, 1.8, 14.75);
      this.group.add(iBtn);
    }

    // -------------------------------------------------------------
    // AREA 3: RESEARCH LABORATORY C
    // -------------------------------------------------------------
    // Central Octagonal Containment Platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.5, 8), this.matDarkMetal);
    platform.position.set(0, 0.25, -23);
    this.group.add(platform);
    this.collidables.push(platform);

    // Holographic Containment Glass Cylinder
    const chamberGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 3.2, 16),
      this.matGlass
    );
    chamberGlass.position.set(0, 1.85, -23);
    this.group.add(chamberGlass);
    this.collidables.push(chamberGlass);

    // Floating Rotating Cognitive Artifact inside
    const artifactCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), this.matCyanGlow);
    artifactCore.position.set(0, 1.85, -23);
    this.group.add(artifactCore);
    this.artifactCore = artifactCore;

    // 2 Large Research Workbenches with Microscopes & Flasks
    this._createLabWorkbench(-6.2, 0, -21, Math.PI / 2);
    this._createLabWorkbench(6.2, 0, -21, -Math.PI / 2);

    // Chemical Fume Hood with Acrylic Glass Sash
    const fumeHood = new THREE.Group();
    const fBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.2), this.matDarkMetal);
    fBase.position.y = 0.45;
    fumeHood.add(fBase);
    const fUpper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.2), this.matIndustrialSteel);
    fUpper.position.y = 1.7;
    fumeHood.add(fUpper);
    const fSash = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 0.05), this.matGlass);
    fSash.position.set(0, 1.8, 0.55);
    fumeHood.add(fSash);
    const fLight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), this.matCyanGlow);
    fLight.position.set(0, 2.4, 0);
    fumeHood.add(fLight);
    fumeHood.position.set(-7.5, 0, -25);
    this.group.add(fumeHood);
    this.collidables.push(fBase);

    // Benchtop Centrifuge Unit
    const centrifuge = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.35, 12), this.matMetal);
    centrifuge.position.set(5.5, 1.08, -19.5);
    this.group.add(centrifuge);

    // Broken Glass Specimen Cylinder with Biohazard Cyan Residue
    const brokenGlassGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
    const brokenGlass = new THREE.Mesh(brokenGlassGeo, this.matGlass);
    brokenGlass.rotation.z = Math.PI / 2.5;
    brokenGlass.position.set(2.8, 0.25, -27);
    this.group.add(brokenGlass);

    const bioPuddle = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), this.matCyanGlow);
    bioPuddle.rotation.x = -Math.PI / 2;
    bioPuddle.position.set(2.8, 0.01, -27);
    this.group.add(bioPuddle);

    // Large Formula Whiteboard on North Wall
    const whiteboard = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.0), this.matWhiteboard);
    whiteboard.position.set(0, 2.2, -30.8);
    this.group.add(whiteboard);

    // Flammable Safety Cabinet (Yellow)
    const chemCab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.8), this.matWarning);
    chemCab.position.set(-7.5, 1.1, -29);
    this.group.add(chemCab);
    this.collidables.push(chemCab);

    // Lab Chairs tucked near workbenches
    this._createChair(-5.2, 0, -21, Math.PI / 2);
    this._createChair(5.2, 0, -21, -Math.PI / 2);

    // High-Tech Containment Telemetry Workstation near the Artifact Platform (X: 3.2, Z: -25)
    const telemetryDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), this.matDarkMetal);
    telemetryDesk.position.set(3.2, 0.45, -25);
    this.group.add(telemetryDesk);
    this.collidables.push(telemetryDesk);

    const tStand1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.1, 6), this.matDarkMetal);
    tStand1.position.set(2.9, 0.95, -25);
    this.group.add(tStand1);

    const tMon1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), this.matMetal);
    tMon1.position.set(2.9, 1.2, -25);
    this.group.add(tMon1);
    const tScr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), this.matScreenGlow);
    tScr1.position.set(2.9, 1.2, -24.95);
    this.group.add(tScr1);

    const tStand2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.1, 6), this.matDarkMetal);
    tStand2.position.set(3.6, 0.95, -25);
    this.group.add(tStand2);

    const tMon2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), this.matMetal);
    tMon2.position.set(3.6, 1.2, -25);
    this.group.add(tMon2);
    const tScr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), this.matScreenOsc);
    tScr2.position.set(3.6, 1.2, -24.95);
    this.group.add(tScr2);

    // Wall-Mounted Stainless Chemical Reagent Shelving (East Wall, X: 8.5, Z: -23)
    const chemRack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 3.2), this.matIndustrialSteel);
    chemRack.position.set(8.7, 1.4, -23);
    this.group.add(chemRack);
    this.collidables.push(chemRack);

    // Specimen Glass Jars on Shelf
    for (let sy = 0.8; sy <= 2.2; sy += 0.5) {
      for (let sz = -24.2; sz <= -21.8; sz += 0.45) {
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 8), this.matGlass);
        jar.position.set(8.5, sy, sz);
        this.group.add(jar);
      }
    }

    // Emergency Eye-Wash & Drench Shower Unit (West Wall, X: -8.5, Z: -18)
    const eyeShower = new THREE.Group();
    // Continuous pipe reaching from floor to overhead ceiling
    const showerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6), this.matPipeYellow);
    showerPipe.position.y = 1.9;
    eyeShower.add(showerPipe);
    const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.1, 0.12, 12), this.matWarning);
    showerHead.position.set(0.4, 3.7, 0);
    eyeShower.add(showerHead);
    const eyeBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.18, 12), this.matWarning);
    eyeBowl.position.set(0.3, 1.1, 0);
    eyeShower.add(eyeBowl);
    eyeShower.position.set(-8.5, 0, -18);
    this.group.add(eyeShower);

    // Ultra-Low Temperature Biohazard Freezer (-80°C) (X: 7.5, Z: -29)
    const bioFreezer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 1.1), this.matIndustrialSteel);
    bioFreezer.position.set(7.5, 1.1, -29);
    this.group.add(bioFreezer);
    this.collidables.push(bioFreezer);

    const freezerDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), this.matGlowRed);
    freezerDisplay.position.set(7.5, 1.7, -28.44);
    this.group.add(freezerDisplay);

    // -------------------------------------------------------------
    // AREA 4: MEDICAL & TRAUMA WARD
    // -------------------------------------------------------------
    // 2 Hospital Beds positioned along walls to leave wide central aisle (X = 18..22)
    this._createHospitalBed(16.5, 0, 4.0, Math.PI / 2);
    this._createHospitalBed(23.5, 0, 4.0, -Math.PI / 2);

    // Articulated Surgical Examination Lamp above west bed
    const surgLamp = new THREE.Group();
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), this.matMetal);
    arm1.position.y = 3.6;
    surgLamp.add(arm1);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.2, 16, 1, true), this.matIndustrialSteel);
    dish.rotation.x = Math.PI;
    dish.position.set(0, 2.9, 0);
    surgLamp.add(dish);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.matScreenGlow);
    bulb.position.set(0, 2.85, 0);
    surgLamp.add(bulb);
    surgLamp.position.set(16.5, 0, 4.0);
    this.group.add(surgLamp);

    // Dual IV Drip Stands beside beds
    const createIVStand = (x, z) => {
      const stand = new THREE.Group();
      // 5-Spoke Caster Wheel Base to floor
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 8), this.matDarkMetal);
      base.position.y = 0.02;
      stand.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), this.matMetal);
      pole.position.y = 1.1;
      stand.add(pole);
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.06), this.matGlass);
      bag.position.set(0.08, 1.95, 0);
      stand.add(bag);
      stand.position.set(x, 0, z);
      this.group.add(stand);
    };
    createIVStand(18.5, 5.0);
    createIVStand(21.5, 5.0);

    // Vital Signs ECG Cardiac Monitor Trolley
    const ecgTrolley = new THREE.Group();
    const ecgCart = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.5), this.matMetal);
    ecgCart.position.y = 0.45;
    ecgTrolley.add(ecgCart);
    const ecgMon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.2), this.matDarkMetal);
    ecgMon.position.set(0, 1.1, 0);
    ecgTrolley.add(ecgMon);
    const ecgScr = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), this.matScreenGlow);
    ecgScr.position.set(0, 1.1, 0.11);
    ecgTrolley.add(ecgScr);
    ecgTrolley.position.set(22.0, 0, 2.0);
    this.group.add(ecgTrolley);
    this.collidables.push(ecgCart);

    // Wheelchair & Medical Gurney
    this._createWheelchair(16.5, 0, 0, Math.PI / 4);

    // Emergency Crash Cart
    const cart = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.6), this.matRedAlarm);
    cart.position.set(24.5, 0.5, 1);
    this.group.add(cart);
    this.collidables.push(cart);

    // Document: Session Log #47 on west bed
    const medDoc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.45), this.matPaper);
    medDoc.position.set(16.5, 0.86, 4.0);
    this.group.add(medDoc);

    this.interactables.push({
      mesh: medDoc,
      type: 'document',
      id: 'missing_report',
      prompt: '[E] Examine Session Log #47 (Subject 12)',
      data: { docId: 'missing_report' }
    });

    // Dark Bloodstains on floor
    const bloodSplat = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), this.matBlood);
    bloodSplat.rotation.x = -Math.PI / 2;
    bloodSplat.position.set(20.5, 0.01, 3.5);
    this.group.add(bloodSplat);

    // Bloody drag trail leading from Bed #2 toward corridor
    const dragTrail = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4.5), this.matBlood);
    dragTrail.rotation.x = -Math.PI / 2;
    dragTrail.position.set(20.0, 0.012, 7.5);
    this.group.add(dragTrail);

    // Wall-Mounted Illuminated Medical X-Ray Lightbox (North Wall, X: 20, Z: -1.8)
    const xrayBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.12), this.matDarkMetal);
    xrayBox.position.set(20, 2.2, -1.8);
    this.group.add(xrayBox);
    const xrayScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), this.matXRay);
    xrayScreen.position.set(20, 2.2, -1.73);
    this.group.add(xrayScreen);

    // Suspended Privacy Divider Curtains between Hospital Beds
    for (const curX of [18.5, 21.5]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 3.8), this.matMetal);
      rail.position.set(curX, 3.8, 6.0);
      this.group.add(rail);

      const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.6, 3.4), this.matFabric);
      curtain.position.set(curX, 2.5, 6.0);
      this.group.add(curtain);
    }

    // Medicine & Narcotic Lockbox on East Wall
    const medCab = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 1.2), this.matIndustrialSteel);
    medCab.position.set(25.8, 2.0, 5.0);
    this.group.add(medCab);
    const medGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), this.matGlass);
    medGlass.rotation.y = -Math.PI / 2;
    medGlass.position.set(25.69, 2.0, 5.0);
    this.group.add(medGlass);

    // Biohazard Foot-Pedal Waste Can
    const bioCan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), this.matWarning);
    bioCan.position.set(18.0, 0.25, 2.0);
    this.group.add(bioCan);

    // Bedside Nightstands
    for (const nX of [16.0, 19.0, 22.0]) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), this.matMetal);
      stand.position.set(nX, 0.35, 7.8);
      this.group.add(stand);
      this.collidables.push(stand);
    }

    // -------------------------------------------------------------
    // AREA 5: ELECTRICAL SUBSTATION 09
    // -------------------------------------------------------------
    // 2 Massive Industrial Diesel Generators
    this._createIndustrialGenerator(-23, 0, 0, 0);
    this._createIndustrialGenerator(-17, 0, 0, 0);

    // Step-Up Transformer with Ribbed Insulators
    const xform = new THREE.Group();
    const xTank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.2), this.matDarkMetal);
    xTank.position.y = 0.7;
    xform.add(xTank);
    for (const bx of [-0.5, 0, 0.5]) {
      const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 8), this.matPipeYellow);
      bush.position.set(bx, 1.7, 0);
      xform.add(bush);
      const term = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), this.matMetal);
      term.position.set(bx, 2.05, 0);
      xform.add(term);
    }
    xform.position.set(-23.5, 0, 1.5);
    this.group.add(xform);
    this.collidables.push(xTank);

    // Diamond Tread Cable Trench Grates on Floor
    for (let tz = 0; tz <= 6; tz += 2.0) {
      const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), this.matMetalGrate);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(-20, 0.01, tz);
      this.group.add(grate);
    }

    // Main Power Breaker Panel (Interactive Switch)
    const breakerBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 0.4), this.matWarning);
    breakerBox.position.set(-20, 1.8, -1.8);
    this.group.add(breakerBox);

    const breakerSwitch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.3), this.matRedAlarm);
    breakerSwitch.position.set(-20, 1.8, -1.6);
    this.group.add(breakerSwitch);

    this.interactables.push({
      mesh: breakerSwitch,
      type: 'breaker',
      id: 'main_power_breaker',
      prompt: '[E] Flip Main Power Grid Switch',
      data: { powered: false }
    });

    // Maintenance Workbench with Note
    const elecBench = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.9, 1.2), this.matIndustrialSteel);
    elecBench.position.set(-23.5, 0.45, 7.5);
    this.group.add(elecBench);
    this.collidables.push(elecBench);

    const maintNote = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), this.matPaper);
    maintNote.position.set(-23.5, 0.91, 7.5);
    this.group.add(maintNote);

    this.interactables.push({
      mesh: maintNote,
      type: 'document',
      id: 'keycard_note',
      prompt: '[E] Read Maintenance Note',
      data: { docId: 'keycard_note' }
    });

    // High-Voltage Switchgear Distribution Cabinets (East Wall, X: -14.4, Z: 3.5)
    const switchgearBank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 5.0), this.matDarkMetal);
    switchgearBank.position.set(-14.3, 1.3, 3.5);
    this.group.add(switchgearBank);
    this.collidables.push(switchgearBank);

    // Dials and meters on switchgear
    for (let sy = 1.6; sy <= 2.2; sy += 0.3) {
      for (let sz = 1.5; sz <= 5.5; sz += 1.0) {
        const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12), this.matMetal);
        gauge.rotation.z = Math.PI / 2;
        gauge.position.set(-14.56, sy, sz);
        this.group.add(gauge);
      }
    }

    // Heavy Industrial Wooden Cable Spool / Reel (X: -24.5, Z: 4.5)
    const cableSpool = new THREE.Group();
    const flangeL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 16), this.matWood);
    flangeL.rotation.z = Math.PI / 2;
    flangeL.position.x = -0.4;
    cableSpool.add(flangeL);
    const flangeR = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 16), this.matWood);
    flangeR.rotation.z = Math.PI / 2;
    flangeR.position.x = 0.4;
    cableSpool.add(flangeR);
    const drumCore = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.74, 16), this.matDarkMetal);
    drumCore.rotation.z = Math.PI / 2;
    cableSpool.add(drumCore);
    cableSpool.position.set(-24.5, 0.7, 4.5);
    this.group.add(cableSpool);
    this.collidables.push(drumCore);

    // CO2 Fire Suppression Cylinder Bank (Northwest Corner, X: -25.2, Z: -1.0)
    const co2Bank = new THREE.Group();
    for (let c = 0; c < 3; c++) {
      const co2Cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.8, 12), this.matRedAlarm);
      co2Cyl.position.set(c * 0.45, 0.9, 0);
      co2Bank.add(co2Cyl);
    }
    const co2Manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), this.matPipe);
    co2Manifold.rotation.z = Math.PI / 2;
    co2Manifold.position.set(0.45, 1.9, 0);
    co2Bank.add(co2Manifold);
    co2Bank.position.set(-25.2, 0, -1.0);
    this.group.add(co2Bank);

    // Rolling Mechanic's Red Tool Chest (X: -16.5, Z: 7.5)
    const toolChest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.6), this.matRedAlarm);
    toolChest.position.set(-16.5, 0.5, 7.5);
    this.group.add(toolChest);
    this.collidables.push(toolChest);

    // Heavy Black Rubber Safety Insulating Runner Mat in front of Switchgear
    const rubberMat = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 5.0), this.matBlackRubber);
    rubberMat.rotation.x = -Math.PI / 2;
    rubberMat.position.set(-15.2, 0.015, 3.5);
    this.group.add(rubberMat);

    // -------------------------------------------------------------
    // AREA 6: STORAGE BAY A (Warehousing)
    // -------------------------------------------------------------
    // 4 Heavy-Duty Storage Racks
    this._createStorageRack(-24.5, 0, 18, 0);
    this._createStorageRack(-24.5, 0, 24, 0);
    this._createStorageRack(-15.5, 0, 18, 0);
    this._createStorageRack(-15.5, 0, 24, 0);

    // Stacked Wooden Shipping Pallets
    const createPallet = (x, y, z, rotY = 0) => {
      const pal = new THREE.Group();
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1.2), this.matWood);
      top.position.y = 0.12;
      pal.add(top);
      for (const pz of [-0.45, 0, 0.45]) {
        const stringer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.08), this.matWood);
        stringer.position.set(0, 0.05, pz);
        pal.add(stringer);
      }
      pal.position.set(x, y, z);
      pal.rotation.y = rotY;
      this.group.add(pal);
    };
    createPallet(-18, 0, 19, 0.3);
    createPallet(-18, 0.14, 19, 0.3);

    // Hand Hydraulic Pallet Jack (Pallet Truck)
    const palletJack = new THREE.Group();
    const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.2), this.matWarning);
    forkL.position.set(-0.25, 0.06, 0.6);
    const forkR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.2), this.matWarning);
    forkR.position.set(0.25, 0.06, 0.6);
    palletJack.add(forkL);
    palletJack.add(forkR);
    const handleP = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), this.matDarkMetal);
    handleP.position.set(0, 0.6, -0.1);
    handleP.rotation.x = -0.3;
    palletJack.add(handleP);
    palletJack.position.set(-20.5, 0, 20.0);
    this.group.add(palletJack);

    // 55-Gallon Oil Drums (some standing, one fallen with puddle)
    this._createOilDrum(-19, 0, 25, 0xd97706, false);
    this._createOilDrum(-20, 0, 25, 0x1e3a8a, false);
    this._createOilDrum(-18, 0, 22, 0x334155, true);

    // Level 4 Archive Keycard Item on Shelf
    const keycardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.05, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0369a1, roughness: 0.2 })
    );
    keycardMesh.position.set(-24.1, 1.65, 18.2);
    this.group.add(keycardMesh);

    this.interactables.push({
      mesh: keycardMesh,
      type: 'item',
      id: 'archive_keycard',
      prompt: '[E] Take Restricted Archive Keycard (Level 4)',
      data: { item: 'archive_keycard', name: 'Restricted Archive Keycard' }
    });

    // Dr. Vasquez Personal Journal
    const journalDoc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), this.matPaper);
    journalDoc.position.set(-15.5, 1.65, 24.2);
    this.group.add(journalDoc);

    this.interactables.push({
      mesh: journalDoc,
      type: 'document',
      id: 'conflicting_doc_b',
      prompt: '[E] Read Dr. Vasquez\'s Personal Journal',
      data: { docId: 'conflicting_doc_b' }
    });

    // Storage Cargo Details on Racks: Cardboard Boxes & Pelican Cases resting on shelves
    const rackCargoLocations = [
      { x: -24.5, y: 0.88, z: 18.0, mat: this.matCardboard, w: 0.6, h: 0.5, d: 0.6 },
      { x: -24.5, y: 0.93, z: 18.8, mat: this.matWood, w: 0.7, h: 0.6, d: 0.7 },
      { x: -24.5, y: 1.83, z: 18.2, mat: this.matDarkMetal, w: 0.8, h: 0.4, d: 0.5 }, // Pelican case
      { x: -24.5, y: 0.905, z: 24.0, mat: this.matCardboard, w: 0.65, h: 0.55, d: 0.65 },
      { x: -24.5, y: 1.98, z: 23.8, mat: this.matWood, w: 0.7, h: 0.6, d: 0.7 },
      { x: -15.5, y: 0.93, z: 18.0, mat: this.matWood, w: 0.7, h: 0.6, d: 0.7 },
      { x: -15.5, y: 1.88, z: 18.2, mat: this.matCardboard, w: 0.6, h: 0.5, d: 0.6 },
      { x: -15.5, y: 0.93, z: 24.0, mat: this.matCardboard, w: 0.6, h: 0.6, d: 0.6 }
    ];
    rackCargoLocations.forEach(rc => {
      const cBox = new THREE.Mesh(new THREE.BoxGeometry(rc.w, rc.h, rc.d), rc.mat);
      cBox.position.set(rc.x, rc.y, rc.z);
      this.group.add(cBox);
    });

    // Heavy Industrial 2-Wheel Hand Truck (Sack Barrow)
    const handTruck = new THREE.Group();
    const htFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.05), this.matRedAlarm);
    htFrame.position.y = 0.7;
    handTruck.add(htFrame);
    const htPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), this.matDarkMetal);
    htPlate.position.set(0, 0.02, 0.2);
    handTruck.add(htPlate);
    const htWheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), this.matBlackRubber);
    htWheelL.rotation.z = Math.PI / 2;
    htWheelL.position.set(-0.28, 0.12, 0);
    handTruck.add(htWheelL);
    const htWheelR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), this.matBlackRubber);
    htWheelR.rotation.z = Math.PI / 2;
    htWheelR.position.set(0.28, 0.12, 0);
    handTruck.add(htWheelR);
    handTruck.rotation.x = -0.3;
    handTruck.position.set(-16.8, 0, 19.5);
    this.group.add(handTruck);
    this.collidables.push(htFrame);

    // Overhead Hanging Sheet Metal Aisle Signs
    const createAisleSign = (x, z, text) => {
      const aSign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.04), this.matWarning);
      aSign.position.set(x, 3.4, z);
      this.group.add(aSign);
    };
    createAisleSign(-24.5, 21, 'BAY A-1');
    createAisleSign(-15.5, 21, 'BAY A-2');

    // -------------------------------------------------------------
    // AREA 7: COMMUNICATIONS & RF ARRAY
    // -------------------------------------------------------------
    const commTable = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.9, 1.8), this.matDarkMetal);
    commTable.position.set(19.8, 0.45, 24.5);
    this.group.add(commTable);
    this.collidables.push(commTable);

    // Dual Operator Chairs
    this._createChair(18.8, 0, 23.2, Math.PI);
    this._createChair(21.2, 0, 23.2, Math.PI);

    // RF Frequency Tuner Unit
    const tuner = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.7), this.matMetal);
    tuner.position.set(19.6, 1.2, 24.5);
    this.group.add(tuner);

    this.interactables.push({
      mesh: tuner,
      type: 'radio_tuner',
      id: 'comm_tuner',
      prompt: '[E] Synchronize Resonance Frequency (47.3 Hz)',
      data: { targetFreq: 47.3 }
    });

    // Official Shutdown Report Document
    const commDoc = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.45), this.matPaper);
    commDoc.position.set(21.6, 0.91, 24.5);
    this.group.add(commDoc);

    this.interactables.push({
      mesh: commDoc,
      type: 'document',
      id: 'conflicting_doc_a',
      prompt: '[E] Read Official Shutdown Report',
      data: { docId: 'conflicting_doc_a' }
    });

    // Reel-to-Reel Audio Recorder Console with Rotating Reels (firmly sitting on desk)
    const reelMachine = new THREE.Group();
    const reelBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.55), this.matIndustrialSteel);
    reelBody.position.y = 0.25;
    reelMachine.add(reelBody);

    const reelL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), this.matMetal);
    reelL.rotation.x = Math.PI / 2;
    reelL.position.set(-0.25, 0.52, 0.12);
    reelMachine.add(reelL);
    this.animatedReels.push(reelL);

    const reelR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12), this.matMetal);
    reelR.rotation.x = Math.PI / 2;
    reelR.position.set(0.25, 0.52, 0.12);
    reelMachine.add(reelR);
    this.animatedReels.push(reelR);

    reelMachine.position.set(17.6, 0.90, 24.5);
    this.group.add(reelMachine);
    this.collidables.push(reelBody);

    // Operator Padded Headset on Desk
    const headset = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16, Math.PI), this.matLeather);
    headset.position.set(20.4, 0.94, 23.6);
    headset.rotation.x = Math.PI / 2;
    this.group.add(headset);

    // Cathode-Ray Oscilloscope Unit on Comm Desk (47.3 Hz Signal Visualizer)
    const oscBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.5), this.matDarkMetal);
    oscBody.position.set(17.8, 1.15, 24.5);
    this.group.add(oscBody);
    const oscScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.32), this.matOscilloscope);
    oscScreen.position.set(17.8, 1.15, 24.24);
    this.group.add(oscScreen);

    // Broadcast Microphone Scissor Boom Arm with Pop Filter
    const micArm = new THREE.Group();
    const ma1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), this.matDarkMetal);
    ma1.position.y = 0.3;
    ma1.rotation.z = -0.4;
    micArm.add(ma1);
    const ma2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), this.matDarkMetal);
    ma2.position.set(0.2, 0.65, 0);
    ma2.rotation.z = 0.5;
    micArm.add(ma2);
    const micHead = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8), this.matIndustrialSteel);
    micHead.position.set(0.35, 0.75, 0);
    micArm.add(micHead);
    micArm.position.set(19.8, 0.9, 24.2);
    this.group.add(micArm);

    // Full-Height Wall-Mounted RF Transceiver Rack on East Wall (X: 25.5, Z: 21.0)
    const rfRack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.8, 2.2), this.matDarkMetal);
    rfRack.position.set(25.4, 1.4, 21.0);
    this.group.add(rfRack);
    this.collidables.push(rfRack);

    for (let ry = 0.6; ry <= 2.4; ry += 0.4) {
      for (const rz of [20.4, 21.0, 21.6]) {
        const rLed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), Math.random() < 0.5 ? this.matGlowAmber : this.matCyanGlow);
        rLed.position.set(25.04, ry, rz);
        this.group.add(rLed);
        this.blinkingLights.push(rLed);
      }
    }

    // Magnetic Audio Tape Library Shelving on West Wall (X: 14.5, Z: 24.0)
    const tapeShelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 1.8), this.matWood);
    tapeShelf.position.set(14.4, 1.1, 24.0);
    this.group.add(tapeShelf);
    this.collidables.push(tapeShelf);

    // Acoustic Foam Sound-Dampening Baffle Wall Panels (North Wall)
    for (let fx = 16.0; fx <= 24.0; fx += 2.0) {
      const foamPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), this.matAcousticFoam);
      foamPanel.position.set(fx, 2.2, 15.15);
      this.group.add(foamPanel);
    }

    // -------------------------------------------------------------
    // AREA 8: RESTRICTED ARCHIVE
    // -------------------------------------------------------------
    // 4 Tall Filing Cabinets & Archive Desks
    this._createFileCabinet(38, 0, -11, Math.PI / 2);
    this._createFileCabinet(38, 0, -8, Math.PI / 2);
    this._createFileCabinet(50, 0, -11, -Math.PI / 2);
    this._createFileCabinet(50, 0, -8, -Math.PI / 2);

    const archDesk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.6), this.matMetal);
    archDesk.position.set(39.0, 0.45, -11.0);
    this.group.add(archDesk);
    this.collidables.push(archDesk);

    // Blueprint Drafting Table tilted at 30 degrees with Blueprint
    const draftTable = new THREE.Group();
    const dFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.2), this.matWood);
    dFrame.position.y = 0.45;
    draftTable.add(dFrame);

    const dBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.1), this.matPaper);
    dBoard.position.set(0, 1.02, 0);
    dBoard.rotation.x = 0.35;
    draftTable.add(dBoard);

    draftTable.position.set(49.0, 0, -11.0);
    this.group.add(draftTable);
    this.collidables.push(dFrame);

    // Project ECHO Original Experiment Logs on Archive Desk
    const expLogs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.6), this.matPaper);
    expLogs.position.set(39.0, 0.94, -11.0);
    this.group.add(expLogs);

    this.interactables.push({
      mesh: expLogs,
      type: 'document',
      id: 'experiment_logs',
      prompt: '[E] Read Project ECHO Original Experiment Logs',
      data: { docId: 'experiment_logs' }
    });

    // Tall Steel Mobile Compactor Archive Shelving Units creating dense aisles
    for (const shX of [39.5, 48.5]) {
      for (const shZ of [-15.0, -7.0]) {
        const compactor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.8), this.matDarkMetal);
        compactor.position.set(shX, 1.4, shZ);
        this.group.add(compactor);
        this.collidables.push(compactor);

        // Banker Boxes on Shelves
        for (let by = 0.6; by <= 2.2; by += 0.6) {
          const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.65), this.matPaper);
          bBox.position.set(shX + (Math.random() - 0.5) * 1.2, by, shZ);
          this.group.add(bBox);
        }
      }
    }

    // Vintage Hooded Microfiche Viewing Station (West Wall, X: 38.0, Z: -6.5)
    const microfiche = new THREE.Group();
    const mfBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.7), this.matIndustrialSteel);
    mfBody.position.y = 0.45;
    microfiche.add(mfBody);
    const mfHood = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.5), this.matDarkMetal);
    mfHood.position.set(0, 1.15, 0);
    microfiche.add(mfHood);
    const mfScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), this.matScreenGlow);
    mfScreen.position.set(0, 1.15, 0.26);
    microfiche.add(mfScreen);
    microfiche.position.set(38.0, 0, -6.5);
    this.group.add(microfiche);
    this.collidables.push(mfBody);

    // Industrial Cross-Cut Document Shredder (East Wall, X: 49.5, Z: -6.5)
    const shredder = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.6), this.matDarkMetal);
    shredder.position.set(49.5, 0.45, -6.5);
    this.group.add(shredder);
    this.collidables.push(shredder);

    // -------------------------------------------------------------
    // AREA 9: UNDERGROUND ELEVATOR SHAFT
    // -------------------------------------------------------------
    // Heavy Structural Steel I-Beam Guide Rails for Elevator Cage
    for (const ex of [-41.5, -36.5]) {
      const guideRail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.2, 0.15), this.matIndustrialSteel);
      guideRail.position.set(ex, 2.1, 12.5);
      this.group.add(guideRail);
    }

    // Industrial Elevator Steel Cage Frame with Accordion Scissor Gate
    const elevatorCar = new THREE.Group();
    const carFloor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 4.8), this.matMetalGrate);
    carFloor.position.y = 0.08;
    elevatorCar.add(carFloor);
    const carCeil = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 4.8), this.matDarkMetal);
    carCeil.position.y = 3.2;
    elevatorCar.add(carCeil);
    // 4 Corner Steel Posts
    for (const cpx of [-2.3, 2.3]) {
      for (const cpz of [-2.3, 2.3]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 0.1), this.matIndustrialSteel);
        post.position.set(cpx, 1.6, cpz);
        elevatorCar.add(post);
      }
    }
    // Collapsible Scissor Gate at entrance
    const scissorGate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.8, 4.2), this.matIndustrialSteel);
    scissorGate.position.set(2.35, 1.5, 0);
    elevatorCar.add(scissorGate);

    elevatorCar.position.set(-39.0, 0, 12.5);
    this.group.add(elevatorCar);

    // Deep Shaft Pit Abyss beneath grating with red flashing warning beacons
    const pitBeacon1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.matRedAlarm);
    pitBeacon1.position.set(-41.0, 0.05, 10.5);
    this.group.add(pitBeacon1);
    this.blinkingLights.push(pitBeacon1);

    const pitBeacon2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.matRedAlarm);
    pitBeacon2.position.set(-37.0, 0.05, 14.5);
    this.group.add(pitBeacon2);
    this.blinkingLights.push(pitBeacon2);

    // Hoist Cable Pulleys & Heavy Motor Winch on ceiling
    const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12), this.matDarkMetal);
    winch.position.set(-39, 3.8, 12.5);
    this.group.add(winch);

    // Thick Steel Elevator Suspension Cables
    for (const cx of [-38.5, -39.5]) {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.2, 6), this.matMetal);
      cable.position.set(cx, 2.1, 12.5);
      this.group.add(cable);
    }

    // Call Station on wall
    const elevatorCall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.1), this.matWarning);
    elevatorCall.position.set(-35.8, 1.6, 11);
    this.group.add(elevatorCall);

    // -------------------------------------------------------------
    // AREA 10: SECRET RESEARCH CHAMBER (The Core)
    // -------------------------------------------------------------
    // Catwalk High-Tech Observation Computer Workstations
    for (const obx of [39.0, 44.0, 49.0]) {
      const obConsole = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.6), this.matDarkMetal);
      obConsole.position.set(obx, 2.3, -33.5);
      this.group.add(obConsole);
      this.collidables.push(obConsole);

      const obMon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.06), this.matMetal);
      obMon.position.set(obx, 2.9, -33.5);
      this.group.add(obMon);

      const obScr = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), this.matScreenGlow);
      obScr.position.set(obx, 2.9, -33.46);
      this.group.add(obScr);
    }

    // High-Voltage Pulse Energy Capacitor Bank (West Wall, X: 37.0, Z: -22.0)
    const capBank = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.4, 3.0), this.matDarkMetal);
    capBank.position.set(36.8, 1.2, -22.0);
    this.group.add(capBank);
    this.collidables.push(capBank);

    for (let cpy = 1.0; cpy <= 2.0; cpy += 0.5) {
      for (const cpz of [-23.0, -22.0, -21.0]) {
        const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8), this.matPipeYellow);
        insulator.position.set(37.3, cpy, cpz);
        this.group.add(insulator);
      }
    }

    // Concentric Circular Caution Markings on Floor around Pylon
    for (const rad of [4.5, 6.2]) {
      const cautionRing = new THREE.Mesh(new THREE.RingGeometry(rad - 0.1, rad + 0.1, 32), this.matHazard);
      cautionRing.rotation.x = -Math.PI / 2;
      cautionRing.position.set(44, 0.015, -27);
      this.group.add(cautionRing);
    }
    // Massive Central Generator Pylon
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 3.5, 16), this.matDarkMetal);
    pylon.position.set(44, 1.75, -27);
    this.group.add(pylon);
    this.collidables.push(pylon);

    // Counter-Rotating Gyroscopic Accelerator Rings around Resonance Core
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.18, 8, 32), this.matIndustrialSteel);
    ring1.position.set(44, 3.8, -27);
    this.group.add(ring1);
    this.animatedRings.push({ mesh: ring1, speed: 0.8 });

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.14, 8, 32), this.matDarkMetal);
    ring2.rotation.x = Math.PI / 3;
    ring2.position.set(44, 3.8, -27);
    this.group.add(ring2);
    this.animatedRings.push({ mesh: ring2, speed: -0.6 });

    // Elevated Observation Catwalk / Mezzanine with Railings on South Wall
    const catwalk = new THREE.Group();
    const cFloor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 2.5), this.matMetalGrate);
    cFloor.position.set(44, 1.8, -34.5);
    catwalk.add(cFloor);

    // Structural Steel Support Columns down to floor
    for (let px = 37.0; px <= 51.0; px += 3.5) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), this.matIndustrialSteel);
      col.position.set(px, 0.9, -34.5);
      catwalk.add(col);
      this.collidables.push(col);
    }

    // Safety Railing along Catwalk
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(16, 0.06, 0.06), this.matIndustrialSteel);
    railTop.position.set(44, 2.8, -33.25);
    catwalk.add(railTop);

    for (let rx = 36.5; rx <= 51.5; rx += 2.5) {
      const rPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), this.matIndustrialSteel);
      rPost.position.set(rx, 2.3, -33.25);
      catwalk.add(rPost);
    }
    this.group.add(catwalk);
    this.collidables.push(cFloor);

    // Toroidal Magnet Ring around Pylon
    const torus = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 12, 24), this.matIndustrialSteel);
    torus.rotation.x = Math.PI / 2;
    torus.position.set(44, 2.5, -27);
    this.group.add(torus);

    // Glowing Consciousness Resonance Sphere
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    this.resonanceSphere = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), coreMat);
    this.resonanceSphere.position.set(44, 4.0, -27);
    this.group.add(this.resonanceSphere);

    // Final Decision Control Terminal
    const finalConsole = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.9), this.matWarning);
    finalConsole.position.set(44, 0.6, -21.5);
    this.group.add(finalConsole);
    this.collidables.push(finalConsole);

    this.interactables.push({
      mesh: finalConsole,
      type: 'final_choice',
      id: 'transmitter_choice',
      prompt: '[E] Access Resonance Transmitter (FINAL DECISION)',
      data: { final: true }
    });

    // Final Truth Document on Console
    const finalTruthDoc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.5), this.matPaper);
    finalTruthDoc.position.set(43.3, 1.21, -21.5);
    this.group.add(finalTruthDoc);

    this.interactables.push({
      mesh: finalTruthDoc,
      type: 'document',
      id: 'final_truth',
      prompt: '[E] Read Message Left by Previous Observer',
      data: { docId: 'final_truth' }
    });

    // 4 Heavy Snaking Floor Cables radiating from core
    const createFloorCable = (endX, endZ) => {
      const start = new THREE.Vector3(44, 0.08, -27);
      const end = new THREE.Vector3(endX, 0.08, endZ);
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, len, 8), this.matDarkMetal);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      cable.position.copy(mid);
      cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      this.group.add(cable);
    };

    createFloorCable(37, -20);
    createFloorCable(51, -20);
    createFloorCable(37, -34);
    createFloorCable(51, -34);
  }

  _buildObserverEntity() {
    const entityGroup = new THREE.Group();
    const silhouetteMat = new THREE.MeshBasicMaterial({ color: 0x030305, transparent: true, opacity: 0.96 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), silhouetteMat);
    head.position.y = 1.7;
    entityGroup.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eyeL.position.set(-0.06, 1.72, 0.2);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eyeR.position.set(0.06, 1.72, 0.2);
    entityGroup.add(eyeL);
    entityGroup.add(eyeR);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 10), silhouetteMat);
    torso.position.y = 1.15;
    entityGroup.add(torso);

    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), silhouetteMat);
    legL.position.set(-0.12, 0.4, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), silhouetteMat);
    legR.position.set(0.12, 0.4, 0);
    entityGroup.add(legL);
    entityGroup.add(legR);

    entityGroup.position.set(0, -999, 0);
    this.group.add(entityGroup);
    this.entityMesh = entityGroup;
  }

  _buildDustParticles() {
    const particleCount = 450;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 85;
      positions[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 65;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.07,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustPoints = new THREE.Points(geo, mat);
    this.group.add(this.dustPoints);
  }

  setEntityPosition(pos, lookAtTarget = null) {
    if (!this.entityMesh) return;
    if (pos) {
      this.entityMesh.position.copy(pos);
      if (lookAtTarget) {
        this.entityMesh.lookAt(lookAtTarget.x, this.entityMesh.position.y, lookAtTarget.z);
      }
      this.entityMesh.visible = true;
    } else {
      this.entityMesh.position.set(0, -999, 0);
      this.entityMesh.visible = false;
    }
  }

  unlockDoor(doorId) {
    const d = this.doors.get(doorId);
    if (!d) return false;
    d.locked = false;

    d.slab.position.y += 3.5;
    d.slab.visible = false;

    if (d.reader) {
      d.reader.material = this.matGreenGlow;
    }

    const idx = this.collidables.indexOf(d.slab);
    if (idx !== -1) {
      this.collidables.splice(idx, 1);
    }

    const inter = this.interactables.find(i => i.id === doorId);
    if (inter) {
      inter.prompt = '[E] Door Unlocked (Open)';
    }

    return true;
  }

  update(delta) {
    if (this.artifactCore) {
      this.artifactCore.rotation.x += delta * 0.8;
      this.artifactCore.rotation.y += delta * 1.2;
    }

    if (this.resonanceSphere) {
      const t = performance.now() * 0.003;
      const s = 1.0 + Math.sin(t) * 0.06;
      this.resonanceSphere.scale.set(s, s, s);
    }

    // Animate Gyroscopic Accelerator Rings in Secret Chamber
    if (this.animatedRings && this.animatedRings.length > 0) {
      for (let i = 0; i < this.animatedRings.length; i++) {
        const r = this.animatedRings[i];
        r.mesh.rotation.z += delta * r.speed;
      }
    }

    // Animate Wall Ventilation Fans
    if (this.animatedFans && this.animatedFans.length > 0) {
      for (let i = 0; i < this.animatedFans.length; i++) {
        this.animatedFans[i].rotation.z += delta * 6.0;
      }
    }

    // Animate Reel-to-Reel Tape Machine in Communications Room
    if (this.animatedReels && this.animatedReels.length > 0) {
      for (let i = 0; i < this.animatedReels.length; i++) {
        this.animatedReels[i].rotation.z += delta * 3.2;
      }
    }

    // Periodic Electrical Sparks Discharge
    this.sparkTimer -= delta;
    if (this.sparkTimer <= 0) {
      this.sparkTimer = 1.6 + Math.random() * 2.4;
      if (this.sparks && this.sparks.length > 0) {
        const spark = this.sparks[Math.floor(Math.random() * this.sparks.length)];
        spark.visible = true;
        setTimeout(() => {
          spark.visible = false;
        }, 60);
      }
    }

    if (this.blinkingLights && this.blinkingLights.length > 0) {
      const time = performance.now() * 0.004;
      for (let i = 0; i < this.blinkingLights.length; i++) {
        const led = this.blinkingLights[i];
        led.visible = Math.sin(time + i * 1.3) > -0.2;
      }
    }

    if (this.dustPoints && this.dustPoints.geometry) {
      const pos = this.dustPoints.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= delta * 0.05;
        pos[i] += Math.sin(pos[i + 1] * 2) * 0.01;
        if (pos[i + 1] < 0.2) {
          pos[i + 1] = 3.8;
        }
      }
      this.dustPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  addToScene(scene) {
    scene.add(this.group);
  }

  getCollidables() {
    return this.collidables;
  }

  getInteractables() {
    return this.interactables;
  }

  getRoomBounds() {
    return this.roomBounds;
  }
}
