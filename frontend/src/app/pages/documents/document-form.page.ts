import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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

interface TemplateTag {
  tag_key: string;
  label: string;
  description?: string;
  data_type: string;
  source_type: string;
  source_config?: any;
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
  format_pattern?: string;
}

interface TagGroup {
  name: string;
  order: number;
  tags: TemplateTag[];
}

interface DraftData {
  step: number;
  formData: any;
  metadata: Record<string, any>;
  selectedTemplateId: string | null;
  timestamp: number;
}

const DRAFT_KEY = 'dms_document_draft';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule,
    NzInputModule, NzInputNumberModule, NzSelectModule, NzDatePickerModule,
    NzCheckboxModule, NzRadioModule, NzSpinModule, NzToolTipModule, NzGridModule,
    NzStepsModule, NzDescriptionsModule, NzDividerModule, NzAlertModule, NzModalModule
  ],
  template: `
    <div class="doc-wizard">
      <!-- Header -->
      <div class="wizard-header">
        <div class="header-left">
          <a routerLink="/documents" class="back-link">
            <span nz-icon nzType="arrow-left"></span>
          </a>
          <h1 class="header-title">{{ isEdit ? 'Edit Dokumen' : 'Buat Dokumen Baru' }}</h1>
        </div>
        @if (!isEdit) {
          <button nz-button nzSize="small" nzDanger type="button" (click)="clearDraft()">
            <span nz-icon nzType="delete"></span> Hapus Draft
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-wrap">
          <nz-spin nzSimple></nz-spin>
        </div>
      } @else {
        <!-- Stepper -->
        <nz-steps [nzCurrent]="currentStep()" nzSize="small" class="wizard-steps">
          <nz-step nzTitle="Klasifikasi"></nz-step>
          <nz-step nzTitle="Organisasi"></nz-step>
          <nz-step nzTitle="Informasi"></nz-step>
          <nz-step nzTitle="Metadata"></nz-step>
          <nz-step nzTitle="Review"></nz-step>
        </nz-steps>

        <!-- Step Content -->
        <div class="step-content">

          <!-- STEP 0: Klasifikasi & Template -->
          @if (currentStep() === 0) {
            <nz-card nzSize="small" nzTitle="Klasifikasi & Template">
              <form nz-form [formGroup]="form" nzLayout="vertical">
                <nz-form-item>
                  <nz-form-label nzRequired>Tipe Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Tipe dokumen wajib dipilih">
                    <nz-select nzSize="small" formControlName="document_type_id"
                               nzPlaceHolder="Pilih tipe dokumen" nzShowSearch>
                      @for (type of documentTypes(); track type.id) {
                        <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label nzRequired>Template</nz-form-label>
                  <nz-form-control nzErrorTip="Template wajib dipilih">
                    <nz-select nzSize="small" formControlName="template_id"
                               nzPlaceHolder="Pilih template" nzShowSearch>
                      @for (tpl of filteredTemplates(); track tpl.id) {
                        <nz-option [nzValue]="tpl.id" [nzLabel]="tpl.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kategori</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="category_id"
                               nzPlaceHolder="Pilih kategori (opsional)" nzShowSearch nzAllowClear>
                      @for (cat of categories(); track cat.id) {
                        <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </form>
            </nz-card>
          }

          <!-- STEP 1: Organisasi -->
          @if (currentStep() === 1) {
            <nz-card nzSize="small" nzTitle="Organisasi">
              <nz-alert nzType="info" nzMessage="Semua field opsional, namun disarankan untuk diisi." nzShowIcon
                        class="org-alert"></nz-alert>
              <form nz-form [formGroup]="form" nzLayout="vertical">
                <nz-form-item>
                  <nz-form-label>Perusahaan</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="company_id"
                               nzPlaceHolder="Pilih perusahaan" nzShowSearch nzAllowClear>
                      @for (company of companies(); track company.id) {
                        <nz-option [nzValue]="company.id" [nzLabel]="company.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kantor</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="office_id"
                               nzPlaceHolder="Pilih kantor" nzShowSearch nzAllowClear>
                      @for (office of offices(); track office.id) {
                        <nz-option [nzValue]="office.id" [nzLabel]="office.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Departemen</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="department_id"
                               nzPlaceHolder="Pilih departemen" nzShowSearch nzAllowClear>
                      @for (dept of departments(); track dept.id) {
                        <nz-option [nzValue]="dept.id" [nzLabel]="dept.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Seksi</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="section_id"
                               nzPlaceHolder="Pilih seksi" nzShowSearch nzAllowClear>
                      @for (sec of sections(); track sec.id) {
                        <nz-option [nzValue]="sec.id" [nzLabel]="sec.name"></nz-option>
                      }
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </form>
            </nz-card>
          }

          <!-- STEP 2: Informasi Dokumen -->
          @if (currentStep() === 2) {
            <nz-card nzSize="small" nzTitle="Informasi Dokumen">
              <form nz-form [formGroup]="form" nzLayout="vertical">
                <nz-form-item>
                  <nz-form-label nzRequired>Judul Dokumen</nz-form-label>
                  <nz-form-control nzErrorTip="Judul wajib diisi">
                    <input nz-input nzSize="small" formControlName="title"
                           placeholder="Masukkan judul dokumen" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Deskripsi</nz-form-label>
                  <nz-form-control>
                    <textarea nz-input nzSize="small" formControlName="description"
                              placeholder="Deskripsi dokumen (opsional)"
                              [nzAutosize]="{ minRows: 3, maxRows: 6 }"></textarea>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Nama Folder</nz-form-label>
                  <nz-form-control>
                    <input nz-input nzSize="small" formControlName="folder_name"
                           placeholder="Masukkan nama folder (opsional)" />
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Prioritas</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="priority" nzPlaceHolder="Pilih prioritas">
                      <nz-option nzValue="normal" nzLabel="Normal"></nz-option>
                      <nz-option nzValue="tinggi" nzLabel="Tinggi"></nz-option>
                      <nz-option nzValue="urgent" nzLabel="Urgent"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item>
                  <nz-form-label>Kerahasiaan</nz-form-label>
                  <nz-form-control>
                    <nz-select nzSize="small" formControlName="confidentiality" nzPlaceHolder="Pilih kerahasiaan">
                      <nz-option nzValue="internal" nzLabel="Internal"></nz-option>
                      <nz-option nzValue="terbatas" nzLabel="Terbatas"></nz-option>
                      <nz-option nzValue="rahasia" nzLabel="Rahasia"></nz-option>
                      <nz-option nzValue="sangat_rahasia" nzLabel="Sangat Rahasia"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>
              </form>
            </nz-card>
          }

          <!-- STEP 3: Metadata Template -->
          @if (currentStep() === 3) {
            @if (loadingTags()) {
              <nz-card nzSize="small" nzTitle="Metadata Template">
                <div class="loading-wrap">
                  <nz-spin nzSimple nzSize="small"></nz-spin>
                  <p class="loading-text">Memuat field template...</p>
                </div>
              </nz-card>
            } @else if (tagGroups().length > 0) {
              <nz-card nzSize="small" nzTitle="Metadata Template">
                @for (group of tagGroups(); track group.name) {
                  @if (tagGroups().length > 1) {
                    <div class="group-title">{{ group.name }}</div>
                  }
                  <div nz-row [nzGutter]="12">
                    @for (tag of group.tags; track tag.tag_key) {
                      @if (!tag.is_hidden) {
                        <div nz-col [nzSpan]="tag.col_span || 12">
                          <nz-form-item>
                            <nz-form-label [nzRequired]="tag.is_required">
                              {{ tag.label }}
                              @if (tag.description) {
                                <span nz-icon nzType="info-circle" nz-tooltip
                                      [nzTooltipTitle]="tag.description"
                                      class="tag-info-icon"></span>
                              }
                            </nz-form-label>
                            <nz-form-control [nzErrorTip]="tag.validation_message || (tag.label + ' wajib diisi')">
                              @switch (tag.data_type) {
                                @case ('text') {
                                  <input nz-input nzSize="small"
                                         [formControl]="getTagControl(tag.tag_key)"
                                         [placeholder]="tag.placeholder_text || ''"
                                         [readOnly]="tag.is_readonly" />
                                }
                                @case ('number') {
                                  <nz-input-number nzSize="small" style="width:100%"
                                                   [formControl]="getTagControl(tag.tag_key)"
                                                   [nzPlaceHolder]="tag.placeholder_text || ''"
                                                   [nzMin]="tag.min_value ?? -9999999999"
                                                   [nzMax]="tag.max_value ?? 9999999999"
                                                   [nzDisabled]="tag.is_readonly">
                                  </nz-input-number>
                                }
                                @case ('date') {
                                  <nz-date-picker nzSize="small" style="width:100%"
                                                  [formControl]="getTagControl(tag.tag_key)"
                                                  [nzPlaceHolder]="tag.placeholder_text || 'Pilih tanggal'"
                                                  [nzDisabled]="tag.is_readonly"
                                                  [nzFormat]="tag.format_pattern || 'dd/MM/yyyy'">
                                  </nz-date-picker>
                                }
                                @case ('select') {
                                  <nz-select nzSize="small" nzShowSearch
                                             [formControl]="getTagControl(tag.tag_key)"
                                             [nzPlaceHolder]="tag.placeholder_text || 'Pilih'"
                                             [nzDisabled]="tag.is_readonly">
                                    @for (opt of getSelectOptions(tag); track opt.value) {
                                      <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
                                    }
                                  </nz-select>
                                }
                                @case ('textarea') {
                                  <textarea nz-input nzSize="small"
                                            [formControl]="getTagControl(tag.tag_key)"
                                            [placeholder]="tag.placeholder_text || ''"
                                            [readOnly]="tag.is_readonly"
                                            [nzAutosize]="{ minRows: 2, maxRows: 5 }"></textarea>
                                }
                                @case ('checkbox') {
                                  <label nz-checkbox
                                         [formControl]="getTagControl(tag.tag_key)"
                                         [nzDisabled]="tag.is_readonly">
                                    {{ tag.placeholder_text || tag.label }}
                                  </label>
                                }
                                @case ('radio') {
                                  <nz-radio-group nzSize="small"
                                                  [formControl]="getTagControl(tag.tag_key)"
                                                  [nzDisabled]="tag.is_readonly">
                                    @for (opt of getSelectOptions(tag); track opt.value) {
                                      <label nz-radio [nzValue]="opt.value">{{ opt.label }}</label>
                                    }
                                  </nz-radio-group>
                                }
                                @case ('file') {
                                  <span class="placeholder-text">(akan diupload setelah dokumen dibuat)</span>
                                }
                                @case ('signature') {
                                  <span class="placeholder-text">(tanda tangan digital)</span>
                                }
                                @case ('table') {
                                  <span class="placeholder-text">(tabel akan diisi di editor)</span>
                                }
                                @default {
                                  <input nz-input nzSize="small"
                                         [formControl]="getTagControl(tag.tag_key)"
                                         [placeholder]="tag.placeholder_text || ''" />
                                }
                              }
                            </nz-form-control>
                          </nz-form-item>
                        </div>
                      }
                    }
                  </div>
                }
              </nz-card>
            } @else {
              <nz-card nzSize="small" nzTitle="Metadata Template">
                <nz-alert nzType="info"
                          nzMessage="Template ini tidak memiliki parameter tambahan."
                          nzShowIcon></nz-alert>
              </nz-card>
            }
          }

          <!-- STEP 4: Review & Kirim -->
          @if (currentStep() === 4) {
            <nz-card nzSize="small">
              <!-- Klasifikasi Section -->
              <div class="review-section-header">
                <span class="review-section-title">Klasifikasi & Template</span>
                <a class="review-edit-link" (click)="goToStep(0)">Edit</a>
              </div>
              <div class="review-grid">
                <div class="review-row">
                  <span class="review-label">Tipe Dokumen</span>
                  <span class="review-value">{{ lookupName(documentTypes(), form.value.document_type_id) }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Template</span>
                  <span class="review-value">{{ lookupName(allTemplates(), form.value.template_id) }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Kategori</span>
                  <span class="review-value">{{ lookupName(categories(), form.value.category_id) || '-' }}</span>
                </div>
              </div>

              <nz-divider></nz-divider>

              <!-- Organisasi Section -->
              <div class="review-section-header">
                <span class="review-section-title">Organisasi</span>
                <a class="review-edit-link" (click)="goToStep(1)">Edit</a>
              </div>
              <div class="review-grid">
                <div class="review-row">
                  <span class="review-label">Perusahaan</span>
                  <span class="review-value">{{ lookupName(companies(), form.value.company_id) || '-' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Kantor</span>
                  <span class="review-value">{{ lookupName(offices(), form.value.office_id) || '-' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Departemen</span>
                  <span class="review-value">{{ lookupName(departments(), form.value.department_id) || '-' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Seksi</span>
                  <span class="review-value">{{ lookupName(sections(), form.value.section_id) || '-' }}</span>
                </div>
              </div>

              <nz-divider></nz-divider>

              <!-- Informasi Dokumen Section -->
              <div class="review-section-header">
                <span class="review-section-title">Informasi Dokumen</span>
                <a class="review-edit-link" (click)="goToStep(2)">Edit</a>
              </div>
              <div class="review-grid">
                <div class="review-row">
                  <span class="review-label">Judul</span>
                  <span class="review-value">{{ form.value.title }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Deskripsi</span>
                  <span class="review-value">{{ form.value.description || '-' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Nama Folder</span>
                  <span class="review-value">{{ form.value.folder_name || '-' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Prioritas</span>
                  <span class="review-value">{{ form.value.priority || 'normal' }}</span>
                </div>
                <div class="review-row">
                  <span class="review-label">Kerahasiaan</span>
                  <span class="review-value">{{ form.value.confidentiality || 'internal' }}</span>
                </div>
              </div>

              @if (tagGroups().length > 0) {
                <nz-divider></nz-divider>
                <div class="review-section-header">
                  <span class="review-section-title">Metadata</span>
                  <a class="review-edit-link" (click)="goToStep(3)">Edit</a>
                </div>
                <div class="review-grid">
                  @for (group of tagGroups(); track group.name) {
                    @for (tag of group.tags; track tag.tag_key) {
                      @if (!tag.is_hidden && !isSkippedDataType(tag.data_type)) {
                        <div class="review-row">
                          <span class="review-label">{{ tag.label }}</span>
                          <span class="review-value">{{ getMetadataDisplayValue(tag) }}</span>
                        </div>
                      }
                    }
                  }
                </div>
              }
            </nz-card>
          }
        </div>

        <!-- Navigation Buttons -->
        <div class="wizard-nav">
          <div>
            @if (currentStep() > 0) {
              <button nz-button nzSize="small" type="button" (click)="prevStep()">
                <span nz-icon nzType="arrow-left"></span> Sebelumnya
              </button>
            }
          </div>
          <div class="nav-right">
            @if (currentStep() < 4) {
              <button nz-button nzSize="small" nzType="primary" type="button" (click)="nextStep()">
                Selanjutnya <span nz-icon nzType="right"></span>
              </button>
            } @else {
              <button nz-button nzSize="small" type="button" (click)="onSubmit(true)" [nzLoading]="submitting()">
                Simpan Draft
              </button>
              <button nz-button nzSize="small" nzType="primary" type="button" (click)="onSubmit(false)" [nzLoading]="submitting()">
                {{ isEdit ? 'Simpan' : 'Buat Dokumen' }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .doc-wizard { padding: 16px; font-size: 12px; }
    .wizard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .back-link { color: #888; font-size: 14px; }
    .back-link:hover { color: #333; }
    .header-title { font-size: 16px; font-weight: 600; margin: 0; }
    .wizard-steps { margin-bottom: 20px; }
    .step-content { max-width: 700px; margin: 0 auto 16px; }
    .wizard-nav { max-width: 700px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
    .nav-right { display: flex; gap: 8px; }
    .loading-wrap { text-align: center; padding: 48px 0; }
    .loading-text { font-size: 12px; color: #999; margin-top: 8px; }
    .org-alert { margin-bottom: 12px; }
    .group-title { font-size: 12px; font-weight: 600; color: #666; margin: 4px 0 8px; }
    .tag-info-icon { margin-left: 4px; color: #aaa; cursor: help; font-size: 11px; }
    .placeholder-text { font-size: 12px; color: #aaa; font-style: italic; }

    .review-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .review-section-title { font-size: 13px; font-weight: 600; color: #333; }
    .review-edit-link { font-size: 12px; color: #1890ff; cursor: pointer; }
    .review-edit-link:hover { text-decoration: underline; }
    .review-grid { display: flex; flex-direction: column; gap: 4px; }
    .review-row { display: flex; gap: 8px; font-size: 12px; line-height: 20px; }
    .review-label { width: 140px; flex-shrink: 0; color: #888; }
    .review-value { color: #333; word-break: break-word; }

    :host ::ng-deep .ant-card-head { padding: 0 12px; min-height: 36px; }
    :host ::ng-deep .ant-card-head-title { padding: 8px 0; font-size: 13px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-form-item-label { padding: 0 0 4px; }
    :host ::ng-deep .ant-form-item-label > label { font-size: 12px; height: auto; }
    :host ::ng-deep .ant-steps-item-title { font-size: 12px !important; }
    :host ::ng-deep .ant-divider { margin: 12px 0; }
  `]
})
export class DocumentFormPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  form!: FormGroup;
  metadataForm!: FormGroup;
  isEdit = false;
  documentId: string | null = null;
  private existingMetadata: Record<string, any> | null = null;

  private autoSave$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  currentStep = signal(0);
  loading = signal(false);
  submitting = signal(false);
  loadingTags = signal(false);
  selectedTypeId = signal<string | null>(null);

  documentTypes = signal<DropdownItem[]>([]);
  categories = signal<DropdownItem[]>([]);
  companies = signal<DropdownItem[]>([]);
  offices = signal<DropdownItem[]>([]);
  departments = signal<DropdownItem[]>([]);
  sections = signal<DropdownItem[]>([]);
  allTemplates = signal<TemplateItem[]>([]);
  templateTags = signal<TemplateTag[]>([]);

  filteredTemplates = computed(() => {
    const typeId = this.selectedTypeId();
    const all = this.allTemplates();
    if (!typeId) return all;
    return all.filter(t => !t.document_type_id || t.document_type_id === typeId);
  });

  tagGroups = computed<TagGroup[]>(() => {
    const tags = this.templateTags();
    if (!tags.length) return [];

    const groupMap = new Map<string, TagGroup>();
    for (const tag of tags) {
      const gName = tag.group_name || 'Umum';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { name: gName, order: tag.group_order, tags: [] });
      }
      groupMap.get(gName)!.tags.push(tag);
    }

    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => a.order - b.order);
    for (const g of groups) {
      g.tags.sort((a, b) => a.field_order - b.field_order);
    }
    return groups;
  });

  ngOnInit() {
    this.metadataForm = this.fb.group({});

    this.form = this.fb.group({
      title: ['', Validators.required],
      document_type_id: [null, Validators.required],
      template_id: [null, Validators.required],
      category_id: [null],
      company_id: [null],
      office_id: [null],
      department_id: [null],
      folder_name: [''],
      description: [''],
      section_id: [null],
      priority: ['normal'],
      confidentiality: ['internal']
    });

    // Filter templates when document type changes
    this.subscriptions.push(
      this.form.get('document_type_id')!.valueChanges.subscribe(typeId => {
        this.selectedTypeId.set(typeId);
        const currentTemplate = this.form.get('template_id')!.value;
        if (currentTemplate) {
          const stillValid = this.filteredTemplates().some(t => t.id === currentTemplate);
          if (!stillValid) {
            this.form.get('template_id')!.setValue(null);
          }
        }
        this.triggerAutoSave();
      })
    );

    // Load template tags when template changes
    this.subscriptions.push(
      this.form.get('template_id')!.valueChanges.subscribe(templateId => {
        if (templateId) {
          this.loadTemplateTags(templateId);
        } else {
          this.templateTags.set([]);
          this.metadataForm = this.fb.group({});
        }
        this.triggerAutoSave();
      })
    );

    // Autosave on any form change
    this.subscriptions.push(
      this.form.valueChanges.subscribe(() => this.triggerAutoSave())
    );

    // Debounced autosave writer
    this.subscriptions.push(
      this.autoSave$.pipe(debounceTime(1000)).subscribe(() => this.saveDraft())
    );

    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.documentId = id;
      this.loadDocument(id);
    } else {
      this.checkForDraft();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // --- Draft / Autosave ---

  private triggerAutoSave() {
    if (!this.isEdit) {
      this.autoSave$.next();
    }
  }

  private saveDraft() {
    const metaValues: Record<string, any> = {};
    if (this.metadataForm) {
      const controls = this.metadataForm.controls;
      for (const key of Object.keys(controls)) {
        let val = controls[key].value;
        if (val instanceof Date) {
          val = val.toISOString();
        }
        metaValues[key] = val;
      }
    }
    const draft: DraftData = {
      step: this.currentStep(),
      formData: this.form.getRawValue(),
      metadata: metaValues,
      selectedTemplateId: this.form.get('template_id')!.value,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore quota errors */ }
  }

  private checkForDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftData = JSON.parse(raw);
      if (!draft.formData) return;

      this.modal.confirm({
        nzTitle: 'Draft Ditemukan',
        nzContent: 'Ditemukan draft dokumen yang belum selesai. Muat kembali?',
        nzOkText: 'Muat Draft',
        nzCancelText: 'Abaikan',
        nzOnOk: () => this.restoreDraft(draft),
        nzOnCancel: () => this.clearDraftSilent()
      });
    } catch { /* ignore parse errors */ }
  }

  private restoreDraft(draft: DraftData) {
    this.form.patchValue(draft.formData);
    if (draft.formData.document_type_id) {
      this.selectedTypeId.set(draft.formData.document_type_id);
    }
    this.currentStep.set(draft.step || 0);
    // Metadata will be restored after template tags load
    this.existingMetadata = draft.metadata || null;
  }

  clearDraft() {
    this.modal.confirm({
      nzTitle: 'Hapus Draft',
      nzContent: 'Yakin ingin menghapus draft yang tersimpan?',
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.clearDraftSilent()
    });
  }

  private clearDraftSilent() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  // --- Navigation ---

  nextStep() {
    if (!this.validateCurrentStep()) return;
    this.currentStep.update(s => Math.min(s + 1, 4));
    this.triggerAutoSave();
  }

  prevStep() {
    this.currentStep.update(s => Math.max(s - 1, 0));
    this.triggerAutoSave();
  }

  goToStep(n: number) {
    this.currentStep.set(n);
    this.triggerAutoSave();
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();
    if (step === 0) {
      const typeCtrl = this.form.get('document_type_id')!;
      const tplCtrl = this.form.get('template_id')!;
      typeCtrl.markAsDirty(); typeCtrl.updateValueAndValidity();
      tplCtrl.markAsDirty(); tplCtrl.updateValueAndValidity();
      if (!typeCtrl.value || !tplCtrl.value) {
        this.message.warning('Tipe Dokumen dan Template wajib dipilih');
        return false;
      }
    } else if (step === 2) {
      const titleCtrl = this.form.get('title')!;
      titleCtrl.markAsDirty(); titleCtrl.updateValueAndValidity();
      if (!titleCtrl.value) {
        this.message.warning('Judul dokumen wajib diisi');
        return false;
      }
    } else if (step === 3) {
      if (this.metadataForm && Object.keys(this.metadataForm.controls).length > 0) {
        if (this.metadataForm.invalid) {
          Object.values(this.metadataForm.controls).forEach(c => {
            c.markAsDirty(); c.updateValueAndValidity();
          });
          this.message.warning('Mohon lengkapi field metadata yang wajib diisi');
          return false;
        }
      }
    }
    return true;
  }

  // --- Data Loading ---

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

  loadTemplateTags(templateId: string) {
    this.loadingTags.set(true);
    this.http.get<any>(`${environment.apiUrl}/templates/${templateId}/tags`).subscribe({
      next: (res) => {
        const tags: TemplateTag[] = res.data || [];
        this.templateTags.set(tags);
        this.buildMetadataForm(tags);
        this.loadingTags.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat field template');
        this.templateTags.set([]);
        this.metadataForm = this.fb.group({});
        this.loadingTags.set(false);
      }
    });
  }

  private buildMetadataForm(tags: TemplateTag[]) {
    const group: Record<string, FormControl> = {};
    for (const tag of tags) {
      if (tag.is_hidden) continue;

      let defaultVal: any = tag.default_value ?? '';
      if (tag.data_type === 'checkbox') {
        defaultVal = defaultVal === 'true' || defaultVal === true;
      } else if (tag.data_type === 'number') {
        defaultVal = defaultVal !== '' && defaultVal != null ? Number(defaultVal) : null;
      } else if (tag.data_type === 'date') {
        defaultVal = defaultVal ? new Date(defaultVal) : null;
      }

      if (this.existingMetadata && tag.tag_key in this.existingMetadata) {
        let val = this.existingMetadata[tag.tag_key];
        if (tag.data_type === 'checkbox') {
          val = val === 'true' || val === true;
        } else if (tag.data_type === 'number' && val != null) {
          val = Number(val);
        } else if (tag.data_type === 'date' && val) {
          val = new Date(val);
        }
        defaultVal = val;
      }

      const validators: any[] = [];
      if (tag.is_required) validators.push(Validators.required);
      if (tag.min_length) validators.push(Validators.minLength(tag.min_length));
      if (tag.max_length) validators.push(Validators.maxLength(tag.max_length));
      if (tag.validation_regex) validators.push(Validators.pattern(tag.validation_regex));

      group[tag.tag_key] = new FormControl(defaultVal, validators);
    }
    this.metadataForm = this.fb.group(group);

    // Subscribe metadata form changes to autosave
    this.subscriptions.push(
      this.metadataForm.valueChanges.subscribe(() => this.triggerAutoSave())
    );
  }

  getTagControl(tagKey: string): FormControl {
    return (this.metadataForm.get(tagKey) as FormControl) || new FormControl();
  }

  getSelectOptions(tag: TemplateTag): { label: string; value: any }[] {
    if (tag.source_type === 'static' && tag.source_config?.options) {
      return tag.source_config.options;
    }
    return [];
  }

  loadDocument(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/documents/${id}`).subscribe({
      next: (res) => {
        const doc = res.data;
        this.existingMetadata = doc.metadata || null;
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

  // --- Review Helpers ---

  lookupName(list: { id: string; name: string }[], id: string | null): string {
    if (!id) return '';
    return list.find(item => item.id === id)?.name || id;
  }

  isSkippedDataType(dataType: string): boolean {
    return ['file', 'signature', 'table'].includes(dataType);
  }

  getMetadataDisplayValue(tag: TemplateTag): string {
    const ctrl = this.metadataForm.get(tag.tag_key);
    if (!ctrl) return '-';
    const val = ctrl.value;
    if (val == null || val === '') return '-';
    if (tag.data_type === 'checkbox') return val ? 'Ya' : 'Tidak';
    if (tag.data_type === 'date' && val instanceof Date) return val.toLocaleDateString('id-ID');
    return String(val);
  }

  // --- Submit ---

  onSubmit(asDraft = false) {
    if (!asDraft) {
      // Validate all steps
      for (let s = 0; s <= 3; s++) {
        this.currentStep.set(s);
        if (!this.validateCurrentStep()) return;
      }
      this.currentStep.set(4);
    }

    this.submitting.set(true);

    const metadata: Record<string, any> = {};
    const tags = this.templateTags();
    for (const tag of tags) {
      if (tag.is_hidden) continue;
      if (['file', 'signature', 'table'].includes(tag.data_type)) continue;
      const ctrl = this.metadataForm.get(tag.tag_key);
      if (ctrl) {
        let val = ctrl.value;
        if (tag.data_type === 'date' && val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }
        metadata[tag.tag_key] = val;
      }
    }

    const data: any = {
      ...this.form.value,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      status: asDraft ? 'draft' : undefined
    };

    const req = this.isEdit
      ? this.http.put(`${environment.apiUrl}/documents/${this.documentId}`, data)
      : this.http.post(`${environment.apiUrl}/documents`, data);

    req.subscribe({
      next: (res: any) => {
        this.clearDraftSilent();
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
