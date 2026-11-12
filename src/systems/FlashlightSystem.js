import * as THREE from 'three';

export class FlashlightSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.enabled = false;
    this.battery = 100;
    this.maxBattery = 100;
    this.drainRate = 0.45; // ~220 seconds of continuous illumination (balanced for dark exploration)

    // Main flashlight cone (cinematic warm beam - enhanced throw & brightness)
    this.spotLight = new THREE.SpotLight(0xfef08a, 8.5, 55, Math.PI / 5.0, 0.35, 1.3);
    this.spotLight.visible = false;
    this.scene.add(this.spotLight);

    // Inner brighter core (tighter, whiter hotspot)
    this.coreLight = new THREE.SpotLight(0xffffff, 6.0, 40, Math.PI / 9, 0.15, 1.1);
    this.coreLight.visible = false;
    this.scene.add(this.coreLight);

    // Near-field fill light (illuminates surfaces close to player)
    this.fillLight = new THREE.PointLight(0xfef08a, 2.0, 8, 2.0);
    this.fillLight.visible = false;
    this.scene.add(this.fillLight);

    // Spotlight target dummy
    this.target = new THREE.Object3D();
    this.scene.add(this.target);
    this.spotLight.target = this.target;
    this.coreLight.target = this.target;

    this.onToggle = null;
    this.onBatteryChange = null;
  }

  setDifficulty(diff) {
    if (diff === 'easy') {
      this.drainRate = 0.22; // ~450s continuous battery life for Casual / Peneliti
    } else if (diff === 'nightmare') {
      this.drainRate = 0.85; // ~120s rapid drain for Nightmare mode
    } else {
      this.drainRate = 0.45; // ~220s balanced standard
    }
  }

  toggle() {
    if (this.battery <= 0 && !this.enabled) return false;
    this.enabled = !this.enabled;
    this._updateVisibility();
    if (this.onToggle) this.onToggle(this.enabled);
    return true;
  }

  setPower(on) {
    if (this.enabled !== on) {
      this.enabled = on;
      this._updateVisibility();
      if (this.onToggle) this.onToggle(this.enabled);
    }
  }

  _updateVisibility() {
    this.spotLight.visible = this.enabled;
    this.coreLight.visible = this.enabled;
    this.fillLight.visible = this.enabled;
  }

  recharge(amount = 50) {
    this.battery = Math.min(this.maxBattery, this.battery + amount);
    if (this.onBatteryChange) this.onBatteryChange(this.battery);
  }

  update(delta) {
    if (this.enabled) {
      this.battery = Math.max(0, this.battery - this.drainRate * delta);
      if (this.onBatteryChange) this.onBatteryChange(this.battery);

      // Low battery flicker
      if (this.battery < 20) {
        if (Math.random() < 0.15) {
          this.spotLight.intensity = (this.battery / 20) * 4.0 * Math.random();
          this.coreLight.intensity = (this.battery / 20) * 3.0 * Math.random();
          this.fillLight.intensity = (this.battery / 20) * 1.0 * Math.random();
        } else {
          this.spotLight.intensity = (this.battery / 20) * 5.5;
          this.coreLight.intensity = (this.battery / 20) * 4.0;
          this.fillLight.intensity = (this.battery / 20) * 1.5;
        }
      } else {
        this.spotLight.intensity = 7.0;
        this.coreLight.intensity = 5.0;
        this.fillLight.intensity = 2.0;
      }

      if (this.battery <= 0) {
        this.enabled = false;
        this._updateVisibility();
        if (this.onToggle) this.onToggle(false);
      }
    }

    // Orient spotlight to camera
    const camPos = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    this.camera.getWorldDirection(camDir);

    // Slight offset down/right to simulate holding flashlight in hand
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const lightPos = camPos.clone().add(camDir.clone().multiplyScalar(0.2)).add(right.multiplyScalar(0.25)).add(new THREE.Vector3(0, -0.2, 0));

    this.spotLight.position.copy(lightPos);
    this.coreLight.position.copy(lightPos);
    this.fillLight.position.copy(lightPos);

    this.target.position.copy(camPos).add(camDir.multiplyScalar(10));
  }

  getBatteryLevel() {
    return Math.round(this.battery);
  }

  isOn() {
    return this.enabled;
  }
}
