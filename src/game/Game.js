import * as THREE from 'three';
import { Facility } from '../world/Facility.js';
import { Lighting } from '../world/Lighting.js';
import { PlayerController } from './PlayerController.js';
import { InteractionSystem } from './InteractionSystem.js';
import { StoryManager } from './StoryManager.js';
import { AnomalyManager } from './AnomalyManager.js';
import { SaveManager } from './SaveManager.js';
import { AchievementManager } from './AchievementManager.js';

import { FlashlightSystem } from '../systems/FlashlightSystem.js';
import { AudioManager } from '../systems/AudioManager.js';
import { CCTVSystem } from '../systems/CCTVSystem.js';
import { RadioSystem } from '../systems/RadioSystem.js';
import { ComputerSystem } from '../systems/ComputerSystem.js';

import { HUD } from '../ui/HUD.js';
import { MainMenu } from '../ui/MainMenu.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import { TerminalUI } from '../ui/TerminalUI.js';
import { CCTVUI } from '../ui/CCTVUI.js';
import { RadioUI } from '../ui/RadioUI.js';
import { DocumentUI } from '../ui/DocumentUI.js';
import { SettingsUI } from '../ui/SettingsUI.js';
import { EndingUI } from '../ui/EndingUI.js';
import { FacilityMapUI } from '../ui/FacilityMapUI.js';
import { IntroCutscene } from '../ui/IntroCutscene.js';
import { CloudSaveUI } from '../ui/CloudSaveUI.js';
import { TutorialUI } from '../ui/TutorialUI.js';
import { CreditsUI } from '../ui/CreditsUI.js';

export class Game {
  constructor() {
    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.isPaused = false;
    this.pipeCreakTimer = 15;
    this.heartbeatTimer = 0;
    this.horrorSfxTimer = 8;

    const savedSettings = SaveManager.loadSettings();
    this.difficulty = (savedSettings && savedSettings.difficulty) || 'normal';

    this._initThree();
    this._initSystems();
    this._initUI();
    this._bindGameEvents();
    this._initInputHandlers();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  _initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.zIndex = '0';
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070b);
    this.scene.fog = new THREE.FogExp2(0x05070b, 0.038);

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1000);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _initSystems() {
    this.audio = new AudioManager();

    this.facility = new Facility();
    this.facility.addToScene(this.scene);
    this.lighting = new Lighting(this.scene);
    this.facility.setLighting(this.lighting);
    this.facility.setAudio(this.audio);

    this.player = new PlayerController(this.camera, this.renderer.domElement);
    this.scene.add(this.player.getObject());

    // Update matrix world before computing collision boxes
    this.scene.updateMatrixWorld(true);
    this.player.setCollidables(this.facility.getCollidables());

    this.flashlight = new FlashlightSystem(this.camera, this.scene);

    this.cctv = new CCTVSystem(this.scene, this.renderer);
    this.radio = new RadioSystem();
    this.computer = new ComputerSystem();

    this.interaction = new InteractionSystem(this.camera);
    this.interaction.setInteractables(this.facility.getInteractables());

    this.story = new StoryManager();
    this.anomaly = new AnomalyManager(this.facility, this.lighting, this.audio);
    this.anomaly.onAnomalyDetected = () => {
      if (this.player && typeof this.player.shake === 'function') {
        this.player.shake(0.035, 0.45);
      }
    };
    this.achievements = new AchievementManager();
  }

  _initUI() {
    this.hud = new HUD();
    this.mainMenu = new MainMenu();
    this.pauseMenu = new PauseMenu();
    this.terminalUI = new TerminalUI(this.computer, this.audio);
    this.cctvUI = new CCTVUI(this.cctv, this.anomaly, this.audio);
    this.radioUI = new RadioUI(this.radio, this.audio);
    this.docUI = new DocumentUI();
    this.settingsUI = new SettingsUI(this.audio, this.player);
    this.endingUI = new EndingUI(this.audio);
    this.mapUI = new FacilityMapUI(this.story, this.player);
    this.introCutscene = new IntroCutscene(this.audio);
    this.cloudSaveUI = new CloudSaveUI(this.audio, (saveData) => this._onCloudSaveLoaded(saveData));
    this.tutorialUI = new TutorialUI();
    this.creditsUI = new CreditsUI(this.audio);

    this._initBackgroundState();

    // Auto-resume pointer lock when any modal UI is closed
    const resumeLock = () => {
      if (this.interaction) this.interaction.enabled = true;
      if (this.isRunning && !this.isPaused && !this._isAnyUIOpen()) {
        setTimeout(() => {
          this.player.requestLock();
        }, 60);
      }
    };

    this.terminalUI.onClose = resumeLock;
    this.cctvUI.onClose = resumeLock;
    this.docUI.onClose = resumeLock;
    this.radioUI.onClose = resumeLock;
    this.settingsUI.onClose = resumeLock;
    this.cloudSaveUI.onClose = resumeLock;
    if (this.mapUI) this.mapUI.onClose = resumeLock;
    if (this.tutorialUI) this.tutorialUI.onClose = resumeLock;
    if (this.creditsUI) this.creditsUI.onClose = resumeLock;

    this.blocker = document.createElement('div');
    this.blocker.id = 'blocker';
    this.blocker.style.display = 'none';
    this.blocker.innerHTML = `
      <div class="title">THE LAST SIGNAL</div>
      <div class="subtitle">REALITY ERROR</div>
      <div class="prompt">CLICK TO RESUME MONITORING</div>
    `;
    document.body.appendChild(this.blocker);

    this.blocker.addEventListener('click', () => {
      this.player.requestLock();
      this.blocker.style.display = 'none';
    });
  }

  _bindGameEvents() {
    this.player.onFootstep = (sprint) => this.audio.playFootstep(sprint);
    this.player.onStaminaChange = (stamina) => {
      this.hud.updateStamina(stamina);
      if (stamina < 20) {
        this.heartbeatTimer += 0.05;
        if (this.heartbeatTimer > 1.2) {
          this.heartbeatTimer = 0;
          this.audio.playHeartbeat();
        }
      }
    };

    this.flashlight.onToggle = (on) => {
      this.audio.playFlashlightClick();
      if (!on && this.flashlight.getBatteryLevel() <= 0) {
        this.hud.showNotification('SENTER MATI: Baterai habis. Cari baterai cadangan!', 4000);
      }
    };
    this.flashlight.onBatteryChange = (batt) => {
      this.hud.updateBattery(batt);
      if (batt <= 20 && batt > 0 && !this._lowBatteryWarned) {
        this._lowBatteryWarned = true;
        this.hud.showNotification('PERINGATAN: Baterai senter rendah (<20%). Hemat penggunaan!', 3500);
        this.audio.playNotification();
      } else if (batt > 25) {
        this._lowBatteryWarned = false;
      }
    };

    this.interaction.onFocus = () => {
      this.audio.playInteractFocus();
    };

    this.interaction.onPromptChange = (promptText) => {
      this.hud.showInteractPrompt(promptText);
    };

    this.interaction.onInteract = (item) => {
      this._handleInteraction(item);
    };

      this.achievements.onUnlock = (ach) => {
        this.hud.showNotification(`PENCAPAIAN TERBUKA: ${ach.icon} ${ach.name} - ${ach.description}`, 4500);
        this.audio.playNotification();
      };

      this.story.onObjectiveComplete = (obj) => {
        this.hud.showNotification(`TARGET SELESAI: ${obj.text}`, 3500);
        this.audio.playNotification();
        this._updateHUDObjective();
        this._saveGameState();
      };

    SaveManager.onCloudSync = (res) => {
      if (res && res.success && this.isRunning) {
        this.hud.showNotification('☁ CLOUD BACKUP: Tersimpan di Supabase.', 2500);
      }
    };

    this.story.onNightComplete = (finishedNight, nextNight) => {
      this.audio.playNotification();
      this.achievements.unlock('first_night');
      if (nextNight.id === 5) this.achievements.unlock('five_nights');

      // Update computer terminal night context
      this.computer.setNight(nextNight.id);

      // Dynamically update HUD night indicator immediately
      this.hud.updateNight(nextNight.title, nextNight.subtitle);

      this.hud.playNightTransition(nextNight.title, nextNight.subtitle, () => {
        this.hud.updateNight(nextNight.title, nextNight.subtitle);
        this._updateHUDObjective();
        this._saveGameState();

        // Atmospheric event per night start
        if (nextNight.id === 2) {
          this.anomaly.triggerAnomaly('shadow_hallway');
          this.radio.playTransmission('n2_unknown');
        } else if (nextNight.id === 4) {
          // Night 4 Reality Failure: lights flicker and emergency red mode engages
          this.lighting.setEmergencyMode(true);
          this.audio.playRadioStatic(2.0);
          this.hud.showNotification('PERINGATAN: KETIDAKSTABILAN STRUKTUR FASILITAS TERDETEKSI.', 4000);
        }
      });
    };

    // Main Menu events
    this.mainMenu.onNewGame = () => {
      this.audio.init();
      this.audio.resume();
      SaveManager.clearSave();
      this.mainMenu.hide();

      // Play intro cutscene before starting game
      this.introCutscene.onComplete = () => {
        this.startNewGame();
      };
      this.introCutscene.play();
    };

    this.mainMenu.onContinue = () => {
      this.audio.init();
      this.audio.resume();
      const saved = SaveManager.loadGame();
      if (saved) {
        this.story.loadFromSave(saved);
        this.computer.setNight(this.story.currentNightIndex + 1);
      }
      this.mainMenu.hide();
      this.startGameSession();
    };

    this.mainMenu.onSettings = () => {
      this.settingsUI.show();
    };

    this.mainMenu.onCloudSave = () => {
      this.cloudSaveUI.show();
    };

    this.mainMenu.onTutorial = () => {
      this.tutorialUI.show();
    };

    this.mainMenu.onCredits = () => {
      this.creditsUI.show();
    };

    this.mainMenu.onDifficultyChange = (diff) => {
      this._applyDifficulty(diff);
    };

    // Pause Menu events
    this.pauseMenu.onResume = () => {
      this.isPaused = false;
      this.player.requestLock();
    };
    this.pauseMenu.onCloudSave = () => {
      this.cloudSaveUI.show();
    };
    this.pauseMenu.onSettings = () => {
      this.settingsUI.show();
    };
    this.pauseMenu.onTutorial = () => {
      this.player.unlock();
      this.tutorialUI.show();
    };
    this.pauseMenu.onCredits = () => {
      this.player.unlock();
      this.creditsUI.show();
    };
    this.pauseMenu.onMap = () => {
      this.player.unlock();
      if (this.mapUI) this.mapUI.show();
    };
    this.pauseMenu.onMainMenu = () => {
      this._saveGameState();
      this.isPaused = false;
      this.isRunning = false;
      this.hud.hide();
      this.player.unlock();
      if (this.audio) this.audio.stopHorrorMusic();
      this.mainMenu.show();
      this.menuShotElapsed = 0;
    };

    // Ending UI events
    this.endingUI.onRestart = () => {
      this.startNewGame();
    };
    this.endingUI.onCredits = () => {
      this.creditsUI.show();
    };
    this.endingUI.onMainMenu = () => {
      this.endingUI.hide();
      if (this.audio) this.audio.stopHorrorMusic();
      this.mainMenu.show();
      this.menuShotElapsed = 0;
    };

    // Settings UI difficulty change sync
    this.settingsUI.onDifficultyChange = (diff) => {
      this._applyDifficulty(diff);
      if (this.mainMenu) this.mainMenu.setDifficulty(diff);
    };

    // HUD interactive button clicks
    this.hud.onOpenMap = () => {
      if (this.mapUI && this.mapUI.isOpen) {
        this.mapUI.hide();
        this.player.requestLock();
      } else if (!this._isAnyUIOpen()) {
        this.player.unlock();
        if (this.mapUI) this.mapUI.show();
      }
    };

    this.hud.onOpenTutorial = () => {
      if (this.tutorialUI && this.tutorialUI.isOpen) {
        this.tutorialUI.hide();
        this.player.requestLock();
      } else if (!this._isAnyUIOpen()) {
        this.player.unlock();
        if (this.tutorialUI) this.tutorialUI.show();
      }
    };

    this.hud.onOpenObjectives = () => {
      this.player.unlock();
      const currNight = this.story.getCurrentNight();
      const done = currNight ? currNight.objectives.filter(o => o.completed).length : 0;
      const total = currNight ? currNight.objectives.length : 0;
      const nightLabel = currNight ? `${currNight.title}: ${currNight.subtitle}` : '';
      this.pauseMenu.show(currNight ? currNight.objectives : [], nightLabel, total ? `Progres ${done}/${total}` : '');
    };

    // Radio dialogue choice impact
    this.radio.onChoiceSelected = (effect) => {
      this.story.applyEffect(effect);
      this.story.completeObjective('n3_decide');
    };

    // Terminal triggers
    this.computer.onChamberUnlocked = () => {
      this.facility.unlockDoor('secret_chamber_door');
      this.scene.updateMatrixWorld(true);
      this.player.setCollidables(this.facility.getCollidables());
      this.story.completeObjective('n5_chamber');
      this.hud.showNotification('SISTEM: Segel Pintu Reaktor Rahasia Berhasil Dibuka!', 4500);
      this.audio.playDoor(true);
    };

    this.computer.onPasswordSolved = (file) => {
      this.story.completeObjective('n2_password');
    };

    this.computer.onAnomalyReported = (report) => {
      const res = this.anomaly.reportAnomaly(report);
      if (res.correct) {
        this.story.completeObjective('n2_report');
        if (this.anomaly.getDiscoveredCount() >= 5) {
          this.achievements.unlock('sharp_eyes');
        }
      }
      return res;
    };
  }

  _initInputHandlers() {
    // Click or mousedown anywhere in viewport to re-acquire pointer lock if lost and no UI is open
    const handleViewportClick = (e) => {
      if (!this.isRunning || this.isPaused) return;
      if (this._isAnyUIOpen()) return;
      if (!this.player.pointerLocked) {
        this.player.requestLock();
      }
    };
    window.addEventListener('click', handleViewportClick);
    window.addEventListener('mousedown', handleViewportClick);

    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;

      if (e.code === 'KeyF') {
        if (!this._isAnyUIOpen()) {
          this.flashlight.toggle();
        }
      }

      if (e.code === 'KeyM') {
        if (this.mapUI && this.mapUI.isOpen) {
          this.mapUI.hide();
          this.player.requestLock();
        } else if (!this._isAnyUIOpen()) {
          this.player.unlock();
          if (this.mapUI) this.mapUI.show();
        }
      }

      if (e.code === 'KeyH') {
        if (this.tutorialUI && this.tutorialUI.isOpen) {
          this.tutorialUI.hide();
          this.player.requestLock();
        } else if (!this._isAnyUIOpen()) {
          this.player.unlock();
          if (this.tutorialUI) this.tutorialUI.show();
        }
      }

      if (e.code === 'Escape') {
        if (this._isAnyUIOpen()) {
          this.terminalUI.hide();
          this.cctvUI.hide();
          this.docUI.hide();
          this.radioUI.hide();
          this.settingsUI.hide();
          this.cloudSaveUI.hide();
          this.endingUI.hide();
          if (this.mapUI) this.mapUI.hide();
          if (this.tutorialUI) this.tutorialUI.hide();
          if (this.creditsUI) this.creditsUI.hide();
          this.pauseMenu.hide();
          this.player.requestLock();
        } else {
          this.isPaused = !this.isPaused;
          if (this.isPaused) {
            this.player.unlock();
            const currNight = this.story.getCurrentNight();
            const done = currNight ? currNight.objectives.filter(o => o.completed).length : 0;
            const total = currNight ? currNight.objectives.length : 0;
            const nightLabel = currNight ? `${currNight.title}: ${currNight.subtitle}` : '';
            this.pauseMenu.show(currNight ? currNight.objectives : [], nightLabel, total ? `Progres ${done}/${total}` : '');
          } else {
            this.pauseMenu.hide();
            this.player.requestLock();
          }
        }
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        const currNight = this.story.getCurrentNight();
        if (this.pauseMenu.isOpen) {
          this.pauseMenu.hide();
          this.player.requestLock();
        } else {
          this.player.unlock();
          const done = currNight ? currNight.objectives.filter(o => o.completed).length : 0;
          const total = currNight ? currNight.objectives.length : 0;
          const nightLabel = currNight ? `${currNight.title}: ${currNight.subtitle}` : '';
          this.pauseMenu.show(currNight ? currNight.objectives : [], nightLabel, total ? `Progres ${done}/${total}` : '');
        }
      }
    });
  }

  _isAnyUIOpen() {
    return (
      (this.terminalUI && this.terminalUI.isOpen) ||
      (this.cctvUI && this.cctvUI.isOpen) ||
      (this.docUI && this.docUI.isOpen) ||
      (this.radioUI && this.radioUI.isOpen) ||
      (this.settingsUI && this.settingsUI.isOpen) ||
      (this.cloudSaveUI && this.cloudSaveUI.isOpen) ||
      (this.endingUI && this.endingUI.isOpen) ||
      (this.mapUI && this.mapUI.isOpen) ||
      (this.tutorialUI && this.tutorialUI.isOpen) ||
      (this.creditsUI && this.creditsUI.isOpen)
    );
  }

  _applyDifficulty(diff) {
    this.difficulty = diff || 'normal';
    if (this.flashlight && typeof this.flashlight.setDifficulty === 'function') {
      this.flashlight.setDifficulty(this.difficulty);
    }
    if (this.player && typeof this.player.setDifficulty === 'function') {
      this.player.setDifficulty(this.difficulty);
    }
    if (this.anomaly && typeof this.anomaly.setDifficulty === 'function') {
      this.anomaly.setDifficulty(this.difficulty);
    }
  }

  _handleInteraction(item) {
    if (!item) return;

    if (['terminal', 'cctv', 'radio', 'document'].includes(item.type)) {
      if (this.interaction) this.interaction.enabled = false;
    }

    switch (item.type) {
      case 'terminal':
        this.player.unlock();
        this.terminalUI.show();
        this.story.completeObjective('n1_enter');
        break;

      case 'cctv':
        this.player.unlock();
        this.cctvUI.show();
        this.story.completeObjective('n1_cctv');
        this.story.completeObjective('n2_cctv');
        this.anomaly.triggerAnomaly('cctv_figure_behind');
        break;

      case 'radio':
        this.player.unlock();
        this.radioUI.show();
        const night = this.story.getCurrentNight();
        if (night.id === 1) {
          this.radio.playTransmission('n1_intro');
          this.story.completeObjective('n1_radio');
        } else if (night.id === 2) {
          this.radio.playTransmission('n2_unknown');
        } else if (night.id === 3) {
          this.radio.playTransmission('n3_voice');
          this.story.completeObjective('n3_listen');
          this.achievements.unlock('lost_frequency');
        } else if (night.id === 4) {
          this.radio.playTransmission('n4_control_warning');
        } else if (night.id === 5) {
          this.radio.playTransmission('n5_final');
        }
        break;

      case 'breaker':
        item.data.powered = true;
        this.audio.playDoor(true);
        this.lighting.flickerLights.forEach(f => f.light.intensity = f.baseIntensity * 1.5);
        this.story.completeObjective('n1_power');
        this.story.completeObjective('n4_power');
        this.hud.showNotification('DAYA LISTRIK PULIH: Generator utama telah aktif kembali.', 3500);
        break;

      case 'document':
        this.player.unlock();
        this.audio.playInteractFocus();
        this.docUI.openDocument(item.data.docId);
        this.story.markDocumentRead(item.data.docId);
        this.achievements.unlock('classified');

        if (item.data.docId === 'initial_report') {
          this.story.completeObjective('n1_report');
        } else if (item.data.docId === 'missing_report') {
          this.story.completeObjective('n2_medical');
          this.story.completeObjective('n2_document');
        } else if (item.data.docId === 'conflicting_doc_a' || item.data.docId === 'conflicting_doc_b') {
          this.story.completeObjective('n3_compare');
        } else if (item.data.docId === 'experiment_logs') {
          this.story.completeObjective('n4_evidence');
          this.story.completeObjective('n5_logs');
        } else if (item.data.docId === 'final_truth') {
          this.story.completeObjective('n5_truth');
          this.story.completeObjective('n5_signal');
        }
        break;

      case 'battery':
        this.flashlight.recharge(item.data.amount || 50);
        this._lowBatteryWarned = false;
        this.hud.showNotification('BATERAI CADANGAN DIPEROLEH (+50%)', 3000);
        this.audio.playItemPickup();
        this.facility.group.remove(item.mesh);
        const bIdx = this.facility.interactables.indexOf(item);
        if (bIdx !== -1) this.facility.interactables.splice(bIdx, 1);
        break;

      case 'first_aid':
        this.player.stamina = 100;
        this.hud.updateStamina(100);
        this.hud.showNotification('KOTAK MEDIS P3K DIGUNAKAN: Stamina Penuh!', 3500);
        this.audio.playNotification();
        this.facility.group.remove(item.mesh);
        const fIdx = this.facility.interactables.indexOf(item);
        if (fIdx !== -1) this.facility.interactables.splice(fIdx, 1);
        break;

      case 'item':
        this.story.addItem(item.data.item);
        this.facility.group.remove(item.mesh);
        if (item.data.item === 'archive_keycard' && this.facility.keycardBeacon) {
          this.facility.group.remove(this.facility.keycardBeacon);
          this.facility.keycardBeacon = null;
          this.facility.keycardMesh = null;
        }
        const idx = this.facility.interactables.indexOf(item);
        if (idx !== -1) this.facility.interactables.splice(idx, 1);
        this.hud.showNotification(`DIPEROLEH: ${item.data.name}`, 3000);
        this.audio.playItemPickup();
        this.audio.playNotification();

        if (item.data.item === 'archive_keycard') {
          this.story.completeObjective('n4_keycard');
        }
        break;

      case 'door':
        if (item.id === 'archive_room_door') {
          if (this.story.hasItem('archive_keycard')) {
            this.facility.unlockDoor('archive_room_door');
            this.scene.updateMatrixWorld(true);
            this.player.setCollidables(this.facility.getCollidables());
            this.story.completeObjective('n4_archive');
            this.audio.playDoor(true);
            this.hud.showNotification('Ruang Arsip Terbuka menggunakan Kartu Akses.', 3500);
          } else {
            this.hud.showNotification('TERKUNCI: Ruang Arsip butuh Kartu Akses (ada di Storage Bay A).', 3500);
            this.audio.playDoor(false);
          }
        } else if (item.id === 'secret_chamber_door') {
          this.hud.showNotification('TERKUNCI: Butuh otorisasi terminal (ketik: override chamber 47.3).', 3500);
          this.audio.playDoor(false);
        }
        break;

      case 'radio_tuner':
        this.story.completeObjective('n3_comms');
        this.story.completeObjective('n3_recording');
        this.hud.showNotification('TERKALIBRASI: Frekuensi 47.3 Hz Berhasil Disinkronkan.', 3500);
        this.audio.playRadioStatic(1.5);
        this.radio.playTransmission('n3_doctor');
        break;

      case 'final_choice':
        this._triggerFinalChoice();
        break;
    }
  }

  _triggerFinalChoice() {
    this.player.unlock();
    this.endingUI.showChoiceModal((upper) => {
      this.story.completeObjective('n5_choice');
      const ending = this.story.calculateEnding(upper);
      if (upper === 'C') {
        this.achievements.unlock('reality_check');
      }
      const stats = {
        documentsCount: this.story.readDocuments ? this.story.readDocuments.size : 0,
        anomaliesCount: this.anomaly ? this.anomaly.getDiscoveredCount() : 0,
        night: 5
      };
      this.endingUI.showEnding(ending, stats);
    });
  }

  _initMenuBackground() {
    this.menuShots = [
      { label: 'SECURITY HUB // RUANG KONTROL', pos: { x: 0.2, y: 1.62, z: 2.8 }, yaw: 3.05, pitch: -0.07, pan: 0.09, dolly: 0.18, fov: 68 },
      { label: 'MAIN CORRIDOR // LORONG UTAMA', pos: { x: -8, y: 1.62, z: 12.5 }, yaw: 1.55, pitch: -0.05, pan: 0.11, dolly: 0.22, fov: 70 },
      { label: 'RESEARCH LAB C // LABORATORIUM', pos: { x: 0, y: 1.62, z: -17.5 }, yaw: 3.14, pitch: -0.06, pan: 0.08, dolly: 0.16, fov: 66 },
      { label: 'MEDICAL WARD // RUANG MEDIS', pos: { x: 20, y: 1.62, z: 7.2 }, yaw: 0.0, pitch: -0.06, pan: 0.1, dolly: 0.18, fov: 67 },
      { label: 'ELECTRICAL // SUBSTASI LISTRIK', pos: { x: -20, y: 1.62, z: 7.0 }, yaw: 0.0, pitch: -0.05, pan: 0.09, dolly: 0.16, fov: 67 },
      { label: 'COMMUNICATIONS // RUANG RF', pos: { x: 20, y: 1.62, z: 17.5 }, yaw: 3.14, pitch: -0.06, pan: 0.09, dolly: 0.16, fov: 67 },
      { label: 'RESTRICTED ARCHIVE // ARSIP', pos: { x: 44, y: 1.62, z: -7.5 }, yaw: 3.14, pitch: -0.05, pan: 0.08, dolly: 0.14, fov: 65 },
      { label: 'ECHO CORE // RUANG REAKTOR', pos: { x: 44, y: 1.68, z: -22.0 }, yaw: 3.14, pitch: -0.04, pan: 0.07, dolly: 0.12, fov: 64 }
    ];
    this.menuShotIndex = 0;
    this.menuShotElapsed = 0;
    this.menuShotDuration = 9.0;
    this.menuShotTransitioning = false;
    this._applyMenuShot(this.menuShots[0], true);
  }

  _initBackgroundState() {
    this._initMenuBackground();
  }

  _isMenuBackgroundActive() {
    return !this.isRunning && this.mainMenu && this.mainMenu.container && this.mainMenu.container.style.display !== 'none';
  }

  _applyMenuShot(shot, immediate = false) {
    if (!shot) return;
    this.menuShotBaseYaw = shot.yaw;
    this.menuShotBasePitch = shot.pitch;
    this.menuShotBaseFov = shot.fov || 70;
    this.menuShotBasePos = { x: shot.pos.x, y: shot.pos.y, z: shot.pos.z };
    this.player.yawObject.position.set(shot.pos.x, shot.pos.y, shot.pos.z);
    this.player.yawObject.rotation.y = shot.yaw;
    this.player.pitchObject.rotation.x = shot.pitch;
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.camera.fov = this.menuShotBaseFov;
    this.camera.updateProjectionMatrix();
    if (this.mainMenu && typeof this.mainMenu.setLocationLabel === 'function') {
      this.mainMenu.setLocationLabel(`LIVE FEED // ${shot.label}`);
    }
  }

  _advanceMenuShot() {
    if (this.menuShotTransitioning || !this.menuShots || this.menuShots.length === 0) return;
    this.menuShotTransitioning = true;
    this.menuShotIndex = (this.menuShotIndex + 1) % this.menuShots.length;
    const shot = this.menuShots[this.menuShotIndex];
    const doApply = () => this._applyMenuShot(shot);
    if (this.mainMenu && typeof this.mainMenu.transitionShot === 'function') {
      this.mainMenu.transitionShot(`LIVE FEED // ${shot.label}`, doApply).finally(() => {
        this.menuShotTransitioning = false;
        this.menuShotElapsed = 0;
      });
    } else {
      doApply();
      this.menuShotTransitioning = false;
      this.menuShotElapsed = 0;
    }
  }

  _updateMenuCamera(delta) {
    const shot = this.menuShots[this.menuShotIndex];
    if (!shot || !this.menuShotBasePos) return;
    this.menuShotElapsed += delta;
    const t = this.menuShotElapsed;
    const pan = shot.pan || 0.08;
    const dolly = shot.dolly || 0.15;
    this.player.yawObject.rotation.y = this.menuShotBaseYaw + Math.sin(t * 0.16) * pan;
    this.player.pitchObject.rotation.x = this.menuShotBasePitch + Math.sin(t * 0.12) * 0.018;
    const forwardX = -Math.sin(this.menuShotBaseYaw);
    const forwardZ = -Math.cos(this.menuShotBaseYaw);
    const drift = Math.sin(t * 0.08) * dolly;
    this.player.yawObject.position.set(
      this.menuShotBasePos.x + forwardX * drift,
      this.menuShotBasePos.y + Math.sin(t * 0.1) * 0.02,
      this.menuShotBasePos.z + forwardZ * drift
    );
    this.camera.fov = (this.menuShotBaseFov || 70) + Math.sin(t * 0.09) * 0.5;
    this.camera.updateProjectionMatrix();
    if (this.menuShotElapsed >= this.menuShotDuration) {
      this._advanceMenuShot();
    }
  }

  startNewGame() {
    this.story = new StoryManager();
    this.computer.setNight(1);
    this._bindGameEvents();
    this.startGameSession();
  }

  startGameSession() {
    this.isRunning = true;
    this.isPaused = false;
    this.hud.show();
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.player.yawObject.position.set(0, this.player.standHeight, 0);
    this.player.yawObject.rotation.set(0, 0, 0);
    this.player.pitchObject.rotation.set(0, 0, 0);
    this.player.requestLock();

    // Start dark horror ambient music & soundscape
    if (this.audio) {
      this.audio.init();
      this.audio.resume();
      this.audio.startHorrorMusic();
    }

    // Apply active difficulty modifiers (flashlight drain, stamina, anomalies)
    this._applyDifficulty(this.difficulty);

    const currNight = this.story.getCurrentNight();
    this.hud.updateNight(currNight.title, currNight.subtitle);
    this._updateHUDObjective();

    // Helpful controls reminder notification on start
    setTimeout(() => {
      this.hud.showNotification('KONTROL: [W,A,S,D] Bergerak | [Shift] Lari | [F] Senter | [E] Interaksi | [M] Peta | [H] Tutorial', 7000);
    }, 1200);

    if (!this.flashlight.isOn()) {
      this.achievements.unlock('no_light');
    }
  }

  _getTargetMetadata(objId) {
    const meta = {
      'n1_enter': { x: 0, z: 0, name: 'Ruang Kontrol (Lobi Tengah)', room: 'Ruang Kontrol' },
      'n1_power': { x: -20, z: 4, name: 'Ruang Listrik (Lorong Barat)', room: 'Ruang Listrik' },
      'n1_cctv': { x: 1.8, z: -1.8, name: 'Konsol CCTV (Meja Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n1_report': { x: -1.8, z: -1.8, name: 'Terminal Komputer (Meja Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n1_radio': { x: 0, z: -2.2, name: 'Transceiver Radio (Meja Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n2_cctv': { x: 1.8, z: -1.8, name: 'Konsol CCTV (Meja Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n2_medical': { x: 20, z: 4, name: 'Ruang Medis (Lorong Timur)', room: 'Ruang Medis' },
      'n2_document': { x: 16.5, z: 4.0, name: 'Dokumen Subjek 12 (Meja Ruang Medis)', room: 'Ruang Medis' },
      'n2_password': { x: -1.8, z: -1.8, name: 'Terminal Komputer (Klik Tombol BUKA 997)', room: 'Ruang Kontrol' },
      'n2_report': { x: -1.8, z: -1.8, name: 'Terminal Komputer (Klik LAPOR TEMUAN)', room: 'Ruang Kontrol' },
      'n3_comms': { x: 20, z: 21, name: 'Ruang Komunikasi (Lorong Timur)', room: 'Ruang Komunikasi' },
      'n3_listen': { x: 0, z: -2.2, name: 'Radio Komunikasi (Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n3_recording': { x: 19.6, z: 24.5, name: 'Tuner Frekuensi 47.3 Hz (Ruang Komunikasi)', room: 'Ruang Komunikasi' },
      'n3_compare': { x: 21.6, z: 24.5, name: 'Catatan Dokumen (Meja Komunikasi)', room: 'Ruang Komunikasi' },
      'n3_decide': { x: 0, z: -2.2, name: 'Radio Komunikasi (Ruang Kontrol)', room: 'Ruang Kontrol' },
      'n4_leave': { x: 0, z: 12.5, name: 'Lorong Utama Bunker', room: 'Lorong Utama' },
      'n4_power': { x: -20, z: 4, name: 'Ruang Listrik (Lorong Barat)', room: 'Ruang Listrik' },
      'n4_keycard': { x: -20, z: 21, name: 'Kartu Akses Arsip (Meja Storage Bay A)', room: 'Gudang Barat' },
      'n4_escape': { x: 30, z: 12.5, name: 'Lorong Timur (Menuju Ruang Arsip)', room: 'Lorong Timur' },
      'n4_archive': { x: 44, z: -3.9, name: 'Pintu Ruang Arsip (Ujung Timur)', room: 'Ruang Arsip' },
      'n4_evidence': { x: 39.0, z: -11.0, name: 'Dokumen Proyek ECHO (Ruang Arsip)', room: 'Ruang Arsip' },
      'n5_chamber': { x: 44, z: -17.9, name: 'Pintu Secret Chamber (Di Balik Arsip)', room: 'Secret Chamber' },
      'n5_truth': { x: 43.3, z: -21.5, name: 'Dokumen Kebenaran (Ruang Reaktor)', room: 'Secret Chamber' },
      'n5_logs': { x: 44, z: -11.0, name: 'Catatan Dr. Vasquez (Meja Arsip)', room: 'Ruang Arsip' },
      'n5_signal': { x: 44, z: -20.5, name: 'Konsol Reaktor (Secret Chamber)', room: 'Secret Chamber' },
      'n5_choice': { x: 44, z: -20.5, name: 'Konsol Pemancar (Secret Chamber)', room: 'Secret Chamber' }
    };
    return meta[objId] || null;
  }

  _updateNavigationGuidance() {
    if (!this.hud || !this.player) return;
    const currNight = this.story.getCurrentNight();
    if (!currNight) return;
    const pending = currNight.objectives.find(o => !o.completed);
    if (!pending) {
      this.hud.updateGuidance('✅ Semua tugas malam ini telah selesai.');
      return;
    }

    const target = this._getTargetMetadata(pending.id);
    if (!target) {
      this.hud.updateGuidance(null);
      return;
    }

    const pos = this.player.getPosition();
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    let dirText = '';
    if (dist <= 3.6) {
      dirText = `ANDA DI LOKASI: ${target.name} - dekati objek dan tekan [E]`;
    } else {
      let direction = '';
      if (Math.abs(dx) > Math.abs(dz)) {
        direction = dx > 0 ? 'arah Timur (Kanan)' : 'arah Barat (Kiri)';
      } else {
        direction = dz > 0 ? 'arah Selatan (Lurus)' : 'arah Utara (Mundur)';
      }
      dirText = `TUJUAN: ${target.name} - ${Math.round(dist)}m (${direction})`;
    }

    this.hud.updateGuidance(dirText);
  }

  _updateHUDObjective() {
    const currNight = this.story.getCurrentNight();
    if (!currNight) return;
    const pending = currNight.objectives.find(o => !o.completed);
    const done = currNight.objectives.filter(o => o.completed).length;
    const total = currNight.objectives.length;
    if (this.hud && typeof this.hud.updateObjectiveProgress === 'function') {
      this.hud.updateObjectiveProgress(done, total);
    }
    if (pending) {
      this.hud.updateObjective(pending.text);
    } else {
      this.hud.updateObjective('Semua objektif giliran jaga selesai.');
    }
    this._updateNavigationGuidance();
  }

  _onCloudSaveLoaded(saveData) {
    if (!saveData) return;
    this.story.loadFromSave(saveData);
    this.computer.setNight(this.story.currentNightIndex + 1);

    if (this.isRunning) {
      const currNight = this.story.getCurrentNight();
      if (currNight) {
        this.hud.updateNight(currNight.title, currNight.subtitle);
      }
      this._updateHUDObjective();
      this.hud.showNotification('PROGRES DIMUAT DARI SUPABASE CLOUD', 4000);
    } else {
      if (this.mainMenu) {
        this.mainMenu._refreshContinueButton();
      }
    }
  }

  _saveGameState() {
    const saveObj = this.story.getSaveState();
    SaveManager.saveGame(saveObj);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this._isMenuBackgroundActive()) {
      this._updateMenuCamera(delta);
    }

    if (this.isRunning && !this.isPaused && !this._isAnyUIOpen()) {
      this.player.update(delta);
      this.flashlight.update(delta);
      this.interaction.update();
      this.facility.update(delta, this.player ? this.player.getPosition() : null);
      this.anomaly.update(delta, this.story.currentNightIndex);

      // Real-time navigation distance and guidance update
      this.navGuidanceTimer = (this.navGuidanceTimer || 0) - delta;
      if (this.navGuidanceTimer <= 0) {
        this.navGuidanceTimer = 0.35;
        this._updateNavigationGuidance();
      }

      // Periodic underground bunker pipe creak / ambient groan
      this.pipeCreakTimer -= delta;
      if (this.pipeCreakTimer <= 0) {
        this.pipeCreakTimer = 22 + Math.random() * 25;
        this.audio.playPipeCreak();
      }

      // Periodic horror ambient sound effects (metal groan, distant scream, water drip, wind howl, etc.)
      this.horrorSfxTimer -= delta;
      if (this.horrorSfxTimer <= 0) {
        const interval = this.difficulty === 'nightmare' ? (7 + Math.random() * 9) : (14 + Math.random() * 16);
        this.horrorSfxTimer = interval;
        this.audio.playRandomHorrorSFX();
      }

      // Dynamic Story Proximity Triggers
      const pos = this.player.getPosition();
      const currNight = this.story.getCurrentNight();

      // Cinematic Vignette Breathing & Tension reaction
      if (this.hud && this.hud.vignette) {
        if (this.player.stamina < 25) {
          const pulse = 0.82 + Math.sin(performance.now() * 0.008) * 0.18;
          this.hud.vignette.style.opacity = pulse.toString();
        } else {
          this.hud.vignette.style.opacity = '1';
        }
      }

      // Dynamic Proximity to Shadow Observer Entity (Black Anomaly Jumpscare Encounter)
      if (this.facility.entityMesh && this.facility.entityMesh.visible) {
        const entPos = this.facility.entityMesh.position;
        if (pos.distanceTo(entPos) < 6.8) {
          this.facility.setEntityPosition(null);
          this.audio.playJumpscare();
          this.player.shake(0.14, 1.2);
          if (this.hud && typeof this.hud.triggerJumpscare === 'function') {
            this.hud.triggerJumpscare(1200);
          }
          if (this.player) {
            this.player.stamina = Math.max(5, this.player.stamina - 40);
          }
          // Paranormal electromagnetic surge: Flashlight flickers out and reboots
          const wasFlashlightOn = this.flashlight && this.flashlight.isOn();
          if (wasFlashlightOn) {
            this.flashlight.setPower(false);
            setTimeout(() => {
              if (this.isRunning && this.flashlight) {
                this.audio.playFlashlightClick();
                this.flashlight.setPower(true);
              }
            }, 2000);
          }
        }
      }

      if (currNight) {
        // Night 4: Leaving Control Room detection
        if (currNight.id === 4) {
          if (Math.abs(pos.z) > 7.5 || Math.abs(pos.x) > 7.5) {
            this.story.completeObjective('n4_leave');
          }
          // Night 4: Escaping corridor event when heading East or West
          if (pos.z > 10 && Math.abs(pos.x) > 12) {
            this.story.completeObjective('n4_escape');
          }
        }
      }
    }

    if (this.isRunning) {
      if (this.mapUI) {
        this.mapUI.updatePlayerDiscovery(this.player.getPosition());
        if (this.mapUI.isOpen) {
          this.mapUI.render();
        }
      }
    }

    this.lighting.update(delta);

    if (this.cctvUI && this.cctvUI.isOpen) {
      this.cctvUI.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
