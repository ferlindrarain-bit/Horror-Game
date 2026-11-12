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
        // Observer in corridor right at the main transit junction
        this.facility.setEntityPosition(new THREE.Vector3(0, 0, 11), new THREE.Vector3(0, 0, 0));
        if (this.audio) this.audio.playTensionStinger();
        setTimeout(() => {
          this.facility.setEntityPosition(null);
        }, 10000);
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
    const q = (reportQuery || '').toLowerCase().trim();

    // 1. If there are active anomalies, match query or automatically report the first active anomaly
    if (this.activeAnomalies.size > 0) {
      for (const [id, def] of this.activeAnomalies.entries()) {
        if (
          !q ||
          q === 'lapor' ||
          q === 'report' ||
          q === 'finding' ||
          q === 'temuan' ||
          q === 'anomali' ||
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
            text: `[KOMANDO PUSAT: LAPORAN DITERIMA & DIVERIFIKASI]\nAnomali "${def.name}" terverifikasi dan berhasil dicatat ke server pusat.\nProtokol isolasi diperbarui. Target pelaporan selesai!`,
            type: 'success',
            correct: true
          };
        }
      }
    }

    // 2. If player reports even without active anomaly (e.g. routine shift finding report for Night 2)
    this.discoveredCount++;
    return {
      text: `[KOMANDO PUSAT: LAPORAN DITERIMA & DIVERIFIKASI]\nLaporan hasil observasi dan anomali keamanan Anda telah diarsipkan.\nStatus pemantauan Sektor 09 diperbarui. Target pelaporan selesai!`,
      type: 'success',
      correct: true
    };
  }

  update(delta, nightIndex) {
    this.timer += delta;
    // Ambient spontaneous psychological horror events pacing
    const interval = Math.max(16, 32 - (nightIndex || 0) * 4);
    if (this.timer > interval) {
      this.timer = 0;
      const roll = Math.random();
      if (roll < 0.55) {
        if (roll < 0.20) {
          this.triggerAnomaly('light_flicker');
        } else if (roll < 0.35) {
          this.triggerAnomaly('footsteps_behind');
        } else if (roll < 0.45 && nightIndex >= 1) {
          this.triggerAnomaly('shadow_hallway');
        } else if (this.audio) {
          if (typeof this.audio.playCreepyWhisper === 'function') {
            this.audio.playCreepyWhisper();
          }
        }
      }
    }
  }

  getDiscoveredCount() {
    return this.discoveredCount;
  }
}
