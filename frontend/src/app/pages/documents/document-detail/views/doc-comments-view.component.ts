import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../document-detail.service';
import { formatDate } from '../../document.models';

@Component({
  selector: 'app-doc-comments-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NzAvatarModule, NzButtonModule, NzIconModule, NzInputModule, NzToolTipModule, NzSpinModule, NzEmptyModule],
  template: `
    @if (docService.commentsLoading()) {
      <div class="text-center py-8"><nz-spin nzSimple></nz-spin></div>
    } @else {
      <div class="comments-view">
        @for (c of docService.comments(); track c.id) {
          <div class="comment" [class.comment--resolved]="c.is_resolved">
            <nz-avatar nzIcon="user" [nzSize]="28" [style.background-color]="c.is_resolved ? '#d4d4d8' : '#0284c7'"></nz-avatar>
            <div class="comment__body">
              <div class="comment__header">
                <span class="comment__author">{{ c.user?.name || 'Anonim' }}</span>
                <span class="comment__time">{{ formatDate(c.created_at) }}</span>
                @if (c.is_resolved) {
                  <span class="comment__resolved">
                    <span nz-icon nzType="check-circle" nzTheme="fill"></span> Terselesaikan
                  </span>
                }
                <span class="comment__actions">
                  @if (c.is_resolved) {
                    <button nz-button nzSize="small" nzType="text" nz-tooltip="Buka kembali" (click)="docService.unresolveComment(c.id)">
                      <span nz-icon nzType="undo"></span>
                    </button>
                  } @else {
                    <button nz-button nzSize="small" nzType="text" nz-tooltip="Selesaikan" (click)="docService.resolveComment(c.id)">
                      <span nz-icon nzType="check"></span>
                    </button>
                  }
                  <button nz-button nzSize="small" nzType="text" nzDanger nz-tooltip="Hapus" (click)="docService.deleteComment(c.id)">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </span>
              </div>
              <p class="comment__content">{{ c.content }}</p>

              @if (c.replies && c.replies.length > 0) {
                <div class="comment__replies">
                  @for (r of c.replies; track r.id) {
                    <div class="comment__reply">
                      <span class="comment__author">{{ r.user?.name || 'Anonim' }}</span>
                      <span class="comment__time">{{ formatDate(r.created_at) }}</span>
                      <p class="comment__content">{{ r.content }}</p>
                    </div>
                  }
                </div>
              }

              @if (replyingTo === c.id) {
                <div class="comment__reply-input">
                  <textarea nz-input [(ngModel)]="replyContent" placeholder="Tulis balasan..." [nzAutosize]="{ minRows: 1, maxRows: 3 }"></textarea>
                  <div class="flex gap-1 mt-1">
                    <button nz-button nzSize="small" nzType="primary" [disabled]="!replyContent.trim()" (click)="addReply(c.id)">Balas</button>
                    <button nz-button nzSize="small" (click)="replyingTo = null">Batal</button>
                  </div>
                </div>
              } @else {
                <button nz-button nzSize="small" nzType="text" class="comment__reply-btn" (click)="replyingTo = c.id">
                  <span nz-icon nzType="message"></span> Balas
                </button>
              }
            </div>
          </div>
        } @empty {
          <nz-empty nzNotFoundContent="Belum ada komentar"></nz-empty>
        }

        <!-- New Comment -->
        <div class="comment-composer">
          <nz-avatar nzIcon="user" [nzSize]="28" style="background-color: #0284c7"></nz-avatar>
          <div class="comment-composer__input">
            <textarea nz-input [(ngModel)]="newComment" placeholder="Tulis komentar..." [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
            <button nz-button nzType="primary" nzSize="small" class="mt-2" [disabled]="!newComment.trim()" (click)="addComment()">
              <span nz-icon nzType="send"></span> Kirim
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .comments-view { @apply space-y-4; }
    .comment { @apply flex gap-3 bg-white rounded-lg border border-gray-200 p-3; }
    .comment--resolved { @apply opacity-60 bg-gray-50; }
    .comment__body { @apply flex-1 min-w-0; }
    .comment__header { @apply flex items-center gap-2 flex-wrap text-xs mb-1; }
    .comment__author { @apply font-medium text-gray-800; }
    .comment__time { @apply text-gray-400; }
    .comment__resolved { @apply text-green-600 flex items-center gap-0.5; }
    .comment__actions { @apply ml-auto flex gap-1; }
    .comment__content { @apply text-sm text-gray-700 m-0; }
    .comment__replies { @apply mt-3 pl-4 border-l-2 border-gray-200 space-y-2; }
    .comment__reply { @apply text-xs; }
    .comment__reply-btn { @apply text-xs text-gray-500 mt-2; }
    .comment__reply-input { @apply mt-2; }
    .comment-composer { @apply flex gap-3 pt-4 border-t border-gray-200 mt-4; }
    .comment-composer__input { @apply flex-1; }
  `]
})
export class DocCommentsViewComponent implements OnInit {
  docService = inject(DocumentDetailService);
  formatDate = formatDate;

  newComment = '';
  replyContent = '';
  replyingTo: string | null = null;

  ngOnInit() {
    if (this.docService.comments().length === 0) {
      this.docService.loadComments();
    }
  }

  addComment() {
    if (!this.newComment.trim()) return;
    this.docService.addComment(this.newComment).then(() => {
      this.newComment = '';
    });
  }

  addReply(commentId: string) {
    if (!this.replyContent.trim()) return;
    this.docService.addReply(commentId, this.replyContent).then(() => {
      this.replyContent = '';
      this.replyingTo = null;
    });
  }
}
