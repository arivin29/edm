import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDetailService } from '../document-detail.service';
import { FileManagerComponent } from '../components/file-manager/file-manager.component';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-doc-files-view',
  standalone: true,
  imports: [CommonModule, FileManagerComponent],
  template: `
    <app-file-manager
      [config]="fileConfig"
      [tree]="docService.fileTree()"
      (fileDownload)="onDownload($event)"
      (filePreview)="onPreview($event)"
      (fileDelete)="onDelete($event)"
      (fileUpload)="onUpload($event)"
      (fileOcr)="onOcr($event)"
    ></app-file-manager>
  `
})
export class DocFilesViewComponent implements OnInit {
  docService = inject(DocumentDetailService);
  private message = inject(NzMessageService);
  private http = inject(HttpClient);

  fileConfig = {
    documentId: '',
    readonly: false,
    showUpload: true,
    showCreateFolder: false,
    showVersions: true
  };

  ngOnInit() {
    this.fileConfig.documentId = this.docService.documentId();
    const doc = this.docService.document();
    this.fileConfig.readonly = doc?.status === 'final' || doc?.status === 'archived';
  }

  onDownload(file: any) {
    if (file.id.startsWith('ver-')) {
      const verId = file.id.replace('ver-', '');
      window.open(`${environment.apiUrl}/documents/${this.docService.documentId()}/versions/${verId}/download`, '_blank');
    } else if (file.id.startsWith('att-')) {
      const attId = file.id.replace('att-', '');
      window.open(`${environment.apiUrl}/documents/${this.docService.documentId()}/attachments/${attId}/download`, '_blank');
    }
  }

  onPreview(file: any) {
    // Preview logic - could open modal
    console.log('Preview:', file);
  }

  onDelete(file: any) {
    if (file.id.startsWith('att-')) {
      const attId = file.id.replace('att-', '');
      this.http.delete(`${environment.apiUrl}/documents/${this.docService.documentId()}/attachments/${attId}`).subscribe({
        next: () => {
          this.message.success('File dihapus');
          this.docService.loadAttachments();
        },
        error: () => this.message.error('Gagal menghapus file')
      });
    }
  }

  onUpload(data: any) {
    // Upload handled by file manager
    this.docService.loadAttachments();
  }

  onOcr(file: any) {
    // OCR logic
    console.log('OCR:', file);
  }
}
