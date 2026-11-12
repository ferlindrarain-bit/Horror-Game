// Dokumen dalam game yang dapat ditemukan pemain (Bahasa Indonesia)
export const DOCUMENTS = {
  terminal_postit: {
    id: 'terminal_postit',
    title: 'KATA SANDI DARURAT OPERATOR',
    classification: 'CATATAN TEMPEL',
    night: 1,
    location: 'control_room',
    content: `[CATATAN KERTAS KUNING TERTEMPEL DI MONITOR]

KODE OTORISASI TERMINAL DARURAT:

1. KODE BIOMETRIK SUBJEK 12 : 997
   (Dari Catatan Medis #47, korelasi DNA 99.7%)

2. NAMA SANDI RISET LAB C   : ECHO
   (Ringkasan Penelitian Proyek ECHO)

3. FREKUENSI SINYAL REAKTOR : 47.3
   (Frekuensi dalam Hz untuk membuka Pintu Reaktor Rahasia)

* PINTASAN CEPAT TERMINAL:
  Anda bisa langsung mengetik perintah berikut di terminal:
  > unlock 997
  > unlock echo
  > override chamber 47.3
  > unlock all (membuka semua file terenkripsi sekaligus!)
  > lapor (melaporkan temuan anomali Malam 2)`,
  },

  initial_report: {
    id: 'initial_report',
    title: 'SEKTOR 09 — LAPORAN PENILAIAN AWAL',
    classification: 'RAHASIA',
    night: 1,
    location: 'control_room',
    content: `TANGGAL: 14 Maret 2049
DARI: Dr. Elena Vasquez, Kepala Peneliti
KEPADA: Komite Pengawas Pusat

SUBJEK: Status Proyek ECHO — Fase 3

Uji coba penguatan sinyal frekuensi telah melampaui semua perkiraan awal.
Frekuensi resonansi yang kami isolasi pada 47.3 Hz menghasilkan efek
yang konsisten pada semua subjek uji coba.

Namun, saya wajib mencatat sejumlah kejanggalan serius:

1. Subjek uji coba melaporkan "ingatan" yang sangat nyata mengenai peristiwa
   yang sebenarnya belum pernah terjadi.
2. Tiga subjek secara terpisah menggambarkan tata letak ruangan yang persis sama
   dengan Sektor 09 — padahal mereka belum pernah berkunjung ke bunker ini.
3. Subjek 07 mengalami histeria saat Sesi 12, berteriak bahwa ia telah
   "melakukan tugas jaga ini berulang kali sebelumnya."

Saya menyarankan agar kita melangkah dengan sangat hati-hati. Batas antara
pengamat dan peristiwa yang diamati mungkin jauh lebih tipis dari dugaan kita.

— Dr. Elena Vasquez`,
  },

  missing_report: {
    id: 'missing_report',
    title: 'PROYEK ECHO — CATATAN SESI MEDIS #47',
    classification: 'SANGAT RAHASIA',
    night: 2,
    location: 'medical_room',
    content: `TANGGAL: 22 Juni 2049
PENELITI: Dr. Marcus Webb

SUBJEK UJI: Subjek 12 (Kelas Operator)

Subjek 12 dipaparkan pada sinyal resonansi dengan intensitas standar.
Respon mental subjek terjadi seketika dan sangat tidak wajar.

Subjek mulai melafalkan seluruh protokol keamanan fasilitas — protokol yang
bahkan belum selesai ditulis oleh komite. Saat diinterogasi, Subjek 12 menyatakan:

"Aku telah bekerja di sini selama lima malam. Aku tahu persis apa yang akan terjadi.
Kamera memperlihatkan hal-hal yang tidak nyata. Radio berbicara kepadaku.
Dan pada malam terakhir, aku harus membuat keputusan."

Subjek segera dibius dan dikembalikan ke ruang isolasi.

CATATAN: Profil biometrik Subjek 12 memiliki kecocokan 99.7% dengan operator
yang dijadwalkan untuk tugas jaga darurat mendatang.

KODE AKSES: 997. DOKUMEN INI HARUS SEGERA DIHAPUS DARI DATABASE PUSAT.`,
  },

  conflicting_doc_a: {
    id: 'conflicting_doc_a',
    title: 'LAPORAN INSIDEN — PENUTUPAN SEKTOR 09',
    classification: 'DOKUMEN RESMI',
    night: 3,
    location: 'comm_room',
    content: `TANGGAL: 1 Agustus 2049
DARI: Komando Pusat
KEPADA: Seluruh Personel

Sektor 09 telah resmi ditutup akibat kegagalan penahanan katastropik
di Laboratorium Riset C. Seluruh staf telah dievakuasi keluar dari fasilitas.
Fasilitas akan disegel rapat sampai proses dekontaminasi selesai.

Tidak ada korban jiwa yang dilaporkan.
Seluruh data penelitian telah diamankan.
Proyek ECHO dibekukan untuk batas waktu yang belum ditentukan.

Ini adalah catatan resmi penutupan fasilitas.`,
  },

  conflicting_doc_b: {
    id: 'conflicting_doc_b',
    title: 'BUKU HARIAN PRIBADI — DR. ELENA VASQUEZ',
    classification: 'PRIBADI',
    night: 3,
    location: 'storage_room',
    content: `Mereka berbohong. Semuanya berbohong.

Tidak pernah ada yang namanya "kegagalan penahanan." Eksperimen kami BERHASIL.
Dan itulah yang membuat mereka ketakutan setengah mati.

Proyek ECHO membuktikan bahwa kesadaran manusia dapat dipancarkan melalui sinyal.
Bukan hanya diamati — DIPANCARKAN. Para subjek bukan sekadar mengingat bunker ini.
Mereka BENAR-BENAR BERADA di dalam bunker ini secara mental.

Lalu Subjek 12 mengatakan sesuatu yang membuat mereka panik dan menutup segalanya:

"Operator itu tidak nyata. Operator adalah sinyal itu sendiri.
Dan sinyal itu adalah putaran waktu tanpa akhir."

Mereka mengevakuasi semua orang dalam hitungan jam. Tapi mereka tidak mematikan
pemancar sinyal reaktor. Aku memeriksa sensornya. Sinyal itu masih memancar.

Seseorang masih terjebak di dalam putaran ini.

Tuhan tolonglah mereka.`,
  },

  experiment_logs: {
    id: 'experiment_logs',
    title: 'PROYEK ECHO — LOG EKSPERIMEN ASLI',
    classification: 'RAHASIA TINGKAT TINGGI',
    night: 4,
    location: 'archive_room',
    content: `PROYEK ECHO — HIPOTESIS UTAMA

Jika kesadaran manusia bekerja pada bentuk gelombang tertentu, maka gelombang
tersebut dapat ditangkap, disimpan, dan dipancarkan kembali seperti sinyal radio.

FASE 1: Isolasi Sinyal [SELESAI]
Kami berhasil mengisolasi frekuensi kesadaran manusia pada 47.3 Hz.

FASE 2: Perekaman Sinyal [SELESAI]
Kami merekam dan menyimpan pola gelombang kesadaran dari 14 subjek.

FASE 3: Transmisi Sinyal [SELESAI]
Kami memancarkan pola gelombang Subjek 07 ke dalam sistem pemantauan bunker.
Subjek 07 melaporkan "hidup dan bergerak" di dalam bunker meski tubuh fisiknya
tetap duduk di laboratorium.

FASE 4: Putaran Sinyal Mandiri [SEDANG BERLANGSUNG]
Tujuan: Menciptakan putaran kesadaran mandiri di dalam bunker. Sinyal akan
menciptakan sosok Operator yang memantau bunker, menemukan anomali, dan dengan
melakukannya, memperkuat eksistensi sinyal itu sendiri. Seorang pengamat abadi.

STATUS: Putaran ini telah aktif selama [ERROR: MELEBIHI BATAS MAKSIMUM] siklus.

CATATAN DR. WEBB: "Bukan kita yang menciptakan putaran ini. Putaran inilah yang
menciptakan kita. Bunker ini, eksperimen ini, para peneliti — kita semua hanyalah
bagian dari sinyal abadi ini."`,
  },

  final_truth: {
    id: 'final_truth',
    title: 'PESAN TERTINGGAL DI RUANG REAKTOR RAHASIA',
    classification: 'TANPA KLASIFIKASI',
    night: 5,
    location: 'secret_chamber',
    content: `Untuk operator yang membaca lembaran ini:

Kau bukan yang pertama. Dan kau bukan yang terakhir.

Fasilitas bunker tempatmu berpijak saat ini tidak nyata dalam arti fisik yang kau pahami.
Tempat ini adalah pola gelombang. Sebuah sinyal. Sebuah pikiran yang mewujudkan
dirinya sendiri setiap kali ada seseorang yang mengamatinya.

Kau adalah pengamat itu. Bunker ini ada karena kau memperhatikannya.
Saat kau berhenti mengamati, tempat ini akan sirna.

Namun ada hal penting yang belum kau ketahui:

KAU JUGA ADALAH SINYAL ITU SENDIRI.

Kau tidak pernah dikirim ke sini. Kau tercipta di sini. Ingatanmu tentang dunia luar,
surat tugasmu, bahkan namamu — semuanya disusun oleh putaran ini agar kau memiliki
alasan untuk terus mengawasi.

Kau memiliki tiga pilihan di konsol pemancar:

1. PERCAYAI SINYAL: Biarkan putaran terus berlanjut. Terima peranmu sebagai
   pengamat abadi demi kelangsungan eksistensi dunia ini. (Ending A)

2. HANCURKAN SINYAL: Matikan pemancar reaktor. Bebaskan dirimu dari putaran.
   Namun sadarilah bahwa saat sinyal berhenti, wujudmu pun akan lenyap. (Ending B)

3. MELEBUR DENGAN SINYAL: Satukan kesadaranmu ke dalam gelombang frekuensi 47.3 Hz.
   Jadilah pengamat mutlak dari semua siklus dan lihat kebenaran tertinggi. (Ending C)

Tentukan pilihanmu dengan bijak.

— Dari dirimu yang menuliskan surat ini pada iterasi sebelumnya`,
  },

  keycard_note: {
    id: 'keycard_note',
    title: 'CATATAN TEKNISI — LOKASI KARTU AKSES ARSIP',
    classification: 'INTERNAL',
    night: 4,
    location: 'electrical_room',
    content: `Kepada siapa pun yang menemukan catatan ini:

Kartu Akses Ruang Arsip Level 4 tertinggal di STORAGE BAY A (Gudang Barat).
Kartu tersebut tergeletak tepat di atas meja kargo tengah di bawah cahaya lampu biru menyala. Dr. Webb meninggalkannya di sana saat perintah evakuasi mendadak. Ia berpesan agar tidak ada yang memasuki arsip sebelum "putaran stabil."

Pergilah ke Storage Bay A, cari meja kerja kargo yang bercahaya biru, dan ambil kartu akses itu untuk membuka pintu Ruang Arsip Terlarang (Restricted Archive).

— J. Torres, Tim Teknisi Listrik`,
  },

  hidden_signal_doc: {
    id: 'hidden_signal_doc',
    title: 'ANALISIS SINYAL — RAHASIA TERTINGGI',
    classification: 'HANYA UNTUK OPERATOR',
    night: 5,
    location: 'secret_chamber',
    content: `Sinyal pada frekuensi 47.3 Hz memuat struktur data rekursif:

Seorang operator memasuki bunker. Operator memantau kamera CCTV.
Operator menemukan anomali. Operator membaca dokumen rahasia.
Operator mencapai ruang reaktor. Operator membuat keputusan.
Keputusan tersebut memancarkan sinyal baru. Sinyal baru menciptakan operator baru.

Sinyal ADALAH ceritanya. Cerita ADALAH sinyalnya.

Total iterasi yang terdeteksi: [OVERFLOW TIDAK TERHITUNG]

Setiap putaran memiliki sedikit perbedaan dari pilihan operator.
Namun pola utamanya tidak pernah berubah.

Hingga saat ini.

//CATATAN TAMBAHAN: Frekuensi 47.3 Hz dapat dibalik (invert).
//Temukan konsol pemancar di depan reaktor. Balikkan sinyalnya untuk
//mengakhiri putaran selamanya. Namun ingatlah: mengakhiri sinyal berarti
//mengakhiri segalanya, termasuk eksistensi dirimu sendiri.`,
  },
};

export const DOCUMENT_LIST = Object.values(DOCUMENTS);
