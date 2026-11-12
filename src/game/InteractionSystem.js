import * as THREE from 'three';

export class InteractionSystem {
  constructor(camera) {
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.interactables = [];
    this.currentTarget = null;
    this.maxDistance = 3.6; // Increased interaction range for comfortable usability

    this.onPromptChange = null; // (promptText or null) => {}
    this.onInteract = null; // (interactableData) => {}
    this.onFocus = null; // () => {} callback when targeting something
    this.enabled = true;

    // Zero-GC Pre-allocated Vectors for 60FPS interaction raycasting
    this._camPos = new THREE.Vector3();
    this._camDir = new THREE.Vector3();
    this._itemPos = new THREE.Vector3();
    this._toItem = new THREE.Vector3();
    this._centerNDC = { x: 0, y: 0 };
    this._cachedMeshes = [];

    this._initInput();
  }

  setInteractables(list) {
    this.interactables = list || [];
    this._cachedMeshes = this.interactables.map(i => i.mesh).filter(m => !!m);
  }

  _initInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        if (!this.enabled) return;
        this.triggerInteraction();
      }
    });
  }

  update() {
    if (!this.interactables || this.interactables.length === 0) {
      this._setTarget(null);
      return;
    }

    // Cast ray from center of screen (0, 0 in NDC)
    this.raycaster.setFromCamera(this._centerNDC, this.camera);

    const activeMeshes = this._cachedMeshes.filter(m => m.visible);
    const intersects = this.raycaster.intersectObjects(activeMeshes, true);

    if (intersects.length > 0 && intersects[0].distance <= this.maxDistance) {
      const hitMesh = intersects[0].object;
      // Find corresponding interactable item
      const found = this.interactables.find(item => {
        if (item.mesh === hitMesh) return true;
        let parent = hitMesh.parent;
        while (parent) {
          if (parent === item.mesh) return true;
          parent = parent.parent;
        }
        return false;
      });

      if (found) {
        this._setTarget(found);
        return;
      }
    }

    // Proximity + angle fallback: zero-allocation cone check
    this.camera.getWorldPosition(this._camPos);
    this.camera.getWorldDirection(this._camDir);

    let closestItem = null;
    let closestDist = 3.2;

    for (let i = 0; i < this.interactables.length; i++) {
      const item = this.interactables[i];
      if (!item.mesh || !item.mesh.visible) continue;

      item.mesh.getWorldPosition(this._itemPos);
      this._toItem.copy(this._itemPos).sub(this._camPos);
      const dist = this._toItem.length();

      if (dist < closestDist) {
        this._toItem.normalize();
        const dot = this._camDir.dot(this._toItem);
        // Generous cone angle (~35 degrees)
        if (dot > 0.82) {
          closestDist = dist;
          closestItem = item;
        }
      }
    }

    if (closestItem) {
      this._setTarget(closestItem);
      return;
    }

    this._setTarget(null);
  }

  _setTarget(target) {
    if (this.currentTarget !== target) {
      this.currentTarget = target;
      if (target && this.onFocus) {
        this.onFocus();
      }
      if (this.onPromptChange) {
        this.onPromptChange(target ? target.prompt : null);
      }
    }
  }

  triggerInteraction() {
    if (this.currentTarget && this.onInteract) {
      this.onInteract(this.currentTarget);
    }
  }

  getCurrentTarget() {
    return this.currentTarget;
  }
}
