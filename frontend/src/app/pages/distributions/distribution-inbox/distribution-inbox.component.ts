import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface InboxDistribution {
  id: string;
  document_id: string;
  version_number: number;
  copy_number?: string;
  distribution_type: string;
  recipient_type: string;
  status: string;
  distributed_by: string;
  distributed_at?: string;
  received_at?: string;
  notes?: string;
  created_at: string;
  document?: {
    id: string;
    title: string;
    document_number: string;
    status: string;
    current_version: number;
    document_type?: { id: string; name: string; code?: string };
    department?: { id: string; name: string };
  };
  distributor?: { id: string; name: string; email: string };
  recipient?: { id: string; name: string; email: string };
}

@Component({
  selector: 'app-distribution-inbox',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzSelectModule, NzCardModule, NzSpinModule,
    NzModalModule, NzToolTipModule, NzBadgeModule, NzEmptyModule
  ],
  templateUrl: './distribution-inbox.component.html',
  styleUrls: ['./distribution-inbox.component.scss']
})
export class DistributionInboxPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  distributions = signal<InboxDistribution[]>([]);
  loading = signal(false);
  total = signal(0);
  pageIndex = signal(1);
  pageSize = signal(15);

  statPending = signal(0);
  statDistributed = signal(0);
  statReceived = signal(0);

  filterStatus = '';
  filterType = '';

  ngOnInit() {
    this.loadInbox();
    this.loadStats();
  }

  loadInbox() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort_by: 'created_at',
      sort_dir: 'desc'
    };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterType) params.distribution_type = this.filterType;

    this.http.get<any>(`${environment.apiUrl}/distributions/inbox`, { params }).subscribe({
      next: (res) => {
        this.distributions.set(res.data || []);
        if (res.meta) {
          this.total.set(res.meta.total || 0);
          this.pageIndex.set(res.meta.page || 1);
        }
        this.loading.set(false);
      },
      error: () => {
        this.distributions.set([]);
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    const statuses = ['pending', 'distributed', 'received'];
    statuses.forEach(status => {
      this.http.get<any>(`${environment.apiUrl}/distributions/inbox`, {
        params: { status, per_page: '1' }
      }).subscribe({
        next: (res) => {
          const count = res.meta?.total || 0;
          if (status === 'pending') this.statPending.set(count);
          else if (status === 'distributed') this.statDistributed.set(count);
          else if (status === 'received') this.statReceived.set(count);
        }
      });
    });
  }

  onFilter() {
    this.pageIndex.set(1);
    this.loadInbox();
  }

  onPageIndexChange(index: number) {
    this.pageIndex.set(index);
    this.loadInbox();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadInbox();
  }

  acknowledge(dist: InboxDistribution) {
    this.modal.confirm({
      nzTitle: 'Konfirmasi Penerimaan',
      nzContent: `Apakah Anda yakin telah menerima dokumen "<b>${dist.document?.title || 'Dokumen'}</b>"?`,
      nzOkText: 'Ya, Terima',
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.post<any>(`${environment.apiUrl}/distributions/${dist.id}/acknowledge`, {}).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil dikonfirmasi');
            this.loadInbox();
            this.loadStats();
          },
          error: (err) => {
            this.message.error(err.error?.message || 'Gagal mengkonfirmasi penerimaan');
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'orange',
      distributed: 'blue',
      received: 'green',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Menunggu',
      distributed: 'Didistribusikan',
      received: 'Diterima',
      cancelled: 'Dibatalkan'
    };
    return labels[status] || status;
  }

  getDistTypeLabel(type: string): string {
    return type === 'controlled' ? 'Terkendali' : 'Tidak Terkendali';
  }

  getDistTypeColor(type: string): string {
    return type === 'controlled' ? 'purple' : 'cyan';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${m}`;
  }
}
