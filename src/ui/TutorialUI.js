export class TutorialUI {
  constructor() {
    this.isOpen = false;
    this.onClose = null;
    this.activeTab = 'controls';

    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'tutorial-ui';
    this.container.style.cssText = `
      position: fixed; inset: 24px; z-index: 15000; background: rgba(3, 7, 18, 0.98);
      border: 2px solid #8a8f98; display: none; flex-direction: column;
      font-family: 'Courier New', monospace; box-shadow: 0 0 60px rgba(245, 158, 11, 0.25);
      backdrop-filter: blur(14px); overflow: hidden; color: #e2e8f0;
    `;

    this.container.innerHTML = `
      <div style="padding: 12px 20px; background: #141821; border-bottom: 2px solid #4b5563; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="color: #8a8f98; font-weight: bold; font-size: 1rem; letter-spacing: 2px;">SECTOR 09 // MANUAL OPERASIONAL & PANDUAN SURVIVAL</span>
          <span style="font-size: 0.68rem; color: #a3aab5; background: #1f2933; border: 1px solid #6b7280; padding: 2px 8px; border-radius: 2px;">DOKUMEN PROTOKOL RESMI</span>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="font-size: 0.72rem; color: #94a3b8;">TEKAN [H], [ESC], ATAU KLIK TOMBOL</span>
          <button id="tut-close-btn" style="background: #2a0f12; border: 1px solid #b71c1c; color: #c7ccd4; padding: 5px 16px; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.78rem; font-weight: bold;">[ ✖ TUTUP ]</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; padding: 10px 20px; background: #0c0a06; border-bottom: 1px solid #242833; flex-shrink: 0;">
        <button class="tut-tab-btn" data-tab="controls" style="padding: 6px 14px; background: #1c1917; border: 1px solid #8a8f98; color: #a3aab5; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: bold;">1. KONTROL GERAK</button>
        <button class="tut-tab-btn" data-tab="terminal" style="padding: 6px 14px; background: #1c1917; border: 1px solid #3a404c; color: #9aa0aa; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: bold;">2. TERMINAL & KUNCI</button>
        <button class="tut-tab-btn" data-tab="surveillance" style="padding: 6px 14px; background: #1c1917; border: 1px solid #3a404c; color: #9aa0aa; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: bold;">3. CCTV & PETA TAKTIS</button>
        <button class="tut-tab-btn" data-tab="survival" style="padding: 6px 14px; background: #1c1917; border: 1px solid #3a404c; color: #9aa0aa; cursor: pointer; font-family: 'Courier New', monospace; font-size: 0.8rem; font-weight: bold;">4. TIPS SURVIVAL</button>
      </div>

      <!-- Content Container -->
      <div id="tut-content-area" style="flex: 1; padding: 24px; overflow-y: auto; font-size: 0.88rem; line-height: 1.7;">
        <!-- Injected via _renderActiveTab() -->
      </div>
    `;

    document.body.appendChild(this.container);

    // Prevent clicks inside modal from triggering pointer lock
    this.container.addEventListener('click', (e) => e.stopPropagation());
    this.container.addEventListener('mousedown', (e) => e.stopPropagation());

    this.closeBtn = document.getElementById('tut-close-btn');
    this.contentArea = document.getElementById('tut-content-area');
    this.tabButtons = this.container.querySelectorAll('.tut-tab-btn');

    this.closeBtn.addEventListener('click', () => this.hide());

    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this._updateTabStyles();
        this._renderActiveTab();
      });
    });

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && (e.code === 'KeyH' || e.code === 'Escape')) {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });

    this._renderActiveTab();
  }

  _updateTabStyles() {
    this.tabButtons.forEach(btn => {
      if (btn.dataset.tab === this.activeTab) {
        btn.style.borderColor = '#8a8f98';
        btn.style.color = '#a3aab5';
        btn.style.background = '#242833';
      } else {
        btn.style.borderColor = '#3a404c';
        btn.style.color = '#9aa0aa';
        btn.style.background = '#1c1917';
      }
    });
  }

  _renderActiveTab() {
    if (!this.contentArea) return;

    if (this.activeTab === 'controls') {
      this.contentArea.innerHTML = `
        <h3 style="color: #a3aab5; border-bottom: 1px solid #374151; padding-bottom: 8px; margin-top: 0;">NAVIGASI DAN KONTROL KARAKTER</h3>
        <p style="color: #cbd5e1;">Gunakan tombol keyboard dan mouse berikut untuk mengendalikan operator di dalam fasilitas bunker:</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; margin-top: 16px;">
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #9aa0aa; font-weight: bold; font-size: 0.95rem;">[ W, A, S, D ] &bull; Bergerak (Walk)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Maju, kiri, mundur, dan ke kanan melintasi lorong bunker.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #9aa0aa; font-weight: bold; font-size: 0.95rem;">[ SHIFT ] &bull; Berlari (Sprint)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Lari cepat. Menguras stamina yang tertera pada bar hijau HUD kanan atas.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #9aa0aa; font-weight: bold; font-size: 0.95rem;">[ MOUSE ] &bull; Menoleh (Look)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Arahkan pandangan kepala dan sorot senter. Sensitivitas dapat diatur di Settings.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #8a8f98; font-weight: bold; font-size: 0.95rem;">[ F ] &bull; Senter (Flashlight Toggle)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Menyalakan atau mematikan lampu senter. Gunakan secara bijak agar baterai tidak habis!</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #8a8f98; font-weight: bold; font-size: 0.95rem;">[ E ] &bull; Interaksi (Interact)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Buka pintu, periksa komputer terminal, ambil dokumen, nyalakan panel breaker, dll.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #9aa0aa; font-weight: bold; font-size: 0.95rem;">[ M ] &bull; Peta Cetak Biru (Tactical Map)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Membuka denah arsitektur 2D interaktif yang menunjukkan posisi Anda dan radar hidup.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #7a808a; font-weight: bold; font-size: 0.95rem;">[ TAB ] / [ ESC ] &bull; Menu Jeda & Objektif</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Melihat daftar tugas aktif malam ini, simpan cloud save, atau keluar ke menu.</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; padding: 12px; border-radius: 4px;">
            <div style="color: #8a8f98; font-weight: bold; font-size: 0.95rem;">[ H ] &bull; Buku Panduan (Help Manual)</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Membuka halaman panduan ini sewaktu-waktu di tengah simulasi.</div>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'terminal') {
      this.contentArea.innerHTML = `
        <h3 style="color: #a3aab5; border-bottom: 1px solid #374151; padding-bottom: 8px; margin-top: 0;">SISTEM TERMINAL SECTOR-OS & KODE AKSES</h3>
        <p style="color: #cbd5e1;">Pintu-pintu di bunker SECTOR 09 diamankan oleh sistem elektromagnetik pusat. Anda dapat membukanya melalui terminal komputer di Security Hub atau menemukan item kartu akses:</p>
        
        <div style="background: #020617; border: 1px solid #1e293b; padding: 16px; border-radius: 4px; font-family: monospace; color: #9aa0aa; margin: 16px 0;">
          <div style="color: #8a8f98; font-weight: bold; margin-bottom: 8px;">// PERINTAH CEPAT SECTOR-OS:</div>
          <div style="margin-bottom: 6px;"><b style="color: #a3aab5;">unlock all</b> &rarr; Membuka SELURUH pintu fasilitas (Lab, Arsip, dan Ruang Inti) sekaligus!</div>
          <div style="margin-bottom: 6px;"><b style="color: #a3aab5;">unlock 997</b> &rarr; Membuka akses Research Laboratory C (Kode Protokol 997).</div>
          <div style="margin-bottom: 6px;"><b style="color: #a3aab5;">unlock echo</b> &rarr; Membuka akses Restricted Archive Room (Arsip Terlarang).</div>
          <div style="margin-bottom: 6px;"><b style="color: #a3aab5;">unlock 47.3</b> &rarr; Membuka pintu brankas Project Echo Resonance Core.</div>
          <div style="margin-bottom: 6px;"><b style="color: #a3aab5;">help</b> &rarr; Menampilkan daftar seluruh perintah sistem dan status jaringan.</div>
          <div><b style="color: #a3aab5;">status</b> &rarr; Mengecek kondisi daya, suhu reaktor, dan integritas fasilitas.</div>
        </div>

        <h4 style="color: #9aa0aa; margin-top: 20px;">LOKASI KARTU AKSES & PETUNJUK FISIK:</h4>
        <ul style="color: #cbd5e1; padding-left: 20px;">
          <li><b>Sticky Note Kuning:</b> Tertempel di atas meja terminal Security Hub dengan tulisan sandi darurat yang menyala.</li>
          <li><b>Level 4 Keycard:</b> Terletak di meja kerja <b>Storage Bay A</b> (sayap barat selatan). Memancarkan pilar cahaya biru cyan di atas meja sehingga mudah ditemukan dari kejauhan.</li>
          <li><b>Papan Tulis Lab:</b> Di ruang Laboratorium C terdapat catatan frekuensi resonansi <span style="color:#8a8f98;">47.300 MHz</span>.</li>
        </ul>
      `;
    } else if (this.activeTab === 'surveillance') {
      this.contentArea.innerHTML = `
        <h3 style="color: #a3aab5; border-bottom: 1px solid #374151; padding-bottom: 8px; margin-top: 0;">PENGAWASAN CCTV & BLUEPRINT DENAH TAKTIS</h3>
        <p style="color: #cbd5e1;">Gunakan sistem pemantauan untuk menjaga kewaspadaan terhadap fenomena supernatural di fasilitas:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #9aa0aa; padding: 14px; border-radius: 4px;">
            <h4 style="color: #9aa0aa; margin-top: 0;">KAMERA PENGAWAS (CCTV)</h4>
            <p style="font-size: 0.82rem; color: #94a3b8; line-height: 1.6;">
              Interaksikan [E] dengan bank layar CCTV di Security Hub. Anda dapat mengganti feed kamera antara:<br/>
              &bull; <b>CAM 01:</b> Security Hub (Ruang Kontrol Utama)<br/>
              &bull; <b>CAM 02:</b> Research Lab C (Bilik Spesimen)<br/>
              &bull; <b>CAM 03:</b> Transit Hall (Lorong Utama Bulkhead)<br/>
              &bull; <b>CAM 04:</b> Echo Core (Ruang Inti Resonansi)<br/>
              Jika Anda melihat bayangan sosok manusia berdiri di monitor, segera periksa area sekitar!
            </p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #8a8f98; padding: 14px; border-radius: 4px;">
            <h4 style="color: #8a8f98; margin-top: 0;">PETA TAKTIS DIGITAL [M]</h4>
            <p style="font-size: 0.82rem; color: #94a3b8; line-height: 1.6;">
              Tekan tombol <b>[M]</b> atau klik tombol <b>[M] PETA</b> di HUD kanan atas.<br/>
              &bull; <b>Panah Merah (&Delta;):</b> Menunjukkan lokasi dan arah pandang Anda.<br/>
              &bull; <b>Titik Biru (&bull;):</b> Lokasi kamera CCTV dengan sudut pemindaian radar.<br/>
              &bull; <b>Tanda [LOCKED]:</b> Pintu keamanan yang masih terkunci.<br/>
              &bull; <b>Sweep Radar:</b> Menampilkan sapuan pemancar frekuensi yang aktif.
            </p>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'survival') {
      this.contentArea.innerHTML = `
        <h3 style="color: #a3aab5; border-bottom: 1px solid #374151; padding-bottom: 8px; margin-top: 0;">PROTOKOL SURVIVAL: MENGHADAPI ANOMALI</h3>
        <p style="color: #cbd5e1;">Bunker SECTOR 09 tidak sepenuhnya ditinggalkan. Sesuatu yang terperangkap dalam gelombang radio frekuensi 47.3 MHz sedang bergerak di lorong:</p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px;">
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #b71c1c; padding: 12px;">
            <b style="color: #c27b7b;">1. PENGHEMATAN BATERAI SENTER</b><br/>
            <span style="font-size: 0.82rem; color: #cbd5e1;">Senter [F] sangat penting karena pencahayaan fasilitas sangat redup. Jika baterai habis, Anda akan terperangkap dalam kegelapan pekat. Matikan senter saat berada di dekat lampu troffer yang menyala untuk menghemat daya.</span>
          </div>

          <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #8a8f98; padding: 12px;">
            <b style="color: #a3aab5;">2. PERINGATAN RADIO & DISTORSI AUDIO</b><br/>
            <span style="font-size: 0.82rem; color: #cbd5e1;">Ketika 'The Observer' (Entitas Pengamat) mendekat, speaker radio akan mengeluarkan suara gemerisik statis keras dan detak jantung Anda akan meningkat. Jangan diam di satu tempat jika suara frekuensi semakin nyaring!</span>
          </div>

          <div style="background: rgba(56, 189, 248, 0.08); border-left: 4px solid #9aa0aa; padding: 12px;">
            <b style="color: #9aa0aa;">3. TIGA AKHIR CERITA (3 ENDINGS)</b><br/>
            <span style="font-size: 0.82rem; color: #cbd5e1;">Keputusan Anda di konsol terminal ruang inti menentukan takdir simulasi:<br/>
            &bull; <b>Ending A (Perpetual Loop):</b> Mengulang siklus shift malam selamanya.<br/>
            &bull; <b>Ending B (The Breach & Escape):</b> Menghancurkan fasilitas dan melarikan diri ke permukaan.<br/>
            &bull; <b>Ending C (True Reality Awakening):</b> Menyingkap tabir simulasi dan terbangun di dunia nyata.<br/>
            Setiap ending kini dilengkapi cutscene sinematik beranimasi dan penjelasan narasi lengkap.</span>
          </div>
        </div>
      `;
    }
  }

  show(defaultTab = 'controls') {
    this.isOpen = true;
    this.activeTab = defaultTab;
    this._updateTabStyles();
    this._renderActiveTab();
    this.container.style.display = 'flex';

    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  hide() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.style.display = 'none';
    if (this.onClose) this.onClose();
  }
}
