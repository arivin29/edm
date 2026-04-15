package migrations

import (
	"dms/app/facades"
)

type M20250414000008CreateWorkflowTables struct{}

func (r *M20250414000008CreateWorkflowTables) Signature() string {
	return "20250414000008_create_workflow_tables"
}

func (r *M20250414000008CreateWorkflowTables) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE workflows (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		company_id UUID NOT NULL REFERENCES companies(id),
		office_id UUID REFERENCES offices(id),
		document_type_id UUID NOT NULL REFERENCES document_types(id),
		category_id UUID REFERENCES document_categories(id),
		department_id UUID REFERENCES departments(id),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		is_active BOOLEAN DEFAULT TRUE,
		created_by UUID NOT NULL REFERENCES users(id),
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		deleted_at TIMESTAMP
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_workflows_company ON workflows(company_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_workflows_type ON workflows(document_type_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE workflow_steps (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
		step_order INT NOT NULL,
		name VARCHAR(255) NOT NULL,
		step_type VARCHAR(50) NOT NULL,
		assignee_type VARCHAR(50) NOT NULL,
		assignee_user_id UUID REFERENCES users(id),
		assignee_role_id UUID REFERENCES roles(id),
		assignee_position_id UUID REFERENCES positions(id),
		assignee_department_id UUID REFERENCES departments(id),
		assignee_section_id UUID REFERENCES sections(id),
		is_parallel BOOLEAN DEFAULT FALSE,
		required_approvals INT DEFAULT 1,
		on_reject_action VARCHAR(50) DEFAULT 'to_creator',
		reject_to_step_id UUID REFERENCES workflow_steps(id),
		reject_comment_required BOOLEAN DEFAULT TRUE,
		approve_comment_required BOOLEAN DEFAULT FALSE,
		deadline_days INT,
		escalation_action VARCHAR(50),
		escalation_after_days INT,
		can_edit BOOLEAN DEFAULT FALSE,
		can_comment BOOLEAN DEFAULT TRUE,
		can_delegate BOOLEAN DEFAULT FALSE,
		instructions TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW(),
		UNIQUE(workflow_id, step_order)
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE workflow_instances (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		document_id UUID NOT NULL REFERENCES documents(id),
		workflow_id UUID NOT NULL REFERENCES workflows(id),
		current_step_id UUID REFERENCES workflow_steps(id),
		iteration INT DEFAULT 1,
		status VARCHAR(50) NOT NULL DEFAULT 'active',
		started_at TIMESTAMP DEFAULT NOW(),
		completed_at TIMESTAMP,
		cancelled_at TIMESTAMP,
		cancelled_by UUID REFERENCES users(id),
		cancel_reason TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_instances_document ON workflow_instances(document_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_instances_status ON workflow_instances(status)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE workflow_step_instances (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
		workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
		step_order INT NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'pending',
		assigned_users JSONB,
		approval_count INT DEFAULT 0,
		rejection_count INT DEFAULT 0,
		required_approvals INT DEFAULT 1,
		deadline_at TIMESTAMP,
		escalated BOOLEAN DEFAULT FALSE,
		escalated_at TIMESTAMP,
		started_at TIMESTAMP,
		completed_at TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_step_inst_instance ON workflow_step_instances(workflow_instance_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_step_inst_status ON workflow_step_instances(status)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_step_inst_deadline ON workflow_step_instances(deadline_at) WHERE status = 'active'`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE TABLE workflow_actions (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id),
		workflow_step_instance_id UUID NOT NULL REFERENCES workflow_step_instances(id),
		user_id UUID NOT NULL REFERENCES users(id),
		action VARCHAR(50) NOT NULL,
		comment TEXT,
		is_comment_public BOOLEAN DEFAULT TRUE,
		signature_used BOOLEAN DEFAULT FALSE,
		signature_path VARCHAR(500),
		delegated_to UUID REFERENCES users(id),
		delegation_reason TEXT,
		ip_address INET,
		user_agent TEXT,
		metadata JSONB,
		created_at TIMESTAMP DEFAULT NOW()
	)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_actions_instance ON workflow_actions(workflow_instance_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_actions_step ON workflow_actions(workflow_step_instance_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_actions_user ON workflow_actions(user_id)`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE INDEX idx_wf_actions_action ON workflow_actions(action)`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000008CreateWorkflowTables) Down() error {
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS workflow_actions CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS workflow_step_instances CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS workflow_instances CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS workflow_steps CASCADE`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`DROP TABLE IF EXISTS workflows CASCADE`); err != nil {
		return err
	}
	return nil
}
