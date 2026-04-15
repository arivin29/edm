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

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzTabsModule, NzTimelineModule,
    NzCommentModule, NzAvatarModule, NzInputModule, NzSpinModule,
    NzModalModule, NzBadgeModule, NzToolTipModule, NzTableModule, NzEmptyModule
  ],
  template: `
    <div class="p-4">
      @if (loading()) {
        <div class="text-center py-12">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else if (document()) {
        <!-- Header -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <a routerLink="/documents" class="text-gray-500 hover:text-gray-700">
                <span nz-icon nzType="arrow-left"></span>
              </a>
              <h1 class="text-lg font-semibold m-0">{{ document()!.title }}</h1>
              <nz-tag [nzColor]="getStatusColor(document()!.status)">{{ getStatusLabel(document()!.status) }}</nz-tag>
              <nz-tag [nzColor]="getPriorityColor(document()!.priority)">{{ getPriorityLabel(document()!.priority) }}</nz-tag>
              <nz-tag>{{ getConfidentialityLabel(document()!.confidentiality) }}</nz-tag>
            </div>
            <p class="text-gray-500 text-xs m-0">{{ document()!.document_number || 'Belum ada nomor' }}</p>
          </div>
          <div class="flex gap-2">
            <button nz-button nzSize="small" (click)="downloadDocument()">
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
              <button nz-button nzType="primary" nzSize="small" (click)="approveDocument()" class="bg-green-600">
                <span nz-icon nzType="check-circle"></span> Setujui
              </button>
              <button nz-button nzDanger nzSize="small" (click)="openRejectModal()">
                <span nz-icon nzType="close-circle"></span> Tolak
              </button>
            }
          </div>
        </div>

        <!-- Content -->
        <div class="grid grid-cols-3 gap-3">
          <!-- Main Info -->
          <div class="col-span-2">
            <nz-card nzSize="small" nzTitle="Informasi Dokumen">
              <nz-descriptions nzSize="small" [nzColumn]="2">
                <nz-descriptions-item nzTitle="Tipe">{{ document()!.document_type?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Kategori">{{ document()!.category?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Pembuat">{{ document()!.creator?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Versi">v{{ document()!.major_version }}.{{ document()!.minor_version }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Department">{{ document()!.department?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Section">{{ document()!.section?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Perusahaan">{{ document()!.company?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Kantor">{{ document()!.office?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Template">{{ document()!.template?.name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Revisi">{{ document()!.revision_count }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Dibuat">{{ document()!.created_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Diperbarui">{{ document()!.updated_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
                @if (document()!.submitted_at) {
                  <nz-descriptions-item nzTitle="Disubmit">{{ document()!.submitted_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
                }
                @if (document()!.approved_at) {
                  <nz-descriptions-item nzTitle="Disetujui">{{ document()!.approved_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
                }
              </nz-descriptions>
              @if (document()!.description) {
                <div class="mt-3 pt-3 border-t">
                  <div class="text-xs text-gray-500 mb-1">Deskripsi</div>
                  <div class="text-sm">{{ document()!.description }}</div>
                </div>
              }
            </nz-card>

            <!-- Tabs -->
            <nz-card nzSize="small" class="mt-3">
              <nz-tabset nzSize="small" [(nzSelectedIndex)]="activeTab" (nzSelectedIndexChange)="onTabChange($event)">
                <!-- Versions Tab -->
                <nz-tab nzTitle="Versi">
                  @if (versionsLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
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
                          <th></th>
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
                            <td class="text-xs">{{ v.file_name || '-' }}</td>
                            <td class="text-xs">{{ formatFileSize(v.file_size) }}</td>
                            <td class="text-xs">{{ v.change_summary || 'Tidak ada catatan' }}</td>
                            <td class="text-xs">{{ v.creator?.name || '-' }}</td>
                            <td class="text-xs">{{ v.created_at | date:'dd/MM/yy HH:mm' }}</td>
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
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                  } @else {
                    <div class="space-y-3">
                      @for (c of comments(); track c.id) {
                        <div class="border rounded p-3" [class.bg-gray-50]="c.is_resolved" [class.opacity-60]="c.is_resolved">
                          <div class="flex justify-between items-start mb-1">
                            <div class="flex items-center gap-2">
                              <nz-avatar nzIcon="user" nzSize="small"></nz-avatar>
                              <span class="font-medium text-sm">{{ c.user?.name || 'Anonim' }}</span>
                              <span class="text-xs text-gray-400">{{ formatDate(c.created_at) }}</span>
                              @if (c.is_resolved) {
                                <nz-tag nzColor="green" class="text-xs">Terselesaikan</nz-tag>
                              }
                            </div>
                            <div class="flex gap-1">
                              @if (c.is_resolved) {
                                <button nz-button nzSize="small" nzType="link" nz-tooltip nzTooltipTitle="Buka kembali" (click)="unresolveComment(c.id)">
                                  <span nz-icon nzType="undo"></span>
                                </button>
                              } @else {
                                <button nz-button nzSize="small" nzType="link" nz-tooltip nzTooltipTitle="Selesaikan" (click)="resolveComment(c.id)">
                                  <span nz-icon nzType="check"></span>
                                </button>
                              }
                              <button nz-button nzSize="small" nzType="link" nzDanger nz-tooltip nzTooltipTitle="Hapus" (click)="deleteComment(c.id)">
                                <span nz-icon nzType="delete"></span>
                              </button>
                            </div>
                          </div>
                          <p class="text-sm m-0 ml-8">{{ c.content }}</p>

                          <!-- Replies -->
                          @if (c.replies && c.replies.length > 0) {
                            <div class="ml-8 mt-2 border-l-2 border-gray-200 pl-3">
                              @for (r of c.replies; track r.id) {
                                <div class="mb-2">
                                  <div class="flex items-center gap-2">
                                    <span class="font-medium text-xs">{{ r.user?.name || 'Anonim' }}</span>
                                    <span class="text-xs text-gray-400">{{ formatDate(r.created_at) }}</span>
                                  </div>
                                  <p class="text-xs m-0">{{ r.content }}</p>
                                </div>
                              }
                            </div>
                          }

                          <!-- Reply input -->
                          @if (replyingTo() === c.id) {
                            <div class="ml-8 mt-2">
                              <textarea nz-input [(ngModel)]="replyContent" placeholder="Tulis balasan..." [nzAutosize]="{ minRows: 1, maxRows: 3 }" class="text-xs"></textarea>
                              <div class="flex gap-1 mt-1">
                                <button nz-button nzSize="small" nzType="primary" [disabled]="!replyContent.trim()" (click)="addReply(c.id)">Balas</button>
                                <button nz-button nzSize="small" (click)="replyingTo.set(null)">Batal</button>
                              </div>
                            </div>
                          } @else {
                            <button nz-button nzSize="small" nzType="link" class="ml-6 mt-1 text-xs" (click)="replyingTo.set(c.id)">Balas</button>
                          }
                        </div>
                      } @empty {
                        <nz-empty nzNotFoundContent="Belum ada komentar"></nz-empty>
                      }

                      <!-- Add comment -->
                      <div class="flex gap-2 mt-3 pt-3 border-t">
                        <nz-avatar nzIcon="user" nzSize="small"></nz-avatar>
                        <div class="flex-1">
                          <textarea nz-input [(ngModel)]="newComment" placeholder="Tulis komentar..."
                                    [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
                          <button nz-button nzType="primary" nzSize="small" class="mt-2"
                                  [disabled]="!newComment.trim()" (click)="addComment()">
                            Kirim
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </nz-tab>

                <!-- Workflow Tab -->
                <nz-tab nzTitle="Workflow">
                  @if (workflowLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
                  } @else if (workflow()) {
                    <nz-timeline>
                      @for (step of workflow()!.steps; track step.id) {
                        <nz-timeline-item [nzColor]="getStepColor(step.status)">
                          <div class="flex justify-between items-start">
                            <div>
                              <div class="font-medium text-sm">{{ step.name }}</div>
                              <div class="text-xs text-gray-500">{{ step.actor?.name || '-' }}</div>
                              @if (step.action_type) {
                                <nz-tag [nzColor]="step.action_type === 'approve' ? 'green' : step.action_type === 'reject' ? 'red' : 'blue'" class="text-xs mt-1">
                                  {{ getActionLabel(step.action_type) }}
                                </nz-tag>
                              }
                              @if (step.comment) {
                                <div class="text-xs text-gray-500 mt-1 italic">"{{ step.comment }}"</div>
                              }
                            </div>
                            @if (step.completed_at) {
                              <span class="text-xs text-gray-400">{{ step.completed_at | date:'dd/MM/yy HH:mm' }}</span>
                            }
                          </div>
                        </nz-timeline-item>
                      } @empty {
                        <nz-empty nzNotFoundContent="Belum ada langkah workflow"></nz-empty>
                      }
                    </nz-timeline>
                  } @else {
                    <nz-empty nzNotFoundContent="Workflow belum dimulai"></nz-empty>
                  }
                </nz-tab>

                <!-- Distribution Tab -->
                <nz-tab nzTitle="Distribusi">
                  @if (distributionsLoading()) {
                    <div class="text-center py-4"><nz-spin nzSimple nzSize="small"></nz-spin></div>
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
                            <td class="text-sm">{{ d.user?.name || '-' }}</td>
                            <td class="text-sm">{{ d.department?.name || '-' }}</td>
                            <td class="text-xs">{{ d.distributed_at | date:'dd/MM/yy HH:mm' }}</td>
                            <td class="text-xs">{{ d.received_at ? (d.received_at | date:'dd/MM/yy HH:mm') : '-' }}</td>
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
            </nz-card>
          </div>

          <!-- Sidebar -->
          <div>
            <nz-card nzSize="small" nzTitle="Status Workflow">
              @if (workflow()) {
                <nz-timeline>
                  @for (step of workflow()!.steps; track step.id) {
                    <nz-timeline-item [nzColor]="getStepColor(step.status)">
                      <div class="font-medium text-sm">{{ step.name }}</div>
                      <div class="text-xs text-gray-500">{{ step.actor?.name || '-' }}</div>
                      @if (step.completed_at) {
                        <div class="text-xs text-gray-400">{{ step.completed_at | date:'dd/MM/yy HH:mm' }}</div>
                      }
                    </nz-timeline-item>
                  }
                </nz-timeline>
              } @else {
                <div class="text-gray-500 text-sm">Workflow belum dimulai</div>
              }
            </nz-card>

            <!-- Quick Actions -->
            <nz-card nzSize="small" nzTitle="Aksi" class="mt-3">
              <div class="space-y-2">
                <button nz-button nzBlock nzSize="small" (click)="downloadDocument()">
                  <span nz-icon nzType="download"></span> Download
                </button>
                <button nz-button nzBlock nzSize="small">
                  <span nz-icon nzType="printer"></span> Print
                </button>
                <button nz-button nzBlock nzSize="small">
                  <span nz-icon nzType="share-alt"></span> Share
                </button>
              </div>
            </nz-card>
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
    :host ::ng-deep .ant-descriptions-item-label { font-size: 12px; color: #888; }
    :host ::ng-deep .ant-descriptions-item-content { font-size: 13px; }
    :host ::ng-deep .ant-card-head { padding: 0 12px; min-height: 36px; }
    :host ::ng-deep .ant-card-head-title { padding: 8px 0; font-size: 13px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-tabs-tab { font-size: 12px; padding: 8px 0; }
    :host ::ng-deep .ant-comment-content-author-name { font-size: 12px; }
    :host ::ng-deep .ant-comment-content-author-time { font-size: 11px; }
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

  loading = signal(true);
  versionsLoading = signal(false);
  commentsLoading = signal(false);
  workflowLoading = signal(false);
  distributionsLoading = signal(false);

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
}
