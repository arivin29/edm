import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../document-detail.service';

@Component({
  selector: 'app-doc-distribution-view',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule, NzSpinModule, NzEmptyModule],
  template: `
    @if (docService.distributionsLoading()) {
      <div class="text-center py-8"><nz-spin nzSimple></nz-spin></div>
    } @else {
      <nz-table #distTable [nzData]="docService.distributions()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
        <thead>
          <tr>
            <th>Penerima</th>
            <th>Department</th>
            <th nzWidth="140px">Didistribusikan</th>
            <th nzWidth="140px">Diterima</th>
            <th nzWidth="100px">Status</th>
          </tr>
        </thead>
        <tbody>
          @for (d of distTable.data; track d.id) {
            <tr>
              <td class="text-xs">{{ d.user?.name || '-' }}</td>
              <td class="text-xs">{{ d.department?.name || '-' }}</td>
              <td class="text-xs text-gray-500">{{ d.distributed_at | date:'dd/MM/yy HH:mm' }}</td>
              <td class="text-xs text-gray-500">{{ d.received_at ? (d.received_at | date:'dd/MM/yy HH:mm') : '-' }}</td>
              <td>
                <nz-tag [nzColor]="d.status === 'received' ? 'green' : d.status === 'sent' ? 'blue' : 'default'">
                  {{ getDistributionLabel(d.status) }}
                </nz-tag>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5"><nz-empty nzNotFoundContent="Belum ada distribusi"></nz-empty></td></tr>
          }
        </tbody>
      </nz-table>
    }
  `
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
