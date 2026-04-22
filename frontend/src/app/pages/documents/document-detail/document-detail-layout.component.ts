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
import { LayoutService } from '../../../core/services/layout.service';
import { DocumentDetailService } from './document-detail.service';
import { getStatusLabel } from '../document.models';

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
                </div>
              </div>
              <div class="doc-header__subtitle">
                <span class="doc-number">{{ docService.document()!.document_number || 'Belum ada nomor' }}</span>
                <span class="doc-header__sep">·</span>
                <span>{{ docService.document()!.document_type?.name }}</span>
                <span class="doc-header__sep">·</span>
                <span>v{{ docService.document()!.major_version }}.{{ docService.document()!.minor_version }}</span>
              </div>
            </div>
          </div>
          <div class="doc-header__actions">
            <button nz-button nzSize="small" (click)="downloadDocument()" nz-tooltip nzTooltipTitle="Download">
              <span nz-icon nzType="download"></span>
            </button>
            <button nz-button nzSize="small" [routerLink]="['/documents', docService.documentId(), 'edit']">
              <span nz-icon nzType="edit"></span> Edit
            </button>
            @if (docService.document()!.status === 'draft' || docService.document()!.status === 'revision') {
              <button nz-button nzType="primary" nzSize="small" (click)="submitForReview()">
                <span nz-icon nzType="send"></span> Submit
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
    { key: 'files', label: 'Berkas', icon: 'folder-open', route: 'files' },
    { key: 'versions', label: 'Riwayat Versi', icon: 'history', route: 'versions' },
    { key: 'parameters', label: 'Parameter', icon: 'control', route: 'parameters' },
    { key: 'comments', label: 'Komentar', icon: 'message', route: 'comments' },
    { key: 'workflow', label: 'Workflow', icon: 'apartment', route: 'workflow' },
    { key: 'distribution', label: 'Distribusi', icon: 'send', route: 'distribution' },
    { key: 'signatures', label: 'Tanda Tangan', icon: 'safety-certificate', route: 'signatures' },
  ];

  getStatusLabel = getStatusLabel;

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

  downloadDocument() {
    window.open(`${environment.apiUrl}/documents/${this.docService.documentId()}/download`, '_blank');
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
          },
          error: () => this.message.error('Gagal submit dokumen')
        });
      }
    });
  }
}
