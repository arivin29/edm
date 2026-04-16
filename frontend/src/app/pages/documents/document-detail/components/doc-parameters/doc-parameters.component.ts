import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TemplateTag, TagGroup } from '../../../document.models';

@Component({
  selector: 'app-doc-parameters',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzSpinModule, NzEmptyModule, NzTagModule,
    NzToolTipModule, NzIconModule, NzDividerModule, NzCardModule,
    NzBadgeModule, NzProgressModule, NzAlertModule, NzButtonModule,
    NzFormModule, NzInputModule, NzInputNumberModule, NzSelectModule,
    NzDatePickerModule, NzCheckboxModule, NzDrawerModule
  ],
  templateUrl: './doc-parameters.component.html',
  styleUrls: ['./doc-parameters.component.scss']
})
export class DocParametersComponent implements OnChanges {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  @Input() documentId: string = '';
  @Input() templateId: string | null = null;
  @Input() templateName: string = '';
  @Input() metadata: Record<string, any> = {};
  @Input() documentStatus: string = '';

  @Output() metadataUpdated = new EventEmitter<Record<string, any>>();

  loading = signal(false);
  tags = signal<TemplateTag[]>([]);

  /** Visible (non-hidden, non-skipped) tags */
  visibleTags = computed(() =>
    this.tags().filter(t => !t.is_hidden && !this.isSkippedType(t.data_type))
  );

  tagGroups = computed<TagGroup[]>(() => {
    const allTags = this.visibleTags();
    if (!allTags.length) return [];

    const groupMap = new Map<string, TagGroup>();
    for (const tag of allTags) {
      const gName = tag.group_name || 'Umum';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { name: gName, order: tag.group_order, tags: [] });
      }
      groupMap.get(gName)!.tags.push(tag);
    }

    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => a.order - b.order);
    for (const g of groups) {
      g.tags.sort((a: TemplateTag, b: TemplateTag) => a.field_order - b.field_order);
    }
    return groups;
  });

  /** Stats: filled vs total */
  filledCount = computed(() => {
    const visible = this.visibleTags();
    return visible.filter(t => {
      const val = this.metadata?.[t.tag_key];
      return val != null && val !== '';
    }).length;
  });

  totalCount = computed(() => this.visibleTags().length);

  requiredCount = computed(() => this.visibleTags().filter(t => t.is_required).length);

  requiredFilledCount = computed(() => {
    return this.visibleTags().filter(t => {
      if (!t.is_required) return false;
      const val = this.metadata?.[t.tag_key];
      return val != null && val !== '';
    }).length;
  });

  fillPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 100;
    return Math.round((this.filledCount() / total) * 100);
  });

  allRequiredFilled = computed(() => this.requiredFilledCount() === this.requiredCount());

  ngOnChanges(changes: SimpleChanges) {
    if (changes['templateId'] && this.templateId) {
      this.loadTags(this.templateId);
    }
  }

  private loadTags(templateId: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${templateId}/tags`).subscribe({
      next: (res) => {
        this.tags.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.tags.set([]);
        this.loading.set(false);
      }
    });
  }

  getDisplayValue(tag: TemplateTag): string {
    const val = this.metadata?.[tag.tag_key];
    if (val == null || val === '') return '-';
    if (tag.data_type === 'checkbox') return val === true || val === 'true' ? 'Ya' : 'Tidak';
    if (tag.data_type === 'date') {
      try {
        const d = new Date(val);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch { return String(val); }
    }
    if (tag.data_type === 'select' && tag.source_config?.options) {
      const opt = tag.source_config.options.find((o: any) => o.value === val);
      return opt?.label || String(val);
    }
    if (tag.data_type === 'number') return String(val);
    return String(val);
  }

  isFilled(tag: TemplateTag): boolean {
    const val = this.metadata?.[tag.tag_key];
    return val != null && val !== '';
  }

  isSkippedType(dataType: string): boolean {
    return ['file', 'signature', 'table'].includes(dataType);
  }

  getDataTypeIcon(dataType: string): string {
    const icons: Record<string, string> = {
      text: 'font-size', textarea: 'align-left', number: 'number',
      date: 'calendar', checkbox: 'check-square', select: 'unordered-list',
      email: 'mail', url: 'link', phone: 'phone'
    };
    return icons[dataType] || 'form';
  }

  // ===== Edit Mode =====
  editDrawerVisible = signal(false);
  editForm!: FormGroup;
  saving = signal(false);

  openEditDrawer() {
    this.buildEditForm();
    this.editDrawerVisible.set(true);
  }

  closeEditDrawer() {
    this.editDrawerVisible.set(false);
  }

  private buildEditForm() {
    const group: Record<string, FormControl> = {};
    for (const tag of this.visibleTags()) {
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

      group[tag.tag_key] = new FormControl(val, validators);
    }
    this.editForm = this.fb.group(group);
  }

  getFormControl(key: string): FormControl {
    return (this.editForm?.get(key) as FormControl) || new FormControl();
  }

  getSelectOptions(tag: TemplateTag): { label: string; value: any }[] {
    if (tag.source_type === 'static' && tag.source_config?.options) {
      return tag.source_config.options;
    }
    return [];
  }

  saveMetadata() {
    if (!this.editForm) return;

    // Validate
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      this.message.warning('Mohon lengkapi field yang wajib diisi');
      return;
    }

    this.saving.set(true);

    const metadata: Record<string, any> = {};
    for (const tag of this.visibleTags()) {
      const ctrl = this.editForm.get(tag.tag_key);
      if (!ctrl) continue;
      let val = ctrl.value;
      if (tag.data_type === 'date' && val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      metadata[tag.tag_key] = val;
    }

    this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, { metadata }).subscribe({
      next: () => {
        this.message.success('Parameter berhasil diperbarui');
        this.metadata = { ...this.metadata, ...metadata };
        this.metadataUpdated.emit(this.metadata);
        this.editDrawerVisible.set(false);
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan parameter');
        this.saving.set(false);
      }
    });
  }
}

