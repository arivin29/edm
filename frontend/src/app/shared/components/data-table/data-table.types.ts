/**
 * Data Table Types
 */

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'date' | 'datetime' | 'badge' | 'avatar' | 'actions' | 'custom';
  format?: (value: any, row: any) => string;
  badgeMap?: Record<string, { label: string; class: string }>;
  sticky?: 'left' | 'right';
  hidden?: boolean;
}

export interface TableAction {
  key: string;
  label: string;
  icon?: string;
  class?: string;
  permission?: string;
  show?: (row: any) => boolean;
  disabled?: (row: any) => boolean;
}

export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableFilter {
  key: string;
  value: any;
  operator?: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface TableState {
  search: string;
  sort: TableSort | null;
  filters: TableFilter[];
  pagination: TablePagination;
  selectedIds: Set<string>;
}

export interface TableEvent {
  type: 'page' | 'pageSize' | 'sort' | 'search' | 'filter' | 'action' | 'select' | 'selectAll';
  payload: any;
}
