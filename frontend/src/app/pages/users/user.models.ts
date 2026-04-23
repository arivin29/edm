export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  employee_id?: string;
  department_id?: string;
  department_name?: string;
  department?: { id: string; name: string };
  section_id?: string;
  section?: { id: string; name: string };
  position_id?: string;
  position_name?: string;
  position?: { id: string; name: string };
  company_id?: string;
  company?: { id: string; name: string };
  office_id?: string;
  office?: { id: string; name: string };
  roles: { id: string; name: string }[];
  permissions?: string[];
  is_active: boolean;
  signature_image?: string;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
}

export interface UserActivity {
  id: string;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DropdownItem {
  id: string;
  name: string;
}
