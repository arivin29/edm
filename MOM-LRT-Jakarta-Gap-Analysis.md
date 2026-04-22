# Minutes of Meeting & Gap Analysis
## DMS untuk LRT Jakarta

**Tanggal Meeting:** 21 April 2026  
**Client:** LRT Jakarta  
**DMS Existing:** M-Files (aktif digunakan)  
**Jumlah User:** ±60 user (concurrent ±10)

---

## 1. Ringkasan Hasil Meeting

| # | Poin | Detail |
|---|------|--------|
| 1 | DMS existing masih aktif | LRT Jakarta sudah menggunakan M-Files dan masih berjalan |
| 2 | Alasan pengadaan baru | Kebutuhan baru yang belum bisa dipenuhi M-Files |
| 3 | Kebutuhan utama baru | Document labeling & classification, Watermark, SLA Management, TTE PSrE |
| 4 | Subject to audit | Seluruh dokumen DMS wajib auditabel, data historis wajib dijaga |
| 5 | Migrasi data | Memungkinkan, tapi tidak boleh mengganggu proses berjalan dan histori tetap bisa diakses |
| 6 | Cakupan pengguna | Seluruh divisi termasuk Direksi (memo anggaran, pengadaan, kontrak, perizinan) |
| 7 | Workflow | Cukup kompleks, berbasis hirarki organisasi |
| 8 | Pain point lisensi | ±60 user, lisensi M-Files mahal → keterbatasan monitoring & transparansi |
| 9 | Infrastruktur | Aplikasi di public cloud, data di DC internal Indonesia, sudah ada DRC |
| 10 | Harapan | Cloud-based, DC Indonesia, environment Dev + Prod minimal |

---

## 2. Detail Kebutuhan Fungsional

### 2.1 Dokumen yang Dikelola
- Memo pengajuan anggaran (pengadaan & non-pengadaan)
- Kontrak
- Perizinan
- Surat masuk / keluar
- Memo menjadi dasar pembuatan PR di IRP (Dynamics 365)

### 2.2 Metadata & Klasifikasi
- Metadata existing sudah cukup kaya
- **Belum ada:** klasifikasi dokumen formal (confidential, internal, public)
- **Belum ada:** labeling & watermark

### 2.3 Versioning
- Semua versi disimpan (bisa >20 versi per dokumen)
- Digunakan untuk troubleshooting approval

### 2.4 Workflow & Approval
- Berbasis hirarki organisasi
- Contoh alur memo pengadaan:
  1. Preparer (admin / staff)
  2. Kepala Divisi
  3. Divisi Finance (Anggaran → Finance → Accounting)
  4. Kepala Divisi Finance
  5. (Jika nilai tertentu) → RIS
  6. Direktur Pemegang Anggaran / Direksi
- Workflow berbeda untuk tiap jenis dokumen
- SOP workflow saat ini berada di Sekretariat/Administrasi, belum sepenuhnya terdokumentasi di sistem

### 2.5 User & Kapasitas
- ±60 user terdaftar
- Lisensi dibatasi → monitoring approval terbatas, transparansi kurang
- Concurrent user rendah (±10)
- **Harapan:** tidak dibatasi per user pada DMS baru

### 2.6 Indexing, Search, dan OCR
- Template indexing cukup banyak (diperkirakan <50)
- Indexing bisa ditambah sesuai kebutuhan (SOP, POM, dll)
- Pencarian: metadata, nomor/nama dokumen, full-text search
- OCR: sudah ada di existing, jarang digunakan, tapi tetap dibutuhkan

### 2.7 Infrastruktur & Environment
| Aspek | Existing | Kebutuhan DMS Baru |
|-------|----------|-------------------|
| Aplikasi | Public cloud | Cloud (open to suggestion) |
| Data | Internal DC | DC wajib di Indonesia |
| Storage | NAS ±60TB (terpakai ±60%) | Sesuai kebutuhan |
| DRC | Sudah ada | Wajib ada |
| Environment | - | Minimal Dev + Prod |

### 2.8 Integrasi & Kebutuhan Tambahan
- **IRP (Dynamics 365):** lampiran dokumen PR
- **TTE:** belum terintegrasi, approval masih kombinasi aplikasi + manual (PDF/Word)
- **SSO:** sudah menggunakan SSO ke Active Directory
- **Kebutuhan ke depan:** TTE PSrE, Label & watermark, SLA Management

---

## 3. Gap Analysis: Kebutuhan vs Modul yang Sudah Dibangun

### 3.1 Modul yang Sudah Ada ✅

| # | Modul | Backend | Frontend | Keterangan |
|---|-------|---------|----------|------------|
| 1 | Manajemen Dokumen | ✅ CRUD, versioning, download, restore | ✅ List, form, detail, preview, file-manager | Lengkap |
| 2 | Workflow & Approval | ✅ CRUD, steps, submit/approve/reject/delegate | ✅ List, form, detail, step-form, card pipeline di Informasi tab | Lengkap + UI card pipeline |
| 3 | Versioning | ✅ Versions endpoint, restore | ✅ Tab Riwayat Versi (timeline, download, restore) | Lengkap |
| 4 | Organisasi | ✅ Company, office, department, section, position CRUD | ✅ Organization list + form | Lengkap |
| 5 | User & RBAC | ✅ Users, roles, permissions, assign | ✅ User list/form, role list/form | Lengkap |
| 6 | Template & Indexing | ✅ Templates + tags + upload/download | ✅ Template list/form/detail | Lengkap |
| 7 | Penomoran Otomatis | ✅ Numbering + preview | ✅ Numbering list/form | Lengkap |
| 8 | Notifikasi | ✅ List, unread, mark read | ✅ Notification list + bell | Lengkap |
| 9 | Audit Trail | ✅ Audit log listing | ✅ Audit log page | Lengkap |
| 10 | Komentar & Review | ✅ Comments + resolve/unresolve | ✅ Di document-detail | Lengkap |
| 11 | Distribusi Dokumen | ✅ Distributions + inbox + acknowledge | ⚠️ Belum ada page | Backend only |
| 12 | OnlyOffice Editor | ✅ Editor config + callback | ⚠️ Belum ada editor component, preview pakai Office Online | Backend lengkap, FE perlu editor |
| 13 | Full-text Search | ✅ Fulltext search migration | ✅ Di document list | Lengkap |
| 14 | Document Classification | ✅ Classification field + filter | ✅ Badge, form dropdown, detail display | Lengkap |
| 15 | Watermark | ✅ PDF/image watermark, per classification | ✅ Watermark config di settings | Lengkap |
| 16 | SLA Management | ✅ SLA rules, tracking, escalation | ✅ SLA config, dashboard dummy | Lengkap |
| 17 | TTE Digital Signature | ✅ Sign, verify, revoke, list | ✅ Tab signatures di document-detail | Lengkap (demo mode) |
| 18 | SSO / Active Directory | ✅ LDAP/SAML scaffolding, demo mode | ✅ SSO toggle login, SSO config settings | Lengkap (demo mode) |
| 19 | OCR | ✅ Tesseract OCR endpoint | ✅ Tab OCR di document-detail | Lengkap |

### 3.2 Modul yang BELUM Ada (Gap) ❌

| # | Kebutuhan | Backend | Frontend | Prioritas | Status |
|---|-----------|---------|----------|-----------|--------|
| 1 | ~~Document Classification & Labeling~~ | ✅ | ✅ | ~~🔴 Tinggi~~ | ✅ **DONE** |
| 2 | ~~Watermark Dokumen~~ | ✅ | ✅ | ~~🔴 Tinggi~~ | ✅ **DONE** |
| 3 | ~~SLA Management~~ | ✅ | ✅ | ~~🔴 Tinggi~~ | ✅ **DONE** |
| 4 | ~~Integrasi TTE PSrE~~ | ✅ | ✅ | ~~🔴 Tinggi~~ | ✅ **DONE** (demo mode, perlu vendor untuk production) |
| 5 | ~~SSO / Active Directory~~ | ✅ | ✅ | ~~🟡 Sedang~~ | ✅ **DONE** (demo mode, perlu akses AD client untuk production) |
| 6 | ~~OCR~~ | ✅ | ✅ | ~~🟡 Sedang~~ | ✅ **DONE** |
| 7 | **Tool Migrasi Data (M-Files)** | ❌ | ❌ | 🟡 Sedang | ⏸️ Ditunda — butuh akses export M-Files dari client |
| 8 | **Distribution Inbox Page** | ✅ | ❌ | 🟡 Sedang | 🔧 FE page belum dibuat |
| 9 | **Dashboard Analytics (real data)** | ⚠️ Partial | ⚠️ Dummy | 🟡 Sedang | 🔧 FE masih dummy data |
| 10 | **Integrasi IRP (Dynamics 365)** | ❌ | ❌ | 🟢 Rendah | ⏸️ Ditunda — butuh API external |

---

## 4. Arsitektur Solusi: Cara Kerja Dokumen di DMS Baru

### 4.1 Perbandingan M-Files vs DMS Baru

| Fitur | M-Files (Existing) | DMS Baru (Ours) |
|-------|--------------------|-----------------| 
| Edit online | MS Office plugin (install di desktop) | OnlyOffice di browser (tanpa install) |
| Template | Copy file template, edit manual | Auto-generate dari parameter/tags |
| Watermark | Manual / plugin | Otomatis berdasarkan classification |
| Versioning | Otomatis saat save | Otomatis + major/minor + lock final |
| TTE | Tidak ada | Terintegrasi PSrE (planned) |
| Lisensi | Per-seat (mahal, terbatas) | Per-organisasi / unlimited user |
| Co-editing | Terbatas | Real-time multi-user (OnlyOffice) |

### 4.2 Tiga Mode Pembuatan & Editing Dokumen

DMS baru mendukung **3 mode** pembuatan dokumen:

**Mode 1: Template + Parameter (Auto-generate)** ✅ Sudah ada
- Admin buat template `.docx` dengan tags/placeholder (`{{nomor_surat}}`, `{{tanggal}}`, `{{nama_divisi}}`)
- User pilih template → isi parameter → sistem generate dokumen otomatis
- Cocok untuk: memo, surat keluar, format standar

**Mode 2: Edit Online via OnlyOffice** ✅ Sudah ada
- User buka dokumen → edit langsung di browser via OnlyOffice
- Save → otomatis jadi versi baru
- Support: Track Changes, Comments, Co-editing real-time
- Cocok untuk: kontrak, dokumen revisi, review dari atasan

**Mode 3: Upload Manual** ✅ Sudah ada
- User upload file dari komputer lokal
- Cocok untuk: dokumen pihak ketiga, scan, perizinan eksternal

### 4.3 Peran OnlyOffice dalam Sistem

OnlyOffice berfungsi sebagai **editor saja** (seperti Google Docs self-hosted). Semua logic bisnis ditangani oleh backend DMS.

**Yang OnlyOffice handle:**

| Fitur | Keterangan |
|-------|------------|
| Edit online di browser | User edit `.docx`, `.xlsx`, `.pptx` langsung |
| Co-editing real-time | Beberapa user edit bersamaan |
| Track Changes | Fitur review seperti di MS Word |
| Comments di dokumen | Komentar langsung di dalam file |
| Save callback | Kirim file hasil edit ke backend DMS |
| Read-only mode | Buka dokumen sebagai view-only (untuk versi final/locked) |
| Document comparison | Bandingkan 2 file (diff antar versi) |
| Permission per user | View / edit / comment only |
| Force save | Backend bisa trigger save kapan saja via API |

**Yang ditangani backend DMS (bukan OnlyOffice):**

| Fitur | Keterangan |
|-------|------------|
| Simpan versi baru | Terima file dari callback → simpan sebagai versi baru |
| Major/minor version | Tentukan v1.1 (minor edit) atau v2.0 (approved/final) |
| Lock dokumen final | Set status FINAL → OnlyOffice dibuka read-only |
| Version history list | Tampilkan daftar semua versi di UI |
| Restore versi lama | Copy file versi lama → jadikan versi baru |
| Change note per versi | Catatan perubahan setiap versi |
| Watermark | Inject watermark saat preview/download |
| TTE / Digital signature | Integrasi ke PSrE provider |
| Notifikasi | Kirim notif ke reviewer setelah edit selesai |

### 4.4 Flow Editing & Versioning

```
User klik "Edit Dokumen"
        │
        ▼
Backend cek: apakah dokumen locked/final?
        │
        ├─ YA → Buka OnlyOffice mode READ-ONLY
        │
        └─ TIDAK → Buka OnlyOffice mode EDIT
                    │
                    ▼
              User edit di browser (OnlyOffice)
                    │
                    ▼
              User selesai (tutup tab / klik save)
                    │
                    ▼
        OnlyOffice kirim CALLBACK ke backend
        (berisi file hasil edit)
                    │
                    ▼
        Backend terima file baru:
          ├─ Simpan sebagai version baru (v1.1, v1.2, ...)
          ├─ Catat: siapa edit, kapan, method: "online_edit"
          ├─ Simpan change note (jika ada)
          └─ Kirim notifikasi ke reviewer (jika dalam workflow)

                    ...

        Direktur klik "Approve"
                    │
                    ▼
        Backend:
          ├─ Set version → v2.0 (major)
          ├─ Set status → FINAL
          ├─ Lock dokumen (tidak bisa edit lagi)
          ├─ Trigger TTE signing (jika enabled)
          └─ Notifikasi ke semua stakeholder
```

### 4.5 Contoh Lifecycle Versioning

```
Dokumen: Memo Pengadaan Server 2026

Version 1.0  ← Draft awal (dari template)
  └─ Created by: Budi (Preparer)
  └─ Method: Template + parameter
  └─ Status: DRAFT

Version 1.1  ← Revisi setelah review
  └─ Modified by: Budi
  └─ Method: Edit online (OnlyOffice)
  └─ Change note: "Perbaikan nominal anggaran"
  └─ Status: DRAFT

Version 1.2  ← Revisi dari reviewer
  └─ Modified by: Siti (Kepala Divisi)
  └─ Method: Edit online
  └─ Change note: "Koreksi nama vendor"
  └─ Status: IN_REVIEW

Version 2.0  ← Approved / Final
  └─ Approved by: Direktur
  └─ Status: FINAL (locked, tidak bisa diedit)
  └─ TTE: Signed via PSrE
```

**Aturan Versioning:**

| Event | Nomor Versi | Keterangan |
|-------|-------------|------------|
| Buat dari template / upload baru | v1.0 | Major pertama |
| Edit online & save | v1.1, v1.2, ... | Minor increment |
| Upload file baru (replace) | v1.x+1 | Minor increment |
| Approved / Final | v2.0 | Major increment, **LOCKED** |
| Reject & revisi ulang | v2.1, v2.2, ... | Minor dari major baru |
| Re-approved | v3.0 | Major increment, **LOCKED** |

**Aturan penting:**
- File asli **selalu disimpan bersih** (tanpa watermark)
- **Semua versi disimpan**, tidak pernah dihapus (audit requirement)
- Versi final di-**lock** (read-only, tidak bisa diedit)
- User bisa **restore** ke versi lama → menjadi versi baru
- **Comparison** antar versi (OnlyOffice document comparison)

### 4.6 Strategi Watermark

Watermark **TIDAK diterapkan ke file asli** yang tersimpan di storage. Watermark hanya di-generate on-the-fly:

| Aksi | Watermark | File |
|------|-----------|------|
| Simpan / edit | ❌ Tanpa watermark | File asli bersih |
| Preview di browser | ✅ Watermark overlay | On-screen overlay |
| Download | ✅ Watermark inject | Copy file + watermark |
| Print | ✅ Watermark otomatis | Copy file + watermark |

**Isi watermark:**
- Classification level: **RAHASIA** / **INTERNAL** / **PUBLIK**
- Nama user yang download/print
- Timestamp download
- Status dokumen: **DRAFT** (jika belum final)

**Konfigurasi per classification:**

| Classification | Watermark Text | Warna | Opacity |
|---------------|----------------|-------|---------|
| RAHASIA | "RAHASIA - {nama_user} - {timestamp}" | Merah | 30% |
| INTERNAL | "INTERNAL - {nama_user}" | Abu-abu | 20% |
| PUBLIK | Tidak ada watermark | - | - |
| DRAFT (semua) | "DRAFT" | Abu-abu | 15% |

---

## 5. Detail Gap & Rekomendasi Solusi

### 5.1 Document Classification & Labeling 🔴
**Kebutuhan:** Klasifikasi dokumen menjadi Confidential, Internal, Public  
**Solusi:**
- Tambah field `classification` (enum) pada model Document
- UI dropdown saat create/edit dokumen
- Badge klasifikasi di list & detail
- Filter berdasarkan klasifikasi
- Access control berbasis klasifikasi (confidential hanya user tertentu)

### 5.2 Watermark Dokumen 🔴
**Kebutuhan:** Watermark otomatis saat preview/download berdasarkan klasifikasi  
**Solusi:**
- Backend: generate watermark on-the-fly saat download/preview (library PDF/image processing)
- File asli tetap bersih di storage
- Watermark berisi: klasifikasi, nama user, timestamp
- Konfigurasi watermark per classification level (lihat tabel 4.6)
- Opsi: watermark on-screen (preview) dan on-download

### 5.3 SLA Management 🔴
**Kebutuhan:** Monitoring durasi approval, eskalasi otomatis  
**Solusi:**
- Tambah field `deadline` / `sla_hours` pada workflow step
- Timer tracking per step instance (mulai saat masuk step, selesai saat action)
- Cron job / scheduler untuk cek SLA breach
- Notifikasi otomatis: reminder sebelum deadline, alert saat breach
- Eskalasi otomatis ke atasan jika SLA terlewat
- Dashboard SLA monitoring (rata-rata waktu per step, breach rate)

### 5.4 Integrasi TTE PSrE 🔴
**Kebutuhan:** Tanda tangan elektronik tersertifikasi untuk approval dokumen  
**Solusi:**
- Integrasi API ke provider PSrE (Privy, VIDA, atau Peruri)
- Flow: user approve → redirect ke provider TTE → callback → update status
- Penyimpanan sertifikat digital per user
- Validasi TTE pada dokumen final
- Audit trail untuk setiap signing event

### 5.5 SSO / Active Directory 🟡
**Kebutuhan:** Login menggunakan SSO ke Active Directory (sudah ada di existing)  
**Solusi:**
- Implementasi LDAP/SAML/OAuth2 authentication
- Mapping AD groups ke roles di DMS
- Auto-provisioning user dari AD
- Fallback ke local login jika AD tidak tersedia

### 5.6 OCR 🟡
**Kebutuhan:** Extract text dari dokumen scan  
**Solusi:**
- Integrasi engine OCR (Tesseract / Google Cloud Vision / AWS Textract)
- Trigger otomatis saat upload dokumen scan (PDF/image)
- Hasil OCR disimpan untuk full-text search
- Opsi manual re-OCR jika kualitas rendah

### 5.7 Tool Migrasi Data 🟡
**Kebutuhan:** Migrasi dokumen dari M-Files tanpa mengganggu operasional  
**Solusi:**
- CLI tool / batch import dari export M-Files
- Mapping metadata M-Files → DMS baru
- Migrasi bertahap per divisi / kategori
- Validasi integritas data post-migrasi
- Dokumen lama tetap accessible selama proses migrasi

### 5.8 Distribution Inbox Page 🟡
**Kebutuhan:** Halaman inbox distribusi dokumen  
**Solusi:**
- Backend sudah siap (endpoint distributions/inbox ada)
- Buat frontend page: inbox list, acknowledge action, filter status

### 5.9 Dashboard Analytics 🟡
**Kebutuhan:** Dashboard dengan data real (bukan dummy)  
**Solusi:**
- Backend endpoint untuk statistik (total dokumen, pending review/approval, selesai per bulan)
- Chart: dokumen per kategori, workflow throughput, SLA compliance
- Widget: tugas menunggu, dokumen terbaru, reminder deadline

### 5.10 Integrasi IRP (Dynamics 365) 🟢
**Kebutuhan:** Lampiran dokumen PR dari DMS ke Dynamics 365  
**Solusi:**
- API integration dengan Dynamics 365
- Push dokumen memo yang sudah approved sebagai lampiran PR
- Webhook / callback untuk status update
- Mapping document type → PR category

---

## 6. Roadmap Pengembangan Detail

### Legenda Status

| Icon | Artinya |
|------|---------|
| ✅ BE | Backend endpoint sudah ada |
| ✅ FE | Frontend page sudah ada |
| 🔧 BE | Backend perlu dibuat/modifikasi |
| 🔧 FE | Frontend perlu dibuat/modifikasi |
| 🔌 EXT | Perlu integrasi sistem external |

---

### Phase 1 — Quick Wins ✅ SELESAI

> Fokus: fitur yang backend sudah ada atau perubahan kecil, sehingga tinggal buat frontend atau tambahan minor.
> 
> **Status: ✅ SELESAI** — Classification, Versioning tab, Workflow UI selesai. Distribution Inbox & OnlyOffice Editor masih outstanding.

#### 1.1 Document Classification & Labeling ✅ DONE
**Prioritas:** 🔴 Tinggi — **SELESAI**

**Implementasi:**
- ✅ BE: Migration kolom `classification` di tabel `documents`
- ✅ BE: Filter `?classification=` di endpoint list
- ✅ FE: Dropdown classification di document form
- ✅ FE: Badge classification di document list + detail
- ✅ FE: Warna & icon per level (Rahasia/Internal/Publik)

#### 1.2 Distribution Inbox Page
**Prioritas:** 🟡 Sedang

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| API | ✅ BE | Sudah ada: `GET /api/v1/distributions/inbox`, `POST .../acknowledge` |
| API SDK | ✅ FE | Sudah ada: `DistributionsService` |
| Page | 🔧 FE | Buat page baru: `pages/distributions/distribution-inbox/` |
| Route | 🔧 FE | Tambah route `/distributions/inbox` di `app.routes.ts` |
| Sidebar | 🔧 FE | Tambah menu "Distribusi" di `menu-config.ts` |
| Detail | 🔧 FE | Buat `distribution-detail` component (lihat dokumen, acknowledge) |

**Angular pages yang perlu dibuat:**
```
pages/distributions/                        → folder baru
pages/distributions/distribution-inbox/     → NEW: list inbox
pages/distributions/distribution-detail/    → NEW: detail + acknowledge
```

#### 1.3 Dashboard Analytics (Real Data)
**Prioritas:** 🟡 Sedang

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/dashboard/stats` |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/dashboard/recent-documents` |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/dashboard/pending-tasks` (atau pakai existing `/workflow/pending-tasks`) |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/dashboard/activity-chart` |
| API SDK | 🔧 FE | Re-generate API SDK setelah backend buat endpoint |
| Page | 🔧 FE | Update `pages/dashboard/dashboard-page/` → ganti dummy data dengan API call |

**Backend endpoint yang perlu dibuat:**
```go
// routes/api.go — tambah group baru
dashboard := api.Group("/dashboard")
{
    dashboard.Get("/stats", dashboardCtrl.GetStats)
    // Response: { total_documents, pending_review, pending_approval, completed_this_month }
    
    dashboard.Get("/recent-documents", dashboardCtrl.GetRecentDocuments)
    // Response: [{ id, title, status, classification, updated_at }]
    
    dashboard.Get("/pending-tasks", dashboardCtrl.GetPendingTasks)
    // Response: [{ id, document_title, type, from_user, created_at }]
    
    dashboard.Get("/activity-chart", dashboardCtrl.GetActivityChart)
    // Response: [{ date, created, approved, rejected }]
}
```

**Angular page yang terdampak:**
```
pages/dashboard/dashboard-page/    → update: ganti dummy → API call
```

#### 1.4 Tab Riwayat Versi (Document Detail) ✅ DONE
**Prioritas:** 🔴 Tinggi — **SELESAI**

**Implementasi:**
- ✅ BE: Semua endpoint versioning (`list`, `upload`, `detail`, `download`, `restore`)
- ✅ FE: Tab "Riwayat Versi" di document-detail dengan `nz-timeline`
- ✅ FE: Setiap versi menampilkan: nomor versi (vX.Y), creator avatar + nama, tanggal, file size, change summary
- ✅ FE: Tombol download per versi → `GET /documents/{id}/versions/{ver}/download`
- ✅ FE: Tombol restore + konfirmasi modal → `POST /documents/{id}/versions/{ver}/restore`
- ✅ FE: Badge "Saat Ini" untuk versi aktif, warna biru highlight

**Yang masih bisa ditambahkan (enhancement):**

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| Upload Versi Baru | Tombol + dialog untuk upload file baru sebagai versi baru (saat ini upload hanya via document form) | 🟡 Sedang |
| Compare Versi | Buka 2 versi side-by-side (butuh OnlyOffice comparison mode) | 🟢 Rendah |
| Change Type Tag | Tampilkan tag `change_type` (edit/revision/restore) per versi | 🟢 Rendah |
| Version Diff | Highlight perbedaan antar versi (text diff) | 🟢 Rendah |

#### 1.5 OnlyOffice Editor Component (Document Detail)
**Prioritas:** 🔴 Tinggi — Backend sudah 100% siap, frontend belum ada editor

**Status saat ini:**
- ✅ BE: `GET /documents/{id}/editor-config` → generate config lengkap (key, mode edit/view, callback URL, user info, customization)
- ✅ BE: `POST /onlyoffice/callback` → handle save callback (status 2 & 6), download & simpan file
- ✅ BE: Auto-detect mode: `edit` (draft/revision + permission) atau `view` (final/locked)
- ✅ BE: Lock tracking: `onlyoffice_lock_by`, `onlyoffice_lock_at`
- ❌ FE: **Tidak ada OnlyOffice editor component** (yang load `new DocsAPI.DocEditor(...)`)
- ❌ FE: **Tidak ada tombol "Edit Dokumen"**
- ❌ FE: Preview saat ini menggunakan **Office Online viewer** (`view.officeapps.live.com`), bukan OnlyOffice

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| API | ✅ BE | `GET /documents/{id}/editor-config` dan `POST /onlyoffice/callback` sudah ada |
| OnlyOffice Server | 🔌 EXT | Pastikan OnlyOffice Document Server sudah running (Docker/installed) |
| JS SDK | 🔧 FE | Install `@onlyoffice/document-editor-angular` atau load script tag OnlyOffice JS API |
| Editor Component | 🔧 FE | **Buat component baru:** `shared/components/onlyoffice-editor/` wrapper untuk `DocsAPI.DocEditor` |
| Tombol Edit | 🔧 FE | Tambah tombol "Edit Dokumen" di document-detail header → buka editor full-page atau modal |
| Tombol View | 🔧 FE | Ganti Office Online viewer di `doc-preview` → gunakan OnlyOffice viewer mode |
| Editor Config | 🔧 FE | Panggil `GET /documents/{id}/editor-config` → pass ke OnlyOffice JS API |
| Auto Version | 🔧 BE | (Enhancement) Setelah OnlyOffice callback save → otomatis buat `DocumentVersion` baru (saat ini hanya save ke DraftFilePath, belum buat version record) |
| Environment | 🔧 FE | Tambah `onlyOfficeUrl` di `environment.ts` (URL ke OnlyOffice Document Server) |

**Angular files yang perlu dibuat:**
```
shared/components/onlyoffice-editor/onlyoffice-editor.component.ts    → NEW: wrapper DocsAPI.DocEditor
shared/components/onlyoffice-editor/onlyoffice-editor.component.html  → NEW: container div
shared/components/onlyoffice-editor/onlyoffice-editor.component.scss  → NEW: full-height styling
pages/documents/document-editor/document-editor.component.ts          → NEW: full-page editor route
```

**Angular pages yang terdampak:**
```
pages/documents/document-detail/document-detail.component.html  → tambah tombol "Edit Dokumen"
pages/documents/document-detail/document-detail.component.ts    → method openEditor()
pages/documents/document-detail/components/doc-preview/         → ganti Office Online → OnlyOffice view mode
app.routes.ts                                                   → tambah route /documents/:id/editor
environments/environment.ts                                     → tambah onlyOfficeUrl
```

**Backend enhancement yang disarankan:**
```
app/services/onlyoffice_service.go  → Update HandleCallback: setelah save file, 
                                       otomatis buat DocumentVersion record (minor increment)
                                       Saat ini hanya save ke DraftFilePath tanpa version record
```

**Contoh flow OnlyOffice di Angular:**
```typescript
// 1. User klik "Edit Dokumen"
openEditor() {
  this.router.navigate(['/documents', this.documentId, 'editor']);
}

// 2. Editor page panggil backend
ngOnInit() {
  this.http.get(`${apiUrl}/documents/${id}/editor-config`).subscribe(config => {
    new DocsAPI.DocEditor('editor-container', {
      document: config.document,       // { fileType, key, title, url }
      documentType: config.documentType,
      editorConfig: config.editorConfig // { callbackUrl, mode, user, lang }
    });
  });
}

// 3. OnlyOffice handle editing
// 4. User close/save → OnlyOffice POST ke /onlyoffice/callback
// 5. Backend save file + buat version record
```

---

### Phase 2 — Core Compliance ✅ SELESAI

> Fokus: fitur compliance yang diminta client (watermark, SLA, OCR). Backend berat, frontend sedang.
> 
> **Status: ✅ SELESAI** — Watermark, SLA management, dan OCR semuanya sudah diimplementasi BE+FE.

#### 2.1 Watermark Dokumen
**Prioritas:** 🔴 Tinggi

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| Backend Lib | 🔧 BE | Install/implement PDF watermark library (Go: `unidoc/unipdf` atau `pdfcpu`) |
| Backend Lib | 🔧 BE | Install/implement image watermark (Go: `disintegration/imaging`) |
| API | 🔧 BE | Modifikasi `GET /api/v1/documents/{id}/download` → inject watermark berdasarkan classification |
| API | 🔧 BE | Modifikasi `GET /api/v1/documents/{id}/versions/{ver}/download` → idem |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/documents/{id}/preview` → preview dengan watermark |
| Config | 🔧 BE | Tambah watermark config di `system_settings` (text, color, opacity per classification) |
| Settings Page | 🔧 FE | Tambah section "Watermark" di `pages/settings/` → konfigurasi per classification |
| Document Detail | 🔧 FE | Update preview component → panggil endpoint preview ber-watermark |

**Angular pages yang terdampak:**
```
pages/documents/document-detail/doc-preview/  → update preview endpoint
pages/settings/settings-list/                 → tambah section watermark config
```

**Backend service yang perlu dibuat:**
```
app/services/watermark_service.go    → NEW: logic inject watermark ke PDF/image
```

#### 2.2 SLA Management
**Prioritas:** 🔴 Tinggi

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| Database | 🔧 BE | Migration: tambah kolom `sla_hours`, `deadline_at` di tabel `workflow_steps` |
| Database | 🔧 BE | Migration: tambah kolom `started_at`, `completed_at`, `is_breached` di `workflow_instances` (step tracking) |
| Model | 🔧 BE | Update model WorkflowStep → tambah SLA fields |
| API | 🔧 BE | Update `POST/PUT /api/v1/workflows/{id}/steps` → terima `sla_hours` |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/sla/dashboard` → SLA statistics |
| API | 🔧 BE | **Buat endpoint baru:** `GET /api/v1/sla/breached` → daftar SLA yang terlewat |
| Scheduler | 🔧 BE | **Buat scheduler/cron job:** cek SLA breach setiap 15 menit |
| Notification | 🔧 BE | Auto-notifikasi: reminder H-1, alert saat breach, eskalasi ke atasan |
| API SDK | 🔧 FE | Re-generate API SDK |
| Workflow Form | 🔧 FE | Update `pages/workflows/workflow-step-form/` → tambah input SLA hours |
| Workflow Detail | 🔧 FE | Update `pages/workflows/workflow-detail/` → tampilkan SLA per step |
| SLA Dashboard | 🔧 FE | **Buat page baru:** `pages/sla/sla-dashboard/` |
| SLA Breached | 🔧 FE | **Buat page baru:** `pages/sla/sla-breached-list/` |
| Route | 🔧 FE | Tambah route `/sla/dashboard` dan `/sla/breached` |
| Sidebar | 🔧 FE | Tambah menu "SLA Monitoring" di `menu-config.ts` |
| Document Detail | 🔧 FE | Tampilkan SLA countdown di workflow status panel |

**Angular pages yang perlu dibuat:**
```
pages/sla/                          → folder baru
pages/sla/sla-dashboard/            → NEW: chart & stats (avg time, breach rate)
pages/sla/sla-breached-list/        → NEW: list dokumen yang breach SLA
```

**Angular pages yang terdampak:**
```
pages/workflows/workflow-detail/     → tambah SLA info per step
pages/workflows/workflow-step-form/  → tambah input SLA hours
pages/documents/document-detail/     → tampilkan SLA countdown
```

**Backend yang perlu dibuat:**
```
app/services/sla_service.go         → NEW: SLA checking logic
app/http/controllers/sla_controller.go → NEW: SLA endpoints
app/jobs/sla_checker_job.go         → NEW: cron job cek breach
```

#### 2.3 OCR Integration
**Prioritas:** 🟡 Sedang

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| Backend Lib | 🔧 BE | Integrasi OCR engine (opsi: Tesseract CLI, Google Cloud Vision API, AWS Textract) |
| API | 🔧 BE | **Buat endpoint baru:** `POST /api/v1/documents/{id}/ocr` → trigger OCR manual |
| Service | 🔧 BE | Auto-trigger OCR saat upload file PDF/image (async job via queue) |
| Database | 🔧 BE | Simpan hasil OCR di `file_storage` atau field baru `ocr_text` |
| Search | 🔧 BE | Index OCR text untuk full-text search |
| Document Detail | 🔧 FE | Tambah tombol "Run OCR" + tampilkan hasil OCR text |
| Settings | 🔧 FE | Konfigurasi OCR provider di settings page |

**Angular pages yang terdampak:**
```
pages/documents/document-detail/    → tambah tab/section OCR result + trigger button
pages/settings/settings-list/       → tambah OCR config
```

**Backend yang perlu dibuat:**
```
app/services/ocr_service.go        → NEW: OCR processing logic
app/jobs/ocr_job.go                → NEW: async OCR via queue
```

---

### Phase 3 — Security & Integration ✅ SELESAI (demo mode)

> Fokus: integrasi sistem external (TTE provider, Active Directory). Perlu koordinasi dengan vendor.
> 
> **Status: ✅ SELESAI (demo mode)** — TTE dan SSO diimplementasi dengan demo/scaffolding mode. Untuk production perlu vendor TTE (Privy/VIDA/Peruri) dan akses AD dari IT LRT Jakarta.

#### 3.1 Integrasi TTE PSrE ✅ DONE (demo mode)
**Prioritas:** 🔴 Tinggi | 🔌 Butuh vendor (Privy / VIDA / Peruri)

**Implementasi:**
- ✅ BE: `tte_service.go` — sign, verify, revoke, list signatures
- ✅ BE: `tte_controller.go` — 5 API endpoints
- ✅ BE: Model `DigitalSignature` dengan hash verification
- ✅ FE: Tab "Tanda Tangan" di document-detail (list, sign button, verify)
- ⚠️ Mode demo: signing menggunakan local hash, bukan provider PSrE
- 🔌 Untuk production: perlu integrasi API Privy/VIDA/Peruri

#### 3.2 SSO / Active Directory ✅ DONE (demo mode)
**Prioritas:** 🟡 Sedang | 🔌 Butuh akses AD client

**Implementasi:**
- ✅ BE: `sso_service.go` — LDAP/SAML/Azure AD scaffolding, demo mode login via local DB
- ✅ BE: SSO endpoints: `POST /auth/sso`, `GET /auth/sso/config`, `GET /auth/sso/status`
- ✅ BE: `GetByPrefix` di SettingRepository untuk SSO config
- ✅ FE: Toggle SSO/Standard di login page, SSO form
- ✅ FE: SSO config section di settings page (provider, LDAP host/port, auto-provision)
- ⚠️ Mode demo: autentikasi menggunakan local DB
- 🔌 Untuk production: perlu akses LDAP/SAML config dari IT LRT Jakarta

---

### Phase 4 — Migration & External System ⏸️ DITUNDA

> Fokus: migrasi data dari M-Files dan integrasi Dynamics 365. Butuh koordinasi dengan IT client.
> 
> **Status: ⏸️ DITUNDA** — Butuh akses export M-Files dan API Dynamics 365 dari client.

#### 4.1 Tool Migrasi Data (M-Files)
**Prioritas:** 🟡 Sedang | 🔌 Butuh akses export M-Files

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| Infra | 🔌 EXT | Dapatkan export data dari M-Files (format, struktur, metadata mapping) |
| CLI Tool | 🔧 BE | Buat CLI migration tool (standalone Go binary) |
| Mapping | 🔧 BE | Mapping metadata M-Files → DMS baru (document type, category, workflow status) |
| Import | 🔧 BE | Batch import: documents, versions, metadata, files |
| Validation | 🔧 BE | Validasi integritas post-migrasi (count, checksum) |
| Report | 🔧 FE | (Opsional) Dashboard migrasi: progress, errors, summary |

**Ini BUKAN fitur di Angular app utama**, melainkan CLI tool terpisah:
```
tools/migration/                    → standalone Go CLI
tools/migration/main.go
tools/migration/mfiles_parser.go    → parse export M-Files
tools/migration/importer.go         → import ke DMS database + storage
tools/migration/validator.go        → validasi integritas
```

#### 4.2 Integrasi IRP (Dynamics 365)
**Prioritas:** 🟢 Rendah | 🔌 Butuh akses API Dynamics 365

| Layer | Status | Yang Perlu Dikerjakan |
|-------|--------|----------------------|
| Infra | 🔌 EXT | Dapatkan API credentials & documentation Dynamics 365 dari IT LRT Jakarta |
| Backend Lib | 🔧 BE | Implementasi Dynamics 365 API client |
| API | 🔧 BE | **Buat endpoint baru:** `POST /api/v1/documents/{id}/push-to-irp` → kirim ke D365 |
| API | 🔧 BE | **Buat endpoint baru:** `POST /api/v1/irp/callback` → status update dari D365 |
| Webhook | 🔧 BE | Auto-push saat dokumen approved (jika tipe = memo pengadaan) |
| Document Detail | 🔧 FE | Tambah tombol "Kirim ke IRP" + status integrasi |
| Settings | 🔧 FE | Konfigurasi IRP/D365 connection di settings page |

**Angular pages yang terdampak:**
```
pages/documents/document-detail/    → tambah tombol + status IRP
pages/settings/settings-list/       → tambah IRP config
```

---

### Ringkasan: Semua Angular Pages yang Perlu Dibuat/Modifikasi

#### Pages BARU yang perlu dibuat:
```
pages/distributions/distribution-inbox/      → Phase 1.2
pages/distributions/distribution-detail/     → Phase 1.2
pages/documents/document-editor/             → Phase 1.5 (OnlyOffice full-page editor)
shared/components/onlyoffice-editor/         → Phase 1.5 (OnlyOffice wrapper component)
pages/sla/sla-dashboard/                     → Phase 2.2
pages/sla/sla-breached-list/                 → Phase 2.2
```

#### Pages EXISTING yang perlu dimodifikasi:
```
pages/documents/document-detail/             → Phase 1.1, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 4.2
  ├─ Tambah tab "Riwayat Versi"              → Phase 1.4 (upload, download, restore per versi)
  ├─ Tambah tombol "Edit Dokumen"            → Phase 1.5 (buka OnlyOffice editor)
  ├─ Tambah badge classification             → Phase 1.1
  └─ Tampilkan SLA countdown                 → Phase 2.2
pages/documents/document-detail/doc-preview/ → Phase 1.5, 2.1 (ganti Office Online → OnlyOffice + watermark)
pages/dashboard/dashboard-page/              → Phase 1.3 (real data)
pages/documents/document-form/               → Phase 1.1 (classification dropdown)
pages/documents/document-list/               → Phase 1.1 (classification badge + filter)
pages/workflows/workflow-detail/             → Phase 2.2 (SLA info)
pages/workflows/workflow-step-form/          → Phase 2.2 (SLA input)
pages/settings/settings-list/                → Phase 2.1, 2.3, 3.1, 3.2, 4.2
pages/profile/profile-page/                  → Phase 3.1 (sertifikat digital)
pages/auth/login.page.ts                     → Phase 3.2 (tombol SSO)
app.routes.ts                                → Phase 1.5 (route /documents/:id/editor)
environments/environment.ts                  → Phase 1.5 (onlyOfficeUrl)
```

#### Routes baru di `app.routes.ts`:
```typescript
// Phase 1.2
{ path: 'distributions', children: [...] }

// Phase 2.2
{ path: 'sla', children: [...] }
```

#### Menu baru di `menu-config.ts`:
```typescript
// Phase 1.2
{ key: 'distributions', label: 'Distribusi', icon: 'send', route: '/distributions/inbox' }

// Phase 2.2
{ key: 'sla', label: 'SLA Monitoring', icon: 'clock', children: [
  { key: 'sla-dashboard', label: 'Dashboard SLA', route: '/sla/dashboard' },
  { key: 'sla-breached', label: 'SLA Terlewat', route: '/sla/breached' }
]}
```

#### Shared components baru:
```
shared/components/classification-badge/     → Phase 1.1
shared/components/onlyoffice-editor/        → Phase 1.5
shared/components/sla-countdown/            → Phase 2.2
shared/components/signature-panel/          → Phase 3.1
```

---

### Ringkasan: Semua Backend Endpoint Baru yang Perlu Dibuat

```
Phase 1.3 — Dashboard
  GET  /api/v1/dashboard/stats
  GET  /api/v1/dashboard/recent-documents
  GET  /api/v1/dashboard/pending-tasks
  GET  /api/v1/dashboard/activity-chart

Phase 2.1 — Watermark
  GET  /api/v1/documents/{id}/preview         (dengan watermark)
  (modifikasi existing download endpoints)

Phase 2.2 — SLA
  GET  /api/v1/sla/dashboard
  GET  /api/v1/sla/breached

Phase 2.3 — OCR
  POST /api/v1/documents/{id}/ocr

Phase 3.1 — TTE
  POST /api/v1/documents/{id}/sign
  POST /api/v1/tte/callback
  GET  /api/v1/documents/{id}/signatures
  POST /api/v1/users/{id}/certificate

Phase 3.2 — SSO
  POST /api/v1/auth/sso
  GET  /api/v1/auth/sso/callback

Phase 4.2 — IRP
  POST /api/v1/documents/{id}/push-to-irp
  POST /api/v1/irp/callback
```

### Strategi: Jika Backend Belum Siap

Untuk setiap phase, jika backend belum siap saat frontend mulai dikerjakan:

| Strategi | Cara |
|----------|------|
| **Mock API** | Buat file JSON mock di `frontend/src/assets/mocks/` → panggil pakai `HttpClient` |
| **Environment flag** | Tambah `useMockApi: true` di `environment.ts` → interceptor return mock data |
| **Interface first** | Definisikan TypeScript interface/model dulu di `pages/xxx/xxx.models.ts` → sesuaikan field dengan rencana API |
| **API SDK placeholder** | Buat service manual di `frontend/src/app/api/manual/` → replace dengan generated SDK saat backend ready |
| **Feature flag** | Sembunyikan menu/tombol fitur yang backend-nya belum ada → tampilkan setelah ready |

Contoh mock service pattern:
```typescript
// pages/sla/sla.service.ts
@Injectable({ providedIn: 'root' })
export class SlaService {
  private http = inject(HttpClient);
  private env = inject(ENVIRONMENT);

  getDashboard() {
    if (this.env.useMockApi) {
      return of(MOCK_SLA_DASHBOARD); // dari file mock lokal
    }
    return this.http.get<SlaDashboard>(`${this.env.apiUrl}/sla/dashboard`);
  }
}
```

---

---

## 6.5 Ringkasan Progress Implementasi

> **Update terakhir:** 23 April 2026

| Phase | Status | Detail |
|-------|--------|--------|
| **Phase 1 — Quick Wins** | ✅ Sebagian besar selesai | Classification ✅, Riwayat Versi ✅, Workflow UI ✅. Outstanding: Distribution Inbox page, OnlyOffice Editor |
| **Phase 2 — Core Compliance** | ✅ Selesai | Watermark ✅, SLA Management ✅, OCR ✅ |
| **Phase 3 — Security & Integration** | ✅ Demo mode | TTE ✅ (demo), SSO ✅ (demo). Butuh vendor untuk production |
| **Phase 4 — Migration & External** | ⏸️ Ditunda | Butuh akses M-Files & Dynamics 365 dari client |

**Workflow improvements (tambahan):**
- ✅ Fix workflow bugs: reorder constraint, IP tracking, delegation table
- ✅ Normalize workflow API data di frontend (flatten nested step.step.name)
- ✅ Action buttons menggunakan `can_approve`/`can_reject` dari API
- ✅ Card pipeline stepper di tab Informasi (horizontal scroll, status colors, icons)
- ✅ Vertical detail stepper di tab Workflow (timeline + action history)
- ✅ Mini stepper di sidebar

**Sisa pekerjaan yang direkomendasikan:**
1. 🔧 Distribution Inbox Page (FE) — backend sudah lengkap
2. 🔧 OnlyOffice Editor Component (FE) — backend sudah lengkap
3. 🔧 Dashboard Analytics — ganti dummy data → real API
4. 🔧 Upload Versi Baru dari tab Riwayat Versi (enhancement)
5. 🔌 Integrasi TTE production (butuh vendor)
6. 🔌 Integrasi SSO production (butuh akses AD)
7. 🔌 Migrasi M-Files (butuh akses client)
8. 🔌 Integrasi IRP Dynamics 365 (butuh API)

---

## 7. Catatan Penting

1. **Lisensi:** Model lisensi DMS baru harus lebih fleksibel dari M-Files (unlimited user atau per-organisasi, bukan per-seat)
2. **Data Historis:** Semua dokumen subject to audit → data historis, versioning, dan audit trail wajib lengkap dan tidak boleh dihapus
3. **Infrastruktur:** Cloud-based dengan DC di Indonesia, DRC wajib, minimal 2 environment (Dev + Prod)
4. **Migrasi:** Harus bertahap dan tidak mengganggu proses berjalan di M-Files
5. **Workflow SOP:** Perlu pendokumentasian SOP workflow dari Sekretariat/Administrasi sebelum implementasi workflow baru
