# RiderCuan — Siap Deploy ke Vercel

## Apa yang diperbaiki dari versi lama

Versi lama memakai **Express server + file SQLite lokal** (`ridercuan.db`). Itu **tidak bisa jalan di Vercel** karena:
- Vercel itu *serverless* — tiap request bisa dieksekusi di instance baru, jadi file SQLite lokal tidak akan tersimpan permanen (data bisa hilang atau error).
- `vercel.json` versi lama mengarah ke folder `/public` yang kosong.

Yang sudah diubah:
1. Backend dipecah jadi **serverless functions** di folder `/api` (tanpa Express, native Vercel Functions) — lebih ringan dan cocok untuk Vercel.
2. Database diganti ke **Postgres (integrasi Neon di Vercel)** memakai driver `@neondatabase/serverless` — persisten, gratis di tier Hobby.
3. `vercel.json` disederhanakan, file statis (`index.html`, `manifest.json`, `sw.js`) dipindah ke root.
4. Filter "transaksi hari ini" sekarang pakai zona waktu Asia/Jakarta (WIB), bukan UTC server.

## Langkah Deploy

### 1. Push ke GitHub
Upload folder ini ke repository GitHub kamu (bisa lewat `git init` + push, atau upload manual di web GitHub).

### 2. Import ke Vercel
- Buka [vercel.com/new](https://vercel.com/new), pilih repo ini, klik **Deploy**.
- Vercel akan otomatis mendeteksi `package.json` dan folder `/api`.

### 3. Tambahkan Database (Neon Postgres)
Di dashboard project Vercel:
- Buka tab **Storage** → **Create Database** → pilih **Neon Postgres** (gratis untuk mulai).
- Setelah dibuat, klik **Connect** ke project ini. Vercel otomatis menambahkan env var `DATABASE_URL` ke project.

### 4. Redeploy
Setelah database ter-connect, klik **Redeploy** sekali (supaya env var `DATABASE_URL` terbaca). Setelah itu aplikasi langsung bisa dipakai — tabel & user demo ("Budi Santoso" / password `demo123`) otomatis dibuat saat pertama kali endpoint API dipanggil.

## Struktur Project
```
├── api/
│   ├── _lib/db.js          → koneksi database & helper bersama
│   ├── login.js            → POST /api/login
│   ├── register.js         → POST /api/register
│   ├── user/[id].js        → GET  /api/user/:id
│   ├── transaction.js      → POST /api/transaction
│   ├── transaction/[id].js → DELETE /api/transaction/:id
│   ├── celengan.js         → POST /api/celengan
│   ├── pakai-servis.js     → POST /api/pakai-servis
│   ├── upgrade-pro.js      → POST /api/upgrade-pro
│   ├── referral.js         → POST /api/referral
│   └── export/[id].js      → GET  /api/export/:id (CSV, khusus PRO)
├── index.html
├── manifest.json
├── sw.js
├── package.json
└── vercel.json
```

## Coba Lokal (opsional)
Butuh Vercel CLI: `npm i -g vercel`, lalu:
```bash
vercel dev
```
Ini butuh env var `DATABASE_URL` juga (jalankan `vercel env pull` setelah database terhubung di dashboard, biar ke-download ke `.env.local`).
