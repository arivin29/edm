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
          import('./pages/dashboard/dashboard-page/dashboard-page.component').then(m => m.DashboardPage),
        title: 'Dashboard - DMS'
      },
      // Distributions Inbox
      {
        path: 'distributions/inbox',
        loadComponent: () =>
          import('./pages/distributions/distribution-inbox/distribution-inbox.component').then(m => m.DistributionInboxPage),
        title: 'Distribusi Masuk - DMS'
      },
      // Documents
      {
        path: 'documents',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/documents/document-list/document-list.component').then(m => m.DocumentListPage),
            title: 'Dokumen - DMS'
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/documents/document-form/document-form.component').then(m => m.DocumentFormPage),
            title: 'Buat Dokumen - DMS'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/documents/document-detail/document-detail.component').then(m => m.DocumentDetailPage),
            title: 'Detail Dokumen - DMS'
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./pages/documents/document-form/document-form.component').then(m => m.DocumentFormPage),
            title: 'Edit Dokumen - DMS'
          }
        ]
      },
      // Users
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/user-list/user-list.component').then(m => m.UserListPage),
        title: 'Pengguna - DMS'
      },
      // Organization
      {
        path: 'organization',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/organization/organization-list/organization-list.component').then(m => m.OrganizationListComponent),
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
              import('./pages/master/document-types/document-type-list/document-type-list.component').then(m => m.DocumentTypesPage),
            title: 'Tipe Dokumen - DMS'
          },
          {
            path: 'categories',
            loadComponent: () =>
              import('./pages/master/categories/category-list/category-list.component').then(m => m.CategoriesPage),
            title: 'Kategori Dokumen - DMS'
          },
          {
            path: 'templates',
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./pages/templates/template-list/template-list.component').then(m => m.TemplateListComponent),
                title: 'Template - DMS'
              },
              {
                path: ':id',
                loadComponent: () =>
                  import('./pages/templates/template-detail/template-detail.component').then(m => m.TemplateDetailComponent),
                title: 'Detail Template - DMS'
              }
            ]
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
              import('./pages/roles/role-list/role-list.component').then(m => m.RoleListPage),
            title: 'Role - DMS'
          }
        ]
      },
      // Workflows
      {
        path: 'workflows',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/workflows/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
            title: 'Workflow - DMS'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/workflows/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent),
            title: 'Detail Workflow - DMS'
          }
        ]
      },
      // Document Numbering
      {
        path: 'numbering',
        loadComponent: () =>
          import('./pages/numbering/numbering-list/numbering-list.component').then(m => m.NumberingListPage),
        title: 'Penomoran - DMS'
      },
      // System Settings
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings-list/settings-list.component').then(m => m.SettingsPage),
        title: 'Pengaturan - DMS'
      },
      // Audit Logs
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit/audit-log/audit-log.component').then(m => m.AuditLogPage),
        title: 'Audit Log - DMS'
      },
      // Notifications
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notification-list/notification-list.component').then(m => m.NotificationListPage),
        title: 'Notifikasi - DMS'
      },
      // Profile
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile-page/profile-page.component').then(m => m.ProfilePage),
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
