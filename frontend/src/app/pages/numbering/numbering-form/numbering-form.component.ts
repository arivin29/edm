import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DocumentNumbering, Company, DocumentType, Category, Department, Office } from '../numbering.models';

@Component({
  selector: 'app-numbering-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzDrawerModule, NzFormModule, NzInputModule, NzSelectModule,
    NzButtonModule, NzIconModule
  ],
  templateUrl: './numbering-form.component.html',
  styleUrls: ['./numbering-form.component.scss']
})
export class NumberingFormComponent implements OnChanges {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private readonly apiUrl = environment.apiUrl;

  @Input() visible = false;
  @Input() editItem: DocumentNumbering | null = null;
  @Input() companies: Company[] = [];
  @Input() offices: Office[] = [];
  @Input() documentTypes: DocumentType[] = [];
  @Input() categories: Category[] = [];
  @Input() departments: Department[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  formData: any = {};
  saving = signal(false);
  previewing = signal(false);
  previewResult = signal('');

  get isEdit(): boolean {
    return !!this.editItem;
  }

  get drawerTitle(): string {
    return this.isEdit ? 'Edit Penomoran' : 'Tambah Penomoran';
  }

  formatPlaceholder = '{PREFIX}{SEP}{TYPE}{SEP}{YYYY}{SEP}{SEQ:4}';
  formatTokens = [
    { key: '{PREFIX}', desc: 'Prefix yang ditentukan' },
    { key: '{SEP}', desc: 'Karakter separator' },
    { key: '{TYPE}', desc: 'Kode tipe dokumen' },
    { key: '{CAT}', desc: 'Kode kategori' },
    { key: '{DEPT}', desc: 'Nama departemen' },
    { key: '{YYYY}', desc: 'Tahun 4 digit' },
    { key: '{YY}', desc: 'Tahun 2 digit' },
    { key: '{MM}', desc: 'Bulan 2 digit' },
    { key: '{DD}', desc: 'Tanggal 2 digit' },
    { key: '{SEQ:N}', desc: 'Nomor urut (N = jumlah digit, contoh: SEQ:4 → 0001)' },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.initForm();
    }
  }

  close() {
    this.closed.emit();
  }

  save() {
    if (!this.formData.company_id || !this.formData.document_type_id) {
      this.message.warning('Perusahaan dan Tipe Dokumen wajib dipilih');
      return;
    }
    if (!this.formData.format?.trim()) {
      this.message.warning('Format nomor wajib diisi');
      return;
    }

    this.saving.set(true);
    const request$ = this.isEdit
      ? this.http.put(`${this.apiUrl}/numbering/${this.editItem!.id}`, this.formData)
      : this.http.post(`${this.apiUrl}/numbering`, this.formData);

    request$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  previewNumber() {
    if (!this.formData.company_id || !this.formData.document_type_id) {
      this.message.warning('Pilih Perusahaan dan Tipe Dokumen terlebih dahulu');
      return;
    }

    this.previewing.set(true);
    const params = `company_id=${this.formData.company_id}&document_type_id=${this.formData.document_type_id}`;
    this.http.get<any>(`${this.apiUrl}/numbering/preview?${params}`).subscribe({
      next: (res) => {
        this.previewResult.set(res.data?.preview || '-');
        this.previewing.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal memuat preview');
        this.previewResult.set('');
        this.previewing.set(false);
      }
    });
  }

  private initForm() {
    this.previewResult.set('');
    if (this.editItem) {
      this.formData = { ...this.editItem };
    } else {
      this.formData = {
        company_id: null,
        office_id: null,
        document_type_id: null,
        category_id: null,
        department_id: null,
        prefix: '',
        separator: '/',
        format: '{PREFIX}{SEP}{TYPE}{SEP}{YYYY}{SEP}{SEQ:4}',
        reset_period: 'never'
      };
    }
  }
}
