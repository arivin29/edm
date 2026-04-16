export interface DocumentCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent?: { id: string; name: string };
  sort_order: number;
  is_active: boolean;
}
