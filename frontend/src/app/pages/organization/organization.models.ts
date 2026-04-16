export interface Company {
  id: number;
  code: string;
  name: string;
  is_active?: boolean;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Office {
  id: number;
  code: string;
  name: string;
  company_id: number;
  company_name?: string;
  is_active?: boolean;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  office_id: number;
  office_name?: string;
  is_active?: boolean;
}

export interface Section {
  id: number;
  code: string;
  name: string;
  department_id: number;
  department_name?: string;
  is_active?: boolean;
}

export interface Position {
  id: number;
  code: string;
  name: string;
  level: number;
  is_active?: boolean;
}

export type OrgType = 'company' | 'office' | 'department' | 'section' | 'position';

export interface ApiResponse<T> {
  data: T[];
  meta?: any;
}
