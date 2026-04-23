import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { DocumentDetailService } from '../../document-detail.service';

@Component({
  selector: 'app-doc-workflow-view',
  standalone: true,
  imports: [CommonModule, DatePipe, NzTimelineModule, NzTagModule, NzIconModule, NzSpinModule, NzEmptyModule, NzAlertModule],
  templateUrl: './doc-workflow-view.component.html',
  styleUrl: './doc-workflow-view.component.scss'
})
export class DocWorkflowViewComponent implements OnInit {
  docService = inject(DocumentDetailService);

  ngOnInit() {
    if (!this.docService.workflow()) {
      this.docService.loadWorkflow();
    }
  }

  getStepTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    const labels: Record<string, string> = {
      approval: 'Persetujuan', approve: 'Persetujuan', review: 'Review',
      sign: 'Tanda Tangan', acknowledge: 'Acknowledgment', input: 'Input Data'
    };
    return labels[type] || type;
  }

  getStepSla(step: any): { remaining: string; percent: number; status: string; daysLeft: number } | null {
    if (!step.deadline && !step.deadline_days) return null;

    if (step.status === 'approved' || step.status === 'rejected') {
      if (step.activated_at && step.completed_at) {
        const start = new Date(step.activated_at).getTime();
        const end = new Date(step.completed_at).getTime();
        const daysUsed = Math.max(0, Math.round((end - start) / 86400000));
        const totalDays = step.deadline_days || 0;
        if (totalDays > 0) {
          const overdue = step.deadline ? new Date(step.completed_at) > new Date(step.deadline) : false;
          return {
            remaining: overdue ? `Terlambat ${daysUsed - totalDays}h` : `Selesai dalam ${daysUsed}h dari ${totalDays}h`,
            percent: 100,
            status: overdue ? 'overdue' : 'completed',
            daysLeft: overdue ? -(daysUsed - totalDays) : totalDays - daysUsed
          };
        }
      }
      return null;
    }

    if (step.deadline) {
      const now = Date.now();
      const deadlineTime = new Date(step.deadline).getTime();
      const msLeft = deadlineTime - now;
      const daysLeft = Math.ceil(msLeft / 86400000);
      const hoursLeft = Math.ceil(msLeft / 3600000);
      let percent = 0;
      if (step.activated_at) {
        const startTime = new Date(step.activated_at).getTime();
        const totalDuration = deadlineTime - startTime;
        const elapsed = now - startTime;
        percent = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0;
      }
      let status: string;
      let remaining: string;
      if (msLeft <= 0) {
        status = 'overdue'; remaining = `Terlambat ${Math.abs(daysLeft)}h`; percent = 100;
      } else if (daysLeft <= 1) {
        status = 'danger'; remaining = hoursLeft <= 24 ? `${hoursLeft} jam lagi` : `${daysLeft} hari lagi`;
      } else if (daysLeft <= 3) {
        status = 'warning'; remaining = `${daysLeft} hari lagi`;
      } else {
        status = 'safe'; remaining = `${daysLeft} hari lagi`;
      }
      return { remaining, percent, status, daysLeft };
    }
    return null;
  }
}
