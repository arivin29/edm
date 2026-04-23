import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DocumentDetailService } from '../../document-detail.service';

@Component({
  selector: 'app-doc-ocr-view',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzSpinModule, NzTagModule],
  templateUrl: './doc-ocr-view.component.html',
  styleUrl: './doc-ocr-view.component.scss'
})
export class DocOcrViewComponent implements OnInit {
  docService = inject(DocumentDetailService);

  ngOnInit(): void {
    if (!this.docService.ocrStatus()) {
      this.docService.loadOCRStatus();
      this.docService.loadOCRText();
    }
  }

  async runOCR(): Promise<void> {
    await this.docService.runOCR();
  }
}
