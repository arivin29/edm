import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../document-detail.service';
import { formatDate, formatFileSize } from '../../document.models';

@Component({
  selector: 'app-doc-versions-view',
  standalone: true,
  imports: [CommonModule, NzTimelineModule, NzTagModule, NzButtonModule, NzIconModule, NzToolTipModule, NzSpinModule, NzEmptyModule],
  template: `
    @if (docService.versionsLoading()) {
      <div class="text-center py-8"><nz-spin nzSimple></nz-spin></div>
    } @else if (docService.versions().length === 0) {
      <nz-empty nzNotFoundContent="Belum ada riwayat versi"></nz-empty>
    } @else {
      <div class="version-list">
        <nz-timeline>
          @for (v of docService.versions(); track v.id; let i = $index) {
            <nz-timeline-item [nzColor]="v.is_current ? 'blue' : 'gray'" [nzDot]="v.is_current ? currentDot : undefined">
              <div class="version-item" [class.version-item--current]="v.is_current">
                <div class="version-item__header">
                  <div class="version-item__title">
                    <nz-tag [nzColor]="v.is_current ? 'blue' : 'default'">v{{ v.major_version }}.{{ v.minor_version }}</nz-tag>
                    @if (v.is_current) {
                      <nz-tag nzColor="green">Saat Ini</nz-tag>
                    }
                    <span class="version-item__size">{{ formatFileSize(v.file_size) }}</span>
                  </div>
                  <div class="version-item__actions">
                    <button nz-button nzSize="small" nzType="text" nz-tooltip nzTooltipTitle="Download" (click)="docService.downloadVersion(v.version_number)">
                      <span nz-icon nzType="download"></span>
                    </button>
                    @if (!v.is_current) {
                      <button nz-button nzSize="small" nzType="text" nzDanger nz-tooltip nzTooltipTitle="Restore" (click)="docService.restoreVersion(v.version_number)">
                        <span nz-icon nzType="rollback"></span>
                      </button>
                    }
                  </div>
                </div>
                <div class="version-item__meta">
                  @if (v.creator) {
                    <span class="version-item__user">
                      <span class="version-item__avatar">{{ v.creator.name.charAt(0).toUpperCase() }}</span>
                      {{ v.creator.name }}
                    </span>
                  }
                  <span class="version-item__date">{{ formatDate(v.created_at) }}</span>
                </div>
                @if (v.change_summary) {
                  <div class="version-item__summary">{{ v.change_summary }}</div>
                }
              </div>
            </nz-timeline-item>
          }
        </nz-timeline>
        <ng-template #currentDot>
          <span nz-icon nzType="check-circle" nzTheme="fill" style="color: #1890ff; font-size: 14px;"></span>
        </ng-template>
      </div>
    }
  `,
  styles: [`
    .version-list { @apply p-2; }
    .version-item { @apply bg-white rounded-lg border border-gray-200 p-3; }
    .version-item--current { @apply border-blue-200 bg-blue-50/30; }
    .version-item__header { @apply flex items-center justify-between mb-2; }
    .version-item__title { @apply flex items-center gap-2; }
    .version-item__size { @apply text-xs text-gray-400; }
    .version-item__meta { @apply flex items-center gap-3 text-xs text-gray-500; }
    .version-item__user { @apply flex items-center gap-1; }
    .version-item__avatar { @apply w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold; }
    .version-item__summary { @apply text-xs text-gray-600 mt-2 italic; }
  `]
})
export class DocVersionsViewComponent {
  docService = inject(DocumentDetailService);
  formatDate = formatDate;
  formatFileSize = formatFileSize;
}
