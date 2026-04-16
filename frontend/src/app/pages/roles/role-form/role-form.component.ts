import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Role, Permission } from '../role.models';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzCheckboxModule,
    NzButtonModule, NzIconModule, NzTagModule, NzCollapseModule, NzBadgeModule
  ],
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})
export class RoleFormComponent implements OnChanges {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() visible = false;
  @Input() editRole: Role | null = null;
  @Input() permissions: Permission[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData: { name: string; description: string } = { name: '', description: '' };
  selectedPermissions: Record<number, boolean> = {};
  saving = signal(false);
  searchPerm = '';

  get isEdit(): boolean {
    return !!this.editRole;
  }

  get drawerTitle(): string {
    return this.isEdit ? 'Edit Role' : 'Tambah Role';
  }

  get selectedCount(): number {
    return Object.values(this.selectedPermissions).filter(v => v).length;
  }

  get totalCount(): number {
    return this.permissions.length;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.initForm();
    }
  }

  permissionModules(): string[] {
    const modules = new Set<string>();
    this.filteredPermissions().forEach(p => modules.add(p.module || 'general'));
    return Array.from(modules).sort();
  }

  filteredPermissions(): Permission[] {
    if (!this.searchPerm) return this.permissions;
    const q = this.searchPerm.toLowerCase();
    return this.permissions.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.module?.toLowerCase().includes(q)
    );
  }

  getPermissionsByModule(module: string): Permission[] {
    return this.filteredPermissions().filter(p => (p.module || 'general') === module);
  }

  getModuleSelectedCount(module: string): number {
    return this.getPermissionsByModule(module).filter(p => this.selectedPermissions[p.id]).length;
  }

  isModuleAllSelected(module: string): boolean {
    const perms = this.getPermissionsByModule(module);
    return perms.length > 0 && perms.every(p => this.selectedPermissions[p.id]);
  }

  isModuleIndeterminate(module: string): boolean {
    const perms = this.getPermissionsByModule(module);
    const selected = perms.filter(p => this.selectedPermissions[p.id]).length;
    return selected > 0 && selected < perms.length;
  }

  toggleModuleAll(module: string) {
    const allSelected = this.isModuleAllSelected(module);
    this.getPermissionsByModule(module).forEach(p => {
      this.selectedPermissions[p.id] = !allSelected;
    });
  }

  selectAll() {
    this.permissions.forEach(p => this.selectedPermissions[p.id] = true);
  }

  deselectAll() {
    this.selectedPermissions = {};
  }

  close() {
    this.closed.emit();
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

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/roles/${this.editRole!.id}`, data)
      : this.http.post(`${environment.apiUrl}/roles`, data);

    req.subscribe({
      next: () => {
        this.message.success('Role berhasil disimpan');
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.message.error('Gagal menyimpan role');
        this.saving.set(false);
      }
    });
  }

  private initForm() {
    this.searchPerm = '';
    this.formData = this.editRole
      ? { name: this.editRole.name, description: this.editRole.description }
      : { name: '', description: '' };

    this.selectedPermissions = {};
    if (this.editRole?.permissions) {
      this.editRole.permissions.forEach(p => this.selectedPermissions[p.id] = true);
    }
  }
}
