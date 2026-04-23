import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { DocumentDetailService } from '../../document-detail.service';
import { formatDate } from '../../../document.models';

@Component({
  selector: 'app-doc-signatures-view',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule, NzToolTipModule, NzPopconfirmModule],
  templateUrl: './doc-signatures-view.component.html',
  styleUrl: './doc-signatures-view.component.scss'
})
export class DocSignaturesViewComponent implements OnInit {
  docService = inject(DocumentDetailService);
  formatDate = formatDate;
  signing = false;

  ngOnInit() {
    if (this.docService.signatures().length === 0) {
      this.docService.loadSignatures();
    }
  }

  signDocument() {
    this.signing = true;
    this.docService.signDocument().finally(() => { this.signing = false; });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = { 'valid': 'green', 'pending': 'gold', 'revoked': 'red' };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'valid': 'Valid', 'pending': 'Pending', 'revoked': 'Dicabut' };
    return labels[status] || status;
  }
}
