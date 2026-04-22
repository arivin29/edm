import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { environment } from '../../../../environments/environment';

interface SLABreachedItem {
  step_instance_id: string;
  step_name: string;
  step_order: number;
  document_id: string;
  document_title: string;
  document_number: string;
  workflow_name: string;
  assignee_name: string;
  deadline: string;
  activated_at: string;
  overdue_hours: number;
  status: string;
  escalated: boolean;
}

@Component({
  selector: 'app-sla-breached',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzIconModule, NzTagModule, NzSpinModule,
    NzTableModule, NzButtonModule, NzToolTipModule, NzSelectModule, NzEmptyModule
  ],
  templateUrl: './sla-breached.component.html',
  styleUrls: ['./sla-breached.component.scss']
})
export class SLABreachedPage implements OnInit {
  private http = inject(HttpClient);

  items = signal<SLABreachedItem[]>([]);
  loading = signal(true);
  filterStatus = '';

  get breachedCount(): number { return this.items().filter(i => i.status === 'breached').length; }
  get atRiskCount(): number { return this.items().filter(i => i.status === 'at_risk').length; }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/sla/breached?include_at_risk=true`).subscribe({
      next: (res) => {
        this.items.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  filteredItems(): SLABreachedItem[] {
    if (!this.filterStatus) return this.items();
    return this.items().filter(i => i.status === this.filterStatus);
  }

  formatHours(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)} menit`;
    if (hours < 24) return `${hours.toFixed(1)} jam`;
    return `${(hours / 24).toFixed(1)} hari`;
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${m}`;
  }
}
