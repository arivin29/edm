import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Template {
  id: string;
  name: string;
  code?: string;
  description?: string;
  document_type_id: string;
  category_id?: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  version: number;
  status: string;
  is_active: boolean;
  document_type?: { id: string; name: string };
  category?: { id: string; name: string };
  company?: { id: string; name: string };
  tags?: TemplateTag[];
  tag_count?: number;
  type_name?: string;
  category_name?: string;
  created_at: string;
}

interface TemplateTag {
  id: string;
  template_id: string;
  tag_key: string;
  tag_placeholder: string;
  label: string;
  description?: string;
  data_type: string;
  source_type: string;
  source_config?: any;
  format_pattern?: string;
  default_value?: string;
  placeholder_text?: string;
  is_required: boolean;
  is_readonly: boolean;
  is_hidden: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  validation_regex?: string;
  validation_message?: string;
  group_name?: string;
  group_order: number;
  field_order: number;
  col_span: number;
  table_config?: any;
  signature_config?: any;
}

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzInputNumberModule, NzCardModule, NzDropDownModule,
    NzDrawerModule, NzModalModule, NzFormModule, NzSelectModule,
    NzUploadModule, NzCheckboxModule, NzSliderModule, NzDividerModule,
    NzToolTipModule, NzSpinModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Template Dokumen</h1>
          <p class="text-gray-500 text-xs m-0">Kelola template DOCX</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span>
          Tambah Template
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-3 mb-4">
        <div class="bg-white rounded-lg border p-3">
          <div class="text-xs text-gray-500">Total Template</div>
          <div class="text-xl font-bold text-gray-800">{{ statsTotal() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-2 border-l-green-500">
          <div class="text-xs text-gray-500">Aktif</div>
          <div class="text-xl font-bold text-green-600">{{ statsActive() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-2 border-l-orange-500">
          <div class="text-xs text-gray-500">Draft</div>
          <div class="text-xl font-bold text-orange-600">{{ statsDraft() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-2 border-l-gray-400">
          <div class="text-xs text-gray-500">Arsip</div>
          <div class="text-xl font-bold text-gray-500">{{ statsArchived() }}</div>
        </div>
      </div>

      <!-- Search & Filter -->
      <nz-card nzSize="small" class="mb-3">
        <div class="flex items-center gap-3">
          <nz-input-group nzSize="small" [nzPrefix]="prefixIcon" class="w-64">
            <input nz-input nzSize="small" placeholder="Cari template..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
          </nz-input-group>
          <nz-select nzSize="small" [(ngModel)]="filterDocTypeId" nzPlaceHolder="Semua Tipe Dokumen"
                     nzAllowClear class="w-48" (ngModelChange)="onSearch()">
            @for (type of documentTypes(); track type.id) {
              <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
            }
          </nz-select>
        </div>
        <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #tplTable [nzData]="filteredTemplates()" [nzLoading]="loading()"
                  nzSize="small" [nzPageSize]="15">
          <thead>
            <tr>
              <th nzWidth="90px">Kode</th>
              <th>Nama</th>
              <th nzWidth="120px">Tipe Dokumen</th>
              <th nzWidth="50px" nzAlign="center">Versi</th>
              <th nzWidth="180px">File</th>
              <th nzWidth="70px" nzAlign="center">Status</th>
              <th nzWidth="65px" nzAlign="center">Tags</th>
              <th nzWidth="90px">Dibuat</th>
              <th nzWidth="60px" nzAlign="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (tpl of tplTable.data; track tpl.id) {
              <tr>
                <td><code class="text-xs">{{ tpl.code || '-' }}</code></td>
                <td>
                  <div class="font-medium text-gray-800">{{ tpl.name }}</div>
                  @if (tpl.category?.name || tpl.category_name) {
                    <div class="text-xs text-gray-400">{{ tpl.category?.name || tpl.category_name }}</div>
                  }
                </td>
                <td>
                  <span class="text-xs">{{ tpl.document_type?.name || tpl.type_name || '-' }}</span>
                </td>
                <td nzAlign="center">
                  <nz-tag nzColor="blue" class="m-0">v{{ tpl.version || 1 }}</nz-tag>
                </td>
                <td>
                  <div class="flex items-center gap-1.5">
                    <span nz-icon nzType="file-word" class="text-blue-500 text-sm"></span>
                    <div class="truncate">
                      <div class="text-xs truncate max-w-[120px]" [title]="tpl.file_name">{{ tpl.file_name || '-' }}</div>
                      @if (tpl.file_size) {
                        <div class="text-[10px] text-gray-400">{{ formatFileSize(tpl.file_size) }}</div>
                      }
                    </div>
                  </div>
                </td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getStatusColor(tpl.status)" class="m-0">
                    {{ getStatusLabel(tpl.status) }}
                  </nz-tag>
                </td>
                <td nzAlign="center">
                  <nz-tag class="m-0">{{ tpl.tag_count || 0 }}</nz-tag>
                </td>
                <td>
                  <span class="text-xs text-gray-500">{{ formatDate(tpl.created_at) }}</span>
                </td>
                <td nzAlign="center">
                  <a nz-dropdown [nzDropdownMenu]="actionMenu" nzTrigger="click">
                    <span nz-icon nzType="more" class="cursor-pointer text-gray-600"></span>
                  </a>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu nzSelectable>
                      <li nz-menu-item (click)="openDrawer(tpl)">
                        <span nz-icon nzType="edit"></span> Edit
                      </li>
                      <li nz-menu-item (click)="openTagDrawer(tpl)">
                        <span nz-icon nzType="setting"></span> Kelola Parameter
                      </li>
                      <li nz-menu-item (click)="download(tpl)">
                        <span nz-icon nzType="download"></span> Download
                      </li>
                      <li nz-menu-item nzDanger (click)="deleteTemplate(tpl)">
                        <span nz-icon nzType="delete"></span> Hapus
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="text-center text-gray-500 py-8">
                  Tidak ada template ditemukan
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>

      <!-- Drawer: Create/Edit Template -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="editId ? 'Edit Template' : 'Tambah Template'"
                 nzPlacement="right" [nzWidth]="500" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Nama Template</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.name" name="name" placeholder="Nama template" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Tipe Dokumen</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.document_type_id" name="document_type_id"
                           nzPlaceHolder="Pilih tipe" nzAllowClear>
                  @for (type of documentTypes(); track type.id) {
                    <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Kategori</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.category_id" name="category_id"
                           nzPlaceHolder="Pilih kategori" nzAllowClear>
                  @for (cat of categories(); track cat.id) {
                    <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Perusahaan</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.company_id" name="company_id"
                           nzPlaceHolder="Pilih perusahaan" nzAllowClear>
                  @for (comp of companies(); track comp.id) {
                    <nz-option [nzValue]="comp.id" [nzLabel]="comp.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Deskripsi</nz-form-label>
              <nz-form-control>
                <textarea nz-input [(ngModel)]="formData.description" name="description"
                          placeholder="Deskripsi (opsional)" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
              </nz-form-control>
            </nz-form-item>
            @if (!editId) {
              <nz-form-item>
                <nz-form-label nzRequired>File Template (DOCX)</nz-form-label>
                <nz-form-control>
                  <nz-upload [nzBeforeUpload]="beforeUpload" [nzFileList]="fileList" nzAccept=".docx">
                    <button nz-button nzSize="small" type="button">
                      <span nz-icon nzType="upload"></span> Pilih File
                    </button>
                  </nz-upload>
                </nz-form-control>
              </nz-form-item>
            }
            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">Simpan</button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>

      <!-- Drawer: Tag Management (2nd level) -->
      <nz-drawer [nzVisible]="tagDrawerVisible"
                 [nzTitle]="'Parameter Template: ' + (selectedTemplate?.name || '')"
                 nzPlacement="right" [nzWidth]="700" (nzOnClose)="closeTagDrawer()">
        <ng-container *nzDrawerContent>
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs text-gray-500">Daftar parameter/tag untuk template ini</span>
            <button nz-button nzType="primary" nzSize="small" (click)="openTagFormDrawer()">
              <span nz-icon nzType="plus"></span> Tambah Parameter
            </button>
          </div>

          <nz-table #tagTable [nzData]="tags()" [nzLoading]="tagsLoading()"
                    nzSize="small" [nzPageSize]="20" [nzShowPagination]="tags().length > 20">
            <thead>
              <tr>
                <th nzWidth="140px">Tag Key</th>
                <th nzWidth="140px">Label</th>
                <th nzWidth="90px">Tipe Data</th>
                <th nzWidth="70px">Wajib</th>
                <th nzWidth="60px">Urutan</th>
                <th nzWidth="80px">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (tag of tagTable.data; track tag.id) {
                <tr>
                  <td>
                    <code class="text-xs">{{ tag.tag_key }}</code>
                  </td>
                  <td>{{ tag.label }}</td>
                  <td>
                    <nz-tag>{{ tag.data_type }}</nz-tag>
                  </td>
                  <td>
                    <nz-tag [nzColor]="tag.is_required ? 'red' : 'default'">
                      {{ tag.is_required ? 'Ya' : 'Tidak' }}
                    </nz-tag>
                  </td>
                  <td>{{ tag.field_order }}</td>
                  <td>
                    <button nz-button nzType="link" nzSize="small" (click)="openTagFormDrawer(tag)"
                            nz-tooltip nzTooltipTitle="Edit">
                      <span nz-icon nzType="edit"></span>
                    </button>
                    <button nz-button nzType="link" nzSize="small" nzDanger (click)="deleteTag(tag)"
                            nz-tooltip nzTooltipTitle="Hapus">
                      <span nz-icon nzType="delete"></span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="text-center text-gray-500 py-6">
                    Belum ada parameter. Klik "Tambah Parameter" untuk menambahkan.
                  </td>
                </tr>
              }
            </tbody>
          </nz-table>
        </ng-container>
      </nz-drawer>

      <!-- Drawer: Tag Form (3rd level) -->
      <nz-drawer [nzVisible]="tagFormDrawerVisible"
                 [nzTitle]="editTagId ? 'Edit Parameter' : 'Tambah Parameter'"
                 nzPlacement="right" [nzWidth]="500" (nzOnClose)="closeTagFormDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <!-- Informasi Dasar -->
            <nz-divider nzText="Informasi Dasar" nzOrientation="left" class="!mt-0 !text-xs"></nz-divider>
            <nz-form-item>
              <nz-form-label nzRequired>Tag Key</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.tag_key" name="tag_key"
                       placeholder="contoh: document_number" (ngModelChange)="onTagKeyChange()" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Placeholder</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.tag_placeholder" name="tag_placeholder"
                       placeholder="Auto-generated" [disabled]="true" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Label</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.label" name="label"
                       placeholder="contoh: Nomor Dokumen" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Deskripsi</nz-form-label>
              <nz-form-control>
                <textarea nz-input [(ngModel)]="tagFormData.description" name="tag_description"
                          placeholder="Deskripsi parameter (opsional)" [nzAutosize]="{ minRows: 2, maxRows: 3 }"></textarea>
              </nz-form-control>
            </nz-form-item>

            <!-- Tipe & Sumber -->
            <nz-divider nzText="Tipe & Sumber" nzOrientation="left" class="!text-xs"></nz-divider>
            <nz-form-item>
              <nz-form-label nzRequired>Tipe Data</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="tagFormData.data_type" name="data_type"
                           nzPlaceHolder="Pilih tipe data">
                  @for (dt of dataTypeOptions; track dt) {
                    <nz-option [nzValue]="dt" [nzLabel]="dt"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label nzRequired>Tipe Sumber</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="tagFormData.source_type" name="source_type"
                           nzPlaceHolder="Pilih tipe sumber">
                  @for (st of sourceTypeOptions; track st) {
                    <nz-option [nzValue]="st" [nzLabel]="st"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            @if (tagFormData.source_type === 'api' || tagFormData.source_type === 'computed') {
              <nz-form-item>
                <nz-form-label>Konfigurasi Sumber (JSON)</nz-form-label>
                <nz-form-control>
                  <textarea nz-input [(ngModel)]="sourceConfigStr" name="source_config"
                            placeholder='{"url": "/api/...", "labelField": "name", "valueField": "id"}'
                            [nzAutosize]="{ minRows: 3, maxRows: 6 }"></textarea>
                </nz-form-control>
              </nz-form-item>
            }

            <!-- Validasi -->
            <nz-divider nzText="Validasi" nzOrientation="left" class="!text-xs"></nz-divider>
            <div class="flex gap-4 mb-3">
              <label nz-checkbox [(ngModel)]="tagFormData.is_required" name="is_required">Wajib</label>
              <label nz-checkbox [(ngModel)]="tagFormData.is_readonly" name="is_readonly">Readonly</label>
              <label nz-checkbox [(ngModel)]="tagFormData.is_hidden" name="is_hidden">Tersembunyi</label>
            </div>
            <div class="flex gap-2">
              <nz-form-item class="flex-1">
                <nz-form-label>Min Panjang</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.min_length" name="min_length"
                                   [nzMin]="0" class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item class="flex-1">
                <nz-form-label>Max Panjang</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.max_length" name="max_length"
                                   [nzMin]="0" class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div class="flex gap-2">
              <nz-form-item class="flex-1">
                <nz-form-label>Min Nilai</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.min_value" name="min_value"
                                   class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item class="flex-1">
                <nz-form-label>Max Nilai</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.max_value" name="max_value"
                                   class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <nz-form-item>
              <nz-form-label>Regex Validasi</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.validation_regex" name="validation_regex"
                       placeholder="contoh: ^[A-Z0-9]+$" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Pesan Validasi</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.validation_message" name="validation_message"
                       placeholder="Pesan error jika validasi gagal" />
              </nz-form-control>
            </nz-form-item>

            <!-- Tampilan -->
            <nz-divider nzText="Tampilan" nzOrientation="left" class="!text-xs"></nz-divider>
            <nz-form-item>
              <nz-form-label>Nilai Default</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.default_value" name="default_value"
                       placeholder="Nilai default (opsional)" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Placeholder Teks</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.placeholder_text" name="placeholder_text"
                       placeholder="Placeholder input (opsional)" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Format Pattern</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="tagFormData.format_pattern" name="format_pattern"
                       placeholder="contoh: DD/MM/YYYY" />
              </nz-form-control>
            </nz-form-item>
            <div class="flex gap-2">
              <nz-form-item class="flex-1">
                <nz-form-label>Nama Grup</nz-form-label>
                <nz-form-control>
                  <input nz-input nzSize="small" [(ngModel)]="tagFormData.group_name" name="group_name"
                         placeholder="Nama grup" />
                </nz-form-control>
              </nz-form-item>
              <nz-form-item class="w-24">
                <nz-form-label>Urutan Grup</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.group_order" name="group_order"
                                   [nzMin]="0" class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
            </div>
            <div class="flex gap-2">
              <nz-form-item class="w-28">
                <nz-form-label>Urutan Field</nz-form-label>
                <nz-form-control>
                  <nz-input-number nzSize="small" [(ngModel)]="tagFormData.field_order" name="field_order"
                                   [nzMin]="0" class="w-full"></nz-input-number>
                </nz-form-control>
              </nz-form-item>
              <nz-form-item class="flex-1">
                <nz-form-label>Lebar Kolom (1-24): {{ tagFormData.col_span }}</nz-form-label>
                <nz-form-control>
                  <nz-slider [(ngModel)]="tagFormData.col_span" name="col_span"
                             [nzMin]="1" [nzMax]="24" [nzStep]="1"></nz-slider>
                </nz-form-control>
              </nz-form-item>
            </div>

            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock
                      [nzLoading]="tagSaving()" (click)="saveTag()">Simpan Parameter</button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 11px; font-weight: 600; background: #fafafa; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr:nth-child(even) > td { background: #fafbfc; }
    :host ::ng-deep .ant-tag { font-size: 10px; line-height: 18px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-divider { margin: 12px 0 8px; }
    :host ::ng-deep .ant-divider-inner-text { font-size: 12px; font-weight: 600; }
    code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 11px; color: #595959; }
  `]
})
export class TemplateListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  // Main list
  templates = signal<Template[]>([]);
  documentTypes = signal<{ id: string; name: string }[]>([]);
  categories = signal<{ id: string; name: string }[]>([]);
  companies = signal<{ id: string; name: string }[]>([]);
  loading = signal(false);
  saving = signal(false);
  searchText = '';
  filterDocTypeId: string | null = null;

  // Stats computed
  statsTotal = computed(() => this.templates().length);
  statsActive = computed(() => this.templates().filter(t => t.status === 'active').length);
  statsDraft = computed(() => this.templates().filter(t => t.status === 'draft').length);
  statsArchived = computed(() => this.templates().filter(t => t.status === 'archived').length);

  // Filtered list for table
  filteredTemplates = computed(() => {
    let data = this.templates();
    if (this.filterDocTypeId) {
      data = data.filter(t => t.document_type_id === this.filterDocTypeId);
    }
    return data;
  });

  // Template drawer
  drawerVisible = false;
  formData: any = {};
  editId: string | null = null;
  fileList: any[] = [];

  // Tag management drawer
  tagDrawerVisible = false;
  selectedTemplate: Template | null = null;
  tags = signal<TemplateTag[]>([]);
  tagsLoading = signal(false);

  // Tag form drawer
  tagFormDrawerVisible = false;
  tagFormData: any = {};
  editTagId: string | null = null;
  tagSaving = signal(false);
  sourceConfigStr = '';

  dataTypeOptions = ['text', 'number', 'date', 'select', 'textarea', 'checkbox', 'radio', 'file', 'signature', 'table'];
  sourceTypeOptions = ['static', 'api', 'computed'];

  ngOnInit() {
    this.loadTemplates();
    this.loadDropdowns();
  }

  // ── Template CRUD ──

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

  openDrawer(item?: Template) {
    this.editId = item?.id || null;
    this.formData = item
      ? { name: item.name, description: item.description, document_type_id: item.document_type_id, category_id: item.category_id, company_id: item.company_id }
      : { name: '', description: '', document_type_id: null, category_id: null, company_id: null };
    this.fileList = [];
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editId = null;
    this.formData = {};
    this.fileList = [];
  }

  beforeUpload = (file: any): boolean => {
    this.fileList = [file];
    return false;
  };

  save() {
    if (!this.formData.name) {
      this.message.warning('Nama template wajib diisi');
      return;
    }
    if (!this.editId && this.fileList.length === 0) {
      this.message.warning('File template wajib diupload');
      return;
    }

    this.saving.set(true);
    const fd = new FormData();
    fd.append('name', this.formData.name);
    if (this.formData.description) fd.append('description', this.formData.description);
    if (this.formData.document_type_id) fd.append('document_type_id', this.formData.document_type_id);
    if (this.formData.category_id) fd.append('category_id', this.formData.category_id);
    if (this.formData.company_id) fd.append('company_id', this.formData.company_id);
    if (this.fileList.length > 0) fd.append('file', this.fileList[0]);

    const req = this.editId
      ? this.http.put(`${environment.apiUrl}/templates/${this.editId}`, fd)
      : this.http.post(`${environment.apiUrl}/templates`, fd);

    req.subscribe({
      next: () => {
        this.message.success('Template berhasil disimpan');
        this.closeDrawer();
        this.loadTemplates();
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan template');
        this.saving.set(false);
      }
    });
  }

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

  // ── Tag Management ──

  openTagDrawer(tpl: Template) {
    this.selectedTemplate = tpl;
    this.tagDrawerVisible = true;
    this.loadTags();
  }

  closeTagDrawer() {
    this.tagDrawerVisible = false;
    this.selectedTemplate = null;
    this.tags.set([]);
    this.loadTemplates();
  }

  loadTags() {
    if (!this.selectedTemplate) return;
    this.tagsLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${this.selectedTemplate.id}/tags`).subscribe({
      next: (res) => {
        this.tags.set(res.data || []);
        this.tagsLoading.set(false);
      },
      error: () => {
        this.tags.set([]);
        this.tagsLoading.set(false);
      }
    });
  }

  openTagFormDrawer(tag?: TemplateTag) {
    this.editTagId = tag?.id || null;
    if (tag) {
      this.tagFormData = { ...tag };
      this.sourceConfigStr = tag.source_config ? JSON.stringify(tag.source_config, null, 2) : '';
    } else {
      this.tagFormData = {
        tag_key: '', tag_placeholder: '', label: '', description: '',
        data_type: 'text', source_type: 'static', source_config: null,
        format_pattern: '', default_value: '', placeholder_text: '',
        is_required: false, is_readonly: false, is_hidden: false,
        min_length: null, max_length: null, min_value: null, max_value: null,
        validation_regex: '', validation_message: '',
        group_name: '', group_order: 0, field_order: 0, col_span: 12,
        table_config: null, signature_config: null
      };
      this.sourceConfigStr = '';
    }
    this.tagFormDrawerVisible = true;
  }

  closeTagFormDrawer() {
    this.tagFormDrawerVisible = false;
    this.editTagId = null;
    this.tagFormData = {};
    this.sourceConfigStr = '';
  }

  onTagKeyChange() {
    if (this.tagFormData.tag_key) {
      this.tagFormData.tag_placeholder = `{{${this.tagFormData.tag_key}}}`;
    } else {
      this.tagFormData.tag_placeholder = '';
    }
  }

  saveTag() {
    if (!this.tagFormData.tag_key) {
      this.message.warning('Tag key wajib diisi');
      return;
    }
    if (!this.tagFormData.label) {
      this.message.warning('Label wajib diisi');
      return;
    }
    if (!this.selectedTemplate) return;

    // Parse source_config JSON
    if (this.sourceConfigStr) {
      try {
        this.tagFormData.source_config = JSON.parse(this.sourceConfigStr);
      } catch {
        this.message.warning('Format JSON konfigurasi sumber tidak valid');
        return;
      }
    } else {
      this.tagFormData.source_config = null;
    }

    this.tagSaving.set(true);
    const payload = { ...this.tagFormData };
    delete payload.id;
    delete payload.template_id;
    delete payload.created_at;
    delete payload.updated_at;

    const req = this.editTagId
      ? this.http.put(`${environment.apiUrl}/templates/${this.selectedTemplate.id}/tags/${this.editTagId}`, payload)
      : this.http.post(`${environment.apiUrl}/templates/${this.selectedTemplate.id}/tags`, payload);

    req.subscribe({
      next: () => {
        this.message.success('Parameter berhasil disimpan');
        this.closeTagFormDrawer();
        this.loadTags();
        this.tagSaving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan parameter');
        this.tagSaving.set(false);
      }
    });
  }

  deleteTag(tag: TemplateTag) {
    if (!this.selectedTemplate) return;
    this.modal.confirm({
      nzTitle: 'Hapus Parameter?',
      nzContent: `Yakin ingin menghapus parameter "${tag.label}" (${tag.tag_key})?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/templates/${this.selectedTemplate!.id}/tags/${tag.id}`).subscribe({
          next: () => {
            this.message.success('Parameter berhasil dihapus');
            this.loadTags();
          },
          error: () => this.message.error('Gagal menghapus parameter')
        });
      }
    });
  }
}
