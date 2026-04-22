import { Component, signal, inject, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  url?: string;
}

interface SearchGroup {
  type: string;
  label: string;
  icon: string;
  total: number;
  results: SearchResult[];
}

interface SearchResponse {
  query: string;
  groups: SearchGroup[];
  total: number;
}

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTagModule, NzSpinModule],
  template: `
    @if (visible) {
      <!-- Backdrop -->
      <div class="gs-backdrop" (click)="close()"></div>

      <!-- Search Panel -->
      <div class="gs-panel">
        <!-- Search Input -->
        <div class="gs-input-wrap">
          <span nz-icon nzType="search" nzTheme="outline" class="gs-input-icon"></span>
          <input #searchInput
            class="gs-input"
            type="text"
            placeholder="Cari dokumen, pengguna, workflow..."
            [(ngModel)]="query"
            (ngModelChange)="onQueryChange($event)"
            (keydown.escape)="close()"
            (keydown.arrowDown)="selectNext($event)"
            (keydown.arrowUp)="selectPrev($event)"
            (keydown.enter)="navigateSelected()"
            autocomplete="off"
            spellcheck="false" />
          @if (query) {
            <button class="gs-clear" (click)="clearQuery()">
              <span nz-icon nzType="close-circle" nzTheme="fill"></span>
            </button>
          }
          <kbd class="gs-kbd">ESC</kbd>
        </div>

        <!-- Results -->
        <div class="gs-body">
          @if (loading()) {
            <div class="gs-loading">
              <nz-spin nzSimple nzSize="small"></nz-spin>
              <span>Mencari...</span>
            </div>
          } @else if (query && searched && results()?.groups?.length === 0) {
            <div class="gs-empty">
              <span nz-icon nzType="file-search" nzTheme="outline" class="gs-empty-icon"></span>
              <div class="gs-empty-text">Tidak ada hasil untuk "{{ query }}"</div>
              <div class="gs-empty-hint">Coba kata kunci lain atau periksa ejaan</div>
            </div>
          } @else if (results()?.groups?.length) {
            @for (group of results()!.groups; track group.type) {
              <div class="gs-group">
                <div class="gs-group-header">
                  <span nz-icon [nzType]="group.icon" nzTheme="outline"></span>
                  <span class="gs-group-label">{{ group.label }}</span>
                  <span class="gs-group-count">{{ group.total }}</span>
                </div>
                @for (item of group.results; track item.id; let idx = $index) {
                  <div class="gs-item"
                    [class.gs-item--active]="isSelected(group.type, idx)"
                    (click)="navigate(item)"
                    (mouseenter)="setSelected(group.type, idx)">
                    <div class="gs-item-icon">
                      <span nz-icon [nzType]="getItemIcon(item)" nzTheme="outline"></span>
                    </div>
                    <div class="gs-item-content">
                      <div class="gs-item-title">
                        {{ item.title }}
                        @if (item.status) {
                          <nz-tag class="gs-item-status" [nzColor]="getStatusColor(item.status)">{{ getStatusLabel(item.status) }}</nz-tag>
                        }
                      </div>
                      @if (item.subtitle) {
                        <div class="gs-item-subtitle">{{ item.subtitle }}</div>
                      }
                      @if (item.description) {
                        <div class="gs-item-desc">{{ item.description }}</div>
                      }
                    </div>
                    <span nz-icon nzType="enter" nzTheme="outline" class="gs-item-enter"></span>
                  </div>
                }
                @if (group.total > group.results.length) {
                  <div class="gs-item gs-item--more" (click)="viewAll(group)">
                    <span nz-icon nzType="right" nzTheme="outline"></span>
                    Lihat semua {{ group.total }} {{ group.label | lowercase }}
                  </div>
                }
              </div>
            }
          } @else if (!query) {
            <div class="gs-tips">
              @if (recentSearches.length) {
                <div class="gs-group-header">
                  <span nz-icon nzType="history" nzTheme="outline"></span>
                  <span class="gs-group-label">Pencarian Terakhir</span>
                </div>
                @for (term of recentSearches; track term) {
                  <div class="gs-item" (click)="searchTerm(term)">
                    <div class="gs-item-icon"><span nz-icon nzType="history" nzTheme="outline"></span></div>
                    <div class="gs-item-content">
                      <div class="gs-item-title">{{ term }}</div>
                    </div>
                  </div>
                }
              }
              <div class="gs-hint">
                <div class="gs-hint-row"><kbd>↑</kbd> <kbd>↓</kbd> navigasi</div>
                <div class="gs-hint-row"><kbd>↵</kbd> buka</div>
                <div class="gs-hint-row"><kbd>ESC</kbd> tutup</div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './global-search.component.scss'
})
export class GlobalSearchComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  visible = false;
  query = '';
  searched = false;
  loading = signal(false);
  results = signal<SearchResponse | null>(null);

  recentSearches: string[] = [];
  private selectedGroup = '';
  private selectedIndex = 0;
  private searchSubject = new Subject<string>();
  private sub: any;

  constructor() {
    this.loadRecent();
    this.sub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.length < 2) {
          this.results.set(null);
          this.loading.set(false);
          this.searched = false;
          return of(null);
        }
        this.loading.set(true);
        return this.http.get<any>(`${environment.apiUrl}/search?q=${encodeURIComponent(q)}&limit=5`).pipe(
          catchError(() => of({ data: { query: q, groups: [], total: 0 } }))
        );
      })
    ).subscribe(res => {
      if (res?.data) {
        this.results.set(res.data);
        this.searched = true;
        if (res.data.groups?.length) {
          this.selectedGroup = res.data.groups[0].type;
          this.selectedIndex = 0;
        }
      }
      this.loading.set(false);
    });
  }

  open() {
    this.visible = true;
    this.searched = false;
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  close() {
    this.visible = false;
    this.query = '';
    this.results.set(null);
    this.searched = false;
  }

  clearQuery() {
    this.query = '';
    this.results.set(null);
    this.searched = false;
    this.searchInput?.nativeElement?.focus();
  }

  onQueryChange(q: string) {
    this.searchSubject.next(q.trim());
  }

  searchTerm(term: string) {
    this.query = term;
    this.searchSubject.next(term);
  }

  navigate(item: SearchResult) {
    if (item.url) {
      this.saveRecent(this.query);
      this.close();
      this.router.navigateByUrl(item.url);
    }
  }

  viewAll(group: SearchGroup) {
    this.saveRecent(this.query);
    this.close();
    if (group.type === 'document') {
      this.router.navigate(['/documents'], { queryParams: { search: this.query } });
    } else {
      this.router.navigate(['/search'], { queryParams: { q: this.query, type: group.type } });
    }
  }

  navigateSelected() {
    const r = this.results();
    if (!r?.groups?.length) return;
    const group = r.groups.find(g => g.type === this.selectedGroup);
    if (group?.results?.[this.selectedIndex]) {
      this.navigate(group.results[this.selectedIndex]);
    }
  }

  isSelected(groupType: string, idx: number): boolean {
    return this.selectedGroup === groupType && this.selectedIndex === idx;
  }

  setSelected(groupType: string, idx: number) {
    this.selectedGroup = groupType;
    this.selectedIndex = idx;
  }

  selectNext(e: Event) {
    e.preventDefault();
    const r = this.results();
    if (!r?.groups?.length) return;
    const flatItems = this.getFlatItems(r.groups);
    const currentFlat = this.getCurrentFlatIndex(flatItems);
    if (currentFlat < flatItems.length - 1) {
      const next = flatItems[currentFlat + 1];
      this.selectedGroup = next.group;
      this.selectedIndex = next.idx;
    }
  }

  selectPrev(e: Event) {
    e.preventDefault();
    const r = this.results();
    if (!r?.groups?.length) return;
    const flatItems = this.getFlatItems(r.groups);
    const currentFlat = this.getCurrentFlatIndex(flatItems);
    if (currentFlat > 0) {
      const prev = flatItems[currentFlat - 1];
      this.selectedGroup = prev.group;
      this.selectedIndex = prev.idx;
    }
  }

  getItemIcon(item: SearchResult): string {
    const icons: Record<string, string> = {
      document: 'file-text', user: 'user', workflow: 'apartment',
      document_type: 'folder', template: 'file-done'
    };
    return icons[item.type] || 'file';
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = {
      draft: 'default', in_review: 'processing', approved: 'success',
      final: 'success', rejected: 'error', revision: 'warning',
      obsolete: 'default', archived: 'default'
    };
    return m[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const m: Record<string, string> = {
      draft: 'Draft', in_review: 'Review', approved: 'Disetujui',
      final: 'Final', rejected: 'Ditolak', revision: 'Revisi',
      obsolete: 'Obsolete', archived: 'Arsip'
    };
    return m[status] || status;
  }

  private getFlatItems(groups: SearchGroup[]): { group: string; idx: number }[] {
    const items: { group: string; idx: number }[] = [];
    for (const g of groups) {
      for (let i = 0; i < g.results.length; i++) {
        items.push({ group: g.type, idx: i });
      }
    }
    return items;
  }

  private getCurrentFlatIndex(flatItems: { group: string; idx: number }[]): number {
    return flatItems.findIndex(f => f.group === this.selectedGroup && f.idx === this.selectedIndex);
  }

  private saveRecent(q: string) {
    if (!q || q.length < 2) return;
    this.recentSearches = [q, ...this.recentSearches.filter(s => s !== q)].slice(0, 5);
    try { localStorage.setItem('dms_recent_search', JSON.stringify(this.recentSearches)); } catch {}
  }

  private loadRecent() {
    try {
      this.recentSearches = JSON.parse(localStorage.getItem('dms_recent_search') || '[]');
    } catch {
      this.recentSearches = [];
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
