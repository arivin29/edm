import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

export interface PreviewFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
  version?: string;
  uploadedBy?: string;
  modifiedAt?: string;
  description?: string;
  tags?: string[];
}

@Component({
  selector: 'app-doc-preview',
  standalone: true,
  imports: [
    CommonModule, NzDrawerModule, NzButtonModule, NzIconModule,
    NzSpinModule, NzEmptyModule, NzTagModule, NzToolTipModule, NzDescriptionsModule
  ],
  templateUrl: './doc-preview.component.html',
  styleUrls: ['./doc-preview.component.scss']
})
export class DocPreviewComponent {
  private sanitizer: DomSanitizer;

  @Input() set file(val: PreviewFile | null) {
    this._file.set(val);
    if (val) {
      setTimeout(() => {
        this.visible.set(true);
        this.loading.set(true);
      });
    }
  }

  @Output() closed = new EventEmitter<void>();
  @Output() download = new EventEmitter<PreviewFile>();

  _file = signal<PreviewFile | null>(null);
  visible = signal(false);
  loading = signal(false);

  previewType = computed<'pdf' | 'image' | 'office' | 'text' | 'unsupported'>(() => {
    const f = this._file();
    if (!f) return 'unsupported';
    const mime = f.mimeType?.toLowerCase() || '';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.startsWith('image/')) return 'image';
    if (mime.includes('text/') || mime.includes('csv') || mime.includes('json') || mime.includes('xml')) return 'text';
    if (mime.includes('word') || mime.includes('document') ||
        mime.includes('sheet') || mime.includes('excel') ||
        mime.includes('presentation') || mime.includes('powerpoint')) return 'office';
    return 'unsupported';
  });

  previewUrl = computed<SafeResourceUrl | null>(() => {
    const f = this._file();
    if (!f?.url) return null;
    const type = this.previewType();
    if (type === 'pdf' || type === 'image' || type === 'text') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(f.url);
    }
    if (type === 'office') {
      // Use Office Online viewer for preview
      const encodedUrl = encodeURIComponent(f.url);
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`
      );
    }
    return null;
  });

  constructor(sanitizer: DomSanitizer) {
    this.sanitizer = sanitizer;
  }

  onClose() {
    this.visible.set(false);
    this._file.set(null);
    this.closed.emit();
  }

  onDownload() {
    const f = this._file();
    if (f) this.download.emit(f);
  }

  onIframeLoad() {
    this.loading.set(false);
  }

  onImageLoad() {
    this.loading.set(false);
  }

  getFileIcon(): string {
    const f = this._file();
    if (!f) return 'file';
    const mime = f.mimeType?.toLowerCase() || '';
    if (mime.includes('pdf')) return 'file-pdf';
    if (mime.includes('word') || mime.includes('document')) return 'file-word';
    if (mime.includes('sheet') || mime.includes('excel')) return 'file-excel';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'file-ppt';
    if (mime.startsWith('image/')) return 'file-image';
    if (mime.includes('zip') || mime.includes('rar')) return 'file-zip';
    return 'file';
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
