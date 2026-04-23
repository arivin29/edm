import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { DocumentDetailService } from '../../document-detail.service';
import { DocParametersComponent } from '../../components/doc-parameters/doc-parameters.component';

@Component({
  selector: 'app-doc-parameters-view',
  standalone: true,
  imports: [CommonModule, NzEmptyModule, DocParametersComponent],
  templateUrl: './doc-parameters-view.component.html',
  styleUrl: './doc-parameters-view.component.scss'
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
