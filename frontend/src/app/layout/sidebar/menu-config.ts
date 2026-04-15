import { MenuItem } from './sidebar.component';

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    route: '/dashboard'
  },
  {
    key: 'documents',
    label: 'Dokumen',
    icon: 'file-text',
    permission: 'document.view',
    children: [
      {
        key: 'doc-create',
        label: 'Buat Baru',
        route: '/documents/create',
        permission: 'document.create'
      },
      {
        key: 'doc-my',
        label: 'Dokumen Saya',
        route: '/documents/my',
        permission: 'document.view'
      },
      {
        key: 'doc-pending-review',
        label: 'Perlu Review',
        route: '/documents/pending-review',
        permission: 'document.review'
      },
      {
        key: 'doc-pending-approval',
        label: 'Perlu Approval',
        route: '/documents/pending-approval',
        permission: 'document.approve'
      },
      {
        key: 'doc-all',
        label: 'Semua Dokumen',
        route: '/documents',
        permission: 'document.view'
      }
    ]
  },
  {
    key: 'templates',
    label: 'Template',
    icon: 'layout',
    route: '/templates',
    permission: 'template.view'
  },
  {
    key: 'workflows',
    label: 'Workflow',
    icon: 'git-branch',
    route: '/workflows',
    permission: 'workflow.view'
  },
  {
    key: 'organization',
    label: 'Organisasi',
    icon: 'building',
    permission: 'company.view',
    children: [
      {
        key: 'org-companies',
        label: 'Perusahaan',
        route: '/organization/companies',
        permission: 'company.view'
      },
      {
        key: 'org-offices',
        label: 'Kantor',
        route: '/organization/offices',
        permission: 'office.view'
      },
      {
        key: 'org-departments',
        label: 'Departemen',
        route: '/organization/departments',
        permission: 'department.view'
      },
      {
        key: 'org-sections',
        label: 'Seksi',
        route: '/organization/sections',
        permission: 'section.view'
      },
      {
        key: 'org-positions',
        label: 'Jabatan',
        route: '/organization/positions',
        permission: 'position.view'
      }
    ]
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: 'users',
    route: '/users',
    permission: 'user.view'
  },
  {
    key: 'roles',
    label: 'Role & Permissions',
    icon: 'shield',
    route: '/roles',
    permission: 'user.assign_role'
  },
  {
    key: 'categories',
    label: 'Kategori',
    icon: 'folder',
    route: '/categories',
    permission: 'template.view'
  },
  {
    key: 'audit-logs',
    label: 'Audit Log',
    icon: 'activity',
    route: '/audit-logs',
    permission: 'audit.view'
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: 'settings',
    route: '/settings',
    permission: 'setting.view'
  }
];
