export interface Workflow {
  id: string;
  company_id: string;
  office_id?: string;
  document_type_id: string;
  category_id?: string;
  department_id?: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string };
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string };
  department?: { id: string; name: string };
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
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
  is_parallel: boolean;
  required_approvals: number;
  on_reject_action: string;
  reject_to_step_id?: string;
  deadline_days?: number;
  can_edit: boolean;
  can_comment: boolean;
  can_delegate: boolean;
  instructions?: string;
}

export interface DropdownItem {
  id: string;
  name: string;
  code?: string;
  email?: string;
}
