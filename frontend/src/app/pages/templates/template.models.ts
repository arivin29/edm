export interface Template {
  id: string;
  name: string;
  code?: string;
  description?: string;
  document_type_id: string;
  category_id?: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  version: number;
  status: string;
  is_active: boolean;
  document_type?: { id: string; name: string };
  category?: { id: string; name: string };
  company?: { id: string; name: string };
  tags?: TemplateTag[];
  tag_count?: number;
  type_name?: string;
  category_name?: string;
  created_at: string;
}

export interface TemplateTag {
  id: string;
  template_id: string;
  tag_key: string;
  tag_placeholder: string;
  label: string;
  description?: string;
  data_type: string;
  source_type: string;
  source_config?: any;
  format_pattern?: string;
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
  table_config?: any;
  signature_config?: any;
}
