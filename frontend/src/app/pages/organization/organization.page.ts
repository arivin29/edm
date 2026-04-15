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
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces
export interface Company {
  id: number;
  code: string;
  name: string;
  is_active?: boolean;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Office {
  id: number;
  code: string;
  name: string;
  company_id: number;
  company_name?: string;
  is_active?: boolean;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  office_name?: string;
  is_active?: boolean;
}

export interface Section {
  id: number;
  code: string;
  name: string;
  department_id: number;
  department_name?: string;
  is_active?: boolean;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  level: number;
  is_active?: boolean;
}

type OrgType = 'company' | 'office' | 'department' | 'section' | 'position';

interface ApiResponse<T> {
  data: T[];
  meta?: any;
}

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTabsModule, NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzSelectModule, NzTagModule, NzSpinModule
  ],
  template: `
    <div class="p-3">
      <div class="mb-3">
        <h1 class="text-base font-semibold m-0">Struktur Organisasi</h1>
        <p class="text-gray-500 text-xs m-0">Kelola hierarki organisasi perusahaan</p>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <nz-tabset nzSize="small" [(nzSelectedIndex)]="activeTab">
            <!-- Companies Tab -->
            <nz-tab nzTitle="Company">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari company..." [(ngModel)]="search.company" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('company')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #companyTable [nzData]="filteredCompanies()" nzSize="small" 
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of companyTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active !== false ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('company', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('company', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="4" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>

            <!-- Offices Tab -->
            <nz-tab nzTitle="Office">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari office..." [(ngModel)]="search.office" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('office')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #officeTable [nzData]="filteredOffices()" nzSize="small" 
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th>Company</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of officeTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td class="text-gray-600">{{ item.company_name || '-' }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active !== false ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('office', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('office', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>

            <!-- Departments Tab -->
            <nz-tab nzTitle="Department">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari department..." [(ngModel)]="search.department" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('department')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #deptTable [nzData]="filteredDepartments()" nzSize="small" 
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th>Office</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of deptTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td class="text-gray-600">{{ item.office_name || '-' }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active !== false ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('department', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('department', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>

            <!-- Sections Tab -->
            <nz-tab nzTitle="Section">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari section..." [(ngModel)]="search.section" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('section')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #secTable [nzData]="filteredSections()" nzSize="small" 
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th>Department</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of secTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td class="text-gray-600">{{ item.department_name || '-' }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active !== false ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('section', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('section', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>

            <!-- Positions Tab -->
            <nz-tab nzTitle="Position">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari position..." [(ngModel)]="search.position" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('position')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #posTable [nzData]="filteredPositions()" nzSize="small" 
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th nzWidth="80px">Level</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of posTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td>
                        <nz-tag nzColor="blue" class="text-xs">Level {{ item.level }}</nz-tag>
                      </td>
                      <td>
                        <nz-tag [nzColor]="item.is_active !== false ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active !== false ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('position', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('position', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>
          </nz-tabset>
        </nz-card>
      </nz-spin>

      <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>

      <!-- Drawer Form -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="drawerTitle" nzPlacement="right"
                 nzWidth="380px" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Kode</nz-form-label>
              <nz-form-control nzErrorTip="Kode wajib diisi">
                <input nz-input nzSize="small" [(ngModel)]="formData.code" name="code" 
                       placeholder="Masukkan kode" [maxlength]="50" />
              </nz-form-control>
            </nz-form-item>
            
            <nz-form-item>
              <nz-form-label nzRequired>Nama</nz-form-label>
              <nz-form-control nzErrorTip="Nama wajib diisi">
                <input nz-input nzSize="small" [(ngModel)]="formData.name" name="name" 
                       placeholder="Masukkan nama" [maxlength]="255" />
              </nz-form-control>
            </nz-form-item>
            
            @if (drawerType === 'office') {
              <nz-form-item>
                <nz-form-label nzRequired>Company</nz-form-label>
                <nz-form-control nzErrorTip="Company wajib dipilih">
                  <nz-select nzSize="small" [(ngModel)]="formData.company_id" name="company_id" 
                             nzPlaceHolder="Pilih company" nzShowSearch>
                    @for (c of companies(); track c.id) {
                      <nz-option [nzValue]="c.id" [nzLabel]="c.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            }
            
            @if (drawerType === 'department') {
              <nz-form-item>
                <nz-form-label nzRequired>Office</nz-form-label>
                <nz-form-control nzErrorTip="Office wajib dipilih">
                  <nz-select nzSize="small" [(ngModel)]="formData.office_id" name="office_id" 
                             nzPlaceHolder="Pilih office" nzShowSearch>
                    @for (o of offices(); track o.id) {
                      <nz-option [nzValue]="o.id" [nzLabel]="o.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            }
            
            @if (drawerType === 'section') {
              <nz-form-item>
                <nz-form-label nzRequired>Department</nz-form-label>
                <nz-form-control nzErrorTip="Department wajib dipilih">
                  <nz-select nzSize="small" [(ngModel)]="formData.department_id" name="department_id" 
                             nzPlaceHolder="Pilih department" nzShowSearch>
                    @for (d of departments(); track d.id) {
                      <nz-option [nzValue]="d.id" [nzLabel]="d.name"></nz-option>
                    }
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            }
            
            @if (drawerType === 'position') {
              <nz-form-item>
                <nz-form-label nzRequired>Level</nz-form-label>
                <nz-form-control nzErrorTip="Level wajib diisi (1-10)">
                  <input nz-input nzSize="small" [(ngModel)]="formData.level" name="level" 
                         type="number" placeholder="Level 1-10" min="1" max="10" />
                </nz-form-control>
              </nz-form-item>
            }

            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">
                Simpan
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-tabs-tab { font-size: 12px; padding: 6px 12px; }
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 2px; }
  `]
})
export class OrganizationPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private readonly apiUrl = environment.apiUrl;

  activeTab = 0;
  search = { company: '', office: '', department: '', section: '', position: '' };

  // Data signals
  companies = signal<Company[]>([]);
  offices = signal<Office[]>([]);
  departments = signal<Department[]>([]);
  sections = signal<Section[]>([]);
  positions = signal<Position[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Filtered data (computed)
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

  // Drawer state
  drawerVisible = false;
  drawerType: OrgType = 'company';
  drawerTitle = '';
  formData: any = {};
  editId: number | null = null;

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    
    forkJoin({
      companies: this.http.get<ApiResponse<Company>>(`${this.apiUrl}/companies`),
      offices: this.http.get<ApiResponse<Office>>(`${this.apiUrl}/offices`),
      departments: this.http.get<ApiResponse<Department>>(`${this.apiUrl}/departments`),
      sections: this.http.get<ApiResponse<Section>>(`${this.apiUrl}/sections`),
      positions: this.http.get<ApiResponse<Position>>(`${this.apiUrl}/positions`)
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

  openDrawer(type: OrgType, item?: any) {
    this.drawerType = type;
    this.editId = item?.id || null;
    this.drawerTitle = item ? `Edit ${this.getTypeLabel(type)}` : `Tambah ${this.getTypeLabel(type)}`;
    
    if (item) {
      this.formData = { ...item };
    } else {
      this.formData = { code: '', name: '', is_active: true };
      if (type === 'position') this.formData.level = 1;
    }
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.formData = {};
    this.editId = null;
  }

  getTypeLabel(type: OrgType): string {
    const labels: Record<OrgType, string> = {
      company: 'Company', office: 'Office', department: 'Department',
      section: 'Section', position: 'Position'
    };
    return labels[type];
  }

  save() {
    if (!this.formData.code?.trim() || !this.formData.name?.trim()) {
      this.message.warning('Kode dan Nama wajib diisi');
      return;
    }

    // Validate parent for hierarchical types
    if (this.drawerType === 'office' && !this.formData.company_id) {
      this.message.warning('Company wajib dipilih');
      return;
    }
    if (this.drawerType === 'department' && !this.formData.office_id) {
      this.message.warning('Office wajib dipilih');
      return;
    }
    if (this.drawerType === 'section' && !this.formData.department_id) {
      this.message.warning('Department wajib dipilih');
      return;
    }
    if (this.drawerType === 'position' && (!this.formData.level || this.formData.level < 1)) {
      this.message.warning('Level wajib diisi (minimal 1)');
      return;
    }

    this.saving.set(true);
    
    const endpoint = `${this.apiUrl}/${this.getEndpoint(this.drawerType)}`;
    const request$ = this.editId
      ? this.http.put(`${endpoint}/${this.editId}`, this.formData)
      : this.http.post(endpoint, this.formData);

    request$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.closeDrawer();
        this.loadAll();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Save error:', err);
        this.message.error('Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  private getEndpoint(type: OrgType): string {
    const endpoints: Record<OrgType, string> = {
      company: 'companies', office: 'offices', department: 'departments',
      section: 'sections', position: 'positions'
    };
    return endpoints[type];
  }

  confirmDelete(type: OrgType, item: any) {
    this.modal.confirm({
      nzTitle: `Hapus ${this.getTypeLabel(type)}?`,
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(type, item.id)
    });
  }

  private delete(type: OrgType, id: number) {
    const endpoint = `${this.apiUrl}/${this.getEndpoint(type)}/${id}`;
    
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
