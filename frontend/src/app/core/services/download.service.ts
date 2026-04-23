import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  /**
   * Download a file from an authenticated API endpoint.
   * Uses HttpClient (which has the auth interceptor) to fetch as blob,
   * then triggers a browser download via a temporary object URL.
   */
  download(apiPath: string, fallbackFileName = 'download') {
    const url = `${environment.apiUrl}${apiPath}`;
    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (resp) => {
        const blob = resp.body;
        if (!blob) return;

        // Extract filename from Content-Disposition header if available
        const cd = resp.headers.get('Content-Disposition');
        let fileName = fallbackFileName;
        if (cd) {
          const match = cd.match(/filename[^;=\n]*=(?:UTF-8''|"?)([^";\n]+)/i);
          if (match?.[1]) fileName = decodeURIComponent(match[1]);
        }

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => this.message.error('Gagal download file'),
    });
  }
}
