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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080c);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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
    };
    this.flashlight.onBatteryChange = (batt) => this.hud.updateBattery(batt);

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
      this.hud.showNotification(`ACHIEVEMENT UNLOCKED: ${ach.icon} ${ach.name} - ${ach.description}`, 4500);
      this.audio.playNotification();
    };

    this.story.onObjectiveComplete = (obj) => {
      this.hud.showNotification(`OBJECTIVE COMPLETED: ${obj.text}`, 3000);
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

      this.hud.playNightTransition(nextNight.title, nextNight.subtitle, () => {
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
          this.hud.showNotification('WARNING: FACILITY STRUCTURAL INSTABILITY DETECTED.', 4000);
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
      this.pauseMenu.show(currNight ? currNight.objectives : []);
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
      this.hud.showNotification('SYSTEM: Secret Research Chamber containment seal disengaged!', 4000);
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
            this.pauseMenu.show(currNight ? currNight.objectives : []);
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
          this.pauseMenu.show(currNight ? currNight.objectives : []);
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
        this.audio.playElectricBuzz();
        this.audio.playDoor(true);
        this.lighting.flickerLights.forEach(f => f.light.intensity = f.baseIntensity * 1.5);
        this.story.completeObjective('n1_power');
        this.story.completeObjective('n4_power');
        this.hud.showNotification('FACILITY POWER RESTORED: Main generators online.', 3500);
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

      case 'item':
        this.story.addItem(item.data.item);
        this.facility.group.remove(item.mesh);
        const idx = this.facility.interactables.indexOf(item);
        if (idx !== -1) this.facility.interactables.splice(idx, 1);
        this.hud.showNotification(`OBTAINED: ${item.data.name}`, 3000);
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
            this.hud.showNotification('Restricted Archive unlocked with Keycard.', 3000);
          } else {
            this.hud.showNotification('LOCKED: Restricted Archive requires Keycard (found in Storage Bay A).', 3000);
            this.audio.playDoor(false);
          }
        } else if (item.id === 'secret_chamber_door') {
          this.hud.showNotification('LOCKED: Requires Terminal Authorization (override chamber 47.3).', 3000);
          this.audio.playDoor(false);
        }
        break;

      case 'radio_tuner':
        this.story.completeObjective('n3_comms');
        this.story.completeObjective('n3_recording');
        this.hud.showNotification('CALIBRATED: 47.3 Hz Frequency Synchronized.', 3000);
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

    if (!this.flashlight.isOn()) {
      this.achievements.unlock('no_light');
    }
  }

  _updateHUDObjective() {
    const currNight = this.story.getCurrentNight();
    if (!currNight) return;
    const pending = currNight.objectives.find(o => !o.completed);
    if (pending) {
      this.hud.updateObjective(pending.text);
    } else {
      this.hud.updateObjective('All night shift objectives completed.');
    }
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

    if (this.isRunning && !this.isPaused && !this._isAnyUIOpen()) {
      this.player.update(delta);
      this.flashlight.update(delta);
      this.interaction.update();
      this.facility.update(delta);
      this.anomaly.update(delta, this.story.currentNightIndex);

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
