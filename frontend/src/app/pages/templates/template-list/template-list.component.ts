import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Template } from '../template.models';
import { TemplateFormComponent } from '../template-form/template-form.component';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzDropDownModule, NzSelectModule,
    NzSpinModule, NzModalModule,
    TemplateFormComponent
  ],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private router = inject(Router);

  templates = signal<Template[]>([]);
  documentTypes = signal<{ id: string; name: string }[]>([]);
  categories = signal<{ id: string; name: string }[]>([]);
  companies = signal<{ id: string; name: string }[]>([]);
  loading = signal(false);

  searchText = '';
  filterDocTypeId: string | null = null;

  statsTotal = computed(() => this.templates().length);
  statsActive = computed(() => this.templates().filter(t => t.status === 'active').length);
  statsDraft = computed(() => this.templates().filter(t => t.status === 'draft').length);
  statsArchived = computed(() => this.templates().filter(t => t.status === 'archived').length);

  filteredTemplates = computed(() => {
    let data = this.templates();
    if (this.filterDocTypeId) {
      data = data.filter(t => t.document_type_id === this.filterDocTypeId);
    }
    return data;
  });

  // Form drawer state
  formVisible = false;
  formEditData: Template | null = null;

  ngOnInit() {
    this.loadTemplates();
    this.loadDropdowns();
  }

  loadTemplates() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchText) params.search = this.searchText;

    this.http.get<any>(`${environment.apiUrl}/templates`, { params }).subscribe({
      next: (res) => {
        this.templates.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.templates.set([]);
        this.loading.set(false);
      }
    });
  }

  loadDropdowns() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => this.documentTypes.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/companies`).subscribe({
      next: (res) => this.companies.set(res.data || [])
    });
  }

  onSearch() {
    this.loadTemplates();
  }

  // ── Form Drawer ──

  openForm(item?: Template) {
    this.formEditData = item || null;
    this.formVisible = true;
  }

  onFormClosed() {
    this.formVisible = false;
    this.formEditData = null;
  }

  onFormSaved() {
    this.formVisible = false;
    this.formEditData = null;
    this.loadTemplates();
  }

  // ── Detail Page Navigation ──

  openDetail(tpl: Template) {
    this.router.navigate(['/master/templates', tpl.id]);
  }

  // ── Actions ──

  download(tpl: Template) {
    window.open(`${environment.apiUrl}/templates/${tpl.id}/download`, '_blank');
  }

  deleteTemplate(tpl: Template) {
    this.modal.confirm({
      nzTitle: 'Hapus Template?',
      nzContent: `Yakin ingin menghapus template "${tpl.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/templates/${tpl.id}`).subscribe({
          next: () => {
            this.message.success('Template berhasil dihapus');
            this.loadTemplates();
          },
          error: () => this.message.error('Gagal menghapus template')
        });
      }
    });
  }

  // ── Helpers ──

  formatFileSize(bytes: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'orange';
      case 'archived': return 'default';
      default: return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Aktif';
      case 'draft': return 'Draft';
      case 'archived': return 'Arsip';
      default: return status || '-';
    }
  }
}
