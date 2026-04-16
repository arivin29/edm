import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { DocumentCategory } from '../category.models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzInputModule, NzFormModule,
    NzSelectModule, NzSwitchModule
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent {
  @Input() formData: any = {};
  @Input() parentOptions: DocumentCategory[] = [];
  @Input() saving = false;
  @Output() save = new EventEmitter<any>();

  onSave() {
    this.save.emit(this.formData);
  }
}
