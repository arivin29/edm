# DMS Feature Design v2 — Detail per Modul

---

## Modul 1: User & Access Management

### 1.1 Authentication

**Login Flow:**
```
User → POST /auth/login (email + password)
     → Server validate credentials
     → Generate JWT token (access + refresh)
     → Return user data (company, office, dept, section, position, roles, permissions)
     → Frontend store token di memory (bukan localStorage)
     → Redirect ke dashboard kantor default
```

**Session Management:**
- Access token: berlaku 60 menit
- Refresh token: berlaku 7 hari
- Token rotation: setiap refresh, token lama di-revoke
- Concurrent session: max 3 device per user
- Force logout: admin bisa kick session user

### 1.2 User Management

**Fitur:**
- CRUD user dengan validasi email unik
- Assign user ke company + office + department + section + position
- Assign multiple roles per user
- Upload foto profil (avatar)
- Upload tanda tangan gambar (PNG/JPG, max 2MB, background transparan)
- Aktivasi / deaktivasi user
- Reset password oleh admin
- User bisa update profil sendiri (nama, phone, password, avatar, signature)

**User List View:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Users                                                     [+ Add User] │
├─────────────────────────────────────────────────────────────────────────┤
│ Search: [____________]  Office: [All ▼]  Dept: [All ▼]  Position: [All ▼]  │
│ Role: [All ▼]  Status: [Active ▼]                                       │
├────┬────────────┬──────────────────┬──────────┬──────────┬────────┬─────┤
│ #  │ Name       │ Email            │ Kantor   │ Dept/Section │ Jabatan│ Act│
├────┼────────────┼──────────────────┼──────────┼──────────┼────────┼─────┤
│ 1  │ Ahmad R.   │ ahmad@askara.com │ KP-JKT   │ QMS/PD   │ Staff  │ Edit│
│ 2  │ Budi S.    │ budi@askara.com  │ KP-JKT   │ QMS      │ Manager│ Edit│
│ 3  │ Citra D.   │ citra@askara.com │ CB-SBY   │ HRD      │ SPV    │ Edit│
└────┴────────────┴──────────────────┴──────────┴──────────┴────────┴─────┘
```

### 1.3 Organization Structure Management

**Kantor Management (Admin):**
```
┌────────────────────────────────────────────────────────────────┐
│ Organization Structure                                        │
├────────────────────────────────────────────────────────────────┤
│ Company: PT Askara Internal                                    │
│                                                                │
│ ├── 🏢 Kantor Pusat Jakarta (KP-JKT) [headquarters] ★default │
│ │   ├── 📁 Quality Management (QMS)                            │
│ │   │   ├── 📂 Pengendalian Dokumen (PD) — Head: Siti N.      │
│ │   │   ├── 📂 Quality Control (QC) — Head: Rudi H.           │
│ │   │   └── 📂 Quality Assurance (QA) — Head: Dina P.         │
│ │   ├── 📁 HRD                                                │
│ │   │   ├── 📂 Rekrutmen — Head: Andi W.                      │
│ │   │   └── 📂 Training — Head: Maya S.                       │
│ │   └── 📁 Production (PROD)                                  │
│ │       ├── 📂 Produksi Line 1 — Head: Hadi K.                │
│ │       └── 📂 Produksi Line 2 — Head: Eko P.                 │
│ │                                                              │
│ ├── 🏢 Cabang Surabaya (CB-SBY) [branch]                     │
│ │   ├── 📁 Quality Management (QMS)                            │
│ │   └── 📁 Production (PROD)                                  │
│ │                                                              │
│ └── 🏭 Pabrik Cikarang (PB-CKR) [factory]                    │
│     └── 📁 Production (PROD)                                  │
│                                                                │
│ Jabatan:                                                       │
│ Level 10: Director         Level 3: Supervisor                 │
│ Level 8:  General Manager  Level 1: Staff                      │
│ Level 5:  Manager                                              │
└────────────────────────────────────────────────────────────────┘
```

### 1.4 RBAC (Role-Based Access Control)

**Default Roles & Permissions Matrix:**

| Permission           | Super Admin | Admin Company | Admin Office | Creator | Reviewer | Approver | Viewer |
| -------------------- | :---------: | :-----------: | :----------: | :-----: | :------: | :------: | :----: |
| document.create      | ✅          | ✅            | ✅           | ✅      | ❌       | ❌       | ❌     |
| document.edit        | ✅          | ✅            | ✅           | ✅      | ✅*      | ❌       | ❌     |
| document.view        | ✅          | ✅            | ✅           | ✅      | ✅       | ✅       | ✅     |
| document.delete      | ✅          | ✅            | ✅           | ✅**    | ❌       | ❌       | ❌     |
| document.download    | ✅          | ✅            | ✅           | ✅      | ✅       | ✅       | ✅***  |
| document.submit      | ✅          | ✅            | ✅           | ✅      | ❌       | ❌       | ❌     |
| document.review      | ✅          | ✅            | ❌           | ❌      | ✅       | ❌       | ❌     |
| document.approve     | ✅          | ✅            | ❌           | ❌      | ❌       | ✅       | ❌     |
| document.finalize    | ✅          | ✅            | ❌           | ❌      | ❌       | ✅       | ❌     |
| document.distribute  | ✅          | ✅            | ✅           | ❌      | ❌       | ❌       | ❌     |
| template.create      | ✅          | ✅            | ❌           | ❌      | ❌       | ❌       | ❌     |
| workflow.create      | ✅          | ✅            | ❌           | ❌      | ❌       | ❌       | ❌     |
| user.create          | ✅          | ✅            | ✅           | ❌      | ❌       | ❌       | ❌     |
| office.create        | ✅          | ✅            | ❌           | ❌      | ❌       | ❌       | ❌     |
| audit.view           | ✅          | ✅            | ✅           | ❌      | ❌       | ❌       | ❌     |

> *Reviewer: edit hanya pada step review yang di-assign ke dia
> **Creator: delete hanya dokumen milik sendiri yang masih draft
> ***Viewer: download tergantung access level dokumen

### 1.5 Document Access Level

| Access Level        | View | Download .docx | Download .pdf | Edit | Watermark            |
| ------------------- | :--: | :------------: | :-----------: | :--: | -------------------- |
| master_copy         | ✅   | ❌             | ❌             | ❌   | "MASTER COPY"        |
| controlled_copy     | ✅   | ❌             | ✅             | ❌   | "CONTROLLED COPY"    |
| uncontrolled_copy   | ✅   | ✅             | ✅             | ❌   | -                    |
| raw                 | ✅   | ✅             | ✅             | ✅   | -                    |

---

## Modul 2: Template Management

### 2.1 Template CRUD

**Create Template Flow:**
```
1. Admin klik "Create Template"
2. Isi metadata:
   - Nama template
   - Code (opsional, auto-generate)
   - Document type (SOP/IK/STD/FRM/OPL)
   - Category (Quality/Safety/HR/etc)
   - Deskripsi
3. Upload file .docx yang sudah berisi placeholder ${TAG}
4. Sistem scan file, deteksi semua tag ${...}
5. Untuk setiap tag, admin konfigurasi:
   ┌─────────────────────────────────────────────────┐
   │ Tag Configuration: ${NOMOR_DOKUMEN}             │
   ├─────────────────────────────────────────────────┤
   │ Label:        [Nomor Dokumen              ]     │
   │ Data Type:    [auto ▼]                          │
   │ Source:       [auto_generate ▼]                  │
   │ Source Config:                                   │
   │   Generator:  [document_number]                  │
   │   Format:     [{TYPE}/{DEPT}/{SEQ:3}/{ROMAN_MONTH}/{YEAR}] │
   │                                                  │
   │ Required:     [✅]     Readonly: [✅]             │
   │ Hidden:       [❌]                                │
   │ Group:        [Header ▼]   Order: [1]            │
   │ Column Span:  [6] / 12                           │
   │                                                  │
   │ Format:       [________________________]          │
   │ Default:      [________________________]          │
   │ Placeholder:  [________________________]          │
   │ Validation:   [________________________]          │
   │                                                  │
   │               [Cancel]  [Save Tag]               │
   └─────────────────────────────────────────────────┘
6. Untuk tag tipe 'table', admin define kolom-kolomnya
7. Untuk tag tipe 'signature', admin link ke workflow step
8. Save template
```

### 2.2 Template Tag Types Summary

| Data Type     | Source Types                          | UI Component           | Keterangan                     |
| ------------- | ------------------------------------ | ---------------------- | ------------------------------ |
| text          | static, current_user, parent_doc     | Input text             | Input teks biasa               |
| textarea      | static                               | Textarea               | Multi-line                     |
| number        | static, auto_generate                | Input number           | Angka + format                 |
| date          | static, auto_generate                | Date picker            | + format_pattern               |
| datetime      | static, auto_generate                | Datetime picker        | + format_pattern               |
| select        | static (options), database, api      | Dropdown               | Pilihan tunggal                |
| multi_select  | static (options), database, api      | Multi-select           | Pilihan ganda                  |
| user          | database, current_user               | User picker            | Pilih dari daftar user         |
| department    | database                             | Department picker      | Pilih departemen               |
| section       | database                             | Section picker         | Pilih seksi                    |
| position      | database                             | Position picker        | Pilih jabatan                  |
| office        | database                             | Office picker          | Pilih kantor                   |
| image         | static                               | Image upload           | Logo, foto                     |
| auto          | auto_generate, current_user          | Readonly input         | Otomatis diisi sistem          |
| table         | static                               | Dynamic table          | Baris bisa ditambah            |
| signature     | auto_generate                        | Hidden (auto)          | Link ke workflow step          |

### 2.3 Template Versioning

- Setiap upload ulang file .docx = versi baru
- Tag definition bisa di-update tanpa upload ulang
- Dokumen yang sudah dibuat tetap pakai versi template saat dibuat
- Status template: draft → active → archived

### 2.4 Template List UI

```
┌────────────────────────────────────────────────────────────────────┐
│ Document Templates                                [+ New Template] │
├────────────────────────────────────────────────────────────────────┤
│ Type: [All ▼]  Category: [All ▼]  Status: [Active ▼]              │
│                                                                    │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│ │ [Preview]    │  │ [Preview]    │  │ [Preview]    │             │
│ │              │  │              │  │              │             │
│ │ SOP Quality  │  │ IK Safety    │  │ FRM Audit    │             │
│ │ v3 │ 8 tags  │  │ v1 │ 5 tags  │  │ v2 │ 12 tags │             │
│ │ 🏷 Quality   │  │ 🏷 Safety    │  │ 🏷 Quality   │             │
│ │ [Configure]  │  │ [Configure]  │  │ [Configure]  │             │
│ │ [Use]        │  │ [Use]        │  │ [Use]        │             │
│ └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

---

## Modul 3: Document Creation & Editing

### 3.1 Create Document Flow

```
1. User klik "New Document"
2. Pilih template dari grid (filter by type & category)
3. Form metadata muncul — dynamic form di-generate dari template_tags:
   ┌─────────────────────────────────────────────────────────┐
   │ Create New SOP                                          │
   ├─────────────────────────────────────────────────────────┤
   │ ┌─── Header ──────────────────────────────────────────┐ │
   │ │ Nomor Dokumen: [SOP/QMS/002/IV/2026] 🔒 (auto)     │ │
   │ │ Judul:         [________________________________]    │ │
   │ │ Departemen:    [Quality Management ▼] (from DB)     │ │
   │ │ Section:       [Pengendalian Dokumen ▼] (from DB)   │ │
   │ │ Tanggal:       [13 April 2026] (auto, formatted)    │ │
   │ │ Disusun Oleh:  [Ahmad Rizki] 🔒 (current_user)     │ │
   │ └────────────────────────────────────────────────────┘  │
   │ ┌─── Content ─────────────────────────────────────────┐ │
   │ │ Tingkat Resiko: [Medium ▼] (static options)         │ │
   │ │ Referensi:      [________________________________]   │ │
   │ └────────────────────────────────────────────────────┘  │
   │ ┌─── Informasi Tambahan ──────────────────────────────┐ │
   │ │ Kantor:        [Kantor Pusat Jakarta ▼]              │ │
   │ │ Kategori:      [Quality ▼]  🏷 (wajib)              │ │
   │ │ Prioritas:     [High ▼]                              │ │
   │ │ Kerahasiaan:   [Internal ▼]                          │ │
   │ │ Dari Modul:    [Audit ▼]  Ref: [AUDIT-2026-003]     │ │
   │ └────────────────────────────────────────────────────┘  │
   │                                                         │
   │                    [Cancel]  [Create & Edit]             │
   └─────────────────────────────────────────────────────────┘
4. User klik "Create & Edit"
5. Backend:
   a. Generate document_number (dari numbering config)
   b. Load template .docx
   c. PHPWord replace semua tags dengan nilai dari form
   d. Simpan .docx ke storage: /{company}/{documents}/{category}/{year}/{month}/{doc_number}/v1.docx
   e. Buat record di documents + document_versions
   f. Generate onlyoffice_key
6. Frontend redirect ke editor page
7. OnlyOffice editor terbuka dengan file .docx
8. User tulis konten
9. Auto-save via OnlyOffice forcesave
```

### 3.2 Editor Page Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back   SOP/QMS/002/IV/2026 - Prosedur Pengendali...    [Submit ▼]│
├──────────────────────────────────────────────────────────────────────┤
│ Status: ○ Draft │ v1.2 │ 🏷 Quality │ ⚡ High │ By: Ahmad Rizki    │
│ Kantor: KP-JKT │ Dept: QMS │ Section: PD │ Ref: AUDIT-2026-003    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │                                                          │        │
│  │        ╔═══════════════════════════════════╗              │        │
│  │        ║  LOGO          PT ASKARA INTERNAL ║              │        │
│  │        ║  STANDARD OPERATING PROCEDURE     ║              │        │
│  │        ║  No: SOP/QMS/002/IV/2026          ║              │        │
│  │        ║  Judul: Prosedur Pengendalian     ║              │        │
│  │        ║  Dept: Quality Management         ║              │        │
│  │        ║  Versi: 1.2                       ║              │        │
│  │        ║                                   ║              │        │
│  │        ║  1. TUJUAN                        ║              │        │
│  │        ║  [User menulis di sini...]        ║              │        │
│  │        ╚═══════════════════════════════════╝              │        │
│  │                                                          │        │
│  │              [ OnlyOffice Editor Area ]                   │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                      │
├─────────────────────┬────────────────────────────────────────────────┤
│ Document Info       │ Tabs: [Comments (3)] [Versions] [Relations]   │
│ Created: 13 Apr '26 │ ┌──────────────────────────────────────────┐  │
│ Updated: 14 Apr '26 │ │ 💬 Budi (Manager, QMS):                 │  │
│ Type: SOP           │ │ "Tolong tambah referensi ISO 9001"       │  │
│ Category: Quality   │ │ 2 jam lalu  [Reply] [Resolve]            │  │
│ Kantor: KP-JKT      │ │                                          │  │
│ Dept: QMS / PD      │ │ 💬 Ahmad (Staff, PD):                    │  │
│ Jabatan: Staff      │ │ "Sudah ditambahkan di bagian 3"          │  │
│ Version: v1.2       │ │ 1 jam lalu                               │  │
│ Priority: High      │ └──────────────────────────────────────────┘  │
│ Dari: AUDIT-2026-003│                                                │
└─────────────────────┴────────────────────────────────────────────────┘
```

### 3.3 Version Control

- **Auto-version**: setiap save di OnlyOffice = minor version (1.0 → 1.1 → 1.2)
- **Major version**: saat dokumen di-finalize setelah revisi = major version (1.x → 2.0)
- **Version sources**: 'editor' (OnlyOffice), 'upload', 'template', 'system'
- **Metadata snapshot**: setiap versi simpan snapshot metadata saat itu
- **Compare**: diff antara 2 versi via OnlyOffice comparison
- **Restore**: admin bisa restore ke versi sebelumnya

### 3.4 Document Numbering Format

**Tokens yang tersedia:**
```
{PREFIX}      = prefix custom
{TYPE}        = document_types.code (SOP, IK)
{CAT}         = document_categories.code (QLT, SFT)
{DEPT}        = departments.code (QMS, HRD)
{SECTION}     = sections.code (PD, QC)
{OFFICE}      = offices.code (KP-JKT)
{COMPANY}     = companies.code (ASK)
{SEQ:N}       = sequence zero-padded N digit
{YEAR}        = tahun 4 digit (2026)
{YEAR2}       = tahun 2 digit (26)
{MONTH}       = bulan 2 digit (04)
{ROMAN_MONTH} = bulan romawi (IV)
```

**Contoh format:**
```
{TYPE}/{DEPT}/{SEQ:3}/{ROMAN_MONTH}/{YEAR}  → SOP/QMS/001/IV/2026
{TYPE}-{DEPT}-{SEQ:4}                       → IK-HRD-0001
{COMPANY}/{TYPE}/{CAT}/{SEQ:3}/{YEAR}       → ASK/SOP/QLT/001/2026
{OFFICE}-{TYPE}-{SEQ:3}                     → KP-JKT-SOP-001
```

---

## Modul 4: Document Review & Collaboration

### 4.1 Review Flow

```
Author submit dokumen
       ↓
Assignee step 1 dapat notifikasi
(resolved from: user / role / dept head / section head / position / dept / section)
       ↓
Assignee buka dokumen di OnlyOffice
       ↓
┌──────────────────────────────────────────────┐
│ Assignee bisa (tergantung step config):       │
│ 1. Edit langsung (jika can_edit = true)      │
│ 2. Tambah comment inline (OnlyOffice)        │
│ 3. Tambah comment sidebar (web app)          │
│ 4. Delegate ke user lain (jika can_delegate) │
└──────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────┐
│ Action options:                               │
│ ✅ Approve  [comment opsional/wajib*]         │
│ ❌ Reject   [comment WAJIB jika configured]   │
│             → kembali ke: creator / step      │
│             tertentu / step sebelumnya         │
│ 🔄 Revise  [comment wajib]                    │
│ 👤 Delegate [pilih user + alasan]             │
└──────────────────────────────────────────────┘
       ↓
Jika Approve → lanjut ke step berikutnya
Jika Reject  → kembali sesuai on_reject_action config
```

### 4.2 Reject Behavior

| Config                | Behavior                                                  |
| --------------------- | --------------------------------------------------------- |
| `to_creator`          | Dokumen → status 'revision', kembali ke pembuat           |
| `to_step` + step_id   | Dokumen → kembali ke step tertentu (misal step 1 review) |
| `to_previous`         | Dokumen → kembali ke step sebelumnya                      |
| `cancel`              | Workflow dibatalkan, dokumen → status 'draft'             |

**Reject UI:**
```
┌──────────────────────────────────────────────────┐
│ Reject Document                                   │
├──────────────────────────────────────────────────┤
│ Alasan Penolakan: * (wajib)                       │
│ ┌──────────────────────────────────────────────┐  │
│ │ Dokumen belum memenuhi standar format.       │  │
│ │ Tolong revisi:                                │  │
│ │ 1. Bagian 3 - referensi ISO belum lengkap    │  │
│ │ 2. Bagian 5 - flowchart tidak sesuai         │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Visibilitas: [✅ Public] (pembuat bisa lihat)      │
│                                                    │
│ Dokumen akan kembali ke: [Review by QMS Staff]     │
│ (step 1, sesuai konfigurasi workflow)              │
│                                                    │
│                      [Cancel]  [Confirm Reject]    │
└──────────────────────────────────────────────────┘
```

### 4.3 Approve UI

```
┌──────────────────────────────────────────────────┐
│ Approve Document                                  │
├──────────────────────────────────────────────────┤
│ Catatan: (opsional)                               │
│ ┌──────────────────────────────────────────────┐  │
│ │ Dokumen sudah sesuai standar                  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [✅] Gunakan tanda tangan digital                  │
│      Preview: [gambar signature]                   │
│                                                    │
│ Instruksi step: "Verifikasi kesesuaian dengan     │
│ standar departemen"                                │
│                                                    │
│                      [Cancel]  [Confirm Approve]   │
└──────────────────────────────────────────────────┘
```

### 4.4 Comment System

**3 jenis comment:**
1. **OnlyOffice inline** — di dalam dokumen (annotations)
2. **Sidebar general** — diskusi umum di web app
3. **Workflow comment** — catatan saat approve/reject (linked ke step)

**Comment features:**
- Reply thread (nested)
- Mention user (@ahmad)
- Resolve comment
- Internal comment (hanya reviewer/approver bisa lihat)
- Public comment (pembuat juga lihat)
- Link ke step instance tertentu

---

## Modul 5: Dynamic Approval Workflow

### 5.1 Workflow Designer (Admin)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Workflow Designer: SOP Approval - QMS Department                      │
├────────────────────────────────────────────────────────────────────────┤
│ Scope: Company [ASK ▼]  Office [KP-JKT ▼]  Type [SOP ▼]             │
│        Category [Quality ▼]  Department [QMS ▼]                       │
│                                                                        │
│  [START] ──→ [Step 1]  ──→  [Step 2]  ──→  [Step 3]  ──→  [Step 4]  ──→ [END]│
│              Review         Approve         Approve‖        Sign       │
│              Section PD     Pos: Manager    Pos: SPV (∥)   User:Dir   │
│              3 days         5 days          5 days          7 days     │
│              Can edit       View only       Parallel        View only  │
│              →creator       →step 1         →previous       →creator   │
│                                                                        │
│  [+ Add Step]  [Duplicate Workflow]                                    │
│                                                                        │
│  Step Detail:                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Step Name:        [Approval by QMS Manager          ]            │  │
│  │ Type:             [Approve ▼] (Review/Approve/Sign/Acknowledge)  │  │
│  │                                                                  │  │
│  │ ─── Assignee ───                                                 │  │
│  │ Assign To:        [Position ▼]                                   │  │
│  │ Position:         [Manager ▼]                                    │  │
│  │ (atau: User / Role / Dept Head / Section Head / Department /     │  │
│  │        Section)                                                   │  │
│  │                                                                  │  │
│  │ ─── Parallel Approval ───                                        │  │
│  │ Parallel:         [❌]  Required Approvals: [1]                  │  │
│  │                                                                  │  │
│  │ ─── Reject Behavior ───                                          │  │
│  │ On Reject:        [to_step ▼]                                    │  │
│  │ Return To Step:   [Step 1: Review by QMS Staff ▼]                │  │
│  │ Reject Comment:   [✅ Required]                                   │  │
│  │ Approve Comment:  [❌ Optional]                                   │  │
│  │                                                                  │  │
│  │ ─── Permissions ───                                               │  │
│  │ Can Edit:         [❌]                                            │  │
│  │ Can Comment:      [✅]                                            │  │
│  │ Can Delegate:     [✅]                                            │  │
│  │                                                                  │  │
│  │ ─── Deadline ───                                                  │  │
│  │ Deadline:         [5] hari kerja                                 │  │
│  │ Escalation:       [notify_head ▼] setelah [2] hari lewat         │  │
│  │                                                                  │  │
│  │ ─── Instructions ───                                              │  │
│  │ [Verifikasi kesesuaian dengan standar departemen           ]      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│                                       [Cancel]  [Save Workflow]        │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Assignee Type Reference

| Assignee Type    | Resolved To                                            | Use Case                        |
| ---------------- | ------------------------------------------------------ | ------------------------------- |
| `user`           | Satu user spesifik                                     | Director tertentu               |
| `role`           | Semua user dengan role tsb                             | Semua reviewer di dept          |
| `department_head`| Head of department si dokumen                          | Kepala departemen               |
| `section_head`   | Head of section si dokumen                             | Kepala seksi                    |
| `position`       | Semua user dengan jabatan tsb di dept/section dokumen  | Semua Manager, semua SPV        |
| `department`     | Semua user di departemen tertentu                      | Semua orang di QMS              |
| `section`        | Semua user di section tertentu                         | Semua orang di seksi QC         |

### 5.3 Workflow State Machine (Updated)

```
                    submit
    DRAFT ──────────────────→ IN_REVIEW
      ↑                          │
      │                     ┌────┴────┐
      │                     │ Step 1  │ (Review)
      │                     │ pending → active → approved ──→ next step
      │      to_creator     │                  → rejected ──→ REVISION (ke creator)
      ├─────────────────────┤
      │                     └─────────┘
      │                          │
      │                     ┌────┴────┐
      │                     │ Step 2  │ (Approve)
      │    to_step(1)       │ pending → active → approved ──→ next step
      │◄────────────────────│                  → rejected ──→ Step 1 (returned)
      │                     └─────────┘
      │                          │
      │                     ┌────┴────┐
      │                     │ Step 3  │ (Approve, Parallel)
      │    to_previous      │ pending → active → {A:✅ B:✅ C:⏳} → all approved → next
      │◄────────────────────│                  → rejected ──→ Step 2 (returned)
      │                     └─────────┘
      │                          │
      │                     ┌────┴────┐
      │                     │ Step 4  │ (Sign)
      │    to_creator       │ pending → active → approved + signed ──→ APPROVED
      ├─────────────────────│                  → rejected ──→ REVISION
      │                     └─────────┘
      │                          │
      │      resubmit            │ all steps approved
      ├──────────────────── APPROVED
      │                          │
      │                     finalize()
      │                          │
      │                       FINAL ──→ obsolete() ──→ OBSOLETE
      │                          │
      │                     archive()
      │                          │
      │                      ARCHIVED
      │
      └──── REVISION (waiting for author to fix & resubmit)
```

### 5.4 Parallel Approval Detail

```
Step: "Approval by All Section Heads"
assignee_type: position (semua user jabatan Section Head di dept QMS)
is_parallel: true
required_approvals: 0  (0 = SEMUA harus approve)

Status tracking:
- Section Head PD: approved ✅ — "Sesuai standar PD"
- Section Head QC: approved ✅ — "OK"
- Section Head QA: pending ⏳

Jika required_approvals: 2 (dari 3), maka:
- Section Head PD: approved ✅
- Section Head QC: approved ✅  → 2/2 tercapai → step completed
- Section Head QA: (action ignored, step sudah complete)
```

### 5.5 Deadline & Escalation

| Timing                | Action                                          |
| --------------------- | ----------------------------------------------- |
| H-1 deadline          | Notifikasi warning ke assignee (push + email)   |
| Deadline passed       | Notifikasi ke assignee + admin                  |
| Deadline + N days     | Escalation action:                              |
|                       | - `notify_head`: notif ke atasan assignee       |
|                       | - `auto_approve`: auto-approve step             |
|                       | - `notify_admin`: notif ke admin company        |

### 5.6 Delegation Flow

```
Assignee A mendapat task approval
       ↓
A klik "Delegate"
       ↓
┌──────────────────────────────┐
│ Delegate To: [Andi W. ▼]    │
│ Reason: [Saya cuti sampai   │
│          20 April]           │
│        [Cancel] [Delegate]   │
└──────────────────────────────┘
       ↓
Andi W. mendapat notifikasi
Task berpindah ke Andi W.
History tetap mencatat delegasi
```

---

## Modul 6: Document Finalization

### 6.1 Finalize Flow

```
Semua step workflow APPROVED
       ↓
User (document.finalize permission) klik "Finalize"
       ↓
Backend:
1. Ambil .docx terakhir dari storage
2. Insert tanda tangan gambar pada posisi template tags:
   - Map setiap tag ${TTD_*} ke user yang approve di step terkait
   - Insert gambar signature + nama + jabatan + tanggal
3. Convert .docx → PDF (via Go microservice / OnlyOffice Conversion API)
4. Watermark: "CONTROLLED COPY" atau "MASTER COPY" sesuai config
5. Simpan ke: /{company}/documents/{category}/{year}/{month}/{doc_number}/final.pdf
6. Update document status → 'final', finalized_at, finalized_by
7. Update access_level → 'controlled_copy'
8. Kirim notifikasi ke semua stakeholder
       ↓
Dokumen final tersedia untuk download
```

### 6.2 Signature Placement

Template .docx punya placeholder:
```
Disusun Oleh:           Diperiksa Oleh:         Disetujui Oleh:
${TTD_PENYUSUN}         ${TTD_PEMERIKSA}        ${TTD_PENYETUJU}

${NAMA_PENYUSUN}        ${NAMA_PEMERIKSA}       ${NAMA_PENYETUJU}
${JABATAN_PENYUSUN}     ${JABATAN_PEMERIKSA}    ${JABATAN_PENYETUJU}
${TANGGAL_PENYUSUNAN}   ${TANGGAL_PEMERIKSAAN}  ${TANGGAL_PERSETUJUAN}
```

Backend resolve dari template_tags (linked_step) + workflow_actions (who approved) + users (signature_path, position).

---

## Modul 7: Document Storage & Retrieval

### 7.1 File Storage Structure (Terstruktur)

```
/storage/
├── {company_code}/                      # ASK
│   ├── documents/
│   │   ├── {category_code}/             # QLT, SFT, HR
│   │   │   └── {year}/                  # 2026
│   │   │       └── {month}/             # 04
│   │   │           └── {doc_number}/    # SOP-QMS-001
│   │   │               ├── v1.docx
│   │   │               ├── v2.docx
│   │   │               ├── v3.docx
│   │   │               ├── v3-signed.docx
│   │   │               └── final.pdf
│   │   └── UNCATEGORIZED/               # jika belum ada kategori
│   ├── templates/
│   │   └── {template_code}/             # TPL-SOP-QLT-01
│   │       ├── template-v1.docx
│   │       ├── template-v2.docx
│   │       └── template-v3.docx
│   ├── signatures/
│   │   └── {user_id}/
│   │       └── signature.png
│   ├── avatars/
│   │   └── {user_id}/
│   │       └── avatar.jpg
│   ├── logos/
│   │   └── logo.png
│   └── attachments/
│       └── {year}/{month}/
│           └── {filename}
```

### 7.2 Document Search & Filter

**Search capabilities:**
- Full-text search: title, document_number, description
- Filter by: status, type, category, office, department, section, creator, priority, confidentiality, from_module, date range, effective date
- Sort by: created_at, updated_at, document_number, title, priority
- Pagination: 20 per page default

**Document List View:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Documents                                              [+ New Document]  │
├──────────────────────────────────────────────────────────────────────────┤
│ Search: [____________]  Type: [All▼]  Category: [All▼]  Status: [All▼]  │
│ Office: [All▼]  Dept: [All▼]  Priority: [All▼]                          │
├─────┬──────────────────┬────────────────────┬─────┬─────────┬─────┬─────┤
│ No  │ Doc Number       │ Title              │ 🏷  │ Status  │ ⚡  │ Date │
├─────┼──────────────────┼────────────────────┼─────┼─────────┼─────┼─────┤
│ 1   │ SOP/QMS/001/IV/26│ Prosedur Pengendali│ QLT │ ■ Final │ 🔴  │ Apr13│
│ 2   │ IK/HRD/003/IV/26 │ Instruksi Rekrutmen│ HR  │ ○ Draft │ ⚪  │ Apr12│
│ 3   │ SOP/PROD/002/IV/26│ Prosedur Produksi │ PRD │ ◐ Review│ 🟡  │ Apr11│
│ 4   │ FRM/QMS/001/IV/26│ Form Audit Internal│ QLT │ ■ Final │ ⚪  │ Apr10│
│ 5   │ OPL/PROD/001/III/26│Safety First Area │SFT │ ◑ Appr   │ 🔴  │ Apr 9│
└─────┴──────────────────┴────────────────────┴─────┴─────────┴─────┴──────┘
│ 🏷 = Category color badge    ⚡ = Priority                              │
│ Showing 1-20 of 150                              [< 1 2 3 4 5 ... >]   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Document Detail View

```
┌────────────────────────────────────────────────────────────────────────┐
│ SOP/QMS/001/IV/2026 — Prosedur Pengendalian Dokumen                   │
├────────────────────────────────────────────────────────────────────────┤
│ [Edit] [Submit] [Download .docx] [Download .pdf] [Archive] [Obsolete] │
│                                                                        │
│ ┌─── Info ───────────────────────┐  ┌─── Workflow Status ──────────┐  │
│ │ Status:      ■ In Review       │  │ Step 1: Review ✅ Dina P.    │  │
│ │ Type:        SOP               │  │   "Format sudah sesuai"      │  │
│ │ Category:    🏷 Quality        │  │   14 Apr 10:00               │  │
│ │ Kantor:      KP-JKT           │  │                               │  │
│ │ Dept:        QMS / PD         │  │ Step 2: Approve ⏳ Budi S.   │  │
│ │ Jabatan:     Staff            │  │   Deadline: 18 Apr            │  │
│ │ Version:     v1.2             │  │   [Approve] [Reject]          │  │
│ │ Priority:    🔴 High          │  │   [Delegate]                  │  │
│ │ Kerahasiaan: Internal         │  │                               │  │
│ │ Created:     13 Apr 2026      │  │ Step 3: Sign ⬜ Director     │  │
│ │ Created by:  Ahmad Rizki      │  │                               │  │
│ │ Dari:        AUDIT-2026-003   │  │ Iteration: 1                  │  │
│ │ Hal/Kata:    12 hal, 3450 kata│  └───────────────────────────────┘  │
│ └────────────────────────────────┘                                     │
│                                                                        │
│ ┌─── Tabs ─────────────────────────────────────────────────────────┐   │
│ │ [Preview] [Metadata] [Versions] [Comments] [Relations]          │   │
│ │ [Distribution] [Audit Log]                                       │   │
│ ├──────────────────────────────────────────────────────────────────┤   │
│ │ (Tab content)                                                    │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Modul 8: Audit Trail

### 8.1 Log Events

| Category  | Events                                                                     |
| --------- | -------------------------------------------------------------------------- |
| Document  | created, viewed, edited, downloaded, submitted, resubmitted, approved, rejected, revised, finalized, archived, obsoleted, deleted, restored, distributed |
| Template  | created, updated, deleted, tag_configured                                  |
| Workflow  | created, updated, deleted, step_completed, delegated, escalated            |
| User      | login, logout, created, updated, deleted, role_changed                     |
| Comment   | created, resolved, deleted                                                 |
| System    | settings_changed                                                           |

### 8.2 Audit Log View

```
┌──────────────────────────────────────────────────────────────────────┐
│ Audit Trail                                            [Export CSV]  │
├──────────────────────────────────────────────────────────────────────┤
│ User: [All ▼]  Action: [All ▼]  Office: [All ▼]  Date: [From]-[To] │
├───────────────────┬──────────┬──────────────────────┬──────────┬────┤
│ Timestamp         │ User     │ Action               │ Detail   │Pos │
├───────────────────┼──────────┼──────────────────────┼──────────┼────┤
│ 2026-04-13 14:30  │ Ahmad R. │ document.created     │ SOP/QMS/001│STF│
│ 2026-04-13 15:00  │ Ahmad R. │ document.submitted   │ SOP/QMS/001│STF│
│ 2026-04-14 10:00  │ Dina P.  │ document.approved    │ SOP/QMS/001│STF│
│ 2026-04-14 10:00  │ Budi S.  │ workflow.delegated   │ SOP/QMS/001│MGR│
│ 2026-04-15 09:00  │ Andi W.  │ document.rejected    │ SOP/QMS/001│SPV│
└───────────────────┴──────────┴──────────────────────┴──────────┴────┘
```

---

## Modul 9: Notification System

### 9.1 Notification Types

| Type                        | Channel        | Trigger                                       |
| --------------------------- | -------------- | --------------------------------------------- |
| document.pending_review     | Push + Email   | Dokumen submit ke reviewer/approver            |
| document.pending_approval   | Push + Email   | Step approval aktif                            |
| document.approved           | Push + Email   | Dokumen di-approve (ke creator)                |
| document.rejected           | Push + Email   | Dokumen di-reject (ke creator)                 |
| document.comment            | Push           | Comment baru / mention                         |
| document.revision           | Push + Email   | Diminta revisi (ke creator)                    |
| document.finalized          | Push + Email   | Dokumen finalized                              |
| document.deadline           | Push + Email   | H-1 deadline approval step                    |
| document.overdue            | Push + Email   | Lewat deadline                                 |
| workflow.assigned           | Push + Email   | User di-assign ke workflow step                |
| workflow.delegated          | Push + Email   | Task didelegasikan ke user                     |
| workflow.escalated          | Push + Email   | Eskalasi karena lewat deadline                 |
| system.announcement         | Push           | Pengumuman sistem                              |

### 9.2 Real-time Push & Email

Same as v1 (Laravel Broadcasting + Soketi, queue-based email).

---

## Dashboard

### Main Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│ Dashboard                          Kantor: [KP-JKT ▼]  PT Askara     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   150    │  │    8     │  │    5     │  │    2     │              │
│  │ Total    │  │ Pending  │  │ My Tasks │  │ Overdue  │              │
│  │ Documents│  │ Review   │  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                                                                        │
│  ┌─── My Pending Tasks ────────────────────────────────────────────┐   │
│  │ 1. SOP/QMS/001 — Approve  (due: Apr 18) 🏷QLT ⚡High           │   │
│  │    "Verifikasi kesesuaian dengan standar departemen"             │   │
│  │    Dari: AUDIT-2026-003    [Approve] [Reject] [Delegate]        │   │
│  │                                                                  │   │
│  │ 2. IK/HRD/002 — Review   (due: Apr 20) 🏷HR  ⚡Normal          │   │
│  │    "Periksa format dan isi dokumen"                              │   │
│  │    [Open]                                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─── By Category ─────────┐  ┌─── By Priority ─────────────────┐    │
│  │ 🔵 Quality:  45 (30%)   │  │ 🔴 Critical:  2                  │    │
│  │ 🔴 Safety:   30 (20%)   │  │ 🟠 High:      5                  │    │
│  │ 🟢 HR:       25 (17%)   │  │ ⚪ Normal:    130                │    │
│  │ 🟡 Finance:  20 (13%)   │  │ 🔵 Low:       13                 │    │
│  │ ⚫ Production:30 (20%) │  └────────────────────────────────────┘   │
│  └──────────────────────────┘                                          │
│                                                                        │
│  ┌─── By Status (Chart) ──┐  ┌─── Recent Activity ──────────────┐   │
│  │ ■ Final:    78 (52%)   │  │ Ahmad created SOP/QMS/005         │   │
│  │ ◑ Approved: 45 (30%)  │  │ Dina approved IK/HRD/003          │   │
│  │ ○ Draft:    12 (8%)   │  │ Budi delegated SOP/QMS/001 → Andi │   │
│  │ ◐ Review:   8 (5%)    │  │ Andi rejected FRM/QMS/001         │   │
│  │ ◔ Revision: 3 (2%)    │  │   → returned to Step 1: Review    │   │
│  │ ◆ Other:    4 (3%)    │  │ Director signed STD/QMS/001       │   │
│  └─────────────────────────┘  └──────────────────────────────────┘   │
│                                                                        │
│  ┌─── By Office ───────────────────────────────────────────────────┐  │
│  │ KP-JKT  ████████████████████████ 95                              │  │
│  │ CB-SBY  ████████████ 35                                          │  │
│  │ PB-CKR  ████████ 20                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```
