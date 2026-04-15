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
      {
        path: 'documents',
        loadChildren: () =>
          import('./features/documents/documents.routes').then(m => m.DOCUMENTS_ROUTES),
        title: 'Dokumen - DMS'
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USERS_ROUTES),
        title: 'Pengguna - DMS'
      },
      {
        path: 'organization',
        loadChildren: () =>
          import('./features/organization/organization.routes').then(m => m.ORGANIZATION_ROUTES),
        title: 'Organisasi - DMS'
      },
      {
        path: 'templates',
        loadChildren: () =>
          import('./features/templates/templates.routes').then(m => m.TEMPLATES_ROUTES),
        title: 'Template - DMS'
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
