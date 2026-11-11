import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.flickerLights = [];
    this.isEmergency = false;

    // Ambient light - balanced for true horror atmosphere (darkened so flashlight is essential)
    this.ambientLight = new THREE.AmbientLight(0x18202c, 0.65);
    this.scene.add(this.ambientLight);

    // Hemisphere light - subtle soft bounce between industrial ceiling and floor
    this.hemiLight = new THREE.HemisphereLight(0x334155, 0x0f172a, 0.35);
    this.scene.add(this.hemiLight);

    // Fog: deeper atmospheric cinematic darkness
    this.scene.fog = new THREE.FogExp2(0x060910, 0.032);

    this._createRoomLights();
  }

  _createRoomLights() {
    const addLight = (x, y, z, color, intensity, distance, decay = 1.8, flicker = false) => {
      const light = new THREE.PointLight(color, intensity, distance, decay);
      light.position.set(x, y, z);
      this.scene.add(light);
      this.lights.push({ light, baseIntensity: intensity, baseColor: color, flicker });
      if (flicker) {
        this.flickerLights.push({ light, baseIntensity: intensity, timer: Math.random() * 2 });
      }
      return light;
    };

    // 1. Control Room (Hub) - Moodier cyan monitor glow + soft overhead
    addLight(0, 3.4, -2.0, 0x38bdf8, 1.5, 20, 1.8, true);
    addLight(0, 3.4, 3.5, 0x64748b, 0.9, 16, 1.8);

    // 2. North Hub Corridor (to Research Lab)
    addLight(0, 3.4, -11, 0x94a3b8, 1.0, 15, 1.8);

    // 3. Research Laboratory - Cold high-tech cyan/white
    addLight(0, 3.5, -23, 0x67e8f9, 1.7, 24, 1.8);
    addLight(-4, 3.2, -27, 0x0284c7, 1.1, 16, 1.8);

    // 4. South Hub Connector (to Main Corridor)
    addLight(0, 3.4, 8.5, 0xfef08a, 1.0, 14, 1.8);

    // 5. Main East-West Transit Corridor (Atmospheric corridor lights with darker pockets)
    addLight(-30, 3.4, 12.5, 0xef4444, 1.2, 16, 1.8, true); // Red near elevator
    addLight(-15, 3.4, 12.5, 0xfef08a, 1.0, 16, 1.8);       // Near Electrical / Storage
    addLight(0, 3.4, 12.5, 0x94a3b8, 1.2, 16, 1.8);         // Center junction
    addLight(15, 3.4, 12.5, 0xfef08a, 1.0, 16, 1.8);        // Near Medical / Comm
    addLight(30, 3.4, 12.5, 0x64748b, 1.1, 16, 1.8, true);  // Approach to Archive

    // 6. Electrical Room - Industrial amber & spark flicker
    this.elecLight = addLight(-20, 3.2, 4, 0xf59e0b, 1.4, 18, 1.8, true);

    // 7. Medical Room - Pale fluorescent hospital green
    addLight(20, 3.2, 4, 0x86efac, 1.3, 18, 1.8);

    // 8. Storage Room (Bay A) - Warm warehouse yellow
    addLight(-20, 3.2, 21, 0xd97706, 1.2, 18, 1.8);

    // 9. Communication Room - Soft warm amber terminal glow
    addLight(20, 3.2, 21, 0xfbbf24, 1.3, 18, 1.8);

    // 10. Underground Elevator - Warning red beacon
    addLight(-39, 3.2, 12.5, 0xdc2626, 1.3, 15, 1.8, true);

    // 11. Archive Approach Corridor
    addLight(44, 3.4, 5.5, 0x3b82f6, 1.1, 16, 1.8);

    // 12. Restricted Archive Room - Deep cobalt blue
    addLight(44, 3.4, -11, 0x2563eb, 1.4, 20, 1.8);

    // 13. Secret Research Chamber - Pulsating resonance core
    this.chamberLight = addLight(44, 3.6, -27, 0x38bdf8, 2.4, 28, 1.6);

    // Electrical Substation high-voltage flash spark light
    this.sparkLight = new THREE.PointLight(0x38bdf8, 0, 22, 2.0);
    this.sparkLight.position.set(-20, 2.5, 4.0);
    this.scene.add(this.sparkLight);
  }

  flashSpark() {
    if (!this.sparkLight) return;
    this.sparkLight.intensity = 3.8;
    setTimeout(() => {
      if (this.sparkLight) this.sparkLight.intensity = 0;
    }, 80);
  }

  setEmergencyMode(active = true) {
    this.isEmergency = active;
    if (active) {
      this.ambientLight.color.setHex(0x450a0a);
      this.ambientLight.intensity = 0.8;
      this.hemiLight.color.setHex(0xdc2626);
      this.hemiLight.intensity = 0.4;
      this.scene.fog.color.setHex(0x200404);
      this.lights.forEach(({ light }) => {
        light.color.setHex(0xdc2626);
        light.intensity = 1.2;
      });
    } else {
      this.ambientLight.color.setHex(0x18202c);
      this.ambientLight.intensity = 0.65;
      this.hemiLight.color.setHex(0x334155);
      this.hemiLight.intensity = 0.35;
      this.scene.fog.color.setHex(0x060910);
      this.lights.forEach(({ light, baseIntensity, baseColor }) => {
        light.color.setHex(baseColor);
        light.intensity = baseIntensity;
      });
    }
  }

  update(delta) {
    // Flickering lights
    for (const item of this.flickerLights) {
      item.timer -= delta;
      if (item.timer <= 0) {
        if (Math.random() < 0.28) {
          item.light.intensity = item.baseIntensity * (Math.random() < 0.5 ? 0.2 : 1.6);
          item.timer = 0.04 + Math.random() * 0.12;
        } else {
          item.light.intensity = item.baseIntensity;
          item.timer = 1.2 + Math.random() * 3.5;
        }
      }
    }

    // Chamber core pulsation
    if (this.chamberLight) {
      const time = performance.now() * 0.0035;
      this.chamberLight.intensity = 3.2 + Math.sin(time) * 1.2;
    }
  }
}
