import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { UserDetailService } from '../user-detail.service';

@Component({
  selector: 'app-user-roles-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NzCardModule, NzCheckboxModule, NzButtonModule, NzIconModule, NzSpinModule, NzTagModule, NzEmptyModule],
  template: `
    <nz-spin [nzSpinning]="userService.saving()">
      <nz-card nzTitle="Role & Hak Akses" nzSize="small">
        <div class="roles-section">
          <h4 class="section-title">
            <span nz-icon nzType="team"></span> Pilih Role
          </h4>
          <p class="section-desc">Pilih role yang akan diberikan kepada user ini</p>
          
          <div class="role-list">
            @for (role of userService.roles(); track role.id) {
              <label nz-checkbox [(ngModel)]="selectedRoles[role.id]" class="role-item">
                <div class="role-item__body">
                  <span class="role-item__name">{{ role.name }}</span>
                </div>
              </label>
            }
            @if (userService.roles().length === 0) {
              <nz-empty nzNotFoundContent="Tidak ada role tersedia"></nz-empty>
            }
          </div>

          <div class="form-actions">
            <button nz-button nzType="primary" (click)="saveRoles()">
              <span nz-icon nzType="save"></span> Simpan Role
            </button>
          </div>
        </div>

        <nz-card nzTitle="Hak Akses Saat Ini" nzSize="small" class="mt-4" [nzBordered]="false">
          @if (userService.user()?.permissions?.length) {
            <div class="perm-list">
              @for (perm of userService.user()!.permissions!; track perm) {
                <nz-tag nzColor="green" class="perm-tag">{{ perm }}</nz-tag>
              }
            </div>
          } @else {
            <nz-empty nzNotFoundContent="Tidak ada permission"></nz-empty>
          }
        </nz-card>
      </nz-card>
    </nz-spin>
  `,
  styles: [`
    .section-title { @apply flex items-center gap-2 text-sm font-medium text-gray-800 m-0; }
    .section-desc { @apply text-xs text-gray-500 mt-1 mb-4; }
    .role-list { @apply space-y-2; }
    .role-item { @apply flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer; }
    .role-item__body { @apply flex-1; }
    .role-item__name { @apply text-sm font-medium; }
    .form-actions { @apply pt-4 mt-4 border-t border-gray-100; }
    .perm-list { @apply flex flex-wrap gap-1; }
    .perm-tag { @apply text-[11px]; }
  `]
})
export class UserRolesViewComponent implements OnInit {
  userService = inject(UserDetailService);
  selectedRoles: Record<string, boolean> = {};

  ngOnInit() {
    this.userService.loadDropdowns();
    this.initSelectedRoles();
  }

  initSelectedRoles() {
    const user = this.userService.user();
    if (user?.roles) {
      for (const role of user.roles) {
        this.selectedRoles[role.id] = true;
      }
    }
  }

  saveRoles() {
    const roleIds = Object.entries(this.selectedRoles)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
    this.userService.updateRoles(roleIds);
  }
}
