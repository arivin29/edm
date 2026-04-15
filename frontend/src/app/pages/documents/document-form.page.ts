import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';

interface DropdownItem {
  id: string;
  name: string;
}

interface TemplateItem {
  id: string;
  name: string;
  document_type_id?: string;
}

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzSelectModule, NzSpinModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/documents" class="text-gray-500 hover:text-gray-700">
          <span nz-icon nzType="arrow-left"></span>
        </a>
        <h1 class="text-lg font-semibold m-0">{{ isEdit ? 'Edit Dokumen' : 'Buat Dokumen Baru' }}</h1>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-2 gap-4">
            <!-- Main Form -->
            <div class="col-span-2 lg:col-span-1">
              <nz-card nzSize="small" nzTitle="Informasi Utama">
                <nz-form-item>
                  <nz-form-label nzRequired>Judul Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Judul wajib diisi">
                    <input nz-input formControlName="title" placeholder="Masukkan judul dokumen" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Tipe Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Tipe wajib dipilih">
                    <nz-select formControlName="document_type_id" nzPlaceHolder="Pilih tipe dokumen" nzShowSearch>
                      @for (type of documentTypes(); track type.id) {
                        <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Kategori</nz-form-label>
                  <nz-form-control nzErrorTip="Kategori wajib dipilih">
                    <nz-select formControlName="category_id" nzPlaceHolder="Pilih kategori" nzShowSearch>
                      @for (cat of categories(); track cat.id) {
                        <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Nama Folder</nz-form-label>
                  <nz-form-control nzErrorTip="Nama folder wajib diisi">
                    <input nz-input formControlName="folder_name" placeholder="Masukkan nama folder" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Deskripsi</nz-form-label>
                  <nz-form-control>
                    <textarea nz-input formControlName="description" placeholder="Deskripsi dokumen (opsional)"
                              [nzAutosize]="{ minRows: 3, maxRows: 6 }"></textarea>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>
            </div>

            <!-- Sidebar -->
            <div class="col-span-2 lg:col-span-1">
              <nz-card nzSize="small" nzTitle="Organisasi">
                <nz-form-item>
                  <nz-form-label nzRequired>Perusahaan</nz-form-label>
                  <nz-form-control nzErrorTip="Perusahaan wajib dipilih">
                    <nz-select formControlName="company_id" nzPlaceHolder="Pilih perusahaan" nzShowSearch>
                      @for (company of companies(); track company.id) {
                        <nz-option [nzValue]="company.id" [nzLabel]="company.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Kantor</nz-form-label>
                  <nz-form-control nzErrorTip="Kantor wajib dipilih">
                    <nz-select formControlName="office_id" nzPlaceHolder="Pilih kantor" nzShowSearch>
                      @for (office of offices(); track office.id) {
                        <nz-option [nzValue]="office.id" [nzLabel]="office.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Departemen</nz-form-label>
                  <nz-form-control nzErrorTip="Departemen wajib dipilih">
                    <nz-select formControlName="department_id" nzPlaceHolder="Pilih departemen" nzShowSearch>
                      @for (dept of departments(); track dept.id) {
                        <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Seksi</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="section_id" nzPlaceHolder="Pilih seksi" nzAllowClear nzShowSearch>
                      @for (sec of sections(); track sec.id) {
                        <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <nz-card nzSize="small" nzTitle="Pengaturan" class="mt-3">
                <nz-form-item>
                  <nz-form-label>Prioritas</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="priority" nzPlaceHolder="Pilih prioritas">
                      <nz-option nzValue="normal" nzLabel="Normal"></nz-option>
                      <nz-option nzValue="tinggi" nzLabel="Tinggi"></nz-option>
                      <nz-option nzValue="urgent" nzLabel="Urgent"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kerahasiaan</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="confidentiality" nzPlaceHolder="Pilih kerahasiaan">
                      <nz-option nzValue="internal" nzLabel="Internal"></nz-option>
                      <nz-option nzValue="terbatas" nzLabel="Terbatas"></nz-option>
                      <nz-option nzValue="rahasia" nzLabel="Rahasia"></nz-option>
                      <nz-option nzValue="sangat_rahasia" nzLabel="Sangat Rahasia"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <nz-card nzSize="small" nzTitle="Template" class="mt-3">
                <nz-form-item>
                  <nz-form-label>Gunakan Template</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="template_id" nzPlaceHolder="Pilih template (opsional)" nzAllowClear nzShowSearch>
                      @for (tpl of filteredTemplates(); track tpl.id) {
                        <nz-option [nzValue]="tpl.id" [nzLabel]="tpl.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 mt-4">
            <button nz-button type="button" routerLink="/documents">Batal</button>
            <button nz-button nzType="default" type="button" (click)="onSubmit(true)" [nzLoading]="submitting()">
              Simpan Draft
            </button>
            <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()">
              {{ isEdit ? 'Simpan' : 'Buat Dokumen' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-card-head { padding: 0 12px; min-height: 36px; }
    :host ::ng-deep .ant-card-head-title { padding: 8px 0; font-size: 13px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-form-item-label { padding: 0 0 4px; }
    :host ::ng-deep .ant-form-item-label > label { font-size: 12px; height: auto; }
  `]
})
export class DocumentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);

  form!: FormGroup;
  isEdit = false;
  documentId: string | null = null;

  loading = signal(false);
  submitting = signal(false);
  selectedTypeId = signal<string | null>(null);

  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  companies = signal<DropdownItem[]>([]);
  offices = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);
  sections = signal<DropdownItem[]>([]);
  allTemplates = signal<TemplateItem[]>([]);

  filteredTemplates = computed(() => {
    const typeId = this.selectedTypeId();
    const all = this.allTemplates();
    if (!typeId) return all;
    return all.filter(t => !t.document_type_id || t.document_type_id === typeId);
  });

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      document_type_id: [null, Validators.required],
      category_id: [null, Validators.required],
      company_id: [null, Validators.required],
      office_id: [null, Validators.required],
      department_id: [null, Validators.required],
      folder_name: ['', Validators.required],
      description: [''],
      section_id: [null],
      template_id: [null],
      priority: ['normal'],
      confidentiality: ['internal']
    });

    // Filter templates when document type changes
    this.form.get('document_type_id')!.valueChanges.subscribe(typeId => {
      this.selectedTypeId.set(typeId);
      // Reset template if it no longer matches
      const currentTemplate = this.form.get('template_id')!.value;
      if (currentTemplate) {
        const stillValid = this.filteredTemplates().some(t => t.id === currentTemplate);
        if (!stillValid) {
          this.form.get('template_id')!.setValue(null);
        }
      }
    });

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.documentId = id;
      this.loadDocument(id);
    }
  }

  loadDropdowns() {
    forkJoin({
      types: this.http.get<any>(`${environment.apiUrl}/document-types`),
      categories: this.http.get<any>(`${environment.apiUrl}/categories`),
      companies: this.http.get<any>(`${environment.apiUrl}/companies`),
      offices: this.http.get<any>(`${environment.apiUrl}/offices`),
      departments: this.http.get<any>(`${environment.apiUrl}/departments`),
      sections: this.http.get<any>(`${environment.apiUrl}/sections`),
      templates: this.http.get<any>(`${environment.apiUrl}/templates`)
    }).subscribe({
      next: (res) => {
        this.documentTypes.set(res.types.data || []);
        this.categories.set(res.categories.data || []);
        this.companies.set(res.companies.data || []);
        this.offices.set(res.offices.data || []);
        this.departments.set(res.departments.data || []);
        this.sections.set(res.sections.data || []);
        this.allTemplates.set(res.templates.data || []);
      },
      error: () => {
        this.message.error('Gagal memuat data dropdown');
      }
    });
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        this.form.patchValue({
          title: doc.title,
          document_type_id: doc.document_type_id,
          category_id: doc.category_id,
          company_id: doc.company_id,
          office_id: doc.office_id,
          department_id: doc.department_id,
          folder_name: doc.folder_name,
          description: doc.description,
          section_id: doc.section_id,
          template_id: doc.template_id,
          priority: doc.priority || 'normal',
          confidentiality: doc.confidentiality || 'internal'
        });
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat dokumen');
        this.loading.set(false);
      }
    });
  }

  onSubmit(asDraft = false) {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);
    const data = { ...this.form.value, status: asDraft ? 'draft' : undefined };

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, data)
      : this.http.post(`${environment.apiUrl}/documents`, data);

    req.subscribe({
      next: (res: any) => {
        this.message.success(this.isEdit ? 'Dokumen berhasil diperbarui' : 'Dokumen berhasil dibuat');
        this.router.navigate(['/documents', res.data?.id || this.documentId]);
        this.submitting.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan dokumen');
        this.submitting.set(false);
      }
    });
  }
}
