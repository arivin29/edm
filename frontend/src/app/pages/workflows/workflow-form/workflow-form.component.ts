import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Workflow, DropdownItem } from '../workflow.models';

@Component({
  selector: 'app-workflow-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzSelectModule,
    NzButtonModule, NzSwitchModule, NzSpinModule
  ],
  templateUrl: './workflow-form.component.html',
  styleUrl: './workflow-form.component.scss'
})
export class WorkflowFormComponent {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() visible = false;
  @Input() editData: Workflow | null = null;
  @Input() companies: DropdownItem[] = [];
  @Input() documentTypes: DropdownItem[] = [];
  @Input() categories: DropdownItem[] = [];
  @Input() departments: DropdownItem[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<string | undefined>();

  saving = signal(false);
  formData: any = {};

  get drawerTitle(): string {
    return this.editData ? 'Edit Workflow' : 'Tambah Workflow';
  }

  ngOnChanges() {
    if (this.visible) {
      if (this.editData) {
        this.formData = {
          name: this.editData.name,
          company_id: this.editData.company_id,
          document_type_id: this.editData.document_type_id,
          category_id: this.editData.category_id || null,
          department_id: this.editData.department_id || null,
          description: this.editData.description || '',
          is_active: this.editData.is_active
        };
      } else {
        this.formData = {
          name: '', company_id: null, document_type_id: null,
          category_id: null, department_id: null, description: '', is_active: true
        };
      }
    }
  }

  close() {
    this.formData = {};
    this.closed.emit();
  }

  save() {
    if (!this.formData.name?.trim()) {
      this.message.warning('Nama workflow wajib diisi');
      return;
    }
    if (!this.formData.company_id) {
      this.message.warning('Perusahaan wajib dipilih');
      return;
    }
    if (!this.formData.document_type_id) {
      this.message.warning('Tipe dokumen wajib dipilih');
      return;
    }

    this.saving.set(true);
    const editId = this.editData?.id;
    const req$ = editId
      ? this.http.put<any>(`${environment.apiUrl}/workflows/${editId}`, this.formData)
      : this.http.post<any>(`${environment.apiUrl}/workflows`, this.formData);

    req$.subscribe({
      next: (res) => {
        this.message.success(editId ? 'Workflow berhasil diperbarui' : 'Workflow berhasil ditambahkan');
        this.saving.set(false);
        this.close();
        const newId = !editId ? res.data?.id : undefined;
        this.saved.emit(newId);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan workflow');
        this.saving.set(false);
      }
    });
  }
}
