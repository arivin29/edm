import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Role, Permission } from '../role.models';
import { RoleFormComponent } from '../role-form/role-form.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzCardModule, NzModalModule, NzToolTipModule,
    RoleFormComponent
  ],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(false);

  drawerVisible = false;
  editRole: Role | null = null;
  expandSet = new Set<number>();

  get systemCount(): number {
    return this.roles().filter(r => r.is_system).length;
  }

  get customCount(): number {
    return this.roles().filter(r => !r.is_system).length;
  }

  onExpandChange(id: number, expanded: boolean) {
    if (expanded) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  getPermModules(role: Role): string[] {
    const modules = new Set<string>();
    (role.permissions || []).forEach(p => modules.add(p.module || 'general'));
    return Array.from(modules).sort();
  }

  getPermsByModule(role: Role, module: string): Permission[] {
    return (role.permissions || []).filter(p => (p.module || 'general') === module);
  }

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

  openDrawer(role?: Role) {
    this.editRole = role || null;
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editRole = null;
  }

  onFormSaved() {
    this.closeDrawer();
    this.loadRoles();
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

  private loadPermissions() {
    this.http.get<any>(`${environment.apiUrl}/permissions`).subscribe({
      next: (res) => this.permissions.set(res.data || [])
    });
  }
}
