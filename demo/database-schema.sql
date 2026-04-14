-- ============================================================
-- DMS Application - Complete Database Schema v2
-- PT Askara Internal
-- Database: PostgreSQL 16
-- ============================================================
-- Perubahan dari v1:
-- - company_id diganti kantor (offices). Company → Offices → Departments → Sections
-- - Jabatan (positions) sebagai tabel sendiri
-- - Section sebagai level organisasi baru di bawah department
-- - Kategori dokumen (bukan hanya tag)
-- - Template lebih dinamis (tag statis/dinamis, sumber data, format detail)
-- - Dokumen lebih detail (from_module, from_module_id, dll)
-- - Workflow steps bisa assign ke user/dept/section/jabatan
-- - Decline ke step tertentu, reject dengan alasan wajib/opsional
-- - Penyimpanan file terstruktur: /{module}/{kategori}/{tahun}/{bulan}/
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. COMPANY & ORGANIZATION STRUCTURE
-- ============================================================

-- Perusahaan (top level entity, bisa group/holding)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,           -- "ASK", "GROUP1"
    logo_path VARCHAR(500),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    npwp VARCHAR(50),                           -- NPWP perusahaan
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Kantor (satu perusahaan bisa punya banyak kantor)
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,                 -- "Kantor Pusat Jakarta", "Cabang Surabaya"
    code VARCHAR(50) NOT NULL,                  -- "KP-JKT", "CB-SBY"
    type VARCHAR(50) NOT NULL DEFAULT 'branch', -- 'headquarters', 'branch', 'factory', 'warehouse'
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,           -- kantor default saat user baru
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(company_id, code)
);

-- Departemen (di bawah kantor)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID NOT NULL REFERENCES offices(id),
    name VARCHAR(255) NOT NULL,                 -- "Quality Management System"
    code VARCHAR(50) NOT NULL,                  -- "QMS", "HRD", "PROD"
    parent_id UUID REFERENCES departments(id),  -- hierarki department
    head_user_id UUID,                          -- FK ke users, di-set setelah tabel users dibuat
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(office_id, code)
);

-- Section / Seksi (di bawah departemen, opsional)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,                 -- "Seksi Pengendalian Dokumen"
    code VARCHAR(50) NOT NULL,                  -- "PD", "QC", "QA"
    head_user_id UUID,                          -- FK ke users, di-set setelah tabel users dibuat
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(department_id, code)
);

-- Jabatan / Posisi (tabel master, bisa dipakai di banyak tempat)
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),  -- jabatan per perusahaan
    name VARCHAR(255) NOT NULL,                 -- "Manager", "Supervisor", "Staff", "Director"
    code VARCHAR(50) NOT NULL,                  -- "MGR", "SPV", "STF", "DIR"
    level INT NOT NULL DEFAULT 0,               -- level hierarki (0=lowest, 10=highest). Dipakai untuk urutan approval
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(company_id, code)
);

-- ============================================================
-- 2. USER & ACCESS MANAGEMENT
-- ============================================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),   -- NULL = system role
    name VARCHAR(100) NOT NULL,                 -- 'super_admin', 'admin_company', 'creator', 'reviewer', 'approver', 'viewer'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,            -- role bawaan sistem, tidak bisa dihapus
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, name)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    office_id UUID NOT NULL REFERENCES offices(id),
    department_id UUID REFERENCES departments(id),
    section_id UUID REFERENCES sections(id),
    position_id UUID REFERENCES positions(id),

    employee_id VARCHAR(100),                   -- NIK / nomor karyawan
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Info tambahan
    join_date DATE,                             -- tanggal bergabung
    signature_path VARCHAR(500),                -- path ke gambar tanda tangan (.png transparan)
    signature_uploaded_at TIMESTAMP,
    avatar_path VARCHAR(500),

    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_office ON users(office_id);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_section ON users(section_id);
CREATE INDEX idx_users_position ON users(position_id);

-- FK dari departments & sections ke users (head)
ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_user_id) REFERENCES users(id);
ALTER TABLE sections ADD CONSTRAINT fk_section_head FOREIGN KEY (head_user_id) REFERENCES users(id);

-- Relasi user ↔ role (many-to-many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Permission definitions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,          -- 'document.create', 'document.edit', dll
    module VARCHAR(100) NOT NULL,               -- 'document', 'template', 'workflow', 'user', 'company', 'office'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relasi role ↔ permission
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Session / Token
CREATE TABLE personal_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    abilities TEXT,                              -- JSON array
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. DOCUMENT CATEGORIES & TYPES
-- ============================================================

-- Kategori dokumen (level 1, wajib)
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,                 -- "Quality", "Safety", "HR", "Finance", "Production"
    code VARCHAR(50) NOT NULL,                  -- "QLT", "SFT", "HR", "FIN", "PRD"
    description TEXT,
    color VARCHAR(7),                           -- hex color "#FF5733" untuk UI badge
    icon VARCHAR(100),                          -- icon name
    parent_id UUID REFERENCES document_categories(id),  -- sub-kategori
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    UNIQUE(company_id, code)
);

-- Tipe dokumen (SOP, IK, STD, FRM, OPL)
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,                 -- 'Standard Operating Procedure'
    code VARCHAR(50) NOT NULL UNIQUE,           -- 'SOP', 'IK', 'STD', 'FRM', 'OPL'
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. DOCUMENT TEMPLATES (DYNAMIC)
-- ============================================================

CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    category_id UUID REFERENCES document_categories(id),

    name VARCHAR(255) NOT NULL,                 -- "Template SOP Quality v3"
    code VARCHAR(50),                           -- "TPL-SOP-QLT-01"
    description TEXT,

    -- File template .docx
    file_path VARCHAR(500) NOT NULL,            -- path ke file .docx template
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),                      -- SHA-256 untuk integrity check

    -- Template version
    version INT DEFAULT 1,
    version_notes TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'active',        -- 'draft', 'active', 'archived'

    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_templates_company ON document_templates(company_id);
CREATE INDEX idx_templates_type ON document_templates(document_type_id);

-- ============================================================
-- 4b. TEMPLATE TAGS (DYNAMIC TAG DEFINITION)
-- ============================================================
-- Setiap template punya daftar tag yang bisa diisi.
-- Tag bisa STATIS (user isi manual) atau DINAMIS (ambil dari sumber data).

CREATE TABLE template_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,

    -- Identifikasi tag
    tag_key VARCHAR(100) NOT NULL,              -- key tanpa ${}: "NOMOR_DOKUMEN", "DEPARTEMEN"
    tag_placeholder VARCHAR(150) NOT NULL,      -- placeholder lengkap: "${NOMOR_DOKUMEN}"
    label VARCHAR(255) NOT NULL,                -- label untuk UI form: "Nomor Dokumen"
    description TEXT,                           -- tooltip/help text

    -- Tipe & Format
    data_type VARCHAR(50) NOT NULL DEFAULT 'text',
    -- 'text'         = input text biasa
    -- 'textarea'     = text area (multi-line)
    -- 'number'       = angka
    -- 'date'         = date picker → format sesuai date_format
    -- 'datetime'     = datetime picker
    -- 'select'       = dropdown pilihan dari options / data source
    -- 'multi_select' = multiple selection
    -- 'image'        = gambar (logo, ttd, foto)
    -- 'user'         = user picker (ambil dari tabel users)
    -- 'department'   = department picker
    -- 'section'      = section picker
    -- 'position'     = position/jabatan picker
    -- 'office'       = office picker
    -- 'auto'         = otomatis diisi sistem (nomor dokumen, tanggal, dll)
    -- 'table'        = tabel dinamis (baris bisa ditambah)
    -- 'signature'    = tempat tanda tangan

    -- Sumber Data (untuk tag DINAMIS)
    source_type VARCHAR(50) DEFAULT 'static',
    -- 'static'       = user isi manual / pilih dari options
    -- 'database'     = ambil dari tabel database (query)
    -- 'api'          = ambil dari external API
    -- 'auto_generate'= di-generate otomatis oleh sistem
    -- 'current_user' = dari data user yang sedang login
    -- 'parent_doc'   = dari dokumen parent (jika ada relasi)

    source_config JSONB,
    -- Contoh untuk source_type = 'database':
    -- {
    --   "table": "departments",
    --   "value_field": "id",
    --   "display_field": "name",
    --   "filter": {"office_id": "${CURRENT_OFFICE_ID}"},
    --   "order_by": "name ASC"
    -- }
    --
    -- Contoh untuk source_type = 'api':
    -- {
    --   "url": "/api/master/products",
    --   "method": "GET",
    --   "value_field": "id",
    --   "display_field": "product_name",
    --   "params": {"category": "raw_material"}
    -- }
    --
    -- Contoh untuk source_type = 'auto_generate':
    -- {
    --   "generator": "document_number",
    --   "format": "{PREFIX}-{DEPT}-{SEQ:3}"
    -- }
    --
    -- Contoh untuk source_type = 'current_user':
    -- {
    --   "field": "name"               -- ambil field 'name' dari current user
    -- }
    --
    -- Contoh untuk source_type = 'static' dengan options:
    -- {
    --   "options": [
    --     {"value": "critical", "label": "Critical"},
    --     {"value": "major", "label": "Major"},
    --     {"value": "minor", "label": "Minor"}
    --   ]
    -- }

    -- Format output
    format_pattern VARCHAR(255),
    -- Contoh:
    -- date_format: "dd MMMM yyyy" → "13 April 2026"
    -- number_format: "#,##0.00" → "1,234.56"
    -- text_format: "UPPER" → uppercase
    -- image_format: "150x50" → width x height px

    default_value TEXT,                          -- nilai default
    placeholder_text VARCHAR(255),              -- placeholder di form input

    -- Validasi
    is_required BOOLEAN DEFAULT FALSE,
    is_readonly BOOLEAN DEFAULT FALSE,          -- user tidak bisa edit (auto-filled)
    is_hidden BOOLEAN DEFAULT FALSE,            -- tidak tampil di form tapi tetap diisi
    min_length INT,
    max_length INT,
    min_value NUMERIC,
    max_value NUMERIC,
    validation_regex VARCHAR(500),              -- regex pattern untuk validasi
    validation_message VARCHAR(500),            -- pesan error validasi

    -- Layout
    group_name VARCHAR(100),                    -- grouping di form: "Header", "Content", "Footer", "Signatures"
    group_order INT DEFAULT 0,
    field_order INT DEFAULT 0,                  -- urutan field dalam group
    col_span INT DEFAULT 12,                    -- bootstrap grid (1-12), untuk layout kolom

    -- Table config (jika data_type = 'table')
    table_config JSONB,
    -- Contoh:
    -- {
    --   "columns": [
    --     {"key": "no",        "label": "No",         "type": "auto_increment", "width": "5%"},
    --     {"key": "kegiatan",  "label": "Kegiatan",   "type": "text",          "width": "30%"},
    --     {"key": "metode",    "label": "Metode",     "type": "text",          "width": "25%"},
    --     {"key": "pic",       "label": "PIC",        "type": "user",          "width": "20%"},
    --     {"key": "deadline",  "label": "Deadline",   "type": "date",          "width": "20%"}
    --   ],
    --   "min_rows": 1,
    --   "max_rows": 50,
    --   "allow_add": true,
    --   "allow_delete": true
    -- }

    -- Signature config (jika data_type = 'signature')
    signature_config JSONB,
    -- Contoh:
    -- {
    --   "position": "footer",          -- "header", "footer", "inline"
    --   "label_above": "Disetujui oleh:",
    --   "label_below": "({NAMA})",
    --   "width": 100,
    --   "height": 40,
    --   "linked_step": "approve"        -- link ke workflow step type
    -- }

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_id, tag_key)
);

CREATE INDEX idx_template_tags_template ON template_tags(template_id);
CREATE INDEX idx_template_tags_source ON template_tags(source_type);

-- ============================================================
-- 5. DOCUMENT NUMBERING
-- ============================================================

CREATE TABLE document_numbering (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    office_id UUID REFERENCES offices(id),          -- NULL = semua kantor
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    category_id UUID REFERENCES document_categories(id),  -- NULL = semua kategori
    department_id UUID REFERENCES departments(id),  -- NULL = semua dept

    -- Format
    prefix VARCHAR(50),                         -- "SOP", "IK"
    separator VARCHAR(10) DEFAULT '/',          -- pemisah: "/", "-", "."
    format VARCHAR(255) NOT NULL,
    -- Tokens yang tersedia:
    -- {PREFIX}      = prefix field
    -- {TYPE}        = document_types.code (SOP, IK)
    -- {CAT}         = document_categories.code (QLT, SFT)
    -- {DEPT}        = departments.code (QMS, HRD)
    -- {SECTION}     = sections.code (PD, QC)
    -- {OFFICE}      = offices.code (KP-JKT)
    -- {COMPANY}     = companies.code (ASK)
    -- {SEQ:N}       = sequence number zero-padded N digit
    -- {YEAR}        = tahun 4 digit (2026)
    -- {YEAR2}       = tahun 2 digit (26)
    -- {MONTH}       = bulan 2 digit (04)
    -- {ROMAN_MONTH} = bulan romawi (IV)
    --
    -- Contoh: "{TYPE}/{DEPT}/{SEQ:3}/{ROMAN_MONTH}/{YEAR}" → "SOP/QMS/001/IV/2026"

    current_sequence INT DEFAULT 0,
    reset_period VARCHAR(20),                   -- 'yearly', 'monthly', NULL (never reset)
    last_reset_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, office_id, document_type_id, category_id, department_id)
);

-- ============================================================
-- 6. DOCUMENTS (DETAIL)
-- ============================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Organisasi
    company_id UUID NOT NULL REFERENCES companies(id),
    office_id UUID NOT NULL REFERENCES offices(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    section_id UUID REFERENCES sections(id),

    -- Tipe & Kategori
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    category_id UUID NOT NULL REFERENCES document_categories(id),
    template_id UUID REFERENCES document_templates(id),

    -- Identifikasi
    document_number VARCHAR(100) NOT NULL,      -- "SOP/QMS/001/IV/2026"
    title VARCHAR(500) NOT NULL,
    description TEXT,

    -- Asal / Referensi modul (from_module)
    from_module VARCHAR(100),                   -- modul asal: 'audit', 'capa', 'complaint', 'change_request', 'manual', NULL
    from_module_id UUID,                        -- ID record di modul asal
    from_module_number VARCHAR(100),            -- nomor referensi di modul asal: "CAPA-2026-001"

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- 'draft'        = sedang ditulis
    -- 'in_review'    = sudah submit, sedang di-review/approve
    -- 'revision'     = dikembalikan untuk revisi dari step tertentu
    -- 'approved'     = sudah di-approve semua level
    -- 'final'        = sudah di-finalize (PDF generated, tanda tangan embedded)
    -- 'obsolete'     = tidak berlaku (digantikan versi baru)
    -- 'archived'     = diarsipkan

    -- Revision info (saat status = 'revision')
    revision_from_step_id UUID,                 -- step mana yang mengembalikan ke revision
    revision_notes TEXT,                        -- catatan revisi dari reviewer/approver
    revision_count INT DEFAULT 0,               -- berapa kali di-revisi

    -- Version tracking
    current_version INT DEFAULT 1,
    major_version INT DEFAULT 1,                -- versi major (saat di-finalize: 1.0 → 2.0)
    minor_version INT DEFAULT 0,                -- versi minor (setiap edit: 1.0 → 1.1)

    -- Prioritas & Klasifikasi
    priority VARCHAR(20) DEFAULT 'normal',      -- 'low', 'normal', 'high', 'critical'
    confidentiality VARCHAR(50) DEFAULT 'internal',
    -- 'public'       = bisa diakses semua orang
    -- 'internal'     = hanya internal perusahaan
    -- 'confidential' = hanya departemen terkait
    -- 'restricted'   = hanya orang tertentu

    -- Access level (untuk distribusi)
    access_level VARCHAR(50) DEFAULT 'raw',
    -- 'master_copy'      = dokumen asli, hanya view di OnlyOffice
    -- 'controlled_copy'  = view + download, ada watermark "CONTROLLED COPY"
    -- 'uncontrolled_copy'= download tanpa kontrol
    -- 'raw'              = full access (draft/editing)

    -- Metadata (tag values yang diisi user, disimpan juga sebagai JSONB)
    metadata JSONB,
    -- Contoh:
    -- {
    --   "NOMOR_DOKUMEN": "SOP/QMS/001/IV/2026",
    --   "DEPARTEMEN": "Quality Management",
    --   "TANGGAL_TERBIT": "2026-04-13",
    --   "DISUSUN_OLEH": "Ahmad Rizki",
    --   "TABLE_REVISI": [
    --     {"no": 1, "tanggal": "2026-04-01", "perubahan": "Initial release", "oleh": "AR"}
    --   ]
    -- }

    -- File references
    draft_file_path VARCHAR(500),               -- path ke .docx terbaru (working copy)
    final_file_path VARCHAR(500),               -- path ke .pdf final (signed)
    final_docx_path VARCHAR(500),               -- path ke .docx final (signed, before PDF convert)

    -- OnlyOffice
    onlyoffice_key VARCHAR(255),                -- unique key untuk OnlyOffice editor session
    onlyoffice_lock_by UUID REFERENCES users(id), -- siapa yang sedang edit
    onlyoffice_lock_at TIMESTAMP,

    -- Tanggal penting
    submitted_at TIMESTAMP,                     -- kapan pertama kali di-submit
    approved_at TIMESTAMP,                      -- kapan di-approve final
    finalized_at TIMESTAMP,                     -- kapan di-finalize (PDF generated)
    effective_date DATE,                        -- tanggal berlaku
    review_date DATE,                           -- tanggal review ulang (periodic)
    expiry_date DATE,                           -- tanggal kadaluarsa (jika ada)
    obsoleted_at TIMESTAMP,                     -- kapan di-obsolete
    archived_at TIMESTAMP,                      -- kapan diarsipkan

    -- Relasi dokumen
    parent_document_id UUID REFERENCES documents(id),   -- jika ini revisi dari dokumen lain
    supersedes_document_id UUID REFERENCES documents(id), -- dokumen yang digantikan

    -- Pages & stats
    page_count INT,                             -- jumlah halaman
    word_count INT,                             -- jumlah kata

    -- User tracking
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    submitted_by UUID REFERENCES users(id),
    finalized_by UUID REFERENCES users(id),
    obsoleted_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,

    UNIQUE(company_id, document_number)
);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_office ON documents(office_id);
CREATE INDEX idx_documents_department ON documents(department_id);
CREATE INDEX idx_documents_section ON documents(section_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_documents_from_module ON documents(from_module, from_module_id);
CREATE INDEX idx_documents_effective ON documents(effective_date);
CREATE INDEX idx_documents_priority ON documents(priority);

-- ============================================================
-- 6b. DOCUMENT VERSIONS
-- ============================================================

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    version_number INT NOT NULL,
    major_version INT NOT NULL,
    minor_version INT NOT NULL,

    -- File info
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_hash VARCHAR(64),                      -- SHA-256

    -- Version metadata
    change_summary TEXT,                        -- catatan perubahan
    change_type VARCHAR(50),                    -- 'initial', 'edit', 'revision', 'final'
    metadata_snapshot JSONB,                    -- snapshot metadata saat versi ini dibuat

    -- Source
    source VARCHAR(50) DEFAULT 'editor',        -- 'editor' (OnlyOffice), 'upload', 'template', 'system'
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_doc_versions_document ON document_versions(document_id);

-- ============================================================
-- 6c. DOCUMENT TAGS (untuk label/tagging bebas)
-- ============================================================

CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, tag_name)
);

-- ============================================================
-- 6d. DOCUMENT RELATIONS
-- ============================================================

CREATE TABLE document_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    related_document_id UUID NOT NULL REFERENCES documents(id),
    relation_type VARCHAR(50) NOT NULL,         -- 'references', 'supersedes', 'related_to', 'attachment', 'parent_child'
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, related_document_id, relation_type)
);

-- ============================================================
-- 6e. DOCUMENT DISTRIBUTION (siapa yang boleh akses dokumen final)
-- ============================================================

CREATE TABLE document_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    distribution_type VARCHAR(50) NOT NULL,     -- 'user', 'department', 'section', 'office', 'position', 'all'
    target_id UUID,                             -- ID user/dept/section/office/position (NULL jika 'all')
    access_level VARCHAR(50) NOT NULL,          -- 'master_copy', 'controlled_copy', 'uncontrolled_copy'
    distributed_by UUID NOT NULL REFERENCES users(id),
    distributed_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,                  -- user sudah acknowledge terima
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_dist_document ON document_distributions(document_id);
CREATE INDEX idx_doc_dist_target ON document_distributions(distribution_type, target_id);

-- ============================================================
-- 7. WORKFLOW ENGINE
-- ============================================================

-- Workflow definition (template workflow per document type per dept)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    office_id UUID REFERENCES offices(id),          -- NULL = semua kantor
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    category_id UUID REFERENCES document_categories(id),  -- NULL = semua kategori
    department_id UUID REFERENCES departments(id),  -- NULL = semua dept

    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_workflows_company ON workflows(company_id);
CREATE INDEX idx_workflows_type ON workflows(document_type_id);

-- Steps dalam workflow
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INT NOT NULL,                    -- urutan: 1, 2, 3
    name VARCHAR(255) NOT NULL,                 -- "Review by QMS Manager", "Approval by Director"

    step_type VARCHAR(50) NOT NULL,
    -- 'review'   = bisa comment & edit dokumen, lalu forward atau reject
    -- 'approve'  = approve atau reject (tidak bisa edit)
    -- 'sign'     = final approval + embed tanda tangan
    -- 'acknowledge' = hanya acknowledge (terima/baca), tidak bisa reject

    -- === ASSIGNEE: siapa yang handle step ini ===
    assignee_type VARCHAR(50) NOT NULL,
    -- 'user'            = user spesifik (assignee_user_id)
    -- 'role'            = semua user dengan role tertentu (assignee_role_id)
    -- 'department_head' = head of department dokumen
    -- 'section_head'    = head of section dokumen
    -- 'position'        = semua user dengan jabatan tertentu (assignee_position_id)
    -- 'department'      = semua user di departemen tertentu (assignee_department_id)
    -- 'section'         = semua user di section tertentu (assignee_section_id)

    assignee_user_id UUID REFERENCES users(id),
    assignee_role_id UUID REFERENCES roles(id),
    assignee_position_id UUID REFERENCES positions(id),
    assignee_department_id UUID REFERENCES departments(id),
    assignee_section_id UUID REFERENCES sections(id),

    -- === PARALLEL APPROVAL ===
    is_parallel BOOLEAN DEFAULT FALSE,          -- TRUE = semua/sebagian assignee harus approve
    required_approvals INT DEFAULT 1,           -- jumlah approval minimum (untuk parallel)
    -- Jika is_parallel=TRUE dan required_approvals=0 → semua harus approve

    -- === REJECT/DECLINE BEHAVIOR ===
    on_reject_action VARCHAR(50) DEFAULT 'to_creator',
    -- 'to_creator'     = kembali ke pembuat dokumen (draft/revision)
    -- 'to_step'        = kembali ke step tertentu (reject_to_step_id)
    -- 'to_previous'    = kembali ke step sebelumnya
    -- 'cancel'         = batalkan workflow

    reject_to_step_id UUID REFERENCES workflow_steps(id), -- step tujuan saat reject (jika on_reject_action = 'to_step')
    reject_comment_required BOOLEAN DEFAULT TRUE,  -- apakah komentar wajib saat reject

    -- === APPROVE BEHAVIOR ===
    approve_comment_required BOOLEAN DEFAULT FALSE, -- apakah komentar wajib saat approve (opsional)

    -- === DEADLINE ===
    deadline_days INT,                          -- deadline dalam hari kerja (NULL = tanpa deadline)
    escalation_action VARCHAR(50),              -- 'notify_head', 'auto_approve', 'notify_admin', NULL
    escalation_after_days INT,                  -- eskalasi setelah N hari lewat deadline

    -- === PERMISSIONS ===
    can_edit BOOLEAN DEFAULT FALSE,             -- step ini boleh edit dokumen di OnlyOffice
    can_comment BOOLEAN DEFAULT TRUE,
    can_delegate BOOLEAN DEFAULT FALSE,         -- bisa delegasi ke orang lain

    -- Instruksi
    instructions TEXT,                          -- instruksi untuk assignee: "Periksa format dan isi dokumen"

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workflow_id, step_order)
);

-- ============================================================
-- 7b. WORKFLOW INSTANCES (running workflows)
-- ============================================================

CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    current_step_id UUID REFERENCES workflow_steps(id),
    iteration INT DEFAULT 1,                    -- iterasi ke berapa (jika re-submit setelah revision)

    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- 'active'    = sedang berjalan
    -- 'completed' = selesai (semua step approved)
    -- 'rejected'  = ditolak dan tidak dilanjutkan
    -- 'cancelled' = dibatalkan oleh user/admin
    -- 'revision'  = dikembalikan untuk revisi

    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by UUID REFERENCES users(id),
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wf_instances_document ON workflow_instances(document_id);
CREATE INDEX idx_wf_instances_status ON workflow_instances(status);

-- Step instances (tracking per step per dokumen)
CREATE TABLE workflow_step_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    step_order INT NOT NULL,                    -- copy dari workflow_steps.step_order untuk sorting

    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- 'pending'    = belum sampai step ini
    -- 'active'     = sedang menunggu action
    -- 'approved'   = disetujui
    -- 'rejected'   = ditolak
    -- 'skipped'    = dilewati (admin skip)
    -- 'returned'   = dikembalikan (decline to this step)

    -- Assignee resolved (snapshot saat step aktif)
    assigned_users JSONB,                       -- [{user_id, name, email, position}] snapshot siapa yang di-assign
    approval_count INT DEFAULT 0,               -- jumlah approve yang sudah masuk
    rejection_count INT DEFAULT 0,              -- jumlah reject yang sudah masuk
    required_approvals INT DEFAULT 1,           -- copy dari step definition

    -- Timing
    deadline_at TIMESTAMP,
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wf_step_inst_instance ON workflow_step_instances(workflow_instance_id);
CREATE INDEX idx_wf_step_inst_status ON workflow_step_instances(status);
CREATE INDEX idx_wf_step_inst_deadline ON workflow_step_instances(deadline_at) WHERE status = 'active';

-- ============================================================
-- 7c. WORKFLOW ACTIONS (setiap aksi yang dilakukan)
-- ============================================================

CREATE TABLE workflow_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
    workflow_step_instance_id UUID NOT NULL REFERENCES workflow_step_instances(id),
    user_id UUID NOT NULL REFERENCES users(id),

    action VARCHAR(50) NOT NULL,
    -- 'approve'    = setuju
    -- 'reject'     = tolak (kembali ke step / creator)
    -- 'revise'     = minta revisi (mirip reject tapi lebih soft)
    -- 'comment'    = hanya komentar (tidak mengubah status)
    -- 'delegate'   = delegasi ke user lain
    -- 'skip'       = skip step (admin only)
    -- 'escalate'   = eskalasi manual

    -- Komentar / Alasan (wajib atau opsional tergantung step config)
    comment TEXT,
    is_comment_public BOOLEAN DEFAULT TRUE,     -- apakah komentar terlihat oleh pembuat dokumen

    -- Signature (untuk step_type = 'sign' atau 'approve')
    signature_used BOOLEAN DEFAULT FALSE,
    signature_path VARCHAR(500),                -- path tanda tangan yang dipakai

    -- Delegasi (jika action = 'delegate')
    delegated_to UUID REFERENCES users(id),
    delegation_reason TEXT,

    -- Metadata
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,                             -- data tambahan

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wf_actions_instance ON workflow_actions(workflow_instance_id);
CREATE INDEX idx_wf_actions_step ON workflow_actions(workflow_step_instance_id);
CREATE INDEX idx_wf_actions_user ON workflow_actions(user_id);
CREATE INDEX idx_wf_actions_action ON workflow_actions(action);

-- ============================================================
-- 8. COMMENTS & ANNOTATIONS
-- ============================================================

CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    document_version_id UUID REFERENCES document_versions(id),
    workflow_step_instance_id UUID REFERENCES workflow_step_instances(id),  -- comment terkait step mana
    user_id UUID NOT NULL REFERENCES users(id),
    parent_comment_id UUID REFERENCES document_comments(id),  -- reply

    content TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general',
    -- 'general'     = komentar umum
    -- 'review'      = komentar review (dari step review)
    -- 'revision'    = permintaan revisi spesifik
    -- 'approval'    = catatan saat approve
    -- 'rejection'   = alasan reject
    -- 'onlyoffice'  = dari annotations OnlyOffice

    -- Tracking
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    is_internal BOOLEAN DEFAULT FALSE,          -- TRUE = hanya visible untuk reviewer/approver

    -- OnlyOffice annotation reference
    annotation_id VARCHAR(255),                 -- OnlyOffice annotation ID
    page_number INT,                            -- halaman terkait
    position_data JSONB,                        -- posisi di dokumen (x, y, dll)

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_doc_comments_document ON document_comments(document_id);
CREATE INDEX idx_doc_comments_step ON document_comments(workflow_step_instance_id);
CREATE INDEX idx_doc_comments_user ON document_comments(user_id);

-- ============================================================
-- 9. AUDIT TRAIL
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    office_id UUID REFERENCES offices(id),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),                     -- denormalized
    user_email VARCHAR(255),                    -- denormalized
    user_position VARCHAR(255),                 -- denormalized jabatan

    -- What
    action VARCHAR(100) NOT NULL,
    -- 'document.created', 'document.edited', 'document.viewed',
    -- 'document.downloaded', 'document.submitted', 'document.approved',
    -- 'document.rejected', 'document.revised', 'document.finalized',
    -- 'document.archived', 'document.obsoleted', 'document.restored',
    -- 'document.deleted', 'document.distributed',
    -- 'template.created', 'template.updated', 'template.deleted',
    -- 'workflow.created', 'workflow.updated', 'workflow.action',
    -- 'user.login', 'user.logout', 'user.created', 'user.updated',
    -- 'comment.created', 'comment.resolved',
    -- 'system.setting_changed'

    -- Target
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(500),                   -- denormalized

    -- Context
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_company ON audit_logs(company_id);
CREATE INDEX idx_audit_office ON audit_logs(office_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),

    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    -- 'document.pending_review', 'document.pending_approval',
    -- 'document.approved', 'document.rejected', 'document.revision',
    -- 'document.comment', 'document.finalized', 'document.deadline',
    -- 'workflow.assigned', 'workflow.escalated', 'workflow.delegated',
    -- 'system.announcement'

    -- Reference
    entity_type VARCHAR(100),
    entity_id UUID,
    action_url VARCHAR(500),                    -- deep link

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Delivery
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notif_created ON notifications(created_at);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(100) NOT NULL,
    channel_email BOOLEAN DEFAULT TRUE,
    channel_push BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ============================================================
-- 11. FILE STORAGE (terstruktur per modul/kategori/tahun/bulan)
-- ============================================================
--
-- Struktur folder penyimpanan:
-- /{company_code}/{module}/{category_code}/{year}/{month}/{document_number}/
--
-- Contoh:
-- /ASK/documents/QLT/2026/04/SOP-QMS-001/v1.docx
-- /ASK/documents/QLT/2026/04/SOP-QMS-001/v2.docx
-- /ASK/documents/QLT/2026/04/SOP-QMS-001/final.pdf
-- /ASK/templates/SOP/template-sop-quality-v3.docx
-- /ASK/signatures/user-{id}/signature.png
-- /ASK/avatars/user-{id}/avatar.jpg
-- /ASK/logos/logo.png

CREATE TABLE file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),

    -- File info
    file_name VARCHAR(500) NOT NULL,            -- nama file di storage: "v1.docx"
    original_name VARCHAR(500) NOT NULL,        -- nama file asli dari upload: "dokumen sop quality.docx"
    file_path VARCHAR(500) NOT NULL,            -- full relative path: "ASK/documents/QLT/2026/04/SOP-QMS-001/v1.docx"
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),                      -- SHA-256

    -- Organisasi penyimpanan
    module VARCHAR(50) NOT NULL,                -- 'documents', 'templates', 'signatures', 'avatars', 'logos', 'attachments'
    category_code VARCHAR(50),                  -- category code untuk path: "QLT", "SFT"
    storage_year INT,                           -- tahun penyimpanan: 2026
    storage_month INT,                          -- bulan penyimpanan: 4

    -- Relasi ke entity
    entity_type VARCHAR(100),                   -- 'document', 'document_version', 'template', 'user', 'company'
    entity_id UUID,

    -- Storage backend
    storage_type VARCHAR(50) DEFAULT 'local',   -- 'local', 'minio', 's3'
    storage_bucket VARCHAR(100),                -- bucket name jika minio/s3

    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_file_entity ON file_storage(entity_type, entity_id);
CREATE INDEX idx_file_hash ON file_storage(file_hash);
CREATE INDEX idx_file_module ON file_storage(module, category_code, storage_year, storage_month);

-- ============================================================
-- 12. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),   -- NULL = global setting
    office_id UUID REFERENCES offices(id),      -- NULL = company-wide
    key VARCHAR(255) NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',          -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(company_id, office_id, key)
);

-- ============================================================
-- 13. SEED DATA
-- ============================================================

-- Default Roles
INSERT INTO roles (company_id, name, display_name, description, is_system) VALUES
(NULL, 'super_admin',    'Super Admin',      'Full access ke seluruh sistem dan semua company', TRUE),
(NULL, 'admin_company',  'Admin Company',    'Admin untuk satu company', TRUE),
(NULL, 'admin_office',   'Admin Kantor',     'Admin untuk satu kantor', TRUE),
(NULL, 'creator',        'Document Creator', 'Bisa membuat dan mengedit dokumen', TRUE),
(NULL, 'reviewer',       'Reviewer',         'Bisa me-review dan memberikan comment', TRUE),
(NULL, 'approver',       'Approver',         'Bisa meng-approve atau reject dokumen', TRUE),
(NULL, 'viewer',         'Viewer',           'Hanya bisa melihat dokumen', TRUE);

-- Default Permissions
INSERT INTO permissions (name, module, description) VALUES
-- Document
('document.create',     'document', 'Membuat dokumen baru'),
('document.edit',       'document', 'Mengedit dokumen'),
('document.view',       'document', 'Melihat dokumen'),
('document.delete',     'document', 'Menghapus dokumen'),
('document.download',   'document', 'Mengunduh dokumen'),
('document.submit',     'document', 'Submit dokumen untuk review'),
('document.review',     'document', 'Me-review dokumen'),
('document.approve',    'document', 'Meng-approve dokumen'),
('document.reject',     'document', 'Menolak dokumen'),
('document.finalize',   'document', 'Finalize dokumen (generate PDF)'),
('document.archive',    'document', 'Mengarsipkan dokumen'),
('document.distribute', 'document', 'Mendistribusikan dokumen final'),
-- Template
('template.create',     'template', 'Membuat template baru'),
('template.edit',       'template', 'Mengedit template'),
('template.view',       'template', 'Melihat template'),
('template.delete',     'template', 'Menghapus template'),
-- Workflow
('workflow.create',     'workflow', 'Membuat workflow baru'),
('workflow.edit',       'workflow', 'Mengedit workflow'),
('workflow.view',       'workflow', 'Melihat workflow'),
('workflow.delete',     'workflow', 'Menghapus workflow'),
-- User Management
('user.create',         'user', 'Membuat user baru'),
('user.edit',           'user', 'Mengedit user'),
('user.view',           'user', 'Melihat data user'),
('user.delete',         'user', 'Menghapus user'),
('user.assign_role',    'user', 'Assign role ke user'),
-- Company & Office
('company.create',      'company', 'Membuat company baru'),
('company.edit',        'company', 'Mengedit company'),
('company.view',        'company', 'Melihat data company'),
('office.create',       'office', 'Membuat kantor baru'),
('office.edit',         'office', 'Mengedit kantor'),
('office.view',         'office', 'Melihat data kantor'),
-- Audit
('audit.view',          'audit', 'Melihat audit log'),
('audit.export',        'audit', 'Export audit log'),
-- Notification
('notification.manage', 'notification', 'Manage notification settings');

-- Default Document Types
INSERT INTO document_types (name, code, description, sort_order) VALUES
('Standard Operating Procedure', 'SOP', 'Prosedur operasional standar', 1),
('Instruksi Kerja',              'IK',  'Instruksi kerja detail', 2),
('Standar',                      'STD', 'Dokumen standar/spesifikasi', 3),
('Formulir',                     'FRM', 'Formulir/form yang perlu diisi', 4),
('One Point Lessons',            'OPL', 'Pelajaran singkat satu halaman', 5);
