import { Routes } from '@angular/router';

export const TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./template-list/template-list.component').then(m => m.TemplateListComponent),
    title: 'Template'
  }
];
