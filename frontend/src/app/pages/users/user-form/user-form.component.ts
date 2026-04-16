import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User, DropdownItem } from '../user.models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzSelectModule,
    NzSwitchModule, NzButtonModule, NzSpinModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnChanges {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() editUser: User | null = null;
  @Input() departments: DropdownItem[] = [];
  @Input() sections: DropdownItem[] = [];
  @Input() positions: DropdownItem[] = [];
  @Input() roleOptions: DropdownItem[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form!: FormGroup;
  saving = signal(false);
  drawerLoading = signal(false);

  get isEdit(): boolean {
    return !!this.editUser;
  }

  get drawerTitle(): string {
    return this.isEdit ? 'Edit Pengguna' : 'Tambah Pengguna';
  }

  constructor() {
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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.initForm();
    }
  }

  private initForm() {
    this.form.reset({ is_active: true });

    if (this.editUser) {
      this.drawerLoading.set(true);
      this.http.get<any>(`${environment.apiUrl}/users/${this.editUser.id}`).subscribe({
        next: (res) => {
          const u = res.data;
          this.form.patchValue({
            name: u.name,
            email: u.email,
            phone: u.phone,
            department_id: u.department_id,
            section_id: u.section_id,
            position_id: u.position_id,
            role_ids: u.roles?.map((r: any) => r.id) || [],
            is_active: u.is_active
          });
          this.drawerLoading.set(false);
        },
        error: () => {
          this.message.error('Gagal memuat user');
          this.drawerLoading.set(false);
        }
      });
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
    } else {
      this.form.get('password')?.setValidators(Validators.required);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  close() {
    this.closed.emit();
  }

  save() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.saving.set(true);
    const data = { ...this.form.value };
    if (this.isEdit && !data.password) {
      delete data.password;
    }

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/users/${this.editUser!.id}`, data)
      : this.http.post(`${environment.apiUrl}/users`, data);

    req.subscribe({
      next: () => {
        this.message.success(this.isEdit ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.message.error('Gagal menyimpan user');
        this.saving.set(false);
      }
    });
  }
}
