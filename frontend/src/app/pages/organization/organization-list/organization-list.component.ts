import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Company, Office, Department, Section, Position, OrgType, ApiResponse } from '../organization.models';
import { OrganizationFormComponent } from '../organization-form/organization-form.component';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTabsModule, NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzModalModule, NzTagModule, NzSpinModule,
    OrganizationFormComponent
  ],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss'
})
export class OrganizationListComponent implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  activeTab = 0;
  search = { company: '', office: '', department: '', section: '', position: '' };

  // Data signals
  companies = signal<Company[]>([]);
  offices = signal<Office[]>([]);
  departments = signal<Department[]>([]);
  sections = signal<Section[]>([]);
  positions = signal<Position[]>([]);
  loading = signal(false);

  // Filtered data
  filteredCompanies = computed(() => {
    const term = this.search.company.toLowerCase();
    return this.companies().filter(c =>
      c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    );
  });

  filteredOffices = computed(() => {
    const term = this.search.office.toLowerCase();
    return this.offices().filter(o =>
      o.code.toLowerCase().includes(term) || o.name.toLowerCase().includes(term)
    );
  });

  filteredDepartments = computed(() => {
    const term = this.search.department.toLowerCase();
    return this.departments().filter(d =>
      d.code.toLowerCase().includes(term) || d.name.toLowerCase().includes(term)
    );
  });

  filteredSections = computed(() => {
    const term = this.search.section.toLowerCase();
    return this.sections().filter(s =>
      s.code.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)
    );
  });

  filteredPositions = computed(() => {
    const term = this.search.position.toLowerCase();
    return this.positions().filter(p =>
      p.code.toLowerCase().includes(term) || p.name.toLowerCase().includes(term)
    );
  });

  // Form drawer state
  formVisible = false;
  formType: OrgType = 'company';
  formEditData: any = null;

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);

    forkJoin({
      companies: this.http.get<ApiResponse<Company>>(`${environment.apiUrl}/companies`),
      offices: this.http.get<ApiResponse<Office>>(`${environment.apiUrl}/offices`),
      departments: this.http.get<ApiResponse<Department>>(`${environment.apiUrl}/departments`),
      sections: this.http.get<ApiResponse<Section>>(`${environment.apiUrl}/sections`),
      positions: this.http.get<ApiResponse<Position>>(`${environment.apiUrl}/positions`)
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.offices.set(res.offices.data || []);
        this.departments.set(res.departments.data || []);
        this.sections.set(res.sections.data || []);
        this.positions.set(res.positions.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Load error:', err);
        this.message.error('Gagal memuat data');
        this.loading.set(false);
      }
    });
  }

  // ── Form Drawer ──

  openForm(type: OrgType, item?: any) {
    this.formType = type;
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
    this.loadAll();
  }

  // ── Delete ──

  confirmDelete(type: OrgType, item: any) {
    const labels: Record<OrgType, string> = {
      company: 'Company', office: 'Office', department: 'Department',
      section: 'Section', position: 'Position'
    };
    this.modal.confirm({
      nzTitle: `Hapus ${labels[type]}?`,
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(type, item.id)
    });
  }

  private delete(type: OrgType, id: number) {
    const endpoints: Record<OrgType, string> = {
      company: 'companies', office: 'offices', department: 'departments',
      section: 'sections', position: 'positions'
    };
    const endpoint = `${environment.apiUrl}/${endpoints[type]}/${id}`;

    this.http.delete(endpoint).subscribe({
      next: () => {
        this.message.success('Data berhasil dihapus');
        this.loadAll();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.message.error('Gagal menghapus data');
      }
    });
  }
}
