import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Template, TemplateTag } from '../template.models';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzTableModule, NzButtonModule, NzIconModule,
    NzTagModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzSelectModule, NzCheckboxModule, NzSliderModule, NzDividerModule,
    NzToolTipModule, NzModalModule
  ],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.scss'
})
export class TemplateDetailComponent {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  @Input() visible = false;
  @Input() template: Template | null = null;
  @Output() closed = new EventEmitter<void>();

  tags = signal<TemplateTag[]>([]);
  tagsLoading = signal(false);

  // Tag form
  tagFormVisible = false;
  tagFormData: any = {};
  editTagId: string | null = null;
  tagSaving = signal(false);
  sourceConfigStr = '';

  dataTypeOptions = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio', 'file', 'signature', 'table'];
  sourceTypeOptions = ['static', 'api', 'computed'];

  ngOnChanges() {
    if (this.visible && this.template) {
      this.loadTags();
    }
  }

  close() {
    this.tags.set([]);
    this.closed.emit();
  }

  // ── Tag List ──

  loadTags() {
    if (!this.template) return;
    this.tagsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${this.template.id}/tags`).subscribe({
      next: (res) => {
        this.tags.set(res.data || []);
        this.tagsLoading.set(false);
      },
      error: () => {
        this.tags.set([]);
        this.tagsLoading.set(false);
      }
    });
  }

  deleteTag(tag: TemplateTag) {
    if (!this.template) return;
    this.modal.confirm({
      nzTitle: 'Hapus Parameter?',
      nzContent: `Yakin ingin menghapus parameter "${tag.label}" (${tag.tag_key})?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/templates/${this.template!.id}/tags/${tag.id}`).subscribe({
          next: () => {
            this.message.success('Parameter berhasil dihapus');
            this.loadTags();
          },
          error: () => this.message.error('Gagal menghapus parameter')
        });
      }
    });
  }

  // ── Tag Form ──

  openTagForm(tag?: TemplateTag) {
    this.editTagId = tag?.id || null;
    if (tag) {
      this.tagFormData = { ...tag };
      this.sourceConfigStr = tag.source_config ? JSON.stringify(tag.source_config, null, 2) : '';
    } else {
      this.tagFormData = {
        tag_key: '', tag_placeholder: '', label: '', description: '',
        data_type: 'text', source_type: 'static', source_config: null,
        format_pattern: '', default_value: '', placeholder_text: '',
        is_required: false, is_readonly: false, is_hidden: false,
        min_length: null, max_length: null, min_value: null, max_value: null,
        validation_regex: '', validation_message: '',
        group_name: '', group_order: 0, field_order: 0, col_span: 12,
        table_config: null, signature_config: null
      };
      this.sourceConfigStr = '';
    }
    this.tagFormVisible = true;
  }

  closeTagForm() {
    this.tagFormVisible = false;
    this.editTagId = null;
    this.tagFormData = {};
    this.sourceConfigStr = '';
  }

  onTagKeyChange() {
    if (this.tagFormData.tag_key) {
      this.tagFormData.tag_placeholder = `{{${this.tagFormData.tag_key}}}`;
    } else {
      this.tagFormData.tag_placeholder = '';
    }
  }

  saveTag() {
    if (!this.tagFormData.tag_key) {
      this.message.warning('Tag key wajib diisi');
      return;
    }
    if (!this.tagFormData.label) {
      this.message.warning('Label wajib diisi');
      return;
    }
    if (!this.template) return;

    if (this.sourceConfigStr) {
      try {
        this.tagFormData.source_config = JSON.parse(this.sourceConfigStr);
      } catch {
        this.message.warning('Format JSON konfigurasi sumber tidak valid');
        return;
      }
    } else {
      this.tagFormData.source_config = null;
    }

    this.tagSaving.set(true);
    const payload = { ...this.tagFormData };
    delete payload.id;
    delete payload.template_id;
    delete payload.created_at;
    delete payload.updated_at;

    const req = this.editTagId
      ? this.http.put(`${environment.apiUrl}/templates/${this.template.id}/tags/${this.editTagId}`, payload)
      : this.http.post(`${environment.apiUrl}/templates/${this.template.id}/tags`, payload);

    req.subscribe({
      next: () => {
        this.message.success('Parameter berhasil disimpan');
        this.closeTagForm();
        this.loadTags();
        this.tagSaving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan parameter');
        this.tagSaving.set(false);
      }
    });
  }
}
