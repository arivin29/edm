import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TemplateTag, TagGroup } from '../../../document.models';
import { DocParamEditComponent } from '../doc-param-edit/doc-param-edit.component';

/** Safely parse source_config */
function parseSourceConfig(cfg: any): any {
  if (!cfg) return {};
  if (typeof cfg === 'string') {
    try { return JSON.parse(cfg); } catch { return {}; }
  }
  return cfg;
}

@Component({
  selector: 'app-doc-parameters',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule, NzEmptyModule, NzTagModule,
    NzToolTipModule, NzIconModule, NzDividerModule, NzCardModule,
    NzBadgeModule, NzProgressModule, NzAlertModule, NzButtonModule,
    DocParamEditComponent
  ],
  templateUrl: './doc-parameters.component.html',
  styleUrls: ['./doc-parameters.component.scss']
})
export class DocParametersComponent implements OnChanges {
  private http = inject(HttpClient);

  @Input() documentId: string = '';
  @Input() templateId: string | null = null;
  @Input() templateName: string = '';
  @Input() metadata: Record<string, any> = {};
  @Input() documentStatus: string = '';

  @Output() metadataUpdated = new EventEmitter<Record<string, any>>();

  loading = signal(false);
  tags = signal<TemplateTag[]>([]);

  /** Track which group is currently being edited (only one at a time) */
  editingGroup = signal<string | null>(null);

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

  filledCount = computed(() => {
    return this.visibleTags().filter(t => {
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
        const rawTags: TemplateTag[] = res.data || [];
        // Normalize source_config from string to object
        for (const tag of rawTags) {
          tag.source_config = parseSourceConfig(tag.source_config);
        }
        this.tags.set(rawTags);
        this.loading.set(false);
      },
      error: () => {
        this.tags.set([]);
        this.loading.set(false);
      }
    });
  }

  // ===== Display helpers =====

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
    if (tag.data_type === 'select') {
      const cfg = tag.source_config;
      if (cfg?.options) {
        const opt = cfg.options.find((o: any) => o.value === val);
        if (opt) return opt.label;
      }
      // For api-sourced selects, show value (label resolved by apiLabelCache)
      return this.getApiLabel(tag, val) || String(val);
    }
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

  // ===== API label resolution for display mode =====

  private apiLabelCache = new Map<string, Map<any, string>>();

  private getApiLabel(tag: TemplateTag, val: any): string {
    const cache = this.apiLabelCache.get(tag.tag_key);
    if (cache?.has(val)) return cache.get(val)!;

    // Lazy-load API options for display if not cached
    if (tag.source_type === 'api' && !this.apiLabelCache.has(tag.tag_key)) {
      this.apiLabelCache.set(tag.tag_key, new Map());
      const cfg = tag.source_config;
      const endpoint = cfg?.endpoint || cfg?.url;
      if (endpoint) {
        const url = endpoint.startsWith('http')
          ? endpoint
          : `${environment.apiUrl}${endpoint}`;
        this.http.get<any>(url).subscribe(res => {
          const items = res.data || res || [];
          const labelField = cfg.label_field || cfg.labelField || 'name';
          const valueField = cfg.value_field || cfg.valueField || 'id';
          const map = new Map<any, string>();
          for (const item of (Array.isArray(items) ? items : [])) {
            map.set(item[valueField], item[labelField]);
          }
          this.apiLabelCache.set(tag.tag_key, map);
        });
      }
    }
    return '';
  }

  // ===== Per-group editing =====

  startEditing(groupName: string) {
    this.editingGroup.set(groupName);
  }

  isEditing(groupName: string): boolean {
    return this.editingGroup() === groupName;
  }

  onGroupSaved(mergedMetadata: Record<string, any>) {
    this.metadata = { ...mergedMetadata };
    this.editingGroup.set(null);
    // Clear api label cache so labels refresh
    this.apiLabelCache.clear();
    this.metadataUpdated.emit(this.metadata);
  }

  onGroupCancelled() {
    this.editingGroup.set(null);
  }

  /** Count filled fields in a group */
  getGroupFilledCount(tags: TemplateTag[]): number {
    return tags.filter(t => {
      const val = this.metadata?.[t.tag_key];
      return val != null && val !== '';
    }).length;
  }
}

