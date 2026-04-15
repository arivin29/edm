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
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface DocumentDetail {
  id: number;
  document_number: string;
  title: string;
  description: string;
  type_name: string;
  category_name: string;
  status: string;
  creator_name: string;
  department_name: string;
  section_name: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  versions?: any[];
  comments?: any[];
  workflow?: any;
}

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzTagModule,
    NzDescriptionsModule, NzTabsModule, NzTimelineModule,
    NzCommentModule, NzAvatarModule, NzInputModule, NzSpinModule
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
            </div>
            <p class="text-gray-500 text-xs m-0">{{ document()!.document_number || 'Belum ada nomor' }}</p>
          </div>
          <div class="flex gap-2">
            <button nz-button nzSize="small" [routerLink]="['/documents', document()!.id, 'edit']">
              <span nz-icon nzType="edit"></span> Edit
            </button>
            @if (document()!.status === 'draft') {
              <button nz-button nzType="primary" nzSize="small" (click)="submitForReview()">
                <span nz-icon nzType="send"></span> Submit Review
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
                <nz-descriptions-item nzTitle="Tipe">{{ document()!.type_name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Kategori">{{ document()!.category_name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Pembuat">{{ document()!.creator_name }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Versi">v{{ document()!.current_version }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Department">{{ document()!.department_name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Section">{{ document()!.section_name || '-' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Dibuat">{{ document()!.created_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
                <nz-descriptions-item nzTitle="Diperbarui">{{ document()!.updated_at | date:'dd MMM yyyy HH:mm' }}</nz-descriptions-item>
              </nz-descriptions>
              @if (document()!.description) {
                <div class="mt-3 pt-3 border-t">
                  <div class="text-xs text-gray-500 mb-1">Deskripsi</div>
                  <div class="text-sm">{{ document()!.description }}</div>
                </div>
              }
            </nz-card>

            <!-- Tabs: Versions, Comments -->
            <nz-card nzSize="small" class="mt-3">
              <nz-tabset nzSize="small">
                <nz-tab nzTitle="Versi">
                  <nz-timeline>
                    @for (v of document()!.versions || []; track v.id) {
                      <nz-timeline-item [nzColor]="v.is_current ? 'blue' : 'gray'">
                        <div class="flex justify-between">
                          <span class="font-medium">v{{ v.version }}</span>
                          <span class="text-xs text-gray-500">{{ v.created_at | date:'dd/MM/yy HH:mm' }}</span>
                        </div>
                        <div class="text-xs text-gray-500">{{ v.change_summary || 'Tidak ada catatan' }}</div>
                      </nz-timeline-item>
                    } @empty {
                      <div class="text-gray-500 text-sm">Belum ada riwayat versi</div>
                    }
                  </nz-timeline>
                </nz-tab>
                <nz-tab nzTitle="Komentar">
                  <div class="space-y-3">
                    @for (c of document()!.comments || []; track c.id) {
                      <nz-comment [nzAuthor]="c.user_name" [nzDatetime]="formatDate(c.created_at)">
                        <nz-avatar nz-comment-avatar nzIcon="user" [nzSrc]="c.user_avatar"></nz-avatar>
                        <nz-comment-content>
                          <p class="text-sm m-0">{{ c.content }}</p>
                        </nz-comment-content>
                      </nz-comment>
                    } @empty {
                      <div class="text-gray-500 text-sm">Belum ada komentar</div>
                    }

                    <!-- Add comment -->
                    <div class="flex gap-2 mt-3">
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
                </nz-tab>
              </nz-tabset>
            </nz-card>
          </div>

          <!-- Sidebar: Workflow -->
          <div>
            <nz-card nzSize="small" nzTitle="Status Workflow">
              @if (document()!.workflow) {
                <nz-timeline>
                  @for (step of document()!.workflow.steps || []; track step.id) {
                    <nz-timeline-item [nzColor]="getStepColor(step.status)">
                      <div class="font-medium text-sm">{{ step.name }}</div>
                      <div class="text-xs text-gray-500">{{ step.assignee_name }}</div>
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
                <button nz-button nzBlock nzSize="small">
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

  document = signal<DocumentDetail | null>(null);
  loading = signal(true);
  newComment = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocument(+id);
    }
  }

  loadDocument(id: number) {
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

  submitForReview() {
    const doc = this.document();
    if (!doc) return;
    
    this.http.post(`${environment.apiUrl}/documents/${doc.id}/submit`, {}).subscribe({
      next: () => {
        this.message.success('Dokumen berhasil disubmit untuk review');
        this.loadDocument(doc.id);
      },
      error: () => this.message.error('Gagal submit dokumen')
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
        this.loadDocument(doc.id);
      },
      error: () => this.message.error('Gagal menambahkan komentar')
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default', in_review: 'processing', approved: 'success',
      final: 'blue', archived: 'default', revision: 'warning'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', in_review: 'Review', approved: 'Approved',
      final: 'Final', archived: 'Archived', revision: 'Revisi'
    };
    return labels[status] || status;
  }

  getStepColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'gray', in_progress: 'blue', completed: 'green', rejected: 'red'
    };
    return colors[status] || 'gray';
  }
}
