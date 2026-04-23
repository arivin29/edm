import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { UserDetailService } from '../user-detail.service';

@Component({
  selector: 'app-user-edit-view',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzFormModule, NzInputModule, NzSelectModule, NzButtonModule,
    NzCardModule, NzIconModule, NzSpinModule, NzDividerModule, NzPopconfirmModule
  ],
  template: `
    <nz-spin [nzSpinning]="userService.saving()">
      @if (userService.user(); as user) {
        <nz-card nzTitle="Edit Profil" nzSize="small">
          <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <nz-form-item>
                <nz-form-label nzRequired>Nama Lengkap</nz-form-label>
                <nz-form-control nzErrorTip="Nama wajib diisi">
                  <input nz-input formControlName="name" placeholder="Nama lengkap" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label nzRequired>Email</nz-form-label>
                <nz-form-control nzErrorTip="Email tidak valid">
                  <input nz-input formControlName="email" placeholder="Email" type="email" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Telepon</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="phone" placeholder="Nomor telepon" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>ID Karyawan</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="employee_id" placeholder="ID karyawan" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Departemen</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="department_id" nzPlaceHolder="Pilih departemen" nzAllowClear>
                    @for (dept of userService.departments(); track dept.id) {
                      <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Seksi</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="section_id" nzPlaceHolder="Pilih seksi" nzAllowClear>
                    @for (sec of userService.sections(); track sec.id) {
                      <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Jabatan</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="position_id" nzPlaceHolder="Pilih jabatan" nzAllowClear>
                    @for (pos of userService.positions(); track pos.id) {
                      <nz-option [nzValue]="pos.id" [nzLabel]="pos.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>

            <div class="form-actions">
              <button nz-button nzType="primary" [disabled]="form.invalid">
                <span nz-icon nzType="save"></span> Simpan Perubahan
              </button>
            </div>
          </form>
        </nz-card>

        <nz-divider></nz-divider>

        <!-- Danger Zone -->
        <nz-card nzTitle="Zona Berbahaya" nzSize="small" class="danger-card">
          <div class="danger-item">
            <div class="danger-item__info">
              <span class="danger-item__title">Reset Password</span>
              <span class="danger-item__desc">Kirim link reset password ke email user</span>
            </div>
            <button nz-button nzDanger
                    nz-popconfirm nzPopconfirmTitle="Kirim link reset password?"
                    (nzOnConfirm)="resetPassword()">
              <span nz-icon nzType="key"></span> Reset
            </button>
          </div>
          <div class="danger-item">
            <div class="danger-item__info">
              <span class="danger-item__title">{{ user.is_active ? 'Nonaktifkan' : 'Aktifkan' }} Akun</span>
              <span class="danger-item__desc">{{ user.is_active ? 'User tidak bisa login' : 'User bisa login kembali' }}</span>
            </div>
            <button nz-button [nzDanger]="user.is_active"
                    nz-popconfirm [nzPopconfirmTitle]="user.is_active ? 'Nonaktifkan user ini?' : 'Aktifkan user ini?'"
                    (nzOnConfirm)="toggleStatus()">
              <span nz-icon [nzType]="user.is_active ? 'stop' : 'check-circle'"></span>
              {{ user.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </nz-card>
      }
    </nz-spin>
  `,
  styles: [`
    .form-grid { @apply grid grid-cols-1 md:grid-cols-2 gap-x-4; }
    .form-actions { @apply pt-4 border-t border-gray-100; }
    .danger-card ::ng-deep .ant-card-head { @apply border-red-200; }
    .danger-card ::ng-deep .ant-card-head-title { @apply text-red-600; }
    .danger-item { @apply flex items-center justify-between py-3 border-b border-gray-100 last:border-0; }
    .danger-item__info { @apply flex-1; }
    .danger-item__title { @apply block text-sm font-medium text-gray-800; }
    .danger-item__desc { @apply block text-xs text-gray-500; }
  `]
})
export class UserEditViewComponent implements OnInit {
  userService = inject(UserDetailService);
  private fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit() {
    this.userService.loadDropdowns();
    this.initForm();
  }

  initForm() {
    const user = this.userService.user();
    this.form = this.fb.group({
      name: [user?.name || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.phone || ''],
      employee_id: [user?.employee_id || ''],
      department_id: [user?.department_id || user?.department?.id || null],
      section_id: [user?.section_id || user?.section?.id || null],
      position_id: [user?.position_id || user?.position?.id || null],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.userService.updateUser(this.form.value);
  }

  resetPassword() {
    this.userService.resetPassword();
  }

  toggleStatus() {
    this.userService.toggleStatus();
  }
}
