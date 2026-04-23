import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../../document-detail.service';

@Component({
  selector: 'app-doc-distribution-view',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule, NzSpinModule, NzEmptyModule],
  templateUrl: './doc-distribution-view.component.html',
  styleUrl: './doc-distribution-view.component.scss'
})
export class DocDistributionViewComponent implements OnInit {
  docService = inject(DocumentDetailService);

  ngOnInit() {
    if (this.docService.distributions().length === 0) {
      this.docService.loadDistributions();
    }
  }

  getDistributionLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Menunggu',
      'sent': 'Terkirim',
      'received': 'Diterima',
      'read': 'Dibaca'
    };
    return labels[status] || status;
  }
}
