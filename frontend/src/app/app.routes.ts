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
              import('./pages/documents/document-detail/document-detail-layout.component').then(m => m.DocumentDetailLayoutComponent),
            title: 'Detail Dokumen - DMS',
            children: [
              { path: '', redirectTo: 'info', pathMatch: 'full' },
              {
                path: 'info',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-info-view/doc-info-view.component').then(m => m.DocInfoViewComponent),
                title: 'Informasi Dokumen - DMS'
              },
              {
                path: 'editor',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-editor-view/doc-editor-view.component').then(m => m.DocEditorViewComponent),
                title: 'Editor Dokumen - DMS'
              },
              {
                path: 'files',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-files-view/doc-files-view.component').then(m => m.DocFilesViewComponent),
                title: 'Berkas Dokumen - DMS'
              },
              {
                path: 'versions',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-versions-view/doc-versions-view.component').then(m => m.DocVersionsViewComponent),
                title: 'Riwayat Versi - DMS'
              },
              {
                path: 'parameters',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-parameters-view/doc-parameters-view.component').then(m => m.DocParametersViewComponent),
                title: 'Parameter Dokumen - DMS'
              },
              {
                path: 'comments',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-comments-view/doc-comments-view.component').then(m => m.DocCommentsViewComponent),
                title: 'Komentar Dokumen - DMS'
              },
              {
                path: 'workflow',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-workflow-view/doc-workflow-view.component').then(m => m.DocWorkflowViewComponent),
                title: 'Workflow Dokumen - DMS'
              },
              {
                path: 'distribution',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-distribution-view/doc-distribution-view.component').then(m => m.DocDistributionViewComponent),
                title: 'Distribusi Dokumen - DMS'
              },
              {
                path: 'signatures',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-signatures-view/doc-signatures-view.component').then(m => m.DocSignaturesViewComponent),
                title: 'Tanda Tangan Dokumen - DMS'
              },
              {
                path: 'ocr',
                loadComponent: () =>
                  import('./pages/documents/document-detail/views/doc-ocr-view/doc-ocr-view.component').then(m => m.DocOcrViewComponent),
                title: 'OCR Dokumen - DMS'
              }
            ]
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
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/users/user-list/user-list.component').then(m => m.UserListPage),
            title: 'Pengguna - DMS'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/users/user-detail/user-detail-layout.component').then(m => m.UserDetailLayoutComponent),
            title: 'Detail User - DMS',
            children: [
              { path: '', redirectTo: 'overview', pathMatch: 'full' },
              {
                path: 'overview',
                loadComponent: () =>
                  import('./pages/users/user-detail/views/user-overview-view.component').then(m => m.UserOverviewViewComponent),
                title: 'Overview User - DMS'
              },
              {
                path: 'edit',
                loadComponent: () =>
                  import('./pages/users/user-detail/views/user-edit-view.component').then(m => m.UserEditViewComponent),
                title: 'Edit User - DMS'
              },
              {
                path: 'roles',
                loadComponent: () =>
                  import('./pages/users/user-detail/views/user-roles-view.component').then(m => m.UserRolesViewComponent),
                title: 'Role User - DMS'
              },
              {
                path: 'activity',
                loadComponent: () =>
                  import('./pages/users/user-detail/views/user-activity-view.component').then(m => m.UserActivityViewComponent),
                title: 'Aktivitas User - DMS'
              }
            ]
          }
        ]
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
      // SLA Monitoring
      {
        path: 'sla',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/sla/sla-dashboard/sla-dashboard.component').then(m => m.SLADashboardPage),
            title: 'SLA Monitoring - DMS'
          },
          {
            path: 'breached',
            loadComponent: () =>
              import('./pages/sla/sla-breached/sla-breached.component').then(m => m.SLABreachedPage),
            title: 'SLA Terlewat - DMS'
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
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
      // Profile (multi-section)
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile-layout/profile-layout.component').then(m => m.ProfileLayoutComponent),
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          {
            path: 'overview',
            loadComponent: () =>
              import('./pages/profile/profile-overview/profile-overview.component').then(m => m.ProfileOverviewComponent),
            title: 'Profil Saya - DMS'
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/profile/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'Edit Profil - DMS'
          },
          {
            path: 'security',
            loadComponent: () =>
              import('./pages/profile/profile-security/profile-security.component').then(m => m.ProfileSecurityComponent),
            title: 'Keamanan Akun - DMS'
          },
          {
            path: 'signature',
            loadComponent: () =>
              import('./pages/profile/profile-signature/profile-signature.component').then(m => m.ProfileSignatureComponent),
            title: 'Tanda Tangan Digital - DMS'
          },
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
