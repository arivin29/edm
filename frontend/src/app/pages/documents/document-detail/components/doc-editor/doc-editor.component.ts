import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../../../environments/environment';

export interface EditorConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions: {
      edit: boolean;
      download: boolean;
      print: boolean;
      comment: boolean;
      review: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    mode: string;
    lang: string;
    callbackUrl: string;
    user: { id: string; name: string };
    customization?: any;
  };
  token?: string;
}

@Component({
  selector: 'app-doc-editor',
  standalone: true,
  imports: [CommonModule, NzSpinModule, NzAlertModule, NzButtonModule, NzIconModule],
  template: `
    <div class="editor-container">
      @if (loading()) {
        <div class="editor-loading">
          <nz-spin nzSimple nzSize="large"></nz-spin>
          <p class="text-gray-500 mt-3">Memuat editor dokumen...</p>
        </div>
      }

      @if (error()) {
        <div class="editor-error">
          <nz-alert nzType="warning" [nzMessage]="error()!" nzShowIcon>
          </nz-alert>
          <div class="mt-3">
            <button nz-button nzType="primary" nzSize="small" (click)="initEditor()">
              <span nz-icon nzType="reload"></span> Coba Lagi
            </button>
          </div>
        </div>
      }

      <div #editorContainer id="onlyoffice-editor-{{ documentId }}" class="editor-frame"
           [class.hidden]="loading() || error()">
      </div>
    </div>
  `,
  styles: [`
    .editor-container {
      width: 100%;
      height: 70vh;
      min-height: 500px;
      position: relative;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      overflow: hidden;
      background: #fafafa;
    }
    .editor-loading, .editor-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
    }
    .editor-frame {
      width: 100%;
      height: 100%;
    }
    .editor-frame.hidden {
      display: none;
    }
  `]
})
export class DocEditorComponent implements OnInit, OnDestroy {
  @Input() documentId!: string;
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;

  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  loading = signal(true);
  error = signal<string | null>(null);
  private editorInstance: any = null;
  private scriptLoaded = false;

  ngOnInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    this.destroyEditor();
  }

  async initEditor() {
    this.loading.set(true);
    this.error.set(null);

    try {
      // 1. Load OnlyOffice API script
      await this.loadScript();

      // 2. Get editor config from backend
      const config = await this.getEditorConfig();
      if (!config) return;

      // 3. Initialize the editor
      this.createEditor(config);
    } catch (err: any) {
      this.error.set(err.message || 'Gagal memuat editor');
      this.loading.set(false);
    }
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptLoaded || (window as any).DocsAPI) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `${environment.onlyOfficeUrl}/web-apps/apps/api/documents/api.js`;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Gagal memuat OnlyOffice. Pastikan server OnlyOffice aktif.'));
      };
      document.head.appendChild(script);
    });
  }

  private getEditorConfig(): Promise<EditorConfig | null> {
    return new Promise((resolve) => {
      this.http.get<any>(`${environment.apiUrl}/documents/${this.documentId}/editor-config`).subscribe({
        next: (res) => {
          resolve(res.data || res);
        },
        error: (err) => {
          const msg = err.error?.message || err.error?.error || 'Gagal mendapatkan konfigurasi editor';
          this.error.set(msg);
          this.loading.set(false);
          resolve(null);
        }
      });
    });
  }

  private createEditor(config: EditorConfig) {
    this.destroyEditor();

    const placeholderId = `onlyoffice-editor-${this.documentId}`;

    try {
      this.editorInstance = new (window as any).DocsAPI.DocEditor(placeholderId, {
        document: config.document,
        documentType: config.documentType,
        editorConfig: {
          ...config.editorConfig,
          customization: {
            ...config.editorConfig.customization,
            autosave: true,
            forcesave: true,
            compactHeader: true,
            hideRightMenu: false,
            toolbarNoTabs: false,
            logo: {
              image: '',
              imageEmbedded: '',
              url: ''
            }
          }
        },
        token: config.token,
        events: {
          onReady: () => {
            this.loading.set(false);
          },
          onError: (event: any) => {
            console.error('OnlyOffice Error:', event);
            this.error.set('Terjadi kesalahan pada editor dokumen');
            this.loading.set(false);
          },
          onDocumentStateChange: (event: any) => {
            // Document modified state changed
          }
        },
        type: 'desktop',
        height: '100%',
        width: '100%'
      });
    } catch (err: any) {
      this.error.set('Gagal menginisialisasi editor: ' + (err.message || ''));
      this.loading.set(false);
    }
  }

  private destroyEditor() {
    if (this.editorInstance) {
      try {
        this.editorInstance.destroyEditor();
      } catch (e) {
        // Ignore destroy errors
      }
      this.editorInstance = null;
    }
  }
}
