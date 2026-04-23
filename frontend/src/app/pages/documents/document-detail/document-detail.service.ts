import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment';
import { DownloadService } from '../../../core/services/download.service';
import { DocumentDetail, DocumentVersion, Comment, WorkflowStatus, Distribution, Attachment, DigitalSignature } from '../document.models';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  version?: string;
  isCurrent?: boolean;
  uploadedBy?: string;
  modifiedAt?: string;
  createdAt?: string;
  description?: string;
  tags?: string[];
  parentId?: string;
  expanded?: boolean;
  children?: FileNode[];
  ocrText?: string;
  ocrProcessing?: boolean;
}

@Injectable()
export class DocumentDetailService {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  // Core state
  documentId = signal<string>('');
  document = signal<DocumentDetail | null>(null);
  versions = signal<DocumentVersion[]>([]);
  comments = signal<Comment[]>([]);
  workflow = signal<WorkflowStatus | null>(null);
  distributions = signal<Distribution[]>([]);
  attachments = signal<Attachment[]>([]);
  signatures = signal<DigitalSignature[]>([]);

  // Loading states
  loading = signal(true);
  versionsLoading = signal(false);
  commentsLoading = signal(false);
  workflowLoading = signal(false);
  distributionsLoading = signal(false);
  signaturesLoading = signal(false);

  // OCR state
  ocrStatus = signal<{ available: boolean; engine: string; version: string } | null>(null);
  ocrRunning = signal(false);
  ocrResult = signal<{ text: string; page_count: number; engine: string; duration: string } | null>(null);
  ocrText = signal<string>('');
  attachmentOcrState = signal<Map<string, { ocrProcessing?: boolean; ocrText?: string }>>(new Map());

  // File tree computed
  fileTree = computed<FileNode[]>(() => {
    const doc = this.document();
    const vers = this.versions();
    const atts = this.attachments();

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
        ocrText: ocr?.ocrText || att.ocr_text || undefined,
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

  private guessMimeType(fileName?: string): string {
    if (!fileName) return 'application/octet-stream';
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
    };
    return map[ext || ''] || 'application/octet-stream';
  }

  loadDocument(id: string) {
    this.documentId.set(id);
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
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

  loadVersions() {
    const id = this.documentId();
    if (!id) return;
    this.versionsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/versions`).subscribe({
      next: (res) => { this.versions.set(res.data || []); this.versionsLoading.set(false); },
      error: () => { this.versions.set([]); this.versionsLoading.set(false); }
    });
  }

  loadComments() {
    const id = this.documentId();
    if (!id) return;
    this.commentsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/comments`).subscribe({
      next: (res) => { this.comments.set(res.data || []); this.commentsLoading.set(false); },
      error: () => { this.comments.set([]); this.commentsLoading.set(false); }
    });
  }

  loadWorkflow() {
    const id = this.documentId();
    if (!id) return;
    this.workflowLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/workflow`).subscribe({
      next: (res) => {
        const data = res.data;
        if (data?.instance?.steps) {
          data.steps = data.instance.steps.map((si: any) => ({
            ...si,
            name: si.step?.name || `Step ${si.step_order}`,
            step_type: si.step?.step_type || '',
            assignee_type: si.step?.assignee_type || '',
            instructions: si.step?.instructions || '',
            can_delegate: si.step?.can_delegate || false,
            deadline_days: si.step?.deadline_days,
            actor: si.actions?.[0]?.actor || null,
            action_type: si.actions?.[0]?.action_type || null,
            comment: si.actions?.[0]?.comment || null,
            assignee_user: si.step?.assignee_user || null,
            assignee_user_id: si.step?.assignee_user_id || null,
          }));
        }
        if (!data?.workflow_name && data?.instance?.workflow?.name) {
          data.workflow_name = data.instance.workflow.name;
        }
        this.workflow.set(data || null);
        this.workflowLoading.set(false);
      },
      error: () => { this.workflow.set(null); this.workflowLoading.set(false); }
    });
  }

  loadDistributions() {
    const id = this.documentId();
    if (!id) return;
    this.distributionsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/distributions`).subscribe({
      next: (res) => { this.distributions.set(res.data || []); this.distributionsLoading.set(false); },
      error: () => { this.distributions.set([]); this.distributionsLoading.set(false); }
    });
  }

  loadAttachments() {
    const id = this.documentId();
    if (!id) return;
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/attachments`).subscribe({
      next: (res) => this.attachments.set(res.data || []),
      error: () => {}
    });
  }

  uploadAttachment(file: File, description?: string, referenceNumber?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }

      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      if (referenceNumber) formData.append('reference_number', referenceNumber);

      this.http.post(`${environment.apiUrl}/documents/${id}/attachments`, formData).subscribe({
        next: () => {
          this.message.success('File berhasil diupload');
          this.loadAttachments();
          resolve();
        },
        error: (err) => {
          const msg = err.error?.error || 'Gagal mengupload file';
          this.message.error(msg);
          reject();
        }
      });
    });
  }

  loadSignatures() {
    const id = this.documentId();
    if (!id) return;
    this.signaturesLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/signatures`).subscribe({
      next: (res) => { this.signatures.set(res.data || []); this.signaturesLoading.set(false); },
      error: () => { this.signatures.set([]); this.signaturesLoading.set(false); }
    });
  }

  loadOCRStatus() {
    this.http.get<any>(`${environment.apiUrl}/ocr/status`).subscribe({
      next: (res) => this.ocrStatus.set(res.data),
      error: () => this.ocrStatus.set({ available: false, engine: '', version: '' })
    });
  }

  loadOCRText() {
    const id = this.documentId();
    if (!id) return;
    this.http.get<any>(`${environment.apiUrl}/documents/${id}/ocr`).subscribe({
      next: (res) => this.ocrText.set(res.data?.text || ''),
      error: () => {}
    });
  }

  runOCR(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.ocrRunning.set(true);
      this.http.post<any>(`${environment.apiUrl}/documents/${id}/ocr`, {}).subscribe({
        next: (res) => {
          this.ocrResult.set(res.data);
          this.ocrRunning.set(false);
          this.message.success('OCR selesai');
          resolve();
        },
        error: () => {
          this.ocrRunning.set(false);
          this.message.error('Gagal menjalankan OCR');
          reject();
        }
      });
    });
  }

  runAttachmentOCR(attachmentId: string, nodeId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(''); return; }

      // Update processing state
      const state = new Map(this.attachmentOcrState());
      state.set(nodeId, { ...(state.get(nodeId) || {}), ocrProcessing: true });
      this.attachmentOcrState.set(state);

      this.http.post<any>(`${environment.apiUrl}/documents/${id}/attachments/${attachmentId}/ocr`, {}).subscribe({
        next: (res) => {
          const ocrText = res.data?.text || '';
          const updated = new Map(this.attachmentOcrState());
          updated.set(nodeId, { ocrProcessing: false, ocrText });
          this.attachmentOcrState.set(updated);
          this.message.success('OCR selesai');
          // Reload attachments to get updated data from server
          this.loadAttachments();
          resolve(ocrText);
        },
        error: () => {
          const updated = new Map(this.attachmentOcrState());
          updated.set(nodeId, { ...(updated.get(nodeId) || {}), ocrProcessing: false });
          this.attachmentOcrState.set(updated);
          this.message.error('Gagal menjalankan OCR');
          reject('');
        }
      });
    });
  }

  // Comments
  addComment(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.post(`${environment.apiUrl}/documents/${id}/comments`, { content }).subscribe({
        next: () => { this.loadComments(); this.message.success('Komentar ditambahkan'); resolve(); },
        error: () => { this.message.error('Gagal menambah komentar'); reject(); }
      });
    });
  }

  addReply(commentId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.post(`${environment.apiUrl}/documents/${id}/comments/${commentId}/replies`, { content }).subscribe({
        next: () => { this.loadComments(); resolve(); },
        error: () => { this.message.error('Gagal menambah balasan'); reject(); }
      });
    });
  }

  resolveComment(commentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.patch(`${environment.apiUrl}/documents/${id}/comments/${commentId}/resolve`, {}).subscribe({
        next: () => { this.loadComments(); resolve(); },
        error: () => { this.message.error('Gagal menyelesaikan komentar'); reject(); }
      });
    });
  }

  unresolveComment(commentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.patch(`${environment.apiUrl}/documents/${id}/comments/${commentId}/unresolve`, {}).subscribe({
        next: () => { this.loadComments(); resolve(); },
        error: () => { this.message.error('Gagal membuka komentar'); reject(); }
      });
    });
  }

  deleteComment(commentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.delete(`${environment.apiUrl}/documents/${id}/comments/${commentId}`).subscribe({
        next: () => { this.loadComments(); this.message.success('Komentar dihapus'); resolve(); },
        error: () => { this.message.error('Gagal menghapus komentar'); reject(); }
      });
    });
  }

  // Signatures
  signDocument(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.post(`${environment.apiUrl}/documents/${id}/sign`, {}).subscribe({
        next: () => { this.loadSignatures(); this.message.success('Dokumen ditandatangani'); resolve(); },
        error: () => { this.message.error('Gagal menandatangani'); reject(); }
      });
    });
  }

  revokeSignature(signatureId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.patch(`${environment.apiUrl}/documents/${id}/signatures/${signatureId}/revoke`, {}).subscribe({
        next: () => { this.loadSignatures(); this.message.success('Tanda tangan dicabut'); resolve(); },
        error: () => { this.message.error('Gagal mencabut tanda tangan'); reject(); }
      });
    });
  }

  // Versions
  private downloadSvc = inject(DownloadService);

  downloadVersion(versionNumber: number) {
    const id = this.documentId();
    this.downloadSvc.download(`/documents/${id}/versions/${versionNumber}/download`);
  }

  restoreVersion(versionNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = this.documentId();
      if (!id) { reject(); return; }
      this.http.post(`${environment.apiUrl}/documents/${id}/versions/${versionNumber}/restore`, {}).subscribe({
        next: () => { 
          this.loadVersions(); 
          this.loadDocument(id);
          this.message.success('Versi berhasil direstore'); 
          resolve(); 
        },
        error: () => { this.message.error('Gagal restore versi'); reject(); }
      });
    });
  }
}
