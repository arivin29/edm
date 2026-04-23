import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DownloadService } from '../../../core/services/download.service';
import { LayoutService } from '../../../core/services/layout.service';
import { DocumentDetailService } from './document-detail.service';
import {
  getStatusLabel, getPriorityLabel, getConfidentialityLabel,
  getClassificationColor, getClassificationLabel, getClassificationIcon
} from '../document.models';

interface DetailMenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-document-detail-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    NzIconModule, NzToolTipModule, NzSpinModule, NzTagModule, NzButtonModule, NzModalModule
  ],
  providers: [DocumentDetailService],
  template: `
    <div class="doc-detail-layout">
      @if (docService.loading()) {
        <div class="loading-container">
          <nz-spin nzSimple nzSize="large"></nz-spin>
        </div>
      } @else if (docService.document()) {
        <!-- Header -->
        <div class="doc-header">
          <div class="doc-header__left">
            <a routerLink="/documents" class="doc-header__back" nz-tooltip nzTooltipTitle="Kembali ke daftar">
              <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
            </a>
            <div class="doc-header__info">
              <div class="doc-header__title-row">
                <h1 class="doc-header__title">{{ docService.document()!.title }}</h1>
                <div class="doc-header__tags">
                  <span class="doc-status-tag" [attr.data-status]="docService.document()!.status">
                    <span class="doc-status-tag__dot"></span>
                    {{ getStatusLabel(docService.document()!.status) }}
                  </span>
                  <span class="doc-meta-tag" [attr.data-priority]="docService.document()!.priority">{{ getPriorityLabel(docService.document()!.priority) }}</span>
                  <span class="doc-meta-tag">{{ getConfidentialityLabel(docService.document()!.confidentiality) }}</span>
                  <nz-tag [nzColor]="getClassificationColor(docService.document()!.classification)" class="ml-1">
                    <span nz-icon [nzType]="getClassificationIcon(docService.document()!.classification)" class="mr-0.5"></span>
                    {{ getClassificationLabel(docService.document()!.classification) }}
                  </nz-tag>
                </div>
              </div>
              <div class="doc-header__subtitle">
                <span class="doc-number">
                  <span nz-icon nzType="number" nzTheme="outline"></span>
                  {{ docService.document()!.document_number || 'Belum ada nomor' }}
                </span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">{{ docService.document()!.document_type?.name || '' }}</span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">v{{ docService.document()!.major_version }}.{{ docService.document()!.minor_version }}</span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">
                  <span nz-icon nzType="user" nzTheme="outline" style="font-size: 10px; margin-right: 2px;"></span>
                  {{ docService.document()!.creator?.name || '-' }}
                </span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">{{ docService.document()!.department?.name || '-' }}</span>
              </div>
            </div>
          </div>
          <div class="doc-header__actions">
            <button nz-button nzSize="small" (click)="downloadDocument()" nz-tooltip nzTooltipTitle="Download">
              <span nz-icon nzType="download"></span>
            </button>
            <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Print">
              <span nz-icon nzType="printer"></span>
            </button>
            <button nz-button nzSize="small" nz-tooltip nzTooltipTitle="Share">
              <span nz-icon nzType="share-alt"></span>
            </button>
            <span class="doc-header__divider"></span>
            <button nz-button nzSize="small" [routerLink]="['/documents', docService.documentId(), 'edit']">
              <span nz-icon nzType="edit"></span> Edit
            </button>
            @if (docService.document()!.status === 'draft' || docService.document()!.status === 'revision') {
              <button nz-button nzType="primary" nzSize="small" (click)="submitForReview()">
                <span nz-icon nzType="send"></span> Submit Review
              </button>
            }
            @if (docService.workflow()?.can_approve) {
              <button nz-button nzSize="small" class="btn-approve" (click)="approveDocument()">
                <span nz-icon nzType="check-circle"></span> Setujui
              </button>
            }
            @if (docService.workflow()?.can_reject) {
              <button nz-button nzDanger nzSize="small" (click)="openRejectModal()">
                <span nz-icon nzType="close-circle"></span> Tolak
              </button>
            }
          </div>
        </div>

        <!-- Body with Sidebar + Content -->
        <div class="doc-body">
          <!-- Detail Sidebar -->
          <aside class="doc-sidebar">
            @for (item of menuItems; track item.key) {
              <a
                class="doc-sidebar__item"
                [routerLink]="['/documents', docService.documentId(), item.route]"
                routerLinkActive="active"
              >
                <span nz-icon [nzType]="item.icon" nzTheme="outline"></span>
                <span class="doc-sidebar__label">{{ item.label }}</span>
              </a>
            }
          </aside>

          <!-- Content -->
          <main class="doc-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      } @else {
        <div class="not-found">
          <span nz-icon nzType="file-unknown" nzTheme="outline"></span>
          <p>Dokumen tidak ditemukan</p>
          <a routerLink="/documents" nz-button nzType="primary">Kembali ke Daftar</a>
        </div>
      }
    </div>
  `,
  styleUrls: ['./document-detail-layout.component.scss']
})
export class DocumentDetailLayoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private layoutService = inject(LayoutService);
  docService = inject(DocumentDetailService);

  menuItems: DetailMenuItem[] = [
    { key: 'info', label: 'Informasi', icon: 'info-circle', route: 'info' },
    { key: 'editor', label: 'Editor', icon: 'form', route: 'editor' },
    { key: 'files', label: 'Berkas', icon: 'folder-open', route: 'files' },
    { key: 'versions', label: 'Riwayat Versi', icon: 'history', route: 'versions' },
    { key: 'parameters', label: 'Parameter', icon: 'control', route: 'parameters' },
    { key: 'comments', label: 'Komentar', icon: 'message', route: 'comments' },
    { key: 'workflow', label: 'Workflow', icon: 'apartment', route: 'workflow' },
    { key: 'distribution', label: 'Distribusi', icon: 'send', route: 'distribution' },
    { key: 'signatures', label: 'Tanda Tangan', icon: 'safety-certificate', route: 'signatures' },
    { key: 'ocr', label: 'OCR', icon: 'scan', route: 'ocr' },
  ];

  getStatusLabel = getStatusLabel;
  getPriorityLabel = getPriorityLabel;
  getConfidentialityLabel = getConfidentialityLabel;
  getClassificationColor = getClassificationColor;
  getClassificationLabel = getClassificationLabel;
  getClassificationIcon = getClassificationIcon;

  ngOnInit() {
    // Collapse main sidebar when entering document detail
    this.layoutService.collapseMainSidebar();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.docService.loadDocument(id);
      this.docService.loadVersions();
      this.docService.loadAttachments();
      this.docService.loadWorkflow();
    }
  }

  ngOnDestroy() {
    // Expand main sidebar when leaving document detail
    this.layoutService.expandMainSidebar();
  }

  private downloadSvc = inject(DownloadService);

  downloadDocument() {
    this.downloadSvc.download(`/documents/${this.docService.documentId()}/download`);
  }

  submitForReview() {
    this.modal.confirm({
      nzTitle: 'Submit untuk Review?',
      nzContent: 'Dokumen akan dikirim untuk proses persetujuan.',
      nzOkText: 'Ya, Submit',
      nzOnOk: () => {
        this.http.post(`${environment.apiUrl}/documents/${this.docService.documentId()}/submit`, {}).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil disubmit');
            this.docService.loadDocument(this.docService.documentId());
            this.docService.loadWorkflow();
          },
          error: () => this.message.error('Gagal submit dokumen')
        });
      }
    });
  }

  approveDocument() {
    this.modal.confirm({
      nzTitle: 'Setujui Dokumen?',
      nzContent: 'Apakah Anda yakin ingin menyetujui dokumen ini?',
      nzOkText: 'Setujui',
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.post(`${environment.apiUrl}/documents/${this.docService.documentId()}/approve`, {}).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil disetujui');
            this.docService.loadDocument(this.docService.documentId());
            this.docService.loadWorkflow();
          },
          error: () => this.message.error('Gagal menyetujui dokumen')
        });
      }
    });
  }

  openRejectModal() {
    let rejectComment = '';
    this.modal.create({
      nzTitle: 'Tolak Dokumen',
      nzContent: `
        <div>
          <p class="mb-2">Berikan alasan penolakan:</p>
          <textarea id="reject-comment" rows="4" style="width:100%;padding:8px;border:1px solid #d9d9d9;border-radius:4px;" placeholder="Alasan penolakan (wajib)..."></textarea>
        </div>
      `,
      nzOkText: 'Tolak',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        const el = window.document.getElementById('reject-comment') as HTMLTextAreaElement;
        rejectComment = el?.value?.trim() || '';
        if (!rejectComment) {
          this.message.warning('Alasan penolakan wajib diisi');
          return false;
        }
        return new Promise<void>((resolve, reject) => {
          this.http.post(`${environment.apiUrl}/documents/${this.docService.documentId()}/reject`, { comment: rejectComment }).subscribe({
            next: () => {
              this.message.success('Dokumen berhasil ditolak');
              this.docService.loadDocument(this.docService.documentId());
              this.docService.loadWorkflow();
              resolve();
            },
            error: () => {
              this.message.error('Gagal menolak dokumen');
              reject();
            }
          });
        });
      }
    });
  }
}
