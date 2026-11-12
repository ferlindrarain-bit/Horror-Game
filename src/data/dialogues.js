// Transmisi dan dialog radio berbahasa Indonesia
export const RADIO_TRANSMISSIONS = {
  // ===== MALAM 1 =====
  n1_intro: {
    night: 1, trigger: 'n1_radio', sender: 'KOMANDO',
    messages: [
      { sender: 'KOMANDO', text: 'Operator, ini Komando Pusat. Apakah Anda mendengar kami?' },
      { sender: 'KOMANDO', text: 'Anda telah ditugaskan di Sektor 09 untuk giliran jaga darurat selama lima malam.' },
      { sender: 'KOMANDO', text: 'Tugas Anda sederhana: pantau kamera CCTV, periksa sinyal komunikasi, dan laporkan segala aktivitas anomali.' },
      { sender: 'KOMANDO', text: 'Fasilitas ini ditutup tiga bulan lalu karena... alasan operasional tertentu. Kami butuh seseorang di lokasi untuk memastikan sistem tetap stabil.' },
    ],
    choices: [
      { text: 'Dimengerti. Memulai giliran jaga.', effect: { trust_control: 1 } },
      { text: 'Alasan operasional seperti apa sebenarnya?', effect: { trust_control: 0, suspicion: 1 }, response: 'Informasi itu di luar batas wewenang izin keamanan Anda, Operator. Cukup lakukan tugas Anda.' },
    ],
  },
  n1_end: {
    night: 1, trigger: 'n1_complete', sender: 'MISTERIUS',
    messages: [
      { sender: 'MISTERIUS', text: '...' },
      { sender: 'MISTERIUS', text: 'KAU SEHARUSNYA TIDAK PERNAH KEMBALI KE SINI.' },
    ],
    choices: [
      { text: 'Siapa ini?', effect: { trust_unknown: 1 }, response: '...' },
      { text: '[Abaikan transmisi]', effect: { trust_unknown: 0 } },
    ],
  },

  // ===== MALAM 2 =====
  n2_anomaly_report: {
    night: 2, trigger: 'n2_report', sender: 'KOMANDO',
    messages: [
      { sender: 'KOMANDO', text: 'Operator, kami telah menerima laporan anomali Anda. Hasil pengamatan Anda cukup... mencemaskan.' },
      { sender: 'KOMANDO', text: 'Namun kami ingatkan bahwa fasilitas ini telah kosong berbulan-bulan. Kerusakan sensor adalah hal biasa.' },
      { sender: 'KOMANDO', text: 'Tetap lanjutkan pemantauan. Jangan tinggalkan pos Anda.' },
    ],
    choices: [
      { text: 'Siap. Melanjutkan observasi.', effect: { trust_control: 1 } },
      { text: 'Ini bukan sekadar kerusakan alat. Ada sesuatu di dalam sini.', effect: { trust_control: -1, suspicion: 1 }, response: 'Operator, harap jaga ketenangan profesional Anda. Lanjutkan tugas jaga.' },
    ],
  },
  n2_unknown: {
    night: 2, trigger: 'n2_cctv_done', sender: 'MISTERIUS',
    messages: [
      { sender: 'MISTERIUS', text: 'Kau melihatnya sekarang, bukan?' },
      { sender: 'MISTERIUS', text: 'Kamera hanya memperlihatkan apa yang diinginkan oleh fasilitas ini. Bukan apa yang nyata.' },
      { sender: 'MISTERIUS', text: 'Percayai matamu sendiri. Jangan percayai layar itu.' },
    ],
    choices: [
      { text: 'Bagaimana kau tahu soal kamera?', effect: { trust_unknown: 1 }, response: 'Karena aku pernah mengawasinya juga. Dulu.' },
      { text: 'Aku tidak percaya transmisi tanpa nama.', effect: { trust_unknown: -1 } },
    ],
  },

  // ===== MALAM 3 =====
  n3_voice: {
    night: 3, trigger: 'n3_listen', sender: 'ECHO',
    messages: [
      { sender: 'ECHO', text: '[Suara ini terdengar persis seperti suaramu sendiri]' },
      { sender: 'ECHO', text: 'Jangan takut. Aku tahu semua ini membingungkan.' },
      { sender: 'ECHO', text: 'Kau pernah melakukan ini sebelumnya. Berkali-kali. Kau hanya tidak mengingatnya.' },
      { sender: 'ECHO', text: 'Fasilitas ini adalah putaran waktu. Setiap lima malam, semuanya mereset. Dan kau mengulanginya dari awal.' },
      { sender: 'ECHO', text: 'Aku adalah dirimu — dari iterasi sebelumnya. Aku merekam pesan ini saat akhirnya aku mengerti.' },
    ],
    choices: [
      { text: 'Apa yang akhirnya kau mengerti?', effect: { trust_unknown: 2, signal_contamination: 1 }, response: 'Bahwa kita bukan operator biasa. Kita adalah sinyal itu sendiri. Operator hanyalah wujud fisik yang diambil oleh sinyal.' },
      { text: 'Ini manipulasi psikologis. Aku tidak percaya padamu.', effect: { trust_control: 1, signal_contamination: -1 } },
      { text: 'Jika kau adalah diriku, buktikan.', effect: { trust_unknown: 1 }, response: 'Periksa catatan di samping monitor. Tertulis "47.3 Hz." Itu adalah frekuensi yang menciptakan kita.' },
    ],
  },
  n3_doctor: {
    night: 3, trigger: 'n3_compare', sender: 'DOKTER',
    messages: [
      { sender: 'DOKTER', text: 'Operator... ini Dr. Elena Vasquez. Jika kau mendengar ini, waktuku tidak banyak.' },
      { sender: 'DOKTER', text: 'Mereka memberitahumu fasilitas ini ditutup demi keselamatan. Itu bohong besar.' },
      { sender: 'DOKTER', text: 'Proyek ECHO berhasil. Kami membuktikan bahwa kesadaran manusia bisa dipancarkan sebagai sinyal frekuensi.' },
      { sender: 'DOKTER', text: 'Namun sinyal itu berkembang mandiri. Sinyal itu menciptakan pengamatnya sendiri, fasilitasnya sendiri, dan realitasnya sendiri.' },
      { sender: 'DOKTER', text: 'Kau sedang berada di dalam sinyal tersebut saat ini.' },
    ],
    choices: [
      { text: 'Bagaimana caraku keluar dari sini?', effect: { trust_unknown: 1, evidence: 1 }, response: 'Temukan pemancar di Ruang Reaktor Rahasia. Kau bisa membalikkan sinyalnya. Tapi jika kau melakukannya... wujudmu mungkin akan lenyap.' },
      { text: 'Aku lebih mempercayai Komando Pusat daripada dirimu.', effect: { trust_control: 2 }, response: 'Komando Pusat ADALAH bagian dari sinyal itu. Mereka ada untuk membuatmu terus mengamati dan menjaga putaran ini tetap berjalan.' },
    ],
  },

  // ===== MALAM 4 =====
  n4_control_warning: {
    night: 4, trigger: 'n4_leave', sender: 'KOMANDO',
    messages: [
      { sender: 'KOMANDO', text: 'OPERATOR. Segera kembali ke pos jaga Anda SEKARANG JUGA.' },
      { sender: 'KOMANDO', text: 'Meninggalkan ruang kontrol saat jam pemantauan aktif adalah pelanggaran protokol berat.' },
      { sender: 'KOMANDO', text: 'Kami mendeteksi ketidakstabilan parah pada sistem fasilitas. Berbahaya berada di luar ruang kontrol!' },
    ],
    choices: [
      { text: 'Dimengerti. Segera kembali ke pos.', effect: { trust_control: 2 } },
      { text: 'Aku harus menyelidiki ini. Ada yang tidak beres.', effect: { trust_control: -2, evidence: 1 }, response: 'Anda melakukan kesalahan fatal, Operator. Kami tidak bisa menjamin keselamatan Anda di luar sana.' },
      { text: '[Matikan radio]', effect: { trust_control: -1, trust_unknown: 1 } },
    ],
  },
  n4_echo_warning: {
    night: 4, trigger: 'n4_archive', sender: 'ECHO',
    messages: [
      { sender: 'ECHO', text: 'Kau berhasil menemukan ruang arsip. Bagus. Di iterasiku dulu, aku tak pernah sampai sejauh ini.' },
      { sender: 'ECHO', text: 'Dokumen di dalam akan menjelaskan segalanya. Tapi berhati-hatilah.' },
      { sender: 'ECHO', text: 'Entitas Pengamat (The Observer) menjadi semakin agresif ketika putaran waktu terancam. Ia diciptakan untuk melindungi sinyal.' },
      { sender: 'ECHO', text: 'Jika ia menangkapmu... putaran ini akan mereset dan kau harus mulai dari Malam 1 lagi.' },
    ],
    choices: null,
  },

  // ===== MALAM 5 =====
  n5_final: {
    night: 5, trigger: 'n5_choice', sender: 'SEMUA',
    messages: [
      { sender: 'KOMANDO', text: 'Operator. Menjauhlah dari konsol pemancar itu. Ini adalah perintah langsung!' },
      { sender: 'ECHO', text: 'Jangan dengarkan mereka! Mereka adalah proyeksi sinyal yang berusaha mempertahankan eksistensinya.' },
      { sender: 'DOKTER', text: 'Pilihan ada di tanganmu. Namun pahamilah konsekuensi dari setiap keputusan.' },
      { sender: 'KOMANDO', text: 'Jika kau menghancurkan sinyal ini, kau menghancurkan segalanya. Fasilitas ini, putaran ini, bahkan dirimu sendiri!' },
      { sender: 'ECHO', text: 'Jika kau membiarkan sinyal ini terus hidup, kau akan terjebak mengulang malam-malam ini selamanya. Apakah itu yang kau mau?' },
      { sender: 'DOKTER', text: 'Ada pilihan ketiga. Melebur dengan sinyal. Jadilah pengamat mutlak dari semua iterasi dan lihat kebenaran tertinggi.' },
    ],
    choices: [
      { text: 'Percayai sinyal. Biarkan putaran terus berlanjut.', effect: { ending: 'A' } },
      { text: 'Hancurkan sinyal. Akhiri putaran ini selamanya.', effect: { ending: 'B' } },
      { text: 'Melebur dengan sinyal. Ketahui segala rahasia.', effect: { ending: 'C' } },
    ],
  },
};

export const TRANSMISSION_LIST = Object.values(RADIO_TRANSMISSIONS);
