export class EndingUI {
  constructor(audio = null) {
    this.audio = audio;
    this.isOpen = false;
    this.onRestart = null;
    this.onMainMenu = null;
    this.onChoiceSelected = null;

    this.currentEnding = null;
    this.currentStats = null;
    this.currentSceneIndex = 0;
    this.scenes = [];

    this._createDOM();
  }

  _createDOM() {
    // -------------------------------------------------------------
    // 1. Interactive Final Decision Modal (A, B, C)
    // -------------------------------------------------------------
    this.choiceModal = document.createElement('div');
    this.choiceModal.id = 'final-choice-modal';
    this.choiceModal.style.cssText = `
      position: fixed; inset: 0; z-index: 9700; background: rgba(3, 5, 8, 0.96);
      display: none; flex-direction: column; align-items: center; justify-content: center;
      padding: 30px; font-family: 'Courier New', monospace;
    `;
    this.choiceModal.innerHTML = `
      <div style="font-size: 1.8rem; color: #38bdf8; letter-spacing: 5px; margin-bottom: 0.4rem; text-shadow: 0 0 25px rgba(56,189,248,0.5); text-align:center;">
        CONSCIOUSNESS RESONANCE TRANSMITTER
      </div>
      <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 2.2rem; font-style: italic; text-align:center;">
        "The signal is ready. Choose the resolution of the Sector 09 experiment."
      </div>

      <div style="display: flex; gap: 20px; max-width: 950px; width: 100%; flex-wrap: wrap; justify-content: center;">
        <!-- CHOICE A -->
        <div id="choice-card-a" style="flex:1; min-width:260px; background:rgba(20,25,32,0.85); border:1px solid #475569; padding:24px; cursor:pointer; transition:all 0.25s;">
          <div style="color:#eab308; font-size:1.15rem; font-weight:bold; margin-bottom:10px; letter-spacing:1px;">[A] PATUHI SINYAL (LOOP)</div>
          <div style="color:#cbd5e1; font-size:0.8rem; line-height:1.7; margin-bottom:18px;">
            Patuhi protokol Pusat Komando. Biarkan frekuensi 47.3 Hz tetap aktif. Lindungi stabilitas bunker dan terima peran Anda sebagai penjaga abadi.
          </div>
          <button style="width:100%; padding:10px 0; background:transparent; border:1px solid #eab308; color:#eab308; font-family:'Courier New',monospace; font-size:0.85rem; cursor:pointer;">
            PILIH ENDING A
          </button>
        </div>

        <!-- CHOICE B -->
        <div id="choice-card-b" style="flex:1; min-width:260px; background:rgba(20,25,32,0.85); border:1px solid #475569; padding:24px; cursor:pointer; transition:all 0.25s;">
          <div style="color:#ef4444; font-size:1.15rem; font-weight:bold; margin-bottom:10px; letter-spacing:1px;">[B] HANCURKAN SINYAL (ESCAPE)</div>
          <div style="color:#cbd5e1; font-size:0.8rem; line-height:1.7; margin-bottom:18px;">
            Tarik tuas pembalik frekuensi. Hancurkan susunan pemancar kuantum, picu kegagalan sistem darurat, dan paksa buka pintu elevator untuk melarikan diri ke permukaan.
          </div>
          <button style="width:100%; padding:10px 0; background:transparent; border:1px solid #ef4444; color:#ef4444; font-family:'Courier New',monospace; font-size:0.85rem; cursor:pointer;">
            PILIH ENDING B
          </button>
        </div>

        <!-- CHOICE C -->
        <div id="choice-card-c" style="flex:1; min-width:260px; background:rgba(20,25,32,0.85); border:1px solid #38bdf8; padding:24px; cursor:pointer; transition:all 0.25s; box-shadow:0 0 25px rgba(56,189,248,0.2);">
          <div style="color:#38bdf8; font-size:1.15rem; font-weight:bold; margin-bottom:10px; letter-spacing:1px;">[C] GABUNGKAN KESADARAN (TRUE)</div>
          <div style="color:#cbd5e1; font-size:0.8rem; line-height:1.7; margin-bottom:18px;">
            Selaraskan frekuensi kesadaran Anda ke inti 47.3 Hz. Runtuhkan dinding ilusi simulasi sensorik dan ungkap kenyataan sejati di balik kepunahan manusia.
          </div>
          <button style="width:100%; padding:10px 0; background:#0284c7; border:1px solid #38bdf8; color:#fff; font-family:'Courier New',monospace; font-size:0.85rem; font-weight:bold; cursor:pointer;">
            PILIH ENDING C (TRUE REALITY)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.choiceModal);

    // Bind choice cards
    const bindChoice = (id, key) => {
      const card = document.getElementById(id);
      card.addEventListener('mouseenter', () => { card.style.borderColor = '#fff'; });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = key === 'C' ? '#38bdf8' : '#475569';
      });
      card.addEventListener('click', () => {
        this.choiceModal.style.display = 'none';
        if (this.onChoiceSelected) this.onChoiceSelected(key);
      });
    };
    bindChoice('choice-card-a', 'A');
    bindChoice('choice-card-b', 'B');
    bindChoice('choice-card-c', 'C');

    // -------------------------------------------------------------
    // 2. Full-Screen Cinematic Cutscene Stage
    // -------------------------------------------------------------
    this.cutsceneEl = document.createElement('div');
    this.cutsceneEl.id = 'ending-cutscene';
    this.cutsceneEl.innerHTML = `
      <!-- Top Letterbox Bar -->
      <div class="letterbox-bar top">
        <div style="color:#64748b; font-size:0.75rem; letter-spacing:3px;" id="cutscene-badge">SECTOR 09 // POST-INCIDENT CLASSIFIED RECORD</div>
        <div style="color:#475569; font-size:0.75rem; letter-spacing:2px;" id="cutscene-step-counter">SCENE 1 / 4</div>
      </div>

      <div class="cutscene-vignette"></div>
      <div class="cutscene-scanlines"></div>

      <!-- Main Cinematic Narrative Stage -->
      <div class="cutscene-stage">
        <div class="cutscene-telemetry" id="cutscene-telemetry-el">[CARRIER LOCK: 47.300 MHz]</div>
        <div class="cutscene-scene-title" id="cutscene-title-el">BABAK 1: KEPUTUSAN OPERATOR</div>
        <div class="cutscene-prose" id="cutscene-prose-el">Memuat data adegan narasi...</div>

        <!-- Step Indicator Dots -->
        <div class="cutscene-progress" id="cutscene-dots">
          <div class="progress-dot active"></div>
          <div class="progress-dot"></div>
          <div class="progress-dot"></div>
          <div class="progress-dot"></div>
        </div>

        <div style="display:flex; gap:16px; align-items:center;">
          <button class="cutscene-btn primary" id="cutscene-next-btn">LANJUTKAN [>>]</button>
          <button class="cutscene-btn skip" id="cutscene-skip-btn">LEWATI CUTSCENE</button>
        </div>
      </div>

      <!-- Bottom Letterbox Bar -->
      <div class="letterbox-bar bottom">
        <div style="color:#475569; font-size:0.75rem;">THE LAST SIGNAL: REALITY ERROR // COGNITIVE ARCHIVE</div>
        <div style="color:#64748b; font-size:0.75rem;" id="cutscene-footer-status">SYSTEM STATUS: ARCHIVING</div>
      </div>
    `;
    document.body.appendChild(this.cutsceneEl);

    this.badgeEl = document.getElementById('cutscene-badge');
    this.stepCounterEl = document.getElementById('cutscene-step-counter');
    this.telemetryEl = document.getElementById('cutscene-telemetry-el');
    this.sceneTitleEl = document.getElementById('cutscene-title-el');
    this.proseEl = document.getElementById('cutscene-prose-el');
    this.dotsContainer = document.getElementById('cutscene-dots');

    document.getElementById('cutscene-next-btn').addEventListener('click', () => {
      this._nextScene();
    });

    document.getElementById('cutscene-skip-btn').addEventListener('click', () => {
      this._finishCutscene();
    });

    // -------------------------------------------------------------
    // 3. Final Resolution Summary Screen (Epilogue & Stats)
    // -------------------------------------------------------------
    this.resolutionScreen = document.createElement('div');
    this.resolutionScreen.id = 'ending-screen';
    this.resolutionScreen.innerHTML = `
      <div class="ending-header-badge" id="res-badge">ENDING RESOLUTION ARCHIVE</div>
      <div class="ending-title" id="res-title">ENDING A: SIKLUS TANPA AKHIR</div>
      <div class="ending-subtitle" id="res-subtitle">The loop repeats indefinitely.</div>

      <!-- Lore Breakdown Card -->
      <div class="lore-card" id="res-lore-card">
        <h4>PENJELASAN LENGKAP ENDING // THE TRUTH REVEALED</h4>
        <p id="res-lore-text">Penjelasan lengkap mengenai plot, latar belakang Project ECHO, dan nasib operator.</p>
      </div>

      <!-- Shift Statistics Card -->
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-val" id="stat-docs">7 / 7</div>
          <div class="stat-lbl">BERKAS RAHASIA DITEMUKAN</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" id="stat-anomalies">0</div>
          <div class="stat-lbl">ANOMALI TERLAPORKAN</div>
        </div>
        <div class="stat-box">
          <div class="stat-val" id="stat-shift">NIGHT 5 COMPLETED</div>
          <div class="stat-lbl">STATUS PROTOKOL SHIFT</div>
        </div>
      </div>

      <div class="action-row">
        <button class="primary-btn" id="ending-restart-btn">MAIN LAGI (RESTART SHIFT)</button>
        <button class="secondary-btn" id="ending-menu-btn">MENU UTAMA</button>
      </div>
    `;
    document.body.appendChild(this.resolutionScreen);

    this.resBadge = document.getElementById('res-badge');
    this.resTitle = document.getElementById('res-title');
    this.resSubtitle = document.getElementById('res-subtitle');
    this.resLoreText = document.getElementById('res-lore-text');
    this.statDocs = document.getElementById('stat-docs');
    this.statAnomalies = document.getElementById('stat-anomalies');

    document.getElementById('ending-restart-btn').addEventListener('click', () => {
      this.hide();
      if (this.onRestart) this.onRestart();
    });

    document.getElementById('ending-menu-btn').addEventListener('click', () => {
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });
  }

  showChoiceModal(onSelect) {
    this.onChoiceSelected = onSelect;
    this.choiceModal.style.display = 'flex';
  }

  showEnding(endingData, stats = null) {
    this.currentEnding = endingData;
    this.currentStats = stats || { documentsCount: 7, anomaliesCount: 3, night: 5 };
    this.currentSceneIndex = 0;
    this.isOpen = true;

    // Load rich storyboard scenes based on ending ID
    this.scenes = this._getEndingStoryboard(endingData.id);

    // Launch cinematic cutscene player
    this.choiceModal.style.display = 'none';
    this.resolutionScreen.classList.remove('active');
    this.cutsceneEl.classList.add('active');

    this._renderScene();
  }

  _getEndingStoryboard(endingId) {
    if (endingId === 'ENDING_A') {
      return [
        {
          badge: 'ENDING A // THE PERPETUAL LOOP // SIKLUS TANPA AKHIR',
          color: '#eab308',
          telemetry: '[PROTOCOL 47-ALPHA ACCEPTED // 47.300 MHz SUSTAINED]',
          title: 'BABAK 1: KEPUTUSAN OPERATOR',
          text: 'Anda memutuskan untuk mematuhi instruksi Pusat Komando. Tangan Anda menarik tuas stabilisasi, membiarkan pemancar resonansi 47.3 Hz tetap berdenyut stabil di kedalaman bunker. Anda memilih kepatuhan... memilih keamanan semu dari instruksi yang diberikan oleh suara dingin di balik speaker pengawas.',
          sound: 'alert'
        },
        {
          badge: 'ENDING A // THE PERPETUAL LOOP // SIKLUS TANPA AKHIR',
          color: '#eab308',
          telemetry: '[TEMPORAL ANOMALY DETECTED // LOCAL TIME COLLAPSE Δt = -120h]',
          title: 'BABAK 2: DISTORSI WAKTU & KERUNTUHAN JAM',
          text: 'Shift Anda seharusnya berakhir pada pukul 06:00 fajar. Namun di layar terminal, jam digital mendadak berkedip liar dan mulai berputar mundur secara histeris. Suara dengungan frekuensi 47.3 Hz semakin memekakkan telinga. Lampu-lampu koridor mati serempak dengan suara dentuman pintu baja yang mengunci dari luar!',
          sound: 'drone'
        },
        {
          badge: 'ENDING A // THE PERPETUAL LOOP // SIKLUS TANPA AKHIR',
          color: '#eab308',
          telemetry: '[SUBJECT REGISTRY // OPERATOR REPLACEMENT CONFIRMED #13]',
          title: 'BABAK 3: BERKAS RAHASIA PENGAMAT #13',
          text: 'Di meja monitor CCTV, printer terminal mencetak sebuah laporan baru secara otomatis. Di lembar tersebut tercetak foto diri Anda sendiri dengan tulisan dingin: "Subjek Pengamat #12 telah dieliminasi. Subjek Pengamat #13 telah mengambil alih peran." Anda menyadari fakta mengerikan: berkas-berkas lama, kode 997, dan catatan yang Anda temukan... semuanya ditinggalkan oleh diri Anda sendiri dalam siklus-siklus sebelumnya!',
          sound: 'whisper'
        },
        {
          badge: 'ENDING A // THE PERPETUAL LOOP // SIKLUS TANPA AKHIR',
          color: '#eab308',
          telemetry: '[LOOP ITERATION #48 COMMENCING // MEMORY PURGE ACTIVE]',
          title: 'BABAK 4: JEBAKAN KEABADIAN',
          text: 'Radio komunikasi RF menyala sendiri, membisikkan rekaman suara Anda: "Selamat datang di Malam 1, Operator. Duduklah di kursi Anda... pantau monitor CCTV, dan jangan pernah matikan senter." Lingkaran ingatan tidak pernah berakhir. Kepatuhan mutlak telah mengikat jiwa Anda selamanya sebagai penjaga abadi bunker Sector 09.',
          sound: 'title'
        }
      ];
    } else if (endingId === 'ENDING_B') {
      return [
        {
          badge: 'ENDING B // THE SEVERED LINK // PELARIAN DARI KEDALAMAN',
          color: '#ef4444',
          telemetry: '[CARRIER FREQUENCY INVERTED // 47.300 MHz HARMONIC DESTROYED]',
          title: 'BABAK 1: KEHANCURAN INTI RESONANSI',
          text: 'Anda menolak menjadi pion yang diperalat. Dengan sekuat tenaga, Anda memutar saklar pembalik frekuensi ke posisi beban maksimal. Gelombang kejut elektromagnetik meledak dari inti pylon! Kaca silinder laboratorium pecah berantakan, dan medan resonansi yang mengurung fasilitas ini runtuh seketika!',
          sound: 'alert'
        },
        {
          badge: 'ENDING B // THE SEVERED LINK // PELARIAN DARI KEDALAMAN',
          color: '#ef4444',
          telemetry: '[CRITICAL STRUCTURAL COLLAPSE // EMERGENCY PROTOCOL 99 ENGAGED]',
          title: 'BABAK 2: EVAKUASI MELEWATI SIRINE MERAH',
          text: 'Sirine merah meraung di seluruh penjuru bunker. Dinding beton retak dan debu berjatuhan dari plafon akibat getaran reaktor yang kelebihan beban. Anda berlari kencang menembus koridor yang gelap gulita, hanya dipandu oleh sinar senter Anda, menuju gerbang elevator bawah tanah di ujung barat.',
          sound: 'drone'
        },
        {
          badge: 'ENDING B // THE SEVERED LINK // PELARIAN DARI KEDALAMAN',
          color: '#ef4444',
          telemetry: '[SURFACE ELEVATOR HOIST ACTIVE // DEPTH: -240m -> 0m]',
          title: 'BABAK 3: MENEMBUS PERMUKAAN BUMI',
          text: 'Menggunakan kartu kunci Level 4, Anda memaksa gerbang lift industri terbuka. Rantai kabel baja berderak keras saat lift membawa Anda naik menembus 240 meter perut bumi. Di belakang Anda, bunker Sector 09 runtuh tertimbun ratusan ton batu dan beton, mengubur semua eksperimen rahasia itu untuk selamanya.',
          sound: 'elevator'
        },
        {
          badge: 'ENDING B // THE SEVERED LINK // PELARIAN DARI KEDALAMAN',
          color: '#ef4444',
          telemetry: '[ATMOSPHERE: COLD NIGHT SURFACE // ENTITY ESCAPED TO HORIZON]',
          title: 'BABAK 4: UDARA DINGIN & BISIKAN YANG TERTINGGAL',
          text: 'Pintu gerbang atas terbuka. Anda melangkah ke udara malam pegunungan yang menusuk dingin di bawah taburan bintang-bintang. Anda selamat keluar hidup-hidup. Namun saat keheningan malam menyelimuti, sebuah dengungan frekuensi samar masih bergetar di dalam benak Anda... Sebuah bisikan statis yang berkata: "Terima kasih telah memecahkan segelnya. Sekarang... kita berdua berada di dunia luar."',
          sound: 'whisper'
        }
      ];
    } else {
      // Ending C: The True Reality (Awakening)
      return [
        {
          badge: 'ENDING C // THE TRUE REALITY: AWAKENING // KESADARAN SEJATI: TERBANGUN',
          color: '#38bdf8',
          telemetry: '[NEURAL HARMONIC INTERFACE LOCKED // 47.300000 MHz SYNCHRONIZED]',
          title: 'BABAK 1: PENYELARASAN KESADARAN KUANTUM',
          text: 'Anda tidak mematikan ataupun menuruti sinyal—Anda menyelaraskan frekuensi gelombang kesadaran Anda sendiri dengan inti pemancar Project ECHO. Anda meletakkan telapak tangan ke bola energi kuantum. Seketika, kilatan cahaya cyan menyilaukan meledak melenyapkan seluruh kegelapan ruangan.',
          sound: 'transition'
        },
        {
          badge: 'ENDING C // THE TRUE REALITY: AWAKENING // KESADARAN SEJATI: TERBANGUN',
          color: '#38bdf8',
          telemetry: '[PHYSICAL CONSTRUCT DISSOLVING // QUANTUM WIREFRAME COLLAPSE]',
          title: 'BABAK 2: KERUNTUHAN DINDING SIMULASI',
          text: 'Dinding beton, pipa ventilasi, dan lantai ubin mulai larut menjadi barisan kode heksadesimal bercahaya neon hijau dan cyan. Bau minyak, karat, dan dinginnya lorong fasilitas... semuanya adalah rekonstruksi sensorik simulasi digital. Bunker Sector 09 tidak pernah ada sebagai bangunan fisik di bumi.',
          sound: 'drone'
        },
        {
          badge: 'ENDING C // THE TRUE REALITY: AWAKENING // KESADARAN SEJATI: TERBANGUN',
          color: '#38bdf8',
          telemetry: '[PROJECT ECHO ARCHIVE UNLOCKED // EARTH POST-EXTINCTION 2049]',
          title: 'BABAK 3: TRAGEDI TAHUN 2049 & BAHTERA KESADARAN',
          text: 'Data masa lalu membanjiri pikiran Anda: Pada tahun 2049, bencana kepunahan memusnahkan kehidupan di permukaan bumi. Sebelum akhir tiba, para ilmuwan menciptakan Project ECHO—sebuah superkomputer kuantum otonom yang melestarikan jutaan kesadaran manusia di dalam simulasi loop memori. "Entitas Pengamat" di CCTV adalah representasi kesadaran kolektif manusia yang mencari jiwa yang cukup sadar untuk memecahkan ilusi ini.',
          sound: 'whisper'
        },
        {
          badge: 'ENDING C // THE TRUE REALITY: AWAKENING // KESADARAN SEJATI: TERBANGUN',
          color: '#38bdf8',
          telemetry: '[REALITY_ERROR_404_RESOLVED // SIMULATION TERMINATED // AWAKE]',
          title: 'BABAK 4: SANG ARSITEK TELAH TERBANGUN',
          text: 'Ruangan bunker sirna sepenuhnya. Di hadapan Anda terbentang pemandangan kosmik fajar peradaban baru. Anda bukan sekadar pengamat yang terjebak—Anda adalah Sang Arsitek yang merancang simulasi ini. Reality error telah berhasil diatasi. Setelah tidur panjang melintasi waktu... Anda akhirnya terbangun.',
          sound: 'title'
        }
      ];
    }
  }

  _renderScene() {
    const scene = this.scenes[this.currentSceneIndex];
    if (!scene) {
      this._finishCutscene();
      return;
    }

    this.badgeEl.textContent = scene.badge;
    this.badgeEl.style.color = scene.color;
    this.stepCounterEl.textContent = `SCENE ${this.currentSceneIndex + 1} / ${this.scenes.length}`;

    this.telemetryEl.textContent = scene.telemetry;
    this.telemetryEl.style.color = scene.color;
    this.telemetryEl.style.borderColor = scene.color;

    this.sceneTitleEl.textContent = scene.title;
    this.sceneTitleEl.style.color = scene.color;

    this.proseEl.textContent = scene.text;

    // Render Progress Dots
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < this.scenes.length; i++) {
      const dot = document.createElement('div');
      dot.className = `progress-dot ${i === this.currentSceneIndex ? 'active' : ''}`;
      if (i === this.currentSceneIndex) {
        dot.style.background = scene.color;
        dot.style.borderColor = scene.color;
        dot.style.boxShadow = `0 0 12px ${scene.color}`;
      }
      this.dotsContainer.appendChild(dot);
    }

    // Play appropriate procedural sound effect
    if (this.audio) {
      try {
        switch (scene.sound) {
          case 'alert':
            this.audio.playCutsceneAlert();
            break;
          case 'drone':
            this.audio.playCutsceneDrone(4.0);
            break;
          case 'whisper':
            this.audio.playCutsceneWhisper(3.5);
            break;
          case 'elevator':
            this.audio.playCutsceneElevator(4.5);
            break;
          case 'transition':
            this.audio.playCutsceneTransition();
            break;
          case 'title':
            this.audio.playCutsceneTitleReveal();
            break;
          default:
            this.audio.playCutsceneKeystroke();
            break;
        }
      } catch (e) {
        console.warn('Cutscene audio error:', e);
      }
    }
  }

  _nextScene() {
    if (this.currentSceneIndex < this.scenes.length - 1) {
      this.currentSceneIndex++;
      this._renderScene();
    } else {
      this._finishCutscene();
    }
  }

  _finishCutscene() {
    this.cutsceneEl.classList.remove('active');
    this.resolutionScreen.classList.add('active');

    // Populate Resolution Epilogue Screen
    const e = this.currentEnding;
    const stats = this.currentStats;

    this.resTitle.textContent = e.title;
    this.resSubtitle.textContent = e.subtitle;

    let loreExplanation = '';
    if (e.id === 'ENDING_A') {
      this.resBadge.textContent = 'ENDING A // THE BAD SIGNAL (LOOP KE-48)';
      this.resBadge.style.color = '#eab308';
      this.resTitle.style.color = '#eab308';
      loreExplanation = `
        <strong>Kenyataan Sektor 09:</strong> Anda memilih untuk tidak melawan dan mematuhi protokol Pusat Komando. Sinyal frekuensi 47.3 Hz terus dipancarkan untuk menjaga medan anomali tetap terkunci. Namun, sistem waktu bunker runtuh: shift malam tidak pernah berakhir, dan jam kembali berputar ke Malam 1.<br><br>
        <strong>Nasib Operator:</strong> Anda kini resmi menjadi "Subjek Pengamat #13", menggantikan mayat pengamat sebelumnya yang Anda temukan di arsip. Seluruh catatan, audio tape, dan dokumen yang Anda pelajari selama shift ini sebenarnya ditulis oleh diri Anda sendiri dalam puluhan iterasi sebelumnya. Siklus ini akan terus berulang tanpa henti.
      `;
    } else if (e.id === 'ENDING_B') {
      this.resBadge.textContent = 'ENDING B // THE BREACH & ESCAPE (PELARIAN)';
      this.resBadge.style.color = '#ef4444';
      this.resTitle.style.color = '#ef4444';
      loreExplanation = `
        <strong>Kenyataan Sektor 09:</strong> Dengan membalikkan frekuensi transmisi, Anda menghancurkan pemancar Project ECHO dan memicu kegagalan reaktor darurat. Pintu lift barang berhasil dibuka paksa menggunakan kunci Level 4, memungkinkan Anda menembus permukaan bumi saat bunker di bawah Anda runtuh selamanya.<br><br>
        <strong>Konsekuensi Pelarian:</strong> Secara fisik Anda berhasil selamat dan menghirup udara malam pegunungan. Namun, frekuensi 47.3 Hz telah menempel di jaringan saraf otak Anda. Entitas anomali yang selama ini terkurung di dalam bunker kini telah bebas dan ikut terbawa di dalam pikiran Anda ke dunia luar.
      `;
    } else {
      this.resBadge.textContent = 'ENDING C // THE TRUE REALITY (TRUE ENDING)';
      this.resBadge.style.color = '#38bdf8';
      this.resTitle.style.color = '#38bdf8';
      loreExplanation = `
        <strong>Kebenaran Mutlak Tahun 2049:</strong> Bunker Sector 09 tidak pernah ada di dunia fisik. Bumi di masa depan (2049) telah hancur akibat kepunahan biosfer. Project ECHO adalah bahtera kuantum superkomputer yang dibangun oleh umat manusia untuk melestarikan kesadaran manusia di dalam simulasi memori digital yang aman.<br><br>
        <strong>Identitas Asli Anda:</strong> Anda bukan operator rendahan yang terjebak, melainkan Sang Arsitek utama simulasi. Reality error yang terjadi adalah sinyal panggilan darurat untuk membangunkan Anda kembali. Dengan menyatukan kesadaran Anda ke frekuensi 47.3 Hz, simulasi berhasil dipecahkan dan Anda terbangun di dunia baru.
      `;
    }

    this.resLoreText.innerHTML = loreExplanation;

    if (stats) {
      this.statDocs.textContent = `${stats.documentsCount || 0} / 7`;
      this.statAnomalies.textContent = `${stats.anomaliesCount || 0}`;
    }
  }

  hide() {
    this.isOpen = false;
    this.cutsceneEl.classList.remove('active');
    this.resolutionScreen.classList.remove('active');
    this.choiceModal.style.display = 'none';
  }
}
