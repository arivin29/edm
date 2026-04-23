import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment';
import { User, UserActivity, DropdownItem } from '../user.models';

@Injectable()
export class UserDetailService {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  userId = signal<string>('');
  user = signal<User | null>(null);
  activities = signal<UserActivity[]>([]);
  
  loading = signal(true);
  activitiesLoading = signal(false);
  saving = signal(false);

  // Dropdown options
  departments = signal<DropdownItem[]>([]);
  sections = signal<DropdownItem[]>([]);
  positions = signal<DropdownItem[]>([]);
  roles = signal<DropdownItem[]>([]);

  loadUser(id: string) {
    this.userId.set(id);
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/users/${id}`).subscribe({
      next: (res) => {
        this.user.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.user.set(null);
        this.loading.set(false);
      }
    });
  }

  reloadUser() {
    const id = this.userId();
    if (id) this.loadUser(id);
  }

  loadActivities() {
    const id = this.userId();
    if (!id) return;
    this.activitiesLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/users/${id}/activities`).subscribe({
      next: (res) => {
        this.activities.set(res.data || []);
        this.activitiesLoading.set(false);
      },
      error: () => {
        this.activities.set([]);
        this.activitiesLoading.set(false);
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
      next: (res) => this.roles.set(res.data || [])
    });
  }

  updateUser(data: Partial<User>): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.userId();
      if (!id) { reject(); return; }
      
      this.saving.set(true);
      this.http.put(`${environment.apiUrl}/users/${id}`, data).subscribe({
        next: () => {
          this.message.success('User berhasil diupdate');
          this.reloadUser();
          this.saving.set(false);
          resolve();
        },
        error: () => {
          this.message.error('Gagal mengupdate user');
          this.saving.set(false);
          reject();
        }
      });
    });
  }

  updateRoles(roleIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.userId();
      if (!id) { reject(); return; }
      
      this.saving.set(true);
      this.http.patch(`${environment.apiUrl}/users/${id}/roles`, { role_ids: roleIds }).subscribe({
        next: () => {
          this.message.success('Role berhasil diupdate');
          this.reloadUser();
          this.saving.set(false);
          resolve();
        },
        error: () => {
          this.message.error('Gagal mengupdate role');
          this.saving.set(false);
          reject();
        }
      });
    });
  }

  toggleStatus(): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.user();
      const id = this.userId();
      if (!user || !id) { reject(); return; }
      
      this.http.patch(`${environment.apiUrl}/users/${id}/status`, {
        is_active: !user.is_active
      }).subscribe({
        next: () => {
          this.message.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
          this.reloadUser();
          resolve();
        },
        error: () => {
          this.message.error('Gagal mengubah status');
          reject();
        }
      });
    });
  }

  resetPassword(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.userId();
      if (!id) { reject(); return; }
      
      this.http.post(`${environment.apiUrl}/users/${id}/reset-password`, {}).subscribe({
        next: () => {
          this.message.success('Link reset password telah dikirim ke email user');
          resolve();
        },
        error: () => {
          this.message.error('Gagal mengirim reset password');
          reject();
        }
      });
    });
  }
}
