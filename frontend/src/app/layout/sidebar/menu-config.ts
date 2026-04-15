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
    key: 'templates',
    label: 'Template',
    icon: 'folder',
    route: '/templates'
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: 'team',
    route: '/users',
    permission: 'user.view'
  },
  {
    key: 'organization',
    label: 'Organisasi',
    icon: 'apartment',
    route: '/organization',
    permission: 'company.view'
  },
  {
    key: 'roles',
    label: 'Role',
    icon: 'safety',
    route: '/roles',
    permission: 'user.assign_role'
  }
];
