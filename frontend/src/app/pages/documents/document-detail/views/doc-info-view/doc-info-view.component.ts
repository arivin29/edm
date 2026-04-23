import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../../document-detail.service';
import { formatDate, getStatusLabel } from '../../../document.models';

@Component({
  selector: 'app-doc-info-view',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzTagModule, NzSpinModule, NzAvatarModule, NzEmptyModule],
  templateUrl: './doc-info-view.component.html',
  styleUrl: './doc-info-view.component.scss'
})
export class DocInfoViewComponent implements OnInit {
  docService = inject(DocumentDetailService);
  formatDate = formatDate;
  getStatusLabel = getStatusLabel;

  ngOnInit() {
    this.docService.loadComments();
    this.docService.loadDistributions();
    this.docService.loadSignatures();
  }

  countFiles(): number {
    const tree = this.docService.fileTree();
    let count = 0;
    for (const folder of tree) {
      count += folder.children?.length || 0;
    }
    return count;
  }

  getStepTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    const labels: Record<string, string> = {
      'approve': 'Persetujuan',
      'approval': 'Persetujuan',
      'review': 'Review',
      'sign': 'Tanda Tangan',
      'acknowledge': 'Acknowledgement',
      'input': 'Input Data'
    };
    return labels[type] || type;
  }

  getAssignedUsers(): { id: string; name: string; stepName?: string }[] {
    const wf = this.docService.workflow();
    if (!wf?.steps) return [];
    const seen = new Set<string>();
    const users: { id: string; name: string; stepName?: string }[] = [];
    for (const step of wf.steps) {
      const actor = step.actor || step.actions?.[0]?.actor;
      if (actor && !seen.has(actor.id)) {
        seen.add(actor.id);
        users.push({ id: actor.id, name: actor.name, stepName: step.name || step.step?.name });
      }
    }
    return users;
  }
}
