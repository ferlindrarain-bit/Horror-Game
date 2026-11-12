import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement speeds
    this.walkSpeed = 4.2;
    this.sprintSpeed = 7.2;
    this.crouchSpeed = 2.2;

    // Stamina
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrainRate = 22;
    this.staminaRegenRate = 18;
    this.isSprinting = false;
    this.isCrouching = false;

    // Eye height
    this.standHeight = 1.7;
    this.crouchHeight = 1.0;
    this.currentHeight = this.standHeight;

    // Mouse sensitivity
    this.sensitivity = 0.0022;

    // Head bobbing & audio timing
    this.bobTimer = 0;
    this.stepTimer = 0;

    // Camera shake for jumpscares and horror impacts
    this.shakeIntensity = 0;
    this.shakeTimer = 0;

    // Camera rig: yawObject contains pitchObject, which contains camera
    this.pitchObject = new THREE.Object3D();
    this.yawObject = new THREE.Object3D();
    this.yawObject.position.set(0, this.standHeight, 0); // starts in center of Control Room
    this.yawObject.add(this.pitchObject);
    this.pitchObject.add(this.camera);

    // Key states
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.pointerLocked = false;
    this.enabled = true;
    this.collidables = [];
    this.cachedBoxes = [];

    // Callbacks
    this.onFootstep = null;
    this.onStaminaChange = null;

    this._initEvents();
  }

  setCollidables(list) {
    this.collidables = list || [];
    this._rebuildBoundingBoxes();
  }

  setDifficulty(diff) {
    if (diff === 'easy') {
      this.staminaDrainRate = 11;
      this.staminaRegenRate = 26;
    } else if (diff === 'nightmare') {
      this.staminaDrainRate = 32;
      this.staminaRegenRate = 12;
    } else {
      this.staminaDrainRate = 22;
      this.staminaRegenRate = 18;
    }
  }

  _rebuildBoundingBoxes() {
    this.cachedBoxes = [];
    for (let i = 0; i < this.collidables.length; i++) {
      const mesh = this.collidables[i];
      if (!mesh || !mesh.geometry) continue;
      mesh.updateMatrixWorld(true);
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const b = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
      this.cachedBoxes.push({ mesh, box: b });
    }
  }

  setSensitivity(val) {
    this.sensitivity = val;
  }

  shake(intensity = 0.035, duration = 0.45) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  }

  _initEvents() {
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = !!document.pointerLockElement;
    });

    document.addEventListener('pointerlockerror', (err) => {
      console.warn('PointerLockError:', err);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      // Allow mouse look when pointer is locked OR when user is dragging mouse (left button down)
      if (!this.pointerLocked && (e.buttons & 1) !== 1) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.yawObject.rotation.y -= movementX * this.sensitivity;
      this.pitchObject.rotation.x -= movementY * this.sensitivity;

      const maxPitch = Math.PI / 2 - 0.08;
      this.pitchObject.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.pitchObject.rotation.x));
    });

    const onKeyDown = (e) => {
      if (!this.enabled) return;
      switch (e.code) {
        case 'KeyW': this.moveForward = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyD': this.moveRight = true; break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = true;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isCrouching = true;
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyD': this.moveRight = false; break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = false;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          this.isCrouching = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  requestLock() {
    if (this.pointerLocked) return;
    try {
      const el = this.domElement || document.body;
      const p = el.requestPointerLock();
      if (p && p.catch) {
        p.catch(() => {});
      }
    } catch (err) {
      // Browser user-gesture restriction caught gracefully
    }
  }

  unlock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  getObject() {
    return this.yawObject;
  }

  getPosition() {
    return this.yawObject.position;
  }

  getDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  update(delta) {
    if (!this.enabled) return;

    // Smooth crouch transition
    const targetHeight = this.isCrouching ? this.crouchHeight : this.standHeight;
    this.currentHeight += (targetHeight - this.currentHeight) * Math.min(1, delta * 12);
    this.yawObject.position.y = this.currentHeight;

    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;

    // Stamina calculation
    if (this.isSprinting && isMoving && !this.isCrouching && this.stamina > 0) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * delta);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * delta);
    }

    if (this.onStaminaChange) {
      this.onStaminaChange(Math.round(this.stamina));
    }

    const actualSprinting = this.isSprinting && this.stamina > 5 && !this.isCrouching;
    let speed = this.walkSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;
    else if (actualSprinting) speed = this.sprintSpeed;

    const moveVector = new THREE.Vector3();
    if (this.moveForward) moveVector.z -= 1;
    if (this.moveBackward) moveVector.z += 1;
    if (this.moveLeft) moveVector.x -= 1;
    if (this.moveRight) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();

      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);
      const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);

      const deltaMove = forward.clone().multiplyScalar(-moveVector.z * speed * delta)
        .add(right.clone().multiplyScalar(moveVector.x * speed * delta));

      // Attempt full move
      const nextPos = this.yawObject.position.clone().add(deltaMove);
      if (!this._checkCollision(nextPos)) {
        this.yawObject.position.copy(nextPos);
      } else {
        // Try slide along X
        const nextPosX = this.yawObject.position.clone().add(new THREE.Vector3(deltaMove.x, 0, 0));
        if (!this._checkCollision(nextPosX)) {
          this.yawObject.position.copy(nextPosX);
        } else {
          // Try slide along Z
          const nextPosZ = this.yawObject.position.clone().add(new THREE.Vector3(0, 0, deltaMove.z));
          if (!this._checkCollision(nextPosZ)) {
            this.yawObject.position.copy(nextPosZ);
          }
        }
      }

      // Footstep cadence
      const stepInterval = actualSprinting ? 0.32 : (this.isCrouching ? 0.58 : 0.44);
      this.stepTimer += delta;
      if (this.stepTimer >= stepInterval) {
        this.stepTimer = 0;
        if (this.onFootstep) this.onFootstep(actualSprinting);
      }

      // Head bobbing
      this.bobTimer += delta * (actualSprinting ? 15 : 10);
      this.pitchObject.position.y = Math.sin(this.bobTimer) * (actualSprinting ? 0.04 : 0.02);
    } else {
      this.pitchObject.position.y = 0;
    }

    // Camera shake response
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.set(sx, sy, 0);
    } else {
      this.camera.position.set(0, 0, 0);
    }
  }

  _checkCollision(pos) {
    if (!this.cachedBoxes || this.cachedBoxes.length === 0) return false;

    // Compact player capsule AABB
    const r = 0.45;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - r, pos.y - 1.2, pos.z - r),
      new THREE.Vector3(pos.x + r, pos.y + 0.4, pos.z + r)
    );

    for (let i = 0; i < this.cachedBoxes.length; i++) {
      const item = this.cachedBoxes[i];
      // Skip if mesh was removed or door was unlocked
      if (!item.mesh.parent || !item.mesh.visible) continue;

      if (playerBox.intersectsBox(item.box)) {
        return true;
      }
    }
    return false;
  }
}
