import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Company, Office, Department, OrgType } from '../organization.models';

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule
  ],
  templateUrl: './organization-form.component.html',
  styleUrl: './organization-form.component.scss'
})
export class OrganizationFormComponent {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() visible = false;
  @Input() type: OrgType = 'company';
  @Input() editData: any = null;
  @Input() companies: Company[] = [];
  @Input() offices: Office[] = [];
  @Input() departments: Department[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  formData: any = {};

  get drawerTitle(): string {
    const label = this.getTypeLabel(this.type);
    return this.editData ? `Edit ${label}` : `Tambah ${label}`;
  }

  ngOnChanges() {
    if (this.visible) {
      if (this.editData) {
        this.formData = { ...this.editData };
      } else {
        this.formData = { code: '', name: '', is_active: true };
        if (this.type === 'position') this.formData.level = 1;
      }
    }
  }

  close() {
    this.formData = {};
    this.closed.emit();
  }

  save() {
    if (!this.formData.code?.trim() || !this.formData.name?.trim()) {
      this.message.warning('Kode dan Nama wajib diisi');
      return;
    }

    if (this.type === 'office' && !this.formData.company_id) {
      this.message.warning('Company wajib dipilih');
      return;
    }
    if (this.type === 'department' && !this.formData.office_id) {
      this.message.warning('Office wajib dipilih');
      return;
    }
    if (this.type === 'section' && !this.formData.department_id) {
      this.message.warning('Department wajib dipilih');
      return;
    }
    if (this.type === 'position' && (!this.formData.level || this.formData.level < 1)) {
      this.message.warning('Level wajib diisi (minimal 1)');
      return;
    }

    this.saving.set(true);

    const endpoint = `${environment.apiUrl}/${this.getEndpoint(this.type)}`;
    const editId = this.editData?.id;
    const request$ = editId
      ? this.http.put(`${endpoint}/${editId}`, this.formData)
      : this.http.post(endpoint, this.formData);

    request$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.saving.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        console.error('Save error:', err);
        this.message.error('Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  private getTypeLabel(type: OrgType): string {
    const labels: Record<OrgType, string> = {
      company: 'Company', office: 'Office', department: 'Department',
      section: 'Section', position: 'Position'
    };
    return labels[type];
  }

  private getEndpoint(type: OrgType): string {
    const endpoints: Record<OrgType, string> = {
      company: 'companies', office: 'offices', department: 'departments',
      section: 'sections', position: 'positions'
    };
    return endpoints[type];
  }
}
