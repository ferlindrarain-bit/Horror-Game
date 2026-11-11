# THE LAST SIGNAL: REALITY ERROR

> *"The truth is not what you see. The truth is what remains when everything disappears."*

A retro-cyberpunk first-person psychological horror & anomaly surveillance game built with Three.js, Web Audio API, and Vite, featuring persistent cloud saves powered by Supabase.

---

## 🎮 Synopsis

**Tahun 2049.** Setelah bencana elektromagnetik global yang dikenal sebagai *"The Collapse"*, pemerintah membangun jaringan bunker bawah tanah untuk memantau frekuensi residual dan anomali sinyal.

**Sektor 09** adalah fasilitas pemantauan paling rahasia yang terletak 200 meter di bawah tanah. Tiga minggu lalu, kontak terputus setelah transmisi radio misterius pada frekuensi 47.3 Hz. Tim penyelamat yang dikirim tidak pernah kembali.

Anda adalah operator pengganti. Tugas Anda: pulihkan daya listrik, aktifkan jaringan pengawasan CCTV 4-kanal, pantau anomali, selesaikan objektif shift malam, dan ungkap kebenaran di balik kegagalan realitas Sektor 09.

---

## 🛠️ Features

- **Immersive 3D Facility**: 10 area terkoneksi penuh (Security Hub, Main Corridor, Research Lab C, Medical Ward, Electrical Substation, Storage Bay A, Communications Array, Restricted Archive, Underground Elevator, Secret Research Chamber).
- **Cinematic Intro Cutscene**: Backstory naratif dengan typewriter effect dan sound effect prosedural.
- **4-Channel CCTV Surveillance**: Monitor 2x2 grid atau mode kamera fokus penuh dengan pelaporan anomali (humanoid shadow, video glitch, room contradictions).
- **Interactive Terminal**: Antarmuka Sector-OS TTY-01 untuk membuka pintu rahasia, membaca berkas riset, dan verifikasi password.
- **Atmospheric Audio Engine**: 100% audio synthesis menggunakan Web Audio API murni (humming generator, detak jantung, bisikan, radio static, typewriter).
- **Tactical Map (M)**: Blueprint 2D dengan radar scanner dan tracking posisi pemain.
- **Hybrid Cloud Save (Supabase)**: Simpan dan muat progres di perangkat mana pun menggunakan Operator ID unik.

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Mode Development
```bash
npm run dev
```
Buka browser di `http://localhost:3000/`.

### 4. Build untuk Production
```bash
npm run build
```

---

## ☁️ Setup Supabase Cloud Save (Opsional)

1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **SQL Editor** -> jalankan seluruh perintah dari file `supabase_schema.sql`.
3. Salin file `.env.example` menjadi `.env` dan masukkan kredensial:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Atau langsung masukkan kredensial di dalam game lewat menu **[ ☁ CLOUD SAVE // SUPABASE ]**.

---

## 🕹️ Controls

| Tombol | Aksi |
|--------|------|
| **W, A, S, D** | Gerak Pemain |
| **Mouse Look** | Rotasi Kamera (Pointer Lock) |
| **Shift** | Sprint (Memakai Stamina) |
| **E** | Interaksi (Terminal, CCTV, Breaker, Dokumen, Radio) |
| **F** | Toggle Senter |
| **M** | Buka/Tutup Tactical Blueprint Map |
| **Tab / Esc** | Pause Menu & Daftar Objektif Aktif |

---

## 📄 License
Private project / All rights reserved.
