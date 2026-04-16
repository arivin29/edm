export interface SystemSetting {
  id: string;
  company_id?: string;
  office_id?: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DropdownItem {
  id: string;
  name: string;
}

export interface CategoryGroup {
  prefix: string;
  label: string;
  items: SystemSetting[];
}
