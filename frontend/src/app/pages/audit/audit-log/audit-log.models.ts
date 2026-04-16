export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_position?: string;
  office_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: { id: string; name: string; email: string };
}

export interface AuditMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface UserOption {
  id: string;
  name: string;
}
