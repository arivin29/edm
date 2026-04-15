import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
  user_count: number;
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzDrawerModule, NzModalModule, NzFormModule, NzCheckboxModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Role & Permission</h1>
          <p class="text-gray-500 text-xs m-0">Kelola role dan hak akses</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span>
          Tambah Role
        </button>
      </div>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #roleTable [nzData]="roles()" [nzLoading]="loading()" 
                  nzSize="small" [nzPageSize]="15">
          <thead>
            <tr>
              <th>Role</th>
              <th nzWidth="250px">Deskripsi</th>
              <th nzWidth="100px">Permission</th>
              <th nzWidth="80px">User</th>
              <th nzWidth="70px">Tipe</th>
              <th nzWidth="80px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (role of roleTable.data; track role.id) {
              <tr>
                <td class="font-medium">{{ role.name }}</td>
                <td class="text-gray-500">{{ role.description || '-' }}</td>
                <td>
                  <nz-tag>{{ role.permissions?.length || 0 }} permissions</nz-tag>
                </td>
                <td>{{ role.user_count || 0 }}</td>
                <td>
                  <nz-tag [nzColor]="role.is_system ? 'blue' : 'default'">
                    {{ role.is_system ? 'System' : 'Custom' }}
                  </nz-tag>
                </td>
                <td>
                  <button nz-button nzType="link" nzSize="small" (click)="openDrawer(role)" [disabled]="role.is_system">
                    <span nz-icon nzType="edit"></span>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nzDanger 
                          (click)="deleteRole(role)" [disabled]="role.is_system">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center text-gray-500 py-8">
                  Tidak ada role ditemukan
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>

      <!-- Drawer Form -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="editId ? 'Edit Role' : 'Tambah Role'"
                 nzPlacement="right" nzWidth="500px" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <div class="grid grid-cols-2 gap-4">
              <nz-form-item>
                <nz-form-label nzRequired>Nama Role</nz-form-label>
                <nz-form-control>
                  <input nz-input [(ngModel)]="formData.name" name="name" placeholder="Nama role" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item>
                <nz-form-label>Deskripsi</nz-form-label>
                <nz-form-control>
                  <input nz-input [(ngModel)]="formData.description" name="description" placeholder="Deskripsi" />
                </nz-form-control>
              </nz-form-item>
            </div>

            <div class="border-t pt-3 mt-3">
              <div class="font-medium mb-2">Permissions</div>
              <div class="max-h-64 overflow-y-auto">
                @for (module of permissionModules(); track module) {
                  <div class="mb-3">
                    <div class="text-xs font-medium text-gray-500 mb-1 uppercase">{{ module }}</div>
                    <div class="grid grid-cols-2 gap-1">
                      @for (perm of getPermissionsByModule(module); track perm.id) {
                        <label nz-checkbox [(ngModel)]="selectedPermissions[perm.id]" [ngModelOptions]="{standalone: true}">
                          <span class="text-xs">{{ perm.name }}</span>
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">Simpan</button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-tag { font-size: 11px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-checkbox-wrapper { font-size: 12px; }
  `]
})
export class RoleListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(false);
  saving = signal(false);

  drawerVisible = false;
  formData: any = {};
  editId: number | null = null;
  selectedPermissions: Record<number, boolean> = {};

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/roles`).subscribe({
      next: (res) => {
        this.roles.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.roles.set([]);
        this.loading.set(false);
      }
    });
  }

  loadPermissions() {
    this.http.get<any>(`${environment.apiUrl}/permissions`).subscribe({
      next: (res) => this.permissions.set(res.data || [])
    });
  }

  permissionModules() {
    const modules = new Set<string>();
    this.permissions().forEach(p => modules.add(p.module || 'general'));
    return Array.from(modules).sort();
  }

  getPermissionsByModule(module: string) {
    return this.permissions().filter(p => (p.module || 'general') === module);
  }

  openDrawer(role?: Role) {
    this.editId = role?.id || null;
    this.formData = role ? { name: role.name, description: role.description } : { name: '', description: '' };
    
    this.selectedPermissions = {};
    if (role?.permissions) {
      role.permissions.forEach(p => this.selectedPermissions[p.id] = true);
    }
    
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
  }

  save() {
    if (!this.formData.name) {
      this.message.warning('Nama role wajib diisi');
      return;
    }

    this.saving.set(true);
    const permissionIds = Object.entries(this.selectedPermissions)
      .filter(([_, v]) => v)
      .map(([k, _]) => +k);

    const data = {
      ...this.formData,
      permission_ids: permissionIds
    };

    const req = this.editId
      ? this.http.put(`${environment.apiUrl}/roles/${this.editId}`, data)
      : this.http.post(`${environment.apiUrl}/roles`, data);

    req.subscribe({
      next: () => {
        this.message.success('Role berhasil disimpan');
        this.drawerVisible = false;
        this.loadRoles();
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan role');
        this.saving.set(false);
      }
    });
  }

  deleteRole(role: Role) {
    if (role.is_system) {
      this.message.warning('Role sistem tidak bisa dihapus');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Hapus Role?',
      nzContent: `Yakin ingin menghapus role "${role.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/roles/${role.id}`).subscribe({
          next: () => {
            this.message.success('Role berhasil dihapus');
            this.loadRoles();
          },
          error: () => this.message.error('Gagal menghapus role')
        });
      }
    });
  }
}
