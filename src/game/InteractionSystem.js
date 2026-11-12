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

    this._initInput();
  }

  setInteractables(list) {
    this.interactables = list || [];
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
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    const meshes = this.interactables.map(i => i.mesh).filter(m => m && m.visible);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0 && intersects[0].distance <= this.maxDistance) {
      const hitMesh = intersects[0].object;
      // Find corresponding interactable item
      const found = this.interactables.find(item => {
        if (item.mesh === hitMesh) return true;
        // Check if hitMesh is a child of item.mesh
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

    // Proximity + angle fallback: if player is within 3.2m looking directly towards an interactable
    const camPos = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    this.camera.getWorldDirection(camDir);

    let closestItem = null;
    let closestDist = 3.2;

    for (const item of this.interactables) {
      if (!item.mesh || !item.mesh.visible) continue;
      const itemPos = new THREE.Vector3();
      item.mesh.getWorldPosition(itemPos);

      const toItem = itemPos.clone().sub(camPos);
      const dist = toItem.length();

      if (dist < closestDist) {
        toItem.normalize();
        const dot = camDir.dot(toItem);
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
