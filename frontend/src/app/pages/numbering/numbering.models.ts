export interface DocumentNumbering {
  id: string;
  company_id: string;
  office_id?: string;
  document_type_id: string;
  category_id?: string;
  department_id?: string;
  prefix?: string;
  separator: string;
  format: string;
  current_sequence: number;
  reset_period?: string;
  last_reset_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Company { id: string; name: string; }
export interface DocumentType { id: string; name: string; code: string; }
export interface Category { id: string; name: string; code: string; }
export interface Department { id: string; name: string; }
export interface Office { id: string; name: string; }
