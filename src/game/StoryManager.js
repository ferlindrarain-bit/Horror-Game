import { NIGHTS } from '../data/missions.js';

export class StoryManager {
  constructor() {
    this.currentNightIndex = 0;
    this.currentNight = JSON.parse(JSON.stringify(NIGHTS[0]));
    this.inventory = new Set();
    this.readDocuments = new Set();
    this.discoveredAnomalies = new Set();

    // Story metrics
    this.state = {
      trust_control: 0,
      trust_unknown: 0,
      evidence: 0,
      suspicion: 0,
      signal_contamination: 0,
      secrets_found: 0
    };

    // Callbacks
    this.onObjectiveComplete = null;
    this.onNightComplete = null;
    this.onEndingReached = null;
  }

  loadFromSave(savedData) {
    if (!savedData) return;
    if (savedData.currentNightIndex !== undefined) {
      this.currentNightIndex = savedData.currentNightIndex;
      // Deep-copy so we never mutate the module-level NIGHTS constants
      this.currentNight = JSON.parse(JSON.stringify(NIGHTS[this.currentNightIndex] || NIGHTS[0]));
    }
    if (savedData.inventory) {
      this.inventory = new Set(savedData.inventory);
    }
    if (savedData.readDocuments) {
      this.readDocuments = new Set(savedData.readDocuments);
    }
    if (savedData.discoveredAnomalies) {
      this.discoveredAnomalies = new Set(savedData.discoveredAnomalies);
    }
    if (savedData.state) {
      Object.assign(this.state, savedData.state);
    }
    if (savedData.objectives && this.currentNight) {
      this.currentNight.objectives.forEach(obj => {
        if (savedData.objectives[obj.id]) {
          obj.completed = true;
        }
      });
    }
  }

  getSaveState() {
    const objs = {};
    if (this.currentNight) {
      this.currentNight.objectives.forEach(o => { objs[o.id] = o.completed; });
    }
    return {
      currentNightIndex: this.currentNightIndex,
      inventory: Array.from(this.inventory),
      readDocuments: Array.from(this.readDocuments),
      discoveredAnomalies: Array.from(this.discoveredAnomalies),
      state: { ...this.state },
      objectives: objs
    };
  }

  getCurrentNight() {
    return this.currentNight || NIGHTS[this.currentNightIndex] || NIGHTS[0];
  }

  completeObjective(objId) {
    if (!this.currentNight) return false;

    const obj = this.currentNight.objectives.find(o => o.id === objId);
    if (obj && !obj.completed) {
      obj.completed = true;
      if (this.onObjectiveComplete) {
        this.onObjectiveComplete(obj);
      }

      // Check if all objectives in current night are done
      const allDone = this.currentNight.objectives.every(o => o.completed);
      if (allDone) {
        setTimeout(() => {
          this._advanceNight();
        }, 1500);
      }
      return true;
    }
    return false;
  }

  _advanceNight() {
    const finishedNight = this.currentNight;
    if (this.currentNightIndex < NIGHTS.length - 1) {
      this.currentNightIndex++;
      this.currentNight = JSON.parse(JSON.stringify(NIGHTS[this.currentNightIndex])); // fresh copy
      if (this.onNightComplete) {
        this.onNightComplete(finishedNight, this.currentNight);
      }
    } else {
      // Completed all nights -> Ending is handled by final choice
    }
  }

  applyEffect(effect) {
    if (!effect) return;
    for (const key in effect) {
      if (this.state[key] !== undefined) {
        this.state[key] += effect[key];
      }
    }
  }

  addItem(itemId) {
    this.inventory.add(itemId);
  }

  hasItem(itemId) {
    return this.inventory.has(itemId);
  }

  markDocumentRead(docId) {
    this.readDocuments.add(docId);
    this.state.evidence += 1;
  }

  calculateEnding(finalChoiceKey) {
    // Determine ending based on choices and collected secrets
    if (finalChoiceKey === 'A') {
      return {
        id: 'ENDING_A',
        title: 'ENDING A: THE BAD SIGNAL',
        subtitle: 'The eternal cycle continues.',
        text: `You obeyed Central Command and allowed the resonance frequency to continue its transmission.
The facility systems hum steadily. Your shift ends... only for the clock to rewind to Night 1.
The operator before you had made the exact same choice.
You are now part of Sector 09's perpetual memory loop.`
      };
    } else if (finalChoiceKey === 'B') {
      return {
        id: 'ENDING_B',
        title: 'ENDING B: THE ESCAPE',
        subtitle: 'Severing the link.',
        text: `You engaged the frequency inverter, destroying the 47.3 Hz transmission array.
Alarms blared as the facility plunged into darkness.
You forced open the heavy emergency blast doors and escaped to the surface.
Behind you, Sector 09 was silent for the first time in twenty years.
Yet occasionally, in your dreams, a quiet voice repeats through static:
"Stop playing. I know you are watching."`
      };
    } else {
      // Ending C - The True Reality
      return {
        id: 'ENDING_C',
        title: 'ENDING C: THE TRUE REALITY',
        subtitle: 'Consciousness unbounded.',
        text: `You synchronized your consciousness with the core transmitter at 47.3 Hz.
The walls of concrete and metal dissolved into infinite cascading data streams.
You realized Sector 09 was never a physical bunker—it was a cognitive simulation designed to preserve human awareness after the collapse of 2049.
You are not the prisoner of the facility. You are its architect and its observer.
Reality error resolved. You are finally awake.`
      };
    }
  }
}
