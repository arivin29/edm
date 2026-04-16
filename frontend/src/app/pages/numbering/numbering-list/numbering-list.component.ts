import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { environment } from '../../../../environments/environment';
import { DocumentNumbering, Company, DocumentType, Category, Department, Office } from '../numbering.models';
import { NumberingFormComponent } from '../numbering-form/numbering-form.component';

@Component({
  selector: 'app-numbering-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzModalModule, NzTagModule, NzSpinModule, NzToolTipModule,
    NumberingFormComponent
  ],
  templateUrl: './numbering-list.component.html',
  styleUrls: ['./numbering-list.component.scss']
})
export class NumberingListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchTerm = '';
  numberings = signal<DocumentNumbering[]>([]);
  companies = signal<Company[]>([]);
  documentTypes = signal<DocumentType[]>([]);
  categories = signal<Category[]>([]);
  departments = signal<Department[]>([]);
  offices = signal<Office[]>([]);
  loading = signal(false);

  filteredData = computed(() => {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.numberings();
    return this.numberings().filter(n => {
      const companyName = this.getCompanyName(n.company_id).toLowerCase();
      const docTypeName = this.getDocTypeName(n.document_type_id).toLowerCase();
      const prefix = (n.prefix || '').toLowerCase();
      const format = (n.format || '').toLowerCase();
      return companyName.includes(term) || docTypeName.includes(term)
        || prefix.includes(term) || format.includes(term);
    });
  });

  // Drawer state
  drawerVisible = false;
  editItem: DocumentNumbering | null = null;

  ngOnInit() {
    this.loadDropdowns();
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/numbering`).subscribe({
      next: (res) => {
        this.numberings.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.numberings.set([]);
        this.loading.set(false);
      }
    });
  }

  getCompanyName(id: string): string {
    return this.companies().find(c => c.id === id)?.name || '-';
  }

  getDocTypeName(id: string): string {
    return this.documentTypes().find(dt => dt.id === id)?.name || '-';
  }

  getCategoryName(id: string): string {
    return this.categories().find(c => c.id === id)?.name || '-';
  }

  getResetLabel(period?: string): string {
    switch (period) {
      case 'yearly': return 'Tahunan';
      case 'monthly': return 'Bulanan';
      default: return 'Tidak Reset';
    }
  }

  getResetColor(period?: string): string {
    switch (period) {
      case 'yearly': return 'blue';
      case 'monthly': return 'orange';
      default: return 'default';
    }
  }

  openDrawer(item?: DocumentNumbering) {
    this.editItem = item || null;
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editItem = null;
  }

  onFormSaved() {
    this.closeDrawer();
    this.loadData();
  }

  confirmDelete(item: DocumentNumbering) {
    const companyName = this.getCompanyName(item.company_id);
    const docTypeName = this.getDocTypeName(item.document_type_id);
    this.modal.confirm({
      nzTitle: 'Hapus Penomoran?',
      nzContent: `Yakin ingin menghapus penomoran "${companyName} - ${docTypeName}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(item.id)
    });
  }

  private delete(id: string) {
    this.http.delete(`${this.apiUrl}/numbering/${id}`).subscribe({
      next: () => {
        this.message.success('Data berhasil dihapus');
        this.loadData();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menghapus data');
      }
    });
  }

  private loadDropdowns() {
    forkJoin({
      companies: this.http.get<any>(`${this.apiUrl}/companies`),
      documentTypes: this.http.get<any>(`${this.apiUrl}/document-types`),
      categories: this.http.get<any>(`${this.apiUrl}/categories`),
      departments: this.http.get<any>(`${this.apiUrl}/departments`),
      offices: this.http.get<any>(`${this.apiUrl}/offices`)
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.documentTypes.set(res.documentTypes.data || []);
        this.categories.set(res.categories.data || []);
        this.departments.set(res.departments.data || []);
        this.offices.set(res.offices.data || []);
      },
      error: () => {
        this.message.error('Gagal memuat data dropdown');
      }
    });
  }
}
