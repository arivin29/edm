import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { environment } from '../../../../environments/environment';

interface SLAStats {
  total_active: number;
  on_track: number;
  at_risk: number;
  breached: number;
  avg_completion_hours: number;
  compliance_rate: number;
  total_completed: number;
  completed_on_time: number;
}

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
  selector: 'app-sla-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    NzCardModule, NzIconModule, NzTagModule, NzSpinModule,
    NzTableModule, NzButtonModule, NzToolTipModule, NzProgressModule, NzEmptyModule
  ],
  templateUrl: './sla-dashboard.component.html',
  styleUrls: ['./sla-dashboard.component.scss']
})
export class SLADashboardPage implements OnInit {
  private http = inject(HttpClient);

  stats = signal<SLAStats | null>(null);
  breachedItems = signal<SLABreachedItem[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/sla/dashboard`).subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.http.get<any>(`${environment.apiUrl}/sla/breached?include_at_risk=true`).subscribe({
      next: (res) => this.breachedItems.set(res.data || []),
      error: () => {}
    });
  }

  getComplianceColor(rate: number): string {
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
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
