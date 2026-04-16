import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { debounceTime, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  DropdownItem, TemplateItem, TemplateTag, TagGroup, DraftData, DRAFT_KEY
} from '../document.models';

function parseSourceConfig(cfg: any): any {
  if (!cfg) return {};
  if (typeof cfg === 'string') {
    try { return JSON.parse(cfg); } catch { return {}; }
  }
  return cfg;
}

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzInputNumberModule, NzSelectModule, NzDatePickerModule,
    NzCheckboxModule, NzRadioModule, NzSpinModule, NzToolTipModule, NzGridModule,
    NzStepsModule, NzDescriptionsModule, NzDividerModule, NzAlertModule, NzModalModule
  ],
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss']
})
export class DocumentFormPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  form!: FormGroup;
  metadataForm!: FormGroup;
  isEdit = false;
  documentId: string | null = null;
  private existingMetadata: Record<string, any> | null = null;

  private autoSave$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  currentStep = signal(0);
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
  apiOptions = new Map<string, { label: string; value: any }[]>();
  apiLoading = new Map<string, boolean>();

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

    this.subscriptions.push(
      this.form.get('document_type_id')!.valueChanges.subscribe(typeId => {
        this.selectedTypeId.set(typeId);
        const currentTemplate = this.form.get('template_id')!.value;
        if (currentTemplate) {
          const stillValid = this.filteredTemplates().some(t => t.id === currentTemplate);
          if (!stillValid) {
            this.form.get('template_id')!.setValue(null);
          }
        }
        this.triggerAutoSave();
      })
    );

    this.subscriptions.push(
      this.form.get('template_id')!.valueChanges.subscribe(templateId => {
        if (templateId) {
          this.loadTemplateTags(templateId);
        } else {
          this.templateTags.set([]);
          this.metadataForm = this.fb.group({});
        }
        this.triggerAutoSave();
      })
    );

    this.subscriptions.push(
      this.form.valueChanges.subscribe(() => this.triggerAutoSave())
    );

    this.subscriptions.push(
      this.autoSave$.pipe(debounceTime(1000)).subscribe(() => this.saveDraft())
    );

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.documentId = id;
      this.loadDocument(id);
    } else {
      this.checkForDraft();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private triggerAutoSave() {
    if (!this.isEdit) {
      this.autoSave$.next();
    }
  }

  private saveDraft() {
    const metaValues: Record<string, any> = {};
    if (this.metadataForm) {
      const controls = this.metadataForm.controls;
      for (const key of Object.keys(controls)) {
        let val = controls[key].value;
        if (val instanceof Date) {
          val = val.toISOString();
        }
        metaValues[key] = val;
      }
    }
    const draft: DraftData = {
      step: this.currentStep(),
      formData: this.form.getRawValue(),
      metadata: metaValues,
      selectedTemplateId: this.form.get('template_id')!.value,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore quota errors */ }
  }

  private checkForDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftData = JSON.parse(raw);
      if (!draft.formData) return;

      this.modal.confirm({
        nzTitle: 'Draft Ditemukan',
        nzContent: 'Ditemukan draft dokumen yang belum selesai. Muat kembali?',
        nzOkText: 'Muat Draft',
        nzCancelText: 'Abaikan',
        nzOnOk: () => this.restoreDraft(draft),
        nzOnCancel: () => this.clearDraftSilent()
      });
    } catch { /* ignore parse errors */ }
  }

  private restoreDraft(draft: DraftData) {
    this.form.patchValue(draft.formData);
    if (draft.formData.document_type_id) {
      this.selectedTypeId.set(draft.formData.document_type_id);
    }
    this.currentStep.set(draft.step || 0);
    this.existingMetadata = draft.metadata || null;
  }

  clearDraft() {
    this.modal.confirm({
      nzTitle: 'Hapus Draft',
      nzContent: 'Yakin ingin menghapus draft yang tersimpan?',
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.clearDraftSilent()
    });
  }

  private clearDraftSilent() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  nextStep() {
    if (!this.validateCurrentStep()) return;
    this.currentStep.update(s => Math.min(s + 1, 4));
    this.triggerAutoSave();
  }

  prevStep() {
    this.currentStep.update(s => Math.max(s - 1, 0));
    this.triggerAutoSave();
  }

  goToStep(n: number) {
    this.currentStep.set(n);
    this.triggerAutoSave();
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();
    if (step === 0) {
      const typeCtrl = this.form.get('document_type_id')!;
      const tplCtrl = this.form.get('template_id')!;
      typeCtrl.markAsDirty(); typeCtrl.updateValueAndValidity();
      tplCtrl.markAsDirty(); tplCtrl.updateValueAndValidity();
      if (!typeCtrl.value || !tplCtrl.value) {
        this.message.warning('Tipe Dokumen dan Template wajib dipilih');
        return false;
      }
    } else if (step === 2) {
      const titleCtrl = this.form.get('title')!;
      titleCtrl.markAsDirty(); titleCtrl.updateValueAndValidity();
      if (!titleCtrl.value) {
        this.message.warning('Judul dokumen wajib diisi');
        return false;
      }
    } else if (step === 3) {
      if (this.metadataForm && Object.keys(this.metadataForm.controls).length > 0) {
        if (this.metadataForm.invalid) {
          Object.values(this.metadataForm.controls).forEach(c => {
            c.markAsDirty(); c.updateValueAndValidity();
          });
          this.message.warning('Mohon lengkapi field metadata yang wajib diisi');
          return false;
        }
      }
    }
    return true;
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
        const tags: TemplateTag[] = (res.data || []).map((t: any) => ({
          ...t,
          source_config: parseSourceConfig(t.source_config)
        }));
        this.templateTags.set(tags);
        this.buildMetadataForm(tags);
        this.loadApiOptions(tags);
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

      let defaultVal: any = tag.default_value ?? '';
      if (tag.data_type === 'checkbox') {
        defaultVal = defaultVal === 'true' || defaultVal === true;
      } else if (tag.data_type === 'number') {
        defaultVal = defaultVal !== '' && defaultVal != null ? Number(defaultVal) : null;
      } else if (tag.data_type === 'date') {
        defaultVal = defaultVal ? new Date(defaultVal) : null;
      }

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

      const validators: any[] = [];
      if (tag.is_required) validators.push(Validators.required);
      if (tag.min_length) validators.push(Validators.minLength(tag.min_length));
      if (tag.max_length) validators.push(Validators.maxLength(tag.max_length));
      if (tag.validation_regex) validators.push(Validators.pattern(tag.validation_regex));

      group[tag.tag_key] = new FormControl(defaultVal, validators);
    }
    this.metadataForm = this.fb.group(group);

    this.subscriptions.push(
      this.metadataForm.valueChanges.subscribe(() => this.triggerAutoSave())
    );
  }

  getTagControl(tagKey: string): FormControl {
    return (this.metadataForm.get(tagKey) as FormControl) || new FormControl();
  }

  private loadApiOptions(tags: TemplateTag[]) {
    const apiTags = tags.filter(t => t.source_type === 'api');
    if (!apiTags.length) return;

    const requests: Record<string, any> = {};
    for (const tag of apiTags) {
      this.apiLoading.set(tag.tag_key, true);
      const cfg = parseSourceConfig(tag.source_config);
      const endpoint = cfg.endpoint || cfg.url;
      if (!endpoint) continue;

      const url = endpoint.startsWith('http')
        ? endpoint
        : `${environment.apiUrl}${endpoint}`;

      requests[tag.tag_key] = this.http.get<any>(url).pipe(
        map(res => {
          const items = res.data || res || [];
          const labelField = cfg.label_field || cfg.labelField || 'name';
          const valueField = cfg.value_field || cfg.valueField || 'id';
          return (Array.isArray(items) ? items : []).map((item: any) => ({
            label: item[labelField] || String(item),
            value: item[valueField] || item
          }));
        }),
        catchError(() => of([]))
      );
    }

    if (Object.keys(requests).length === 0) return;

    forkJoin(requests).subscribe({
      next: (results: Record<string, any>) => {
        for (const [key, options] of Object.entries(results)) {
          this.apiOptions.set(key, options as any[]);
          this.apiLoading.set(key, false);
        }
      },
      error: () => {
        for (const tag of apiTags) {
          this.apiLoading.set(tag.tag_key, false);
        }
      }
    });
  }

  getSelectOptions(tag: TemplateTag): { label: string; value: any }[] {
    if (tag.source_type === 'api') {
      return this.apiOptions.get(tag.tag_key) || [];
    }
    const cfg = parseSourceConfig(tag.source_config);
    return cfg?.options || [];
  }

  isApiLoading(tag: TemplateTag): boolean {
    return this.apiLoading.get(tag.tag_key) || false;
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        let meta = doc.metadata || null;
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch { meta = null; }
        }
        this.existingMetadata = meta;
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

  lookupName(list: { id: string; name: string }[], id: string | null): string {
    if (!id) return '';
    return list.find(item => item.id === id)?.name || id;
  }

  isSkippedDataType(dataType: string): boolean {
    return ['file', 'signature', 'table'].includes(dataType);
  }

  getMetadataDisplayValue(tag: TemplateTag): string {
    const ctrl = this.metadataForm.get(tag.tag_key);
    if (!ctrl) return '-';
    const val = ctrl.value;
    if (val == null || val === '') return '-';
    if (tag.data_type === 'checkbox') return val ? 'Ya' : 'Tidak';
    if (tag.data_type === 'date' && val instanceof Date) return val.toLocaleDateString('id-ID');
    if (tag.data_type === 'select') {
      const options = this.getSelectOptions(tag);
      const match = options.find(o => o.value === val);
      if (match) return match.label;
    }
    return String(val);
  }

  onSubmit(asDraft = false) {
    if (!asDraft) {
      for (let s = 0; s <= 3; s++) {
        this.currentStep.set(s);
        if (!this.validateCurrentStep()) return;
      }
      this.currentStep.set(4);
    }

    this.submitting.set(true);

    const metadata: Record<string, any> = {};
    const tags = this.templateTags();
    for (const tag of tags) {
      if (tag.is_hidden) continue;
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
      metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined,
      status: asDraft ? 'draft' : undefined
    };

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, data)
      : this.http.post(`${environment.apiUrl}/documents`, data);

    req.subscribe({
      next: (res: any) => {
        this.clearDraftSilent();
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
