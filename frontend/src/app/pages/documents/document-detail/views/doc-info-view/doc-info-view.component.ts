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

  getStepTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'approve': 'Persetujuan',
      'approval': 'Persetujuan',
      'review': 'Review',
      'sign': 'Tanda Tangan',
      'acknowledge': 'Acknowledgement'
    };
    return labels[type] || type;
  }
}
