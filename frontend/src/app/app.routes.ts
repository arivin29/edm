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
      // Templates
      {
        path: 'templates',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/templates/template-list.page').then(m => m.TemplateListPage),
            title: 'Template - DMS'
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
