import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusConfig {
  label: string;
  class: string;
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      @if (showDot) {
        <span class="dot"></span>
      }
      {{ label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 9999px;
      text-transform: capitalize;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .badge-gray { background: #f3f4f6; color: #4b5563; }
    .badge-primary { background: #dbeafe; color: #1d4ed8; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
  `]
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() showDot = true;
  @Input() statusMap: Record<string, StatusConfig> = {
    'draft': { label: 'Draft', class: 'badge-gray' },
    'in_review': { label: 'Dalam Review', class: 'badge-primary' },
    'revision': { label: 'Perlu Revisi', class: 'badge-warning' },
    'approved': { label: 'Disetujui', class: 'badge-success' },
    'rejected': { label: 'Ditolak', class: 'badge-danger' },
    'final': { label: 'Final', class: 'badge-success' },
    'active': { label: 'Aktif', class: 'badge-success' },
    'inactive': { label: 'Nonaktif', class: 'badge-gray' },
    'pending': { label: 'Menunggu', class: 'badge-warning' },
    'completed': { label: 'Selesai', class: 'badge-success' }
  };

  get config(): StatusConfig {
    return this.statusMap[this.status] || { label: this.status, class: 'badge-gray' };
  }

  get label(): string {
    return this.config.label;
  }

  get badgeClass(): string {
    return this.config.class;
  }
}
