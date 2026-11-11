import * as THREE from 'three';

export class CCTVSystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.activeCameraIndex = 0;
    this.cameras = [];
    this.renderTargets = [];

    this._setupCameras();
  }

  _setupCameras() {
    const camConfigs = [
      {
        id: 'CAM_01',
        name: 'MAIN TRANSIT CORRIDOR',
        pos: new THREE.Vector3(0, 3.8, 14.5),
        target: new THREE.Vector3(-25, 1.2, 12.5),
        quality: 95
      },
      {
        id: 'CAM_02',
        name: 'RESEARCH LABORATORY',
        pos: new THREE.Vector3(7, 3.8, -17),
        target: new THREE.Vector3(0, 1.5, -23),
        quality: 88
      },
      {
        id: 'CAM_03',
        name: 'ELECTRICAL SUBSTATION',
        pos: new THREE.Vector3(-16, 3.8, 8),
        target: new THREE.Vector3(-20, 1.5, 4),
        quality: 74
      },
      {
        id: 'CAM_04',
        name: 'RESTRICTED ARCHIVE',
        pos: new THREE.Vector3(41, 3.8, -6),
        target: new THREE.Vector3(44, 1.2, -11),
        quality: 90
      }
    ];

    camConfigs.forEach(cfg => {
      const cam = new THREE.PerspectiveCamera(65, 4 / 3, 0.2, 80);
      cam.position.copy(cfg.pos);
      cam.lookAt(cfg.target);

      const rt = new THREE.WebGLRenderTarget(320, 240, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      });

      this.cameras.push({
        id: cfg.id,
        name: cfg.name,
        camera: cam,
        renderTarget: rt,
        quality: cfg.quality,
        anomaly: null
      });
      this.renderTargets.push(rt);
    });
  }

  renderFeeds() {
    if (!this.renderer || !this.scene) return;
    const currentRT = this.renderer.getRenderTarget();

    for (let i = 0; i < this.cameras.length; i++) {
      const c = this.cameras[i];
      this.renderer.setRenderTarget(c.renderTarget);
      this.renderer.render(this.scene, c.camera);
    }

    this.renderer.setRenderTarget(currentRT);
  }

  setAnomaly(cameraIndex, anomalyType) {
    if (this.cameras[cameraIndex]) {
      this.cameras[cameraIndex].anomaly = anomalyType;
    }
  }

  clearAnomaly(cameraIndex) {
    if (this.cameras[cameraIndex]) {
      this.cameras[cameraIndex].anomaly = null;
    }
  }

  getFeeds() {
    return this.cameras.map((c, idx) => ({
      index: idx,
      id: c.id,
      name: c.name,
      quality: c.quality,
      anomaly: c.anomaly,
      renderTarget: c.renderTarget
    }));
  }

  switchCamera(index) {
    if (index >= 0 && index < this.cameras.length) {
      this.activeCameraIndex = index;
    }
    return this.activeCameraIndex;
  }

  getActiveCamera() {
    return this.cameras[this.activeCameraIndex];
  }
}
