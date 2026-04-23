# Panduan Pengguna — DMS PT Askara Internal

**Document Management System (DMS)**
Versi: 1.0 | Terakhir diperbarui: Juli 2025

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Memulai Aplikasi](#2-memulai-aplikasi)
3. [Dashboard](#3-dashboard)
4. [Distribusi Masuk](#4-distribusi-masuk)
5. [Manajemen Dokumen](#5-manajemen-dokumen)
6. [Master Data](#6-master-data)
7. [Workflow & Penomoran](#7-workflow--penomoran)
8. [Organisasi](#8-organisasi)
9. [Manajemen Akses](#9-manajemen-akses)
10. [SLA Monitoring](#10-sla-monitoring)
11. [Pengaturan Sistem](#11-pengaturan-sistem)
12. [Audit Log](#12-audit-log)
13. [Notifikasi](#13-notifikasi)
14. [Profil Pengguna](#14-profil-pengguna)
15. [Pencarian Global](#15-pencarian-global)
16. [Peran & Hak Akses](#16-peran--hak-akses)
17. [Lampiran: Daftar Permission](#lampiran-daftar-permission)

---

## 1. Pendahuluan

### 1.1 Tentang Aplikasi

DMS (Document Management System) PT Askara Internal adalah platform pengelolaan dokumen terpadu yang dirancang untuk menggantikan sistem pengelolaan dokumen konvensional. Sistem ini menyediakan fitur lengkap mulai dari pembuatan dokumen berbasis template, alur persetujuan (workflow), penyimpanan terpusat, tanda tangan elektronik (TTE), hingga audit trail.

### 1.2 Tujuan

- Menyediakan **satu platform** untuk seluruh siklus hidup dokumen (create → review → approve → distribute → archive)
- Menghilangkan ketergantungan pada sistem pihak ketiga berlisensi mahal
- Mendukung kolaborasi real-time melalui editor dokumen terintegrasi (OnlyOffice)
- Menjamin keamanan dan ketertelusuran melalui audit log dan kontrol akses berbasis peran

### 1.3 Teknologi Utama

| Komponen | Teknologi |
|---|---|
| Frontend | Angular 19 + ng-zorro-antd |
| Backend | Go (Goravel Framework) |
| Database | PostgreSQL |
| Editor Dokumen | OnlyOffice Document Server |
| OCR | Tesseract (Indonesia + Inggris) |
| Tanda Tangan | TTE Internal (SHA-256) |
| Autentikasi | JWT + SSO/LDAP |

### 1.4 Persyaratan Browser

- Google Chrome (versi terbaru)
- Mozilla Firefox (versi terbaru)
- Microsoft Edge (versi terbaru)

---

## 2. Memulai Aplikasi

### 2.1 Login

1. Buka aplikasi DMS melalui browser.
2. Masukkan **email** dan **password** pada halaman login.
3. Klik tombol **Masuk**.

Jika organisasi Anda mengaktifkan SSO/LDAP, klik tombol **Login dengan SSO** untuk diarahkan ke halaman login organisasi Anda.

### 2.2 Lupa Password

Hubungi administrator perusahaan atau Super Admin untuk mereset password Anda.

### 2.3 Navigasi Utama

Setelah login, Anda akan melihat:
- **Sidebar kiri**: Menu navigasi utama ke seluruh modul
- **Header atas**: Pencarian global (Cmd+K / Ctrl+K), notifikasi, dan menu profil
- **Area konten**: Halaman utama sesuai menu yang dipilih

---

## 3. Dashboard

Dashboard adalah halaman utama setelah login yang menampilkan ringkasan aktivitas Anda.

### Informasi yang Ditampilkan

- **Statistik dokumen**: jumlah dokumen berdasarkan status (Draft, In Review, Approved, dll.)
- **Tugas tertunda**: daftar dokumen yang menunggu tindakan Anda (review/approve)
- **Aktivitas terbaru**: log aktivitas dokumen terkini
- **Grafik/chart**: visualisasi tren dokumen

---

## 4. Distribusi Masuk

Menu **Distribusi Masuk** menampilkan daftar dokumen yang telah didistribusikan kepada Anda.

### Fitur Utama

| Fitur | Keterangan |
|---|---|
| Daftar distribusi | Menampilkan semua dokumen masuk beserta pengirim, tanggal, dan prioritas |
| Acknowledge | Konfirmasi bahwa Anda telah menerima dan membaca dokumen |
| Filter & pencarian | Filter berdasarkan status, tanggal, atau kata kunci |

### Cara Menggunakan

1. Buka menu **Distribusi Masuk** di sidebar.
2. Klik dokumen yang ingin Anda baca.
3. Setelah membaca, klik tombol **Acknowledge** untuk mengkonfirmasi penerimaan.

---

## 5. Manajemen Dokumen

Ini adalah modul utama aplikasi untuk membuat, mengedit, dan mengelola seluruh dokumen.

### 5.1 Daftar Dokumen

Halaman **Semua Dokumen** menampilkan seluruh dokumen yang dapat Anda akses sesuai peran dan cakupan organisasi Anda.

**Fitur pada halaman daftar:**
- Pencarian dan filter (berdasarkan tipe, kategori, status, prioritas, klasifikasi)
- Sortir berdasarkan kolom
- Aksi cepat: lihat, edit, hapus
- Tampilan berdasarkan tipe dokumen (submenu dinamis di sidebar)

**Status Dokumen:**

| Status | Keterangan |
|---|---|
| `draft` | Dokumen baru dibuat, belum di-submit |
| `in_review` | Dokumen sedang dalam proses review/approval |
| `revision` | Dokumen dikembalikan untuk revisi |
| `approved` | Dokumen telah disetujui |
| `rejected` | Dokumen ditolak |
| `finalized` | Dokumen final, PDF telah di-generate |
| `obsolete` | Dokumen tidak lagi berlaku |
| `archived` | Dokumen diarsipkan |

### 5.2 Membuat Dokumen Baru

1. Klik tombol **Buat Dokumen** pada halaman daftar dokumen.
2. Isi formulir pembuatan:
   - **Tipe Dokumen** *(wajib)*: Pilih jenis dokumen
   - **Kategori** *(wajib)*: Pilih kategori
   - **Template** *(wajib)*: Pilih template yang akan digunakan sebagai basis dokumen
   - **Judul** *(wajib)*: Nama dokumen
   - **Deskripsi**: Keterangan singkat mengenai dokumen
   - **Prioritas**: Normal, High, atau Urgent
   - **Klasifikasi**: Tingkat kerahasiaan (Public, Internal, Confidential, Secret)
3. Klik **Simpan**.
4. Sistem akan otomatis:
   - Meng-generate **nomor dokumen** sesuai format penomoran yang berlaku
   - Menyalin isi template ke dalam dokumen baru
   - Membuat **versi awal** (v1.0)

### 5.3 Detail Dokumen

Setelah masuk ke detail dokumen, tersedia **10 tab** untuk mengelola berbagai aspek dokumen:

#### Tab 1: Informasi

Menampilkan ringkasan lengkap dokumen:
- Pipeline status workflow (visual)
- Metadata dokumen (nomor, judul, tipe, kategori, prioritas, klasifikasi)
- Informasi organisasi (company, office, department)
- Informasi pembuat dan tanggal-tanggal penting
- Statistik (jumlah halaman, kata, versi)

#### Tab 2: Editor

Editor dokumen terintegrasi menggunakan **OnlyOffice Document Server**.

- **Mode Edit**: Tersedia jika dokumen berstatus draft/revision dan Anda memiliki izin `document.edit`
- **Mode View**: Untuk melihat dokumen tanpa mengubah isi
- Mendukung format: DOCX, XLSX, PPTX, dan format Office lainnya
- Penyimpanan otomatis — perubahan disimpan langsung ke server
- Kolaborasi real-time jika beberapa pengguna membuka dokumen bersamaan

#### Tab 3: Berkas (File Manager)

Mengelola berkas/lampiran dokumen:

| Aksi | Keterangan |
|---|---|
| Upload lampiran | Menambahkan file pendukung |
| Download | Mengunduh file dokumen atau lampiran |
| Hapus lampiran | Menghapus file pendukung |
| OCR lampiran | Menjalankan OCR pada lampiran tertentu |
| Preview | Melihat file tanpa mengunduh |

#### Tab 4: Versi

Menampilkan riwayat semua versi dokumen dalam format **timeline**.

- Setiap versi menampilkan: nomor versi, tanggal, pembuat, ringkasan perubahan, ukuran file
- **Download**: Unduh versi tertentu
- **Restore**: Kembalikan dokumen ke versi sebelumnya (membuat versi baru dengan isi versi lama)

#### Tab 5: Parameter

Jika template memiliki **tag/placeholder** yang telah didefinisikan, tab ini menampilkan metadata parameter yang dapat diisi atau diedit.

- Tipe parameter: Text, Number, Date, Select (pilihan dari API), Textarea
- Parameter otomatis terisi dari data organisasi jika dikonfigurasi

#### Tab 6: Komentar

Fitur diskusi dan kolaborasi dalam konteks dokumen:

- **Tambah komentar**: Tulis komentar baru
- **Reply**: Balas komentar tertentu (thread/bersarang)
- **Resolve/Unresolve**: Tandai komentar sebagai selesai atau buka kembali
- **Edit/Hapus**: Ubah atau hapus komentar Anda sendiri
- Filter: tampilkan semua atau hanya yang belum resolved

#### Tab 7: Workflow

Menampilkan detail lengkap alur persetujuan dokumen:

- **Pipeline visual**: Status setiap langkah workflow
- **Informasi langkah aktif**: Siapa yang sedang bertanggung jawab, deadline
- **Riwayat iterasi**: Jika dokumen pernah ditolak dan direvisi
- **SLA tracking**: Waktu yang tersisa atau sudah terlewat
- **Aksi yang tersedia** (sesuai peran Anda):
  - **Submit**: Kirim dokumen ke workflow (dari status draft)
  - **Approve**: Setujui langkah saat ini
  - **Reject**: Tolak dengan catatan (bisa kembali ke pembuat, langkah sebelumnya, atau langkah tertentu)
  - **Delegate**: Delegasikan tugas review/approval ke orang lain
  - **Komentar Workflow**: Tambahkan catatan pada proses workflow

**Detail aktor pada setiap langkah:**
- Nama dan jabatan aktor
- Tipe penugasan (user spesifik, berdasarkan role, posisi, atau departemen)
- Status: pending, approved, rejected, delegated
- Timestamp aksi

#### Tab 8: Distribusi

Mengelola distribusi dokumen final kepada penerima:

- **Tambah distribusi**: Pilih penerima (individual atau bulk)
- **Tabel distribusi**: Menampilkan status setiap penerima
  - Pending: belum dikirim
  - Distributed: sudah dikirim
  - Acknowledged: penerima telah mengkonfirmasi
- **Hapus distribusi**: Batalkan distribusi yang belum di-acknowledge

#### Tab 9: Tanda Tangan Elektronik (TTE)

Fitur tanda tangan digital internal:

- **Persyaratan**: Pengguna harus sudah meng-upload gambar tanda tangan di profil
- **Proses penandatanganan**:
  1. Klik **Tanda Tangani Dokumen**
  2. Sistem menghitung hash SHA-256 dari file dokumen saat ini
  3. Menyimpan data penandatangan (nama, jabatan, departemen, IP address)
- **Verifikasi**: Sistem dapat memverifikasi apakah dokumen masih utuh (tidak diubah) setelah ditandatangani
- **Revoke**: Membatalkan tanda tangan jika diperlukan
- **Daftar tanda tangan**: Menampilkan semua penandatangan beserta timestamp dan status verifikasi

#### Tab 10: OCR

Fitur ekstraksi teks dari file dokumen menggunakan Tesseract:

- **Bahasa didukung**: Indonesia dan Inggris
- **Format didukung**: PDF, gambar (JPG, PNG, dll.)
- **Cara menggunakan**:
  1. Klik **Jalankan OCR**
  2. Sistem memproses file (untuk PDF, dikonversi ke gambar terlebih dahulu)
  3. Hasil teks ditampilkan dan disimpan ke metadata dokumen
- **Manfaat**: Memungkinkan pencarian teks pada dokumen yang awalnya berupa gambar/scan

---

## 6. Master Data

Modul untuk mengelola data referensi yang digunakan dalam pembuatan dokumen.

> **Akses**: Memerlukan izin `document.view`

### 6.1 Tipe Dokumen

Mendefinisikan jenis-jenis dokumen yang dapat dibuat dalam sistem.

| Field | Keterangan |
|---|---|
| Nama | Nama tipe dokumen (misal: SOP, Surat Keputusan, Memo) |
| Kode/Prefix | Kode singkat untuk penomoran |
| Deskripsi | Penjelasan mengenai tipe dokumen |
| Status | Aktif/Nonaktif |

### 6.2 Kategori Dokumen

Klasifikasi tambahan untuk mengelompokkan dokumen di dalam suatu tipe.

- Setiap kategori terkait dengan perusahaan (company)
- Contoh: Kategori "Keuangan", "Operasional", "HR" dalam tipe "Surat Keputusan"

### 6.3 Template Dokumen

Template adalah file dasar yang digunakan saat membuat dokumen baru. Fitur ini memastikan konsistensi format dan isi.

**Fitur utama:**
- **Upload template**: Upload file DOCX/XLSX/PPTX sebagai template dasar
- **Download template**: Unduh file template untuk diedit secara offline
- **Tag Designer**: Mendesain placeholder/tag yang akan diisi saat pembuatan dokumen

**Tag Designer:**
Tag adalah variabel yang dapat ditanamkan dalam template dan diisi secara otomatis atau manual. Tipe tag yang didukung:

| Tipe Tag | Keterangan | Contoh |
|---|---|---|
| text | Input teks bebas | Nama proyek |
| number | Input angka | Jumlah anggaran |
| date | Pemilih tanggal | Tanggal efektif |
| select | Dropdown dengan pilihan | Pilih departemen |
| textarea | Input teks panjang/multi-baris | Deskripsi lengkap |

Operasi tag:
- Tambah tag satu per satu
- Tambah tag secara bulk
- Edit tag yang sudah ada
- Hapus tag

---

## 7. Workflow & Penomoran

### 7.1 Workflow

> **Akses**: Memerlukan izin `workflow.view` (lihat), `workflow.create` (buat), `workflow.edit` (edit)

Workflow mendefinisikan alur persetujuan yang harus dilalui dokumen sebelum disetujui.

#### Membuat Workflow

1. Buka menu **Workflow** di sidebar.
2. Klik **Buat Workflow Baru**.
3. Isi informasi dasar:
   - **Nama Workflow**: Nama deskriptif
   - **Tipe Dokumen**: Workflow berlaku untuk tipe dokumen apa
   - **Kategori** *(opsional)*: Spesifik untuk kategori tertentu
   - **Kantor** *(opsional)*: Spesifik untuk kantor tertentu
   - **Departemen** *(opsional)*: Spesifik untuk departemen tertentu
   - **Status**: Aktif/Nonaktif
4. Tambahkan **langkah-langkah (steps)** workflow.

#### Konfigurasi Langkah Workflow

Setiap langkah memiliki pengaturan detail:

| Pengaturan | Keterangan |
|---|---|
| Nama Langkah | Nama deskriptif (misal: "Review Manager") |
| Tipe Langkah | review, approval, final_approval |
| Tipe Penugasan | user (spesifik), role, position, department, section |
| Parallel Approval | Apakah beberapa orang harus approve bersamaan |
| Jumlah Approval Dibutuhkan | Minimal berapa orang harus approve |
| Aksi Saat Ditolak | Kembali ke pembuat / langkah sebelumnya / langkah tertentu / batalkan |
| Deadline | Batas waktu penyelesaian langkah (dalam jam) |
| Eskalasi | Otomatis eskalasi jika melewati deadline |
| Izin Edit | Apakah aktor boleh mengedit dokumen |
| Izin Komentar | Apakah komentar wajib saat approve/reject |
| Izin Delegasi | Apakah aktor boleh mendelegasikan ke orang lain |
| Instruksi | Petunjuk khusus untuk aktor |

#### Pencocokan Workflow Otomatis

Saat dokumen di-submit, sistem otomatis mencocokkan workflow yang paling sesuai berdasarkan:
1. Tipe dokumen
2. Kategori (jika ada)
3. Kantor (jika ada)
4. Departemen (jika ada)
5. Status aktif

Prioritas diberikan pada workflow yang paling spesifik (matching paling banyak kriteria).

### 7.2 Penomoran Dokumen

Sistem penomoran otomatis yang fleksibel untuk menghasilkan nomor dokumen unik.

#### Konfigurasi Penomoran

Setiap konfigurasi penomoran terkait dengan:
- **Perusahaan** *(wajib)*
- **Tipe Dokumen** *(wajib)*
- **Kategori** *(opsional)*
- **Kantor** *(opsional)*
- **Departemen** *(opsional)*

#### Token Format

Gunakan token berikut untuk menyusun format penomoran:

| Token | Keterangan | Contoh |
|---|---|---|
| `{SEQ}` | Nomor urut otomatis | 001, 002, ... |
| `{YEAR}` | Tahun penuh (4 digit) | 2025 |
| `{YEAR2}` | Tahun singkat (2 digit) | 25 |
| `{MONTH}` | Bulan (2 digit) | 07 |
| `{ROMAN_MONTH}` | Bulan dalam angka Romawi | VII |
| `{PREFIX}` | Prefix kustom | SK |
| `{TYPE}` | Kode tipe dokumen | SOP |
| `{CAT}` | Kode kategori | FIN |
| `{DEPT}` | Kode departemen | IT |
| `{OFFICE}` | Kode kantor | JKT |
| `{COMPANY}` | Kode perusahaan | ASK |
| `{SECTION}` | Kode seksi | DEV |

**Contoh format**: `{SEQ}/{TYPE}/{DEPT}/{ROMAN_MONTH}/{YEAR}`
**Hasil**: `001/SOP/IT/VII/2025`

#### Periode Reset

Nomor urut (SEQ) dapat direset secara otomatis:
- **Tahunan** (`yearly`): Reset setiap awal tahun
- **Bulanan** (`monthly`): Reset setiap awal bulan

#### Preview

Gunakan fitur **Preview** untuk melihat hasil format penomoran sebelum disimpan.

---

## 8. Organisasi

> **Akses**: Memerlukan izin `company.view` dan izin terkait (office, department, section, position)

Modul untuk mengelola struktur organisasi perusahaan. Struktur organisasi bersifat hierarkis:

```
Company (Perusahaan)
  └── Office (Kantor)
        └── Department (Departemen)
              └── Section (Seksi)

Position (Jabatan) — berdiri sendiri, terkait company
```

### 8.1 Perusahaan (Company)

Entitas paling atas dalam hierarki. Semua data (dokumen, pengguna, workflow) terkait dengan company.

| Field | Keterangan |
|---|---|
| Nama | Nama perusahaan |
| Kode | Kode singkat perusahaan |
| Alamat | Alamat perusahaan |
| Telepon | Nomor telepon |
| Email | Email perusahaan |
| Status | Aktif/Nonaktif |

### 8.2 Kantor (Office)

Kantor atau cabang di bawah perusahaan.

### 8.3 Departemen (Department)

Unit kerja di bawah kantor. Setiap departemen dapat memiliki beberapa seksi.

### 8.4 Seksi (Section)

Sub-unit di bawah departemen.

### 8.5 Jabatan (Position)

Jabatan/posisi dalam organisasi. Digunakan untuk:
- Profil pengguna
- Penugasan workflow (tipe penugasan berdasarkan posisi)
- Informasi tanda tangan

---

## 9. Manajemen Akses

### 9.1 Pengguna

> **Akses**: Memerlukan izin `user.view` (lihat), `user.create` (buat), `user.edit` (edit)

#### Daftar Pengguna

Menampilkan semua pengguna sesuai cakupan organisasi Anda dengan fitur:
- Pencarian dan filter (berdasarkan status, role, departemen)
- Tombol aksi: lihat detail, edit, hapus

#### Membuat Pengguna Baru

1. Klik **Tambah Pengguna**.
2. Isi informasi:
   - **Nama** *(wajib)*
   - **Email** *(wajib, unik)*
   - **Password** *(wajib)*
   - **ID Karyawan**
   - **Telepon**
   - **Tanggal Bergabung**
   - **Penempatan Organisasi**: Company, Office, Department (opsional), Section (opsional), Position
3. Klik **Simpan**.

#### Detail Pengguna

Halaman detail pengguna memiliki **4 sub-halaman**:

| Tab | Keterangan |
|---|---|
| Overview | Informasi lengkap pengguna, penempatan organisasi, status |
| Edit | Ubah data pengguna |
| Roles | Kelola role yang diberikan pada pengguna (memerlukan `user.assign_role`) |
| Activity | Riwayat aktivitas pengguna |

### 9.2 Role & Permission

> **Akses**: Memerlukan izin `user.view` dan `user.assign_role`

#### Daftar Role

Menampilkan semua role dalam sistem.

#### Membuat/Edit Role

1. Klik **Buat Role** atau edit role yang ada.
2. Isi informasi:
   - **Nama** *(wajib)*
   - **Display Name**
   - **Deskripsi**
   - **Company** *(opsional — jika diisi, role hanya berlaku untuk company tersebut)*
3. Pilih **permissions** yang ingin diberikan pada role ini.
4. Klik **Simpan**.

> **Catatan**: Role bawaan sistem (`is_system = true`) tidak dapat dihapus.

---

## 10. SLA Monitoring

Memantau ketepatan waktu dalam proses persetujuan dokumen.

### 10.1 Dashboard SLA

Menampilkan visualisasi dan ringkasan SLA:
- Persentase SLA terpenuhi vs terlewat
- Tren SLA dari waktu ke waktu
- Breakdown per departemen atau tipe dokumen

### 10.2 SLA Terlewat (Breached)

Daftar dokumen yang proses workflow-nya telah melewati batas waktu (deadline) yang ditetapkan pada langkah workflow.

---

## 11. Pengaturan Sistem

> **Akses**: Memerlukan izin `setting.view` (lihat), `setting.edit` (ubah)

### 11.1 Pengaturan Umum

Konfigurasi sistem secara keseluruhan:
- Nama aplikasi
- Pengaturan email notifikasi
- Zona waktu
- Dan parameter sistem lainnya

### 11.2 Watermark

Konfigurasi watermark pada dokumen berdasarkan tingkat klasifikasi:

| Klasifikasi | Contoh Watermark |
|---|---|
| Public | Tidak ada watermark |
| Internal | "INTERNAL" |
| Confidential | "CONFIDENTIAL" |
| Secret | "RAHASIA" |

Pengaturan meliputi:
- Teks watermark per klasifikasi
- Posisi watermark
- Opacity
- Ukuran font

### 11.3 SSO / LDAP

Konfigurasi integrasi Single Sign-On (SSO) atau LDAP untuk autentikasi terpusat:
- Aktifkan/nonaktifkan SSO
- URL provider SSO
- Konfigurasi LDAP (server, base DN, dll.)
- Mapping atribut pengguna

---

## 12. Audit Log

> **Akses**: Memerlukan izin `audit.view`

Mencatat seluruh aktivitas dalam sistem untuk keperluan audit dan kepatuhan.

**Informasi yang dicatat:**
- **Siapa**: Pengguna yang melakukan aksi
- **Apa**: Aksi yang dilakukan (create, update, delete, login, dll.)
- **Kapan**: Timestamp aksi
- **Di mana**: Entitas/modul yang terkena dampak
- **Detail**: Perubahan data (before/after) jika relevan
- **IP Address**: Alamat IP pengguna

**Fitur:**
- Pencarian dan filter (berdasarkan pengguna, aksi, tanggal, modul)
- Export data audit (memerlukan izin `audit.export`)

---

## 13. Notifikasi

Sistem notifikasi real-time untuk memberi tahu pengguna tentang aktivitas penting.

### Jenis Notifikasi

- Dokumen baru yang memerlukan review/approval
- Dokumen Anda telah disetujui/ditolak
- Dokumen didistribusikan kepada Anda
- Komentar baru pada dokumen Anda
- Deadline workflow mendekati
- Delegasi tugas

### Fitur

- **Badge counter**: Jumlah notifikasi belum dibaca di header
- **Tandai dibaca**: Per notifikasi atau seluruh notifikasi sekaligus
- **Hapus**: Menghapus notifikasi yang tidak diperlukan
- **Klik untuk navigasi**: Klik notifikasi untuk langsung ke dokumen terkait

---

## 14. Profil Pengguna

Akses melalui ikon profil di pojok kanan atas header.

### 14.1 Overview

Menampilkan informasi pribadi dan penempatan organisasi Anda:
- Nama, email, ID karyawan
- Company, office, department, section, position
- Role yang dimiliki
- Tanggal bergabung

### 14.2 Pengaturan

Ubah preferensi pribadi Anda.

### 14.3 Keamanan

- **Ubah Password**: Ganti password Anda
- Informasi login terakhir

### 14.4 Tanda Tangan

Kelola gambar tanda tangan digital Anda:
1. Klik **Upload Tanda Tangan**.
2. Pilih file gambar tanda tangan (format PNG/JPG direkomendasikan, latar belakang transparan lebih baik).
3. Gambar ini akan digunakan saat Anda menandatangani dokumen melalui fitur TTE.

> **Penting**: Anda harus meng-upload tanda tangan sebelum dapat menandatangani dokumen.

---

## 15. Pencarian Global

Akses pencarian global dengan shortcut keyboard **Cmd+K** (Mac) atau **Ctrl+K** (Windows/Linux).

**Fitur:**
- Pencarian di seluruh dokumen, pengguna, dan entitas lainnya
- Hasil pencarian real-time saat Anda mengetik
- Klik hasil untuk langsung navigasi ke halaman terkait

---

## 16. Peran & Hak Akses

### 16.1 Peran Bawaan Sistem

| Peran | Keterangan | Cakupan Data |
|---|---|---|
| **Super Admin** | Akses penuh ke seluruh sistem dan semua perusahaan | Seluruh data |
| **Admin Company** | Administrator untuk satu perusahaan | Data dalam company yang sama |
| **Admin Kantor** | Administrator untuk satu kantor | Data dalam company + office yang sama |
| **Creator** | Pembuat dokumen | Data dalam company + office + department |
| **Reviewer** | Dapat me-review dan memberikan komentar | Data dalam company + office + department |
| **Approver** | Dapat menyetujui atau menolak dokumen | Data dalam company + office + department |
| **Viewer** | Hanya dapat melihat dokumen | Data dalam company + office + department |

### 16.2 Cakupan Data (Data Scope)

Sistem menerapkan **pembatasan akses data secara otomatis** berdasarkan peran:

- **Super Admin**: Melihat semua data dari semua perusahaan
- **Admin Company**: Hanya melihat data dari perusahaan tempat ia ditugaskan
- **Admin Kantor**: Hanya melihat data dari perusahaan dan kantor tempat ia ditugaskan
- **Peran lainnya**: Hanya melihat data dari perusahaan, kantor, dan departemen tempat ia ditugaskan

### 16.3 Hak Akses Menu

Beberapa menu di sidebar hanya muncul jika pengguna memiliki izin (permission) yang sesuai:

| Menu | Izin Diperlukan |
|---|---|
| Dashboard | — (semua pengguna) |
| Distribusi Masuk | — (semua pengguna) |
| Dokumen | — (semua pengguna) |
| Master Data | `document.view` |
| Workflow & Penomoran | `workflow.view` |
| Organisasi | `company.view` |
| Manajemen Akses | `user.view` |
| Role & Permission | `user.view` + `user.assign_role` |
| SLA Monitoring | — (semua pengguna) |
| Pengaturan | `setting.view` |
| Audit Log | `audit.view` |

---

## Lampiran: Daftar Permission

Berikut adalah daftar lengkap 45 permission yang tersedia dalam sistem:

### Modul: Document (12 permission)

| Permission | Keterangan |
|---|---|
| `document.create` | Membuat dokumen baru |
| `document.edit` | Mengedit dokumen |
| `document.view` | Melihat dokumen |
| `document.delete` | Menghapus dokumen |
| `document.download` | Mengunduh dokumen |
| `document.submit` | Submit dokumen untuk review |
| `document.review` | Me-review dokumen |
| `document.approve` | Meng-approve dokumen |
| `document.reject` | Menolak dokumen |
| `document.finalize` | Finalize dokumen (generate PDF) |
| `document.archive` | Mengarsipkan dokumen |
| `document.distribute` | Mendistribusikan dokumen final |

### Modul: Template (4 permission)

| Permission | Keterangan |
|---|---|
| `template.create` | Membuat template baru |
| `template.edit` | Mengedit template |
| `template.view` | Melihat template |
| `template.delete` | Menghapus template |

### Modul: Workflow (4 permission)

| Permission | Keterangan |
|---|---|
| `workflow.create` | Membuat workflow baru |
| `workflow.edit` | Mengedit workflow |
| `workflow.view` | Melihat workflow |
| `workflow.delete` | Menghapus workflow |

### Modul: User (5 permission)

| Permission | Keterangan |
|---|---|
| `user.create` | Membuat user baru |
| `user.edit` | Mengedit user |
| `user.view` | Melihat data user |
| `user.delete` | Menghapus user |
| `user.assign_role` | Assign role ke user |

### Modul: Company (3 permission)

| Permission | Keterangan |
|---|---|
| `company.create` | Membuat company baru |
| `company.edit` | Mengedit company |
| `company.view` | Melihat data company |

### Modul: Office (3 permission)

| Permission | Keterangan |
|---|---|
| `office.create` | Membuat kantor baru |
| `office.edit` | Mengedit kantor |
| `office.view` | Melihat data kantor |

### Modul: Department (3 permission)

| Permission | Keterangan |
|---|---|
| `department.create` | Membuat departemen baru |
| `department.edit` | Mengedit departemen |
| `department.view` | Melihat data departemen |

### Modul: Section (3 permission)

| Permission | Keterangan |
|---|---|
| `section.create` | Membuat section baru |
| `section.edit` | Mengedit section |
| `section.view` | Melihat data section |

### Modul: Position (3 permission)

| Permission | Keterangan |
|---|---|
| `position.create` | Membuat jabatan baru |
| `position.edit` | Mengedit jabatan |
| `position.view` | Melihat data jabatan |

### Modul: Audit (2 permission)

| Permission | Keterangan |
|---|---|
| `audit.view` | Melihat audit log |
| `audit.export` | Export audit log |

### Modul: Setting (2 permission)

| Permission | Keterangan |
|---|---|
| `setting.view` | Melihat system settings |
| `setting.edit` | Mengubah system settings |

### Modul: Notification (1 permission)

| Permission | Keterangan |
|---|---|
| `notification.manage` | Manage notification settings |

---

*Dokumen ini dibuat sebagai panduan pengguna untuk DMS PT Askara Internal. Untuk pertanyaan teknis atau bantuan, hubungi tim IT atau administrator sistem.*
