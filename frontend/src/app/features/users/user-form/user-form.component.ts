import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldComponent, InputComponent } from '../../../shared/components/form-controls/form-field/form-field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form-controls/select/select.component';
import { RolesService } from '../../../api/services/roles.service';
import { DepartmentsService } from '../../../api/services/departments.service';
import { ApiConfiguration } from '../../../api/api-configuration';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent, InputComponent, SelectComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="user-form">
      @if (errorMessage()) {
        <div class="form-error-banner">{{ errorMessage() }}</div>
      }

      <app-form-field label="Nama Lengkap" [error]="getFieldError('name')" [required]="true">
        <app-input formControlName="name" placeholder="Masukkan nama lengkap" />
      </app-form-field>

      <app-form-field label="Email" [error]="getFieldError('email')" [required]="true">
        <app-input formControlName="email" type="email" placeholder="email@example.com" />
      </app-form-field>

      @if (mode === 'create') {
        <app-form-field label="Password" [error]="getFieldError('password')" [required]="true">
          <app-input formControlName="password" type="password" placeholder="Minimal 8 karakter" />
        </app-form-field>
      }

      <app-form-field label="Role" [error]="getFieldError('role_id')" [required]="true">
        <app-select formControlName="role_id" [options]="roles()" placeholder="Pilih role" />
      </app-form-field>

      <app-form-field label="Departemen" [error]="getFieldError('department_id')">
        <app-select formControlName="department_id" [options]="departments()" placeholder="Pilih departemen" />
      </app-form-field>

      <div class="form-actions">
        <button type="button" class="btn btn-outline" (click)="onCancel()">Batal</button>
        <button type="submit" class="btn btn-primary" [disabled]="isSubmitting()">
          {{ mode === 'create' ? 'Tambah' : 'Simpan' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .user-form { display: flex; flex-direction: column; gap: 4px; }
    .form-error-banner { padding: 12px; background: #fee2e2; color: #b91c1c; border-radius: 8px; margin-bottom: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: #3b82f6; color: #fff; border: none; }
    .btn-outline { background: #fff; border: 1px solid #d1d5db; color: #374151; }
  `]
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly rolesApi = inject(RolesService);
  private readonly deptApi = inject(DepartmentsService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() user: any = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');
  roles = signal<SelectOption[]>([]);
  departments = signal<SelectOption[]>([]);

  ngOnInit(): void {
    this.initForm();
    this.loadOptions();
    if (this.user && this.mode === 'edit') {
      this.form.patchValue(this.user);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.mode === 'create' ? [Validators.required, Validators.minLength(8)] : []],
      role_id: ['', Validators.required],
      department_id: ['']
    });
  }

  private loadOptions(): void {
    this.rolesApi.rolesGet().subscribe({
      next: (res: any) => this.roles.set((res?.data || res || []).map((r: any) => ({ value: r.id, label: r.name })))
    });
    this.deptApi.departmentsGet().subscribe({
      next: (res: any) => this.departments.set([{ value: '', label: '-- Tidak ada --' }, ...(res?.data || res || []).map((d: any) => ({ value: d.id, label: d.name }))])
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Wajib diisi';
    if (control.errors['email']) return 'Format email tidak valid';
    if (control.errors['minlength']) return 'Minimal 8 karakter';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const data = this.form.value;

    const baseUrl = this.apiConfig.rootUrl || '';
    const url = this.mode === 'create' 
      ? `${baseUrl}/users`
      : `${baseUrl}/users/${this.user.id}`;
    const method = this.mode === 'create' ? 'POST' : 'PUT';

    this.http.request(method, url, { body: data }).subscribe({
      next: () => { this.isSubmitting.set(false); this.saved.emit(); },
      error: (err: any) => { this.isSubmitting.set(false); this.errorMessage.set(err?.error?.message || 'Gagal menyimpan'); }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
