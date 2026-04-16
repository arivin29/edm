import { Component, inject, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { WorkflowStep, DropdownItem } from '../workflow.models';

@Component({
  selector: 'app-workflow-step-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzInputNumberModule,
    NzSelectModule, NzButtonModule, NzCheckboxModule, NzSpinModule
  ],
  templateUrl: './workflow-step-form.component.html',
  styleUrl: './workflow-step-form.component.scss'
})
export class WorkflowStepFormComponent {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  @Input() visible = false;
  @Input() workflowId: string = '';
  @Input() editData: WorkflowStep | null = null;
  @Input() existingSteps: WorkflowStep[] = [];
  @Input() users: DropdownItem[] = [];
  @Input() roles: DropdownItem[] = [];
  @Input() positions: DropdownItem[] = [];
  @Input() departments: DropdownItem[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  formData: any = {};

  get drawerTitle(): string {
    return this.editData ? 'Edit Langkah' : 'Tambah Langkah';
  }

  ngOnChanges() {
    if (this.visible) {
      if (this.editData) {
        this.formData = {
          name: this.editData.name,
          step_type: this.editData.step_type,
          assignee_type: this.editData.assignee_type,
          assignee_user_id: this.editData.assignee_user_id || null,
          assignee_role_id: this.editData.assignee_role_id || null,
          assignee_position_id: this.editData.assignee_position_id || null,
          assignee_department_id: this.editData.assignee_department_id || null,
          is_parallel: this.editData.is_parallel,
          required_approvals: this.editData.required_approvals,
          on_reject_action: this.editData.on_reject_action,
          reject_to_step_id: this.editData.reject_to_step_id || null,
          deadline_days: this.editData.deadline_days ?? null,
          can_edit: this.editData.can_edit,
          can_comment: this.editData.can_comment,
          can_delegate: this.editData.can_delegate,
          instructions: this.editData.instructions || ''
        };
      } else {
        this.formData = {
          name: '', step_type: 'approval', assignee_type: 'user',
          assignee_user_id: null, assignee_role_id: null,
          assignee_position_id: null, assignee_department_id: null,
          is_parallel: false, required_approvals: 1,
          on_reject_action: 'to_creator', reject_to_step_id: null,
          deadline_days: null, can_edit: false, can_comment: true,
          can_delegate: false, instructions: ''
        };
      }
    }
  }

  close() {
    this.formData = {};
    this.closed.emit();
  }

  onAssigneeTypeChange() {
    this.formData.assignee_user_id = null;
    this.formData.assignee_role_id = null;
    this.formData.assignee_position_id = null;
    this.formData.assignee_department_id = null;
  }

  save() {
    if (!this.formData.name?.trim()) {
      this.message.warning('Nama langkah wajib diisi');
      return;
    }
    if (!this.formData.step_type) {
      this.message.warning('Tipe langkah wajib dipilih');
      return;
    }
    if (!this.formData.assignee_type) {
      this.message.warning('Tipe penerima wajib dipilih');
      return;
    }
    const assigneeField = `assignee_${this.formData.assignee_type}_id`;
    if (!this.formData[assigneeField]) {
      this.message.warning('Penerima wajib dipilih');
      return;
    }

    this.saving.set(true);
    const editId = this.editData?.id;
    const req$ = editId
      ? this.http.put<any>(`${environment.apiUrl}/workflows/${this.workflowId}/steps/${editId}`, this.formData)
      : this.http.post<any>(`${environment.apiUrl}/workflows/${this.workflowId}/steps`, this.formData);

    req$.subscribe({
      next: () => {
        this.message.success(editId ? 'Langkah berhasil diperbarui' : 'Langkah berhasil ditambahkan');
        this.saving.set(false);
        this.close();
        this.saved.emit();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan langkah');
        this.saving.set(false);
      }
    });
  }
}
