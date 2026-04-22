import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { environment } from '../../../../environments/environment';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  phone?: string;
  avatar?: string;
  signature_image?: string;
  is_active?: boolean;
  roles?: any[];
  permissions?: string[];
  company?: { id: string; name: string };
  office?: { id: string; name: string };
  department?: { id: string; name: string };
  section?: { id: string; name: string };
  position?: { id: string; name: string };
  created_at?: string;
  last_login?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  subject_type: string;
  description: string;
  created_at: string;
  ip_address?: string;
}

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    NzCardModule,
    NzAvatarModule,
    NzTagModule,
    NzDescriptionsModule,
    NzIconModule,
    NzSpinModule,
    NzDividerModule,
    NzEmptyModule,
    NzToolTipModule,
    NzButtonModule,
  ],
  templateUrl: './profile-overview.component.html',
  styleUrls: ['./profile-overview.component.scss'],
})
export class ProfileOverviewComponent implements OnInit {
  private readonly http = inject(HttpClient);

  loading = signal(false);
  activityLoading = signal(false);
  profile = signal<ProfileData | null>(null);
  recentActivity = signal<AuditEntry[]>([]);

  permissionGroups = signal<{ group: string; items: string[] }[]>([]);

  ngOnInit(): void {
    this.loadProfile();
    this.loadActivity();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.http.get<{ data: ProfileData }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.buildPermissionGroups(res.data.permissions || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadActivity(): void {
    this.activityLoading.set(true);
    this.http
      .get<{ data: AuditEntry[] }>(`${environment.apiUrl}/audit-logs?limit=8`)
      .subscribe({
        next: (res) => {
          this.recentActivity.set(res.data || []);
          this.activityLoading.set(false);
        },
        error: () => this.activityLoading.set(false),
      });
  }

  private buildPermissionGroups(permissions: string[]): void {
    const map = new Map<string, string[]>();
    for (const p of permissions) {
      const parts = p.split('.');
      const group = parts[0] || 'other';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(p);
    }
    this.permissionGroups.set(
      Array.from(map.entries()).map(([group, items]) => ({ group, items }))
    );
  }

  getActionIcon(action: string): string {
    if (action.includes('create')) return 'file-add';
    if (action.includes('update') || action.includes('edit')) return 'edit';
    if (action.includes('delete')) return 'delete';
    if (action.includes('login')) return 'login';
    if (action.includes('logout')) return 'logout';
    if (action.includes('approve')) return 'check-circle';
    if (action.includes('reject')) return 'close-circle';
    return 'info-circle';
  }

  getActionColor(action: string): string {
    if (action.includes('create')) return '#52c41a';
    if (action.includes('delete')) return '#ff4d4f';
    if (action.includes('approve')) return '#1677ff';
    if (action.includes('reject')) return '#ff7a00';
    if (action.includes('login')) return '#722ed1';
    return '#8c8c8c';
  }

  groupLabel(key: string): string {
    const map: Record<string, string> = {
      document: 'Dokumen',
      workflow: 'Workflow',
      user: 'Pengguna',
      role: 'Role & Akses',
      template: 'Template',
      organization: 'Organisasi',
      setting: 'Pengaturan',
      distribution: 'Distribusi',
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }
}
