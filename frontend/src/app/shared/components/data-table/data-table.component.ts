import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableAction, TableSort, TablePagination, TableState } from './data-table.types';

// Re-export types for convenience
export type { TableColumn, TableAction, TableSort, TablePagination, TableState } from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent implements OnInit, OnChanges {
  // Inputs
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() selectable = false;
  @Input() actions: TableAction[] = [];
  @Input() emptyMessage = 'Tidak ada data';
  @Input() emptyIcon = 'inbox';
  @Input() searchPlaceholder = 'Cari...';
  @Input() showSearch = true;
  @Input() showPagination = true;
  @Input() stickyHeader = true;
  @Input() rowIdKey = 'id';
  @Input() serverSide = true;

  // Outputs
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<TableSort | null>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();

  // State
  currentPage = signal(1);
  currentSort = signal<TableSort | null>(null);
  searchQuery = signal('');
  selectedIds = signal<Set<string>>(new Set());
  actionsOpenId = signal<string | null>(null);

  // Computed
  visibleColumns = computed(() => this.columns.filter(c => !c.hidden));

  totalPages = computed(() => Math.ceil(this.totalItems / this.pageSize) || 1);

  allSelected = computed(() => {
    if (this.data.length === 0) return false;
    return this.data.every(row => this.selectedIds().has(row[this.rowIdKey]));
  });

  someSelected = computed(() => {
    const selected = this.selectedIds();
    if (selected.size === 0) return false;
    return this.data.some(row => selected.has(row[this.rowIdKey])) && !this.allSelected();
  });

  selectedRows = computed(() => {
    const ids = this.selectedIds();
    return this.data.filter(row => ids.has(row[this.rowIdKey]));
  });

  paginationInfo = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, this.totalItems);
    return `${start}-${end} dari ${this.totalItems}`;
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  private searchDebounce: any;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      // Clear selection when data changes (optional)
      // this.selectedIds.set(new Set());
    }
  }

  // Sorting
  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    const current = this.currentSort();
    let newSort: TableSort | null;

    if (!current || current.column !== column.key) {
      newSort = { column: column.key, direction: 'asc' };
    } else if (current.direction === 'asc') {
      newSort = { column: column.key, direction: 'desc' };
    } else {
      newSort = null;
    }

    this.currentSort.set(newSort);
    this.sortChange.emit(newSort);
  }

  getSortIcon(column: TableColumn): string {
    const current = this.currentSort();
    if (!current || current.column !== column.key) return 'sort';
    return current.direction === 'asc' ? 'sort-asc' : 'sort-desc';
  }

  // Search
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage.set(1);
      this.searchChange.emit(value);
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchChange.emit('');
  }

  // Pagination
  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.pageChange.emit(page);
  }

  onPageSizeChange(event: Event): void {
    const size = +(event.target as HTMLSelectElement).value;
    this.currentPage.set(1);
    this.pageSizeChange.emit(size);
  }

  // Selection
  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const ids = new Set(this.data.map(row => row[this.rowIdKey]));
      this.selectedIds.set(ids);
    }
    this.selectionChange.emit(this.selectedRows());
  }

  toggleSelect(row: any): void {
    const id = row[this.rowIdKey];
    const ids = new Set(this.selectedIds());
    if (ids.has(id)) {
      ids.delete(id);
    } else {
      ids.add(id);
    }
    this.selectedIds.set(ids);
    this.selectionChange.emit(this.selectedRows());
  }

  isSelected(row: any): boolean {
    return this.selectedIds().has(row[this.rowIdKey]);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectionChange.emit([]);
  }

  // Actions
  toggleActions(rowId: string, event: Event): void {
    event.stopPropagation();
    if (this.actionsOpenId() === rowId) {
      this.actionsOpenId.set(null);
    } else {
      this.actionsOpenId.set(rowId);
    }
  }

  closeActions(): void {
    this.actionsOpenId.set(null);
  }

  onAction(action: TableAction, row: any, event: Event): void {
    event.stopPropagation();
    this.actionsOpenId.set(null);
    this.actionClick.emit({ action: action.key, row });
  }

  isActionVisible(action: TableAction, row: any): boolean {
    if (action.show) return action.show(row);
    return true;
  }

  isActionDisabled(action: TableAction, row: any): boolean {
    if (action.disabled) return action.disabled(row);
    return false;
  }

  // Row click
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  // Cell value
  getCellValue(row: any, column: TableColumn): string {
    const value = row[column.key];
    if (column.format) return column.format(value, row);
    if (value === null || value === undefined) return '-';
    return String(value);
  }

  getBadgeClass(row: any, column: TableColumn): string {
    const value = row[column.key];
    if (column.badgeMap && column.badgeMap[value]) {
      return column.badgeMap[value].class;
    }
    return 'badge-gray';
  }

  getBadgeLabel(row: any, column: TableColumn): string {
    const value = row[column.key];
    if (column.badgeMap && column.badgeMap[value]) {
      return column.badgeMap[value].label;
    }
    return value || '-';
  }

  // Track by
  trackByRow(index: number, row: any): any {
    return row[this.rowIdKey] || index;
  }

  trackByColumn(index: number, column: TableColumn): string {
    return column.key;
  }
}
