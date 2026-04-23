import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../../../environments/environment';
import { TemplateTag } from '../../../document.models';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/** Safely parse source_config which may be string or object */
function parseSourceConfig(cfg: any): any {
  if (!cfg) return {};
  if (typeof cfg === 'string') {
    try { return JSON.parse(cfg); } catch { return {}; }
  }
  return cfg;
}

@Component({
  selector: 'app-doc-param-edit',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzFormModule, NzInputModule, NzInputNumberModule,
    NzSelectModule, NzDatePickerModule, NzCheckboxModule,
    NzButtonModule, NzIconModule, NzToolTipModule, NzSpinModule
  ],
  templateUrl: './doc-param-edit.component.html',
  styleUrls: ['./doc-param-edit.component.scss']
})
export class DocParamEditComponent implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() tags: TemplateTag[] = [];
  @Input() metadata: Record<string, any> = {};
  @Input() documentId: string = '';
  @Input() groupName: string = '';
  /** Full metadata from parent (all groups) so we can merge on save */
  @Input() fullMetadata: Record<string, any> = {};

  @Output() saved = new EventEmitter<Record<string, any>>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  saving = signal(false);
  loadingOptions = signal(false);

  /** Cached API options per tag_key */
  apiOptions = signal<Record<string, { label: string; value: any }[]>>({});
  apiLoadingKeys = signal<Record<string, boolean>>({});

  ngOnInit() {
    this.buildForm();
    this.loadApiOptions();
  }

  private buildForm() {
    const controls: Record<string, FormControl> = {};

    for (const tag of this.tags) {
      if (tag.is_readonly) continue;

      let val: any = this.metadata?.[tag.tag_key] ?? tag.default_value ?? '';

      if (tag.data_type === 'checkbox') {
        val = val === true || val === 'true';
      } else if (tag.data_type === 'number') {
        val = val !== '' && val != null ? Number(val) : null;
      } else if (tag.data_type === 'date') {
        val = val ? new Date(val) : null;
      }

      const validators: any[] = [];
      if (tag.is_required) validators.push(Validators.required);
      if (tag.min_length) validators.push(Validators.minLength(tag.min_length));
      if (tag.max_length) validators.push(Validators.maxLength(tag.max_length));
      if (tag.validation_regex) validators.push(Validators.pattern(tag.validation_regex));

      controls[tag.tag_key] = new FormControl(val, validators);
    }

    this.form = new FormGroup(controls);
  }

  private loadApiOptions() {
    const apiTags = this.tags.filter(t => t.source_type === 'api');
    if (!apiTags.length) return;

    this.loadingOptions.set(true);

    const requests: Record<string, any> = {};
    const initialLoading: Record<string, boolean> = {};
    for (const tag of apiTags) {
      initialLoading[tag.tag_key] = true;
    }
    this.apiLoadingKeys.set(initialLoading);

    for (const tag of apiTags) {
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

    if (Object.keys(requests).length === 0) {
      this.loadingOptions.set(false);
      return;
    }

    forkJoin(requests).subscribe({
      next: (results: Record<string, any>) => {
        setTimeout(() => {
          this.apiOptions.set({ ...this.apiOptions(), ...results as any });
          const loading: Record<string, boolean> = { ...this.apiLoadingKeys() };
          for (const key of Object.keys(results)) {
            loading[key] = false;
          }
          this.apiLoadingKeys.set(loading);
          this.loadingOptions.set(false);
        });
      },
      error: () => {
        setTimeout(() => {
          const loading: Record<string, boolean> = { ...this.apiLoadingKeys() };
          for (const tag of apiTags) {
            loading[tag.tag_key] = false;
          }
          this.apiLoadingKeys.set(loading);
          this.loadingOptions.set(false);
        });
      }
    });
  }

  getControl(key: string): FormControl {
    return (this.form?.get(key) as FormControl) || new FormControl();
  }

  getSelectOptions(tag: TemplateTag): { label: string; value: any }[] {
    if (tag.source_type === 'api') {
      return this.apiOptions()[tag.tag_key] || [];
    }
    const cfg = parseSourceConfig(tag.source_config);
    return cfg?.options || [];
  }

  isApiLoading(tag: TemplateTag): boolean {
    return this.apiLoadingKeys()[tag.tag_key] || false;
  }

  onSave() {
    if (!this.form) return;

    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Mohon lengkapi field yang wajib diisi');
      return;
    }

    this.saving.set(true);

    // Build group metadata
    const groupMeta: Record<string, any> = {};
    for (const tag of this.tags) {
      if (tag.is_readonly) {
        groupMeta[tag.tag_key] = this.metadata?.[tag.tag_key] ?? '';
        continue;
      }
      const ctrl = this.form.get(tag.tag_key);
      if (!ctrl) continue;
      let val = ctrl.value;
      if (tag.data_type === 'date' && val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      groupMeta[tag.tag_key] = val;
    }

    // Merge with full metadata from all groups
    const merged = { ...this.fullMetadata, ...groupMeta };

    // Backend expects metadata as JSON string
    this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, {
      metadata: JSON.stringify(merged)
    }).subscribe({
      next: () => {
        this.message.success(`Grup "${this.groupName}" berhasil disimpan`);
        this.saved.emit(merged);
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan parameter');
        this.saving.set(false);
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
  }

  /** Get col-span CSS class for grid layout (24-column grid) */
  getColSpan(tag: TemplateTag): Record<string, boolean> {
    const span = tag.col_span || (tag.data_type === 'textarea' ? 24 : 12);
    return {
      [`col-span-${span}`]: true
    };
  }

  /** Get grid-column style for tag */
  getGridStyle(tag: TemplateTag): Record<string, string> {
    const span = tag.col_span || (tag.data_type === 'textarea' ? 24 : 12);
    return { 'grid-column': `span ${span}` };
  }
}
