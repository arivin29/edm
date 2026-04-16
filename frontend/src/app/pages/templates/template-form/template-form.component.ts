import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Template } from '../template.models';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule,
    NzSelectModule, NzButtonModule, NzUploadModule, NzIconModule
  ],
  templateUrl: './template-form.component.html',
  styleUrl: './template-form.component.scss'
})
export class TemplateFormComponent {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() visible = false;
  @Input() editData: Template | null = null;
  @Input() documentTypes: { id: string; name: string }[] = [];
  @Input() categories: { id: string; name: string }[] = [];
  @Input() companies: { id: string; name: string }[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  formData: any = {};
  fileList: any[] = [];

  get editId(): string | null {
    return this.editData?.id || null;
  }

  get drawerTitle(): string {
    return this.editId ? 'Edit Template' : 'Tambah Template';
  }

  ngOnChanges() {
    if (this.visible) {
      this.formData = this.editData
        ? {
            name: this.editData.name,
            description: this.editData.description,
            document_type_id: this.editData.document_type_id,
            category_id: this.editData.category_id,
            company_id: this.editData.company_id
          }
        : { name: '', description: '', document_type_id: null, category_id: null, company_id: null };
      this.fileList = [];
    }
  }

  beforeUpload = (file: any): boolean => {
    this.fileList = [file];
    return false;
  };

  close() {
    this.formData = {};
    this.fileList = [];
    this.closed.emit();
  }

  save() {
    if (!this.formData.name) {
      this.message.warning('Nama template wajib diisi');
      return;
    }
    if (!this.editId && this.fileList.length === 0) {
      this.message.warning('File template wajib diupload');
      return;
    }

    this.saving.set(true);
    const fd = new FormData();
    fd.append('name', this.formData.name);
    if (this.formData.description) fd.append('description', this.formData.description);
    if (this.formData.document_type_id) fd.append('document_type_id', this.formData.document_type_id);
    if (this.formData.category_id) fd.append('category_id', this.formData.category_id);
    if (this.formData.company_id) fd.append('company_id', this.formData.company_id);
    if (this.fileList.length > 0) fd.append('file', this.fileList[0]);

    const req = this.editId
      ? this.http.put(`${environment.apiUrl}/templates/${this.editId}`, fd)
      : this.http.post(`${environment.apiUrl}/templates`, fd);

    req.subscribe({
      next: () => {
        this.message.success('Template berhasil disimpan');
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.message.error('Gagal menyimpan template');
        this.saving.set(false);
      }
    });
  }
}
