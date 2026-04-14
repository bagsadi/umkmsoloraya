# PANDUAN DEPLOYMENT - Website UMKM Directory
# Dari Emergent Environment ke GitHub + Hosting Sendiri

---

## DAFTAR ISI
1. Persiapan Sebelum Push ke GitHub
2. Setup MongoDB Atlas (Database Cloud)
3. Deploy Backend ke Railway
4. Deploy Frontend ke Vercel
5. Konfigurasi Environment Variables
6. Koneksi Antar Layanan
7. Testing Setelah Deploy
8. Troubleshooting

---

## 1. PERSIAPAN SEBELUM PUSH KE GITHUB

### Struktur Folder yang Di-push
```
umkm-directory/
├── backend/
│   ├── server.py              ← File utama backend
│   ├── requirements-deploy.txt ← Dependencies (GUNAKAN INI, bukan requirements.txt)
│   ├── Procfile               ← Perintah start untuk Railway/Render
│   └── .env.example           ← Template environment variables
├── frontend/
│   ├── src/                   ← Semua source code React
│   ├── public/                ← File statis
│   ├── package.json           ← Dependencies frontend
│   ├── vercel.json            ← Konfigurasi Vercel
│   └── .env.example           ← Template environment variables
├── .gitignore                 ← File yang TIDAK ikut di-push
└── DEPLOYMENT_GUIDE.md        ← File ini
```

### File yang TIDAK BOLEH di-push (sudah diatur di .gitignore)
- `backend/.env` (berisi password & API key)
- `frontend/.env` (berisi URL backend)
- `node_modules/`
- `__pycache__/`

### Langkah Push ke GitHub
```bash
# 1. Buat repo baru di github.com (JANGAN centang "Add README")

# 2. Di terminal/VS Code, masuk ke folder project
cd umkm-directory

# 3. Inisialisasi git
git init

# 4. Tambahkan semua file
git add .

# 5. Commit pertama
git commit -m "Initial commit - UMKM Directory Website"

# 6. Hubungkan ke GitHub (ganti URL dengan repo kamu)
git remote add origin https://github.com/USERNAME/umkm-directory.git

# 7. Push
git push -u origin main
```

---

## 2. SETUP MONGODB ATLAS (Database Cloud Gratis)

MongoDB Atlas menggantikan MongoDB lokal yang ada di Emergent.

### Langkah-langkah:

1. **Buka** [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Daftar/Login** dengan email
3. **Buat Cluster Gratis**:
   - Pilih "M0 Sandbox" (GRATIS, 512MB)
   - Pilih region terdekat (Singapore/Sydney)
   - Klik "Create Cluster"
4. **Buat Database User**:
   - Menu: Database Access → Add New Database User
   - Username: `umkm_admin`
   - Password: buat password kuat (CATAT!)
   - Role: "Read and write to any database"
5. **Whitelist IP**:
   - Menu: Network Access → Add IP Address
   - Klik "Allow Access from Anywhere" (0.0.0.0/0)
   - Ini penting agar Railway/Render bisa konek
6. **Ambil Connection String**:
   - Menu: Database → Connect → Connect your application
   - Pilih Driver: Python, Version: 3.12+
   - Copy connection string, contoh:
   ```
   mongodb+srv://umkm_admin:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **Ganti `PASSWORD` dengan password yang kamu buat di step 4**

### Connection String Final:
```
mongodb+srv://umkm_admin:password_kamu@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
Simpan ini, akan digunakan di step berikutnya.

---

## 3. DEPLOY BACKEND KE RAILWAY

### Kenapa Railway?
- Gratis untuk project kecil (500 jam/bulan)
- Support Python/FastAPI langsung
- Mudah konek ke GitHub

### Langkah-langkah:

1. **Buka** [https://railway.app](https://railway.app)
2. **Login** dengan GitHub
3. **New Project** → "Deploy from GitHub Repo"
4. **Pilih repo** `umkm-directory`
5. **Konfigurasi**:
   - Root Directory: `backend`
   - Start Command: (otomatis dari Procfile)
6. **Set Environment Variables** (di tab Variables):

   | Variable | Nilai |
   |----------|-------|
   | `MONGO_URL` | `mongodb+srv://umkm_admin:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority` |
   | `DB_NAME` | `umkm_database` |
   | `JWT_SECRET` | `buatRandomString64KarakterDisini1234567890abcdef1234567890abcdef` |
   | `ADMIN_EMAIL` | `admin@umkm.com` |
   | `ADMIN_PASSWORD` | `passwordAdminKamu123` |
   | `EMERGENT_LLM_KEY` | `sk-emergent-75b2609Ab6b298925F` |
   | `FRONTEND_URL` | `https://nama-app-kamu.vercel.app` (isi setelah deploy frontend) |
   | `CORS_ORIGINS` | `https://nama-app-kamu.vercel.app` |
   | `PORT` | `8001` |

7. **Deploy** → tunggu hingga status "Active"
8. **Catat URL backend** yang diberikan Railway, contoh:
   ```
   https://umkm-backend-production.up.railway.app
   ```

### Alternatif: Deploy ke Render
1. Buka [https://render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Root Directory: `backend`
4. Runtime: Python 3
5. Build Command: `pip install -r requirements-deploy.txt`
6. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
7. Set environment variables sama seperti Railway

---

## 4. DEPLOY FRONTEND KE VERCEL

### Langkah-langkah:

1. **Buka** [https://vercel.com](https://vercel.com)
2. **Login** dengan GitHub
3. **Import Project** → Pilih repo `umkm-directory`
4. **Konfigurasi**:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `yarn build`
   - Output Directory: `build`
5. **Set Environment Variables**:

   | Variable | Nilai |
   |----------|-------|
   | `REACT_APP_BACKEND_URL` | `https://umkm-backend-production.up.railway.app` (URL dari step 3) |

   **PENTING**: Pastikan URL backend TIDAK diakhiri `/` (slash)

6. **Deploy** → tunggu hingga selesai
7. **Catat URL frontend**, contoh:
   ```
   https://umkm-directory.vercel.app
   ```

---

## 5. KONEKSI ANTAR LAYANAN (WAJIB!)

Setelah kedua service online, kamu HARUS mengupdate URL satu sama lain:

### A. Update FRONTEND_URL di Railway (Backend)
1. Buka Railway → Project → Variables
2. Update `FRONTEND_URL` dengan URL Vercel yang sudah didapat:
   ```
   FRONTEND_URL=https://umkm-directory.vercel.app
   ```
3. Update `CORS_ORIGINS` juga:
   ```
   CORS_ORIGINS=https://umkm-directory.vercel.app
   ```
4. Railway akan auto-redeploy

### B. Pastikan REACT_APP_BACKEND_URL di Vercel
1. Buka Vercel → Project → Settings → Environment Variables
2. Pastikan `REACT_APP_BACKEND_URL` sudah benar mengarah ke Railway
3. Jika diubah, klik "Redeploy" di tab Deployments

### Diagram Koneksi:
```
[Browser/User]
      │
      ▼
[Vercel - Frontend]  ──REACT_APP_BACKEND_URL──►  [Railway - Backend]
(React App)                                       (FastAPI)
                                                      │
                                                      ▼
                                                [MongoDB Atlas]
                                                (Database Cloud)
                                                      │
                                                      ▼
                                            [Emergent Object Storage]
                                            (Penyimpanan Gambar)
```

---

## 6. PERUBAHAN KODE YANG PERLU DIPERHATIKAN

### Yang SUDAH Siap (Tidak Perlu Diubah):
- ✅ `server.py` - sudah membaca semua config dari environment variables
- ✅ Frontend - sudah menggunakan `REACT_APP_BACKEND_URL`
- ✅ CORS - sudah membaca dari `FRONTEND_URL`
- ✅ MongoDB - sudah menggunakan `MONGO_URL` dari env
- ✅ Object Storage - sudah menggunakan `EMERGENT_LLM_KEY`

### Yang PERLU Diperhatikan:
1. **Prefix `/api`**: Di Emergent, Kubernetes menangani routing `/api` → backend.
   Di Railway, backend sudah memiliki prefix `/api` di kode (`APIRouter(prefix="/api")`),
   jadi ini sudah otomatis benar.

2. **Cookie secure flag**: Untuk production HTTPS, ubah di `server.py`:
   ```python
   # Cari baris ini:
   response.set_cookie(key="access_token", ... secure=False ...)
   # Ubah menjadi:
   response.set_cookie(key="access_token", ... secure=True ...)
   ```
   Ini ada 4 tempat (2 di login: access_token & refresh_token).
   Tapi jika tidak diubah, login tetap bisa jalan via Bearer token (localStorage).

3. **Seed data**: Pertama kali backend jalan, otomatis akan:
   - Membuat admin user (dari ADMIN_EMAIL & ADMIN_PASSWORD)
   - Membuat 12 data demo UMKM
   - Ini hanya terjadi sekali (cek apakah data sudah ada)

---

## 7. TESTING SETELAH DEPLOY

### Checklist Test:

1. **Buka frontend URL** di browser
   - [ ] Homepage tampil dengan hero, kategori, featured UMKM
   - [ ] Navigasi ke "Daftar UMKM" berfungsi
   - [ ] Search dan filter berfungsi

2. **Test Login**
   - [ ] Buka /login
   - [ ] Masuk dengan email & password admin
   - [ ] Redirect ke dashboard

3. **Test Dashboard**
   - [ ] Stats cards tampil (Total UMKM, dll)
   - [ ] Tabel UMKM terisi data
   - [ ] Tambah UMKM baru berfungsi
   - [ ] Edit UMKM berfungsi
   - [ ] Hapus UMKM berfungsi

4. **Test API Langsung** (opsional, via terminal):
   ```bash
   # Ganti URL dengan backend Railway kamu
   curl https://umkm-backend.up.railway.app/api/umkm
   curl -X POST https://umkm-backend.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@umkm.com","password":"passwordAdminKamu123"}'
   ```

---

## 8. TROUBLESHOOTING

### Frontend Blank / Error
- Cek browser Console (F12 → Console)
- Pastikan `REACT_APP_BACKEND_URL` sudah benar di Vercel
- Pastikan backend sudah running di Railway

### Login Gagal / 401 Error
- Cek apakah admin sudah ter-seed (lihat log backend di Railway)
- Pastikan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di Railway benar
- Cek CORS: `FRONTEND_URL` harus sama persis dengan URL Vercel

### Data Tidak Muncul / 500 Error
- Cek log backend di Railway
- Pastikan `MONGO_URL` benar dan password tidak mengandung karakter spesial tanpa encoding
- Pastikan IP whitelist di MongoDB Atlas sudah "Allow All" (0.0.0.0/0)

### Upload Gambar Gagal
- Pastikan `EMERGENT_LLM_KEY` sudah diset di Railway
- Key ini digunakan untuk Emergent Object Storage

### CORS Error di Browser
- Pastikan `FRONTEND_URL` di Railway = URL Vercel (tanpa trailing slash)
- Pastikan `CORS_ORIGINS` juga diset sama

---

## RINGKASAN BIAYA

| Layanan | Plan | Biaya |
|---------|------|-------|
| MongoDB Atlas | M0 Sandbox | GRATIS (512MB) |
| Railway | Hobby | GRATIS (500 jam/bulan) |
| Vercel | Hobby | GRATIS |
| Emergent Object Storage | Included | Dari EMERGENT_LLM_KEY |
| **TOTAL** | | **GRATIS** |

---

## BANTUAN

Jika ada masalah:
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- MongoDB Atlas docs: https://www.mongodb.com/docs/atlas
- Emergent support: support@emergent.sh
