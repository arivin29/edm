# DMS API Endpoints Design v2

## Base URL: `/api/v1`

## Authentication Headers
```
Authorization: Bearer {token}
X-Company-Id: {company_uuid}
X-Office-Id: {office_uuid}           // kantor aktif user
Content-Type: application/json
```

---

## 1. Authentication

| Method | Endpoint                  | Description              | Auth |
| ------ | ------------------------- | ------------------------ | ---- |
| POST   | `/auth/login`             | Login                    | No   |
| POST   | `/auth/logout`            | Logout                   | Yes  |
| POST   | `/auth/refresh`           | Refresh token            | Yes  |
| GET    | `/auth/me`                | Get current user profile | Yes  |
| PUT    | `/auth/password`          | Change password          | Yes  |
| POST   | `/auth/forgot-password`   | Request password reset   | No   |
| POST   | `/auth/reset-password`    | Reset password with token| No   |

### POST `/auth/login`
```json
// Request
{
  "email": "ahmad@askara.com",
  "password": "secret123"
}

// Response 200
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ahmad Rizki",
      "email": "ahmad@askara.com",
      "employee_id": "ASK-001",
      "company": { "id": "uuid", "name": "PT Askara Internal", "code": "ASK" },
      "office": { "id": "uuid", "name": "Kantor Pusat Jakarta", "code": "KP-JKT" },
      "department": { "id": "uuid", "name": "Quality Management", "code": "QMS" },
      "section": { "id": "uuid", "name": "Pengendalian Dokumen", "code": "PD" },
      "position": { "id": "uuid", "name": "Staff", "code": "STF", "level": 1 },
      "roles": ["creator", "reviewer"],
      "permissions": ["document.create", "document.edit", "document.view", "document.submit"]
    },
    "token": "eyJ...",
    "expires_at": "2026-04-14T00:00:00Z"
  }
}
```

---

## 2. Companies

| Method | Endpoint                    | Description          | Permission       |
| ------ | --------------------------- | -------------------- | ---------------- |
| GET    | `/companies`                | List companies       | company.view     |
| POST   | `/companies`                | Create company       | company.create   |
| GET    | `/companies/{id}`           | Get company detail   | company.view     |
| PUT    | `/companies/{id}`           | Update company       | company.edit     |
| DELETE | `/companies/{id}`           | Soft delete company  | super_admin      |
| POST   | `/companies/{id}/logo`      | Upload company logo  | company.edit     |

---

## 3. Offices (Kantor)

| Method | Endpoint                           | Description             | Permission     |
| ------ | ---------------------------------- | ----------------------- | -------------- |
| GET    | `/offices`                         | List offices            | office.view    |
| POST   | `/offices`                         | Create office           | office.create  |
| GET    | `/offices/{id}`                    | Get office detail       | office.view    |
| PUT    | `/offices/{id}`                    | Update office           | office.edit    |
| DELETE | `/offices/{id}`                    | Soft delete office      | super_admin    |
| GET    | `/offices/{id}/departments`        | List depts in office    | office.view    |

### GET `/offices` — Query Parameters
```
?company_id=uuid
&type=headquarters,branch
&is_active=true
&search=jakarta
```

### POST `/offices`
```json
{
  "company_id": "uuid",
  "name": "Cabang Surabaya",
  "code": "CB-SBY",
  "type": "branch",
  "address": "Jl. Raya Surabaya No. 123",
  "city": "Surabaya",
  "province": "Jawa Timur",
  "postal_code": "60123",
  "phone": "031-1234567",
  "email": "surabaya@askara.com",
  "is_default": false
}
```

---

## 4. Departments

| Method | Endpoint                              | Description             | Permission     |
| ------ | ------------------------------------- | ----------------------- | -------------- |
| GET    | `/departments`                        | List departments        | user.view      |
| POST   | `/departments`                        | Create department       | company.edit   |
| GET    | `/departments/{id}`                   | Get department detail   | user.view      |
| PUT    | `/departments/{id}`                   | Update department       | company.edit   |
| DELETE | `/departments/{id}`                   | Soft delete department  | company.edit   |
| GET    | `/departments/{id}/users`             | List users in dept      | user.view      |
| GET    | `/departments/{id}/sections`          | List sections in dept   | user.view      |

### GET `/departments` — Query Parameters
```
?office_id=uuid
&parent_id=uuid
&is_active=true
&search=quality
```

---

## 5. Sections (Seksi)

| Method | Endpoint                              | Description            | Permission     |
| ------ | ------------------------------------- | ---------------------- | -------------- |
| GET    | `/sections`                           | List sections          | user.view      |
| POST   | `/sections`                           | Create section         | company.edit   |
| GET    | `/sections/{id}`                      | Get section detail     | user.view      |
| PUT    | `/sections/{id}`                      | Update section         | company.edit   |
| DELETE | `/sections/{id}`                      | Soft delete section    | company.edit   |
| GET    | `/sections/{id}/users`                | List users in section  | user.view      |

### POST `/sections`
```json
{
  "department_id": "uuid",
  "name": "Seksi Pengendalian Dokumen",
  "code": "PD",
  "head_user_id": "uuid"
}
```

---

## 6. Positions (Jabatan)

| Method | Endpoint                              | Description            | Permission     |
| ------ | ------------------------------------- | ---------------------- | -------------- |
| GET    | `/positions`                          | List positions         | user.view      |
| POST   | `/positions`                          | Create position        | company.edit   |
| GET    | `/positions/{id}`                     | Get position detail    | user.view      |
| PUT    | `/positions/{id}`                     | Update position        | company.edit   |
| DELETE | `/positions/{id}`                     | Soft delete position   | company.edit   |

### POST `/positions`
```json
{
  "company_id": "uuid",
  "name": "Manager",
  "code": "MGR",
  "level": 5,
  "description": "Manajer departemen"
}
```

### GET `/positions` — Query Parameters
```
?company_id=uuid
&is_active=true
&sort_by=level
&sort_dir=desc
```

---

## 7. Users

| Method | Endpoint                           | Description              | Permission      |
| ------ | ---------------------------------- | ------------------------ | --------------- |
| GET    | `/users`                           | List users               | user.view       |
| POST   | `/users`                           | Create user              | user.create     |
| GET    | `/users/{id}`                      | Get user detail          | user.view       |
| PUT    | `/users/{id}`                      | Update user              | user.edit       |
| DELETE | `/users/{id}`                      | Soft delete user         | user.delete     |
| POST   | `/users/{id}/signature`            | Upload signature image   | self / user.edit|
| DELETE | `/users/{id}/signature`            | Remove signature         | self / user.edit|
| POST   | `/users/{id}/avatar`               | Upload avatar            | self / user.edit|
| PUT    | `/users/{id}/roles`                | Assign roles to user     | user.assign_role|

### POST `/users`
```json
{
  "company_id": "uuid",
  "office_id": "uuid",
  "department_id": "uuid",
  "section_id": "uuid",
  "position_id": "uuid",
  "employee_id": "ASK-001",
  "name": "Ahmad Rizki",
  "email": "ahmad@askara.com",
  "password": "TempPass123!",
  "phone": "081234567890",
  "join_date": "2026-01-15",
  "roles": ["creator", "reviewer"]
}
```

### GET `/users` — Query Parameters
```
?page=1
&per_page=20
&search=ahmad                    // search by name, email, employee_id
&company_id=uuid
&office_id=uuid
&department_id=uuid
&section_id=uuid
&position_id=uuid
&role=creator
&is_active=true
&sort_by=name
&sort_dir=asc
```

---

## 8. Roles & Permissions

| Method | Endpoint                              | Description              | Permission      |
| ------ | ------------------------------------- | ------------------------ | --------------- |
| GET    | `/roles`                              | List roles               | user.view       |
| POST   | `/roles`                              | Create custom role       | super_admin     |
| GET    | `/roles/{id}`                         | Get role detail          | user.view       |
| PUT    | `/roles/{id}`                         | Update role              | super_admin     |
| GET    | `/roles/{id}/permissions`             | Get permissions for role | user.view       |
| PUT    | `/roles/{id}/permissions`             | Update role permissions  | super_admin     |
| GET    | `/permissions`                        | List all permissions     | super_admin     |

---

## 9. Document Categories

| Method | Endpoint                              | Description              | Permission       |
| ------ | ------------------------------------- | ------------------------ | ---------------- |
| GET    | `/categories`                         | List categories          | document.view    |
| POST   | `/categories`                         | Create category          | template.create  |
| GET    | `/categories/{id}`                    | Get category detail      | document.view    |
| PUT    | `/categories/{id}`                    | Update category          | template.edit    |
| DELETE | `/categories/{id}`                    | Soft delete category     | template.delete  |

### POST `/categories`
```json
{
  "company_id": "uuid",
  "name": "Quality",
  "code": "QLT",
  "description": "Dokumen terkait quality management",
  "color": "#2196F3",
  "icon": "shield-check",
  "parent_id": null
}
```

### GET `/categories` — Query Parameters
```
?company_id=uuid
&parent_id=uuid              // NULL = root categories
&is_active=true
&search=quality
```

---

## 10. Document Templates

| Method | Endpoint                              | Description              | Permission       |
| ------ | ------------------------------------- | ------------------------ | ---------------- |
| GET    | `/templates`                          | List templates           | template.view    |
| POST   | `/templates`                          | Create template          | template.create  |
| GET    | `/templates/{id}`                     | Get template detail      | template.view    |
| PUT    | `/templates/{id}`                     | Update template metadata | template.edit    |
| DELETE | `/templates/{id}`                     | Soft delete template     | template.delete  |
| POST   | `/templates/{id}/upload`              | Upload/replace .docx     | template.edit    |
| GET    | `/templates/{id}/download`            | Download template file   | template.view    |
| GET    | `/templates/{id}/preview`             | Preview template         | template.view    |
| GET    | `/templates/{id}/scan-tags`           | Scan file & detect tags  | template.edit    |

### Template Tags (sub-resource)

| Method | Endpoint                                   | Description           | Permission       |
| ------ | ------------------------------------------ | --------------------- | ---------------- |
| GET    | `/templates/{id}/tags`                     | List tags             | template.view    |
| POST   | `/templates/{id}/tags`                     | Add tag               | template.edit    |
| PUT    | `/templates/{id}/tags/{tagId}`             | Update tag config     | template.edit    |
| DELETE | `/templates/{id}/tags/{tagId}`             | Remove tag            | template.edit    |
| PUT    | `/templates/{id}/tags/reorder`             | Reorder tags          | template.edit    |
| POST   | `/templates/{id}/tags/bulk`                | Bulk create/update    | template.edit    |

### POST `/templates`
```json
// multipart/form-data
{
  "company_id": "uuid",
  "document_type_id": "uuid",
  "category_id": "uuid",
  "name": "Template SOP Quality v3",
  "code": "TPL-SOP-QLT-01",
  "description": "Template standar SOP untuk departemen QMS",
  "file": "(binary .docx file)"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "name": "Template SOP Quality v3",
    "code": "TPL-SOP-QLT-01",
    "document_type": { "id": "uuid", "name": "SOP", "code": "SOP" },
    "category": { "id": "uuid", "name": "Quality", "code": "QLT" },
    "file_name": "template-sop-quality-v3.docx",
    "file_size": 45678,
    "version": 1,
    "status": "draft",
    "detected_tags": ["NOMOR_DOKUMEN", "DEPARTEMEN", "TANGGAL_TERBIT", "LOGO_PERUSAHAAN", "TTD_PENYUSUN"],
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

### POST `/templates/{id}/tags` — Tag Configuration
```json
// Static text tag
{
  "tag_key": "NOMOR_DOKUMEN",
  "tag_placeholder": "${NOMOR_DOKUMEN}",
  "label": "Nomor Dokumen",
  "data_type": "auto",
  "source_type": "auto_generate",
  "source_config": {
    "generator": "document_number",
    "format": "{TYPE}/{DEPT}/{SEQ:3}/{ROMAN_MONTH}/{YEAR}"
  },
  "is_required": true,
  "is_readonly": true,
  "group_name": "Header",
  "group_order": 1,
  "field_order": 1,
  "col_span": 6
}
```

```json
// Dynamic select from database
{
  "tag_key": "DEPARTEMEN",
  "tag_placeholder": "${DEPARTEMEN}",
  "label": "Departemen",
  "data_type": "select",
  "source_type": "database",
  "source_config": {
    "table": "departments",
    "value_field": "id",
    "display_field": "name",
    "filter": { "office_id": "${CURRENT_OFFICE_ID}" },
    "order_by": "name ASC"
  },
  "is_required": true,
  "group_name": "Header",
  "group_order": 1,
  "field_order": 2,
  "col_span": 6
}
```

```json
// Date with format
{
  "tag_key": "TANGGAL_TERBIT",
  "tag_placeholder": "${TANGGAL_TERBIT}",
  "label": "Tanggal Terbit",
  "data_type": "date",
  "source_type": "static",
  "format_pattern": "dd MMMM yyyy",
  "default_value": "${TODAY}",
  "is_required": true,
  "group_name": "Header",
  "group_order": 1,
  "field_order": 3,
  "col_span": 6
}
```

```json
// User picker from current user
{
  "tag_key": "DISUSUN_OLEH",
  "tag_placeholder": "${DISUSUN_OLEH}",
  "label": "Disusun Oleh",
  "data_type": "user",
  "source_type": "current_user",
  "source_config": {
    "field": "name"
  },
  "is_required": true,
  "is_readonly": true,
  "group_name": "Header",
  "group_order": 1,
  "field_order": 4,
  "col_span": 6
}
```

```json
// Select with static options
{
  "tag_key": "TINGKAT_RESIKO",
  "tag_placeholder": "${TINGKAT_RESIKO}",
  "label": "Tingkat Resiko",
  "data_type": "select",
  "source_type": "static",
  "source_config": {
    "options": [
      { "value": "low", "label": "Low" },
      { "value": "medium", "label": "Medium" },
      { "value": "high", "label": "High" },
      { "value": "critical", "label": "Critical" }
    ]
  },
  "is_required": true,
  "group_name": "Content",
  "group_order": 2,
  "field_order": 1,
  "col_span": 6
}
```

```json
// Dynamic table
{
  "tag_key": "TABEL_REVISI",
  "tag_placeholder": "${TABEL_REVISI}",
  "label": "Tabel Riwayat Revisi",
  "data_type": "table",
  "source_type": "static",
  "table_config": {
    "columns": [
      { "key": "no", "label": "No", "type": "auto_increment", "width": "5%" },
      { "key": "tanggal", "label": "Tanggal", "type": "date", "width": "20%" },
      { "key": "revisi", "label": "Revisi", "type": "text", "width": "10%" },
      { "key": "perubahan", "label": "Uraian Perubahan", "type": "textarea", "width": "45%" },
      { "key": "oleh", "label": "Oleh", "type": "user", "width": "20%" }
    ],
    "min_rows": 1,
    "max_rows": 50,
    "allow_add": true,
    "allow_delete": true
  },
  "is_required": false,
  "group_name": "Footer",
  "group_order": 3,
  "field_order": 1,
  "col_span": 12
}
```

```json
// Signature tag (linked to workflow step)
{
  "tag_key": "TTD_PENYETUJU",
  "tag_placeholder": "${TTD_PENYETUJU}",
  "label": "Tanda Tangan Penyetuju",
  "data_type": "signature",
  "source_type": "auto_generate",
  "signature_config": {
    "position": "footer",
    "label_above": "Disetujui oleh:",
    "label_below": "({NAMA})",
    "width": 100,
    "height": 40,
    "linked_step": "approve"
  },
  "is_required": false,
  "is_hidden": true,
  "group_name": "Signatures",
  "group_order": 4,
  "field_order": 3,
  "col_span": 4
}
```

---

## 11. Documents

### CRUD

| Method | Endpoint                              | Description                  | Permission         |
| ------ | ------------------------------------- | ---------------------------- | ------------------ |
| GET    | `/documents`                          | List documents               | document.view      |
| POST   | `/documents`                          | Create document from template| document.create    |
| GET    | `/documents/{id}`                     | Get document detail          | document.view      |
| PUT    | `/documents/{id}`                     | Update document metadata     | document.edit      |
| DELETE | `/documents/{id}`                     | Soft delete document         | document.delete    |

### Files & Versions

| Method | Endpoint                                    | Description             | Permission         |
| ------ | ------------------------------------------- | ----------------------- | ------------------ |
| GET    | `/documents/{id}/download`                  | Download current .docx  | document.download  |
| GET    | `/documents/{id}/download/pdf`              | Download final PDF      | document.download  |
| GET    | `/documents/{id}/versions`                  | List all versions       | document.view      |
| GET    | `/documents/{id}/versions/{ver}/download`   | Download specific ver   | document.download  |

### Workflow Actions

| Method | Endpoint                                | Description           | Permission         |
| ------ | --------------------------------------- | --------------------- | ------------------ |
| POST   | `/documents/{id}/submit`                | Submit for review     | document.submit    |
| POST   | `/documents/{id}/approve`               | Approve at current step| document.approve  |
| POST   | `/documents/{id}/reject`                | Reject (with reason)  | document.reject    |
| POST   | `/documents/{id}/revise`                | Request revision      | document.review    |
| POST   | `/documents/{id}/delegate`              | Delegate to other user| document.approve   |
| POST   | `/documents/{id}/finalize`              | Finalize (PDF+sign)   | document.finalize  |
| POST   | `/documents/{id}/archive`               | Archive document      | document.archive   |
| POST   | `/documents/{id}/obsolete`              | Mark as obsolete      | document.archive   |
| POST   | `/documents/{id}/resubmit`              | Resubmit after revision| document.submit   |

### Comments

| Method | Endpoint                                    | Description           | Permission         |
| ------ | ------------------------------------------- | --------------------- | ------------------ |
| GET    | `/documents/{id}/comments`                  | List comments         | document.view      |
| POST   | `/documents/{id}/comments`                  | Add comment           | document.view      |
| PUT    | `/documents/{id}/comments/{cid}`            | Update comment        | owner              |
| DELETE | `/documents/{id}/comments/{cid}`            | Delete comment        | owner              |
| POST   | `/documents/{id}/comments/{cid}/resolve`    | Resolve comment       | document.review    |

### Relations

| Method | Endpoint                                     | Description           | Permission       |
| ------ | -------------------------------------------- | --------------------- | ---------------- |
| GET    | `/documents/{id}/relations`                  | List related docs     | document.view    |
| POST   | `/documents/{id}/relations`                  | Add relation          | document.edit    |
| DELETE | `/documents/{id}/relations/{rid}`            | Remove relation       | document.edit    |

### Distributions

| Method | Endpoint                                        | Description              | Permission           |
| ------ | ----------------------------------------------- | ------------------------ | -------------------- |
| GET    | `/documents/{id}/distributions`                 | List distributions       | document.view        |
| POST   | `/documents/{id}/distributions`                 | Add distribution         | document.distribute  |
| DELETE | `/documents/{id}/distributions/{did}`           | Remove distribution      | document.distribute  |
| POST   | `/documents/{id}/distributions/{did}/acknowledge` | Acknowledge receipt    | authenticated        |

### POST `/documents` — Create Document
```json
// Request
{
  "template_id": "uuid",
  "title": "Prosedur Pengendalian Dokumen",
  "office_id": "uuid",
  "department_id": "uuid",
  "section_id": "uuid",
  "category_id": "uuid",
  "from_module": "audit",
  "from_module_id": "uuid",
  "from_module_number": "AUDIT-2026-003",
  "priority": "high",
  "confidentiality": "internal",
  "metadata": {
    "NOMOR_DOKUMEN": "SOP/QMS/001/IV/2026",
    "DEPARTEMEN": "Quality Management",
    "TANGGAL_TERBIT": "2026-04-13",
    "DISUSUN_OLEH": "Ahmad Rizki",
    "TINGKAT_RESIKO": "medium"
  }
}

// Response 201
{
  "data": {
    "id": "uuid",
    "document_number": "SOP/QMS/001/IV/2026",
    "title": "Prosedur Pengendalian Dokumen",
    "status": "draft",
    "priority": "high",
    "confidentiality": "internal",
    "current_version": 1,
    "category": { "id": "uuid", "name": "Quality", "code": "QLT" },
    "office": { "id": "uuid", "name": "Kantor Pusat Jakarta" },
    "department": { "id": "uuid", "name": "Quality Management" },
    "section": { "id": "uuid", "name": "Pengendalian Dokumen" },
    "from_module": "audit",
    "from_module_number": "AUDIT-2026-003",
    "draft_file_path": "ASK/documents/QLT/2026/04/SOP-QMS-001/v1.docx",
    "onlyoffice_key": "doc_uuid_v1",
    "created_by": { "id": "uuid", "name": "Ahmad Rizki" },
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

### GET `/documents` — Query Parameters
```
?page=1
&per_page=20
&search=prosedur                 // search title, document_number, description
&status=draft,in_review          // comma-separated
&document_type_id=uuid
&category_id=uuid
&office_id=uuid
&department_id=uuid
&section_id=uuid
&created_by=uuid
&priority=high,critical
&confidentiality=internal
&access_level=controlled_copy
&from_module=audit
&date_from=2026-01-01
&date_to=2026-12-31
&effective_date_from=2026-01-01
&effective_date_to=2026-12-31
&sort_by=created_at
&sort_dir=desc
```

### GET `/documents/{id}` — Full Detail Response
```json
{
  "data": {
    "id": "uuid",
    "document_number": "SOP/QMS/001/IV/2026",
    "title": "Prosedur Pengendalian Dokumen",
    "description": "Prosedur untuk mengendalikan dokumen...",
    "status": "in_review",

    "company": { "id": "uuid", "name": "PT Askara Internal", "code": "ASK" },
    "office": { "id": "uuid", "name": "Kantor Pusat Jakarta", "code": "KP-JKT" },
    "department": { "id": "uuid", "name": "Quality Management", "code": "QMS" },
    "section": { "id": "uuid", "name": "Pengendalian Dokumen", "code": "PD" },

    "document_type": { "id": "uuid", "name": "SOP", "code": "SOP" },
    "category": { "id": "uuid", "name": "Quality", "code": "QLT", "color": "#2196F3" },
    "template": { "id": "uuid", "name": "Template SOP Quality v3" },

    "from_module": "audit",
    "from_module_id": "uuid",
    "from_module_number": "AUDIT-2026-003",

    "current_version": 3,
    "major_version": 1,
    "minor_version": 2,
    "version_label": "v1.2",

    "priority": "high",
    "confidentiality": "internal",
    "access_level": "raw",

    "revision_count": 1,
    "revision_notes": "Tambahkan referensi ISO 9001",

    "effective_date": "2026-05-01",
    "review_date": "2027-05-01",
    "expiry_date": null,
    "submitted_at": "2026-04-13T15:00:00Z",

    "page_count": 12,
    "word_count": 3450,

    "metadata": {
      "NOMOR_DOKUMEN": "SOP/QMS/001/IV/2026",
      "DEPARTEMEN": "Quality Management",
      "TANGGAL_TERBIT": "13 April 2026",
      "DISUSUN_OLEH": "Ahmad Rizki",
      "TINGKAT_RESIKO": "medium"
    },

    "draft_file_path": "ASK/documents/QLT/2026/04/SOP-QMS-001/v3.docx",
    "final_file_path": null,
    "onlyoffice_key": "doc_uuid_v3",
    "onlyoffice_lock_by": null,

    "parent_document": null,
    "supersedes_document": null,

    "workflow_status": {
      "instance_id": "uuid",
      "iteration": 1,
      "current_step": {
        "id": "uuid",
        "name": "Approval by QMS Manager",
        "step_type": "approve",
        "step_order": 2,
        "deadline_at": "2026-04-18T17:00:00Z",
        "assignees": [
          { "id": "uuid", "name": "Budi Santoso", "position": "Manager" }
        ]
      },
      "steps": [
        { "order": 1, "name": "Review by QMS Staff", "status": "approved", "completed_at": "2026-04-14T10:00:00Z" },
        { "order": 2, "name": "Approval by QMS Manager", "status": "active", "deadline_at": "2026-04-18T17:00:00Z" },
        { "order": 3, "name": "Sign by Director", "status": "pending" }
      ]
    },

    "tags": ["ISO-9001", "quality-control"],
    "relations_count": 2,
    "comments_count": 5,
    "versions_count": 3,

    "created_by": { "id": "uuid", "name": "Ahmad Rizki", "position": "Staff" },
    "updated_by": { "id": "uuid", "name": "Ahmad Rizki" },
    "submitted_by": { "id": "uuid", "name": "Ahmad Rizki" },
    "created_at": "2026-04-13T10:00:00Z",
    "updated_at": "2026-04-14T10:00:00Z"
  }
}
```

### POST `/documents/{id}/reject`
```json
// Request — comment WAJIB (reject_comment_required = true)
{
  "comment": "Dokumen belum memenuhi standar. Tolong revisi bagian 3 dan 5.",
  "is_comment_public": true
}

// Response 200
{
  "data": {
    "document_id": "uuid",
    "action": "rejected",
    "status": "revision",
    "returned_to": "creator",           // atau "step_1" jika on_reject_action = 'to_step'
    "revision_notes": "Dokumen belum memenuhi standar. Tolong revisi bagian 3 dan 5.",
    "rejected_by": { "id": "uuid", "name": "Budi Santoso" },
    "rejected_at": "2026-04-15T09:00:00Z"
  }
}
```

### POST `/documents/{id}/approve`
```json
// Request — comment OPSIONAL (approve_comment_required = false)
{
  "comment": "Dokumen sudah sesuai",
  "use_signature": true
}

// Response 200
{
  "data": {
    "document_id": "uuid",
    "action": "approved",
    "status": "in_review",
    "next_step": {
      "name": "Sign by Director",
      "step_type": "sign",
      "assignees": [
        { "id": "uuid", "name": "Direktur Utama", "position": "Director" }
      ]
    }
  }
}
```

### POST `/documents/{id}/delegate`
```json
{
  "delegated_to": "uuid",
  "reason": "Saya sedang cuti, tolong di-review oleh Pak Andi"
}
```

### POST `/documents/{id}/distributions`
```json
{
  "distributions": [
    { "distribution_type": "department", "target_id": "uuid", "access_level": "controlled_copy" },
    { "distribution_type": "user", "target_id": "uuid", "access_level": "master_copy" },
    { "distribution_type": "office", "target_id": "uuid", "access_level": "controlled_copy" }
  ]
}
```

---

## 12. OnlyOffice Integration

| Method | Endpoint                              | Description                       | Permission      |
| ------ | ------------------------------------- | --------------------------------- | --------------- |
| GET    | `/onlyoffice/config/{documentId}`     | Get editor config for document    | document.view   |
| POST   | `/onlyoffice/callback`                | Callback from OnlyOffice server   | Internal        |
| GET    | `/onlyoffice/file/{documentId}`       | Serve file to OnlyOffice          | Internal        |

*(Config response sama seperti v1, ditambah permissions berdasarkan workflow step)*

---

## 13. Workflows

| Method | Endpoint                                   | Description               | Permission       |
| ------ | ------------------------------------------ | ------------------------- | ---------------- |
| GET    | `/workflows`                               | List workflows            | workflow.view    |
| POST   | `/workflows`                               | Create workflow           | workflow.create  |
| GET    | `/workflows/{id}`                          | Get workflow detail       | workflow.view    |
| PUT    | `/workflows/{id}`                          | Update workflow           | workflow.edit    |
| DELETE | `/workflows/{id}`                          | Soft delete workflow      | workflow.delete  |
| GET    | `/workflows/{id}/steps`                    | List steps                | workflow.view    |
| POST   | `/workflows/{id}/steps`                    | Add step                  | workflow.edit    |
| PUT    | `/workflows/{id}/steps/{stepId}`           | Update step               | workflow.edit    |
| DELETE | `/workflows/{id}/steps/{stepId}`           | Delete step               | workflow.edit    |
| PUT    | `/workflows/{id}/steps/reorder`            | Reorder steps             | workflow.edit    |
| POST   | `/workflows/{id}/duplicate`                | Duplicate workflow        | workflow.create  |

### POST `/workflows`
```json
{
  "company_id": "uuid",
  "office_id": "uuid",
  "document_type_id": "uuid",
  "category_id": "uuid",
  "department_id": "uuid",
  "name": "Approval Flow SOP QMS",
  "description": "Flow approval untuk SOP di departemen QMS",
  "steps": [
    {
      "step_order": 1,
      "name": "Review by QMS Staff",
      "step_type": "review",
      "assignee_type": "section",
      "assignee_section_id": "uuid",
      "can_edit": true,
      "can_comment": true,
      "can_delegate": false,
      "deadline_days": 3,
      "on_reject_action": "to_creator",
      "reject_comment_required": true,
      "approve_comment_required": false,
      "instructions": "Periksa format, bahasa, dan kesesuaian isi dokumen"
    },
    {
      "step_order": 2,
      "name": "Approval by QMS Manager",
      "step_type": "approve",
      "assignee_type": "position",
      "assignee_position_id": "uuid_manager",
      "can_edit": false,
      "can_comment": true,
      "can_delegate": true,
      "deadline_days": 5,
      "on_reject_action": "to_step",
      "reject_to_step_id": "step_1_uuid",
      "reject_comment_required": true,
      "approve_comment_required": false,
      "escalation_action": "notify_head",
      "escalation_after_days": 2,
      "instructions": "Verifikasi kesesuaian dengan standar departemen"
    },
    {
      "step_order": 3,
      "name": "Approval by All Section Heads",
      "step_type": "approve",
      "assignee_type": "position",
      "assignee_position_id": "uuid_section_head",
      "is_parallel": true,
      "required_approvals": 0,
      "can_edit": false,
      "can_comment": true,
      "deadline_days": 5,
      "on_reject_action": "to_previous",
      "reject_comment_required": true,
      "approve_comment_required": true
    },
    {
      "step_order": 4,
      "name": "Final Sign by Director",
      "step_type": "sign",
      "assignee_type": "user",
      "assignee_user_id": "director_uuid",
      "can_edit": false,
      "can_comment": true,
      "can_delegate": true,
      "deadline_days": 7,
      "on_reject_action": "to_creator",
      "reject_comment_required": true,
      "approve_comment_required": false
    }
  ]
}
```

---

## 14. Workflow Instances

| Method | Endpoint                                            | Description              | Permission      |
| ------ | --------------------------------------------------- | ------------------------ | --------------- |
| GET    | `/workflow-instances`                               | List running workflows   | workflow.view   |
| GET    | `/workflow-instances/{id}`                          | Get instance detail      | workflow.view   |
| GET    | `/workflow-instances/{id}/history`                  | Get action history       | workflow.view   |
| GET    | `/workflow-instances/my-tasks`                      | Get my pending tasks     | authenticated   |
| POST   | `/workflow-instances/{id}/cancel`                   | Cancel workflow          | workflow.edit   |

### GET `/workflow-instances/my-tasks`
```json
{
  "data": [
    {
      "id": "uuid",
      "document": {
        "id": "uuid",
        "document_number": "SOP/QMS/001/IV/2026",
        "title": "Prosedur Pengendalian Dokumen",
        "status": "in_review",
        "priority": "high",
        "category": { "name": "Quality", "color": "#2196F3" },
        "from_module": "audit",
        "from_module_number": "AUDIT-2026-003"
      },
      "step": {
        "name": "Approval by QMS Manager",
        "step_type": "approve",
        "can_edit": false,
        "can_comment": true,
        "can_delegate": true,
        "deadline_at": "2026-04-18T17:00:00Z",
        "reject_comment_required": true,
        "approve_comment_required": false,
        "instructions": "Verifikasi kesesuaian dengan standar departemen",
        "on_reject_action": "to_step",
        "reject_to_step_name": "Review by QMS Staff"
      },
      "submitted_by": { "id": "uuid", "name": "Ahmad Rizki", "position": "Staff" },
      "submitted_at": "2026-04-13T10:00:00Z",
      "iteration": 1
    }
  ],
  "meta": { "total": 5, "page": 1, "per_page": 20 }
}
```

### GET `/workflow-instances/{id}/history`
```json
{
  "data": [
    {
      "step_order": 1,
      "step_name": "Review by QMS Staff",
      "step_type": "review",
      "status": "approved",
      "actions": [
        {
          "user": { "id": "uuid", "name": "Dina Pertiwi", "position": "Staff QC" },
          "action": "approve",
          "comment": "Format dan isi sudah sesuai",
          "signature_used": false,
          "created_at": "2026-04-14T10:00:00Z"
        }
      ],
      "started_at": "2026-04-13T15:00:00Z",
      "completed_at": "2026-04-14T10:00:00Z"
    },
    {
      "step_order": 2,
      "step_name": "Approval by QMS Manager",
      "step_type": "approve",
      "status": "active",
      "actions": [],
      "started_at": "2026-04-14T10:00:00Z",
      "deadline_at": "2026-04-18T17:00:00Z"
    }
  ]
}
```

---

## 15. Audit Logs

| Method | Endpoint                    | Description          | Permission    |
| ------ | --------------------------- | -------------------- | ------------- |
| GET    | `/audit-logs`               | List audit logs      | audit.view    |
| GET    | `/audit-logs/export`        | Export to CSV/PDF    | audit.export  |

### GET `/audit-logs` — Query Parameters
```
?page=1
&per_page=50
&user_id=uuid
&office_id=uuid
&action=document.approved
&entity_type=document
&entity_id=uuid
&date_from=2026-04-01
&date_to=2026-04-30
&sort_by=created_at
&sort_dir=desc
```

---

## 16. Notifications

| Method | Endpoint                              | Description               | Permission      |
| ------ | ------------------------------------- | ------------------------- | --------------- |
| GET    | `/notifications`                      | List my notifications     | authenticated   |
| GET    | `/notifications/unread-count`         | Get unread count          | authenticated   |
| PUT    | `/notifications/{id}/read`            | Mark as read              | authenticated   |
| PUT    | `/notifications/read-all`             | Mark all as read          | authenticated   |
| GET    | `/notifications/preferences`          | Get my preferences        | authenticated   |
| PUT    | `/notifications/preferences`          | Update my preferences     | authenticated   |

---

## 17. Document Numbering

| Method | Endpoint                              | Description                  | Permission       |
| ------ | ------------------------------------- | ---------------------------- | ---------------- |
| GET    | `/numbering`                          | List numbering configs       | template.view    |
| POST   | `/numbering`                          | Create numbering config      | template.create  |
| PUT    | `/numbering/{id}`                     | Update numbering config      | template.edit    |
| DELETE | `/numbering/{id}`                     | Delete numbering config      | template.delete  |
| GET    | `/numbering/preview`                  | Preview next number          | template.view    |

### GET `/numbering/preview` — Query Parameters
```
?document_type_id=uuid
&category_id=uuid
&office_id=uuid
&department_id=uuid
```

### Response
```json
{
  "data": {
    "format": "{TYPE}/{DEPT}/{SEQ:3}/{ROMAN_MONTH}/{YEAR}",
    "preview": "SOP/QMS/002/IV/2026",
    "next_sequence": 2,
    "tokens": {
      "TYPE": "SOP",
      "DEPT": "QMS",
      "SEQ": "002",
      "ROMAN_MONTH": "IV",
      "YEAR": "2026"
    }
  }
}
```

---

## 18. Dashboard & Stats

| Method | Endpoint                              | Description                | Permission      |
| ------ | ------------------------------------- | -------------------------- | --------------- |
| GET    | `/dashboard/summary`                  | Overview stats             | authenticated   |
| GET    | `/dashboard/documents-by-status`      | Count per status           | authenticated   |
| GET    | `/dashboard/documents-by-type`        | Count per document type    | authenticated   |
| GET    | `/dashboard/documents-by-category`    | Count per category         | authenticated   |
| GET    | `/dashboard/documents-by-office`      | Count per kantor           | authenticated   |
| GET    | `/dashboard/recent-activity`          | Recent audit log           | authenticated   |
| GET    | `/dashboard/pending-tasks`            | My pending approvals       | authenticated   |
| GET    | `/dashboard/overdue`                  | Overdue documents          | authenticated   |

### GET `/dashboard/summary`
```json
{
  "data": {
    "total_documents": 150,
    "documents_by_status": {
      "draft": 12,
      "in_review": 8,
      "revision": 3,
      "approved": 45,
      "final": 78,
      "obsolete": 2,
      "archived": 2
    },
    "my_pending_tasks": 5,
    "overdue_documents": 2,
    "documents_this_month": 15,
    "approvals_this_month": 22,
    "by_priority": {
      "critical": 2,
      "high": 5,
      "normal": 130,
      "low": 13
    },
    "by_category": [
      { "name": "Quality", "code": "QLT", "color": "#2196F3", "count": 45 },
      { "name": "Safety", "code": "SFT", "color": "#FF5722", "count": 30 },
      { "name": "HR", "code": "HR", "color": "#4CAF50", "count": 25 }
    ]
  }
}
```

---

## Common Response Format

### Success
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "last_page": 5
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid.",
    "details": {
      "title": ["The title field is required."],
      "category_id": ["The selected category is invalid."]
    }
  }
}
```

### Error Codes
| Code                  | HTTP | Description                    |
| --------------------- | ---- | ------------------------------ |
| `VALIDATION_ERROR`    | 422  | Input validation failed        |
| `UNAUTHORIZED`        | 401  | Not authenticated              |
| `FORBIDDEN`           | 403  | No permission                  |
| `NOT_FOUND`           | 404  | Resource not found             |
| `CONFLICT`            | 409  | Resource conflict (duplicate)  |
| `WORKFLOW_ERROR`      | 422  | Workflow state error           |
| `DOCUMENT_LOCKED`     | 423  | Document being edited by other |
| `SERVER_ERROR`        | 500  | Internal server error          |
