import { createClient } from '@supabase/supabase-js';

/**
 * SupabaseService — Sector 09 Cloud Telemetry & Save Sync
 *
 * Provides persistent remote save data for every player.
 * Supports:
 * - Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * - In-game UI override & configuration
 * - Automatic operator ID generation & profile management
 * - Upsert game save to `game_saves` table
 */
export class SupabaseService {
  static LS_CONFIG_KEY = 'tls_supabase_config_v1';
  static LS_PLAYER_KEY = 'tls_operator_profile_v1';

  constructor() {
    this.client = null;
    this.url = '';
    this.anonKey = '';
    this.isConnected = false;
    this.lastSyncTime = null;
    this.lastError = null;

    this.player = this._loadOrCreatePlayerProfile();
    this.init();
  }

  static _getStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) {
      // Storage restricted
    }
    return null;
  }

  /**
   * Load existing player profile or generate a new Operator ID
   */
  _loadOrCreatePlayerProfile() {
    const storage = SupabaseService._getStorage();
    try {
      if (storage) {
        const stored = storage.getItem(SupabaseService.LS_PLAYER_KEY);
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read player profile:', e);
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newProfile = {
      id: `OPR-${randomSuffix}`,
      callsign: `OPERATOR_${randomSuffix}`,
      created_at: new Date().toISOString()
    };

    try {
      if (storage) {
        storage.setItem(SupabaseService.LS_PLAYER_KEY, JSON.stringify(newProfile));
      }
    } catch (e) {
      console.warn('Could not write player profile:', e);
    }

    return newProfile;
  }

  /**
   * Initialize Supabase client from env or localStorage
   */
  init() {
    let customConfig = null;
    const storage = SupabaseService._getStorage();
    try {
      if (storage) {
        const raw = storage.getItem(SupabaseService.LS_CONFIG_KEY);
        if (raw) customConfig = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not parse stored supabase config:', e);
    }

    const envUrl = import.meta.env?.VITE_SUPABASE_URL || '';
    const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

    this.url = (customConfig?.url || this.url || envUrl || '').trim();
    this.anonKey = (customConfig?.anonKey || this.anonKey || envKey || '').trim();

    if (this.url && this.anonKey && this.url.startsWith('http')) {
      try {
        this.client = createClient(this.url, this.anonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
      } catch (err) {
        console.error('Failed to instantiate Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  isConfigured() {
    return !!(this.client && this.url && this.anonKey);
  }

  getConfig() {
    return {
      url: this.url,
      anonKey: this.anonKey,
      isConfigured: this.isConfigured()
    };
  }

  saveConfig(url, anonKey) {
    this.url = (url || '').trim();
    this.anonKey = (anonKey || '').trim();

    const storage = SupabaseService._getStorage();
    try {
      if (storage) {
        storage.setItem(
          SupabaseService.LS_CONFIG_KEY,
          JSON.stringify({ url: this.url, anonKey: this.anonKey })
        );
      }
    } catch (e) {
      console.warn('Could not persist custom supabase config:', e);
    }

    this.init();
    return this.isConfigured();
  }

  getPlayerProfile() {
    return { ...this.player };
  }

  updatePlayerProfile(id, callsign) {
    if (id) this.player.id = id.trim().toUpperCase();
    if (callsign) this.player.callsign = callsign.trim();

    const storage = SupabaseService._getStorage();
    try {
      if (storage) {
        storage.setItem(SupabaseService.LS_PLAYER_KEY, JSON.stringify(this.player));
      }
    } catch (e) {
      console.warn('Could not persist player profile:', e);
    }
  }

  generateNewPlayerId() {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.player.id = `OPR-${randomSuffix}`;
    this.player.callsign = `OPERATOR_${randomSuffix}`;
    const storage = SupabaseService._getStorage();
    try {
      if (storage) {
        storage.setItem(SupabaseService.LS_PLAYER_KEY, JSON.stringify(this.player));
      }
    } catch (e) {
      console.warn('Could not persist player profile:', e);
    }
    return this.player;
  }

  /**
   * Test connection to Supabase
   */
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'Supabase URL atau Anon Key belum dikonfigurasi.' };
    }

    try {
      const { data, error } = await this.client
        .from('game_saves')
        .select('player_id')
        .limit(1);

      if (error) {
        this.isConnected = false;
        this.lastError = error.message;
        return {
          success: false,
          message: `Koneksi gagal: ${error.message} (Pastikan tabel 'game_saves' sudah dibuat via SQL editor)`
        };
      }

      this.isConnected = true;
      this.lastError = null;
      return { success: true, message: 'Koneksi ke Supabase berhasil! Siap menyimpan data.' };
    } catch (err) {
      this.isConnected = false;
      this.lastError = err.message;
      return { success: false, message: `Error jaringan: ${err.message}` };
    }
  }

  /**
   * Save game state to Supabase table `game_saves`
   */
  async saveGame(saveData, achievements = []) {
    if (!this.isConfigured()) {
      return { success: false, reason: 'unconfigured' };
    }

    const nightIndex = saveData?.currentNightIndex || 0;
    const nightTitle = `NIGHT ${nightIndex + 1}`;

    const payload = {
      player_id: this.player.id,
      player_name: this.player.callsign,
      night_index: nightIndex,
      night_title: nightTitle,
      save_data: saveData,
      achievements: achievements || [],
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.client
        .from('game_saves')
        .upsert(payload, { onConflict: 'player_id' });

      if (error) {
        console.error('Supabase cloud save error:', error);
        this.lastError = error.message;
        return { success: false, error: error.message };
      }

      this.lastSyncTime = new Date();
      this.isConnected = true;
      return { success: true, timestamp: this.lastSyncTime };
    } catch (err) {
      console.error('Network exception during Supabase save:', err);
      this.lastError = err.message;
      return { success: false, error: err.message };
    }
  }

  /**
   * Load game state from Supabase for a specific player_id (or current player)
   */
  async loadGame(targetPlayerId = null) {
    if (!this.isConfigured()) {
      return { success: false, reason: 'unconfigured' };
    }

    const pid = (targetPlayerId || this.player.id).trim().toUpperCase();

    try {
      const { data, error } = await this.client
        .from('game_saves')
        .select('*')
        .eq('player_id', pid)
        .maybeSingle();

      if (error) {
        console.error('Supabase cloud load error:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, notFound: true, message: `Save data untuk Operator '${pid}' tidak ditemukan di cloud.` };
      }

      this.lastSyncTime = new Date();
      return {
        success: true,
        saveData: data.save_data,
        achievements: data.achievements,
        player_name: data.player_name,
        night_index: data.night_index,
        updated_at: data.updated_at
      };
    } catch (err) {
      console.error('Network exception during Supabase load:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetch recent saves / leaderboard or active operators
   */
  async fetchRecentOperators(limit = 10) {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('game_saves')
        .select('player_id, player_name, night_title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }
}

// Global singleton instance
export const supabaseService = new SupabaseService();
