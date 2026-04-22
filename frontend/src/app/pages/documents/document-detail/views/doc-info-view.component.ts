import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../document-detail.service';
import { formatDate, getStatusLabel } from '../../document.models';

@Component({
  selector: 'app-doc-info-view',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzTagModule, NzSpinModule, NzAvatarModule, NzEmptyModule],
  template: `
    @if (docService.document(); as doc) {
      <div class="doc-info-view">
        <!-- Workflow Flow -->
        <div class="wf-flow">
          <div class="wf-flow__header">
            <span nz-icon nzType="audit" nzTheme="outline"></span>
            <span class="wf-flow__title">Alur Persetujuan</span>
            @if (docService.workflow()?.workflow_name) {
              <nz-tag nzColor="processing">{{ docService.workflow()!.workflow_name }}</nz-tag>
            }
          </div>
          @if (docService.workflowLoading()) {
            <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
          } @else if (docService.workflow()?.steps?.length) {
            <div class="wf-pipeline">
              @for (step of docService.workflow()!.steps; track step.id; let i = $index; let last = $last) {
                <div class="wf-card" [attr.data-status]="step.status">
                  <div class="wf-card__icon">
                    @if (step.status === 'approved') {
                      <span nz-icon nzType="check-circle" nzTheme="fill"></span>
                    } @else if (step.status === 'rejected') {
                      <span nz-icon nzType="close-circle" nzTheme="fill"></span>
                    } @else if (step.status === 'active') {
                      <span nz-icon nzType="sync" nzTheme="outline" class="animate-spin"></span>
                    } @else {
                      <span class="wf-card__num">{{ i + 1 }}</span>
                    }
                  </div>
                  <div class="wf-card__body">
                    <div class="wf-card__name">{{ step.name }}</div>
                    <div class="wf-card__meta">
                      @if (step.status === 'approved' || step.status === 'rejected') {
                        {{ step.actor?.name || '-' }}
                      } @else if (step.status === 'active') {
                        Menunggu
                      } @else {
                        {{ getStepTypeLabel(step.step_type || '') }}
                      }
                    </div>
                  </div>
                </div>
                @if (!last) {
                  <div class="wf-arrow" [attr.data-status]="step.status">
                    <span nz-icon nzType="right" nzTheme="outline"></span>
                  </div>
                }
              }
            </div>
          } @else {
            <div class="wf-flow__empty">
              <span nz-icon nzType="inbox" nzTheme="outline"></span>
              <span>Tidak ada workflow</span>
            </div>
          }
        </div>

        <!-- Stats Cards -->
        <div class="info-stat-cards">
          <div class="info-stat-card">
            <div class="info-stat-card__icon info-stat-card__icon--files">
              <span nz-icon nzType="file-text" nzTheme="outline"></span>
            </div>
            <div class="info-stat-card__body">
              <div class="info-stat-card__value">{{ countFiles() }}</div>
              <div class="info-stat-card__label">Total Berkas</div>
            </div>
          </div>
          <div class="info-stat-card">
            <div class="info-stat-card__icon info-stat-card__icon--comments">
              <span nz-icon nzType="message" nzTheme="outline"></span>
            </div>
            <div class="info-stat-card__body">
              <div class="info-stat-card__value">{{ docService.comments().length }}</div>
              <div class="info-stat-card__label">Komentar</div>
            </div>
          </div>
          <div class="info-stat-card">
            <div class="info-stat-card__icon info-stat-card__icon--dist">
              <span nz-icon nzType="send" nzTheme="outline"></span>
            </div>
            <div class="info-stat-card__body">
              <div class="info-stat-card__value">{{ docService.distributions().length }}</div>
              <div class="info-stat-card__label">Distribusi</div>
            </div>
          </div>
          <div class="info-stat-card">
            <div class="info-stat-card__icon info-stat-card__icon--sign">
              <span nz-icon nzType="safety-certificate" nzTheme="outline"></span>
            </div>
            <div class="info-stat-card__body">
              <div class="info-stat-card__value">{{ docService.signatures().length }}</div>
              <div class="info-stat-card__label">Tanda Tangan</div>
            </div>
          </div>
        </div>

        <!-- Detail Info Grid -->
        <div class="doc-info-grid">
          <div class="doc-info-item">
            <span class="doc-info-label">Tipe Dokumen</span>
            <span class="doc-info-value">{{ doc.document_type?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Kategori</span>
            <span class="doc-info-value">{{ doc.category?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Kode Tipe</span>
            <span class="doc-info-value doc-info-value--mono">{{ doc.document_type?.code || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Pembuat</span>
            <span class="doc-info-value">
              <span nz-icon nzType="user" nzTheme="outline" class="mr-1 text-gray-400"></span>
              {{ doc.creator?.name || '-' }}
            </span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Versi</span>
            <span class="doc-info-value doc-info-value--mono">v{{ doc.major_version }}.{{ doc.minor_version }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Jumlah Revisi</span>
            <span class="doc-info-value">{{ doc.revision_count }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Department</span>
            <span class="doc-info-value">{{ doc.department?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Section</span>
            <span class="doc-info-value">{{ doc.section?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Perusahaan</span>
            <span class="doc-info-value">{{ doc.company?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Template</span>
            <span class="doc-info-value">{{ doc.template?.name || '-' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Nomor Dokumen</span>
            <span class="doc-info-value doc-info-value--mono">{{ doc.document_number || 'Belum ada' }}</span>
          </div>
          <div class="doc-info-item">
            <span class="doc-info-label">Prioritas</span>
            <span class="doc-info-value">{{ doc.priority || 'Normal' }}</span>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="doc-info-timestamps">
          <div class="doc-info-ts">
            <span nz-icon nzType="calendar" nzTheme="outline"></span>
            <span class="doc-info-label">Dibuat</span>
            <span class="doc-info-value">{{ formatDate(doc.created_at) }}</span>
          </div>
          <div class="doc-info-ts">
            <span nz-icon nzType="edit" nzTheme="outline"></span>
            <span class="doc-info-label">Diperbarui</span>
            <span class="doc-info-value">{{ formatDate(doc.updated_at) }}</span>
          </div>
          @if (doc.submitted_at) {
            <div class="doc-info-ts">
              <span nz-icon nzType="send" nzTheme="outline"></span>
              <span class="doc-info-label">Disubmit</span>
              <span class="doc-info-value">{{ formatDate(doc.submitted_at) }}</span>
            </div>
          }
          @if (doc.approved_at) {
            <div class="doc-info-ts">
              <span nz-icon nzType="check-circle" nzTheme="outline"></span>
              <span class="doc-info-label">Disetujui</span>
              <span class="doc-info-value">{{ formatDate(doc.approved_at) }}</span>
            </div>
          }
        </div>

        @if (doc.description) {
          <div class="doc-info-desc">
            <span class="doc-info-label">Deskripsi</span>
            <p class="doc-info-desc__text">{{ doc.description }}</p>
          </div>
        }
      </div>
    }
  `,
  styleUrls: ['./doc-info-view.component.scss']
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
