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
import { environment } from '../../../../../environments/environment';
import { DocumentCategory } from '../category.models';
import { CategoryFormComponent } from '../category-form/category-form.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzTagModule,
    NzSpinModule, CategoryFormComponent
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoriesPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchText = '';
  items = signal<DocumentCategory[]>([]);
  loading = signal(false);
  saving = signal(false);

  filteredItems = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.items();
    return this.items().filter(c =>
      c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    );
  });

  parentOptions = computed(() => {
    if (!this.editId) return this.items();
    return this.items().filter(c => c.id !== this.editId);
  });

  drawerVisible = false;
  drawerTitle = '';
  formData: any = {};
  editId: string | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => { this.items.set(res.data || []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  openDrawer(item?: DocumentCategory) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Kategori' : 'Tambah Kategori';
    this.formData = item
      ? { ...item }
      : { code: '', name: '', description: '', parent_id: null, sort_order: 0, is_active: true };
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.formData = {};
    this.editId = null;
  }

  onSave(data: any) {
    if (!data.code?.trim() || !data.name?.trim()) {
      this.message.warning('Kode dan Nama wajib diisi');
      return;
    }
    this.saving.set(true);
    const url = `${this.apiUrl}/categories`;
    const req$ = this.editId
      ? this.http.put(`${url}/${this.editId}`, data)
      : this.http.post(url, data);

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

  confirmDelete(item: DocumentCategory) {
    this.modal.confirm({
      nzTitle: 'Hapus Kategori?',
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${this.apiUrl}/categories/${item.id}`).subscribe({
          next: () => { this.message.success('Data berhasil dihapus'); this.load(); },
          error: (err) => { this.message.error(err?.error?.message || 'Gagal menghapus'); }
        });
      }
    });
  }
}
