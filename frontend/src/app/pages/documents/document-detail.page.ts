import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface DocumentDetail {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  confidentiality: string;
  current_version: number;
  major_version: number;
  minor_version: number;
  revision_count: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string };
  creator?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  section?: { id: string; name: string };
  company?: { id: string; name: string };
  office?: { id: string; name: string };
  template?: { id: string; name: string };
}

interface DocumentVersion {
  id: string;
  version_number: number;
  major_version: number;
  minor_version: number;
  file_name: string;
  file_size: number;
  change_summary: string;
  is_current: boolean;
  creator?: { id: string; name: string };
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  is_resolved: boolean;
  user?: { id: string; name: string; avatar?: string };
  parent_id?: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: string;
  action_type: string;
  comment?: string;
  actor?: { id: string; name: string };
  completed_at?: string;
  created_at: string;
}

interface WorkflowStatus {
  steps: WorkflowStep[];
  actions: string[];
}

interface Distribution {
  id: string;
  user?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  distributed_at: string;
  received_at?: string;
  status: string;
}

interface Attachment {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  module: string;
  uploaded_by: string;
  created_at: string;
  uploader?: { id: string; name: string; email: string };
}

interface DocumentRelation {
  id: string;
  document_id: string;
  related_document_id: string;
  relation_type: string;
  notes?: string;
  created_by: string;
  created_at: string;
  document?: { id: string; title: string; document_number: string; status: string };
  related_document?: { id: string; title: string; document_number: string; status: string };
  creator?: { id: string; name: string };
}

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzTabsModule, NzTimelineModule,
    NzCommentModule, NzAvatarModule, NzInputModule, NzSpinModule,
    NzModalModule, NzBadgeModule, NzToolTipModule, NzTableModule, NzEmptyModule,
    NzUploadModule, NzListModule, NzDrawerModule, NzSelectModule
  ],
  template: `
    @if (loading()) {
      <div class="text-center py-16">
        <nz-spin nzSimple></nz-spin>
      </div>
    } @else if (document()) {
      <!-- Page Header -->
      <div class="detail-header">
        <div class="detail-header-top">
          <a routerLink="/documents" class="back-link" nz-tooltip nzTooltipTitle="Kembali ke daftar">
            <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
          </a>
          <div class="detail-header-info">
            <div class="detail-title-row">
              <h1 class="detail-title">{{ document()!.title }}</h1>
              <div class="detail-tags">
                <span class="status-badge" [attr.data-status]="document()!.status">
                  {{ getStatusLabel(document()!.status) }}
                </span>
                <span class="priority-badge" [attr.data-priority]="document()!.priority">
                  {{ getPriorityLabel(document()!.priority) }}
                </span>
                <span class="conf-badge">
                  <span nz-icon nzType="lock" nzTheme="outline" class="text-[10px]"></span>
                  {{ getConfidentialityLabel(document()!.confidentiality) }}
                </span>
              </div>
            </div>
            <div class="detail-subtitle">
              <span class="doc-number">{{ document()!.document_number || 'Belum ada nomor' }}</span>
              <span class="dot-sep"></span>
              <span>{{ document()!.document_type?.name }}</span>
              <span class="dot-sep"></span>
              <span>v{{ document()!.major_version }}.{{ document()!.minor_version }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <button nz-button nzSize="small" (click)="downloadDocument()" nz-tooltip nzTooltipTitle="Download dokumen">
              <span nz-icon nzType="download"></span> Download
            </button>
            <button nz-button nzSize="small" [routerLink]="['/documents', document()!.id, 'edit']">
              <span nz-icon nzType="edit"></span> Edit
            </button>
            @if (document()!.status === 'draft') {
              <button nz-button nzType="primary" nzSize="small" (click)="submitForReview()">
                <span nz-icon nzType="send"></span> Submit Review
              </button>
            }
            @if (document()!.status === 'in_review') {
              <button nz-button nzSize="small" class="btn-approve" (click)="approveDocument()">
                <span nz-icon nzType="check-circle"></span> Setujui
              </button>
              <button nz-button nzDanger nzSize="small" (click)="openRejectModal()">
                <span nz-icon nzType="close-circle"></span> Tolak
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="detail-content">
        <!-- Main Column -->
        <div class="detail-main">
          <!-- Info Card -->
          <div class="info-card">
            <div class="info-card-header">
              <span nz-icon nzType="file-text" nzTheme="outline"></span>
              <span>Informasi Dokumen</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Tipe</span>
                <span class="info-value">{{ document()!.document_type?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Kategori</span>
                <span class="info-value">{{ document()!.category?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pembuat</span>
                <span class="info-value">{{ document()!.creator?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Versi</span>
                <span class="info-value">v{{ document()!.major_version }}.{{ document()!.minor_version }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Department</span>
                <span class="info-value">{{ document()!.department?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Section</span>
                <span class="info-value">{{ document()!.section?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Perusahaan</span>
                <span class="info-value">{{ document()!.company?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Kantor</span>
                <span class="info-value">{{ document()!.office?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Template</span>
                <span class="info-value">{{ document()!.template?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Revisi</span>
                <span class="info-value">{{ document()!.revision_count }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Dibuat</span>
                <span class="info-value">{{ document()!.created_at | date:'dd MMM yyyy HH:mm' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Diperbarui</span>
                <span class="info-value">{{ document()!.updated_at | date:'dd MMM yyyy HH:mm' }}</span>
              </div>
              @if (document()!.submitted_at) {
                <div class="info-item">
                  <span class="info-label">Disubmit</span>
                  <span class="info-value">{{ document()!.submitted_at | date:'dd MMM yyyy HH:mm' }}</span>
                </div>
              }
              @if (document()!.approved_at) {
                <div class="info-item">
                  <span class="info-label">Disetujui</span>
                  <span class="info-value">{{ document()!.approved_at | date:'dd MMM yyyy HH:mm' }}</span>
                </div>
              }
            </div>
            @if (document()!.description) {
              <div class="info-description">
                <span class="info-label">Deskripsi</span>
                <p class="info-desc-text">{{ document()!.description }}</p>
              </div>
            }
          </div>

          <!-- Tabs Card -->
          <div class="tabs-card">
            <nz-tabset nzSize="small" [(nzSelectedIndex)]="activeTab" (nzSelectedIndexChange)="onTabChange($event)">
              <!-- Versions Tab -->
              <nz-tab nzTitle="Versi">
                @if (versionsLoading()) {
                  <div class="text-center py-6"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                } @else {
                  <nz-table #versionTable [nzData]="versions()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
                    <thead>
                      <tr>
                        <th>Versi</th>
                        <th>File</th>
                        <th>Ukuran</th>
                        <th>Catatan</th>
                        <th>Pembuat</th>
                        <th>Tanggal</th>
                        <th nzWidth="50px"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (v of versionTable.data; track v.id) {
                        <tr>
                          <td>
                            <span class="font-medium">v{{ v.major_version }}.{{ v.minor_version }}</span>
                            @if (v.is_current) {
                              <nz-tag nzColor="blue" class="ml-1">Aktif</nz-tag>
                            }
                          </td>
                          <td class="text-xs text-zinc-600">{{ v.file_name || '-' }}</td>
                          <td class="text-xs text-zinc-500">{{ formatFileSize(v.file_size) }}</td>
                          <td class="text-xs text-zinc-600">{{ v.change_summary || 'Tidak ada catatan' }}</td>
                          <td class="text-xs">{{ v.creator?.name || '-' }}</td>
                          <td class="text-xs text-zinc-500">{{ v.created_at | date:'dd/MM/yy HH:mm' }}</td>
                          <td>
                            <button nz-button nzSize="small" nzType="link" nz-tooltip nzTooltipTitle="Download" (click)="downloadVersion(v.version_number)">
                              <span nz-icon nzType="download"></span>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="7"><nz-empty nzNotFoundContent="Belum ada riwayat versi"></nz-empty></td></tr>
                      }
                    </tbody>
                  </nz-table>
                }
              </nz-tab>

              <!-- Comments Tab -->
              <nz-tab nzTitle="Komentar">
                @if (commentsLoading()) {
                  <div class="text-center py-6"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                } @else {
                  <div class="comment-list">
                    @for (c of comments(); track c.id) {
                      <div class="comment-item" [class.resolved]="c.is_resolved">
                        <div class="comment-header">
                          <div class="comment-author">
                            <nz-avatar nzIcon="user" [nzSize]="28" class="comment-avatar"></nz-avatar>
                            <div>
                              <span class="comment-name">{{ c.user?.name || 'Anonim' }}</span>
                              <span class="comment-time">{{ formatDate(c.created_at) }}</span>
                            </div>
                            @if (c.is_resolved) {
                              <span class="resolved-badge">
                                <span nz-icon nzType="check-circle" nzTheme="fill"></span> Terselesaikan
                              </span>
                            }
                          </div>
                          <div class="comment-actions">
                            @if (c.is_resolved) {
                              <button nz-button nzSize="small" nzType="text" nz-tooltip nzTooltipTitle="Buka kembali" (click)="unresolveComment(c.id)">
                                <span nz-icon nzType="undo"></span>
                              </button>
                            } @else {
                              <button nz-button nzSize="small" nzType="text" nz-tooltip nzTooltipTitle="Selesaikan" (click)="resolveComment(c.id)">
                                <span nz-icon nzType="check"></span>
                              </button>
                            }
                            <button nz-button nzSize="small" nzType="text" nzDanger nz-tooltip nzTooltipTitle="Hapus" (click)="deleteComment(c.id)">
                              <span nz-icon nzType="delete"></span>
                            </button>
                          </div>
                        </div>
                        <p class="comment-content">{{ c.content }}</p>

                        @if (c.replies && c.replies.length > 0) {
                          <div class="reply-list">
                            @for (r of c.replies; track r.id) {
                              <div class="reply-item">
                                <span class="reply-name">{{ r.user?.name || 'Anonim' }}</span>
                                <span class="reply-time">{{ formatDate(r.created_at) }}</span>
                                <p class="reply-content">{{ r.content }}</p>
                              </div>
                            }
                          </div>
                        }

                        @if (replyingTo() === c.id) {
                          <div class="reply-input">
                            <textarea nz-input [(ngModel)]="replyContent" placeholder="Tulis balasan..." [nzAutosize]="{ minRows: 1, maxRows: 3 }"></textarea>
                            <div class="reply-input-actions">
                              <button nz-button nzSize="small" nzType="primary" [disabled]="!replyContent.trim()" (click)="addReply(c.id)">Balas</button>
                              <button nz-button nzSize="small" (click)="replyingTo.set(null)">Batal</button>
                            </div>
                          </div>
                        } @else {
                          <button class="reply-trigger" (click)="replyingTo.set(c.id)">
                            <span nz-icon nzType="message" nzTheme="outline"></span> Balas
                          </button>
                        }
                      </div>
                    } @empty {
                      <nz-empty nzNotFoundContent="Belum ada komentar"></nz-empty>
                    }

                    <!-- Add comment -->
                    <div class="new-comment">
                      <nz-avatar nzIcon="user" [nzSize]="28" class="comment-avatar"></nz-avatar>
                      <div class="new-comment-input">
                        <textarea nz-input [(ngModel)]="newComment" placeholder="Tulis komentar..."
                                  [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
                        <button nz-button nzType="primary" nzSize="small" class="mt-2"
                                [disabled]="!newComment.trim()" (click)="addComment()">
                          <span nz-icon nzType="send"></span> Kirim
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </nz-tab>

              <!-- Workflow Tab -->
              <nz-tab nzTitle="Workflow">
                @if (workflowLoading()) {
                  <div class="text-center py-6"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                } @else if (workflow()) {
                  <div class="workflow-steps">
                    @for (step of workflow()!.steps; track step.id) {
                      <div class="wf-step" [attr.data-status]="step.status">
                        <div class="wf-step-indicator">
                          <div class="wf-dot"></div>
                          <div class="wf-line"></div>
                        </div>
                        <div class="wf-step-content">
                          <div class="wf-step-header">
                            <span class="wf-step-name">{{ step.name }}</span>
                            @if (step.completed_at) {
                              <span class="wf-step-time">{{ step.completed_at | date:'dd/MM/yy HH:mm' }}</span>
                            }
                          </div>
                          <div class="wf-step-actor">{{ step.actor?.name || 'Belum ditentukan' }}</div>
                          @if (step.action_type) {
                            <span class="wf-action-badge" [attr.data-action]="step.action_type">
                              {{ getActionLabel(step.action_type) }}
                            </span>
                          }
                          @if (step.comment) {
                            <div class="wf-step-comment">"{{ step.comment }}"</div>
                          }
                        </div>
                      </div>
                    } @empty {
                      <nz-empty nzNotFoundContent="Belum ada langkah workflow"></nz-empty>
                    }
                  </div>
                } @else {
                  <nz-empty nzNotFoundContent="Workflow belum dimulai"></nz-empty>
                }
              </nz-tab>

              <!-- Distribution Tab -->
              <nz-tab nzTitle="Distribusi">
                @if (distributionsLoading()) {
                  <div class="text-center py-6"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                } @else {
                  <nz-table #distTable [nzData]="distributions()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
                    <thead>
                      <tr>
                        <th>Penerima</th>
                        <th>Department</th>
                        <th>Didistribusikan</th>
                        <th>Diterima</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (d of distTable.data; track d.id) {
                        <tr>
                          <td class="text-xs">{{ d.user?.name || '-' }}</td>
                          <td class="text-xs">{{ d.department?.name || '-' }}</td>
                          <td class="text-xs text-zinc-500">{{ d.distributed_at | date:'dd/MM/yy HH:mm' }}</td>
                          <td class="text-xs text-zinc-500">{{ d.received_at ? (d.received_at | date:'dd/MM/yy HH:mm') : '-' }}</td>
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
              </nz-tab>

              <!-- Lampiran Tab -->
              <nz-tab nzTitle="Lampiran">
                <div class="py-3">
                  <div class="mb-3">
                    <nz-upload
                      nzType="drag"
                      [nzAction]="getAttachmentUploadUrl()"
                      [nzHeaders]="getAuthHeaders()"
                      nzName="file"
                      [nzMultiple]="true"
                      [nzShowUploadList]="false"
                      (nzChange)="onAttachmentUpload($event)"
                      [nzAccept]="'.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.gif,.zip,.rar,.csv,.txt'"
                    >
                      <p class="ant-upload-drag-icon">
                        <span nz-icon nzType="cloud-upload" style="font-size: 28px; color: #0284c7;"></span>
                      </p>
                      <p class="text-xs text-zinc-600">Klik atau seret file ke area ini</p>
                      <p class="text-[11px] text-zinc-400">PDF, Word, Excel, Gambar, ZIP (maks 50MB)</p>
                    </nz-upload>
                  </div>
                  @if (attachments().length > 0) {
                    <nz-table #attachTable [nzData]="attachments()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
                      <thead>
                        <tr>
                          <th>File</th>
                          <th nzWidth="90px">Ukuran</th>
                          <th nzWidth="110px">Diupload oleh</th>
                          <th nzWidth="120px">Tanggal</th>
                          <th nzWidth="70px">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (att of attachTable.data; track att.id) {
                          <tr>
                            <td>
                              <div class="flex items-center gap-2">
                                <span nz-icon [nzType]="getFileIcon(att.mime_type)" class="text-base text-sky-600"></span>
                                <span class="text-xs">{{ att.original_name }}</span>
                              </div>
                            </td>
                            <td class="text-xs text-zinc-500">{{ formatFileSize(att.file_size) }}</td>
                            <td class="text-xs">{{ att.uploader?.name || '-' }}</td>
                            <td class="text-xs text-zinc-500">{{ att.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td>
                              <button nz-button nzType="link" nzSize="small" (click)="downloadAttachment(att)" nz-tooltip nzTooltipTitle="Download">
                                <span nz-icon nzType="download"></span>
                              </button>
                              <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteAttachment(att)" nz-tooltip nzTooltipTitle="Hapus">
                                <span nz-icon nzType="delete"></span>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </nz-table>
                  } @else {
                    <nz-empty nzNotFoundContent="Belum ada lampiran"></nz-empty>
                  }
                </div>
              </nz-tab>

              <!-- Relasi Tab -->
              <nz-tab nzTitle="Relasi">
                <div class="py-3">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-xs text-gray-500">Dokumen yang terkait</span>
                    <button nz-button nzType="primary" nzSize="small" (click)="openRelationDrawer()">
                      <span nz-icon nzType="plus"></span> Tambah Relasi
                    </button>
                  </div>

                  @if (outboundRelations().length > 0) {
                    <div class="text-xs font-semibold text-gray-600 mb-1">Relasi Keluar</div>
                    <nz-table #outRelTable [nzData]="outboundRelations()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false" class="mb-3">
                      <thead>
                        <tr>
                          <th>Tipe</th>
                          <th>Dokumen Terkait</th>
                          <th nzWidth="120px">Catatan</th>
                          <th nzWidth="100px">Tanggal</th>
                          <th nzWidth="50px">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (rel of outRelTable.data; track rel.id) {
                          <tr>
                            <td><nz-tag [nzColor]="getRelationTypeColor(rel.relation_type)">{{ getRelationTypeLabel(rel.relation_type) }}</nz-tag></td>
                            <td>
                              <a class="text-xs text-blue-600 cursor-pointer" [routerLink]="['/documents', rel.related_document?.id]">
                                {{ rel.related_document?.document_number || '-' }} — {{ rel.related_document?.title || '-' }}
                              </a>
                            </td>
                            <td class="text-xs text-gray-500">{{ rel.notes || '-' }}</td>
                            <td class="text-xs text-gray-400">{{ rel.created_at | date:'dd/MM/yyyy' }}</td>
                            <td>
                              <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteRelation(rel.id)" nz-tooltip nzTooltipTitle="Hapus">
                                <span nz-icon nzType="delete"></span>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </nz-table>
                  }

                  @if (inboundRelations().length > 0) {
                    <div class="text-xs font-semibold text-gray-600 mb-1">Dirujuk Oleh</div>
                    <nz-table #inRelTable [nzData]="inboundRelations()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
                      <thead>
                        <tr>
                          <th>Tipe</th>
                          <th>Dari Dokumen</th>
                          <th nzWidth="120px">Catatan</th>
                          <th nzWidth="100px">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (rel of inRelTable.data; track rel.id) {
                          <tr>
                            <td><nz-tag [nzColor]="getRelationTypeColor(rel.relation_type)">{{ getRelationTypeLabel(rel.relation_type) }}</nz-tag></td>
                            <td>
                              <a class="text-xs text-blue-600 cursor-pointer" [routerLink]="['/documents', rel.document?.id]">
                                {{ rel.document?.document_number || '-' }} — {{ rel.document?.title || '-' }}
                              </a>
                            </td>
                            <td class="text-xs text-gray-500">{{ rel.notes || '-' }}</td>
                            <td class="text-xs text-gray-400">{{ rel.created_at | date:'dd/MM/yyyy' }}</td>
                          </tr>
                        }
                      </tbody>
                    </nz-table>
                  }

                  @if (outboundRelations().length === 0 && inboundRelations().length === 0) {
                    <nz-empty nzNotFoundContent="Belum ada relasi dokumen"></nz-empty>
                  }
                </div>
              </nz-tab>
            </nz-tabset>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="detail-sidebar">
          <!-- Workflow Status -->
          <div class="sidebar-card">
            <div class="sidebar-card-header">
              <span nz-icon nzType="node-index" nzTheme="outline"></span>
              <span>Status Workflow</span>
            </div>
            @if (workflow()) {
              <div class="sidebar-wf-steps">
                @for (step of workflow()!.steps; track step.id) {
                  <div class="sidebar-wf-step" [attr.data-status]="step.status">
                    <div class="sidebar-wf-dot"></div>
                    <div class="sidebar-wf-info">
                      <span class="sidebar-wf-name">{{ step.name }}</span>
                      <span class="sidebar-wf-actor">{{ step.actor?.name || '-' }}</span>
                      @if (step.completed_at) {
                        <span class="sidebar-wf-time">{{ step.completed_at | date:'dd/MM/yy HH:mm' }}</span>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-zinc-400 text-xs py-3">Workflow belum dimulai</div>
            }
          </div>

          <!-- Quick Actions -->
          <div class="sidebar-card">
            <div class="sidebar-card-header">
              <span nz-icon nzType="thunderbolt" nzTheme="outline"></span>
              <span>Aksi</span>
            </div>
            <div class="sidebar-actions">
              <button class="sidebar-action-btn" (click)="downloadDocument()">
                <span nz-icon nzType="download" nzTheme="outline"></span>
                <span>Download</span>
              </button>
              <button class="sidebar-action-btn">
                <span nz-icon nzType="printer" nzTheme="outline"></span>
                <span>Print</span>
              </button>
              <button class="sidebar-action-btn">
                <span nz-icon nzType="share-alt" nzTheme="outline"></span>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-16 text-zinc-400">
        Dokumen tidak ditemukan
      </div>
    }

    <!-- Add Relation Drawer -->
    <nz-drawer
      [nzVisible]="relationDrawerVisible"
      nzTitle="Tambah Relasi Dokumen"
      nzPlacement="right"
      [nzWidth]="420"
      (nzOnClose)="relationDrawerVisible = false">
      <div *nzDrawerContent>
        <div class="mb-3">
          <label class="text-xs font-medium text-gray-600 block mb-1">Tipe Relasi *</label>
          <nz-select nzSize="small" [(ngModel)]="newRelation.relation_type" class="w-full" nzPlaceHolder="Pilih tipe relasi">
            <nz-option nzValue="references" nzLabel="Mereferensi"></nz-option>
            <nz-option nzValue="supersedes" nzLabel="Menggantikan"></nz-option>
            <nz-option nzValue="related_to" nzLabel="Terkait Dengan"></nz-option>
            <nz-option nzValue="parent_child" nzLabel="Induk-Anak"></nz-option>
          </nz-select>
        </div>
        <div class="mb-3">
          <label class="text-xs font-medium text-gray-600 block mb-1">Dokumen Tujuan *</label>
          <nz-select nzSize="small" [(ngModel)]="newRelation.related_document_id" class="w-full"
                     nzPlaceHolder="Cari dokumen..." nzShowSearch nzServerSearch
                     (nzOnSearch)="searchDocuments($event)">
            @for (doc of searchResults(); track doc.id) {
              <nz-option [nzValue]="doc.id" [nzLabel]="doc.document_number + ' — ' + doc.title"></nz-option>
            }
          </nz-select>
        </div>
        <div class="mb-4">
          <label class="text-xs font-medium text-gray-600 block mb-1">Catatan</label>
          <textarea nz-input [(ngModel)]="newRelation.notes" nzSize="small" [nzAutosize]="{ minRows: 2, maxRows: 4 }" placeholder="Catatan relasi (opsional)"></textarea>
        </div>
        <button nz-button nzType="primary" nzSize="small" [nzLoading]="savingRelation()" (click)="saveRelation()" class="w-full">
          <span nz-icon nzType="plus"></span> Simpan Relasi
        </button>
      </div>
    </nz-drawer>
  `,
  styles: [`
    :host { display: block; }

    /* ── Page Header ── */
    .detail-header {
      margin-bottom: 16px;
    }
    .detail-header-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .back-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      color: #71717a;
      background: #fff;
      border: 1px solid #e4e4e7;
      transition: all .15s;
      flex-shrink: 0;
      margin-top: 2px;
      &:hover { color: #0284c7; border-color: #0284c7; background: #f0f9ff; }
    }
    .detail-header-info { flex: 1; min-width: 0; }
    .detail-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .detail-title {
      font-size: 16px;
      font-weight: 600;
      color: #18181b;
      margin: 0;
      line-height: 1.4;
    }
    .detail-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .detail-subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 12px;
      color: #71717a;
    }
    .doc-number {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 11px;
      color: #52525b;
      background: #f4f4f5;
      border-radius: 3px;
      padding: 1px 6px;
    }
    .dot-sep {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #a1a1aa;
      flex-shrink: 0;
    }
    .detail-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .btn-approve {
      background: #16a34a !important;
      border-color: #16a34a !important;
      color: #fff !important;
      &:hover { background: #15803d !important; border-color: #15803d !important; }
    }

    /* ── Status / Priority / Conf Badges ── */
    .status-badge, .priority-badge, .conf-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      line-height: 1.4;
    }
    .status-badge {
      &[data-status="draft"]      { background: #f4f4f5; color: #52525b; }
      &[data-status="in_review"]  { background: #dbeafe; color: #1d4ed8; }
      &[data-status="revision"]   { background: #fef3c7; color: #92400e; }
      &[data-status="approved"]   { background: #dcfce7; color: #166534; }
      &[data-status="final"]      { background: #e0f2fe; color: #0369a1; }
      &[data-status="obsolete"]   { background: #fecaca; color: #991b1b; }
      &[data-status="archived"]   { background: #e4e4e7; color: #3f3f46; }
    }
    .priority-badge {
      &[data-priority="low"]      { background: #f4f4f5; color: #71717a; }
      &[data-priority="normal"]   { background: #f4f4f5; color: #71717a; }
      &[data-priority="medium"]   { background: #dbeafe; color: #1d4ed8; }
      &[data-priority="high"]     { background: #fed7aa; color: #9a3412; }
      &[data-priority="urgent"]   { background: #fecaca; color: #991b1b; }
      &[data-priority="critical"] { background: #fecaca; color: #991b1b; }
    }
    .conf-badge {
      background: #f4f4f5;
      color: #52525b;
    }

    /* ── Content Grid ── */
    .detail-content {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 16px;
      align-items: start;
    }
    .detail-main { min-width: 0; }

    /* ── Info Card ── */
    .info-card {
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .info-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-bottom: 1px solid #f4f4f5;
      font-size: 12px;
      font-weight: 600;
      color: #27272a;
      span[nz-icon] { font-size: 13px; color: #0284c7; }
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 6px 14px 4px;
      gap: 0;
    }
    .info-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      padding: 3px 0;
    }
    .info-label {
      font-size: 11px;
      font-weight: 500;
      color: #a1a1aa;
      white-space: nowrap;
      min-width: 70px;
      &::after { content: ':'; }
    }
    .info-value {
      font-size: 12px;
      color: #27272a;
    }
    .info-description {
      padding: 6px 14px 8px;
      border-top: 1px solid #f4f4f5;
    }
    .info-desc-text {
      font-size: 12px;
      color: #3f3f46;
      margin: 2px 0 0;
      line-height: 1.5;
    }

    /* ── Tabs Card ── */
    .tabs-card {
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 0 14px 14px;
    }
    :host ::ng-deep .tabs-card {
      .ant-tabs-tab { font-size: 12px; padding: 10px 4px; }
      .ant-tabs-nav { margin-bottom: 12px; }
    }

    /* ── Comment Styles ── */
    .comment-list { display: flex; flex-direction: column; gap: 10px; }
    .comment-item {
      border: 1px solid #f4f4f5;
      border-radius: 6px;
      padding: 10px 12px;
      transition: border-color .15s;
      &:hover { border-color: #e4e4e7; }
      &.resolved { opacity: 0.55; background: #fafafa; }
    }
    .comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .comment-author { display: flex; align-items: center; gap: 8px; }
    .comment-avatar { flex-shrink: 0; }
    .comment-name { font-size: 12px; font-weight: 600; color: #27272a; }
    .comment-time { font-size: 11px; color: #a1a1aa; }
    .resolved-badge {
      font-size: 10px;
      color: #16a34a;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .comment-actions { display: flex; gap: 2px; }
    .comment-content { font-size: 12px; color: #3f3f46; margin: 0 0 0 36px; line-height: 1.5; }
    .reply-list {
      margin: 8px 0 0 36px;
      padding-left: 12px;
      border-left: 2px solid #e4e4e7;
    }
    .reply-item { margin-bottom: 8px; }
    .reply-name { font-size: 11px; font-weight: 600; color: #3f3f46; }
    .reply-time { font-size: 10px; color: #a1a1aa; margin-left: 6px; }
    .reply-content { font-size: 12px; color: #52525b; margin: 2px 0 0; }
    .reply-input { margin: 8px 0 0 36px; }
    .reply-input-actions { display: flex; gap: 6px; margin-top: 6px; }
    .reply-trigger {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 11px;
      color: #71717a;
      margin: 6px 0 0 36px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      &:hover { color: #0284c7; }
    }
    .new-comment {
      display: flex;
      gap: 10px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f4f4f5;
    }
    .new-comment-input { flex: 1; }

    /* ── Custom Workflow Steps (in tab) ── */
    .workflow-steps { padding: 4px 0; }
    .wf-step {
      display: flex;
      gap: 12px;
      position: relative;
      &:last-child .wf-line { display: none; }
    }
    .wf-step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 20px;
    }
    .wf-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #d4d4d8;
      border: 2px solid #e4e4e7;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .wf-line {
      width: 2px;
      flex: 1;
      background: #e4e4e7;
      margin: 2px 0;
    }
    .wf-step[data-status="completed"] .wf-dot  { background: #16a34a; border-color: #bbf7d0; }
    .wf-step[data-status="in_progress"] .wf-dot { background: #0284c7; border-color: #bae6fd; box-shadow: 0 0 0 3px rgba(2,132,199,.15); }
    .wf-step[data-status="rejected"] .wf-dot   { background: #dc2626; border-color: #fecaca; }
    .wf-step-content { padding-bottom: 16px; flex: 1; min-width: 0; }
    .wf-step-header { display: flex; justify-content: space-between; align-items: center; }
    .wf-step-name { font-size: 12px; font-weight: 600; color: #27272a; }
    .wf-step-time { font-size: 11px; color: #a1a1aa; }
    .wf-step-actor { font-size: 11px; color: #71717a; margin-top: 2px; }
    .wf-action-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 3px;
      margin-top: 4px;
      &[data-action="approve"] { background: #dcfce7; color: #166534; }
      &[data-action="reject"]  { background: #fecaca; color: #991b1b; }
      &[data-action="submit"]  { background: #dbeafe; color: #1d4ed8; }
      &[data-action="review"]  { background: #e0f2fe; color: #0369a1; }
    }
    .wf-step-comment {
      font-size: 11px;
      color: #71717a;
      font-style: italic;
      margin-top: 4px;
    }

    /* ── Sidebar ── */
    .detail-sidebar { position: sticky; top: 12px; }
    .sidebar-card {
      background: #fff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .sidebar-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      border-bottom: 1px solid #f4f4f5;
      font-size: 13px;
      font-weight: 600;
      color: #27272a;
      span[nz-icon] { font-size: 14px; color: #0284c7; }
    }

    /* Sidebar Workflow */
    .sidebar-wf-steps { padding: 10px 14px; }
    .sidebar-wf-step {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 0;
      position: relative;
      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 20px;
        bottom: -6px;
        width: 2px;
        background: #e4e4e7;
      }
    }
    .sidebar-wf-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #d4d4d8;
      border: 2px solid #e4e4e7;
      flex-shrink: 0;
      margin-top: 2px;
      position: relative;
      z-index: 1;
    }
    .sidebar-wf-step[data-status="completed"] .sidebar-wf-dot { background: #16a34a; border-color: #bbf7d0; }
    .sidebar-wf-step[data-status="in_progress"] .sidebar-wf-dot { background: #0284c7; border-color: #bae6fd; }
    .sidebar-wf-step[data-status="rejected"] .sidebar-wf-dot { background: #dc2626; border-color: #fecaca; }
    .sidebar-wf-info { display: flex; flex-direction: column; }
    .sidebar-wf-name { font-size: 12px; font-weight: 500; color: #27272a; line-height: 1.3; }
    .sidebar-wf-actor { font-size: 11px; color: #71717a; }
    .sidebar-wf-time { font-size: 10px; color: #a1a1aa; }

    /* Sidebar Actions */
    .sidebar-actions { padding: 6px 8px; }
    .sidebar-action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 10px;
      border: none;
      background: none;
      border-radius: 4px;
      font-size: 12px;
      color: #3f3f46;
      cursor: pointer;
      transition: all .15s;
      span[nz-icon] { font-size: 14px; color: #71717a; }
      &:hover {
        background: #f4f4f5;
        color: #0284c7;
        span[nz-icon] { color: #0284c7; }
      }
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .detail-content { grid-template-columns: 1fr; }
      .detail-sidebar { position: static; }
    }
  `]
})
export class DocumentDetailPage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  document = signal<DocumentDetail | null>(null);
  versions = signal<DocumentVersion[]>([]);
  comments = signal<Comment[]>([]);
  workflow = signal<WorkflowStatus | null>(null);
  distributions = signal<Distribution[]>([]);
  attachments = signal<Attachment[]>([]);
  outboundRelations = signal<DocumentRelation[]>([]);
  inboundRelations = signal<DocumentRelation[]>([]);
  searchResults = signal<{ id: string; title: string; document_number: string }[]>([]);

  loading = signal(true);
  versionsLoading = signal(false);
  commentsLoading = signal(false);
  workflowLoading = signal(false);
  distributionsLoading = signal(false);
  uploadingAttachment = signal(false);
  savingRelation = signal(false);

  relationDrawerVisible = false;
  newRelation = { related_document_id: '', relation_type: '', notes: '' };

  newComment = '';
  replyContent = '';
  replyingTo = signal<string | null>(null);
  activeTab = 0;

  private documentId = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.documentId = id;
      this.loadDocument(id);
      this.loadVersions(id);
      this.loadComments(id);
      this.loadWorkflow(id);
    }
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        this.document.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.document.set(null);
        this.loading.set(false);
      }
    });
  }

  loadVersions(id: string) {
    this.versionsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/versions`).subscribe({
      next: (res) => { this.versions.set(res.data || []); this.versionsLoading.set(false); },
      error: () => { this.versions.set([]); this.versionsLoading.set(false); }
    });
  }

  loadComments(id: string) {
    this.commentsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/comments`).subscribe({
      next: (res) => { this.comments.set(res.data || []); this.commentsLoading.set(false); },
      error: () => { this.comments.set([]); this.commentsLoading.set(false); }
    });
  }

  loadWorkflow(id: string) {
    this.workflowLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/workflow`).subscribe({
      next: (res) => { this.workflow.set(res.data || null); this.workflowLoading.set(false); },
      error: () => { this.workflow.set(null); this.workflowLoading.set(false); }
    });
  }

  loadDistributions(id: string) {
    this.distributionsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/distributions`).subscribe({
      next: (res) => { this.distributions.set(res.data || []); this.distributionsLoading.set(false); },
      error: () => { this.distributions.set([]); this.distributionsLoading.set(false); }
    });
  }

  onTabChange(index: number) {
    // Lazy-load distributions on first visit
    if (index === 3 && this.distributions().length === 0 && !this.distributionsLoading()) {
      this.loadDistributions(this.documentId);
    }
    // Lazy-load attachments on first visit
    if (index === 4 && this.attachments().length === 0) {
      this.loadAttachments();
    }
    // Lazy-load relations on first visit
    if (index === 5 && this.outboundRelations().length === 0 && this.inboundRelations().length === 0) {
      this.loadRelations();
    }
  }

  loadAttachments() {
    this.http.get<any>(`${environment.apiUrl}/documents/${this.documentId}/attachments`).subscribe({
      next: (res) => this.attachments.set(res.data || []),
      error: () => {}
    });
  }

  getAttachmentUploadUrl(): string {
    return `${environment.apiUrl}/documents/${this.documentId}/attachments`;
  }

  getAuthHeaders(): any {
    const authData = localStorage.getItem('dms_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return { Authorization: `Bearer ${parsed.token}` };
    }
    return {};
  }

  onAttachmentUpload(info: any) {
    const { file } = info;
    if (file.status === 'done') {
      this.message.success(`${file.name} berhasil diupload`);
      this.loadAttachments();
    } else if (file.status === 'error') {
      this.message.error(`${file.name} gagal diupload`);
    }
  }

  downloadAttachment(att: Attachment) {
    this.http.get(`${environment.apiUrl}/documents/${this.documentId}/attachments/${att.id}/download`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.original_name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.message.error('Gagal mengunduh file')
    });
  }

  deleteAttachment(att: Attachment) {
    this.modal.confirm({
      nzTitle: 'Hapus Lampiran?',
      nzContent: `Yakin ingin menghapus "${att.original_name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/documents/${this.documentId}/attachments/${att.id}`).subscribe({
          next: () => {
            this.message.success('Lampiran berhasil dihapus');
            this.loadAttachments();
          },
          error: () => this.message.error('Gagal menghapus lampiran')
        });
      }
    });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'file-pdf';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-word';
    if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'file-excel';
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'file-ppt';
    if (mimeType?.includes('image')) return 'file-image';
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('compressed')) return 'file-zip';
    return 'file';
  }

  submitForReview() {
    const doc = this.document();
    if (!doc) return;

    this.modal.confirm({
      nzTitle: 'Submit untuk Review?',
      nzContent: 'Dokumen akan disubmit untuk proses review.',
      nzOkText: 'Submit',
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.post(`${environment.apiUrl}/documents/${doc.id}/submit`, {}).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil disubmit untuk review');
            this.loadDocument(doc.id);
            this.loadWorkflow(doc.id);
          },
          error: () => this.message.error('Gagal submit dokumen')
        });
      }
    });
  }

  approveDocument() {
    const doc = this.document();
    if (!doc) return;

    this.modal.confirm({
      nzTitle: 'Setujui Dokumen?',
      nzContent: 'Apakah Anda yakin ingin menyetujui dokumen ini?',
      nzOkText: 'Setujui',
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.post(`${environment.apiUrl}/documents/${doc.id}/approve`, {}).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil disetujui');
            this.loadDocument(doc.id);
            this.loadWorkflow(doc.id);
          },
          error: () => this.message.error('Gagal menyetujui dokumen')
        });
      }
    });
  }

  openRejectModal() {
    const doc = this.document();
    if (!doc) return;

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
          this.http.post(`${environment.apiUrl}/documents/${doc.id}/reject`, { comment: rejectComment }).subscribe({
            next: () => {
              this.message.success('Dokumen berhasil ditolak');
              this.loadDocument(doc.id);
              this.loadWorkflow(doc.id);
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

  addComment() {
    const doc = this.document();
    if (!doc || !this.newComment.trim()) return;

    this.http.post(`${environment.apiUrl}/documents/${doc.id}/comments`, {
      content: this.newComment
    }).subscribe({
      next: () => {
        this.message.success('Komentar berhasil ditambahkan');
        this.newComment = '';
        this.loadComments(doc.id);
      },
      error: () => this.message.error('Gagal menambahkan komentar')
    });
  }

  addReply(parentId: string) {
    const doc = this.document();
    if (!doc || !this.replyContent.trim()) return;

    this.http.post(`${environment.apiUrl}/documents/${doc.id}/comments`, {
      content: this.replyContent,
      parent_id: parentId
    }).subscribe({
      next: () => {
        this.message.success('Balasan berhasil ditambahkan');
        this.replyContent = '';
        this.replyingTo.set(null);
        this.loadComments(doc.id);
      },
      error: () => this.message.error('Gagal menambahkan balasan')
    });
  }

  resolveComment(commentId: string) {
    const doc = this.document();
    if (!doc) return;

    this.http.post(`${environment.apiUrl}/documents/${doc.id}/comments/${commentId}/resolve`, {}).subscribe({
      next: () => { this.message.success('Komentar diselesaikan'); this.loadComments(doc.id); },
      error: () => this.message.error('Gagal menyelesaikan komentar')
    });
  }

  unresolveComment(commentId: string) {
    const doc = this.document();
    if (!doc) return;

    this.http.post(`${environment.apiUrl}/documents/${doc.id}/comments/${commentId}/unresolve`, {}).subscribe({
      next: () => { this.message.success('Komentar dibuka kembali'); this.loadComments(doc.id); },
      error: () => this.message.error('Gagal membuka komentar')
    });
  }

  deleteComment(commentId: string) {
    const doc = this.document();
    if (!doc) return;

    this.modal.confirm({
      nzTitle: 'Hapus Komentar?',
      nzContent: 'Komentar yang dihapus tidak dapat dikembalikan.',
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/documents/${doc.id}/comments/${commentId}`).subscribe({
          next: () => { this.message.success('Komentar dihapus'); this.loadComments(doc.id); },
          error: () => this.message.error('Gagal menghapus komentar')
        });
      }
    });
  }

  downloadDocument() {
    const doc = this.document();
    if (!doc) return;
    window.open(`${environment.apiUrl}/documents/${doc.id}/download`, '_blank');
  }

  downloadVersion(versionNumber: number) {
    const doc = this.document();
    if (!doc) return;
    window.open(`${environment.apiUrl}/documents/${doc.id}/versions/${versionNumber}/download`, '_blank');
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default', in_review: 'processing', approved: 'success',
      final: 'blue', archived: 'default', revision: 'warning', obsolete: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', in_review: 'Dalam Review', revision: 'Revisi',
      approved: 'Disetujui', final: 'Final', obsolete: 'Usang', archived: 'Diarsipkan'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: 'default', medium: 'blue', high: 'orange', urgent: 'red'
    };
    return colors[priority] || 'default';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Rendah', medium: 'Sedang', high: 'Tinggi', urgent: 'Mendesak'
    };
    return labels[priority] || priority;
  }

  getConfidentialityLabel(level: string): string {
    const labels: Record<string, string> = {
      public: 'Publik', internal: 'Internal', confidential: 'Rahasia', secret: 'Sangat Rahasia'
    };
    return labels[level] || level;
  }

  getStepColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'gray', in_progress: 'blue', completed: 'green', rejected: 'red'
    };
    return colors[status] || 'gray';
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      approve: 'Disetujui', reject: 'Ditolak', submit: 'Disubmit', review: 'Direview'
    };
    return labels[action] || action;
  }

  getDistributionLabel(status: string): string {
    const labels: Record<string, string> = {
      sent: 'Terkirim', received: 'Diterima', pending: 'Menunggu'
    };
    return labels[status] || status;
  }

  // === Document Relations ===

  loadRelations(): void {
    this.http.get<any>(`${environment.apiUrl}/documents/${this.documentId}/relations`).subscribe({
      next: (res) => {
        this.outboundRelations.set(res.outbound || []);
        this.inboundRelations.set(res.inbound || []);
      },
      error: () => {}
    });
  }

  openRelationDrawer(): void {
    this.newRelation = { related_document_id: '', relation_type: '', notes: '' };
    this.searchResults.set([]);
    this.relationDrawerVisible = true;
  }

  searchDocuments(term: string): void {
    if (!term || term.length < 2) return;
    this.http.get<any>(`${environment.apiUrl}/documents`, {
      params: { search: term, per_page: '10' }
    }).subscribe({
      next: (res) => {
        const docs = (res.data || [])
          .filter((d: any) => d.id !== this.documentId)
          .map((d: any) => ({ id: d.id, title: d.title, document_number: d.document_number }));
        this.searchResults.set(docs);
      }
    });
  }

  saveRelation(): void {
    if (!this.newRelation.related_document_id || !this.newRelation.relation_type) {
      this.message.warning('Pilih tipe relasi dan dokumen tujuan');
      return;
    }
    this.savingRelation.set(true);
    this.http.post(`${environment.apiUrl}/documents/${this.documentId}/relations`, this.newRelation).subscribe({
      next: () => {
        this.message.success('Relasi berhasil ditambahkan');
        this.relationDrawerVisible = false;
        this.savingRelation.set(false);
        this.loadRelations();
      },
      error: () => {
        this.message.error('Gagal menambahkan relasi');
        this.savingRelation.set(false);
      }
    });
  }

  deleteRelation(relationId: string): void {
    this.modal.confirm({
      nzTitle: 'Hapus relasi ini?',
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/documents/${this.documentId}/relations/${relationId}`).subscribe({
          next: () => {
            this.message.success('Relasi berhasil dihapus');
            this.loadRelations();
          },
          error: () => this.message.error('Gagal menghapus relasi')
        });
      }
    });
  }

  getRelationTypeColor(type: string): string {
    const colors: Record<string, string> = {
      references: 'blue', supersedes: 'orange', related_to: 'green',
      attachment: 'purple', parent_child: 'cyan'
    };
    return colors[type] || 'default';
  }

  getRelationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      references: 'Mereferensi', supersedes: 'Menggantikan',
      related_to: 'Terkait', attachment: 'Lampiran', parent_child: 'Induk-Anak'
    };
    return labels[type] || type;
  }
}
