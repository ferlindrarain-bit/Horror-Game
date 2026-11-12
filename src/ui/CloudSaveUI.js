import { supabaseService } from '../services/SupabaseService.js';
import { SaveManager } from '../game/SaveManager.js';

export class CloudSaveUI {
  constructor(audioManager, onSaveLoaded = null) {
    this.audio = audioManager;
    this.onSaveLoaded = onSaveLoaded;
    this.isOpen = false;
    this.onClose = null;

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'cloud-save-modal';
    this.container.innerHTML = `
      <div class="cloud-modal-content">
        <div class="cloud-header">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="color:#b71c1c; font-size:1.1rem; font-weight:bold;">SECTOR 09 // QUANTUM CLOUD ARCHIVE</span>
            <span id="cloud-status-badge" class="cloud-badge unconfigured">○ LOCAL ONLY</span>
          </div>
          <button id="cloud-close-btn" class="cloud-btn-close">[ × CLOSE (ESC) ]</button>
        </div>

        <div class="cloud-body">
          <!-- SECTION 1: OPERATOR IDENTITY -->
          <div class="cloud-section">
            <div class="cloud-section-title">01. IDENTITAS OPERATOR (CLOUD ID)</div>
            <p class="cloud-hint">Gunakan Operator ID ini untuk menyimpan dan memuat progres di perangkat lain.</p>
            
            <div class="cloud-grid-2">
              <div>
                <label>OPERATOR ID (KODE UNIK CLOUD):</label>
                <div style="display:flex; gap:6px;">
                  <input type="text" id="cloud-operator-id" class="cloud-input" style="font-weight:bold; letter-spacing:2px; color:#9aa0aa;" />
                  <button id="cloud-btn-copy-id" class="cloud-btn-sm" title="Salin ID">[ SALIN ]</button>
                  <button id="cloud-btn-new-id" class="cloud-btn-sm" title="Buat ID Baru">[ BARU ]</button>
                </div>
              </div>

              <div>
                <label>CALLSIGN / NAMA OPERATOR:</label>
                <div style="display:flex; gap:6px;">
                  <input type="text" id="cloud-operator-name" class="cloud-input" placeholder="e.g. RAINFALL" />
                  <button id="cloud-btn-save-profile" class="cloud-btn-sm">[ SIMPAN ]</button>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 2: CLOUD ACTIONS -->
          <div class="cloud-section">
            <div class="cloud-section-title">02. SINKRONISASI SAVE DATA</div>
            
            <div style="display:flex; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
              <button id="cloud-btn-upload" class="cloud-btn primary">☁ UPLOAD SAVE LOKAL KE CLOUD</button>
              <button id="cloud-btn-download" class="cloud-btn secondary">⤓ LOAD DARI CLOUD (ID INI)</button>
            </div>

            <div style="background:rgba(15,23,42,0.6); padding:10px 14px; border:1px solid #1e293b; border-radius:3px;">
              <label style="margin-bottom:6px; display:block;">ATAU MUAT SAVE DARI OPERATOR ID LAIN:</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="cloud-input-other-id" class="cloud-input" placeholder="Masukkan Operator ID (contoh: OPR-ABC12)" />
                <button id="cloud-btn-load-other" class="cloud-btn" style="flex-shrink:0;">LOAD PROGRES ID INI</button>
              </div>
            </div>

            <div id="cloud-action-status" class="cloud-status-box" style="display:none;"></div>
          </div>

          <!-- SECTION 3: SUPABASE CREDENTIALS CONFIG -->
          <div class="cloud-section">
            <div class="cloud-section-title" style="display:flex; justify-content:space-between; align-items:center;">
              <span>03. KONFIGURASI SUPABASE</span>
              <button id="cloud-toggle-config-btn" class="cloud-btn-text" style="font-size:0.75rem;">[ TAMPILKAN / UBAH KUNCI ]</button>
            </div>
            
            <div id="cloud-config-panel" style="display:none; margin-top:10px;">
              <p class="cloud-hint">
                Masukkan Project URL & Anon Public Key dari Supabase Dashboard (atau atur via file <code>.env</code>).
                Pastikan sudah menjalankan <code>supabase_schema.sql</code> di SQL Editor Supabase.
              </p>

              <div style="margin-bottom:8px;">
                <label>SUPABASE PROJECT URL:</label>
                <input type="text" id="cloud-cfg-url" class="cloud-input" placeholder="https://xxxxxxxx.supabase.co" />
              </div>

              <div style="margin-bottom:10px;">
                <label>SUPABASE ANON PUBLIC KEY:</label>
                <input type="password" id="cloud-cfg-key" class="cloud-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." />
              </div>

              <div style="display:flex; gap:10px;">
                <button id="cloud-btn-test-conn" class="cloud-btn">[ TES KONEKSI ]</button>
                <button id="cloud-btn-save-cfg" class="cloud-btn primary">[ SIMPAN KONFIGURASI ]</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Cache elements
    this.statusBadge = document.getElementById('cloud-status-badge');
    this.closeBtn = document.getElementById('cloud-close-btn');
    this.operatorIdInput = document.getElementById('cloud-operator-id');
    this.operatorNameInput = document.getElementById('cloud-operator-name');
    this.btnCopyId = document.getElementById('cloud-btn-copy-id');
    this.btnNewId = document.getElementById('cloud-btn-new-id');
    this.btnSaveProfile = document.getElementById('cloud-btn-save-profile');

    this.btnUpload = document.getElementById('cloud-btn-upload');
    this.btnDownload = document.getElementById('cloud-btn-download');
    this.inputOtherId = document.getElementById('cloud-input-other-id');
    this.btnLoadOther = document.getElementById('cloud-btn-load-other');
    this.statusBox = document.getElementById('cloud-action-status');

    this.toggleConfigBtn = document.getElementById('cloud-toggle-config-btn');
    this.configPanel = document.getElementById('cloud-config-panel');
    this.cfgUrlInput = document.getElementById('cloud-cfg-url');
    this.cfgKeyInput = document.getElementById('cloud-cfg-key');
    this.btnTestConn = document.getElementById('cloud-btn-test-conn');
    this.btnSaveCfg = document.getElementById('cloud-btn-save-cfg');

    this._bindEvents();
  }

  _bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.hide();
      }
    });

    // Copy ID
    this.btnCopyId.addEventListener('click', () => {
      const id = this.operatorIdInput.value;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(id).then(() => {
          this._showStatus(`Operator ID '${id}' berhasil disalin ke clipboard!`, 'success');
        });
      } else {
        this.operatorIdInput.select();
        document.execCommand('copy');
        this._showStatus(`Operator ID '${id}' disalin!`, 'success');
      }
      if (this.audio) this.audio.playInteractFocus();
    });

    // Generate New ID
    this.btnNewId.addEventListener('click', () => {
      if (confirm('Buat Operator ID baru? (ID lama Anda tidak akan terhapus di cloud jika sudah pernah di-save).')) {
        const newProf = supabaseService.generateNewPlayerId();
        this.operatorIdInput.value = newProf.id;
        this.operatorNameInput.value = newProf.callsign;
        this._showStatus(`Operator ID baru dibuat: ${newProf.id}`, 'info');
        if (this.audio) this.audio.playTerminalBeep(900);
      }
    });

    // Save Profile
    this.btnSaveProfile.addEventListener('click', () => {
      const id = this.operatorIdInput.value.trim().toUpperCase();
      const callsign = this.operatorNameInput.value.trim();
      if (!id) {
        this._showStatus('Operator ID tidak boleh kosong!', 'error');
        return;
      }
      supabaseService.updatePlayerProfile(id, callsign);
      this._showStatus(`Profil diperbarui: ID=${id}, Callsign=${callsign}`, 'success');
      if (this.audio) this.audio.playTerminalBeep(1200);
    });

    // Upload Local Save to Cloud
    this.btnUpload.addEventListener('click', async () => {
      if (!supabaseService.isConfigured()) {
        this._showStatus('Supabase belum dikonfigurasi! Atur URL dan Anon Key di bawah terlebih dahulu.', 'error');
        this.configPanel.style.display = 'block';
        return;
      }

      this._showStatus('Mengupload save data ke Supabase...', 'info');
      this.btnUpload.disabled = true;

      try {
        const res = await SaveManager.syncToCloud();
        if (res.success) {
          const profile = supabaseService.getPlayerProfile();
          this._showStatus(`✓ SUKSES: Progres berhasil di-backup ke Supabase untuk [${profile.id}].`, 'success');
          if (this.audio) this.audio.playNotification();
        } else {
          this._showStatus(`Gagal upload: ${res.error || res.message}`, 'error');
        }
      } catch (e) {
        this._showStatus(`Error upload: ${e.message}`, 'error');
      } finally {
        this.btnUpload.disabled = false;
        this._refreshStatusBadge();
      }
    });

    // Download Save from Cloud (Current ID)
    this.btnDownload.addEventListener('click', async () => {
      await this._loadSaveData(this.operatorIdInput.value);
    });

    // Load from another ID
    this.btnLoadOther.addEventListener('click', async () => {
      const otherId = this.inputOtherId.value.trim().toUpperCase();
      if (!otherId) {
        this._showStatus('Masukkan Operator ID yang ingin dimuat.', 'error');
        return;
      }
      await this._loadSaveData(otherId, true);
    });

    // Toggle Config Panel
    this.toggleConfigBtn.addEventListener('click', () => {
      const isHidden = this.configPanel.style.display === 'none';
      this.configPanel.style.display = isHidden ? 'block' : 'none';
      this.toggleConfigBtn.textContent = isHidden ? '[ SEMBUNYIKAN KUNCI ]' : '[ TAMPILKAN / UBAH KUNCI ]';
    });

    // Test Connection
    this.btnTestConn.addEventListener('click', async () => {
      const url = this.cfgUrlInput.value.trim();
      const key = this.cfgKeyInput.value.trim();
      if (url && key) {
        supabaseService.saveConfig(url, key);
      }
      this._showStatus('Menguji koneksi ke Supabase...', 'info');
      const res = await supabaseService.testConnection();
      this._showStatus(res.message, res.success ? 'success' : 'error');
      this._refreshStatusBadge();
    });

    // Save Config
    this.btnSaveCfg.addEventListener('click', async () => {
      const url = this.cfgUrlInput.value.trim();
      const key = this.cfgKeyInput.value.trim();
      if (!url || !key) {
        this._showStatus('Supabase URL dan Anon Key harus diisi.', 'error');
        return;
      }
      const ok = supabaseService.saveConfig(url, key);
      if (ok) {
        this._showStatus('Konfigurasi Supabase disimpan! Menguji koneksi...', 'info');
        const res = await supabaseService.testConnection();
        this._showStatus(`Konfigurasi disimpan. ${res.message}`, res.success ? 'success' : 'error');
      } else {
        this._showStatus('URL Supabase tidak valid (harus diawali http:// atau https://).', 'error');
      }
      this._refreshStatusBadge();
    });
  }

  async _loadSaveData(targetId, updateActiveProfile = false) {
    if (!supabaseService.isConfigured()) {
      this._showStatus('Supabase belum dikonfigurasi! Atur URL dan Anon Key di bawah terlebih dahulu.', 'error');
      this.configPanel.style.display = 'block';
      return;
    }

    const pid = (targetId || '').trim().toUpperCase();
    if (!pid) {
      this._showStatus('Operator ID tidak valid.', 'error');
      return;
    }

    this._showStatus(`Mengambil save data untuk Operator [${pid}] dari Supabase...`, 'info');

    try {
      const res = await SaveManager.loadFromCloud(pid);
      if (res.success) {
        if (updateActiveProfile) {
          supabaseService.updatePlayerProfile(pid, res.playerName || pid);
          this.operatorIdInput.value = pid;
          this.operatorNameInput.value = res.playerName || '';
        }

        const nightNum = (res.nightIndex || 0) + 1;
        this._showStatus(
          `✓ SUKSES: Progres NIGHT ${nightNum} (${res.playerName || pid}) berhasil dimuat dari Cloud!`,
          'success'
        );

        if (this.audio) this.audio.playNotification();

        if (this.onSaveLoaded) {
          this.onSaveLoaded(res.saveData);
        }
      } else {
        this._showStatus(`Gagal memuat: ${res.message || res.error}`, 'error');
      }
    } catch (e) {
      this._showStatus(`Error saat memuat: ${e.message}`, 'error');
    }
  }

  _showStatus(msg, type = 'info') {
    if (!this.statusBox) return;
    this.statusBox.style.display = 'block';
    this.statusBox.textContent = msg;

    let color = '#9aa0aa';
    let bg = 'rgba(56,189,248,0.1)';
    let border = '#6b7280';

    if (type === 'success') {
      color = '#b0b6bf';
      bg = 'rgba(34,197,94,0.12)';
      border = '#6b7280';
    } else if (type === 'error') {
      color = '#c27b7b';
      bg = 'rgba(239,68,68,0.12)';
      border = '#6b1111';
    }

    this.statusBox.style.color = color;
    this.statusBox.style.background = bg;
    this.statusBox.style.borderColor = border;
  }

  _refreshStatusBadge() {
    if (!this.statusBadge) return;
    if (supabaseService.isConfigured()) {
      if (supabaseService.isConnected) {
        this.statusBadge.className = 'cloud-badge connected';
        this.statusBadge.textContent = '● SUPABASE ONLINE';
      } else {
        this.statusBadge.className = 'cloud-badge ready';
        this.statusBadge.textContent = '● SUPABASE READY';
      }
    } else {
      this.statusBadge.className = 'cloud-badge unconfigured';
      this.statusBadge.textContent = '○ LOCAL ONLY (BELUM SETUP)';
    }
  }

  show() {
    this.isOpen = true;
    this.container.classList.add('active');

    // Populate profile inputs
    const profile = supabaseService.getPlayerProfile();
    this.operatorIdInput.value = profile.id || '';
    this.operatorNameInput.value = profile.callsign || '';

    // Populate credentials
    const cfg = supabaseService.getConfig();
    this.cfgUrlInput.value = cfg.url || '';
    this.cfgKeyInput.value = cfg.anonKey || '';

    this._refreshStatusBadge();

    // Auto-test if credentials exist and hasn't been tested
    if (supabaseService.isConfigured() && !supabaseService.isConnected) {
      supabaseService.testConnection().then(() => this._refreshStatusBadge());
    }
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    if (this.statusBox) this.statusBox.style.display = 'none';
    if (this.onClose) this.onClose();
  }
}
