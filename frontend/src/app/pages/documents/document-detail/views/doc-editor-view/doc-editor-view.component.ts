import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentDetailService } from '../../document-detail.service';
import { DocEditorComponent } from '../../components/doc-editor/doc-editor.component';

@Component({
  selector: 'app-doc-editor-view',
  standalone: true,
  imports: [CommonModule, DocEditorComponent],
  templateUrl: './doc-editor-view.component.html',
  styleUrl: './doc-editor-view.component.scss'
})
export class DocEditorViewComponent {
  docService = inject(DocumentDetailService);
}
