import { ACHIEVEMENTS } from '../data/achievements.js';
import { SaveManager } from './SaveManager.js';

export class AchievementManager {
  constructor() {
    this.unlocked = new Set(SaveManager.loadAchievements());
    this.onUnlock = null; // (achievement) => {}
  }

  unlock(id) {
    if (this.unlocked.has(id)) return;

    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;

    this.unlocked.add(id);
    SaveManager.saveAchievements(Array.from(this.unlocked));

    if (this.onUnlock) {
      this.onUnlock(ach);
    }
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }

  getAll() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: this.unlocked.has(a.id)
    }));
  }
}
