import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-document-quick-view',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, DateFormatPipe],
  template: `
    <div class="quick-view">
      <!-- Status -->
      <div class="info-row">
        <span class="label">Status</span>
        <app-status-badge [status]="document.status" />
      </div>

      <!-- Document info -->
      <div class="info-section">
        <h4>Informasi Dokumen</h4>

        <div class="info-row">
          <span class="label">No. Dokumen</span>
          <span class="value">{{ document.document_number || '-' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Tipe</span>
          <span class="value">{{ document.document_type?.name || '-' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Kategori</span>
          <span class="value">{{ document.category?.name || '-' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Versi</span>
          <span class="value">v{{ document.current_version || 1 }}</span>
        </div>

        @if (document.description) {
          <div class="info-row full">
            <span class="label">Deskripsi</span>
            <span class="value">{{ document.description }}</span>
          </div>
        }
      </div>

      <!-- Dates -->
      <div class="info-section">
        <h4>Tanggal</h4>

        <div class="info-row">
          <span class="label">Dibuat</span>
          <span class="value">{{ document.created_at | dateFormat:'datetime' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Diperbarui</span>
          <span class="value">{{ document.updated_at | dateFormat:'datetime' }}</span>
        </div>

        @if (document.effective_date) {
          <div class="info-row">
            <span class="label">Efektif</span>
            <span class="value">{{ document.effective_date | dateFormat }}</span>
          </div>
        }

        @if (document.expiry_date) {
          <div class="info-row">
            <span class="label">Kedaluwarsa</span>
            <span class="value">{{ document.expiry_date | dateFormat }}</span>
          </div>
        }
      </div>

      <!-- Creator -->
      <div class="info-section">
        <h4>Pembuat</h4>

        <div class="info-row">
          <span class="label">Nama</span>
          <span class="value">{{ document.created_by_user?.name || '-' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Departemen</span>
          <span class="value">{{ document.department?.name || '-' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-section {
      h4 {
        margin: 0 0 12px;
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;

      &.full {
        flex-direction: column;
        gap: 4px;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .label {
      flex: 0 0 120px;
      font-size: 13px;
      color: #6b7280;
    }

    .value {
      flex: 1;
      font-size: 14px;
      color: #1f2937;
      word-break: break-word;
    }
  `]
})
export class DocumentQuickViewComponent {
  @Input({ required: true }) document: any;
}
