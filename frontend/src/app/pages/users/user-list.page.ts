import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  department_name?: string;
  position_name?: string;
  roles: {name: string}[];
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzAvatarModule, NzDropDownModule,
    NzDrawerModule, NzModalModule, NzFormModule, NzSelectModule, NzSwitchModule, NzSpinModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Pengguna</h1>
          <p class="text-gray-500 text-xs m-0">Kelola pengguna sistem</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span>
          Tambah User
        </button>
      </div>

      <!-- Search -->
      <nz-card nzSize="small" class="mb-3">
        <nz-input-group nzSize="small" [nzPrefix]="prefixIcon" class="w-64">
          <input nz-input placeholder="Cari user..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
        </nz-input-group>
        <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #userTable [nzData]="users()" [nzLoading]="loading()" 
                  nzSize="small" [nzPageSize]="15">
          <thead>
            <tr>
              <th nzWidth="250px">Nama</th>
              <th>Email</th>
              <th nzWidth="120px">Department</th>
              <th nzWidth="120px">Jabatan</th>
              <th nzWidth="150px">Role</th>
              <th nzWidth="70px">Status</th>
              <th nzWidth="70px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (user of userTable.data; track user.id) {
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <nz-avatar [nzSrc]="user.avatar" nzIcon="user" nzSize="small"></nz-avatar>
                    <span>{{ user.name }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.department_name || '-' }}</td>
                <td>{{ user.position_name || '-' }}</td>
                <td>
                  @for (role of user.roles; track role.name) {
                    <nz-tag>{{ role.name }}</nz-tag>
                  }
                </td>
                <td>
                  <nz-tag [nzColor]="user.is_active ? 'success' : 'default'">
                    {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                  </nz-tag>
                </td>
                <td>
                  <a nz-dropdown [nzDropdownMenu]="actionMenu" nzTrigger="click">
                    <span nz-icon nzType="more" class="cursor-pointer"></span>
                  </a>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu nzSelectable>
                      <li nz-menu-item (click)="openDrawer(user)">
                        <span nz-icon nzType="edit"></span> Edit
                      </li>
                      <li nz-menu-item (click)="toggleStatus(user)">
                        <span nz-icon [nzType]="user.is_active ? 'close' : 'check'"></span>
                        {{ user.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                      </li>
                      <li nz-menu-item nzDanger (click)="deleteUser(user)">
                        <span nz-icon nzType="delete"></span> Hapus
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center text-gray-500 py-8">
                  Tidak ada user ditemukan
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>
    </div>

    <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'"
               nzPlacement="right" nzWidth="420px" (nzOnClose)="closeDrawer()">
      <ng-container *nzDrawerContent>
        @if (drawerLoading()) {
          <div class="text-center py-12"><nz-spin nzSimple></nz-spin></div>
        } @else {
          <form nz-form [formGroup]="form" nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Nama Lengkap</nz-form-label>
              <nz-form-control nzErrorTip="Nama wajib diisi">
                <input nz-input nzSize="small" formControlName="name" placeholder="Nama lengkap" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Email</nz-form-label>
              <nz-form-control nzErrorTip="Email wajib diisi">
                <input nz-input nzSize="small" formControlName="email" type="email" placeholder="Email" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label [nzRequired]="!isEdit">Password</nz-form-label>
              <nz-form-control [nzErrorTip]="isEdit ? '' : 'Password wajib diisi'">
                <input nz-input nzSize="small" formControlName="password" type="password"
                       [placeholder]="isEdit ? 'Kosongkan jika tidak diubah' : 'Password'" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Telepon</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" formControlName="phone" placeholder="Nomor telepon" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Department</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" formControlName="department_id" nzPlaceHolder="Pilih department" nzAllowClear nzShowSearch>
                  @for (dept of departments(); track dept.id) {
                    <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Section</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" formControlName="section_id" nzPlaceHolder="Pilih section" nzAllowClear nzShowSearch>
                  @for (sec of sections(); track sec.id) {
                    <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Jabatan</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" formControlName="position_id" nzPlaceHolder="Pilih jabatan" nzAllowClear nzShowSearch>
                  @for (pos of positions(); track pos.id) {
                    <nz-option [nzValue]="pos.id" [nzLabel]="pos.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Role</nz-form-label>
              <nz-form-control nzErrorTip="Minimal 1 role harus dipilih">
                <nz-select nzSize="small" formControlName="role_ids" nzMode="multiple" nzPlaceHolder="Pilih role" nzShowSearch>
                  @for (role of roleOptions(); track role.id) {
                    <nz-option [nzValue]="role.id" [nzLabel]="role.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Status</nz-form-label>
              <nz-form-control>
                <nz-switch formControlName="is_active" nzCheckedChildren="Aktif" nzUnCheckedChildren="Nonaktif"></nz-switch>
              </nz-form-control>
            </nz-form-item>
            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">
                Simpan
              </button>
            </div>
          </form>
        }
      </ng-container>
    </nz-drawer>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-tag { font-size: 11px; margin-right: 4px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    ::ng-deep .ant-form-item { margin-bottom: 12px; }
  `]
})
export class UserListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);
  private modal = inject(NzModalService);

  users = signal<User[]>([]);
  loading = signal(false);
  searchText = '';

  // Drawer state
  drawerVisible = false;
  isEdit = false;
  editUserId: number | null = null;
  form!: FormGroup;
  saving = signal(false);
  drawerLoading = signal(false);
  departments = signal<{id: number; name: string}[]>([]);
  sections = signal<{id: number; name: string}[]>([]);
  positions = signal<{id: number; name: string}[]>([]);
  roleOptions = signal<{id: number; name: string}[]>([]);

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      phone: [''],
      department_id: [null],
      section_id: [null],
      position_id: [null],
      role_ids: [[], Validators.required],
      is_active: [true]
    });
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

  loadDropdowns() {
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

  openDrawer(user?: User) {
    this.isEdit = !!user;
    this.editUserId = user?.id || null;
    this.form.reset({ is_active: true });

    if (user) {
      this.drawerLoading.set(true);
      this.http.get<any>(`${environment.apiUrl}/users/${user.id}`).subscribe({
        next: (res) => {
          const u = res.data;
          this.form.patchValue({
            name: u.name,
            email: u.email,
            phone: u.phone,
            department_id: u.department_id,
            section_id: u.section_id,
            position_id: u.position_id,
            role_ids: u.roles?.map((r: any) => r.id) || [],
            is_active: u.is_active
          });
          this.drawerLoading.set(false);
        },
        error: () => {
          this.message.error('Gagal memuat user');
          this.drawerLoading.set(false);
        }
      });
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      this.form.get('password')?.setValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }

    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.form.reset();
    this.editUserId = null;
    this.isEdit = false;
  }

  save() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const data = { ...this.form.value };
    if (this.isEdit && !data.password) {
      delete data.password;
    }

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/users/${this.editUserId}`, data)
      : this.http.post(`${environment.apiUrl}/users`, data);

    req.subscribe({
      next: () => {
        this.message.success(this.isEdit ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
        this.closeDrawer();
        this.loadUsers();
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan user');
        this.saving.set(false);
      }
    });
  }
}
