import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Template, TemplateTag } from '../template.models';
import { TemplateFormComponent } from '../template-form/template-form.component';

interface TagGroup {
  name: string;
  tags: TemplateTag[];
}

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    NzButtonModule, NzIconModule, NzTagModule, NzSpinModule,
    NzToolTipModule, NzDrawerModule, NzTabsModule, NzFormModule, NzInputModule,
    NzInputNumberModule, NzSelectModule, NzCheckboxModule,
    NzSliderModule, NzDividerModule, NzModalModule, NzEmptyModule,
    TemplateFormComponent
  ],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.scss'
})
export class TemplateDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  template = signal<Template | null>(null);
  loading = signal(false);
  tags = signal<TemplateTag[]>([]);
  tagsLoading = signal(false);

  // Dropdown data for form
  documentTypes = signal<{ id: string; name: string }[]>([]);
  categories = signal<{ id: string; name: string }[]>([]);
  companies = signal<{ id: string; name: string }[]>([]);

  // Tags grouped by group_name
  tagGroups = computed<TagGroup[]>(() => {
    const allTags = this.tags();
    const groups = new Map<string, TemplateTag[]>();
    for (const tag of allTags) {
      const key = tag.group_name || '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tag);
    }
    // Sort groups by min group_order, then sort tags within each group by field_order
    return Array.from(groups.entries())
      .sort(([, a], [, b]) => (a[0]?.group_order ?? 0) - (b[0]?.group_order ?? 0))
      .map(([name, tags]) => ({
        name: name || 'Tanpa Grup',
        tags: tags.sort((a, b) => a.field_order - b.field_order)
      }));
  });

  // Edit form drawer
  formVisible = false;

  // Tag form drawer
  tagFormVisible = false;
  tagFormData: any = {};
  editTagId: string | null = null;
  tagSaving = signal(false);
  sourceConfigStr = '';

  dataTypeOptions = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio', 'file', 'signature', 'table'];
  sourceTypeOptions = ['static', 'api', 'computed'];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTemplate(id);
      this.loadTags(id);
      this.loadDropdowns();
    }
  }

  // ── Data Loading ──

  loadTemplate(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${id}`).subscribe({
      next: (res) => {
        this.template.set(res.data || null);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Template tidak ditemukan');
        this.loading.set(false);
        this.router.navigate(['/master/templates']);
      }
    });
  }

  loadTags(id?: string) {
    const templateId = id || this.template()?.id;
    if (!templateId) return;
    this.tagsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${templateId}/tags`).subscribe({
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

  loadDropdowns() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => this.documentTypes.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/companies`).subscribe({
      next: (res) => this.companies.set(res.data || [])
    });
  }

  // ── Actions ──

  download() {
    const tpl = this.template();
    if (tpl) window.open(`${environment.apiUrl}/templates/${tpl.id}/download`, '_blank');
  }

  openEditForm() {
    this.formVisible = true;
  }

  onFormClosed() {
    this.formVisible = false;
  }

  onFormSaved() {
    this.formVisible = false;
    const id = this.template()?.id;
    if (id) this.loadTemplate(id);
  }

  // ── Tag CRUD ──

  deleteTag(tag: TemplateTag) {
    const tpl = this.template();
    if (!tpl) return;
    this.modal.confirm({
      nzTitle: 'Hapus Parameter?',
      nzContent: `Yakin ingin menghapus parameter "${tag.label}" (${tag.tag_key})?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/templates/${tpl.id}/tags/${tag.id}`).subscribe({
          next: () => {
            this.message.success('Parameter berhasil dihapus');
            this.loadTags();
          },
          error: () => this.message.error('Gagal menghapus parameter')
        });
      }
    });
  }

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
      this.tagFormData.tag_placeholder = `\${${this.tagFormData.tag_key}}`;
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
    const tpl = this.template();
    if (!tpl) return;

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
      ? this.http.put(`${environment.apiUrl}/templates/${tpl.id}/tags/${this.editTagId}`, payload)
      : this.http.post(`${environment.apiUrl}/templates/${tpl.id}/tags`, payload);

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

  // ── Helpers ──

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'default';
      default: return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Aktif';
      case 'draft': return 'Draft';
      case 'archived': return 'Arsip';
      default: return status || '-';
    }
  }
}
