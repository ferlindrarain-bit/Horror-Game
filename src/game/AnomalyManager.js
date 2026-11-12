import { ANOMALY_TYPES } from '../data/anomalies.js';
import * as THREE from 'three';

export class AnomalyManager {
  constructor(facility, lighting, audio) {
    this.facility = facility;
    this.lighting = lighting;
    this.audio = audio;

    this.activeAnomalies = new Map();
    this.reportedAnomalies = new Set();
    this.discoveredCount = 0;

    this.onAnomalyDetected = null; // (anomaly) => {}
    this.onObserverSighting = null; // () => {}

    this.timer = 0;
  }

  triggerAnomaly(id) {
    const def = ANOMALY_TYPES[id];
    if (!def) return false;

    this.activeAnomalies.set(id, def);
    this.discoveredCount++;

    // Apply in-world consequence
    switch (id) {
      case 'cctv_figure_behind':
        // Place observer entity directly behind control room desk for 8 seconds
        this.facility.setEntityPosition(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, 0));
        if (this.audio && typeof this.audio.playTensionStinger === 'function') {
          this.audio.playTensionStinger();
        }
        setTimeout(() => {
          this.facility.setEntityPosition(null);
        }, 8000);
        break;

      case 'shadow_hallway':
      case 'entity_sighting':
        // Observer in corridor
        this.facility.setEntityPosition(new THREE.Vector3(15, 0, 10), new THREE.Vector3(0, 0, 10));
        if (this.audio) this.audio.playJumpscare();
        setTimeout(() => {
          this.facility.setEntityPosition(null);
        }, 6000);
        break;

      case 'light_flicker':
      case 'electrical_failure':
        if (this.lighting) {
          this.lighting.setEmergencyMode(true);
          setTimeout(() => {
            this.lighting.setEmergencyMode(false);
          }, 7000);
        }
        break;

      case 'footsteps_behind':
        if (this.audio) {
          this.audio.playFootstep();
          setTimeout(() => this.audio.playFootstep(), 400);
          setTimeout(() => this.audio.playFootstep(), 800);
        }
        break;

      case 'camera_distortion':
        if (this.audio) this.audio.playRadioStatic(2.0);
        break;
    }

    if (this.onAnomalyDetected) {
      this.onAnomalyDetected(def);
    }
    return true;
  }

  reportAnomaly(reportQuery) {
    const q = reportQuery.toLowerCase().trim();
    // Search for match among active anomalies
    for (const [id, def] of this.activeAnomalies.entries()) {
      if (
        id.toLowerCase().includes(q) ||
        def.name.toLowerCase().includes(q) ||
        def.category.toLowerCase().includes(q) ||
        q.includes('anomaly') ||
        q.includes('figure') ||
        q.includes('shadow') ||
        q.includes('door') ||
        q.includes('camera') ||
        q.includes('light')
      ) {
        this.reportedAnomalies.add(id);
        this.activeAnomalies.delete(id);
        return {
          text: `[CENTRAL COMMAND VERIFICATION: CONFIRMED]\nAnomaly "${def.name}" verified and cataloged.\nContainment protocol updated. Investigation progress increased.`,
          type: 'success',
          correct: true
        };
      }
    }

    return {
      text: `[CENTRAL COMMAND VERIFICATION: UNCONFIRMED]\nNo matching anomaly registered for "${reportQuery}".\nWarning: False anomaly reports lead to disciplinary reprimands.`,
      type: 'warning',
      correct: false
    };
  }

  update(delta, nightIndex) {
    this.timer += delta;
    // Ambient spontaneous minor anomaly check every 30-45 seconds
    if (this.timer > 35) {
      this.timer = 0;
      if (Math.random() < 0.4) {
        // Subtle light flicker or audio footsteps
        if (Math.random() < 0.5) {
          this.triggerAnomaly('light_flicker');
        } else {
          this.triggerAnomaly('footsteps_behind');
        }
      }
    }
  }

  getDiscoveredCount() {
    return this.discoveredCount;
  }
}
