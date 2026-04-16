import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { environment } from '../../../../../environments/environment';
import { DocumentType } from '../document-type.models';
import { DocumentTypeFormComponent } from '../document-type-form/document-type-form.component';

@Component({
  selector: 'app-document-type-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzTagModule,
    NzSpinModule, NzToolTipModule,
    DocumentTypeFormComponent
  ],
  templateUrl: './document-type-list.component.html',
  styleUrls: ['./document-type-list.component.scss']
})
export class DocumentTypesPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchText = '';
  items = signal<DocumentType[]>([]);
  loading = signal(false);
  saving = signal(false);

  statsTotal = computed(() => this.items().length);
  statsActive = computed(() => this.items().filter(i => i.is_active).length);
  statsInactive = computed(() => this.items().filter(i => !i.is_active).length);

  filteredItems = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.items();
    return this.items().filter(t =>
      t.code.toLowerCase().includes(term) || t.name.toLowerCase().includes(term)
    );
  });

  drawerVisible = false;
  drawerTitle = '';
  formData: any = {};
  editId: string | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/document-types`).subscribe({
      next: (res) => { this.items.set(res.data || []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  openDrawer(item?: DocumentType) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Tipe Dokumen' : 'Tambah Tipe Dokumen';
    this.formData = item
      ? { ...item }
      : { code: '', name: '', description: '', icon: 'file-text', sort_order: 0, is_active: true };
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.formData = {};
    this.editId = null;
  }

  save() {
    if (!this.formData.code?.trim() || !this.formData.name?.trim()) {
      this.message.warning('Kode dan Nama wajib diisi');
      return;
    }
    this.saving.set(true);
    const url = `${this.apiUrl}/document-types`;
    const req$ = this.editId
      ? this.http.put(`${url}/${this.editId}`, this.formData)
      : this.http.post(url, this.formData);

    req$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.closeDrawer();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: DocumentType) {
    this.modal.confirm({
      nzTitle: 'Hapus Tipe Dokumen?',
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${this.apiUrl}/document-types/${item.id}`).subscribe({
          next: () => { this.message.success('Data berhasil dihapus'); this.load(); },
          error: (err) => { this.message.error(err?.error?.message || 'Gagal menghapus'); }
        });
      }
    });
  }
}
