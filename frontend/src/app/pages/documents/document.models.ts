export interface DocumentItem {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  confidentiality: string;
  current_version: number;
  revision_count: number;
  created_at: string;
  updated_at: string;
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string; code: string };
  creator?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
}

export interface DocumentDetail {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  confidentiality: string;
  current_version: number;
  major_version: number;
  minor_version: number;
  revision_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string };
  creator?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  section?: { id: string; name: string };
  company?: { id: string; name: string };
  office?: { id: string; name: string };
  template?: { id: string; name: string };
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  major_version: number;
  minor_version: number;
  file_name: string;
  file_size: number;
  change_summary: string;
  is_current: boolean;
  creator?: { id: string; name: string };
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  is_resolved: boolean;
  user?: { id: string; name: string; avatar?: string };
  parent_id?: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: string;
  action_type: string;
  comment?: string;
  actor?: { id: string; name: string };
  completed_at?: string;
  created_at: string;
}

export interface WorkflowStatus {
  instance: any | null;
  current_step: WorkflowStepInstance | null;
  steps: WorkflowStepInstance[];
  can_approve: boolean;
  can_reject: boolean;
  can_delegate: boolean;
  is_preview: boolean;
  preview_steps?: WorkflowTemplateStep[];
  workflow_name?: string;
  workflow_id?: string;
}

export interface WorkflowStepInstance {
  id: string;
  workflow_step_id: string;
  step_order: number;
  status: string; // pending, active, approved, rejected
  deadline?: string;
  required_approvals: number;
  current_approvals: number;
  name?: string;
  actor?: { id: string; name: string };
  action_type?: string;
  comment?: string;
  step?: WorkflowTemplateStep;
  actions?: any[];
  activated_at?: string;
  completed_at?: string;
}

export interface WorkflowTemplateStep {
  id: string;
  workflow_id: string;
  step_order: number;
  name: string;
  step_type: string;
  assignee_type: string;
  assignee_user_id?: string;
  assignee_role_id?: string;
  assignee_position_id?: string;
  assignee_department_id?: string;
  assignee_section_id?: string;
  required_approvals: number;
  can_delegate: boolean;
  instructions?: string;
  deadline_days?: number;
}

export interface Distribution {
  id: string;
  user?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
  distributed_at: string;
  received_at?: string;
  status: string;
}

export interface Attachment {
  id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  module: string;
  uploaded_by: string;
  created_at: string;
  uploader?: { id: string; name: string; email: string };
}

export interface DropdownItem {
  id: string;
  name: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  document_type_id?: string;
}

export interface TemplateTag {
  id?: string;
  tag_key: string;
  label: string;
  description?: string;
  help_text?: string;
  suffix?: string;
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

export interface TagGroup {
  name: string;
  order: number;
  tags: TemplateTag[];
}

export interface DraftData {
  step: number;
  formData: any;
  metadata: Record<string, any>;
  selectedTemplateId: string | null;
  timestamp: number;
}

// Helper functions shared across document components
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'default', in_review: 'processing', revision: 'warning',
    approved: 'success', final: 'blue', obsolete: 'error', archived: 'default'
  };
  return colors[status] || 'default';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft', in_review: 'Dalam Review', revision: 'Revisi',
    approved: 'Disetujui', final: 'Final', obsolete: 'Usang', archived: 'Diarsipkan'
  };
  return labels[status] || status;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'default', normal: 'default', medium: 'blue', high: 'orange', urgent: 'red'
  };
  return colors[priority] || 'default';
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: 'Rendah', normal: 'Normal', medium: 'Sedang', high: 'Tinggi', urgent: 'Mendesak'
  };
  return labels[priority] || priority;
}

export function getConfidentialityLabel(level: string): string {
  const labels: Record<string, string> = {
    public: 'Publik', internal: 'Internal', confidential: 'Rahasia', secret: 'Sangat Rahasia'
  };
  return labels[level] || level;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear().toString().slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function getFileIcon(mimeType: string): string {
  if (mimeType?.includes('pdf')) return 'file-pdf';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-word';
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return 'file-excel';
  if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'file-ppt';
  if (mimeType?.includes('image')) return 'file-image';
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('compressed')) return 'file-zip';
  return 'file';
}

export const DRAFT_KEY = 'dms_document_draft';
