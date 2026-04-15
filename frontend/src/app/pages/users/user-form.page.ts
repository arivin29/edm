import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzSelectModule, NzSwitchModule, NzSpinModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/users" class="text-gray-500 hover:text-gray-700">
          <span nz-icon nzType="arrow-left"></span>
        </a>
        <h1 class="text-lg font-semibold m-0">{{ isEdit ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h1>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-2 gap-4">
            <!-- Basic Info -->
            <nz-card nzSize="small" nzTitle="Informasi Dasar">
              <nz-form-item>
                <nz-form-label nzRequired>Nama Lengkap</nz-form-label>
                <nz-form-control nzErrorTip="Nama wajib diisi">
                  <input nz-input formControlName="name" placeholder="Nama lengkap" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label nzRequired>Email</nz-form-label>
                <nz-form-control nzErrorTip="Email wajib diisi">
                  <input nz-input formControlName="email" type="email" placeholder="Email" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label [nzRequired]="!isEdit">Password</nz-form-label>
                <nz-form-control [nzErrorTip]="isEdit ? '' : 'Password wajib diisi'">
                  <input nz-input formControlName="password" type="password" 
                         [placeholder]="isEdit ? 'Kosongkan jika tidak diubah' : 'Password'" />
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Telepon</nz-form-label>
                <nz-form-control>
                  <input nz-input formControlName="phone" placeholder="Nomor telepon" />
                </nz-form-control>
              </nz-form-item>
            </nz-card>

            <!-- Organization & Role -->
            <nz-card nzSize="small" nzTitle="Organisasi & Role">
              <nz-form-item>
                <nz-form-label>Department</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="department_id" nzPlaceHolder="Pilih department" nzAllowClear nzShowSearch>
                    @for (dept of departments(); track dept.id) {
                      <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Section</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="section_id" nzPlaceHolder="Pilih section" nzAllowClear nzShowSearch>
                    @for (sec of sections(); track sec.id) {
                      <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label>Jabatan</nz-form-label>
                <nz-form-control>
                  <nz-select formControlName="position_id" nzPlaceHolder="Pilih jabatan" nzAllowClear nzShowSearch>
                    @for (pos of positions(); track pos.id) {
                      <nz-option [nzValue]="pos.id" [nzLabel]="pos.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item>
                <nz-form-label nzRequired>Role</nz-form-label>
                <nz-form-control nzErrorTip="Minimal 1 role harus dipilih">
                  <nz-select formControlName="role_ids" nzMode="multiple" nzPlaceHolder="Pilih role" nzShowSearch>
                    @for (role of roles(); track role.id) {
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
            </nz-card>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 mt-4">
            <button nz-button type="button" routerLink="/users">Batal</button>
            <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()">
              {{ isEdit ? 'Simpan' : 'Tambah User' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-card-head { padding: 0 12px; min-height: 36px; }
    :host ::ng-deep .ant-card-head-title { padding: 8px 0; font-size: 13px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-form-item-label { padding: 0 0 4px; }
    :host ::ng-deep .ant-form-item-label > label { font-size: 12px; height: auto; }
  `]
})
export class UserFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);

  form!: FormGroup;
  isEdit = false;
  userId: number | null = null;

  loading = signal(false);
  submitting = signal(false);
  departments = signal<{id: number; name: string}[]>([]);
  sections = signal<{id: number; name: string}[]>([]);
  positions = signal<{id: number; name: string}[]>([]);
  roles = signal<{id: number; name: string}[]>([]);

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

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.userId = +id;
      this.loadUser(this.userId);
    } else {
      this.form.get('password')?.setValidators(Validators.required);
    }
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

  loadUser(id: number) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/users/${id}`).subscribe({
      next: (res) => {
        const user = res.data;
        this.form.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone,
          department_id: user.department_id,
          section_id: user.section_id,
          position_id: user.position_id,
          role_ids: user.roles?.map((r: any) => r.id) || [],
          is_active: user.is_active
        });
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat user');
        this.loading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);
    const data = { ...this.form.value };
    if (this.isEdit && !data.password) {
      delete data.password;
    }

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/users/${this.userId}`, data)
      : this.http.post(`${environment.apiUrl}/users`, data);

    req.subscribe({
      next: () => {
        this.message.success(this.isEdit ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
        this.router.navigate(['/users']);
        this.submitting.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan user');
        this.submitting.set(false);
      }
    });
  }
}
