import { MenuItem } from './sidebar.component';

export const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/dashboard'
  },
  {
    key: 'documents',
    label: 'Dokumen',
    icon: 'file-text',
    route: '/documents'
  },
  {
    key: 'workflows',
    label: 'Workflow',
    icon: 'branches',
    route: '/workflows',
    permission: 'workflow.view'
  },
  {
    key: 'templates',
    label: 'Template',
    icon: 'folder',
    route: '/templates',
    permission: 'template.view'
  },
  {
    key: 'numbering',
    label: 'Penomoran',
    icon: 'ordered-list',
    route: '/numbering',
    permission: 'template.view'
  },
  {
    key: 'master',
    label: 'Master Data',
    icon: 'database',
    route: '/master',
    permission: 'document.view'
  },
  {
    key: 'organization',
    label: 'Organisasi',
    icon: 'apartment',
    route: '/organization',
    permission: 'company.view'
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: 'team',
    route: '/users',
    permission: 'user.view'
  },
  {
    key: 'roles',
    label: 'Role',
    icon: 'safety',
    route: '/roles',
    permission: 'user.assign_role'
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
