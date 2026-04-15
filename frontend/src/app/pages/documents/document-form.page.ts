import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DropdownItem {
  id: string;
  name: string;
}

interface TemplateItem {
  id: string;
  name: string;
  document_type_id?: string;
}

interface TemplateTag {
  tag_key: string;
  label: string;
  description?: string;
  data_type: string;
  source_type: string;
  source_config?: any;
  default_value?: string;
  placeholder_text?: string;
  is_required: boolean;
  is_readonly: boolean;
  is_hidden: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  validation_regex?: string;
  validation_message?: string;
  group_name?: string;
  group_order: number;
  field_order: number;
  col_span: number;
  format_pattern?: string;
}

interface TagGroup {
  name: string;
  order: number;
  tags: TemplateTag[];
}

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzInputNumberModule, NzSelectModule, NzDatePickerModule,
    NzCheckboxModule, NzRadioModule, NzSpinModule, NzToolTipModule, NzGridModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/documents" class="text-gray-500 hover:text-gray-700">
          <span nz-icon nzType="arrow-left"></span>
        </a>
        <h1 class="text-lg font-semibold m-0">{{ isEdit ? 'Edit Dokumen' : 'Buat Dokumen Baru' }}</h1>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-2 gap-4">
            <!-- Left Column -->
            <div class="col-span-2 lg:col-span-1">
              <nz-card nzSize="small" nzTitle="Informasi Utama">
                <nz-form-item>
                  <nz-form-label nzRequired>Judul Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Judul wajib diisi">
                    <input nz-input nzSize="small" formControlName="title" placeholder="Masukkan judul dokumen" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Deskripsi</nz-form-label>
                  <nz-form-control>
                    <textarea nz-input nzSize="small" formControlName="description" placeholder="Deskripsi dokumen (opsional)"
                              [nzAutosize]="{ minRows: 3, maxRows: 6 }"></textarea>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <!-- Dynamic Metadata Template Card -->
              @if (loadingTags()) {
                <nz-card nzSize="small" nzTitle="Metadata Template" class="mt-3">
                  <div class="text-center py-6">
                    <nz-spin nzSimple nzSize="small"></nz-spin>
                    <p class="text-xs text-gray-400 mt-2">Memuat field template...</p>
                  </div>
                </nz-card>
              } @else if (tagGroups().length > 0) {
                <nz-card nzSize="small" nzTitle="Metadata Template" class="mt-3">
                  @for (group of tagGroups(); track group.name) {
                    @if (tagGroups().length > 1) {
                      <div class="text-xs font-semibold text-gray-500 mb-2 mt-1">{{ group.name }}</div>
                    }
                    <div nz-row [nzGutter]="12">
                      @for (tag of group.tags; track tag.tag_key) {
                        @if (!tag.is_hidden) {
                          <div nz-col [nzSpan]="tag.col_span || 12">
                            <nz-form-item>
                              <nz-form-label [nzRequired]="tag.is_required">
                                {{ tag.label }}
                                @if (tag.description) {
                                  <span nz-icon nzType="info-circle" nz-tooltip [nzTooltipTitle]="tag.description"
                                        class="ml-1 text-gray-400 cursor-help" style="font-size:11px"></span>
                                }
                              </nz-form-label>
                              <nz-form-control [nzErrorTip]="tag.validation_message || (tag.label + ' wajib diisi')">

                                @switch (tag.data_type) {
                                  @case ('text') {
                                    <input nz-input nzSize="small"
                                           [formControl]="getTagControl(tag.tag_key)"
                                           [placeholder]="tag.placeholder_text || ''"
                                           [readOnly]="tag.is_readonly" />
                                  }
                                  @case ('number') {
                                    <nz-input-number nzSize="small" style="width:100%"
                                                     [formControl]="getTagControl(tag.tag_key)"
                                                     [nzPlaceHolder]="tag.placeholder_text || ''"
                                                     [nzMin]="tag.min_value ?? -9999999999"
                                                     [nzMax]="tag.max_value ?? 9999999999"
                                                     [nzDisabled]="tag.is_readonly">
                                    </nz-input-number>
                                  }
                                  @case ('date') {
                                    <nz-date-picker nzSize="small" style="width:100%"
                                                    [formControl]="getTagControl(tag.tag_key)"
                                                    [nzPlaceHolder]="tag.placeholder_text || 'Pilih tanggal'"
                                                    [nzDisabled]="tag.is_readonly"
                                                    [nzFormat]="tag.format_pattern || 'dd/MM/yyyy'">
                                    </nz-date-picker>
                                  }
                                  @case ('select') {
                                    <nz-select nzSize="small" nzShowSearch
                                               [formControl]="getTagControl(tag.tag_key)"
                                               [nzPlaceHolder]="tag.placeholder_text || 'Pilih'"
                                               [nzDisabled]="tag.is_readonly">
                                      @for (opt of getSelectOptions(tag); track opt.value) {
                                        <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                                      }
                                    </nz-select>
                                  }
                                  @case ('textarea') {
                                    <textarea nz-input nzSize="small"
                                              [formControl]="getTagControl(tag.tag_key)"
                                              [placeholder]="tag.placeholder_text || ''"
                                              [readOnly]="tag.is_readonly"
                                              [nzAutosize]="{ minRows: 2, maxRows: 5 }"></textarea>
                                  }
                                  @case ('checkbox') {
                                    <label nz-checkbox nzSize="small"
                                           [formControl]="getTagControl(tag.tag_key)"
                                           [nzDisabled]="tag.is_readonly">
                                      {{ tag.placeholder_text || tag.label }}
                                    </label>
                                  }
                                  @case ('radio') {
                                    <nz-radio-group nzSize="small"
                                                    [formControl]="getTagControl(tag.tag_key)"
                                                    [nzDisabled]="tag.is_readonly">
                                      @for (opt of getSelectOptions(tag); track opt.value) {
                                        <label nz-radio [nzValue]="opt.value">{{ opt.label }}</label>
                                      }
                                    </nz-radio-group>
                                  }
                                  @case ('file') {
                                    <span class="text-xs text-gray-400 italic">(akan diupload setelah dokumen dibuat)</span>
                                  }
                                  @case ('signature') {
                                    <span class="text-xs text-gray-400 italic">(tanda tangan digital)</span>
                                  }
                                  @case ('table') {
                                    <span class="text-xs text-gray-400 italic">(tabel akan diisi di editor)</span>
                                  }
                                  @default {
                                    <input nz-input nzSize="small"
                                           [formControl]="getTagControl(tag.tag_key)"
                                           [placeholder]="tag.placeholder_text || ''" />
                                  }
                                }

                              </nz-form-control>
                            </nz-form-item>
                          </div>
                        }
                      }
                    </div>
                  }
                </nz-card>
              }
            </div>

            <!-- Right Column -->
            <div class="col-span-2 lg:col-span-1">
              <nz-card nzSize="small" nzTitle="Klasifikasi">
                <nz-form-item>
                  <nz-form-label nzRequired>Tipe Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Tipe wajib dipilih">
                    <nz-select nzSize="small" formControlName="document_type_id" nzPlaceHolder="Pilih tipe dokumen" nzShowSearch>
                      @for (type of documentTypes(); track type.id) {
                        <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Template</nz-form-label>
                  <nz-form-control nzErrorTip="Template wajib dipilih">
                    <nz-select nzSize="small" formControlName="template_id" nzPlaceHolder="Pilih template" nzShowSearch>
                      @for (tpl of filteredTemplates(); track tpl.id) {
                        <nz-option [nzValue]="tpl.id" [nzLabel]="tpl.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kategori</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="category_id" nzPlaceHolder="Pilih kategori" nzShowSearch nzAllowClear>
                      @for (cat of categories(); track cat.id) {
                        <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <nz-card nzSize="small" nzTitle="Organisasi" class="mt-3">
                <nz-form-item>
                  <nz-form-label>Perusahaan</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="company_id" nzPlaceHolder="Pilih perusahaan" nzShowSearch nzAllowClear>
                      @for (company of companies(); track company.id) {
                        <nz-option [nzValue]="company.id" [nzLabel]="company.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kantor</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="office_id" nzPlaceHolder="Pilih kantor" nzShowSearch nzAllowClear>
                      @for (office of offices(); track office.id) {
                        <nz-option [nzValue]="office.id" [nzLabel]="office.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Departemen</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="department_id" nzPlaceHolder="Pilih departemen" nzShowSearch nzAllowClear>
                      @for (dept of departments(); track dept.id) {
                        <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Seksi</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="section_id" nzPlaceHolder="Pilih seksi" nzAllowClear nzShowSearch>
                      @for (sec of sections(); track sec.id) {
                        <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <nz-card nzSize="small" nzTitle="Pengaturan" class="mt-3">
                <nz-form-item>
                  <nz-form-label>Prioritas</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="priority" nzPlaceHolder="Pilih prioritas">
                      <nz-option nzValue="normal" nzLabel="Normal"></nz-option>
                      <nz-option nzValue="tinggi" nzLabel="Tinggi"></nz-option>
                      <nz-option nzValue="urgent" nzLabel="Urgent"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kerahasiaan</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="confidentiality" nzPlaceHolder="Pilih kerahasiaan">
                      <nz-option nzValue="internal" nzLabel="Internal"></nz-option>
                      <nz-option nzValue="terbatas" nzLabel="Terbatas"></nz-option>
                      <nz-option nzValue="rahasia" nzLabel="Rahasia"></nz-option>
                      <nz-option nzValue="sangat_rahasia" nzLabel="Sangat Rahasia"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Nama Folder</nz-form-label>
                  <nz-form-control>
                    <input nz-input nzSize="small" formControlName="folder_name" placeholder="Masukkan nama folder" />
                  </nz-form-control>
                </nz-form-item>
              </nz-card>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 mt-4">
            <button nz-button nzSize="small" type="button" routerLink="/documents">Batal</button>
            <button nz-button nzSize="small" nzType="default" type="button" (click)="onSubmit(true)" [nzLoading]="submitting()">
              Simpan Draft
            </button>
            <button nz-button nzSize="small" nzType="primary" type="submit" [nzLoading]="submitting()">
              {{ isEdit ? 'Simpan' : 'Buat Dokumen' }}
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
export class DocumentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);

  form!: FormGroup;
  metadataForm!: FormGroup;
  isEdit = false;
  documentId: string | null = null;
  private existingMetadata: Record<string, any> | null = null;

  loading = signal(false);
  submitting = signal(false);
  loadingTags = signal(false);
  selectedTypeId = signal<string | null>(null);

  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  companies = signal<DropdownItem[]>([]);
  offices = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);
  sections = signal<DropdownItem[]>([]);
  allTemplates = signal<TemplateItem[]>([]);
  templateTags = signal<TemplateTag[]>([]);

  filteredTemplates = computed(() => {
    const typeId = this.selectedTypeId();
    const all = this.allTemplates();
    if (!typeId) return all;
    return all.filter(t => !t.document_type_id || t.document_type_id === typeId);
  });

  tagGroups = computed<TagGroup[]>(() => {
    const tags = this.templateTags();
    if (!tags.length) return [];

    const groupMap = new Map<string, TagGroup>();
    for (const tag of tags) {
      const gName = tag.group_name || 'Umum';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { name: gName, order: tag.group_order, tags: [] });
      }
      groupMap.get(gName)!.tags.push(tag);
    }

    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => a.order - b.order);
    for (const g of groups) {
      g.tags.sort((a, b) => a.field_order - b.field_order);
    }
    return groups;
  });

  ngOnInit() {
    this.metadataForm = this.fb.group({});

    this.form = this.fb.group({
      title: ['', Validators.required],
      document_type_id: [null, Validators.required],
      template_id: [null, Validators.required],
      category_id: [null],
      company_id: [null],
      office_id: [null],
      department_id: [null],
      folder_name: [''],
      description: [''],
      section_id: [null],
      priority: ['normal'],
      confidentiality: ['internal']
    });

    // Filter templates when document type changes
    this.form.get('document_type_id')!.valueChanges.subscribe(typeId => {
      this.selectedTypeId.set(typeId);
      const currentTemplate = this.form.get('template_id')!.value;
      if (currentTemplate) {
        const stillValid = this.filteredTemplates().some(t => t.id === currentTemplate);
        if (!stillValid) {
          this.form.get('template_id')!.setValue(null);
        }
      }
    });

    // Load template tags when template changes
    this.form.get('template_id')!.valueChanges.subscribe(templateId => {
      if (templateId) {
        this.loadTemplateTags(templateId);
      } else {
        this.templateTags.set([]);
        this.metadataForm = this.fb.group({});
      }
    });

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.documentId = id;
      this.loadDocument(id);
    }
  }

  loadDropdowns() {
    forkJoin({
      types: this.http.get<any>(`${environment.apiUrl}/document-types`),
      categories: this.http.get<any>(`${environment.apiUrl}/categories`),
      companies: this.http.get<any>(`${environment.apiUrl}/companies`),
      offices: this.http.get<any>(`${environment.apiUrl}/offices`),
      departments: this.http.get<any>(`${environment.apiUrl}/departments`),
      sections: this.http.get<any>(`${environment.apiUrl}/sections`),
      templates: this.http.get<any>(`${environment.apiUrl}/templates`)
    }).subscribe({
      next: (res) => {
        this.documentTypes.set(res.types.data || []);
        this.categories.set(res.categories.data || []);
        this.companies.set(res.companies.data || []);
        this.offices.set(res.offices.data || []);
        this.departments.set(res.departments.data || []);
        this.sections.set(res.sections.data || []);
        this.allTemplates.set(res.templates.data || []);
      },
      error: () => {
        this.message.error('Gagal memuat data dropdown');
      }
    });
  }

  loadTemplateTags(templateId: string) {
    this.loadingTags.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${templateId}/tags`).subscribe({
      next: (res) => {
        const tags: TemplateTag[] = res.data || [];
        this.templateTags.set(tags);
        this.buildMetadataForm(tags);
        this.loadingTags.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat field template');
        this.templateTags.set([]);
        this.metadataForm = this.fb.group({});
        this.loadingTags.set(false);
      }
    });
  }

  private buildMetadataForm(tags: TemplateTag[]) {
    const group: Record<string, FormControl> = {};
    for (const tag of tags) {
      if (tag.is_hidden) continue;

      // Determine initial value
      let defaultVal: any = tag.default_value ?? '';
      if (tag.data_type === 'checkbox') {
        defaultVal = defaultVal === 'true' || defaultVal === true;
      } else if (tag.data_type === 'number') {
        defaultVal = defaultVal !== '' && defaultVal != null ? Number(defaultVal) : null;
      } else if (tag.data_type === 'date') {
        defaultVal = defaultVal ? new Date(defaultVal) : null;
      }

      // Override with existing metadata if editing
      if (this.existingMetadata && tag.tag_key in this.existingMetadata) {
        let val = this.existingMetadata[tag.tag_key];
        if (tag.data_type === 'checkbox') {
          val = val === 'true' || val === true;
        } else if (tag.data_type === 'number' && val != null) {
          val = Number(val);
        } else if (tag.data_type === 'date' && val) {
          val = new Date(val);
        }
        defaultVal = val;
      }

      // Build validators
      const validators: any[] = [];
      if (tag.is_required) validators.push(Validators.required);
      if (tag.min_length) validators.push(Validators.minLength(tag.min_length));
      if (tag.max_length) validators.push(Validators.maxLength(tag.max_length));
      if (tag.validation_regex) validators.push(Validators.pattern(tag.validation_regex));

      group[tag.tag_key] = new FormControl(defaultVal, validators);
    }
    this.metadataForm = this.fb.group(group);
  }

  getTagControl(tagKey: string): FormControl {
    return (this.metadataForm.get(tagKey) as FormControl) || new FormControl();
  }

  getSelectOptions(tag: TemplateTag): { label: string; value: any }[] {
    if (tag.source_type === 'static' && tag.source_config?.options) {
      return tag.source_config.options;
    }
    return [];
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        this.existingMetadata = doc.metadata || null;
        this.form.patchValue({
          title: doc.title,
          document_type_id: doc.document_type_id,
          category_id: doc.category_id,
          company_id: doc.company_id,
          office_id: doc.office_id,
          department_id: doc.department_id,
          folder_name: doc.folder_name,
          description: doc.description,
          section_id: doc.section_id,
          template_id: doc.template_id,
          priority: doc.priority || 'normal',
          confidentiality: doc.confidentiality || 'internal'
        });
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat dokumen');
        this.loading.set(false);
      }
    });
  }

  onSubmit(asDraft = false) {
    // Validate main form
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    // Validate metadata form
    if (this.metadataForm && Object.keys(this.metadataForm.controls).length > 0) {
      if (this.metadataForm.invalid) {
        Object.values(this.metadataForm.controls).forEach(c => {
          c.markAsDirty();
          c.updateValueAndValidity();
        });
        this.message.warning('Mohon lengkapi field metadata template');
        return;
      }
    }

    this.submitting.set(true);

    // Build metadata from tag values
    const metadata: Record<string, any> = {};
    const tags = this.templateTags();
    for (const tag of tags) {
      if (tag.is_hidden) continue;
      // Skip non-input types
      if (['file', 'signature', 'table'].includes(tag.data_type)) continue;
      const ctrl = this.metadataForm.get(tag.tag_key);
      if (ctrl) {
        let val = ctrl.value;
        if (tag.data_type === 'date' && val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }
        metadata[tag.tag_key] = val;
      }
    }

    const data: any = {
      ...this.form.value,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      status: asDraft ? 'draft' : undefined
    };

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, data)
      : this.http.post(`${environment.apiUrl}/documents`, data);

    req.subscribe({
      next: (res: any) => {
        this.message.success(this.isEdit ? 'Dokumen berhasil diperbarui' : 'Dokumen berhasil dibuat');
        this.router.navigate(['/documents', res.data?.id || this.documentId]);
        this.submitting.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan dokumen');
        this.submitting.set(false);
      }
    });
  }
}
