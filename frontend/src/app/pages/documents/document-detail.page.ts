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
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { FileManagerComponent, FileNode } from '../../shared';

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

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzTabsModule, NzTimelineModule,
    NzCommentModule, NzAvatarModule, NzInputModule, NzSpinModule,
    NzModalModule, NzBadgeModule, NzToolTipModule, NzTableModule, NzEmptyModule,
    NzUploadModule, NzListModule, FileManagerComponent
  ],
  template: `
    <div class="doc-detail-page">
      @if (loading()) {
        <div class="text-center py-12">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else if (document()) {
        <!-- Page Header -->
        <div class="doc-header">
          <div class="doc-header__left">
            <a routerLink="/documents" class="doc-header__back" nz-tooltip nzTooltipTitle="Kembali ke daftar">
              <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
            </a>
            <div class="doc-header__info">
              <div class="doc-header__title-row">
                <h1 class="doc-header__title">{{ document()!.title }}</h1>
                <div class="doc-header__tags">
                  <span class="doc-status-tag" [attr.data-status]="document()!.status">
                    <span class="doc-status-tag__dot"></span>
                    {{ getStatusLabel(document()!.status) }}
                  </span>
                  <span class="doc-meta-tag" [attr.data-priority]="document()!.priority">{{ getPriorityLabel(document()!.priority) }}</span>
                  <span class="doc-meta-tag">{{ getConfidentialityLabel(document()!.confidentiality) }}</span>
                </div>
              </div>
              <div class="doc-header__subtitle">
                <span class="doc-number">
                  <span nz-icon nzType="number" nzTheme="outline"></span>
                  {{ document()!.document_number || 'Belum ada nomor' }}
                </span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">{{ document()!.document_type?.name || '' }}</span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">v{{ document()!.major_version }}.{{ document()!.minor_version }}</span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">
                  <span nz-icon nzType="user" nzTheme="outline" style="font-size: 10px; margin-right: 2px;"></span>
                  {{ document()!.creator?.name || '-' }}
                </span>
                <span class="doc-header__sep">·</span>
                <span class="doc-header__meta">{{ document()!.department?.name || '-' }}</span>
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

        <!-- Content Body: Tabs + Collapsible Sidebar -->
        <div class="doc-body" [class.doc-body--collapsed]="sidebarCollapsed()">
          <!-- Main Area -->
          <div class="doc-main">
            <div class="doc-tabs-panel">
              <nz-tabset nzSize="small" [(nzSelectedIndex)]="activeTab" (nzSelectedIndexChange)="onTabChange($event)">

                <!-- Tab: Berkas -->
                <nz-tab nzTitle="Berkas">
                  <app-file-manager
                    [config]="{ documentId: documentId, readonly: false, showUpload: true, showCreateFolder: true, showVersions: true }"
                    [tree]="mockFileTree"
                    (fileDownload)="onFmDownload($event)"
                    (filePreview)="onFmPreview($event)"
                    (fileDelete)="onFmDelete($event)"
                    (folderCreate)="onFmCreateFolder($event)"
                    (fileUpload)="onFmUpload($event)"
                  ></app-file-manager>
                </nz-tab>

                <!-- Tab: Informasi -->
                <nz-tab nzTitle="Informasi">
                  <div class="doc-info-section">
                    <div class="doc-info-grid">
                      <div class="doc-info-item">
                        <span class="doc-info-label">Tipe Dokumen</span>
                        <span class="doc-info-value">{{ document()!.document_type?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Kategori</span>
                        <span class="doc-info-value">{{ document()!.category?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Kode Tipe</span>
                        <span class="doc-info-value doc-info-value--mono">{{ document()!.document_type?.code || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Pembuat</span>
                        <span class="doc-info-value">
                          <span nz-icon nzType="user" nzTheme="outline" class="doc-info-icon"></span>
                          {{ document()!.creator?.name || '-' }}
                        </span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Versi</span>
                        <span class="doc-info-value doc-info-value--mono">v{{ document()!.major_version }}.{{ document()!.minor_version }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Jumlah Revisi</span>
                        <span class="doc-info-value">{{ document()!.revision_count }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Department</span>
                        <span class="doc-info-value">{{ document()!.department?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Section</span>
                        <span class="doc-info-value">{{ document()!.section?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Perusahaan</span>
                        <span class="doc-info-value">{{ document()!.company?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Kantor</span>
                        <span class="doc-info-value">{{ document()!.office?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Template</span>
                        <span class="doc-info-value">{{ document()!.template?.name || '-' }}</span>
                      </div>
                      <div class="doc-info-item">
                        <span class="doc-info-label">Nomor Dokumen</span>
                        <span class="doc-info-value doc-info-value--mono">{{ document()!.document_number || 'Belum ada' }}</span>
                      </div>
                    </div>

                    <!-- Timestamps -->
                    <div class="doc-info-timestamps">
                      <div class="doc-info-ts">
                        <span nz-icon nzType="calendar" nzTheme="outline"></span>
                        <span class="doc-info-label">Dibuat</span>
                        <span class="doc-info-value">{{ document()!.created_at | date:'dd MMM yyyy, HH:mm' }}</span>
                      </div>
                      <div class="doc-info-ts">
                        <span nz-icon nzType="edit" nzTheme="outline"></span>
                        <span class="doc-info-label">Diperbarui</span>
                        <span class="doc-info-value">{{ document()!.updated_at | date:'dd MMM yyyy, HH:mm' }}</span>
                      </div>
                      @if (document()!.submitted_at) {
                        <div class="doc-info-ts">
                          <span nz-icon nzType="send" nzTheme="outline"></span>
                          <span class="doc-info-label">Disubmit</span>
                          <span class="doc-info-value">{{ document()!.submitted_at | date:'dd MMM yyyy, HH:mm' }}</span>
                        </div>
                      }
                      @if (document()!.approved_at) {
                        <div class="doc-info-ts">
                          <span nz-icon nzType="check-circle" nzTheme="outline"></span>
                          <span class="doc-info-label">Disetujui</span>
                          <span class="doc-info-value">{{ document()!.approved_at | date:'dd MMM yyyy, HH:mm' }}</span>
                        </div>
                      }
                    </div>

                    @if (document()!.description) {
                      <div class="doc-info-desc">
                        <span class="doc-info-label">Deskripsi</span>
                        <p class="doc-info-desc__text">{{ document()!.description }}</p>
                      </div>
                    }
                  </div>
                </nz-tab>

                <!-- Tab: Komentar -->
                <nz-tab nzTitle="Komentar">
                  @if (commentsLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                  } @else {
                    <div class="doc-comments">
                      @for (c of comments(); track c.id) {
                        <div class="doc-comment" [class.doc-comment--resolved]="c.is_resolved">
                          <div class="doc-comment__avatar">
                            <nz-avatar nzIcon="user" [nzSize]="28" [style.background-color]="c.is_resolved ? '#d4d4d8' : '#0284c7'" style="font-size: 12px"></nz-avatar>
                          </div>
                          <div class="doc-comment__body">
                            <div class="doc-comment__header">
                              <span class="doc-comment__author">{{ c.user?.name || 'Anonim' }}</span>
                              <span class="doc-comment__time">{{ formatDate(c.created_at) }}</span>
                              @if (c.is_resolved) {
                                <span class="doc-comment__resolved-badge">
                                  <span nz-icon nzType="check-circle" nzTheme="fill"></span> Terselesaikan
                                </span>
                              }
                              <span class="doc-comment__actions">
                                @if (c.is_resolved) {
                                  <button nz-button nzSize="small" nzType="text" nz-tooltip nzTooltipTitle="Buka kembali" (click)="unresolveComment(c.id)" class="doc-action-btn">
                                    <span nz-icon nzType="undo"></span>
                                  </button>
                                } @else {
                                  <button nz-button nzSize="small" nzType="text" nz-tooltip nzTooltipTitle="Selesaikan" (click)="resolveComment(c.id)" class="doc-action-btn">
                                    <span nz-icon nzType="check"></span>
                                  </button>
                                }
                                <button nz-button nzSize="small" nzType="text" nzDanger nz-tooltip nzTooltipTitle="Hapus" (click)="deleteComment(c.id)" class="doc-action-btn">
                                  <span nz-icon nzType="delete"></span>
                                </button>
                              </span>
                            </div>
                            <p class="doc-comment__content">{{ c.content }}</p>

                            @if (c.replies && c.replies.length > 0) {
                              <div class="doc-comment__replies">
                                @for (r of c.replies; track r.id) {
                                  <div class="doc-comment__reply">
                                    <span class="doc-comment__author">{{ r.user?.name || 'Anonim' }}</span>
                                    <span class="doc-comment__time">{{ formatDate(r.created_at) }}</span>
                                    <p class="doc-comment__content">{{ r.content }}</p>
                                  </div>
                                }
                              </div>
                            }

                            @if (replyingTo() === c.id) {
                              <div class="doc-comment__reply-input">
                                <textarea nz-input [(ngModel)]="replyContent" placeholder="Tulis balasan..." [nzAutosize]="{ minRows: 1, maxRows: 3 }"></textarea>
                                <div class="flex gap-1 mt-1">
                                  <button nz-button nzSize="small" nzType="primary" [disabled]="!replyContent.trim()" (click)="addReply(c.id)">Balas</button>
                                  <button nz-button nzSize="small" (click)="replyingTo.set(null)">Batal</button>
                                </div>
                              </div>
                            } @else {
                              <button nz-button nzSize="small" nzType="text" class="doc-comment__reply-btn" (click)="replyingTo.set(c.id)">
                                <span nz-icon nzType="message" nzTheme="outline"></span> Balas
                              </button>
                            }
                          </div>
                        </div>
                      } @empty {
                        <nz-empty nzNotFoundContent="Belum ada komentar"></nz-empty>
                      }

                      <div class="doc-comment-composer">
                        <nz-avatar nzIcon="user" [nzSize]="28" style="background-color: #0284c7; font-size: 12px"></nz-avatar>
                        <div class="doc-comment-composer__input">
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

                <!-- Tab: Workflow -->
                <nz-tab nzTitle="Workflow">
                  @if (workflowLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                  } @else if (workflow()) {
                    <div class="doc-workflow-steps">
                      @for (step of workflow()!.steps; track step.id; let i = $index; let last = $last) {
                        <div class="doc-wf-step" [attr.data-status]="step.status">
                          <div class="doc-wf-step__indicator">
                            <div class="doc-wf-step__dot">
                              @if (step.status === 'completed') {
                                <span nz-icon nzType="check" nzTheme="outline"></span>
                              } @else if (step.status === 'rejected') {
                                <span nz-icon nzType="close" nzTheme="outline"></span>
                              } @else if (step.status === 'in_progress') {
                                <span nz-icon nzType="loading" nzTheme="outline"></span>
                              } @else {
                                <span class="doc-wf-step__num">{{ i + 1 }}</span>
                              }
                            </div>
                            @if (!last) {
                              <div class="doc-wf-step__line"></div>
                            }
                          </div>
                          <div class="doc-wf-step__content">
                            <div class="doc-wf-step__name">{{ step.name }}</div>
                            <div class="doc-wf-step__actor">
                              <span nz-icon nzType="user" nzTheme="outline"></span>
                              {{ step.actor?.name || 'Belum ditentukan' }}
                            </div>
                            @if (step.action_type) {
                              <span class="doc-wf-action-tag" [attr.data-action]="step.action_type">
                                {{ getActionLabel(step.action_type) }}
                              </span>
                            }
                            @if (step.comment) {
                              <div class="doc-wf-step__comment">"{{ step.comment }}"</div>
                            }
                            @if (step.completed_at) {
                              <div class="doc-wf-step__time">{{ step.completed_at | date:'dd MMM yyyy, HH:mm' }}</div>
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

                <!-- Tab: Distribusi -->
                <nz-tab nzTitle="Distribusi">
                  @if (distributionsLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                  } @else {
                    <nz-table #distTable [nzData]="distributions()" nzSize="small" [nzShowPagination]="false" [nzFrontPagination]="false">
                      <thead>
                        <tr>
                          <th>Penerima</th>
                          <th>Department</th>
                          <th nzWidth="140px">Didistribusikan</th>
                          <th nzWidth="140px">Diterima</th>
                          <th nzWidth="100px">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (d of distTable.data; track d.id) {
                          <tr>
                            <td class="text-xs">{{ d.user?.name || '-' }}</td>
                            <td class="text-xs">{{ d.department?.name || '-' }}</td>
                            <td class="text-xs text-gray-500">{{ d.distributed_at | date:'dd/MM/yy HH:mm' }}</td>
                            <td class="text-xs text-gray-500">{{ d.received_at ? (d.received_at | date:'dd/MM/yy HH:mm') : '-' }}</td>
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
              </nz-tabset>
            </div>
          </div>

          <!-- Collapsible Side Panel -->
          <div class="doc-side" [class.doc-side--collapsed]="sidebarCollapsed()">
            <button class="doc-side__toggle" (click)="toggleSidebar()" nz-tooltip [nzTooltipTitle]="sidebarCollapsed() ? 'Tampilkan panel' : 'Sembunyikan panel'">
              <span nz-icon [nzType]="sidebarCollapsed() ? 'menu-unfold' : 'menu-fold'" nzTheme="outline"></span>
            </button>

            @if (!sidebarCollapsed()) {
              <!-- Quick Summary -->
              <div class="doc-side__section">
                <div class="doc-side__heading">Ringkasan</div>
                <div class="doc-side__summary">
                  <div class="doc-side__row">
                    <span class="doc-side__label">Status</span>
                    <span class="doc-status-tag doc-status-tag--sm" [attr.data-status]="document()!.status">
                      <span class="doc-status-tag__dot"></span>
                      {{ getStatusLabel(document()!.status) }}
                    </span>
                  </div>
                  <div class="doc-side__row">
                    <span class="doc-side__label">Versi</span>
                    <span class="doc-side__val doc-side__val--mono">v{{ document()!.major_version }}.{{ document()!.minor_version }}</span>
                  </div>
                  <div class="doc-side__row">
                    <span class="doc-side__label">Prioritas</span>
                    <span class="doc-meta-tag doc-meta-tag--sm" [attr.data-priority]="document()!.priority">{{ getPriorityLabel(document()!.priority) }}</span>
                  </div>
                  <div class="doc-side__row">
                    <span class="doc-side__label">Pembuat</span>
                    <span class="doc-side__val">{{ document()!.creator?.name || '-' }}</span>
                  </div>
                  <div class="doc-side__row">
                    <span class="doc-side__label">Diperbarui</span>
                    <span class="doc-side__val">{{ document()!.updated_at | date:'dd/MM/yy HH:mm' }}</span>
                  </div>
                </div>
              </div>

              <!-- Workflow Mini Steps -->
              <div class="doc-side__section">
                <div class="doc-side__heading">Workflow</div>
                @if (workflow()) {
                  <div class="doc-sidebar-steps">
                    @for (step of workflow()!.steps; track step.id; let last = $last) {
                      <div class="doc-sidebar-step" [attr.data-status]="step.status">
                        <div class="doc-sidebar-step__dot"></div>
                        @if (!last) {
                          <div class="doc-sidebar-step__connector"></div>
                        }
                        <div class="doc-sidebar-step__info">
                          <span class="doc-sidebar-step__name">{{ step.name }}</span>
                          <span class="doc-sidebar-step__meta">{{ step.actor?.name || '-' }}</span>
                          @if (step.completed_at) {
                            <span class="doc-sidebar-step__time">{{ step.completed_at | date:'dd/MM/yy HH:mm' }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-gray-400 text-xs text-center py-3">Workflow belum dimulai</div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="text-center py-12 text-gray-500">
          Dokumen tidak ditemukan
        </div>
      }
    </div>
  `,
  styles: [`
    /* ===== Page Layout ===== */
    .doc-detail-page { padding: 0; }

    /* ===== Page Header ===== */
    .doc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0 14px;
      border-bottom: 1px solid #e4e4e7;
    }
    .doc-header__left { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
    .doc-header__back {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border-radius: 6px;
      color: #71717a; transition: all .15s;
      flex-shrink: 0; margin-top: 2px;
    }
    .doc-header__back:hover { background: #f4f4f5; color: #18181b; }
    .doc-header__info { min-width: 0; }
    .doc-header__title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .doc-header__title {
      font-size: 16px; font-weight: 600; color: #18181b;
      margin: 0; line-height: 1.3;
    }
    .doc-header__tags { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
    .doc-header__subtitle {
      display: flex; align-items: center; gap: 6px;
      margin-top: 3px; font-size: 12px; color: #71717a; flex-wrap: wrap;
    }
    .doc-header__sep { color: #d4d4d8; }
    .doc-header__meta { font-weight: 500; }
    .doc-number {
      display: inline-flex; align-items: center; gap: 3px;
      font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11px;
      background: #f4f4f5; padding: 1px 6px; border-radius: 3px;
      color: #52525b;
    }
    .doc-header__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .doc-header__divider {
      width: 1px; height: 20px; background: #e4e4e7;
    }

    /* ===== Status & Meta Tags ===== */
    .doc-status-tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 500; line-height: 1.4;
      background: #f4f4f5; color: #52525b;
    }
    .doc-status-tag--sm { font-size: 10px; padding: 1px 6px; gap: 4px; }
    .doc-status-tag__dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #a1a1aa; flex-shrink: 0;
    }
    .doc-status-tag[data-status="draft"] { background: #f4f4f5; color: #52525b; }
    .doc-status-tag[data-status="draft"] .doc-status-tag__dot { background: #a1a1aa; }
    .doc-status-tag[data-status="in_review"] { background: #dbeafe; color: #1d4ed8; }
    .doc-status-tag[data-status="in_review"] .doc-status-tag__dot { background: #3b82f6; animation: pulse-dot 1.5s infinite; }
    .doc-status-tag[data-status="approved"] { background: #dcfce7; color: #15803d; }
    .doc-status-tag[data-status="approved"] .doc-status-tag__dot { background: #22c55e; }
    .doc-status-tag[data-status="revision"] { background: #fef3c7; color: #b45309; }
    .doc-status-tag[data-status="revision"] .doc-status-tag__dot { background: #f59e0b; }
    .doc-status-tag[data-status="final"] { background: #e0e7ff; color: #4338ca; }
    .doc-status-tag[data-status="final"] .doc-status-tag__dot { background: #6366f1; }
    .doc-status-tag[data-status="obsolete"] { background: #fee2e2; color: #b91c1c; }
    .doc-status-tag[data-status="obsolete"] .doc-status-tag__dot { background: #ef4444; }

    .doc-meta-tag {
      display: inline-flex; padding: 2px 7px; border-radius: 3px;
      font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: .3px;
      background: #f4f4f5; color: #71717a; border: 1px solid #e4e4e7;
    }
    .doc-meta-tag--sm { font-size: 9px; padding: 1px 5px; }
    .doc-meta-tag[data-priority="high"] { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .doc-meta-tag[data-priority="critical"],
    .doc-meta-tag[data-priority="urgent"] { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

    .btn-approve {
      background: #16a34a !important; border-color: #16a34a !important; color: #fff !important;
    }
    .btn-approve:hover { background: #15803d !important; border-color: #15803d !important; }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: .4; }
    }

    /* ===== Body: Main + Side Panel ===== */
    .doc-body {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 0;
      margin-top: 14px;
      align-items: start;
      transition: grid-template-columns .25s ease;
    }
    .doc-body--collapsed {
      grid-template-columns: 1fr 36px;
    }
    .doc-main { min-width: 0; }

    /* ===== Tabs Panel ===== */
    .doc-tabs-panel {
      background: #fff; border: 1px solid #e4e4e7; border-radius: 6px;
      overflow: hidden;
    }
    :host ::ng-deep .doc-tabs-panel .ant-tabs-nav { padding: 0 14px; margin-bottom: 0; }
    :host ::ng-deep .doc-tabs-panel .ant-tabs-tab { font-size: 12px; padding: 10px 4px; }
    :host ::ng-deep .doc-tabs-panel .ant-tabs-content-holder { padding: 14px; }

    /* ===== Info Section (tab content) ===== */
    .doc-info-section { }
    .doc-info-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 0; border: 1px solid #f4f4f5; border-radius: 6px; overflow: hidden;
    }
    .doc-info-item {
      display: flex; flex-direction: column; gap: 2px;
      padding: 10px 14px;
      border-bottom: 1px solid #f4f4f5;
      border-right: 1px solid #f4f4f5;
    }
    .doc-info-item:nth-child(3n) { border-right: none; }
    .doc-info-label { font-size: 10.5px; color: #a1a1aa; text-transform: uppercase; letter-spacing: .4px; font-weight: 500; }
    .doc-info-value { font-size: 13px; color: #27272a; }
    .doc-info-value--mono { font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 600; color: #0284c7; }
    .doc-info-icon { font-size: 11px; color: #a1a1aa; margin-right: 2px; }

    .doc-info-timestamps {
      display: flex; flex-wrap: wrap; gap: 16px;
      margin-top: 14px; padding: 10px 14px;
      background: #fafafa; border-radius: 6px; border: 1px solid #f4f4f5;
    }
    .doc-info-ts {
      display: flex; align-items: center; gap: 6px; font-size: 12px; color: #71717a;
    }
    .doc-info-ts .doc-info-label { font-size: 11px; text-transform: none; letter-spacing: 0; margin-right: 2px; }
    .doc-info-ts .doc-info-value { font-size: 12px; font-weight: 500; color: #3f3f46; }

    .doc-info-desc {
      margin-top: 14px; padding: 12px 14px;
      background: #fafafa; border-radius: 6px; border: 1px solid #f4f4f5;
    }
    .doc-info-desc__text { margin: 4px 0 0; font-size: 13px; color: #52525b; line-height: 1.6; }

    /* ===== Comments ===== */
    .doc-comments { display: flex; flex-direction: column; gap: 10px; }
    .doc-comment {
      display: flex; gap: 10px; padding: 10px; border-radius: 6px;
      background: #fafafa; border: 1px solid #f4f4f5; transition: border-color .15s;
    }
    .doc-comment:hover { border-color: #e4e4e7; }
    .doc-comment--resolved { opacity: .55; }
    .doc-comment__body { flex: 1; min-width: 0; }
    .doc-comment__header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .doc-comment__author { font-size: 12px; font-weight: 600; color: #27272a; }
    .doc-comment__time { font-size: 11px; color: #a1a1aa; }
    .doc-comment__resolved-badge {
      font-size: 10px; color: #16a34a; display: inline-flex; align-items: center; gap: 2px;
    }
    .doc-comment__actions { margin-left: auto; display: flex; gap: 2px; opacity: 0; transition: opacity .15s; }
    .doc-comment:hover .doc-comment__actions { opacity: 1; }
    .doc-comment__content { margin: 4px 0 0; font-size: 13px; color: #3f3f46; line-height: 1.5; }
    .doc-comment__replies { margin-top: 8px; padding-left: 12px; border-left: 2px solid #e4e4e7; }
    .doc-comment__reply { margin-bottom: 6px; }
    .doc-comment__reply-input { margin-top: 6px; }
    .doc-comment__reply-btn {
      font-size: 11px !important; color: #71717a !important; padding: 2px 4px !important;
      height: auto !important; margin-top: 4px;
    }
    .doc-comment__reply-btn:hover { color: #0284c7 !important; }
    .doc-comment-composer {
      display: flex; gap: 10px; padding-top: 12px;
      margin-top: 4px; border-top: 1px solid #f4f4f5;
    }
    .doc-comment-composer__input { flex: 1; }

    .doc-action-btn {
      width: 26px !important; height: 26px !important; padding: 0 !important;
      display: inline-flex !important; align-items: center; justify-content: center;
      border-radius: 4px !important; font-size: 13px;
    }
    .doc-action-btn:hover { background: #f4f4f5 !important; }

    /* ===== Workflow Steps (tab content) ===== */
    .doc-workflow-steps { padding: 4px 0; }
    .doc-wf-step { display: flex; gap: 12px; position: relative; }
    .doc-wf-step__indicator {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; width: 28px;
    }
    .doc-wf-step__dot {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 600; color: #a1a1aa;
      background: #f4f4f5; border: 2px solid #e4e4e7;
      position: relative; z-index: 1; transition: all .2s;
    }
    .doc-wf-step__num { font-size: 11px; }
    .doc-wf-step__line { width: 2px; flex: 1; min-height: 20px; background: #e4e4e7; margin: 2px 0; }
    .doc-wf-step[data-status="completed"] .doc-wf-step__dot { background: #dcfce7; border-color: #22c55e; color: #16a34a; }
    .doc-wf-step[data-status="completed"] .doc-wf-step__line { background: #86efac; }
    .doc-wf-step[data-status="rejected"] .doc-wf-step__dot { background: #fee2e2; border-color: #ef4444; color: #dc2626; }
    .doc-wf-step[data-status="in_progress"] .doc-wf-step__dot {
      background: #dbeafe; border-color: #3b82f6; color: #2563eb;
      box-shadow: 0 0 0 3px rgba(59,130,246,.15);
    }
    .doc-wf-step__content { padding-bottom: 16px; min-width: 0; }
    .doc-wf-step__name { font-size: 13px; font-weight: 600; color: #27272a; }
    .doc-wf-step__actor { font-size: 12px; color: #71717a; display: flex; align-items: center; gap: 3px; margin-top: 1px; }
    .doc-wf-step__comment {
      font-size: 12px; color: #71717a; font-style: italic;
      margin-top: 4px; padding: 4px 8px; background: #f4f4f5; border-radius: 4px;
    }
    .doc-wf-step__time { font-size: 11px; color: #a1a1aa; margin-top: 2px; }
    .doc-wf-action-tag {
      display: inline-flex; padding: 1px 6px; border-radius: 3px;
      font-size: 10px; font-weight: 600; margin-top: 3px;
      text-transform: uppercase; letter-spacing: .3px;
    }
    .doc-wf-action-tag[data-action="approve"] { background: #dcfce7; color: #15803d; }
    .doc-wf-action-tag[data-action="reject"] { background: #fee2e2; color: #b91c1c; }
    .doc-wf-action-tag[data-action="submit"] { background: #dbeafe; color: #1d4ed8; }
    .doc-wf-action-tag[data-action="review"] { background: #e0e7ff; color: #4338ca; }

    /* ===== Collapsible Side Panel ===== */
    .doc-side {
      border-left: 1px solid #e4e4e7;
      background: #fafafa;
      border-radius: 0 6px 6px 0;
      min-height: 400px;
      position: sticky;
      top: 12px;
      transition: width .25s ease;
      overflow: hidden;
      position: relative;
    }
    .doc-side--collapsed {
      background: transparent;
      border-left: none;
      min-height: auto;
    }
    .doc-side__toggle {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      border: 1px solid #e4e4e7; background: #fff;
      color: #71717a; cursor: pointer; font-size: 14px;
      border-radius: 6px;
      transition: all .15s;
      position: absolute; top: 8px; right: 8px; z-index: 2;
    }
    .doc-side--collapsed .doc-side__toggle {
      position: static;
      margin: 2px auto;
    }
    .doc-side__toggle:hover { background: #f4f4f5; color: #18181b; }

    .doc-side__section {
      padding: 12px 14px;
      border-bottom: 1px solid #f0f0f0;
    }
    .doc-side__section:first-of-type { padding-top: 44px; }
    .doc-side__section:last-child { border-bottom: none; }
    .doc-side__heading {
      font-size: 10px; font-weight: 600; color: #a1a1aa;
      text-transform: uppercase; letter-spacing: .5px;
      margin-bottom: 10px;
    }

    /* Side Summary */
    .doc-side__summary { display: flex; flex-direction: column; gap: 8px; }
    .doc-side__row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px;
    }
    .doc-side__label { font-size: 11px; color: #71717a; }
    .doc-side__val { font-size: 12px; color: #27272a; font-weight: 500; }
    .doc-side__val--mono { font-family: 'SF Mono', 'Fira Code', monospace; color: #0284c7; }

    /* Sidebar Workflow Mini Steps */
    .doc-sidebar-steps { display: flex; flex-direction: column; }
    .doc-sidebar-step { display: flex; gap: 10px; position: relative; }
    .doc-sidebar-step__dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #e4e4e7; border: 2px solid #d4d4d8;
      flex-shrink: 0; margin-top: 4px; position: relative; z-index: 1;
    }
    .doc-sidebar-step__connector {
      position: absolute; left: 4px; top: 14px; bottom: 0;
      width: 2px; background: #e4e4e7;
    }
    .doc-sidebar-step[data-status="completed"] .doc-sidebar-step__dot { background: #22c55e; border-color: #22c55e; }
    .doc-sidebar-step[data-status="completed"] .doc-sidebar-step__connector { background: #86efac; }
    .doc-sidebar-step[data-status="in_progress"] .doc-sidebar-step__dot {
      background: #3b82f6; border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,.2);
    }
    .doc-sidebar-step[data-status="rejected"] .doc-sidebar-step__dot { background: #ef4444; border-color: #ef4444; }
    .doc-sidebar-step__info { padding-bottom: 12px; min-width: 0; }
    .doc-sidebar-step__name { font-size: 12px; font-weight: 500; color: #27272a; line-height: 1.3; }
    .doc-sidebar-step__meta { font-size: 11px; color: #a1a1aa; display: block; }
    .doc-sidebar-step__time { font-size: 10px; color: #a1a1aa; display: block; }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .doc-body { grid-template-columns: 1fr; }
      .doc-body--collapsed { grid-template-columns: 1fr; }
      .doc-side { display: none; }
      .doc-header { flex-direction: column; gap: 10px; }
      .doc-header__actions { align-self: flex-start; flex-wrap: wrap; }
      .doc-info-grid { grid-template-columns: 1fr; }
      .doc-info-item { border-right: none !important; }
    }
    @media (max-width: 1024px) and (min-width: 769px) {
      .doc-info-grid { grid-template-columns: repeat(2, 1fr); }
      .doc-info-item:nth-child(3n) { border-right: 1px solid #f4f4f5; }
      .doc-info-item:nth-child(2n) { border-right: none; }
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

  loading = signal(true);
  versionsLoading = signal(false);
  commentsLoading = signal(false);
  workflowLoading = signal(false);
  distributionsLoading = signal(false);
  uploadingAttachment = signal(false);

  newComment = '';
  replyContent = '';
  replyingTo = signal<string | null>(null);
  activeTab = 0;
  sidebarCollapsed = signal(true); // default collapsed on Berkas tab

  documentId = '';

  // Mock file tree for Berkas tab
  mockFileTree: FileNode[] = [
    {
      id: 'folder-dokumen-utama', name: 'Dokumen Utama', type: 'folder', expanded: true,
      modifiedAt: '2026-04-10T09:00:00Z', uploadedBy: 'Admin',
      children: [
        {
          id: 'file-v2', name: 'SOP-Procurement-v2.0.docx', type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2457600, version: 'v2.0', isCurrent: true,
          uploadedBy: 'Budi Santoso', modifiedAt: '2026-04-10T09:15:00Z', createdAt: '2026-04-10T09:15:00Z',
          description: 'Versi final setelah review tim legal dan compliance.',
          tags: ['Final', 'Reviewed'], parentId: 'folder-dokumen-utama'
        },
        {
          id: 'file-v1', name: 'SOP-Procurement-v1.0.docx', type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 2150400, version: 'v1.0', isCurrent: false,
          uploadedBy: 'Budi Santoso', modifiedAt: '2026-03-20T14:30:00Z', createdAt: '2026-03-20T14:30:00Z',
          description: 'Draft awal dokumen SOP.', parentId: 'folder-dokumen-utama'
        },
        {
          id: 'file-pdf', name: 'SOP-Procurement-v2.0.pdf', type: 'file',
          mimeType: 'application/pdf', size: 1843200,
          uploadedBy: 'System', modifiedAt: '2026-04-10T09:20:00Z', createdAt: '2026-04-10T09:20:00Z',
          description: 'Versi PDF dari dokumen utama (auto-generated).', tags: ['Auto-PDF'],
          parentId: 'folder-dokumen-utama'
        }
      ]
    },
    {
      id: 'folder-lampiran', name: 'Lampiran', type: 'folder',
      modifiedAt: '2026-04-12T11:00:00Z', uploadedBy: 'Admin',
      children: [
        {
          id: 'folder-lampiran-legal', name: 'Dokumen Legal', type: 'folder',
          modifiedAt: '2026-04-08T16:00:00Z', parentId: 'folder-lampiran',
          children: [
            {
              id: 'file-kontrak', name: 'Kontrak-Vendor-2026.pdf', type: 'file',
              mimeType: 'application/pdf', size: 3145728,
              uploadedBy: 'Siti Aminah', modifiedAt: '2026-04-08T16:30:00Z', createdAt: '2026-04-08T16:30:00Z',
              description: 'Kontrak kerjasama dengan vendor utama.', tags: ['Legal', 'Kontrak'],
              parentId: 'folder-lampiran-legal'
            },
            {
              id: 'file-nda', name: 'NDA-Signed.pdf', type: 'file',
              mimeType: 'application/pdf', size: 524288,
              uploadedBy: 'Siti Aminah', modifiedAt: '2026-04-05T10:00:00Z', createdAt: '2026-04-05T10:00:00Z',
              parentId: 'folder-lampiran-legal'
            }
          ]
        },
        {
          id: 'file-data-survey', name: 'survey-data-2026.csv', type: 'file',
          mimeType: 'text/csv', size: 375,
          uploadedBy: 'Rini Wulandari', modifiedAt: '2026-04-12T11:00:00Z', createdAt: '2026-04-12T11:00:00Z',
          tags: ['Data'], parentId: 'folder-lampiran'
        },
        {
          id: 'file-foto', name: 'site-photo-001.jpg', type: 'file',
          mimeType: 'image/jpeg', size: 4194304,
          uploadedBy: 'Andi Pratama', modifiedAt: '2026-04-11T08:45:00Z', createdAt: '2026-04-11T08:45:00Z',
          description: 'Foto lokasi site visit tanggal 11 April.', parentId: 'folder-lampiran'
        }
      ]
    },
    {
      id: 'folder-referensi', name: 'Referensi', type: 'folder',
      modifiedAt: '2026-04-01T10:00:00Z', uploadedBy: 'Admin',
      children: [
        {
          id: 'file-peraturan', name: 'Peraturan-OJK-2025.pdf', type: 'file',
          mimeType: 'application/pdf', size: 5242880,
          uploadedBy: 'Legal Team', modifiedAt: '2026-04-01T10:30:00Z', createdAt: '2026-04-01T10:30:00Z',
          tags: ['Regulasi', 'OJK'], parentId: 'folder-referensi'
        },
        {
          id: 'file-template-excel', name: 'Template-Laporan.xlsx', type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 102400,
          uploadedBy: 'Finance Team', modifiedAt: '2026-03-28T09:00:00Z', createdAt: '2026-03-28T09:00:00Z',
          parentId: 'folder-referensi'
        }
      ]
    },
    {
      id: 'folder-review', name: 'Catatan Review', type: 'folder',
      modifiedAt: '2026-04-09T15:00:00Z', uploadedBy: 'Admin',
      children: [
        {
          id: 'file-review-note', name: 'review-notes-budi.docx', type: 'file',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 51200, uploadedBy: 'Budi Santoso',
          modifiedAt: '2026-04-09T15:20:00Z', createdAt: '2026-04-09T15:20:00Z',
          parentId: 'folder-review'
        }
      ]
    }
  ];

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

  // Tabs that need full width → sidebar auto-collapsed
  private fullWidthTabs = new Set([0]); // 0 = Berkas

  onTabChange(index: number) {
    // Auto-collapse/expand sidebar based on tab
    if (this.fullWidthTabs.has(index)) {
      this.sidebarCollapsed.set(true);
    } else {
      this.sidebarCollapsed.set(false);
    }

    // Lazy-load distributions on first visit (tab 4)
    if (index === 4 && this.distributions().length === 0 && !this.distributionsLoading()) {
      this.loadDistributions(this.documentId);
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
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

  // --- File Manager Event Handlers (mockup — will be wired to API later) ---
  onFmDownload(node: FileNode) {
    this.message.info(`Download: ${node.name} (mockup)`);
  }

  onFmPreview(node: FileNode) {
    this.message.info(`Preview: ${node.name} (mockup)`);
  }

  onFmDelete(node: FileNode) {
    this.modal.confirm({
      nzTitle: 'Hapus File?',
      nzContent: `Yakin ingin menghapus "${node.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.message.success(`${node.name} dihapus (mockup)`);
      }
    });
  }

  onFmCreateFolder(event: { parentId: string; name: string }) {
    this.message.success(`Folder "${event.name}" dibuat di ${event.parentId} (mockup)`);
  }

  onFmUpload(event: { parentId: string; file: File }) {
    this.message.success(`Upload ${event.file.name} ke ${event.parentId} (mockup)`);
  }
}
