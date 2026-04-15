import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableAction, TableSort } from '../../../shared/components/data-table/data-table.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { UsersService } from '../../../api/services/users.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    PageHeaderComponent,
    DrawerComponent,
    ConfirmModalComponent,
    UserFormComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  private readonly usersApi = inject(UsersService);
  private readonly authState = inject(AuthStateService);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Pengguna' }
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Nama', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      width: '120px',
      format: (val) => val?.name || '-'
    },
    {
      key: 'department',
      label: 'Departemen',
      width: '150px',
      format: (val) => val?.name || '-'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'badge',
      width: '100px',
      badgeMap: {
        'true': { label: 'Aktif', class: 'badge-success' },
        'false': { label: 'Nonaktif', class: 'badge-gray' }
      },
      format: (val) => String(val)
    },
    { key: 'updated_at', label: 'Diperbarui', type: 'datetime', sortable: true, width: '140px' }
  ];

  actions: TableAction[] = [
    { key: 'edit', label: 'Edit' },
    { key: 'toggle', label: 'Aktifkan/Nonaktifkan' },
    { key: 'delete', label: 'Hapus', class: 'danger' }
  ];

  users = signal<any[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  formDrawerOpen = signal(false);
  deleteModalOpen = signal(false);
  selectedUser = signal<any>(null);
  formMode = signal<'create' | 'edit'>('create');
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.usersApi.usersGet({
      page: this.currentPage(),
      per_page: this.pageSize()
    }).subscribe({
      next: (response: any) => {
        this.users.set(response?.data || response || []);
        this.totalItems.set(response?.meta?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onActionClick(event: { action: string; row: any }): void {
    const { action, row } = event;

    switch (action) {
      case 'edit':
        this.selectedUser.set(row);
        this.formMode.set('edit');
        this.formDrawerOpen.set(true);
        break;
      case 'delete':
        this.selectedUser.set(row);
        this.deleteModalOpen.set(true);
        break;
    }
  }

  openCreateForm(): void {
    this.selectedUser.set(null);
    this.formMode.set('create');
    this.formDrawerOpen.set(true);
  }

  closeFormDrawer(): void {
    this.formDrawerOpen.set(false);
  }

  onFormSaved(): void {
    this.closeFormDrawer();
    this.loadUsers();
  }

  confirmDelete(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.usersApi.usersIdDelete({ id: user.id }).subscribe({
      next: () => {
        this.deleteModalOpen.set(false);
        this.isSubmitting.set(false);
        this.loadUsers();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
  }
}
