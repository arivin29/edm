import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { SystemSetting, DropdownItem } from '../settings.models';

@Component({
  selector: 'app-settings-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzFormModule, NzInputModule,
    NzSelectModule, NzSwitchModule, NzInputNumberModule
  ],
  templateUrl: './settings-form.component.html',
  styleUrls: ['./settings-form.component.scss']
})
export class SettingsFormComponent implements OnChanges {
  @Input() setting: SystemSetting | null = null;
  @Input() companies: DropdownItem[] = [];
  @Input() offices: DropdownItem[] = [];
  @Input() saving = false;
  @Output() save = new EventEmitter<{ data: any; isEdit: boolean }>();

  formData: any = { key: '', value: '', type: 'string', description: '', company_id: null, office_id: null };
  formBoolValue = false;
  formNumValue: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['setting']) {
      this.resetForm(this.setting);
    }
  }

  private resetForm(item: SystemSetting | null): void {
    if (item) {
      this.formData = {
        key: item.key,
        value: item.value,
        type: item.type,
        description: item.description || '',
        company_id: item.company_id || null,
        office_id: item.office_id || null
      };
      if (item.type === 'boolean') this.formBoolValue = item.value === 'true';
      if (item.type === 'number') this.formNumValue = Number(item.value) || 0;
    } else {
      this.formData = { key: '', value: '', type: 'string', description: '', company_id: null, office_id: null };
      this.formBoolValue = false;
      this.formNumValue = 0;
    }
  }

  onTypeChange(type: string): void {
    switch (type) {
      case 'boolean':
        this.formBoolValue = false;
        this.formData.value = 'false';
        break;
      case 'number':
        this.formNumValue = 0;
        this.formData.value = '0';
        break;
      case 'json':
        this.formData.value = '{}';
        break;
      default:
        this.formData.value = '';
    }
  }

  onSave(): void {
    if (this.formData.type === 'boolean') {
      this.formData.value = String(this.formBoolValue);
    } else if (this.formData.type === 'number') {
      this.formData.value = String(this.formNumValue ?? 0);
    }

    this.save.emit({
      data: { ...this.formData },
      isEdit: !!this.setting
    });
  }
}
