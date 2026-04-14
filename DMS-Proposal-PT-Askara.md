# Proposal Aplikasi DMS (Document Management System)

## PT Askara Internal

---

## 1. Latar Belakang

### Kondisi Saat Ini

- Client menggunakan **M-Files** sebagai DMS existing
- Hanya digunakan untuk upload permintaan dokumen dan penyimpanan
- Pembuatan dokumen masih dilakukan terpisah di Excel/Word

### Alasan Penggantian

- **Fitur kurang lengkap** — tidak mendukung pembuatan dokumen di dalam sistem
- **Tidak bisa integrasi** dengan ERP dan sistem lain
- **Biaya lisensi mahal** (~$35-75/user/bulan, estimasi $27,000/tahun untuk 50 user)

### Tujuan

- One-stop platform: pembuatan hingga penyimpanan dokumen
- Dynamic approval workflow per jenis dokumen & departemen
- Multi-company support
- Audit trail lengkap
- Integrasi ERP (PO/BQ) di fase selanjutnya

---

## 2. Arsitektur Sistem

### Tech Stack

| Layer           | Teknologi                      | Fungsi                                                       |
| --------------- | ------------------------------ | ------------------------------------------------------------ |
| Frontend        | React                          | UI, dashboard, form, workflow view                           |
| Backend API     | Laravel (PHP)                  | Auth, RBAC, CRUD, workflow engine, template engine (PHPWord) |
| Microservice    | Go                             | Document processing, convert, generate, file handling        |
| Document Editor | OnlyOffice Document Server     | Embedded editor di browser (Word/Excel)                      |
| Database        | PostgreSQL                     | Semua data                                                   |
| Storage         | Server filesystem / MinIO      | File .docx, .pdf, template                                   |

### Diagram Arsitektur

```
┌──────────────────────────────────────────────────────┐
│                    WEB BROWSER                        │
│                                                       │
│  ┌───────────────────┐    ┌────────────────────────┐  │
│  │   React Frontend   │    │  OnlyOffice Editor     │  │
│  │                    │◄──►│  (embedded iframe)     │  │
│  │ - Dashboard        │    │                        │  │
│  │ - Template Picker  │    │ - Edit .docx/.xlsx     │  │
│  │ - Workflow UI      │    │ - Comment & Review     │  │
│  │ - Approval Panel   │    │ - Track Changes        │  │
│  │ - Audit Trail View │    │ - Co-authoring         │  │
│  │ - User Management  │    │                        │  │
│  │ - Notification     │    └────────────────────────┘  │
│  └────────┬──────────┘                                 │
│           │                                            │
└───────────┼────────────────────────────────────────────┘
            │ REST API
            ▼
┌───────────────────────┐    ┌──────────────────────────┐
│   Laravel Backend     │    │  OnlyOffice Server       │
│                       │    │  (Docker/On-premise)     │
│ - Auth & RBAC         │◄──►│  - Document Service      │
│ - Workflow Engine     │    │  - Conversion Service    │
│ - Template Engine     │    │    (.docx → .pdf)        │
│   (PHPWord)           │    │  - Callback API          │
│ - Notification        │    └──────────────────────────┘
│ - Audit Log           │
│ - API Gateway         │
└────────┬──────────────┘
         │
         ▼
┌────────────────────┐    ┌──────────────────────┐
│   Go Microservice  │    │   PostgreSQL          │
│                    │    │                       │
│ - PDF Generation   │    │ - Users & Roles       │
│ - Bulk Document    │    │ - Documents Meta      │
│   Processing       │    │ - Templates           │
│ - File Conversion  │    │ - Workflow States     │
│ - Signature Embed  │    │ - Audit Logs          │
│                    │    │ - Companies/Depts     │
└────────────────────┘    │ - Notifications       │
                          └──────────────────────┘
         +
  ┌──────────────┐
  │ File Storage │
  │ (Server/     │
  │  MinIO)      │
  └──────────────┘
```

---

## 3. Modul Aplikasi

### Phase 1: Core DMS (MVP)

#### Modul 1: User & Access Management

- Registrasi & login (email + password)
- Multi-company/entity management
- Department management
- Role-based access control (RBAC):
  - Super Admin, Admin Company, Document Creator, Reviewer, Approver, Viewer
- Multi-level permission per document type:
  - **Master Copy**: hanya view, controlled access
  - **Controlled Copy**: view + download
  - **Raw File**: full access (create, edit, delete)
- Upload tanda tangan gambar per user

#### Modul 2: Template Management

- 5 template fixed:
  1. SOP (Standard Operating Procedure)
  2. Instruksi Kerja
  3. Standar
  4. Formulir
  5. One Point Lessons (OPL)
- Template berupa file `.docx` dengan placeholder tags
- Setiap company bisa punya template berbeda
- Admin upload/manage template via web
- Preview template sebelum digunakan

#### Modul 3: Document Creation & Editing

- User pilih template → isi metadata (nomor, dept, tanggal)
- Backend generate `.docx` dari template (PHPWord replace tags)
- Dokumen terbuka di **OnlyOffice** (embedded di browser)
- User tulis konten bebas di body dokumen (paragraf, tabel, gambar)
- Auto-save ke server
- Version control (setiap save = versi baru)
- Document numbering otomatis per company/dept/type

#### Modul 4: Document Review & Collaboration

- Draft document → bisa diberi comment di OnlyOffice
- Track changes (siapa ubah apa)
- Reviewer bisa edit langsung atau hanya comment
- Notifikasi ke author saat ada comment/review

#### Modul 5: Dynamic Approval Workflow

- Flow designer: admin konfigurasi approval per document type per department
- Multi-level approval hierarchy
- Actions: **Submit → Review → Approve / Reject / Revise**
- Reject with comment → kembali ke author untuk revisi
- Approval history tersimpan
- Parallel & sequential approval support

#### Modul 6: Document Finalization

- Setelah semua approval selesai:
  - Convert `.docx` → PDF (via OnlyOffice Conversion API atau Go service)
  - Embed tanda tangan gambar pada posisi yang ditentukan
  - PDF final = dokumen resmi (read-only)
- **Dual output:**
  - Draft: `.docx` (editable, bisa comment)
  - Final: `.pdf` (signed, read-only)

#### Modul 7: Document Storage & Retrieval

- Kategorisasi: master copy, controlled copy, raw file
- Search by metadata (nomor, judul, dept, type, tanggal)
- Filter & sort
- Folder structure per company/department
- Document versioning (v1, v2, v3...)
- Download control berdasarkan permission

#### Modul 8: Audit Trail

- Log semua aktivitas:
  - Create, view, edit, comment, approve, reject, download, delete
- Detail: siapa, kapan, apa yang dilakukan
- History perubahan dokumen (diff antar versi)
- Export audit log (CSV/PDF)

#### Modul 9: Notification System

- Push notification ke dashboard (real-time via WebSocket)
- Email notification
- Trigger events:
  - Dokumen baru menunggu review
  - Dokumen di-approve/reject
  - Comment baru pada dokumen
  - Dokumen mendekati deadline
- Configurable notification preferences per user

---

### Phase 2: Advanced Features (Future)

#### Modul 10: ERP Integration

- API endpoint untuk terima dokumen dari ERP
- PO (Purchase Order) dari ERP → auto-upload ke DMS
- BQ (Bill of Quantity) dari client → attach ke project di DMS
- Metadata mapping: nomor PO, vendor, tanggal, nilai
- Webhook support untuk event-driven integration

#### Modul 11: Dashboard & Reporting

- Dashboard per company/department
- Statistik: dokumen per status, per type, per dept
- Approval turnaround time
- Overdue documents
- User activity summary

#### Modul 12: Advanced Search

- Full-text search dalam konten dokumen
- Search by tag, metadata, date range
- Saved search / bookmark

---

## 4. Document Lifecycle Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  CREATE   │───►│  DRAFT   │───►│  REVIEW  │───►│ APPROVE  │───►│  FINAL   │
│           │    │          │    │          │    │          │    │          │
│ Pilih     │    │ Edit di  │    │ Comment  │    │ Dynamic  │    │ Convert  │
│ template  │    │ OnlyOff  │    │ Track    │    │ workflow │    │ ke PDF   │
│ Isi meta  │    │ ice      │    │ changes  │    │ Multi-   │    │ + Sign   │
│ Generate  │    │ Auto-save│    │ Revisi   │    │ level    │    │ Read-only│
│ .docx     │    │ Version  │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                      │                │
                                      │   REJECT       │
                                      ◄────────────────┘
                                   (kembali ke DRAFT
                                    dengan comment)
```

---

## 5. OnlyOffice Integration

### Mengapa OnlyOffice?

- **Open source & self-hosted** — gratis (Community Edition, max 20 concurrent editors)
- **Tampilan mirip Microsoft Office** — user tidak perlu adaptasi
- **Support .docx, .xlsx native** — bukan HTML-based editor
- **Co-authoring, commenting, track changes** — fitur kolaborasi lengkap
- **Conversion API** — convert .docx → .pdf di server
- **Docker deployment** — mudah deploy on-premise
- Enterprise Edition tersedia (~$2-4/user/bulan) jika butuh lebih dari 20 concurrent

### Cara Kerja Integrasi

1. User klik "Edit Dokumen" di React frontend
2. Laravel generate config (document URL, callback URL, user info, permissions)
3. React render OnlyOffice editor via JavaScript API (iframe)
4. User edit dokumen di browser (tampilan seperti Word)
5. OnlyOffice kirim callback ke Laravel saat save/close
6. Laravel simpan file baru ke storage, update versi di database

### Contoh Config OnlyOffice

```json
{
  "document": {
    "fileType": "docx",
    "key": "doc_unique_key_v3",
    "title": "SOP-001-QMS-v3.docx",
    "url": "https://server/api/documents/123/download"
  },
  "editorConfig": {
    "callbackUrl": "https://server/api/onlyoffice/callback",
    "user": {
      "id": "user_456",
      "name": "Ahmad Rizki"
    },
    "mode": "edit",
    "customization": {
      "review": { "trackChanges": true },
      "comments": true
    }
  }
}
```

---

## 6. Template System

### Pendekatan

- Template = file `.docx` yang di-design di Word/WPS
- Berisi placeholder tags: `${TAG_NAME}`
- Backend (PHPWord) replace tags dengan data aktual saat generate

### Daftar Tags

| Tag                      | Contoh Isi                          |
| ------------------------ | ----------------------------------- |
| `${NOMOR_DOKUMEN}`       | SOP-QMS-001                         |
| `${JUDUL_DOKUMEN}`       | Prosedur Pengendalian Dokumen       |
| `${DEPARTEMEN}`          | Quality Management                  |
| `${TANGGAL_TERBIT}`      | 13 April 2026                       |
| `${VERSI}`               | 3.0                                 |
| `${DISUSUN_OLEH}`        | Ahmad Rizki                         |
| `${DIPERIKSA_OLEH}`      | (diisi saat approval)               |
| `${DISETUJUI_OLEH}`      | (diisi saat approval)               |
| `${NAMA_PERUSAHAAN}`     | PT Askara Internal                  |
| `${LOGO_PERUSAHAAN}`     | (gambar logo company)               |

### Flow Template

1. Admin design template `.docx` di Word/WPS (taruh tags di posisi yang tepat)
2. Admin upload template ke sistem via web
3. User pilih template → isi form metadata di web
4. Laravel panggil PHPWord → replace tags → generate `.docx` baru
5. Hasil `.docx` tampil di OnlyOffice untuk editing konten bebas

---

## 7. Database Schema (High-Level)

### Tabel Utama

| Tabel                  | Fungsi                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| `companies`            | Data perusahaan (multi-company)                                           |
| `departments`          | Departemen per company                                                    |
| `users`                | User data, linked ke department & company                                 |
| `roles`                | Role definitions (Super Admin, Admin, Creator, Reviewer, Approver, Viewer)|
| `permissions`          | Permission matrix (role × document_type × action)                         |
| `user_signatures`      | Tanda tangan gambar per user                                              |
| `document_templates`   | Template .docx per company per document type                              |
| `document_types`       | SOP, Instruksi Kerja, Standar, Formulir, OPL                              |
| `documents`            | Dokumen yang dibuat: metadata, status, current version                    |
| `document_versions`    | History versi per dokumen (file path, created_by, created_at)             |
| `document_access`      | Access level per dokumen (master copy, controlled copy, raw file)         |
| `workflows`            | Workflow definition per document type per department                      |
| `workflow_steps`       | Steps dalam workflow (order, role required, action type)                   |
| `workflow_instances`   | Instance workflow yang berjalan untuk dokumen tertentu                    |
| `workflow_actions`     | Log action per step (approve/reject/revise, user, comment, timestamp)     |
| `audit_logs`           | Semua aktivitas (user, action, document, timestamp, detail)               |
| `notifications`        | Notifikasi per user (type, message, read/unread, link)                    |

---

## 8. Estimasi Kompleksitas per Modul

| No  | Modul                            | Kompleksitas    |
| --- | -------------------------------- | :-------------: |
| 1   | User & Access Management         | Medium          |
| 2   | Template Management              | Low-Medium      |
| 3   | Document Creation + OnlyOffice   | Medium-High     |
| 4   | Review & Collaboration           | Medium-High     |
| 5   | Dynamic Approval Workflow        | **High**        |
| 6   | Document Finalization (PDF+Sign) | Medium          |
| 7   | Storage & Retrieval              | Medium          |
| 8   | Audit Trail                      | Low-Medium      |
| 9   | Notification System              | Medium          |
| 10  | OnlyOffice Setup & Integration   | Medium          |

---

## 9. Perbandingan dengan M-Files

| Aspek           | M-Files                              | Solusi Custom (Kami)                         |
| --------------- | ------------------------------------ | -------------------------------------------- |
| Biaya           | ~$35-75/user/bulan (recurring)       | One-time development + minimal recurring     |
| Editor          | Microsoft Office (deep integration)  | OnlyOffice (embedded, self-hosted)           |
| Template        | Dinamis (no-code builder)            | Fixed template .docx + tag replacement       |
| Workflow        | Built-in                             | Custom dynamic workflow                      |
| Integrasi ERP   | Perlu konfigurasi tambahan           | Custom API (Phase 2)                         |
| Self-hosted     | Ya (enterprise license)              | Ya (full ownership)                          |
| Ownership       | Lisensi (tidak punya software)       | Milik sendiri                                |
| AI Features     | Ya (M-Files Aino)                    | Tidak (bisa ditambahkan nanti)               |
| Max Users       | Unlimited (bayar per user)           | Unlimited (tidak ada lisensi per user)       |
| Co-authoring    | Ya (via Office 365)                  | Ya (via OnlyOffice)                          |

---

## 10. Deployment & Infrastructure

### Kebutuhan Server (On-Premise)

| Komponen                         | Minimum Spec                     |
| -------------------------------- | -------------------------------- |
| Web Server (Laravel + React)     | 4 CPU, 8GB RAM, 100GB SSD       |
| OnlyOffice Document Server       | 4 CPU, 8GB RAM, 50GB SSD        |
| PostgreSQL                       | 2 CPU, 4GB RAM, 100GB SSD       |
| Go Microservice                  | 2 CPU, 4GB RAM                   |
| File Storage                     | Sesuai kebutuhan (estimasi 500GB+)|

> Untuk < 50 user, semua bisa dijalankan di **1 server** dengan spec: **8 CPU, 16GB RAM, 500GB SSD**. Menggunakan Docker Compose di satu mesin.

### Software Stack

- OS: Ubuntu Server 22.04 LTS
- Docker & Docker Compose
- Nginx (reverse proxy)
- PHP 8.2+ / Laravel 11
- Go 1.21+
- Node.js 20+ (React build)
- PostgreSQL 16
- OnlyOffice Document Server (Docker)

---

## 11. Scope Boundaries

### Termasuk (Phase 1)

- Core DMS: template, create, edit, review, approve, finalize
- OnlyOffice embedded editor
- Dynamic approval workflow
- Multi-company support
- Audit trail
- Push notification + email
- User & access management
- Document versioning
- PDF generation + tanda tangan gambar

### Tidak Termasuk (Phase 2 / Future)

- ERP integration (PO/BQ)
- Advanced reporting & analytics dashboard
- Full-text search dalam konten dokumen
- Mobile application
- AI-powered features
- OCR / document scanning
- Digital certificate (CA) signature

---

## 12. Keunggulan Solusi

1. **Biaya lebih hemat** — bayar sekali (development), tidak ada biaya lisensi per user per bulan
2. **Full ownership** — source code dan data milik PT Askara Internal sepenuhnya
3. **Custom sesuai kebutuhan** — workflow, template, dan fitur disesuaikan persis dengan proses bisnis
4. **Integrasi ERP siap** — arsitektur API-first, tinggal sambung ke ERP existing
5. **On-premise** — data tetap di server internal, keamanan terjaga
6. **Scalable** — bisa ditambah fitur, user, dan company tanpa biaya lisensi tambahan
7. **Editor familiar** — OnlyOffice tampilan mirip Microsoft Office, user tidak perlu training berat

---

*Dokumen ini adalah proposal teknis awal. Detail harga, timeline, dan terms akan dibahas terpisah.*
