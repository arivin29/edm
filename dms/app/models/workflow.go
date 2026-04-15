package models

import "time"

type Workflow struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CompanyID      string     `gorm:"type:uuid;not null" json:"company_id"`
	OfficeID       *string    `gorm:"type:uuid" json:"office_id"`
	DocumentTypeID string     `gorm:"type:uuid;not null" json:"document_type_id"`
	CategoryID     *string    `gorm:"type:uuid" json:"category_id"`
	DepartmentID   *string    `gorm:"type:uuid" json:"department_id"`
	Name           string     `gorm:"size:255;not null" json:"name"`
	Description    *string    `json:"description"`
	IsActive       bool       `gorm:"default:true" json:"is_active"`
	CreatedBy      string     `gorm:"type:uuid;not null" json:"created_by"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	DeletedAt      *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Company      *Company          `json:"company,omitempty"`
	Office       *Office           `json:"office,omitempty"`
	DocumentType *DocumentType     `json:"document_type,omitempty"`
	Category     *DocumentCategory `json:"category,omitempty"`
	Department   *Department       `json:"department,omitempty"`
	Steps        []WorkflowStep    `gorm:"foreignKey:WorkflowID" json:"steps,omitempty"`
}

func (Workflow) TableName() string { return "workflows" }

type WorkflowStep struct {
	ID                      string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	WorkflowID              string     `gorm:"type:uuid;not null" json:"workflow_id"`
	StepOrder               int        `gorm:"not null" json:"step_order"`
	Name                    string     `gorm:"size:255;not null" json:"name"`
	StepType                string     `gorm:"size:50;not null" json:"step_type"`
	AssigneeType            string     `gorm:"size:50;not null" json:"assignee_type"`
	AssigneeUserID          *string    `gorm:"type:uuid" json:"assignee_user_id"`
	AssigneeRoleID          *string    `gorm:"type:uuid" json:"assignee_role_id"`
	AssigneePositionID      *string    `gorm:"type:uuid" json:"assignee_position_id"`
	AssigneeDepartmentID    *string    `gorm:"type:uuid" json:"assignee_department_id"`
	AssigneeSectionID       *string    `gorm:"type:uuid" json:"assignee_section_id"`
	IsParallel              bool       `gorm:"default:false" json:"is_parallel"`
	RequiredApprovals       int        `gorm:"default:1" json:"required_approvals"`
	OnRejectAction          string     `gorm:"size:50;default:'to_creator'" json:"on_reject_action"`
	RejectToStepID          *string    `gorm:"type:uuid" json:"reject_to_step_id"`
	RejectCommentRequired   bool       `gorm:"default:true" json:"reject_comment_required"`
	ApproveCommentRequired  bool       `gorm:"default:false" json:"approve_comment_required"`
	DeadlineDays            *int       `json:"deadline_days"`
	EscalationAction        *string    `gorm:"size:50" json:"escalation_action"`
	EscalationAfterDays     *int       `json:"escalation_after_days"`
	CanEdit                 bool       `gorm:"default:false" json:"can_edit"`
	CanComment              bool       `gorm:"default:true" json:"can_comment"`
	CanDelegate             bool       `gorm:"default:false" json:"can_delegate"`
	Instructions            *string    `json:"instructions"`
	CreatedAt               time.Time  `json:"created_at"`
	UpdatedAt               time.Time  `json:"updated_at"`

	// Relations
	Workflow           *Workflow   `json:"workflow,omitempty"`
	AssigneeUser       *User       `gorm:"foreignKey:AssigneeUserID" json:"assignee_user,omitempty"`
	AssigneeRole       *Role       `gorm:"foreignKey:AssigneeRoleID" json:"assignee_role,omitempty"`
	AssigneePosition   *Position   `gorm:"foreignKey:AssigneePositionID" json:"assignee_position,omitempty"`
	AssigneeDepartment *Department `gorm:"foreignKey:AssigneeDepartmentID" json:"assignee_department,omitempty"`
	AssigneeSection    *Section    `gorm:"foreignKey:AssigneeSectionID" json:"assignee_section,omitempty"`
	RejectToStep       *WorkflowStep `gorm:"foreignKey:RejectToStepID" json:"reject_to_step,omitempty"`
}

func (WorkflowStep) TableName() string { return "workflow_steps" }
