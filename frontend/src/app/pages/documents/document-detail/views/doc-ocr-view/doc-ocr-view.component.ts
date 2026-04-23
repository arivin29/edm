import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../../document-detail.service';

@Component({
  selector: 'app-doc-ocr-view',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzSpinModule, NzTagModule, NzCollapseModule, NzEmptyModule],
  templateUrl: './doc-ocr-view.component.html',
  styleUrl: './doc-ocr-view.component.scss'
})
export class DocOcrViewComponent implements OnInit {
  docService = inject(DocumentDetailService);

  attachmentOcrItems = computed(() => {
    const atts = this.docService.attachments();
    const ocrState = this.docService.attachmentOcrState();
    return atts
      .filter(att => att.mime_type?.includes('pdf') || att.mime_type?.includes('image'))
      .map(att => {
        const nodeId = `att-${att.id}`;
        const state = ocrState.get(nodeId);
        return {
          id: att.id,
          nodeId,
          name: att.original_name,
          mimeType: att.mime_type,
          ocrText: state?.ocrText || att.ocr_text || '',
          processing: state?.ocrProcessing || false
        };
      });
  });

  hasAnyOcr = computed(() => {
    return !!this.docService.ocrText() || !!this.docService.ocrResult()?.text ||
      this.attachmentOcrItems().some(a => !!a.ocrText);
  });

  ngOnInit(): void {
    if (!this.docService.ocrStatus()) {
      this.docService.loadOCRStatus();
      this.docService.loadOCRText();
    }
  }

  async runOCR(): Promise<void> {
    await this.docService.runOCR();
  }

  runAttachmentOCR(attId: string, nodeId: string): void {
    this.docService.runAttachmentOCR(attId, nodeId);
  }
}
