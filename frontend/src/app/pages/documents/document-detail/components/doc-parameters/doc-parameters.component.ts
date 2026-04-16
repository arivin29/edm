import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { TemplateTag, TagGroup } from '../../../document.models';

@Component({
  selector: 'app-doc-parameters',
  standalone: true,
  imports: [
    CommonModule, NzSpinModule, NzEmptyModule, NzTagModule,
    NzToolTipModule, NzIconModule, NzDividerModule
  ],
  templateUrl: './doc-parameters.component.html',
  styleUrls: ['./doc-parameters.component.scss']
})
export class DocParametersComponent implements OnChanges {
  private http = inject(HttpClient);

  @Input() templateId: string | null = null;
  @Input() metadata: Record<string, any> = {};

  loading = signal(false);
  tags = signal<TemplateTag[]>([]);

  tagGroups = computed<TagGroup[]>(() => {
    const allTags = this.tags();
    if (!allTags.length) return [];

    const groupMap = new Map<string, TagGroup>();
    for (const tag of allTags) {
      if (tag.is_hidden) continue;
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

  isSkippedType(dataType: string): boolean {
    return ['file', 'signature', 'table'].includes(dataType);
  }
}
