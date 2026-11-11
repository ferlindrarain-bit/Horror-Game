import { RADIO_TRANSMISSIONS } from '../data/dialogues.js';

export class RadioSystem {
  constructor() {
    this.currentTransmission = null;
    this.messageIndex = 0;
    this.isPlaying = false;
    this.activeChoices = null;

    this.onMessage = null; // (sender, text) => {}
    this.onChoices = null; // (choices) => {}
    this.onComplete = null; // () => {}
    this.onChoiceSelected = null; // (effect) => {}

    this.messageTimer = null;
  }

  playTransmission(transId) {
    const trans = RADIO_TRANSMISSIONS[transId];
    if (!trans) {
      console.warn('Radio transmission not found:', transId);
      return false;
    }

    this.currentTransmission = trans;
    this.messageIndex = 0;
    this.isPlaying = true;
    this.activeChoices = null;

    this._stepMessage();
    return true;
  }

  _stepMessage() {
    if (!this.currentTransmission || !this.isPlaying) return;

    if (this.messageIndex < this.currentTransmission.messages.length) {
      const msg = this.currentTransmission.messages[this.messageIndex];
      this.messageIndex++;

      if (this.onMessage) {
        this.onMessage(msg.sender, msg.text);
      }

      // Delay between messages based on text length
      const delay = Math.max(2200, msg.text.length * 45);
      this.messageTimer = setTimeout(() => {
        this._stepMessage();
      }, delay);
    } else {
      // All messages finished. Present choices or finish
      if (this.currentTransmission.choices && this.currentTransmission.choices.length > 0) {
        this.activeChoices = this.currentTransmission.choices;
        if (this.onChoices) {
          this.onChoices(this.activeChoices);
        }
      } else {
        this.isPlaying = false;
        if (this.onComplete) {
          this.onComplete(this.currentTransmission);
        }
      }
    }
  }

  selectChoice(choiceIndex) {
    if (!this.activeChoices || !this.activeChoices[choiceIndex]) return;

    const chosen = this.activeChoices[choiceIndex];
    this.activeChoices = null;
    this.isPlaying = false;

    if (chosen.response && this.onMessage) {
      // Optional follow-up response
      this.onMessage(this.currentTransmission.sender || 'RADIO', chosen.response);
    }

    if (this.onChoiceSelected) {
      this.onChoiceSelected(chosen.effect || {});
    }

    if (this.onComplete) {
      this.onComplete(this.currentTransmission);
    }
  }

  stop() {
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.isPlaying = false;
    this.currentTransmission = null;
    this.activeChoices = null;
  }
}
