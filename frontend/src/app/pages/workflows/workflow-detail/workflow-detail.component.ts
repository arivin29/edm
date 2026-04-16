import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment';
import { Workflow, WorkflowStep, DropdownItem } from '../workflow.models';
import { WorkflowFormComponent } from '../workflow-form/workflow-form.component';
import { WorkflowStepFormComponent } from '../workflow-step-form/workflow-step-form.component';

@Component({
  selector: 'app-workflow-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule, NzIconModule, NzTagModule, NzSpinModule,
    NzToolTipModule, NzDividerModule, NzEmptyModule, NzModalModule,
    WorkflowFormComponent, WorkflowStepFormComponent
  ],
  templateUrl: './workflow-detail.component.html',
  styleUrl: './workflow-detail.component.scss'
})
export class WorkflowDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  workflow = signal<Workflow | null>(null);
  steps = signal<WorkflowStep[]>([]);
  loading = signal(false);
  loadingSteps = signal(false);

  // Dropdown data for forms
  companies = signal<DropdownItem[]>([]);
  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);
  users = signal<DropdownItem[]>([]);
  roles = signal<DropdownItem[]>([]);
  positions = signal<DropdownItem[]>([]);

  // Edit workflow drawer
  editFormVisible = false;

  // Step form drawer
  stepFormVisible = false;
  stepEditData: WorkflowStep | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWorkflow(id);
      this.loadSteps(id);
      this.loadDropdowns();
    }
  }

  goBack() {
    this.router.navigate(['/workflows']);
  }

  // ── Data Loading ──

  loadWorkflow(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/workflows/${id}`).subscribe({
      next: (res) => {
        this.workflow.set(res.data || res);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat data workflow');
        this.loading.set(false);
        this.goBack();
      }
    });
  }

  loadSteps(workflowId: string) {
    this.loadingSteps.set(true);
    this.http.get<any>(`${environment.apiUrl}/workflows/${workflowId}/steps`).subscribe({
      next: (res) => {
        const sorted = (res.data || []).sort((a: WorkflowStep, b: WorkflowStep) => a.step_order - b.step_order);
        this.steps.set(sorted);
        this.loadingSteps.set(false);
      },
      error: () => {
        this.steps.set([]);
        this.loadingSteps.set(false);
      }
    });
  }

  loadDropdowns() {
    forkJoin({
      companies: this.http.get<any>(`${environment.apiUrl}/companies`),
      documentTypes: this.http.get<any>(`${environment.apiUrl}/document-types`),
      categories: this.http.get<any>(`${environment.apiUrl}/categories`),
      departments: this.http.get<any>(`${environment.apiUrl}/departments`),
      users: this.http.get<any>(`${environment.apiUrl}/users`),
      roles: this.http.get<any>(`${environment.apiUrl}/roles`),
      positions: this.http.get<any>(`${environment.apiUrl}/positions`),
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.documentTypes.set(res.documentTypes.data || []);
        this.categories.set(res.categories.data || []);
        this.departments.set(res.departments.data || []);
        this.users.set(res.users.data || []);
        this.roles.set(res.roles.data || []);
        this.positions.set(res.positions.data || []);
      },
      error: () => this.message.error('Gagal memuat data referensi')
    });
  }

  // ── Edit Workflow ──

  openEditForm() {
    this.editFormVisible = true;
  }

  onEditFormClosed() {
    this.editFormVisible = false;
  }

  onEditFormSaved() {
    this.editFormVisible = false;
    const id = this.workflow()?.id;
    if (id) this.loadWorkflow(id);
  }

  // ── Step Form ──

  openStepForm(step?: WorkflowStep) {
    this.stepEditData = step || null;
    this.stepFormVisible = true;
  }

  onStepFormClosed() {
    this.stepFormVisible = false;
    this.stepEditData = null;
  }

  onStepFormSaved() {
    this.stepFormVisible = false;
    this.stepEditData = null;
    const id = this.workflow()?.id;
    if (id) {
      this.loadSteps(id);
      this.loadWorkflow(id);
    }
  }

  // ── Step Actions ──

  confirmDeleteStep(step: WorkflowStep) {
    const wfId = this.workflow()?.id;
    if (!wfId) return;
    this.modal.confirm({
      nzTitle: 'Hapus Langkah?',
      nzContent: `Yakin ingin menghapus langkah "${step.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete<any>(`${environment.apiUrl}/workflows/${wfId}/steps/${step.id}`).subscribe({
          next: () => {
            this.message.success('Langkah berhasil dihapus');
            this.loadSteps(wfId);
            this.loadWorkflow(wfId);
          },
          error: (err) => this.message.error(err?.error?.message || 'Gagal menghapus langkah')
        });
      }
    });
  }

  moveStep(index: number, direction: -1 | 1) {
    const wfId = this.workflow()?.id;
    if (!wfId) return;
    const current = [...this.steps()];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const temp = current[index].step_order;
    current[index].step_order = current[targetIndex].step_order;
    current[targetIndex].step_order = temp;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.steps.set(current);

    const stepOrders = current.map((s, i) => ({ id: s.id, step_order: i + 1 }));
    this.http.put<any>(`${environment.apiUrl}/workflows/${wfId}/steps/reorder`, { steps: stepOrders }).subscribe({
      next: (res) => {
        if (res.data) {
          const sorted = res.data.sort((a: WorkflowStep, b: WorkflowStep) => a.step_order - b.step_order);
          this.steps.set(sorted);
        }
      },
      error: () => {
        this.message.error('Gagal mengubah urutan langkah');
        this.loadSteps(wfId);
      }
    });
  }

  // ── Helpers ──

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  getStepTypeLabel(type: string): string {
    const map: Record<string, string> = { approval: 'Persetujuan', review: 'Review', notification: 'Notifikasi' };
    return map[type] || type;
  }

  getStepTypeColor(type: string): string {
    const map: Record<string, string> = { approval: 'green', review: 'blue', notification: 'orange' };
    return map[type] || 'default';
  }

  getAssigneeTypeLabel(type: string): string {
    const map: Record<string, string> = { user: 'Pengguna', role: 'Role', position: 'Jabatan', department: 'Departemen' };
    return map[type] || type;
  }

  getRejectActionLabel(action: string): string {
    const map: Record<string, string> = {
      to_creator: 'Kembali ke pembuat',
      to_previous: 'Ke langkah sebelumnya',
      to_step: 'Ke langkah tertentu'
    };
    return map[action] || action || '-';
  }
}
