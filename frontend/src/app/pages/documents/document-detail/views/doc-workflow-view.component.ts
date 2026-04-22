import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { DocumentDetailService } from '../document-detail.service';

@Component({
  selector: 'app-doc-workflow-view',
  standalone: true,
  imports: [CommonModule, NzTimelineModule, NzTagModule, NzIconModule, NzSpinModule, NzEmptyModule, NzAlertModule],
  template: `
    @if (docService.workflowLoading()) {
      <div class="text-center py-8"><nz-spin nzSimple></nz-spin></div>
    } @else if (docService.workflow()?.is_preview && docService.workflow()?.preview_steps?.length) {
      <!-- Preview mode -->
      <nz-alert nzType="info" nzShowIcon nzBanner
        nzMessage="Rencana Alur Persetujuan"
        [nzDescription]="'Workflow akan dijalankan saat dokumen disubmit.'"
        class="mb-4 rounded-lg">
      </nz-alert>
      <nz-timeline>
        @for (step of docService.workflow()!.preview_steps!; track step.id; let i = $index) {
          <nz-timeline-item nzColor="gray" [nzDot]="previewDot">
            <ng-template #previewDot>
              <div class="wf-dot wf-dot--preview">{{ i + 1 }}</div>
            </ng-template>
            <div class="wf-item">
              <div class="wf-item__row">
                <span class="wf-item__name">{{ step.name }}</span>
                <nz-tag [nzColor]="getStepTypeColor(step.step_type)">{{ getStepTypeLabel(step.step_type) }}</nz-tag>
              </div>
              <div class="wf-item__sub">
                <span nz-icon nzType="team"></span>
                {{ getAssigneeTypeLabel(step.assignee_type) }}
              </div>
              @if (step.instructions) {
                <div class="wf-item__note">{{ step.instructions }}</div>
              }
            </div>
          </nz-timeline-item>
        }
      </nz-timeline>
    } @else if (docService.workflow()?.steps?.length) {
      <!-- Active workflow -->
      @if (docService.workflow()!.workflow_name) {
        <div class="wf-header">
          <span nz-icon nzType="apartment"></span>
          <span class="wf-header__name">{{ docService.workflow()!.workflow_name }}</span>
          <nz-tag class="ml-auto"
            [nzColor]="docService.workflow()!.instance?.status === 'approved' ? 'success' : docService.workflow()!.instance?.status === 'rejected' ? 'error' : 'processing'">
            {{ getInstanceStatusLabel(docService.workflow()!.instance?.status) }}
          </nz-tag>
        </div>
      }
      <nz-timeline>
        @for (step of docService.workflow()!.steps; track step.id; let i = $index) {
          <nz-timeline-item
            [nzColor]="step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : step.status === 'active' ? 'blue' : 'gray'"
            [nzDot]="stepDot">
            <ng-template #stepDot>
              <div class="wf-dot" [attr.data-status]="step.status">
                @if (step.status === 'approved') {
                  <span nz-icon nzType="check"></span>
                } @else if (step.status === 'rejected') {
                  <span nz-icon nzType="close"></span>
                } @else if (step.status === 'active') {
                  <span nz-icon nzType="sync" class="animate-spin"></span>
                } @else {
                  {{ i + 1 }}
                }
              </div>
            </ng-template>
            <div class="wf-item" [attr.data-status]="step.status">
              <div class="wf-item__row">
                <span class="wf-item__name">{{ step.name }}</span>
                <nz-tag [nzColor]="getStatusTagColor(step.status)">{{ getStatusLabel(step.status) }}</nz-tag>
              </div>
              <div class="wf-item__sub">
                @if (step.actor) {
                  <span nz-icon nzType="user"></span> {{ step.actor.name }}
                } @else if (step.status === 'active') {
                  <span nz-icon nzType="hourglass" class="text-blue-400"></span>
                  <span class="text-blue-500">Menunggu persetujuan</span>
                }
                @if (step.completed_at) {
                  · <span class="wf-item__time">{{ step.completed_at | date:'dd MMM yyyy, HH:mm' }}</span>
                }
              </div>
              @if (step.comment) {
                <div class="wf-item__comment">"{{ step.comment }}"</div>
              }
            </div>
          </nz-timeline-item>
        }
      </nz-timeline>
    } @else {
      <nz-empty nzNotFoundContent="Tidak ada workflow"></nz-empty>
    }
  `,
  styles: [`
    .wf-header { @apply flex items-center gap-2 mb-4 pb-3 border-b text-sm font-medium; }
    .wf-header__name { @apply flex-1; }
    .wf-dot { @apply w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-600; }
    .wf-dot--preview { @apply bg-gray-100 text-gray-500; }
    .wf-dot[data-status="approved"] { @apply bg-green-500 text-white; }
    .wf-dot[data-status="rejected"] { @apply bg-red-500 text-white; }
    .wf-dot[data-status="active"] { @apply bg-blue-500 text-white; }
    .wf-item { @apply bg-white rounded-lg border p-3; }
    .wf-item[data-status="approved"] { @apply border-green-200 bg-green-50/30; }
    .wf-item[data-status="rejected"] { @apply border-red-200 bg-red-50/30; }
    .wf-item[data-status="active"] { @apply border-blue-300 bg-blue-50/30 ring-1 ring-blue-200; }
    .wf-item__row { @apply flex items-center gap-2 mb-1; }
    .wf-item__name { @apply font-medium text-sm; }
    .wf-item__sub { @apply text-xs text-gray-500 flex items-center gap-1; }
    .wf-item__time { @apply text-gray-400; }
    .wf-item__comment { @apply text-xs italic text-gray-600 mt-2 bg-gray-50 rounded px-2 py-1; }
    .wf-item__note { @apply text-xs text-gray-500 mt-1; }
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class DocWorkflowViewComponent implements OnInit {
  docService = inject(DocumentDetailService);

  ngOnInit() {
    if (!this.docService.workflow()) {
      this.docService.loadWorkflow();
    }
  }

  getStepTypeLabel(type: string): string {
    const labels: Record<string, string> = { 'approve': 'Persetujuan', 'approval': 'Persetujuan', 'review': 'Review', 'sign': 'Tanda Tangan', 'acknowledge': 'Acknowledgement' };
    return labels[type] || type;
  }

  getStepTypeColor(type: string): string {
    const colors: Record<string, string> = { 'approve': 'blue', 'approval': 'blue', 'review': 'cyan', 'sign': 'purple', 'acknowledge': 'green' };
    return colors[type] || 'default';
  }

  getAssigneeTypeLabel(type: string): string {
    const labels: Record<string, string> = { 'role': 'Berdasarkan Role', 'user': 'Pengguna Tertentu', 'position': 'Berdasarkan Posisi', 'department': 'Berdasarkan Departemen' };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'approved': 'Disetujui', 'rejected': 'Ditolak', 'active': 'Aktif', 'pending': 'Menunggu', 'skipped': 'Dilewati' };
    return labels[status] || status;
  }

  getStatusTagColor(status: string): string {
    const colors: Record<string, string> = { 'approved': 'success', 'rejected': 'error', 'active': 'processing', 'pending': 'default', 'skipped': 'warning' };
    return colors[status] || 'default';
  }

  getInstanceStatusLabel(status?: string): string {
    const labels: Record<string, string> = { 'approved': 'Selesai', 'rejected': 'Ditolak', 'active': 'Berlangsung', 'pending': 'Menunggu' };
    return labels[status || ''] || 'Berlangsung';
  }
}
