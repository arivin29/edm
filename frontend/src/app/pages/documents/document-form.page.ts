import { Component, OnInit, inject, signal } from '@angular/core';
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
import { environment } from '../../../environments/environment';

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
                    <nz-select formControlName="type_id" nzPlaceHolder="Pilih tipe dokumen" nzShowSearch>
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
                  <nz-form-label>Department</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="department_id" nzPlaceHolder="Pilih department" nzAllowClear nzShowSearch>
                      @for (dept of departments(); track dept.id) {
                        <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Section</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="section_id" nzPlaceHolder="Pilih section" nzAllowClear nzShowSearch>
                      @for (sec of sections(); track sec.id) {
                        <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </nz-card>

              <nz-card nzSize="small" nzTitle="Template" class="mt-3">
                <nz-form-item>
                  <nz-form-label>Gunakan Template</nz-form-label>
                  <nz-form-control>
                    <nz-select formControlName="template_id" nzPlaceHolder="Pilih template (opsional)" nzAllowClear nzShowSearch>
                      @for (tpl of templates(); track tpl.id) {
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
  documentId: number | null = null;

  loading = signal(false);
  submitting = signal(false);
  documentTypes = signal<{id: number; name: string}[]>([]);
  categories = signal<{id: number; name: string}[]>([]);
  departments = signal<{id: number; name: string}[]>([]);
  sections = signal<{id: number; name: string}[]>([]);
  templates = signal<{id: number; name: string}[]>([]);

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      type_id: [null, Validators.required],
      category_id: [null, Validators.required],
      description: [''],
      department_id: [null],
      section_id: [null],
      template_id: [null]
    });

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.documentId = +id;
      this.loadDocument(this.documentId);
    }
  }

  loadDropdowns() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => this.documentTypes.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/document-categories`).subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/departments`).subscribe({
      next: (res) => this.departments.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/sections`).subscribe({
      next: (res) => this.sections.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/templates`).subscribe({
      next: (res) => this.templates.set(res.data || [])
    });
  }

  loadDocument(id: number) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        this.form.patchValue({
          title: doc.title,
          type_id: doc.type_id,
          category_id: doc.category_id,
          description: doc.description,
          department_id: doc.department_id,
          section_id: doc.section_id,
          template_id: doc.template_id
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
