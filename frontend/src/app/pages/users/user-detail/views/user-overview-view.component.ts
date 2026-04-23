import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { UserDetailService } from '../user-detail.service';

@Component({
  selector: 'app-user-overview-view',
  standalone: true,
  imports: [CommonModule, RouterLink, NzCardModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule, NzToolTipModule],
  template: `
    @if (userService.user(); as user) {
      <div class="overview-grid">
        <!-- Left Column -->
        <div class="overview-col overview-col--main">
          <!-- Personal Info -->
          <nz-card nzSize="small" class="ov-card">
            <div class="ov-card__header">
              <span nz-icon nzType="idcard" nzTheme="outline" class="ov-card__icon ov-card__icon--blue"></span>
              <span class="ov-card__title">Informasi Pribadi</span>
              <a [routerLink]="['../', 'edit']" class="ov-card__action">
                <span nz-icon nzType="edit"></span> Edit
              </a>
            </div>
            <div class="ov-info-grid">
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="user"></span> Nama Lengkap</span>
                <span class="ov-info-item__value">{{ user.name }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="mail"></span> Email</span>
                <span class="ov-info-item__value">{{ user.email }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="phone"></span> Telepon</span>
                <span class="ov-info-item__value">{{ user.phone || '-' }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="contacts"></span> ID Karyawan</span>
                <span class="ov-info-item__value">{{ user.employee_id || '-' }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="clock-circle"></span> Bergabung</span>
                <span class="ov-info-item__value">{{ user.created_at | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="login"></span> Login Terakhir</span>
                <span class="ov-info-item__value">{{ user.last_login_at ? (user.last_login_at | date:'dd MMM yyyy, HH:mm') : 'Belum pernah' }}</span>
              </div>
              <div class="ov-info-item">
                <span class="ov-info-item__label"><span nz-icon nzType="check-circle"></span> Status</span>
                <span class="ov-info-item__value">
                  <nz-tag [nzColor]="user.is_active ? 'success' : 'error'">{{ user.is_active ? 'Aktif' : 'Nonaktif' }}</nz-tag>
                </span>
              </div>
            </div>
          </nz-card>

          <!-- Organization -->
          <nz-card nzSize="small" class="ov-card">
            <div class="ov-card__header">
              <span nz-icon nzType="apartment" nzTheme="outline" class="ov-card__icon ov-card__icon--orange"></span>
              <span class="ov-card__title">Struktur Organisasi</span>
            </div>
            <div class="ov-org-tree">
              <div class="ov-org-node">
                <span nz-icon nzType="bank" class="ov-org-node__icon"></span>
                <div class="ov-org-node__body">
                  <span class="ov-org-node__level">Perusahaan</span>
                  <span class="ov-org-node__name">{{ user.company?.name || '-' }}</span>
                </div>
              </div>
              <div class="ov-org-connector"></div>
              <div class="ov-org-node">
                <span nz-icon nzType="laptop" class="ov-org-node__icon"></span>
                <div class="ov-org-node__body">
                  <span class="ov-org-node__level">Kantor</span>
                  <span class="ov-org-node__name">{{ user.office?.name || '-' }}</span>
                </div>
              </div>
              <div class="ov-org-connector"></div>
              <div class="ov-org-node">
                <span nz-icon nzType="team" class="ov-org-node__icon"></span>
                <div class="ov-org-node__body">
                  <span class="ov-org-node__level">Departemen</span>
                  <span class="ov-org-node__name">{{ user.department?.name || user.department_name || '-' }}</span>
                </div>
              </div>
              @if (user.section?.name) {
                <div class="ov-org-connector"></div>
                <div class="ov-org-node">
                  <span nz-icon nzType="sisternode" class="ov-org-node__icon"></span>
                  <div class="ov-org-node__body">
                    <span class="ov-org-node__level">Seksi</span>
                    <span class="ov-org-node__name">{{ user.section?.name }}</span>
                  </div>
                </div>
              }
              <div class="ov-org-connector"></div>
              <div class="ov-org-node ov-org-node--highlight">
                <span nz-icon nzType="crown" class="ov-org-node__icon"></span>
                <div class="ov-org-node__body">
                  <span class="ov-org-node__level">Jabatan</span>
                  <span class="ov-org-node__name">{{ user.position?.name || user.position_name || '-' }}</span>
                </div>
              </div>
            </div>
          </nz-card>
        </div>

        <!-- Right Column -->
        <div class="overview-col overview-col--side">
          <!-- Roles -->
          <nz-card nzSize="small" class="ov-card">
            <div class="ov-card__header">
              <span nz-icon nzType="safety-certificate" nzTheme="outline" class="ov-card__icon ov-card__icon--purple"></span>
              <span class="ov-card__title">Role</span>
              <a [routerLink]="['../', 'roles']" class="ov-card__action">Kelola</a>
            </div>
            <div class="ov-roles">
              @for (role of user.roles || []; track role.id) {
                <div class="ov-role-badge">
                  <span nz-icon nzType="key" class="ov-role-badge__icon"></span>
                  <span>{{ role.name }}</span>
                </div>
              }
              @if (!user.roles.length) {
                <span class="ov-empty-text">Tidak ada role</span>
              }
            </div>
          </nz-card>

          <!-- Permissions -->
          @if (permissionGroups().length > 0) {
            <nz-card nzSize="small" class="ov-card">
              <div class="ov-card__header">
                <span nz-icon nzType="audit" nzTheme="outline" class="ov-card__icon ov-card__icon--green"></span>
                <span class="ov-card__title">Hak Akses</span>
                <span class="ov-card__badge">{{ (user.permissions || []).length }} izin</span>
              </div>
              <div class="ov-perms">
                @for (group of permissionGroups(); track group.group) {
                  <div class="ov-perm-group">
                    <div class="ov-perm-group__label">{{ groupLabel(group.group) }}</div>
                    <div class="ov-perm-group__tags">
                      @for (perm of group.items; track perm) {
                        <span class="ov-perm-tag" [nz-tooltip]="perm">{{ perm.split('.').slice(1).join('.') || perm }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </nz-card>
          }

          <!-- Signature -->
          @if (user.signature_image) {
            <nz-card nzSize="small" class="ov-card">
              <div class="ov-card__header">
                <span nz-icon nzType="form" nzTheme="outline" class="ov-card__icon ov-card__icon--teal"></span>
                <span class="ov-card__title">Tanda Tangan</span>
              </div>
              <div class="ov-signature-preview">
                <img [src]="user.signature_image" alt="Tanda Tangan" />
              </div>
            </nz-card>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './user-overview-view.component.scss'
})
export class UserOverviewViewComponent implements OnInit {
  userService = inject(UserDetailService);

  permissionGroups = computed(() => {
    const permissions = this.userService.user()?.permissions || [];
    const groups: Map<string, string[]> = new Map();
    
    for (const perm of permissions) {
      const group = perm.split('.')[0] || 'other';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(perm);
    }
    
    return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
  });

  ngOnInit() {
    // Data loaded by parent layout
  }

  groupLabel(group: string): string {
    const labels: Record<string, string> = {
      'document': 'Dokumen',
      'user': 'Pengguna',
      'role': 'Role',
      'workflow': 'Workflow',
      'template': 'Template',
      'setting': 'Pengaturan',
      'audit': 'Audit',
      'company': 'Perusahaan',
      'other': 'Lainnya'
    };
    return labels[group] || group;
  }
}
