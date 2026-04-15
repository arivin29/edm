package migrations

import (
	"dms/app/facades"
)

type M20250414000014SeedDefaultData struct{}

func (r *M20250414000014SeedDefaultData) Signature() string {
	return "20250414000014_seed_default_data"
}

func (r *M20250414000014SeedDefaultData) Up() error {
	if _, err := facades.Orm().Query().Exec(`INSERT INTO roles (company_id, name, display_name, description, is_system) VALUES
		(NULL, 'super_admin',    'Super Admin',      'Full access ke seluruh sistem dan semua company', TRUE),
		(NULL, 'admin_company',  'Admin Company',    'Admin untuk satu company', TRUE),
		(NULL, 'admin_office',   'Admin Kantor',     'Admin untuk satu kantor', TRUE),
		(NULL, 'creator',        'Document Creator', 'Bisa membuat dan mengedit dokumen', TRUE),
		(NULL, 'reviewer',       'Reviewer',         'Bisa me-review dan memberikan comment', TRUE),
		(NULL, 'approver',       'Approver',         'Bisa meng-approve atau reject dokumen', TRUE),
		(NULL, 'viewer',         'Viewer',           'Hanya bisa melihat dokumen', TRUE)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`INSERT INTO permissions (name, module, description) VALUES
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
		('template.create',     'template', 'Membuat template baru'),
		('template.edit',       'template', 'Mengedit template'),
		('template.view',       'template', 'Melihat template'),
		('template.delete',     'template', 'Menghapus template'),
		('workflow.create',     'workflow', 'Membuat workflow baru'),
		('workflow.edit',       'workflow', 'Mengedit workflow'),
		('workflow.view',       'workflow', 'Melihat workflow'),
		('workflow.delete',     'workflow', 'Menghapus workflow'),
		('user.create',         'user', 'Membuat user baru'),
		('user.edit',           'user', 'Mengedit user'),
		('user.view',           'user', 'Melihat data user'),
		('user.delete',         'user', 'Menghapus user'),
		('user.assign_role',    'user', 'Assign role ke user'),
		('company.create',      'company', 'Membuat company baru'),
		('company.edit',        'company', 'Mengedit company'),
		('company.view',        'company', 'Melihat data company'),
		('office.create',       'office', 'Membuat kantor baru'),
		('office.edit',         'office', 'Mengedit kantor'),
		('office.view',         'office', 'Melihat data kantor'),
		('department.create',   'department', 'Membuat departemen baru'),
		('department.edit',     'department', 'Mengedit departemen'),
		('department.view',     'department', 'Melihat data departemen'),
		('section.create',      'section', 'Membuat section baru'),
		('section.edit',        'section', 'Mengedit section'),
		('section.view',        'section', 'Melihat data section'),
		('position.create',     'position', 'Membuat jabatan baru'),
		('position.edit',       'position', 'Mengedit jabatan'),
		('position.view',       'position', 'Melihat data jabatan'),
		('audit.view',          'audit', 'Melihat audit log'),
		('audit.export',        'audit', 'Export audit log'),
		('setting.view',        'setting', 'Melihat system settings'),
		('setting.edit',        'setting', 'Mengubah system settings'),
		('notification.manage', 'notification', 'Manage notification settings')`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`INSERT INTO document_types (name, code, description, sort_order) VALUES
		('Standard Operating Procedure', 'SOP', 'Prosedur operasional standar', 1),
		('Instruksi Kerja',              'IK',  'Instruksi kerja detail', 2),
		('Standar',                      'STD', 'Dokumen standar/spesifikasi', 3),
		('Formulir',                     'FRM', 'Formulir/form yang perlu diisi', 4),
		('One Point Lessons',            'OPL', 'Pelajaran singkat satu halaman', 5)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000014SeedDefaultData) Down() error {
	if _, err := facades.Orm().Query().Exec(`DELETE FROM document_types WHERE code IN ('SOP', 'IK', 'STD', 'FRM', 'OPL')`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DELETE FROM role_permissions`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DELETE FROM permissions`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DELETE FROM user_roles`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DELETE FROM roles WHERE is_system = TRUE`); err != nil {
		return err
	}
	return nil
}
