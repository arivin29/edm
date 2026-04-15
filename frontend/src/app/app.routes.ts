import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Auth routes (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login.page').then(m => m.LoginPage),
        title: 'Login - DMS'
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Protected routes (authenticated)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
        title: 'Dashboard - DMS'
      },
      // Documents
      {
        path: 'documents',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/documents/document-list.page').then(m => m.DocumentListPage),
            title: 'Dokumen - DMS'
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/documents/document-form.page').then(m => m.DocumentFormPage),
            title: 'Buat Dokumen - DMS'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/documents/document-detail.page').then(m => m.DocumentDetailPage),
            title: 'Detail Dokumen - DMS'
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./pages/documents/document-form.page').then(m => m.DocumentFormPage),
            title: 'Edit Dokumen - DMS'
          }
        ]
      },
      // Users
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/user-list.page').then(m => m.UserListPage),
        title: 'Pengguna - DMS'
      },
      // Organization
      {
        path: 'organization',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organization/organization.page').then(m => m.OrganizationPage),
            title: 'Organisasi - DMS'
          }
        ]
      },
      // Master Data (Document Types, Categories, Templates)
      {
        path: 'master',
        children: [
          {
            path: 'document-types',
            loadComponent: () =>
              import('./pages/master/document-types.page').then(m => m.DocumentTypesPage),
            title: 'Tipe Dokumen - DMS'
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./pages/master/categories.page').then(m => m.CategoriesPage),
            title: 'Kategori Dokumen - DMS'
          },
          {
            path: 'templates',
            loadComponent: () =>
              import('./pages/templates/template-list.page').then(m => m.TemplateListPage),
            title: 'Template - DMS'
          },
          {
            path: '',
            redirectTo: 'document-types',
            pathMatch: 'full'
          }
        ]
      },
      // Roles
      {
        path: 'roles',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/roles/role-list.page').then(m => m.RoleListPage),
            title: 'Role - DMS'
          }
        ]
      },
      // Workflows
      {
        path: 'workflows',
        loadComponent: () =>
          import('./pages/workflows/workflow-list.page').then(m => m.WorkflowListPage),
        title: 'Workflow - DMS'
      },
      // Document Numbering
      {
        path: 'numbering',
        loadComponent: () =>
          import('./pages/numbering/numbering-list.page').then(m => m.NumberingListPage),
        title: 'Penomoran - DMS'
      },
      // System Settings
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then(m => m.SettingsPage),
        title: 'Pengaturan - DMS'
      },
      // Audit Logs
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit/audit-log.page').then(m => m.AuditLogPage),
        title: 'Audit Log - DMS'
      },
      // Notifications
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notification-list.page').then(m => m.NotificationListPage),
        title: 'Notifikasi - DMS'
      },
      // Profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.page').then(m => m.ProfilePage),
        title: 'Profil - DMS'
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
