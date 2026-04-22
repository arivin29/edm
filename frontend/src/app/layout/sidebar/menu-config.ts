import { MenuItem } from './sidebar.component';

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard'
  },
  {
    key: 'distribution-inbox',
    label: 'Distribusi Masuk',
    icon: 'inbox',
    route: '/distributions/inbox'
  },
  {
    key: 'documents',
    label: 'Dokumen',
    icon: 'file-text',
    children: [
      { key: 'doc-all', label: 'Semua Dokumen', route: '/documents' }
    ]
  },
  {
    key: 'master',
    label: 'Master Data',
    icon: 'database',
    permission: 'document.view',
    children: [
      { key: 'master-doc-types', label: 'Tipe Dokumen', route: '/master/document-types' },
      { key: 'master-categories', label: 'Kategori Dokumen', route: '/master/categories' },
      { key: 'master-templates', label: 'Template', route: '/master/templates', permission: 'template.view' }
    ]
  },
  {
    key: 'workflow-group',
    label: 'Workflow & Penomoran',
    icon: 'branches',
    permission: 'workflow.view',
    children: [
      { key: 'workflows', label: 'Workflow', route: '/workflows' },
      { key: 'numbering', label: 'Penomoran', route: '/numbering' }
    ]
  },
  {
    key: 'organization',
    label: 'Organisasi',
    icon: 'apartment',
    route: '/organization',
    permission: 'company.view'
  },
  {
    key: 'access',
    label: 'Manajemen Akses',
    icon: 'team',
    permission: 'user.view',
    children: [
      { key: 'users', label: 'Pengguna', route: '/users' },
      { key: 'roles', label: 'Role & Permission', route: '/roles', permission: 'user.assign_role' }
    ]
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: 'setting',
    route: '/settings',
    permission: 'setting.view'
  },
  {
    key: 'audit-logs',
    label: 'Audit Log',
    icon: 'audit',
    route: '/audit-logs',
    permission: 'audit.view'
  }
];
