import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { DocumentDetailService } from '../document-detail.service';
import { formatDate } from '../../document.models';

@Component({
  selector: 'app-doc-signatures-view',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzTagModule, NzSpinModule, NzEmptyModule, NzToolTipModule, NzPopconfirmModule],
  template: `
    <div class="signatures-view">
      <div class="signatures-header">
        <div>
          <h4 class="signatures-title">
            <span nz-icon nzType="safety-certificate" nzTheme="outline" class="text-blue-500"></span>
            Tanda Tangan Digital
          </h4>
          <p class="signatures-subtitle">Daftar tanda tangan pada dokumen ini</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" [nzLoading]="signing" (click)="signDocument()">
          <span nz-icon nzType="edit"></span> Tanda Tangani
        </button>
      </div>

      @if (docService.signaturesLoading()) {
        <div class="text-center py-8"><nz-spin nzSimple></nz-spin></div>
      } @else if (docService.signatures().length > 0) {
        <div class="signatures-list">
          @for (sig of docService.signatures(); track sig.id) {
            <div class="signature-card" [class.signature-card--revoked]="sig.status === 'revoked'">
              <div class="signature-card__image">
                @if (sig.signature_image_path) {
                  <img [src]="sig.signature_image_path" alt="Signature">
                } @else {
                  <span nz-icon nzType="edit" class="text-2xl text-gray-300"></span>
                }
              </div>
              <div class="signature-card__info">
                <div class="signature-card__header">
                  <span class="signature-card__name">{{ sig.signer_name }}</span>
                  <nz-tag [nzColor]="getStatusColor(sig.status)">{{ getStatusLabel(sig.status) }}</nz-tag>
                </div>
                <div class="signature-card__meta">
                  @if (sig.signer_position) { {{ sig.signer_position }} }
                  @if (sig.signer_position && sig.signer_department) { — }
                  @if (sig.signer_department) { {{ sig.signer_department }} }
                </div>
                <div class="signature-card__time">
                  <span nz-icon nzType="clock-circle"></span>
                  {{ formatDate(sig.signed_at) }} · Versi {{ sig.version_number }}
                </div>
                @if (sig.document_hash) {
                  <div class="signature-card__hash">SHA-256: {{ sig.document_hash }}</div>
                }
                @if (sig.status === 'revoked' && sig.revoke_reason) {
                  <div class="signature-card__revoked">
                    <span nz-icon nzType="close-circle"></span> Dicabut: {{ sig.revoke_reason }}
                  </div>
                }
              </div>
              <div class="signature-card__actions">
                @if (sig.status !== 'revoked') {
                  <button nz-button nzSize="small" nzType="text" nz-tooltip="Verifikasi">
                    <span nz-icon nzType="check-circle" class="text-green-500"></span>
                  </button>
                  <button nz-button nzSize="small" nzType="text" nzDanger
                          nz-popconfirm nzPopconfirmTitle="Yakin ingin mencabut?"
                          (nzOnConfirm)="docService.revokeSignature(sig.id)">
                    <span nz-icon nzType="close-circle"></span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="signatures-empty">
          <span nz-icon nzType="safety-certificate" nzTheme="outline"></span>
          <p>Belum ada tanda tangan digital</p>
          <small>Klik "Tanda Tangani" untuk menandatangani dokumen</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .signatures-view { @apply p-2; }
    .signatures-header { @apply flex justify-between items-start mb-4; }
    .signatures-title { @apply text-sm font-semibold m-0 flex items-center gap-1; }
    .signatures-subtitle { @apply text-xs text-gray-400 m-0; }
    .signatures-list { @apply space-y-3; }
    .signature-card { @apply flex gap-3 bg-white border rounded-lg p-3; }
    .signature-card--revoked { @apply border-red-200 opacity-60; }
    .signature-card__image { @apply w-24 h-16 border rounded flex items-center justify-center bg-gray-50 flex-shrink-0; }
    .signature-card__image img { @apply max-w-full max-h-full object-contain; }
    .signature-card__info { @apply flex-1 min-w-0; }
    .signature-card__header { @apply flex items-center gap-2 mb-1; }
    .signature-card__name { @apply text-sm font-semibold; }
    .signature-card__meta { @apply text-xs text-gray-500; }
    .signature-card__time { @apply text-[10px] text-gray-400 mt-1 flex items-center gap-1; }
    .signature-card__hash { @apply text-[10px] text-gray-300 font-mono truncate mt-0.5; }
    .signature-card__revoked { @apply text-[10px] text-red-400 mt-1 flex items-center gap-1; }
    .signature-card__actions { @apply flex gap-1 flex-shrink-0; }
    .signatures-empty { @apply text-center py-8 text-gray-400; }
    .signatures-empty span[nz-icon] { @apply text-4xl mb-2 block; }
    .signatures-empty p { @apply text-sm m-0; }
    .signatures-empty small { @apply text-xs text-gray-300; }
  `]
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
