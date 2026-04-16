import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { environment } from '../../../../environments/environment';
import { Workflow, DropdownItem } from '../workflow.models';
import { WorkflowFormComponent } from '../workflow-form/workflow-form.component';

@Component({
  selector: 'app-workflow-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzModalModule, NzTagModule, NzSpinModule,
    NzSelectModule, NzToolTipModule, NzDropDownModule,
    WorkflowFormComponent
  ],
  templateUrl: './workflow-list.component.html',
  styleUrl: './workflow-list.component.scss'
})
export class WorkflowListComponent implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private router = inject(Router);

  workflows = signal<Workflow[]>([]);
  loading = signal(false);
  searchText = '';
  filterDocType: string | null = null;
  filterStatus: string | null = null;

  // Dropdown data
  companies = signal<DropdownItem[]>([]);
  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);

  activeCount = computed(() => this.workflows().filter(w => w.is_active).length);
  inactiveCount = computed(() => this.workflows().filter(w => !w.is_active).length);

  filteredWorkflows = computed(() => {
    let list = this.workflows();
    const term = this.searchText.toLowerCase();
    if (term) {
      list = list.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.document_type?.name?.toLowerCase().includes(term) ||
        w.category?.name?.toLowerCase().includes(term) ||
        w.department?.name?.toLowerCase().includes(term)
      );
    }
    if (this.filterDocType) {
      list = list.filter(w => w.document_type_id === this.filterDocType);
    }
    if (this.filterStatus === 'active') {
      list = list.filter(w => w.is_active);
    } else if (this.filterStatus === 'inactive') {
      list = list.filter(w => !w.is_active);
    }
    return list;
  });

  // Form drawer state
  formVisible = false;
  formEditData: Workflow | null = null;

  ngOnInit() {
    this.loadWorkflows();
    this.loadDropdowns();
  }

  loadDropdowns() {
    forkJoin({
      companies: this.http.get<any>(`${environment.apiUrl}/companies`),
      documentTypes: this.http.get<any>(`${environment.apiUrl}/document-types`),
      categories: this.http.get<any>(`${environment.apiUrl}/categories`),
      departments: this.http.get<any>(`${environment.apiUrl}/departments`),
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.documentTypes.set(res.documentTypes.data || []);
        this.categories.set(res.categories.data || []);
        this.departments.set(res.departments.data || []);
      },
      error: () => this.message.error('Gagal memuat data referensi')
    });
  }

  loadWorkflows() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/workflows`).subscribe({
      next: (res) => {
        this.workflows.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.workflows.set([]);
        this.loading.set(false);
        this.message.error('Gagal memuat data workflow');
      }
    });
  }

  getTotalSteps(): number {
    return this.workflows().reduce((sum, w) => sum + (w.steps?.length || 0), 0);
  }

  // ── Navigation ──

  openDetail(wf: Workflow) {
    this.router.navigate(['/workflows', wf.id]);
  }

  // ── Form Drawer ──

  openForm(wf?: Workflow) {
    this.formEditData = wf || null;
    this.formVisible = true;
  }

  onFormClosed() {
    this.formVisible = false;
    this.formEditData = null;
  }

  onFormSaved(savedId?: string) {
    this.formVisible = false;
    this.formEditData = null;
    this.loadWorkflows();
    if (savedId) {
      this.router.navigate(['/workflows', savedId]);
    }
  }

  // ── Delete ──

  confirmDelete(wf: Workflow) {
    this.modal.confirm({
      nzTitle: 'Hapus Workflow?',
      nzContent: `Yakin ingin menghapus workflow "${wf.name}"? Semua langkah terkait juga akan dihapus.`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete<any>(`${environment.apiUrl}/workflows/${wf.id}`).subscribe({
          next: () => {
            this.message.success('Workflow berhasil dihapus');
            this.loadWorkflows();
          },
          error: (err) => this.message.error(err?.error?.message || 'Gagal menghapus workflow')
        });
      }
    });
  }

  applyFilter() {}

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
}
