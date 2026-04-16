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
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzListModule } from 'ng-zorro-antd/list';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { FileManagerComponent, FileNode } from './components/file-manager/file-manager.component';
import { DocParametersComponent } from './components/doc-parameters/doc-parameters.component';
import { DocPreviewComponent, PreviewFile } from './components/doc-preview/doc-preview.component';
import {
  DocumentDetail, DocumentVersion, Comment, WorkflowStep, WorkflowStatus, WorkflowStepInstance, WorkflowTemplateStep,
  Distribution, Attachment,
  getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel,
  getConfidentialityLabel, formatDate, formatFileSize, getFileIcon
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
    NzUploadModule, NzListModule, NzAlertModule, FileManagerComponent, DocParametersComponent, DocPreviewComponent
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
  sidebarCollapsed = signal(true);

  documentId = '';

  // Preview state
  previewFile = signal<PreviewFile | null>(null);

  // Expose helpers to template
  getStatusColor = getStatusColor;
  getStatusLabel = getStatusLabel;
  getPriorityColor = getPriorityColor;
  getPriorityLabel = getPriorityLabel;
  getConfidentialityLabel = getConfidentialityLabel;
  formatDate = formatDate;
  formatFileSize = formatFileSize;
  getFileIcon = getFileIcon;

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

  private fullWidthTabs = new Set([1]);

  onTabChange(index: number) {
    if (this.fullWidthTabs.has(index)) {
      this.sidebarCollapsed.set(true);
    } else {
      this.sidebarCollapsed.set(false);
    }
    if (index === 6 && this.distributions().length === 0 && !this.distributionsLoading()) {
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

  onFmDownload(node: FileNode | PreviewFile) {
    this.message.info(`Download: ${node.name} (mockup)`);
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
      if (step.actor && !seen.has(step.actor.id)) {
        seen.add(step.actor.id);
        users.push({ id: step.actor.id, name: step.actor.name, stepName: step.name });
      }
    }
    return users;
  }
}
