import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../../document-detail.service';
import { formatDate, formatFileSize } from '../../../document.models';

@Component({
  selector: 'app-doc-versions-view',
  standalone: true,
  imports: [CommonModule, NzTimelineModule, NzTagModule, NzButtonModule, NzIconModule, NzToolTipModule, NzSpinModule, NzEmptyModule],
  templateUrl: './doc-versions-view.component.html',
  styleUrl: './doc-versions-view.component.scss'
})
export class DocVersionsViewComponent {
  docService = inject(DocumentDetailService);
  formatDate = formatDate;
  formatFileSize = formatFileSize;
}
