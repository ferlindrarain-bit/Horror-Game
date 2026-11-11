import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
    this.flickerLights = [];
    this.isEmergency = false;

    // Ambient light - balanced for horror visibility (brightened per user request)
    this.ambientLight = new THREE.AmbientLight(0x222c3d, 2.4);
    this.scene.add(this.ambientLight);

    // Hemisphere light - subtle soft bounce between industrial ceiling and floor
    this.hemiLight = new THREE.HemisphereLight(0x475569, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    // Fog: soft atmospheric cinematic haze (reduced density from 0.038 to 0.024)
    this.scene.fog = new THREE.FogExp2(0x0c121c, 0.024);

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

    // 1. Control Room (Hub) - Clean cold cyan monitor glow + warm overhead
    addLight(0, 3.4, -2.0, 0x38bdf8, 2.8, 22, 1.8, true);
    addLight(0, 3.4, 3.5, 0x64748b, 2.0, 18, 1.8);

    // 2. North Hub Corridor (to Research Lab)
    addLight(0, 3.4, -11, 0x94a3b8, 2.2, 16, 1.8);

    // 3. Research Laboratory - Cold high-tech cyan/white
    addLight(0, 3.5, -23, 0x67e8f9, 3.4, 26, 1.8);
    addLight(-4, 3.2, -27, 0x0284c7, 2.2, 18, 1.8);

    // 4. South Hub Connector (to Main Corridor)
    addLight(0, 3.4, 8.5, 0xfef08a, 2.2, 15, 1.8);

    // 5. Main East-West Transit Corridor (Corridor lights along Z = 12.5)
    addLight(-30, 3.4, 12.5, 0xef4444, 2.2, 18, 1.8, true); // Red near elevator
    addLight(-15, 3.4, 12.5, 0xfef08a, 2.0, 18, 1.8);       // Near Electrical / Storage
    addLight(0, 3.4, 12.5, 0x94a3b8, 2.4, 18, 1.8);         // Center junction
    addLight(15, 3.4, 12.5, 0xfef08a, 2.0, 18, 1.8);        // Near Medical / Comm
    addLight(30, 3.4, 12.5, 0x64748b, 2.2, 18, 1.8, true);  // Approach to Archive

    // 6. Electrical Room - Industrial amber & spark flicker
    this.elecLight = addLight(-20, 3.2, 4, 0xf59e0b, 2.8, 20, 1.8, true);

    // 7. Medical Room - Pale fluorescent hospital green
    addLight(20, 3.2, 4, 0x86efac, 2.6, 20, 1.8);

    // 8. Storage Room (Bay A) - Warm warehouse yellow
    addLight(-20, 3.2, 21, 0xd97706, 2.4, 20, 1.8);

    // 9. Communication Room - Soft warm amber terminal glow
    addLight(20, 3.2, 21, 0xfbbf24, 2.6, 20, 1.8);

    // 10. Underground Elevator - Warning red beacon
    addLight(-39, 3.2, 12.5, 0xdc2626, 2.4, 16, 1.8, true);

    // 11. Archive Approach Corridor
    addLight(44, 3.4, 5.5, 0x3b82f6, 2.2, 18, 1.8);

    // 12. Restricted Archive Room - Deep cobalt blue
    addLight(44, 3.4, -11, 0x2563eb, 2.8, 22, 1.8);

    // 13. Secret Research Chamber - Giant pulsating resonance core
    this.chamberLight = addLight(44, 3.6, -27, 0x38bdf8, 4.2, 32, 1.6);
  }

  setEmergencyMode(active = true) {
    this.isEmergency = active;
    if (active) {
      this.ambientLight.color.setHex(0x450a0a);
      this.ambientLight.intensity = 2.0;
      this.hemiLight.color.setHex(0xdc2626);
      this.scene.fog.color.setHex(0x200404);
      this.lights.forEach(({ light }) => {
        light.color.setHex(0xdc2626);
        light.intensity = 2.2;
      });
    } else {
      this.ambientLight.color.setHex(0x222c3d);
      this.ambientLight.intensity = 2.4;
      this.hemiLight.color.setHex(0x475569);
      this.scene.fog.color.setHex(0x0c121c);
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
