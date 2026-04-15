import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'companies',
    pathMatch: 'full'
  },
  {
    path: 'companies',
    loadComponent: () => import('./companies/company-list.component').then(m => m.CompanyListComponent),
    title: 'Perusahaan'
  },
  {
    path: 'offices',
    loadComponent: () => import('./offices/office-list.component').then(m => m.OfficeListComponent),
    title: 'Kantor'
  },
  {
    path: 'departments',
    loadComponent: () => import('./departments/department-list.component').then(m => m.DepartmentListComponent),
    title: 'Departemen'
  },
  {
    path: 'sections',
    loadComponent: () => import('./sections/section-list.component').then(m => m.SectionListComponent),
    title: 'Seksi'
  },
  {
    path: 'positions',
    loadComponent: () => import('./positions/position-list.component').then(m => m.PositionListComponent),
    title: 'Jabatan'
  }
];
