#!/bin/bash
# ==============================================================================
# DMS Seed: Templates (with Tags) + Documents (with Metadata)
# Membutuhkan data master sudah ada (jalankan seed-dummy-data.sh terlebih dahulu)
# ==============================================================================

set -e

API="http://localhost:3000/api/v1"
CT="Content-Type: application/json"

echo "🔐 Login..."
TOKEN=$(curl -s "$API/auth/login" -H "$CT" \
  -d '{"email":"admin@askara.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
AUTH="Authorization: Bearer $TOKEN"
echo "   ✅ Token acquired."

# Helper: POST JSON and return ID
post() {
  local url=$1; shift; local data="$1"
  local result=$(curl -s "$url" -H "$CT" -H "$AUTH" -d "$data")
  local id=$(echo "$result" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('data',{}).get('id',''))" 2>/dev/null)
  if [ -z "$id" ]; then
    local err=$(echo "$result" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('error',r.get('message','unknown')))" 2>/dev/null || echo "$result")
    echo "SKIP:$err"
    return 0
  fi
  echo "$id"
}

# Helper: POST multipart form (for templates with file upload)
post_multipart() {
  local url=$1; shift
  local result=$(curl -s "$url" -H "$AUTH" "$@")
  local id=$(echo "$result" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('data',{}).get('id',''))" 2>/dev/null)
  if [ -z "$id" ]; then
    local err=$(echo "$result" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('error',r.get('message','unknown')))" 2>/dev/null || echo "$result")
    echo "SKIP:$err"
    return 0
  fi
  echo "$id"
}

# Helper: Bulk upsert tags
bulk_tags() {
  local tmpl_id=$1; shift; local data="$1"
  curl -s "$API/templates/$tmpl_id/tags/bulk" -H "$CT" -H "$AUTH" -d "$data" \
    | python3 -c "import sys,json; r=json.load(sys.stdin); d=r.get('data',[]); print(f'{len(d)} tags created')" 2>/dev/null
}

# ============================================================================
# Reference IDs (from seed-dummy-data.sh)
# ============================================================================
COMPANY_ID="00000000-0000-0000-0000-000000000001"
OFFICE_HQ="00000000-0000-0000-0000-000000000002"

# Departments
DEPT_QMS="00000000-0000-0000-0000-000000000003"
DEPT_HR="f069bbde-67f6-48a8-8c42-1d9bd864c61a"
DEPT_FIN="dd322c51-8e15-434e-afe9-e4cf866ea879"
DEPT_IT="8c7f9526-cb8e-41b1-af45-f97307046d22"
DEPT_OPS="3f725be6-544b-4d71-805c-8eca31ba73e1"
DEPT_MKT="6edfc7e7-0453-4739-807a-f69cab48dea6"
DEPT_GAF="118a36cb-d886-4eab-8118-c79568e6d1b1"

# Doc Types
DT_SOP="7367ca3d-eb1d-43dd-a115-cf3d2ceecdfa"
DT_IK="c5713fbb-937a-46a7-ad47-6d99da3dcc0b"
DT_STD="ec646975-7fa6-4dfc-8318-12e847ad226e"
DT_FRM="b57e3577-c633-4337-86ce-f57677357102"
DT_OPL="e7dac31b-a596-4bfd-bf38-6fd940370aea"

# Categories
CAT_QLT="1de6dcb1-c46b-466f-af65-bc4b8d75de05"
CAT_HR="d5a3d22d-47f6-4726-b9d3-77bc467f03f3"
CAT_FIN="f410dc43-1846-46e5-b63d-23ce83b525cf"
CAT_IT="831389d1-cd2b-4d13-882c-98bc28748198"
CAT_OPS="29a8f994-e44a-48f6-b08f-3be843880c52"
CAT_GAF="68e9c1ae-730e-48b8-8319-68dd81da6de3"

# Users
USER_ADMIN="00000000-0000-0000-0000-000000000099"
USER_AHMAD="00000000-0000-0000-0000-000000000010"

# Dummy DOCX for template uploads (reuse existing)
DUMMY_DOCX="dms/storage/app/ASK/templates/docx/2026/04/test-template-eb1cc0a2.docx"

echo ""
echo "========================================"
echo "  1. TEMPLATES — Buat 5 Template Lengkap"
echo "========================================"

# --- Template 1: SOP Quality (update existing with full tags) ---
TMPL_SOP="ef6ad65a-07d2-444b-951d-d197ee14c8a0"
echo "   📝 Updating tags for existing Template SOP Quality: $TMPL_SOP"

bulk_tags "$TMPL_SOP" '{
  "tags": [
    {
      "tag_key": "NOMOR_DOKUMEN", "tag_placeholder": "${NOMOR_DOKUMEN}",
      "label": "Nomor Dokumen", "data_type": "auto", "source_type": "auto",
      "is_required": true, "is_readonly": true,
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 1, "col_span": 12
    },
    {
      "tag_key": "JUDUL_SOP", "tag_placeholder": "${JUDUL_SOP}",
      "label": "Judul SOP", "data_type": "text", "source_type": "static",
      "is_required": true, "placeholder_text": "Masukkan judul SOP",
      "min_length": 10, "max_length": 200,
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 2, "col_span": 24
    },
    {
      "tag_key": "DEPARTEMEN", "tag_placeholder": "${DEPARTEMEN}",
      "label": "Departemen", "data_type": "select", "source_type": "api",
      "source_config": "{\"endpoint\":\"/departments\",\"label_field\":\"name\",\"value_field\":\"id\"}",
      "is_required": true,
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 3, "col_span": 12
    },
    {
      "tag_key": "KATEGORI_PROSES", "tag_placeholder": "${KATEGORI_PROSES}",
      "label": "Kategori Proses", "data_type": "select", "source_type": "static",
      "source_config": "{\"options\":[{\"label\":\"Core Process\",\"value\":\"core\"},{\"label\":\"Support Process\",\"value\":\"support\"},{\"label\":\"Management Process\",\"value\":\"management\"}]}",
      "is_required": true,
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 4, "col_span": 12
    },
    {
      "tag_key": "TANGGAL_EFEKTIF", "tag_placeholder": "${TANGGAL_EFEKTIF}",
      "label": "Tanggal Efektif", "data_type": "date", "source_type": "static",
      "is_required": true, "format_pattern": "dd/MM/yyyy",
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 5, "col_span": 12
    },
    {
      "tag_key": "REVISI_KE", "tag_placeholder": "${REVISI_KE}",
      "label": "Revisi Ke", "data_type": "number", "source_type": "static",
      "is_required": true, "default_value": "0", "min_value": 0, "max_value": 99,
      "group_name": "Header Dokumen", "group_order": 1, "field_order": 6, "col_span": 12
    },
    {
      "tag_key": "TUJUAN", "tag_placeholder": "${TUJUAN}",
      "label": "Tujuan", "data_type": "textarea", "source_type": "static",
      "is_required": true, "placeholder_text": "Jelaskan tujuan dari SOP ini",
      "group_name": "Isi Dokumen", "group_order": 2, "field_order": 1, "col_span": 24
    },
    {
      "tag_key": "RUANG_LINGKUP", "tag_placeholder": "${RUANG_LINGKUP}",
      "label": "Ruang Lingkup", "data_type": "textarea", "source_type": "static",
      "is_required": true, "placeholder_text": "Jelaskan ruang lingkup penerapan SOP",
      "group_name": "Isi Dokumen", "group_order": 2, "field_order": 2, "col_span": 24
    },
    {
      "tag_key": "REFERENSI", "tag_placeholder": "${REFERENSI}",
      "label": "Dokumen Referensi", "data_type": "textarea", "source_type": "static",
      "is_required": false, "placeholder_text": "ISO 9001:2015, Peraturan internal, dll",
      "group_name": "Isi Dokumen", "group_order": 2, "field_order": 3, "col_span": 24
    },
    {
      "tag_key": "PENANGGUNG_JAWAB", "tag_placeholder": "${PENANGGUNG_JAWAB}",
      "label": "Penanggung Jawab", "data_type": "select", "source_type": "api",
      "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
      "is_required": true,
      "group_name": "Pengesahan", "group_order": 3, "field_order": 1, "col_span": 12
    },
    {
      "tag_key": "DIPERIKSA_OLEH", "tag_placeholder": "${DIPERIKSA_OLEH}",
      "label": "Diperiksa Oleh", "data_type": "select", "source_type": "api",
      "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
      "is_required": true,
      "group_name": "Pengesahan", "group_order": 3, "field_order": 2, "col_span": 12
    },
    {
      "tag_key": "DISETUJUI_OLEH", "tag_placeholder": "${DISETUJUI_OLEH}",
      "label": "Disetujui Oleh", "data_type": "select", "source_type": "api",
      "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
      "is_required": true,
      "group_name": "Pengesahan", "group_order": 3, "field_order": 3, "col_span": 12
    },
    {
      "tag_key": "CATATAN_REVISI", "tag_placeholder": "${CATATAN_REVISI}",
      "label": "Catatan Revisi", "data_type": "textarea", "source_type": "static",
      "is_required": false, "placeholder_text": "Jelaskan perubahan dari revisi sebelumnya",
      "group_name": "Pengesahan", "group_order": 3, "field_order": 4, "col_span": 24
    }
  ]
}'
echo "   ✅ Template SOP Quality tags updated"

# --- Template 2: Instruksi Kerja (IK) HR ---
echo ""
echo "   📄 Creating Template IK HR..."
TMPL_IK=$(post_multipart "$API/templates" \
  -F "name=Template Instruksi Kerja HR" \
  -F "code=TPL-IK-HR-01" \
  -F "document_type_id=$DT_IK" \
  -F "category_id=$CAT_HR" \
  -F "description=Template instruksi kerja untuk prosedur HR seperti rekrutmen, onboarding, dan penggajian" \
  -F "file=@$DUMMY_DOCX;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document")
echo "   ✅ Template IK HR: $TMPL_IK"

if [[ "$TMPL_IK" != SKIP* ]]; then
  bulk_tags "$TMPL_IK" '{
    "tags": [
      {
        "tag_key": "NOMOR_IK", "tag_placeholder": "${NOMOR_IK}",
        "label": "Nomor Instruksi Kerja", "data_type": "auto", "source_type": "auto",
        "is_required": true, "is_readonly": true,
        "group_name": "Header", "group_order": 1, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "JUDUL_IK", "tag_placeholder": "${JUDUL_IK}",
        "label": "Judul Instruksi Kerja", "data_type": "text", "source_type": "static",
        "is_required": true, "placeholder_text": "Masukkan judul instruksi kerja",
        "group_name": "Header", "group_order": 1, "field_order": 2, "col_span": 24
      },
      {
        "tag_key": "DEPARTEMEN_IK", "tag_placeholder": "${DEPARTEMEN_IK}",
        "label": "Departemen", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/departments\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": true,
        "group_name": "Header", "group_order": 1, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "TANGGAL_BERLAKU", "tag_placeholder": "${TANGGAL_BERLAKU}",
        "label": "Tanggal Berlaku", "data_type": "date", "source_type": "static",
        "is_required": true, "format_pattern": "dd/MM/yyyy",
        "group_name": "Header", "group_order": 1, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "TUJUAN_IK", "tag_placeholder": "${TUJUAN_IK}",
        "label": "Tujuan", "data_type": "textarea", "source_type": "static",
        "is_required": true, "placeholder_text": "Tujuan instruksi kerja ini",
        "group_name": "Detail", "group_order": 2, "field_order": 1, "col_span": 24
      },
      {
        "tag_key": "LOKASI_KERJA", "tag_placeholder": "${LOKASI_KERJA}",
        "label": "Lokasi Kerja", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"Kantor Pusat\",\"value\":\"hq\"},{\"label\":\"Cabang Surabaya\",\"value\":\"sby\"},{\"label\":\"Cabang Bandung\",\"value\":\"bdg\"},{\"label\":\"Semua Lokasi\",\"value\":\"all\"}]}",
        "is_required": true,
        "group_name": "Detail", "group_order": 2, "field_order": 2, "col_span": 12
      },
      {
        "tag_key": "JUMLAH_PERSONIL", "tag_placeholder": "${JUMLAH_PERSONIL}",
        "label": "Jumlah Personil Terlibat", "data_type": "number", "source_type": "static",
        "is_required": false, "default_value": "1", "min_value": 1,
        "group_name": "Detail", "group_order": 2, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "ALAT_PELINDUNG", "tag_placeholder": "${ALAT_PELINDUNG}",
        "label": "APD yang Diperlukan", "data_type": "text", "source_type": "static",
        "is_required": false, "placeholder_text": "Helm, sarung tangan, kacamata, dll",
        "group_name": "Detail", "group_order": 2, "field_order": 4, "col_span": 24
      },
      {
        "tag_key": "PERINGATAN", "tag_placeholder": "${PERINGATAN}",
        "label": "Peringatan Keselamatan", "data_type": "textarea", "source_type": "static",
        "is_required": false, "placeholder_text": "Hal-hal yang perlu diwaspadai",
        "group_name": "Keselamatan", "group_order": 3, "field_order": 1, "col_span": 24
      },
      {
        "tag_key": "KONTAK_DARURAT", "tag_placeholder": "${KONTAK_DARURAT}",
        "label": "Kontak Darurat", "data_type": "phone", "source_type": "static",
        "is_required": false, "placeholder_text": "+62-xxx-xxxx-xxxx",
        "group_name": "Keselamatan", "group_order": 3, "field_order": 2, "col_span": 12
      }
    ]
  }'
  echo "   ✅ Tags IK HR created"
fi

# --- Template 3: Formulir Finance ---
echo ""
echo "   📄 Creating Template Formulir Finance..."
TMPL_FRM=$(post_multipart "$API/templates" \
  -F "name=Template Formulir Pengajuan Anggaran" \
  -F "code=TPL-FRM-FIN-01" \
  -F "document_type_id=$DT_FRM" \
  -F "category_id=$CAT_FIN" \
  -F "description=Template formulir pengajuan anggaran dan reimbursement untuk departemen Finance" \
  -F "file=@$DUMMY_DOCX;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document")
echo "   ✅ Template FRM Finance: $TMPL_FRM"

if [[ "$TMPL_FRM" != SKIP* ]]; then
  bulk_tags "$TMPL_FRM" '{
    "tags": [
      {
        "tag_key": "NOMOR_FORM", "tag_placeholder": "${NOMOR_FORM}",
        "label": "Nomor Formulir", "data_type": "auto", "source_type": "auto",
        "is_required": true, "is_readonly": true,
        "group_name": "Info Formulir", "group_order": 1, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "TANGGAL_PENGAJUAN", "tag_placeholder": "${TANGGAL_PENGAJUAN}",
        "label": "Tanggal Pengajuan", "data_type": "date", "source_type": "static",
        "is_required": true, "format_pattern": "dd/MM/yyyy",
        "group_name": "Info Formulir", "group_order": 1, "field_order": 2, "col_span": 12
      },
      {
        "tag_key": "PEMOHON", "tag_placeholder": "${PEMOHON}",
        "label": "Nama Pemohon", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": true,
        "group_name": "Info Formulir", "group_order": 1, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "DEPARTEMEN_PEMOHON", "tag_placeholder": "${DEPARTEMEN_PEMOHON}",
        "label": "Departemen Pemohon", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/departments\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": true,
        "group_name": "Info Formulir", "group_order": 1, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "JENIS_PENGAJUAN", "tag_placeholder": "${JENIS_PENGAJUAN}",
        "label": "Jenis Pengajuan", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"Anggaran Baru\",\"value\":\"new_budget\"},{\"label\":\"Tambahan Anggaran\",\"value\":\"additional\"},{\"label\":\"Reimbursement\",\"value\":\"reimbursement\"},{\"label\":\"Petty Cash\",\"value\":\"petty_cash\"}]}",
        "is_required": true,
        "group_name": "Detail Anggaran", "group_order": 2, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "MATA_UANG", "tag_placeholder": "${MATA_UANG}",
        "label": "Mata Uang", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"IDR - Rupiah\",\"value\":\"IDR\"},{\"label\":\"USD - Dollar AS\",\"value\":\"USD\"},{\"label\":\"EUR - Euro\",\"value\":\"EUR\"}]}",
        "is_required": true, "default_value": "IDR",
        "group_name": "Detail Anggaran", "group_order": 2, "field_order": 2, "col_span": 12
      },
      {
        "tag_key": "JUMLAH_ANGGARAN", "tag_placeholder": "${JUMLAH_ANGGARAN}",
        "label": "Jumlah Anggaran (Rp)", "data_type": "number", "source_type": "static",
        "is_required": true, "min_value": 0,
        "placeholder_text": "Masukkan jumlah dalam angka",
        "group_name": "Detail Anggaran", "group_order": 2, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "KODE_AKUN", "tag_placeholder": "${KODE_AKUN}",
        "label": "Kode Akun / COA", "data_type": "text", "source_type": "static",
        "is_required": true, "placeholder_text": "Contoh: 5210-001",
        "validation_regex": "^[0-9]{4}-[0-9]{3}$",
        "validation_message": "Format: XXXX-XXX (contoh: 5210-001)",
        "group_name": "Detail Anggaran", "group_order": 2, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "URAIAN_KEBUTUHAN", "tag_placeholder": "${URAIAN_KEBUTUHAN}",
        "label": "Uraian Kebutuhan", "data_type": "textarea", "source_type": "static",
        "is_required": true, "placeholder_text": "Jelaskan kebutuhan anggaran secara detail",
        "group_name": "Detail Anggaran", "group_order": 2, "field_order": 5, "col_span": 24
      },
      {
        "tag_key": "LAMPIRAN", "tag_placeholder": "${LAMPIRAN}",
        "label": "Lampiran Pendukung", "data_type": "checkbox", "source_type": "static",
        "is_required": false, "default_value": "false",
        "description": "Centang jika ada lampiran pendukung (quotation, invoice, dll)",
        "group_name": "Lampiran", "group_order": 3, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "CATATAN_TAMBAHAN", "tag_placeholder": "${CATATAN_TAMBAHAN}",
        "label": "Catatan Tambahan", "data_type": "textarea", "source_type": "static",
        "is_required": false, "placeholder_text": "Catatan tambahan jika diperlukan",
        "group_name": "Lampiran", "group_order": 3, "field_order": 2, "col_span": 24
      }
    ]
  }'
  echo "   ✅ Tags FRM Finance created"
fi

# --- Template 4: Standar IT ---
echo ""
echo "   📄 Creating Template Standar IT..."
TMPL_STD=$(post_multipart "$API/templates" \
  -F "name=Template Standar Keamanan Informasi" \
  -F "code=TPL-STD-IT-01" \
  -F "document_type_id=$DT_STD" \
  -F "category_id=$CAT_IT" \
  -F "description=Template standar keamanan informasi berdasarkan ISO 27001 untuk departemen IT" \
  -F "file=@$DUMMY_DOCX;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document")
echo "   ✅ Template STD IT: $TMPL_STD"

if [[ "$TMPL_STD" != SKIP* ]]; then
  bulk_tags "$TMPL_STD" '{
    "tags": [
      {
        "tag_key": "NOMOR_STD", "tag_placeholder": "${NOMOR_STD}",
        "label": "Nomor Standar", "data_type": "auto", "source_type": "auto",
        "is_required": true, "is_readonly": true,
        "group_name": "Identitas Standar", "group_order": 1, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "JUDUL_STANDAR", "tag_placeholder": "${JUDUL_STANDAR}",
        "label": "Judul Standar", "data_type": "text", "source_type": "static",
        "is_required": true, "placeholder_text": "Nama standar",
        "group_name": "Identitas Standar", "group_order": 1, "field_order": 2, "col_span": 24
      },
      {
        "tag_key": "VERSI_STANDAR", "tag_placeholder": "${VERSI_STANDAR}",
        "label": "Versi", "data_type": "text", "source_type": "static",
        "is_required": true, "default_value": "1.0",
        "group_name": "Identitas Standar", "group_order": 1, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "TANGGAL_EFEKTIF_STD", "tag_placeholder": "${TANGGAL_EFEKTIF_STD}",
        "label": "Tanggal Efektif", "data_type": "date", "source_type": "static",
        "is_required": true, "format_pattern": "dd/MM/yyyy",
        "group_name": "Identitas Standar", "group_order": 1, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "KLASIFIKASI_DATA", "tag_placeholder": "${KLASIFIKASI_DATA}",
        "label": "Klasifikasi Data", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"Publik\",\"value\":\"public\"},{\"label\":\"Internal\",\"value\":\"internal\"},{\"label\":\"Rahasia\",\"value\":\"confidential\"},{\"label\":\"Sangat Rahasia\",\"value\":\"secret\"}]}",
        "is_required": true,
        "group_name": "Kebijakan", "group_order": 2, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "LEVEL_KEAMANAN", "tag_placeholder": "${LEVEL_KEAMANAN}",
        "label": "Level Keamanan", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"Level 1 - Basic\",\"value\":\"L1\"},{\"label\":\"Level 2 - Standard\",\"value\":\"L2\"},{\"label\":\"Level 3 - Enhanced\",\"value\":\"L3\"},{\"label\":\"Level 4 - Maximum\",\"value\":\"L4\"}]}",
        "is_required": true,
        "group_name": "Kebijakan", "group_order": 2, "field_order": 2, "col_span": 12
      },
      {
        "tag_key": "DESKRIPSI_KEBIJAKAN", "tag_placeholder": "${DESKRIPSI_KEBIJAKAN}",
        "label": "Deskripsi Kebijakan", "data_type": "textarea", "source_type": "static",
        "is_required": true, "placeholder_text": "Uraian kebijakan keamanan informasi",
        "group_name": "Kebijakan", "group_order": 2, "field_order": 3, "col_span": 24
      },
      {
        "tag_key": "REFERENSI_ISO", "tag_placeholder": "${REFERENSI_ISO}",
        "label": "Referensi ISO", "data_type": "text", "source_type": "static",
        "is_required": false, "default_value": "ISO 27001:2022",
        "group_name": "Kebijakan", "group_order": 2, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "AUDIT_TERAKHIR", "tag_placeholder": "${AUDIT_TERAKHIR}",
        "label": "Tanggal Audit Terakhir", "data_type": "date", "source_type": "static",
        "is_required": false, "format_pattern": "dd/MM/yyyy",
        "group_name": "Audit & Compliance", "group_order": 3, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "AUDITOR", "tag_placeholder": "${AUDITOR}",
        "label": "Auditor", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": false,
        "group_name": "Audit & Compliance", "group_order": 3, "field_order": 2, "col_span": 12
      },
      {
        "tag_key": "COMPLIANCE_EMAIL", "tag_placeholder": "${COMPLIANCE_EMAIL}",
        "label": "Email Compliance", "data_type": "email", "source_type": "static",
        "is_required": false, "placeholder_text": "compliance@askara.co.id",
        "group_name": "Audit & Compliance", "group_order": 3, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "LINK_REFERENSI", "tag_placeholder": "${LINK_REFERENSI}",
        "label": "Link Referensi", "data_type": "url", "source_type": "static",
        "is_required": false, "placeholder_text": "https://iso.org/...",
        "group_name": "Audit & Compliance", "group_order": 3, "field_order": 4, "col_span": 12
      }
    ]
  }'
  echo "   ✅ Tags STD IT created"
fi

# --- Template 5: OPL (One Point Lesson) ---
echo ""
echo "   📄 Creating Template OPL..."
TMPL_OPL=$(post_multipart "$API/templates" \
  -F "name=Template One Point Lesson" \
  -F "code=TPL-OPL-01" \
  -F "document_type_id=$DT_OPL" \
  -F "category_id=$CAT_OPS" \
  -F "description=Template OPL untuk sharing knowledge singkat 1 halaman terkait tips, improvement, atau problem solving" \
  -F "file=@$DUMMY_DOCX;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document")
echo "   ✅ Template OPL: $TMPL_OPL"

if [[ "$TMPL_OPL" != SKIP* ]]; then
  bulk_tags "$TMPL_OPL" '{
    "tags": [
      {
        "tag_key": "NOMOR_OPL", "tag_placeholder": "${NOMOR_OPL}",
        "label": "Nomor OPL", "data_type": "auto", "source_type": "auto",
        "is_required": true, "is_readonly": true,
        "group_name": "Info OPL", "group_order": 1, "field_order": 1, "col_span": 12
      },
      {
        "tag_key": "JUDUL_OPL", "tag_placeholder": "${JUDUL_OPL}",
        "label": "Judul OPL", "data_type": "text", "source_type": "static",
        "is_required": true, "placeholder_text": "Judul singkat dan jelas",
        "group_name": "Info OPL", "group_order": 1, "field_order": 2, "col_span": 24
      },
      {
        "tag_key": "TIPE_OPL", "tag_placeholder": "${TIPE_OPL}",
        "label": "Tipe OPL", "data_type": "select", "source_type": "static",
        "source_config": "{\"options\":[{\"label\":\"💡 Basic Knowledge\",\"value\":\"basic\"},{\"label\":\"🔧 Improvement\",\"value\":\"improvement\"},{\"label\":\"⚠️ Problem Case\",\"value\":\"problem\"}]}",
        "is_required": true,
        "group_name": "Info OPL", "group_order": 1, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "AREA_KERJA", "tag_placeholder": "${AREA_KERJA}",
        "label": "Area Kerja", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/departments\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": true,
        "group_name": "Info OPL", "group_order": 1, "field_order": 4, "col_span": 12
      },
      {
        "tag_key": "TANGGAL_OPL", "tag_placeholder": "${TANGGAL_OPL}",
        "label": "Tanggal Pembuatan", "data_type": "date", "source_type": "static",
        "is_required": true, "format_pattern": "dd/MM/yyyy",
        "group_name": "Info OPL", "group_order": 1, "field_order": 5, "col_span": 12
      },
      {
        "tag_key": "PEMBUAT_OPL", "tag_placeholder": "${PEMBUAT_OPL}",
        "label": "Dibuat Oleh", "data_type": "select", "source_type": "api",
        "source_config": "{\"endpoint\":\"/users\",\"label_field\":\"name\",\"value_field\":\"id\"}",
        "is_required": true,
        "group_name": "Info OPL", "group_order": 1, "field_order": 6, "col_span": 12
      },
      {
        "tag_key": "DESKRIPSI_MASALAH", "tag_placeholder": "${DESKRIPSI_MASALAH}",
        "label": "Deskripsi / Masalah", "data_type": "textarea", "source_type": "static",
        "is_required": true, "placeholder_text": "Jelaskan situasi, masalah, atau pengetahuan yang ingin dibagikan",
        "group_name": "Konten", "group_order": 2, "field_order": 1, "col_span": 24
      },
      {
        "tag_key": "SOLUSI_TINDAKAN", "tag_placeholder": "${SOLUSI_TINDAKAN}",
        "label": "Solusi / Tindakan", "data_type": "textarea", "source_type": "static",
        "is_required": true, "placeholder_text": "Jelaskan solusi atau tindakan yang diambil",
        "group_name": "Konten", "group_order": 2, "field_order": 2, "col_span": 24
      },
      {
        "tag_key": "DURASI_TRAINING", "tag_placeholder": "${DURASI_TRAINING}",
        "label": "Durasi Training (menit)", "data_type": "number", "source_type": "static",
        "is_required": false, "default_value": "15", "min_value": 5, "max_value": 60,
        "group_name": "Konten", "group_order": 2, "field_order": 3, "col_span": 12
      },
      {
        "tag_key": "PERLU_DEMO", "tag_placeholder": "${PERLU_DEMO}",
        "label": "Perlu Demonstrasi", "data_type": "checkbox", "source_type": "static",
        "is_required": false, "default_value": "false",
        "group_name": "Konten", "group_order": 2, "field_order": 4, "col_span": 12
      }
    ]
  }'
  echo "   ✅ Tags OPL created"
fi

echo ""
echo "========================================"
echo "  2. DOCUMENTS — Buat Dokumen dengan Metadata"
echo "========================================"

# Document 1: SOP dari template SOP Quality
echo "   📄 Creating SOP Pengendalian Dokumen..."
META_SOP='{"JUDUL_SOP":"SOP Pengendalian Dokumen Terkendali","DEPARTEMEN":"'$DEPT_QMS'","KATEGORI_PROSES":"core","TANGGAL_EFEKTIF":"2026-04-01","REVISI_KE":"0","TUJUAN":"Menetapkan prosedur pengendalian dokumen untuk memastikan dokumen yang digunakan adalah versi terbaru dan terkendali sesuai ISO 9001:2015","RUANG_LINGKUP":"Seluruh departemen di PT Askara Internal yang menggunakan dokumen terkendali","REFERENSI":"ISO 9001:2015 Klausul 7.5, Kebijakan Mutu PT Askara"}'
DOC_SOP1=$(post "$API/documents" '{
  "template_id":"'$TMPL_SOP'",
  "title":"SOP Pengendalian Dokumen Terkendali",
  "description":"Prosedur pengendalian dokumen untuk memastikan seluruh dokumen yang beredar adalah versi terbaru dan terkendali",
  "department_id":"'$DEPT_QMS'",
  "category_id":"'$CAT_QLT'",
  "priority":"high",
  "confidentiality":"internal",
  "metadata":"'"$(echo $META_SOP | python3 -c "import sys; print(sys.stdin.read().strip().replace('\"','\\\"'))" 2>/dev/null || echo $META_SOP)"'"
}')
echo "   ✅ SOP Pengendalian Dokumen: $DOC_SOP1"

# Document 2: SOP Audit Internal
echo "   📄 Creating SOP Audit Internal..."
META_SOP2='{"JUDUL_SOP":"SOP Pelaksanaan Audit Internal","DEPARTEMEN":"'$DEPT_QMS'","KATEGORI_PROSES":"management","TANGGAL_EFEKTIF":"2026-05-01","REVISI_KE":"1","TUJUAN":"Menjamin pelaksanaan audit internal dilakukan secara sistematis dan efektif untuk mengevaluasi kepatuhan terhadap sistem manajemen mutu","RUANG_LINGKUP":"Seluruh proses bisnis yang tercakup dalam lingkup sertifikasi ISO 9001","REFERENSI":"ISO 19011:2018, ISO 9001:2015 Klausul 9.2"}'
DOC_SOP2=$(post "$API/documents" '{
  "template_id":"'$TMPL_SOP'",
  "title":"SOP Pelaksanaan Audit Internal",
  "description":"Prosedur audit internal untuk evaluasi kepatuhan terhadap sistem manajemen mutu",
  "department_id":"'$DEPT_QMS'",
  "category_id":"'$CAT_QLT'",
  "priority":"high",
  "confidentiality":"confidential",
  "metadata":"'"$(echo $META_SOP2 | python3 -c "import sys; print(sys.stdin.read().strip().replace('\"','\\\"'))")"'"
}')
echo "   ✅ SOP Audit Internal: $DOC_SOP2"

# Document 3: IK Rekrutmen Karyawan
if [[ "$TMPL_IK" != SKIP* ]]; then
  echo "   📄 Creating IK Rekrutmen Karyawan..."
  DOC_IK1=$(post "$API/documents" '{
    "template_id":"'$TMPL_IK'",
    "title":"Instruksi Kerja Rekrutmen Karyawan Baru",
    "description":"Langkah-langkah rekrutmen karyawan mulai dari posting lowongan hingga onboarding",
    "department_id":"'$DEPT_HR'",
    "category_id":"'$CAT_HR'",
    "priority":"normal",
    "confidentiality":"internal",
    "metadata":"{\"JUDUL_IK\":\"IK Rekrutmen Karyawan Baru\",\"DEPARTEMEN_IK\":\"'$DEPT_HR'\",\"TANGGAL_BERLAKU\":\"2026-04-15\",\"TUJUAN_IK\":\"Memastikan proses rekrutmen berjalan efektif dan efisien sesuai kebutuhan organisasi\",\"LOKASI_KERJA\":\"hq\",\"JUMLAH_PERSONIL\":\"3\"}"
  }')
  echo "   ✅ IK Rekrutmen: $DOC_IK1"

  # Document 4: IK Onboarding
  echo "   📄 Creating IK Onboarding..."
  DOC_IK2=$(post "$API/documents" '{
    "template_id":"'$TMPL_IK'",
    "title":"Instruksi Kerja Onboarding Karyawan",
    "description":"Prosedur onboarding karyawan baru termasuk orientasi, setup akun, dan pengenalan lingkungan kerja",
    "department_id":"'$DEPT_HR'",
    "category_id":"'$CAT_HR'",
    "priority":"normal",
    "confidentiality":"internal",
    "metadata":"{\"JUDUL_IK\":\"IK Onboarding Karyawan Baru\",\"DEPARTEMEN_IK\":\"'$DEPT_HR'\",\"TANGGAL_BERLAKU\":\"2026-04-15\",\"TUJUAN_IK\":\"Memastikan karyawan baru mendapat orientasi yang memadai dan siap bekerja dalam 2 minggu pertama\",\"LOKASI_KERJA\":\"all\",\"JUMLAH_PERSONIL\":\"2\"}"
  }')
  echo "   ✅ IK Onboarding: $DOC_IK2"
fi

# Document 5: Formulir Pengajuan Anggaran IT
if [[ "$TMPL_FRM" != SKIP* ]]; then
  echo "   📄 Creating Form Pengajuan Anggaran IT..."
  DOC_FRM1=$(post "$API/documents" '{
    "template_id":"'$TMPL_FRM'",
    "title":"Pengajuan Anggaran Server Baru Q2 2026",
    "description":"Pengajuan anggaran untuk pembelian 2 unit server rack untuk data center",
    "department_id":"'$DEPT_IT'",
    "category_id":"'$CAT_FIN'",
    "priority":"high",
    "confidentiality":"confidential",
    "metadata":"{\"TANGGAL_PENGAJUAN\":\"2026-04-10\",\"JENIS_PENGAJUAN\":\"new_budget\",\"MATA_UANG\":\"IDR\",\"JUMLAH_ANGGARAN\":\"250000000\",\"KODE_AKUN\":\"5210-001\",\"URAIAN_KEBUTUHAN\":\"Pembelian 2 unit server rack Dell PowerEdge R750 untuk upgrade infrastruktur data center. Kebutuhan meningkat seiring pertumbuhan user dan data perusahaan.\",\"LAMPIRAN\":\"true\",\"CATATAN_TAMBAHAN\":\"Sudah mendapat quotation dari 3 vendor. Vendor terpilih: PT Synnex Metrodata\"}"
  }')
  echo "   ✅ Form Anggaran IT: $DOC_FRM1"

  # Document 6: Formulir Reimbursement
  echo "   📄 Creating Form Reimbursement..."
  DOC_FRM2=$(post "$API/documents" '{
    "template_id":"'$TMPL_FRM'",
    "title":"Reimbursement Biaya Training ISO 27001",
    "description":"Pengajuan reimbursement biaya training sertifikasi ISO 27001 Lead Auditor",
    "department_id":"'$DEPT_IT'",
    "category_id":"'$CAT_FIN'",
    "priority":"normal",
    "confidentiality":"internal",
    "metadata":"{\"TANGGAL_PENGAJUAN\":\"2026-04-12\",\"JENIS_PENGAJUAN\":\"reimbursement\",\"MATA_UANG\":\"IDR\",\"JUMLAH_ANGGARAN\":\"15000000\",\"KODE_AKUN\":\"5310-002\",\"URAIAN_KEBUTUHAN\":\"Reimbursement biaya training sertifikasi ISO 27001 Lead Auditor untuk 2 orang staff IT Security. Training dilaksanakan 7-11 April 2026 di Jakarta.\",\"LAMPIRAN\":\"true\"}"
  }')
  echo "   ✅ Form Reimbursement: $DOC_FRM2"
fi

# Document 7: Standar Keamanan
if [[ "$TMPL_STD" != SKIP* ]]; then
  echo "   📄 Creating Standar Keamanan Informasi..."
  DOC_STD1=$(post "$API/documents" '{
    "template_id":"'$TMPL_STD'",
    "title":"Standar Keamanan Informasi PT Askara",
    "description":"Standar keamanan informasi perusahaan berdasarkan ISO 27001:2022",
    "department_id":"'$DEPT_IT'",
    "category_id":"'$CAT_IT'",
    "priority":"high",
    "confidentiality":"confidential",
    "metadata":"{\"JUDUL_STANDAR\":\"Standar Keamanan Informasi PT Askara Internal\",\"VERSI_STANDAR\":\"2.0\",\"TANGGAL_EFEKTIF_STD\":\"2026-01-01\",\"KLASIFIKASI_DATA\":\"confidential\",\"LEVEL_KEAMANAN\":\"L3\",\"DESKRIPSI_KEBIJAKAN\":\"Standar keamanan informasi ini mengatur klasifikasi data, kontrol akses, enkripsi, backup, incident response, dan audit keamanan di seluruh lingkungan IT PT Askara Internal.\",\"REFERENSI_ISO\":\"ISO 27001:2022\",\"COMPLIANCE_EMAIL\":\"security@askara.co.id\",\"LINK_REFERENSI\":\"https://www.iso.org/standard/27001\"}"
  }')
  echo "   ✅ Standar Keamanan: $DOC_STD1"
fi

# Document 8: OPL
if [[ "$TMPL_OPL" != SKIP* ]]; then
  echo "   📄 Creating OPL Troubleshooting Printer..."
  DOC_OPL1=$(post "$API/documents" '{
    "template_id":"'$TMPL_OPL'",
    "title":"OPL: Troubleshooting Printer Paper Jam",
    "description":"One Point Lesson cara mengatasi paper jam pada printer multifungsi",
    "department_id":"'$DEPT_GAF'",
    "category_id":"'$CAT_OPS'",
    "priority":"low",
    "confidentiality":"public",
    "metadata":"{\"JUDUL_OPL\":\"Troubleshooting Printer Paper Jam\",\"TIPE_OPL\":\"basic\",\"TANGGAL_OPL\":\"2026-04-14\",\"DESKRIPSI_MASALAH\":\"Printer multifungsi sering mengalami paper jam terutama saat print volume besar. Penyebab utama: kertas lembab, tray tidak rapi, roller kotor.\",\"SOLUSI_TINDAKAN\":\"1. Matikan printer dan buka cover\\n2. Tarik kertas perlahan searah jalur kertas\\n3. Bersihkan roller dengan kain lembab\\n4. Pastikan kertas kering dan tray rapi\\n5. Lakukan test print\",\"DURASI_TRAINING\":\"10\",\"PERLU_DEMO\":\"true\"}"
  }')
  echo "   ✅ OPL Printer: $DOC_OPL1"

  echo "   📄 Creating OPL Improvement 5S..."
  DOC_OPL2=$(post "$API/documents" '{
    "template_id":"'$TMPL_OPL'",
    "title":"OPL: Penerapan 5S di Area Gudang",
    "description":"One Point Lesson penerapan 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke) di area gudang",
    "department_id":"'$DEPT_OPS'",
    "category_id":"'$CAT_OPS'",
    "priority":"normal",
    "confidentiality":"internal",
    "metadata":"{\"JUDUL_OPL\":\"Penerapan 5S di Area Gudang\",\"TIPE_OPL\":\"improvement\",\"TANGGAL_OPL\":\"2026-04-10\",\"DESKRIPSI_MASALAH\":\"Area gudang sering berantakan, sulit mencari barang, dan menimbulkan risiko kecelakaan kerja. Perlu penerapan 5S secara konsisten.\",\"SOLUSI_TINDAKAN\":\"1. Seiri: Pilah barang yang diperlukan dan tidak\\n2. Seiton: Tata barang sesuai frekuensi penggunaan\\n3. Seiso: Bersihkan area secara rutin\\n4. Seiketsu: Buat standar visual (label, garis)\\n5. Shitsuke: Audit mingguan oleh supervisor\",\"DURASI_TRAINING\":\"30\",\"PERLU_DEMO\":\"true\"}"
  }')
  echo "   ✅ OPL 5S: $DOC_OPL2"
fi

echo ""
echo "========================================"
echo "  SELESAI!"
echo "========================================"
echo ""
echo "📊 Ringkasan Data yang Dibuat:"
echo "   • 5 Template (1 updated + 4 baru)"
echo "   • ~55 Template Tags total (13+10+11+12+10)"
echo "   • ~10 Dokumen baru dengan metadata lengkap"
echo ""
echo "📝 Template Tags mencakup:"
echo "   • text, textarea, number, date, checkbox"
echo "   • select static (dropdown manual)"
echo "   • select API (departments, users)"
echo "   • email, phone, url"
echo "   • auto (nomor otomatis)"
echo "   • validasi regex, min/max, required"
echo ""
echo "🔗 Buka di browser:"
echo "   http://localhost:4100/templates"
echo "   http://localhost:4100/documents"
