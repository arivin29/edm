package models

import "time"

// WorkflowInstance represents an active workflow for a document
type WorkflowInstance struct {
	ID          string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DocumentID  string     `gorm:"type:uuid;not null" json:"document_id"`
	WorkflowID  string     `gorm:"type:uuid;not null" json:"workflow_id"`
	Status      string     `gorm:"size:50;not null;default:'active'" json:"status"` // active, completed, cancelled
	Iteration   int        `gorm:"default:1" json:"iteration"`
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CancelledAt *time.Time `json:"cancelled_at"`

	// Relations
	Document *Document              `json:"document,omitempty"`
	Workflow *Workflow              `json:"workflow,omitempty"`
	Steps    []WorkflowStepInstance `gorm:"foreignKey:WorkflowInstanceID" json:"steps,omitempty"`
}

func (WorkflowInstance) TableName() string { return "workflow_instances" }

// WorkflowStepInstance represents an instance of a workflow step
type WorkflowStepInstance struct {
	ID                 string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	WorkflowInstanceID string     `gorm:"type:uuid;not null" json:"workflow_instance_id"`
	WorkflowStepID     string     `gorm:"type:uuid;not null" json:"workflow_step_id"`
	StepOrder          int        `json:"step_order"`
	Status             string     `gorm:"size:50;not null;default:'pending'" json:"status"` // pending, active, approved, rejected, skipped
	Deadline           *time.Time `json:"deadline"`
	ActivatedAt        *time.Time `json:"activated_at"`
	CompletedAt        *time.Time `json:"completed_at"`
	RequiredApprovals  int        `gorm:"default:1" json:"required_approvals"`
	CurrentApprovals   int        `gorm:"default:0" json:"current_approvals"`
	Escalated          bool       `gorm:"default:false" json:"escalated"`
	EscalatedAt        *time.Time `json:"escalated_at"`

	// Relations
	WorkflowInstance *WorkflowInstance `json:"workflow_instance,omitempty"`
	Step             *WorkflowStep     `gorm:"foreignKey:WorkflowStepID" json:"step,omitempty"`
	Actions          []WorkflowAction  `gorm:"foreignKey:StepInstanceID;references:ID" json:"actions,omitempty"`
}

func (WorkflowStepInstance) TableName() string { return "workflow_step_instances" }

// WorkflowAction represents an action taken on a workflow step
type WorkflowAction struct {
	ID                 string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	WorkflowInstanceID string    `gorm:"type:uuid;not null" json:"workflow_instance_id"`
	StepInstanceID     string    `gorm:"type:uuid;not null;column:workflow_step_instance_id" json:"step_instance_id"`
	ActorID            string    `gorm:"type:uuid;not null;column:user_id" json:"actor_id"`
	ActionType         string    `gorm:"size:50;not null;column:action" json:"action_type"` // approve, reject, delegate, comment
	Comment            *string   `json:"comment"`
	IsPublic           bool      `gorm:"default:true;column:is_comment_public" json:"is_public"`
	SignatureImage     *string   `gorm:"column:signature_path" json:"signature_image"`
	CreatedAt          time.Time `json:"created_at"`

	// Relations
	Actor        *User                 `gorm:"foreignKey:ActorID" json:"actor,omitempty"`
	StepInstance *WorkflowStepInstance `json:"step_instance,omitempty"`
}

func (WorkflowAction) TableName() string { return "workflow_actions" }

// WorkflowDelegation represents a delegation of a workflow step
type WorkflowDelegation struct {
	ID             string     `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	StepInstanceID string     `gorm:"type:uuid;not null" json:"step_instance_id"`
	DelegatedFrom  string     `gorm:"type:uuid;not null" json:"delegated_from"`
	DelegatedTo    string     `gorm:"type:uuid;not null" json:"delegated_to"`
	Reason         *string    `json:"reason"`
	Status         string     `gorm:"size:50;not null;default:'pending'" json:"status"` // pending, accepted, rejected
	CreatedAt      time.Time  `json:"created_at"`
	RespondedAt    *time.Time `json:"responded_at"`

	// Relations
	StepInstance    *WorkflowStepInstance `json:"step_instance,omitempty"`
	FromUser        *User                 `gorm:"foreignKey:DelegatedFrom" json:"from_user,omitempty"`
	ToUser          *User                 `gorm:"foreignKey:DelegatedTo" json:"to_user,omitempty"`
}

func (WorkflowDelegation) TableName() string { return "workflow_delegations" }
