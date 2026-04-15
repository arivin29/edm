import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./document-list/document-list.component').then(m => m.DocumentListComponent),
    title: 'Dokumen'
  },
  {
    path: ':id',
    loadComponent: () => import('./document-detail/document-detail.component').then(m => m.DocumentDetailComponent),
    title: 'Detail Dokumen'
  }
];
