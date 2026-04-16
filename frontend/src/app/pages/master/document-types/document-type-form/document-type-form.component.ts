import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-document-type-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzFormModule, NzInputModule, NzButtonModule,
    NzSelectModule, NzSwitchModule, NzIconModule
  ],
  templateUrl: './document-type-form.component.html',
  styleUrls: ['./document-type-form.component.scss']
})
export class DocumentTypeFormComponent {
  @Input() formData: any = {};
  @Input() saving = false;
  @Output() formSubmit = new EventEmitter<void>();

  iconOptions = [
    'file-text', 'file-word', 'file-pdf', 'file-excel', 'file',
    'folder', 'folder-open', 'solution', 'audit', 'safety-certificate',
    'profile', 'idcard', 'contacts', 'bank', 'insurance',
    'dollar', 'money-collect', 'read', 'book', 'snippets',
    'container', 'database', 'form', 'table', 'ordered-list',
    'apartment', 'shop', 'team', 'user', 'calendar',
    'mail', 'notification', 'setting', 'tool', 'build'
  ];

  onSubmit() {
    this.formSubmit.emit();
  }
}
