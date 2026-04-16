export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  department_id?: number;
  department_name?: string;
  section_id?: number;
  position_id?: number;
  position_name?: string;
  roles: { id: number; name: string }[];
  is_active: boolean;
  created_at: string;
}

export interface DropdownItem {
  id: number;
  name: string;
}
