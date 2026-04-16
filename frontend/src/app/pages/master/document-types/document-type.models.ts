export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  template_count?: number;
}
