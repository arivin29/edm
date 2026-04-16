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
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  FileNode,
  FileManagerConfig,
  BreadcrumbNode,
  ViewMode,
  SortField,
  SortOrder
} from './file-manager.types';

export type { FileNode, FileManagerConfig } from './file-manager.types';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzTagModule,
    NzEmptyModule,
    NzDropDownModule,
    NzInputModule,
    NzBadgeModule,
    NzUploadModule,
    NzModalModule,
  ],
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss'
})
export class FileManagerComponent implements OnInit, OnChanges {
  @Input() config: FileManagerConfig = { documentId: '', readonly: false, showUpload: true, showCreateFolder: true, showVersions: true };
  @Input() tree: FileNode[] = [];

  @Output() fileDownload = new EventEmitter<FileNode>();
  @Output() filePreview = new EventEmitter<FileNode>();
  @Output() fileDelete = new EventEmitter<FileNode>();
  @Output() fileUpload = new EventEmitter<{ parentId: string; file: File }>();
  @Output() folderCreate = new EventEmitter<{ parentId: string; name: string }>();
  @Output() nodeRename = new EventEmitter<{ node: FileNode; newName: string }>();

  viewMode = signal<ViewMode>('list');
  searchQuery = signal('');
  sortField = signal<SortField>('name');
  sortOrder = signal<SortOrder>('asc');

  selectedNode = signal<FileNode | null>(null);
  currentFolder = signal<FileNode | null>(null);
  breadcrumbs = signal<BreadcrumbNode[]>([]);
  expandedFolders = signal<Set<string>>(new Set(['root']));
  showNewFolderInput = signal(false);
  newFolderName = '';
  showDetailPanel = signal(false);

  currentFiles = computed(() => {
    const folder = this.currentFolder();
    const items = folder ? (folder.children || []) : this.tree;
    const q = this.searchQuery().toLowerCase().trim();
    let filtered = q
      ? this.searchInTree(this.tree, q)
      : items;

    const field = this.sortField();
    const order = this.sortOrder();
    return [...filtered].sort((a, b) => {
      // Folders first
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      let cmp = 0;
      switch (field) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'size': cmp = (a.size || 0) - (b.size || 0); break;
        case 'modifiedAt': cmp = (a.modifiedAt || '').localeCompare(b.modifiedAt || ''); break;
        case 'type': cmp = (a.mimeType || '').localeCompare(b.mimeType || ''); break;
      }
      return order === 'asc' ? cmp : -cmp;
    });
  });

  totalFiles = computed(() => this.countFiles(this.tree));
  totalFolders = computed(() => this.countFolders(this.tree));
  totalSize = computed(() => this.sumSize(this.tree));

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tree']) {
      this.expandedFolders.update(s => { s.add('root'); return new Set(s); });
    }
  }

  // --- Tree Navigation ---
  toggleFolder(folder: FileNode) {
    this.expandedFolders.update(s => {
      const next = new Set(s);
      if (next.has(folder.id)) next.delete(folder.id);
      else next.add(folder.id);
      return next;
    });
  }

  isFolderExpanded(folder: FileNode): boolean {
    return this.expandedFolders().has(folder.id);
  }

  navigateToFolder(folder: FileNode | null) {
    this.currentFolder.set(folder);
    this.selectedNode.set(null);
    this.searchQuery.set('');
    this.buildBreadcrumbs(folder);
  }

  navigateToRoot() {
    this.navigateToFolder(null);
  }

  selectTreeFolder(folder: FileNode) {
    this.navigateToFolder(folder);
    // expand
    this.expandedFolders.update(s => { s.add(folder.id); return new Set(s); });
  }

  buildBreadcrumbs(node: FileNode | null) {
    if (!node) {
      this.breadcrumbs.set([]);
      return;
    }
    const crumbs: BreadcrumbNode[] = [];
    let current: FileNode | undefined = node;
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      current = current.parentId ? this.findNode(this.tree, current.parentId) : undefined;
    }
    this.breadcrumbs.set(crumbs);
  }

  navigateBreadcrumb(crumb: BreadcrumbNode) {
    const node = this.findNode(this.tree, crumb.id);
    this.navigateToFolder(node || null);
  }

  // --- Selection ---
  selectNode(node: FileNode) {
    this.selectedNode.set(node);
    this.showDetailPanel.set(true);
  }

  openNode(node: FileNode) {
    if (node.type === 'folder') {
      this.selectTreeFolder(node);
    } else {
      this.filePreview.emit(node);
    }
  }

  isSelected(node: FileNode): boolean {
    return this.selectedNode()?.id === node.id;
  }

  closeDetailPanel() {
    this.showDetailPanel.set(false);
    this.selectedNode.set(null);
  }

  // --- Actions ---
  onDownload(node: FileNode) {
    this.fileDownload.emit(node);
  }

  onPreview(node: FileNode) {
    this.filePreview.emit(node);
  }

  onDelete(node: FileNode) {
    this.fileDelete.emit(node);
  }

  onCreateFolder() {
    if (!this.newFolderName.trim()) return;
    const parentId = this.currentFolder()?.id || 'root';
    this.folderCreate.emit({ parentId, name: this.newFolderName.trim() });
    this.newFolderName = '';
    this.showNewFolderInput.set(false);
  }

  cancelCreateFolder() {
    this.newFolderName = '';
    this.showNewFolderInput.set(false);
  }

  toggleViewMode() {
    this.viewMode.update(v => v === 'list' ? 'grid' : 'list');
  }

  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
  }

  // --- Helpers ---
  getFileIcon(node: FileNode): string {
    if (node.type === 'folder') return 'folder';
    if (node.icon) return node.icon;
    const mime = node.mimeType || '';
    if (mime.includes('pdf')) return 'file-pdf';
    if (mime.includes('word') || mime.includes('document')) return 'file-word';
    if (mime.includes('sheet') || mime.includes('excel')) return 'file-excel';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'file-ppt';
    if (mime.includes('image')) return 'file-image';
    if (mime.includes('zip') || mime.includes('compressed')) return 'file-zip';
    if (mime.includes('text')) return 'file-text';
    return 'file';
  }

  getFileIconColor(node: FileNode): string {
    if (node.type === 'folder') return '#faad14';
    const mime = node.mimeType || '';
    if (mime.includes('pdf')) return '#ff4d4f';
    if (mime.includes('word') || mime.includes('document')) return '#1890ff';
    if (mime.includes('sheet') || mime.includes('excel')) return '#52c41a';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '#fa8c16';
    if (mime.includes('image')) return '#722ed1';
    return '#8c8c8c';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  getFileTypeLabel(node: FileNode): string {
    if (node.type === 'folder') return 'Folder';
    const mime = node.mimeType || '';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('word') || mime.includes('document')) return 'Word';
    if (mime.includes('sheet') || mime.includes('excel')) return 'Excel';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint';
    if (mime.includes('image/png')) return 'PNG Image';
    if (mime.includes('image/jpeg')) return 'JPEG Image';
    if (mime.includes('image')) return 'Image';
    if (mime.includes('zip')) return 'ZIP Archive';
    if (mime.includes('csv')) return 'CSV';
    if (mime.includes('text')) return 'Text';
    return 'File';
  }

  // --- Tree Utilities ---
  private findNode(nodes: FileNode[], id: string): FileNode | undefined {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = this.findNode(n.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  private searchInTree(nodes: FileNode[], q: string): FileNode[] {
    const results: FileNode[] = [];
    for (const n of nodes) {
      if (n.name.toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q)) {
        results.push(n);
      }
      if (n.children) {
        results.push(...this.searchInTree(n.children, q));
      }
    }
    return results;
  }

  private countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const n of nodes) {
      if (n.type === 'file') count++;
      if (n.children) count += this.countFiles(n.children);
    }
    return count;
  }

  private countFolders(nodes: FileNode[]): number {
    let count = 0;
    for (const n of nodes) {
      if (n.type === 'folder') count++;
      if (n.children) count += this.countFolders(n.children);
    }
    return count;
  }

  private sumSize(nodes: FileNode[]): number {
    let total = 0;
    for (const n of nodes) {
      if (n.size) total += n.size;
      if (n.children) total += this.sumSize(n.children);
    }
    return total;
  }
}
