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
import { DocumentDetailService } from '../../document-detail.service';
import { formatDate } from '../../../document.models';

@Component({
  selector: 'app-doc-comments-view',
  standalone: true,
  imports: [CommonModule, FormsModule, NzAvatarModule, NzButtonModule, NzIconModule, NzInputModule, NzToolTipModule, NzSpinModule, NzEmptyModule],
  templateUrl: './doc-comments-view.component.html',
  styleUrl: './doc-comments-view.component.scss'
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
