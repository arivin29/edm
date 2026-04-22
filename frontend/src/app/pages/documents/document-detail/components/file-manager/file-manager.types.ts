export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType?: string;
  size?: number;
  description?: string;
  tags?: string[];
  version?: string;
  isCurrent?: boolean;
  uploadedBy?: string;
  modifiedAt?: string;
  createdAt?: string;
  children?: FileNode[];
  parentId?: string;
  icon?: string;
  expanded?: boolean;
  ocrText?: string;
  ocrProcessing?: boolean;
}

export interface FileUploadData {
  file: File;
  description?: string;
  referenceNumber?: string;
}

export interface FileManagerConfig {
  documentId: string;
  readonly?: boolean;
  showUpload?: boolean;
  showCreateFolder?: boolean;
  showVersions?: boolean;
}

export interface BreadcrumbNode {
  id: string;
  name: string;
}

export type ViewMode = 'list' | 'grid';
export type SortField = 'name' | 'size' | 'modifiedAt' | 'type';
export type SortOrder = 'asc' | 'desc';
