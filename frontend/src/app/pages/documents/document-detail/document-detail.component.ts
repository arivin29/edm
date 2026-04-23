import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { DownloadService } from '../../../core/services/download.service';
import { FileManagerComponent, FileNode, FileUploadData } from './components/file-manager/file-manager.component';
import { DocParametersComponent } from './components/doc-parameters/doc-parameters.component';
import { DocPreviewComponent, PreviewFile } from './components/doc-preview/doc-preview.component';
import { DocEditorComponent } from './components/doc-editor/doc-editor.component';
import {
  DocumentDetail, DocumentVersion, Comment, WorkflowStep, WorkflowStatus, WorkflowStepInstance, WorkflowTemplateStep,
  Distribution, Attachment, DigitalSignature,
  getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel,
  getConfidentialityLabel, getClassificationColor, getClassificationLabel, getClassificationIcon,
  formatDate, formatFileSize, getFileIcon
} from '../document.models';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzTabsModule, NzTimelineModule,
    NzCommentModule, NzAvatarModule, NzInputModule, NzSpinModule,
    NzModalModule, NzBadgeModule, NzToolTipModule, NzTableModule, NzEmptyModule,
    NzUploadModule, NzListModule, NzAlertModule, NzPopconfirmModule,
    FileManagerComponent, DocParametersComponent, DocPreviewComponent, DocEditorComponent
  ],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailPage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private downloadSvc = inject(DownloadService);

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
  activeTab = signal(0);
  sidebarCollapsed = signal(true);

  documentId = '';

  // Preview state
  previewFile = signal<PreviewFile | null>(null);

  // OCR state
  ocrStatus = signal<{ available: boolean; engine: string; version: string } | null>(null);
  ocrRunning = signal(false);
  ocrResult = signal<{ text: string; page_count: number; engine: string; duration: string } | null>(null);
  ocrText = signal<string>('');
  attachmentOcrState = signal<Map<string, { ocrProcessing?: boolean; ocrText?: string }>>(new Map());

  // TTE (Digital Signatures) state
  signatures = signal<DigitalSignature[]>([]);
  signaturesLoading = signal(false);
  signing = signal(false);

  // Expose helpers to template
  getStatusColor = getStatusColor;
  getStatusLabel = getStatusLabel;
  getPriorityColor = getPriorityColor;
  getPriorityLabel = getPriorityLabel;
  getConfidentialityLabel = getConfidentialityLabel;
  getClassificationColor = getClassificationColor;
  getClassificationLabel = getClassificationLabel;
  getClassificationIcon = getClassificationIcon;
  formatDate = formatDate;
  formatFileSize = formatFileSize;
  getFileIcon = getFileIcon;

  // Build file tree from real API data (versions + attachments)
  fileTree = computed<FileNode[]>(() => {
    const doc = this.document();
    const vers = this.versions();
    const atts = this.attachments();

    // Folder 1: Dokumen Utama (from document versions)
    const versionNodes: FileNode[] = vers.map(v => ({
      id: `ver-${v.id}`,
      name: v.file_name || `Versi ${v.major_version}.${v.minor_version}`,
      type: 'file' as const,
      mimeType: this.guessMimeType(v.file_name),
      size: v.file_size || 0,
      version: `v${v.major_version}.${v.minor_version}`,
      isCurrent: v.is_current,
      uploadedBy: v.creator?.name || '-',
      modifiedAt: v.created_at,
      createdAt: v.created_at,
      description: v.change_summary || undefined,
      tags: v.is_current ? ['Aktif'] : undefined,
      parentId: 'folder-dokumen-utama'
    }));

    const dokumenUtama: FileNode = {
      id: 'folder-dokumen-utama',
      name: 'Dokumen Utama',
      type: 'folder',
      expanded: true,
      modifiedAt: versionNodes.length > 0 ? versionNodes[0].modifiedAt : doc?.created_at,
      uploadedBy: doc?.creator?.name || '-',
      children: versionNodes
    };

    // Folder 2: File Pendukung (from attachments API)
    const ocrState = this.attachmentOcrState();
    const attachmentNodes: FileNode[] = atts.map(att => {
      const nodeId = `att-${att.id}`;
      const ocr = ocrState.get(nodeId);
      return {
        id: nodeId,
        name: att.original_name,
        type: 'file' as const,
        mimeType: att.mime_type,
        size: att.file_size,
        uploadedBy: att.uploader?.name || '-',
        modifiedAt: att.created_at,
        createdAt: att.created_at,
        parentId: 'folder-lampiran',
        ocrText: ocr?.ocrText,
        ocrProcessing: ocr?.ocrProcessing
      };
    });

    const filePendukung: FileNode = {
      id: 'folder-lampiran',
      name: 'File Pendukung',
      type: 'folder',
      expanded: true,
      modifiedAt: attachmentNodes.length > 0 ? attachmentNodes[0].modifiedAt : undefined,
      children: attachmentNodes
    };

    return [dokumenUtama, filePendukung];
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.documentId = id;
      this.loadDocument(id);
      this.loadVersions(id);
      this.loadAttachments();
      this.loadComments(id);
      this.loadWorkflow(id);
      this.loadDistributions(id);
    }
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        // Normalize metadata: backend may return JSON string for JSONB fields
        if (doc && typeof doc.metadata === 'string') {
          try { doc.metadata = JSON.parse(doc.metadata); } catch { doc.metadata = {}; }
        }
        this.document.set(doc);
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
      next: (res) => {
        const data = res.data;
        if (data) {
          // Normalize: flatten instance.steps so template can access step.name, step.actorName etc.
          if (data.instance?.steps) {
            data.steps = data.instance.steps.map((si: any) => ({
              ...si,
              name: si.step?.name || `Step ${si.step_order}`,
              step_type: si.step?.step_type || '',
              assignee_type: si.step?.assignee_type || '',
              instructions: si.step?.instructions || '',
              can_delegate: si.step?.can_delegate || false,
              deadline_days: si.step?.deadline_days,
              // Extract actor from first action if completed/rejected
              actor: si.actions?.[0]?.actor || null,
              action_type: si.actions?.[0]?.action_type || null,
              comment: si.actions?.[0]?.comment || null,
              // Assignee user from template step (for pending/active steps)
              assignee_user: si.step?.assignee_user || null,
              assignee_user_id: si.step?.assignee_user_id || null,
            }));
          }
          // Ensure workflow_name is set
          if (!data.workflow_name && data.instance?.workflow?.name) {
            data.workflow_name = data.instance.workflow.name;
          }
        }
        this.workflow.set(data || null);
        this.workflowLoading.set(false);
      },
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

  private fullWidthTabs = new Set([1]);

  onTabChange(index: number) {
    this.activeTab.set(index);
    if (this.fullWidthTabs.has(index)) {
      this.sidebarCollapsed.set(true);
    } else {
      this.sidebarCollapsed.set(false);
    }
    if (index === 6 && this.distributions().length === 0 && !this.distributionsLoading()) {
      this.loadDistributions(this.documentId);
    }
    // OCR tab (index 8)
    if (index === 8 && !this.ocrStatus()) {
      this.loadOCRStatus();
      this.loadOCRText();
    }
    // Signatures tab (index 9)
    if (index === 9 && this.signatures().length === 0 && !this.signaturesLoading()) {
      this.loadSignatures();
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
    this.downloadSvc.download(`/documents/${doc.id}/download`);
  }

  downloadVersion(versionNumber: number) {
    const doc = this.document();
    if (!doc) return;
    this.downloadSvc.download(`/documents/${doc.id}/versions/${versionNumber}/download`);
  }

  restoreVersion(versionNumber: number) {
    const doc = this.document();
    if (!doc) return;
    this.modal.confirm({
      nzTitle: 'Restore Versi',
      nzContent: `Apakah Anda yakin ingin mengembalikan dokumen ke versi ${versionNumber}? Versi saat ini akan disimpan dan versi yang dipilih akan menjadi versi terbaru.`,
      nzOkText: 'Ya, Restore',
      nzOkDanger: false,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.post<any>(`${environment.apiUrl}/documents/${doc.id}/versions/${versionNumber}/restore`, {}).subscribe({
          next: () => {
            this.message.success('Versi berhasil di-restore');
            this.loadDocument(doc.id);
            this.loadVersions(doc.id);
          },
          error: () => this.message.error('Gagal restore versi')
        });
      }
    });
  }

  getStepColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'gray', active: 'blue', approved: 'green', rejected: 'red', skipped: 'orange'
    };
    return colors[status] || 'gray';
  }

  getStepTypeLabel(type: string | undefined): string {
    if (!type) return '-';
    const labels: Record<string, string> = {
      approval: 'Persetujuan', approve: 'Persetujuan', review: 'Review', sign: 'Tanda Tangan',
      acknowledge: 'Acknowledgment', input: 'Input Data'
    };
    return labels[type] || type;
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

  /**
   * Calculate SLA info for a workflow step.
   * Returns: { remaining: string, percent: number, status: 'safe'|'warning'|'danger'|'overdue'|'completed', daysLeft: number }
   */
  getStepSla(step: any): { remaining: string; percent: number; status: string; daysLeft: number } | null {
    if (!step.deadline && !step.deadline_days) return null;

    // Completed steps — show how long it took
    if (step.status === 'approved' || step.status === 'rejected') {
      if (step.activated_at && step.completed_at) {
        const start = new Date(step.activated_at).getTime();
        const end = new Date(step.completed_at).getTime();
        const daysUsed = Math.max(0, Math.round((end - start) / 86400000));
        const totalDays = step.deadline_days || 0;

        if (totalDays > 0) {
          const overdue = step.deadline ? new Date(step.completed_at) > new Date(step.deadline) : false;
          return {
            remaining: overdue ? `Terlambat ${daysUsed - totalDays}h` : `Selesai dalam ${daysUsed}h dari ${totalDays}h`,
            percent: 100,
            status: overdue ? 'overdue' : 'completed',
            daysLeft: overdue ? -(daysUsed - totalDays) : totalDays - daysUsed
          };
        }
      }
      return null;
    }

    // Active/pending steps — show countdown
    if (step.deadline) {
      const now = Date.now();
      const deadlineTime = new Date(step.deadline).getTime();
      const msLeft = deadlineTime - now;
      const daysLeft = Math.ceil(msLeft / 86400000);
      const hoursLeft = Math.ceil(msLeft / 3600000);

      // Calculate progress percentage
      let percent = 0;
      if (step.activated_at) {
        const startTime = new Date(step.activated_at).getTime();
        const totalDuration = deadlineTime - startTime;
        const elapsed = now - startTime;
        percent = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 0;
      }

      let status: string;
      let remaining: string;

      if (msLeft <= 0) {
        status = 'overdue';
        remaining = `Terlambat ${Math.abs(daysLeft)}h`;
        percent = 100;
      } else if (daysLeft <= 1) {
        status = 'danger';
        remaining = hoursLeft <= 24 ? `${hoursLeft} jam lagi` : `${daysLeft} hari lagi`;
      } else if (daysLeft <= 3) {
        status = 'warning';
        remaining = `${daysLeft} hari lagi`;
      } else {
        status = 'safe';
        remaining = `${daysLeft} hari lagi`;
      }

      return { remaining, percent, status, daysLeft };
    }

    return null;
  }

  onFmDownload(node: FileNode | PreviewFile) {
    // Download version file
    if (node.id.startsWith('ver-')) {
      const versionId = node.id.replace('ver-', '');
      this.http.get(`${environment.apiUrl}/documents/${this.documentId}/versions/${versionId}/download`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = node.name;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.message.error('Gagal mengunduh file')
      });
      return;
    }
    // Download attachment
    if (node.id.startsWith('att-')) {
      const attId = node.id.replace('att-', '');
      this.http.get(`${environment.apiUrl}/documents/${this.documentId}/attachments/${attId}/download`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = node.name;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.message.error('Gagal mengunduh file')
      });
      return;
    }
  }

  onFmPreview(node: FileNode) {
    this.previewFile.set({
      id: node.id,
      name: node.name,
      mimeType: node.mimeType || '',
      size: node.size || 0,
      url: node.id ? `${environment.apiUrl}/documents/${this.documentId}/files/${node.id}/content` : undefined,
      version: node.version,
      uploadedBy: node.uploadedBy,
      modifiedAt: node.modifiedAt,
      description: node.description,
      tags: node.tags
    });
  }

  onFmDelete(node: FileNode) {
    if (!node.id.startsWith('att-')) {
      this.message.warning('Hanya file pendukung yang bisa dihapus dari sini');
      return;
    }
    const attId = node.id.replace('att-', '');
    this.modal.confirm({
      nzTitle: 'Hapus File?',
      nzContent: `Yakin ingin menghapus "${node.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/documents/${this.documentId}/attachments/${attId}`).subscribe({
          next: () => {
            this.message.success('File berhasil dihapus');
            this.loadAttachments();
          },
          error: () => this.message.error('Gagal menghapus file')
        });
      }
    });
  }

  onFmCreateFolder(_event: { parentId: string; name: string }) {
    this.message.info('Pembuatan folder tidak didukung — file dikelola berdasarkan kategori otomatis');
  }

  onFmUpload(event: FileUploadData) {
    this.uploadingAttachment.set(true);
    const formData = new FormData();
    formData.append('file', event.file);
    if (event.description) {
      formData.append('description', event.description);
    }
    if (event.referenceNumber) {
      formData.append('reference_number', event.referenceNumber);
    }
    this.http.post(`${environment.apiUrl}/documents/${this.documentId}/attachments`, formData).subscribe({
      next: () => {
        this.message.success(`${event.file.name} berhasil diupload`);
        this.loadAttachments();
        this.uploadingAttachment.set(false);
      },
      error: () => {
        this.message.error(`Gagal mengupload ${event.file.name}`);
        this.uploadingAttachment.set(false);
      }
    });
  }

  onMetadataUpdated(metadata: Record<string, any>) {
    const doc = this.document();
    if (doc) {
      this.document.set({ ...doc, metadata });
    }
  }

  countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (node.type === 'file') { count++; }
      if (node.children) { count += this.countFiles(node.children); }
    }
    return count;
  }

  getAssignedUsers(): { id: string; name: string; stepName?: string }[] {
    const wf = this.workflow();
    if (!wf?.steps) return [];
    const seen = new Set<string>();
    const users: { id: string; name: string; stepName?: string }[] = [];
    for (const step of wf.steps) {
      // Use actor (from completed action) or assignee_user_id for pending steps
      const actor = step.actor || step.actions?.[0]?.actor;
      if (actor && !seen.has(actor.id)) {
        seen.add(actor.id);
        users.push({ id: actor.id, name: actor.name, stepName: step.name || step.step?.name });
      }
    }
    return users;
  }

  private guessMimeType(fileName?: string): string {
    if (!fileName) return 'application/octet-stream';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      doc: 'application/msword',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
      csv: 'text/csv', txt: 'text/plain', zip: 'application/zip'
    };
    return map[ext || ''] || 'application/octet-stream';
  }

  // OCR methods
  loadOCRStatus() {
    this.http.get<any>(`${environment.apiUrl}/ocr/status`).subscribe({
      next: (res) => this.ocrStatus.set(res.data),
      error: () => this.ocrStatus.set({ available: false, engine: 'tesseract', version: 'not installed' })
    });
  }

  loadOCRText() {
    this.http.get<any>(`${environment.apiUrl}/documents/${this.documentId}/ocr`).subscribe({
      next: (res) => this.ocrText.set(res.data?.text || ''),
      error: () => {}
    });
  }

  runOCR() {
    this.ocrRunning.set(true);
    this.ocrResult.set(null);
    this.http.post<any>(`${environment.apiUrl}/documents/${this.documentId}/ocr`, {}).subscribe({
      next: (res) => {
        this.ocrResult.set(res.data);
        this.ocrRunning.set(false);
        this.message.success('OCR berhasil dijalankan');
      },
      error: (err) => {
        this.ocrRunning.set(false);
        this.message.error(err.error?.error || 'OCR gagal');
      }
    });
  }

  onFmOcr(node: FileNode) {
    if (!node.id.startsWith('att-')) {
      // For version files, use existing document-level OCR
      this.runOCR();
      return;
    }
    const attId = node.id.replace('att-', '');
    // Mark as processing on the node via update
    this.updateFileNodeOcr(node.id, { ocrProcessing: true });
    this.http.post<any>(`${environment.apiUrl}/documents/${this.documentId}/attachments/${attId}/ocr`, {}).subscribe({
      next: (res) => {
        const text = res.data?.text || '';
        this.updateFileNodeOcr(node.id, { ocrProcessing: false, ocrText: text });
        this.message.success('OCR berhasil — teks berhasil diekstrak');
      },
      error: (err) => {
        this.updateFileNodeOcr(node.id, { ocrProcessing: false });
        this.message.error(err.error?.error || 'OCR gagal');
      }
    });
  }

  private updateFileNodeOcr(nodeId: string, patch: { ocrProcessing?: boolean; ocrText?: string }) {
    // We need to refresh attachments to update the computed fileTree.
    // Since ocrText/ocrProcessing are transient UI states, store them separately.
    const current = this.attachmentOcrState().get(nodeId) || {};
    this.attachmentOcrState.update(m => {
      const next = new Map(m);
      next.set(nodeId, { ...current, ...patch });
      return next;
    });
  }

  // TTE (Digital Signature) methods
  loadSignatures() {
    this.signaturesLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${this.documentId}/signatures`).subscribe({
      next: (res) => {
        this.signatures.set(res.data || []);
        this.signaturesLoading.set(false);
      },
      error: () => this.signaturesLoading.set(false)
    });
  }

  signDocument() {
    this.signing.set(true);
    this.http.post<any>(`${environment.apiUrl}/documents/${this.documentId}/sign`, {}).subscribe({
      next: (res) => {
        this.signing.set(false);
        this.message.success(res.message || 'Dokumen berhasil ditandatangani');
        this.loadSignatures();
      },
      error: (err) => {
        this.signing.set(false);
        this.message.error(err.error?.error || 'Gagal menandatangani dokumen');
      }
    });
  }

  verifySignature(sigId: string) {
    this.http.post<any>(`${environment.apiUrl}/signatures/${sigId}/verify`, {}).subscribe({
      next: (res) => {
        if (res.valid) {
          this.message.success(res.message);
        } else {
          this.message.warning(res.message);
        }
        this.loadSignatures();
      },
      error: (err) => this.message.error(err.error?.error || 'Gagal memverifikasi')
    });
  }

  revokeSignature(sigId: string) {
    this.http.post<any>(`${environment.apiUrl}/signatures/${sigId}/revoke`, { reason: 'Dicabut oleh pengguna' }).subscribe({
      next: () => {
        this.message.success('Tanda tangan berhasil dicabut');
        this.loadSignatures();
      },
      error: (err) => this.message.error(err.error?.error || 'Gagal mencabut tanda tangan')
    });
  }

  getSignatureStatusColor(status: string): string {
    switch (status) {
      case 'signed': return 'blue';
      case 'verified': return 'green';
      case 'revoked': return 'red';
      default: return 'default';
    }
  }

  getSignatureStatusLabel(status: string): string {
    switch (status) {
      case 'signed': return 'Ditandatangani';
      case 'verified': return 'Terverifikasi';
      case 'revoked': return 'Dicabut';
      default: return status;
    }
  }
}
