import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User, DropdownItem } from '../user.models';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzAvatarModule, NzDropDownModule, NzModalModule,
    UserFormComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  users = signal<User[]>([]);
  loading = signal(false);
  searchText = '';

  // Drawer
  drawerVisible = false;
  editUser: User | null = null;
  departments = signal<DropdownItem[]>([]);
  sections = signal<DropdownItem[]>([]);
  positions = signal<DropdownItem[]>([]);
  roleOptions = signal<DropdownItem[]>([]);

  ngOnInit() {
    this.loadUsers();
    this.loadDropdowns();
  }

  loadUsers() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchText) params.search = this.searchText;

    this.http.get<any>(`${environment.apiUrl}/users`, { params }).subscribe({
      next: (res) => {
        this.users.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.loadUsers();
  }

  openDrawer(user?: User) {
    this.editUser = user || null;
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editUser = null;
  }

  onFormSaved() {
    this.closeDrawer();
    this.loadUsers();
  }

  toggleStatus(user: User) {
    this.http.patch(`${environment.apiUrl}/users/${user.id}/status`, {
      is_active: !user.is_active
    }).subscribe({
      next: () => {
        this.message.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        this.loadUsers();
      },
      error: () => this.message.error('Gagal mengubah status')
    });
  }

  deleteUser(user: User) {
    this.modal.confirm({
      nzTitle: 'Hapus User?',
      nzContent: `Yakin ingin menghapus user "${user.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/users/${user.id}`).subscribe({
          next: () => {
            this.message.success('User berhasil dihapus');
            this.loadUsers();
          },
          error: () => this.message.error('Gagal menghapus user')
        });
      }
    });
  }

  private loadDropdowns() {
    this.http.get<any>(`${environment.apiUrl}/departments`).subscribe({
      next: (res) => this.departments.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/sections`).subscribe({
      next: (res) => this.sections.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/positions`).subscribe({
      next: (res) => this.positions.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/roles`).subscribe({
      next: (res) => this.roleOptions.set(res.data || [])
    });
  }
}
