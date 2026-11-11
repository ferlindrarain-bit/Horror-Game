import { supabaseService } from '../services/SupabaseService.js';

export class SaveManager {
  static SAVE_KEY = 'tls_save_v1';
  static SETTINGS_KEY = 'tls_settings_v1';
  static ACHIEVEMENTS_KEY = 'tls_achievements_v1';

  static onCloudSync = null;

  /**
   * Save game state:
   * 1. Immediately writes to localStorage (offline-safe)
   * 2. Asynchronously attempts sync with Supabase cloud
   */
  static saveGame(data) {
    try {
      localStorage.setItem(SaveManager.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save game locally:', e);
      return false;
    }

    // Trigger cloud sync asynchronously
    if (supabaseService.isConfigured()) {
      const achievements = SaveManager.loadAchievements();
      supabaseService.saveGame(data, achievements)
        .then((res) => {
          if (SaveManager.onCloudSync) {
            SaveManager.onCloudSync(res);
          }
        })
        .catch((err) => {
          console.warn('Background cloud save failed:', err);
          if (SaveManager.onCloudSync) {
            SaveManager.onCloudSync({ success: false, error: err.message });
          }
        });
    }

    return true;
  }

  /**
   * Synchronously load from local storage
   */
  static loadGame() {
    try {
      const raw = localStorage.getItem(SaveManager.SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse save game:', e);
      return null;
    }
  }

  /**
   * Asynchronously load save from Supabase and cache locally
   */
  static async loadFromCloud(playerId = null) {
    if (!supabaseService.isConfigured()) {
      return { success: false, reason: 'unconfigured', message: 'Supabase belum dikonfigurasi.' };
    }

    const res = await supabaseService.loadGame(playerId);
    if (res.success && res.saveData) {
      // Cache loaded save data to local storage
      SaveManager.saveGame(res.saveData);
      if (res.achievements && Array.isArray(res.achievements)) {
        SaveManager.saveAchievements(res.achievements);
      }
      return {
        success: true,
        saveData: res.saveData,
        achievements: res.achievements,
        playerName: res.player_name,
        nightIndex: res.night_index,
        updatedAt: res.updated_at
      };
    }

    return res;
  }

  /**
   * Force sync current local save to Supabase cloud
   */
  static async syncToCloud() {
    const localSave = SaveManager.loadGame();
    if (!localSave) {
      return { success: false, message: 'Tidak ada save data lokal untuk di-sync.' };
    }
    const achievements = SaveManager.loadAchievements();
    return await supabaseService.saveGame(localSave, achievements);
  }

  static hasSave() {
    return !!localStorage.getItem(SaveManager.SAVE_KEY);
  }

  static clearSave() {
    try {
      localStorage.removeItem(SaveManager.SAVE_KEY);
    } catch (e) {
      console.warn('Could not clear save:', e);
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(SaveManager.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  }

  static loadSettings() {
    try {
      const raw = localStorage.getItem(SaveManager.SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static saveAchievements(list) {
    try {
      localStorage.setItem(SaveManager.ACHIEVEMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Could not save achievements:', e);
    }
  }

  static loadAchievements() {
    try {
      const raw = localStorage.getItem(SaveManager.ACHIEVEMENTS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
}
