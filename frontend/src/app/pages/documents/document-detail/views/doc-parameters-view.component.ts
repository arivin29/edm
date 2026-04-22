import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../document-detail.service';
import { DocParametersComponent } from '../components/doc-parameters/doc-parameters.component';

@Component({
  selector: 'app-doc-parameters-view',
  standalone: true,
  imports: [CommonModule, NzEmptyModule, DocParametersComponent],
  template: `
    @if (docService.document(); as doc) {
      @if (doc.template?.id) {
        <app-doc-parameters
          [templateId]="doc.template!.id"
          [templateName]="doc.template!.name"
          [metadata]="doc.metadata || {}"
          [documentStatus]="doc.status"
          [documentId]="doc.id"
          (metadataUpdated)="onMetadataUpdated($event)"
        ></app-doc-parameters>
      } @else {
        <nz-empty nzNotFoundContent="Dokumen belum memiliki template"></nz-empty>
      }
    }
  `
})
export class DocParametersViewComponent {
  docService = inject(DocumentDetailService);

  onMetadataUpdated(metadata: any) {
    const doc = this.docService.document();
    if (doc) {
      this.docService.document.set({ ...doc, metadata });
    }
  }
}
