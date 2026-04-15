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
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { environment } from '../../../environments/environment';

interface Workflow {
  id: string;
  company_id: string;
  office_id?: string;
  document_type_id: string;
  category_id?: string;
  department_id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string };
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string };
  department?: { id: string; name: string };
  steps?: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  step_type: string;
  assignee_type: string;
  assignee_user_id?: string;
  assignee_role_id?: string;
  assignee_position_id?: string;
  assignee_department_id?: string;
  is_parallel: boolean;
  required_approvals: number;
  on_reject_action: string;
  reject_to_step_id?: string;
  deadline_days?: number;
  can_edit: boolean;
  can_comment: boolean;
  can_delegate: boolean;
  instructions?: string;
}

interface DropdownItem {
  id: string;
  name: string;
  code?: string;
  email?: string;
}

@Component({
  standalone: true,
  selector: 'app-workflow-list',
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzInputModule,
    NzDrawerModule,
    NzModalModule,
    NzFormModule,
    NzTagModule,
    NzSpinModule,
    NzSwitchModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDividerModule,
    NzToolTipModule,
    NzCheckboxModule,
    NzCollapseModule,
    NzPopconfirmModule,
  ],
  template: `
    <nz-card [nzBordered]="false">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="margin:0;font-size:14px">Manajemen Workflow</h4>
        <div style="display:flex;gap:8px;align-items:center">
          <nz-input-group [nzSuffix]="searchIcon" nzSize="small" style="width:220px">
            <input nz-input placeholder="Cari workflow..." [(ngModel)]="searchText" nzSize="small" />
          </nz-input-group>
          <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>
          <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
            <span nz-icon nzType="plus"></span> Tambah
          </button>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-table
          #tbl
          nzSize="small"
          [nzData]="filteredWorkflows()"
          [nzShowPagination]="true"
          [nzPageSize]="15"
          nzShowSizeChanger
          [nzFrontPagination]="true"
        >
          <thead>
            <tr>
              <th nzWidth="30px">#</th>
              <th>Nama</th>
              <th>Tipe Dokumen</th>
              <th>Kategori</th>
              <th>Departemen</th>
              <th nzWidth="70px" nzAlign="center">Status</th>
              <th nzWidth="60px" nzAlign="center">Steps</th>
              <th nzWidth="90px" nzAlign="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (wf of tbl.data; track wf.id; let i = $index) {
              <tr>
                <td>{{ i + 1 }}</td>
                <td>{{ wf.name }}</td>
                <td>{{ wf.document_type?.name || '-' }}</td>
                <td>{{ wf.category?.name || '-' }}</td>
                <td>{{ wf.department?.name || '-' }}</td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="wf.is_active ? 'green' : 'default'">
                    {{ wf.is_active ? 'Aktif' : 'Nonaktif' }}
                  </nz-tag>
                </td>
                <td nzAlign="center">{{ wf.steps?.length || 0 }}</td>
                <td nzAlign="center">
                  <button nz-button nzType="link" nzSize="small" nz-tooltip="Edit" (click)="openDrawer(wf)">
                    <span nz-icon nzType="edit"></span>
                  </button>
                  <button nz-button nzType="link" nzSize="small" nzDanger nz-tooltip="Hapus" (click)="confirmDelete(wf)">
                    <span nz-icon nzType="delete"></span>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" style="text-align:center;color:#999;padding:24px 0">
                  Belum ada data workflow
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-spin>
    </nz-card>

    <!-- Drawer -->
    <nz-drawer
      [nzVisible]="drawerVisible"
      [nzWidth]="600"
      [nzTitle]="editId ? 'Edit Workflow' : 'Tambah Workflow'"
      [nzClosable]="true"
      (nzOnClose)="closeDrawer()"
      [nzBodyStyle]="{ padding: '16px', 'overflow-y': 'auto' }"
    >
      <div *nzDrawerContent>
        <nz-spin [nzSpinning]="saving()">
          <!-- Workflow Info -->
          <h5 style="margin:0 0 12px;font-size:13px;font-weight:600">Informasi Workflow</h5>

          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Nama</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <input nz-input nzSize="small" [(ngModel)]="formData.name" placeholder="Nama workflow" />
            </nz-form-control>
          </nz-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzRequired>Perusahaan</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="formData.company_id" nzPlaceHolder="Pilih perusahaan" nzShowSearch nzAllowClear>
                  @for (c of companies(); track c.id) {
                    <nz-option [nzValue]="c.id" [nzLabel]="c.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzRequired>Tipe Dokumen</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="formData.document_type_id" nzPlaceHolder="Pilih tipe dokumen" nzShowSearch nzAllowClear>
                  @for (dt of documentTypes(); track dt.id) {
                    <nz-option [nzValue]="dt.id" [nzLabel]="dt.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="24">Kategori</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="formData.category_id" nzPlaceHolder="Pilih kategori" nzShowSearch nzAllowClear>
                  @for (cat of categories(); track cat.id) {
                    <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="24">Departemen</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="formData.department_id" nzPlaceHolder="Pilih departemen" nzShowSearch nzAllowClear>
                  @for (dept of departments(); track dept.id) {
                    <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Deskripsi</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea nz-input nzSize="small" [(ngModel)]="formData.description" placeholder="Deskripsi workflow" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Status Aktif</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-switch [(ngModel)]="formData.is_active" nzSize="small" nzCheckedChildren="Aktif" nzUnCheckedChildren="Nonaktif"></nz-switch>
            </nz-form-control>
          </nz-form-item>

          <div style="text-align:right;margin-bottom:16px">
            <button nz-button nzSize="small" (click)="closeDrawer()" style="margin-right:8px">Batal</button>
            <button nz-button nzType="primary" nzSize="small" (click)="saveWorkflow()" [nzLoading]="saving()">Simpan</button>
          </div>

          <!-- Steps Section (only visible when editing) -->
          @if (editId) {
            <nz-divider nzText="Langkah-langkah Workflow" nzOrientation="left" style="font-size:12px;margin:8px 0 12px"></nz-divider>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;color:#666">{{ steps().length }} langkah</span>
              <button nz-button nzType="dashed" nzSize="small" (click)="openStepForm()">
                <span nz-icon nzType="plus"></span> Tambah Langkah
              </button>
            </div>

            <nz-spin [nzSpinning]="loadingSteps()">
              <div style="display:flex;flex-direction:column;gap:6px">
                @for (step of steps(); track step.id; let idx = $index; let first = $first; let last = $last) {
                  <div style="border:1px solid #f0f0f0;border-radius:4px;padding:8px 10px;background:#fafafa;font-size:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                      <div style="display:flex;align-items:center;gap:8px">
                        <nz-tag nzColor="blue" style="margin:0">{{ step.step_order }}</nz-tag>
                        <strong>{{ step.name }}</strong>
                        <nz-tag style="margin:0">{{ getStepTypeLabel(step.step_type) }}</nz-tag>
                      </div>
                      <div style="display:flex;gap:2px">
                        <button nz-button nzType="text" nzSize="small" [disabled]="first" nz-tooltip="Naik" (click)="moveStep(idx, -1)">
                          <span nz-icon nzType="up"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" [disabled]="last" nz-tooltip="Turun" (click)="moveStep(idx, 1)">
                          <span nz-icon nzType="down"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" nz-tooltip="Edit" (click)="openStepForm(step)">
                          <span nz-icon nzType="edit"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" nzDanger nz-tooltip="Hapus" (click)="confirmDeleteStep(step)">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </div>
                    </div>
                    <div style="margin-top:4px;color:#888;font-size:11px">
                      {{ getAssigneeTypeLabel(step.assignee_type) }}
                      @if (step.deadline_days) { · Batas {{ step.deadline_days }} hari }
                      @if (step.is_parallel) { · Paralel }
                      @if (step.required_approvals > 1) { · Min. {{ step.required_approvals }} persetujuan }
                    </div>
                  </div>
                } @empty {
                  <div style="text-align:center;color:#999;padding:16px 0;font-size:12px">
                    Belum ada langkah. Klik "Tambah Langkah" untuk memulai.
                  </div>
                }
              </div>
            </nz-spin>
          }
        </nz-spin>
      </div>
    </nz-drawer>

    <!-- Step Form Drawer (nested) -->
    <nz-drawer
      [nzVisible]="stepDrawerVisible"
      [nzWidth]="480"
      [nzTitle]="editStepId ? 'Edit Langkah' : 'Tambah Langkah'"
      [nzClosable]="true"
      (nzOnClose)="closeStepForm()"
      [nzBodyStyle]="{ padding: '16px', 'overflow-y': 'auto' }"
    >
      <div *nzDrawerContent>
        <nz-spin [nzSpinning]="savingStep()">
          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Nama Langkah</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <input nz-input nzSize="small" [(ngModel)]="stepForm.name" placeholder="Nama langkah" />
            </nz-form-control>
          </nz-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzRequired>Tipe</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="stepForm.step_type" nzPlaceHolder="Pilih tipe">
                  <nz-option nzValue="approval" nzLabel="Persetujuan"></nz-option>
                  <nz-option nzValue="review" nzLabel="Review"></nz-option>
                  <nz-option nzValue="notification" nzLabel="Notifikasi"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="24" nzRequired>Tipe Penerima</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="stepForm.assignee_type" nzPlaceHolder="Pilih tipe penerima" (ngModelChange)="onAssigneeTypeChange()">
                  <nz-option nzValue="user" nzLabel="Pengguna"></nz-option>
                  <nz-option nzValue="role" nzLabel="Role"></nz-option>
                  <nz-option nzValue="position" nzLabel="Jabatan"></nz-option>
                  <nz-option nzValue="department" nzLabel="Departemen"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Dynamic assignee select -->
          <nz-form-item>
            <nz-form-label [nzSpan]="24" nzRequired>Penerima</nz-form-label>
            <nz-form-control [nzSpan]="24">
              @switch (stepForm.assignee_type) {
                @case ('user') {
                  <nz-select nzSize="small" [(ngModel)]="stepForm.assignee_user_id" nzPlaceHolder="Pilih pengguna" nzShowSearch nzAllowClear>
                    @for (u of users(); track u.id) {
                      <nz-option [nzValue]="u.id" [nzLabel]="u.name + (u.email ? ' (' + u.email + ')' : '')"></nz-option>
                    }
                  </nz-select>
                }
                @case ('role') {
                  <nz-select nzSize="small" [(ngModel)]="stepForm.assignee_role_id" nzPlaceHolder="Pilih role" nzShowSearch nzAllowClear>
                    @for (r of roles(); track r.id) {
                      <nz-option [nzValue]="r.id" [nzLabel]="r.name"></nz-option>
                    }
                  </nz-select>
                }
                @case ('position') {
                  <nz-select nzSize="small" [(ngModel)]="stepForm.assignee_position_id" nzPlaceHolder="Pilih jabatan" nzShowSearch nzAllowClear>
                    @for (p of positions(); track p.id) {
                      <nz-option [nzValue]="p.id" [nzLabel]="p.name"></nz-option>
                    }
                  </nz-select>
                }
                @case ('department') {
                  <nz-select nzSize="small" [(ngModel)]="stepForm.assignee_department_id" nzPlaceHolder="Pilih departemen" nzShowSearch nzAllowClear>
                    @for (d of departments(); track d.id) {
                      <nz-option [nzValue]="d.id" [nzLabel]="d.name"></nz-option>
                    }
                  </nz-select>
                }
                @default {
                  <nz-select nzSize="small" nzDisabled nzPlaceHolder="Pilih tipe penerima terlebih dahulu"></nz-select>
                }
              }
            </nz-form-control>
          </nz-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px">
            <nz-form-item>
              <nz-form-label [nzSpan]="24">Min. Persetujuan</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-input-number nzSize="small" [(ngModel)]="stepForm.required_approvals" [nzMin]="1" [nzMax]="99" style="width:100%"></nz-input-number>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label [nzSpan]="24">Batas Hari</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-input-number nzSize="small" [(ngModel)]="stepForm.deadline_days" [nzMin]="0" [nzMax]="365" nzPlaceHolder="Opsional" style="width:100%"></nz-input-number>
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Aksi Saat Ditolak</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <nz-select nzSize="small" [(ngModel)]="stepForm.on_reject_action" nzPlaceHolder="Pilih aksi">
                <nz-option nzValue="to_creator" nzLabel="Kembali ke pembuat"></nz-option>
                <nz-option nzValue="to_previous" nzLabel="Kembali ke langkah sebelumnya"></nz-option>
                <nz-option nzValue="to_step" nzLabel="Ke langkah tertentu"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          @if (stepForm.on_reject_action === 'to_step') {
            <nz-form-item>
              <nz-form-label [nzSpan]="24">Tolak ke Langkah</nz-form-label>
              <nz-form-control [nzSpan]="24">
                <nz-select nzSize="small" [(ngModel)]="stepForm.reject_to_step_id" nzPlaceHolder="Pilih langkah" nzShowSearch nzAllowClear>
                  @for (s of steps(); track s.id) {
                    <nz-option [nzValue]="s.id" [nzLabel]="s.step_order + '. ' + s.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          }

          <div style="display:flex;gap:16px;margin-bottom:12px">
            <label nz-checkbox [(ngModel)]="stepForm.is_parallel">Paralel</label>
            <label nz-checkbox [(ngModel)]="stepForm.can_edit">Bisa Edit</label>
            <label nz-checkbox [(ngModel)]="stepForm.can_comment">Bisa Komentar</label>
            <label nz-checkbox [(ngModel)]="stepForm.can_delegate">Bisa Delegasi</label>
          </div>

          <nz-form-item>
            <nz-form-label [nzSpan]="24">Instruksi</nz-form-label>
            <nz-form-control [nzSpan]="24">
              <textarea nz-input nzSize="small" [(ngModel)]="stepForm.instructions" placeholder="Instruksi untuk langkah ini" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
            </nz-form-control>
          </nz-form-item>

          <div style="text-align:right;margin-top:16px">
            <button nz-button nzSize="small" (click)="closeStepForm()" style="margin-right:8px">Batal</button>
            <button nz-button nzType="primary" nzSize="small" (click)="saveStep()" [nzLoading]="savingStep()">Simpan Langkah</button>
          </div>
        </nz-spin>
      </div>
    </nz-drawer>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    :host ::ng-deep .ant-divider-inner-text { font-size: 12px !important; }
    :host ::ng-deep .ant-form-item-label > label { font-size: 12px; }
    :host ::ng-deep .ant-drawer-body { font-size: 12px; }
  `]
})
export class WorkflowListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private apiUrl = environment.apiUrl;

  // Main list state
  workflows = signal<Workflow[]>([]);
  loading = signal(false);
  searchText = '';

  filteredWorkflows = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.workflows();
    return this.workflows().filter(w =>
      w.name.toLowerCase().includes(term) ||
      w.document_type?.name?.toLowerCase().includes(term) ||
      w.category?.name?.toLowerCase().includes(term) ||
      w.department?.name?.toLowerCase().includes(term)
    );
  });

  // Dropdown data
  companies = signal<DropdownItem[]>([]);
  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);
  users = signal<DropdownItem[]>([]);
  roles = signal<DropdownItem[]>([]);
  positions = signal<DropdownItem[]>([]);

  // Drawer state
  drawerVisible = false;
  editId: string | null = null;
  saving = signal(false);
  formData: any = {};

  // Steps state
  steps = signal<WorkflowStep[]>([]);
  loadingSteps = signal(false);

  // Step form drawer
  stepDrawerVisible = false;
  editStepId: string | null = null;
  savingStep = signal(false);
  stepForm: any = {};

  ngOnInit() {
    this.loadWorkflows();
    this.loadDropdowns();
  }

  loadDropdowns() {
    forkJoin({
      companies: this.http.get<any>(`${this.apiUrl}/companies`),
      documentTypes: this.http.get<any>(`${this.apiUrl}/document-types`),
      categories: this.http.get<any>(`${this.apiUrl}/categories`),
      departments: this.http.get<any>(`${this.apiUrl}/departments`),
      users: this.http.get<any>(`${this.apiUrl}/users`),
      roles: this.http.get<any>(`${this.apiUrl}/roles`),
      positions: this.http.get<any>(`${this.apiUrl}/positions`),
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

  loadWorkflows() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/workflows`).subscribe({
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

  // Workflow drawer
  openDrawer(wf?: Workflow) {
    this.editId = wf?.id || null;
    this.formData = wf ? {
      name: wf.name,
      company_id: wf.company_id,
      document_type_id: wf.document_type_id,
      category_id: wf.category_id || null,
      department_id: wf.department_id || null,
      description: wf.description || '',
      is_active: wf.is_active
    } : {
      name: '',
      company_id: null,
      document_type_id: null,
      category_id: null,
      department_id: null,
      description: '',
      is_active: true
    };
    this.drawerVisible = true;

    if (this.editId) {
      this.loadSteps(this.editId);
    } else {
      this.steps.set([]);
    }
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editId = null;
    this.formData = {};
    this.steps.set([]);
  }

  saveWorkflow() {
    if (!this.formData['name']?.trim()) {
      this.message.warning('Nama workflow wajib diisi');
      return;
    }
    if (!this.formData['company_id']) {
      this.message.warning('Perusahaan wajib dipilih');
      return;
    }
    if (!this.formData['document_type_id']) {
      this.message.warning('Tipe dokumen wajib dipilih');
      return;
    }

    this.saving.set(true);
    const payload = { ...this.formData };

    const req$ = this.editId
      ? this.http.put<any>(`${this.apiUrl}/workflows/${this.editId}`, payload)
      : this.http.post<any>(`${this.apiUrl}/workflows`, payload);

    req$.subscribe({
      next: (res) => {
        this.message.success(this.editId ? 'Workflow berhasil diperbarui' : 'Workflow berhasil ditambahkan');
        this.saving.set(false);
        if (!this.editId && res.data?.id) {
          // Switch to edit mode to allow adding steps
          this.editId = res.data.id;
          this.steps.set([]);
        }
        this.loadWorkflows();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan workflow');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(wf: Workflow) {
    this.modal.confirm({
      nzTitle: 'Hapus Workflow?',
      nzContent: `Yakin ingin menghapus workflow "${wf.name}"? Semua langkah terkait juga akan dihapus.`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete<any>(`${this.apiUrl}/workflows/${wf.id}`).subscribe({
          next: () => {
            this.message.success('Workflow berhasil dihapus');
            this.loadWorkflows();
          },
          error: (err) => this.message.error(err?.error?.message || 'Gagal menghapus workflow')
        });
      }
    });
  }

  // Steps
  loadSteps(workflowId: string) {
    this.loadingSteps.set(true);
    this.http.get<any>(`${this.apiUrl}/workflows/${workflowId}/steps`).subscribe({
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

  openStepForm(step?: WorkflowStep) {
    this.editStepId = step?.id || null;
    this.stepForm = step ? {
      name: step.name,
      step_type: step.step_type,
      assignee_type: step.assignee_type,
      assignee_user_id: step.assignee_user_id || null,
      assignee_role_id: step.assignee_role_id || null,
      assignee_position_id: step.assignee_position_id || null,
      assignee_department_id: step.assignee_department_id || null,
      is_parallel: step.is_parallel,
      required_approvals: step.required_approvals,
      on_reject_action: step.on_reject_action,
      reject_to_step_id: step.reject_to_step_id || null,
      deadline_days: step.deadline_days ?? null,
      can_edit: step.can_edit,
      can_comment: step.can_comment,
      can_delegate: step.can_delegate,
      instructions: step.instructions || ''
    } : {
      name: '',
      step_type: 'approval',
      assignee_type: 'user',
      assignee_user_id: null,
      assignee_role_id: null,
      assignee_position_id: null,
      assignee_department_id: null,
      is_parallel: false,
      required_approvals: 1,
      on_reject_action: 'to_creator',
      reject_to_step_id: null,
      deadline_days: null,
      can_edit: false,
      can_comment: true,
      can_delegate: false,
      instructions: ''
    };
    this.stepDrawerVisible = true;
  }

  closeStepForm() {
    this.stepDrawerVisible = false;
    this.editStepId = null;
    this.stepForm = {};
  }

  onAssigneeTypeChange() {
    this.stepForm['assignee_user_id'] = null;
    this.stepForm['assignee_role_id'] = null;
    this.stepForm['assignee_position_id'] = null;
    this.stepForm['assignee_department_id'] = null;
  }

  saveStep() {
    if (!this.stepForm['name']?.trim()) {
      this.message.warning('Nama langkah wajib diisi');
      return;
    }
    if (!this.stepForm['step_type']) {
      this.message.warning('Tipe langkah wajib dipilih');
      return;
    }
    if (!this.stepForm['assignee_type']) {
      this.message.warning('Tipe penerima wajib dipilih');
      return;
    }

    const assigneeField = `assignee_${this.stepForm['assignee_type']}_id`;
    if (!this.stepForm[assigneeField]) {
      this.message.warning('Penerima wajib dipilih');
      return;
    }

    this.savingStep.set(true);
    const payload = { ...this.stepForm };

    const req$ = this.editStepId
      ? this.http.put<any>(`${this.apiUrl}/workflows/${this.editId}/steps/${this.editStepId}`, payload)
      : this.http.post<any>(`${this.apiUrl}/workflows/${this.editId}/steps`, payload);

    req$.subscribe({
      next: () => {
        this.message.success(this.editStepId ? 'Langkah berhasil diperbarui' : 'Langkah berhasil ditambahkan');
        this.savingStep.set(false);
        this.closeStepForm();
        this.loadSteps(this.editId!);
        this.loadWorkflows();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan langkah');
        this.savingStep.set(false);
      }
    });
  }

  confirmDeleteStep(step: WorkflowStep) {
    this.modal.confirm({
      nzTitle: 'Hapus Langkah?',
      nzContent: `Yakin ingin menghapus langkah "${step.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete<any>(`${this.apiUrl}/workflows/${this.editId}/steps/${step.id}`).subscribe({
          next: () => {
            this.message.success('Langkah berhasil dihapus');
            this.loadSteps(this.editId!);
            this.loadWorkflows();
          },
          error: (err) => this.message.error(err?.error?.message || 'Gagal menghapus langkah')
        });
      }
    });
  }

  moveStep(index: number, direction: -1 | 1) {
    const current = [...this.steps()];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    // Swap step_order values
    const temp = current[index].step_order;
    current[index].step_order = current[targetIndex].step_order;
    current[targetIndex].step_order = temp;

    // Swap positions in array
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.steps.set(current);

    // Send reorder to backend
    const stepOrders = current.map((s, i) => ({ id: s.id, step_order: i + 1 }));
    this.http.put<any>(`${this.apiUrl}/workflows/${this.editId}/steps/reorder`, { steps: stepOrders }).subscribe({
      next: (res) => {
        if (res.data) {
          const sorted = res.data.sort((a: WorkflowStep, b: WorkflowStep) => a.step_order - b.step_order);
          this.steps.set(sorted);
        }
      },
      error: () => {
        this.message.error('Gagal mengubah urutan langkah');
        this.loadSteps(this.editId!);
      }
    });
  }

  // Label helpers
  getStepTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'approval': 'Persetujuan',
      'review': 'Review',
      'notification': 'Notifikasi'
    };
    return map[type] || type;
  }

  getAssigneeTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'user': 'Pengguna',
      'role': 'Role',
      'position': 'Jabatan',
      'department': 'Departemen'
    };
    return map[type] || type;
  }
}
