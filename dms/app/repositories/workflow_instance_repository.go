package repositories

import (
	"sort"

	"dms/app/facades"
	"dms/app/models"
)

type WorkflowInstanceRepository interface {
	// Instance operations
	CreateInstance(instance *models.WorkflowInstance) error
	FindActiveInstance(documentID string) (*models.WorkflowInstance, error)
	FindInstanceByID(id string) (*models.WorkflowInstance, error)
	FindInstanceWithSteps(id string) (*models.WorkflowInstance, error)
	UpdateInstance(instance *models.WorkflowInstance) error
	GetNextIteration(documentID string) (int, error)

	// Step instance operations
	CreateStepInstance(step *models.WorkflowStepInstance) error
	FindStepInstanceByID(id string) (*models.WorkflowStepInstance, error)
	FindActiveStepForDocument(documentID string) (*models.WorkflowStepInstance, error)
	FindStepsByInstanceID(instanceID string) ([]models.WorkflowStepInstance, error)
	UpdateStepInstance(step *models.WorkflowStepInstance) error

	// Action operations
	CreateAction(action *models.WorkflowAction) error
	GetActionsByStepInstance(stepInstanceID string) ([]models.WorkflowAction, error)

	// Delegation operations
	CreateDelegation(delegation *models.WorkflowDelegation) error
	FindActiveDelegation(stepInstanceID, userID string) (*models.WorkflowDelegation, error)
	UpdateDelegation(delegation *models.WorkflowDelegation) error

	// Pending tasks
	GetPendingTasksForUser(userID string, positionID, departmentID, sectionID *string, roleIDs []string) ([]models.WorkflowStepInstance, error)
}

type workflowInstanceRepository struct{}

func NewWorkflowInstanceRepository() WorkflowInstanceRepository {
	return &workflowInstanceRepository{}
}

// ---------------------------------------------------------------------------
// Instance Operations
// ---------------------------------------------------------------------------

func (r *workflowInstanceRepository) CreateInstance(instance *models.WorkflowInstance) error {
	return facades.Orm().Query().Create(instance)
}

func (r *workflowInstanceRepository) FindActiveInstance(documentID string) (*models.WorkflowInstance, error) {
	var instance models.WorkflowInstance
	if err := facades.Orm().Query().
		Where("document_id = ? AND status = ?", documentID, "active").
		First(&instance); err != nil {
		return nil, err
	}
	if instance.ID == "" {
		return nil, nil
	}
	return &instance, nil
}

func (r *workflowInstanceRepository) FindInstanceByID(id string) (*models.WorkflowInstance, error) {
	var instance models.WorkflowInstance
	if err := facades.Orm().Query().
		Where("id = ?", id).
		First(&instance); err != nil {
		return nil, err
	}
	if instance.ID == "" {
		return nil, nil
	}
	return &instance, nil
}

func (r *workflowInstanceRepository) FindInstanceWithSteps(id string) (*models.WorkflowInstance, error) {
	var instance models.WorkflowInstance
	if err := facades.Orm().Query().
		With("Document").
		With("Workflow").
		With("Steps").
		With("Steps.Step").
		With("Steps.Actions").
		With("Steps.Actions.Actor").
		Where("id = ?", id).
		First(&instance); err != nil {
		return nil, err
	}
	if instance.ID == "" {
		return nil, nil
	}

	// Sort steps by step_order
	sort.Slice(instance.Steps, func(i, j int) bool {
		return instance.Steps[i].StepOrder < instance.Steps[j].StepOrder
	})

	return &instance, nil
}

func (r *workflowInstanceRepository) UpdateInstance(instance *models.WorkflowInstance) error {
	return facades.Orm().Query().Save(instance)
}

func (r *workflowInstanceRepository) GetNextIteration(documentID string) (int, error) {
	var maxIteration int
	if err := facades.Orm().Query().
		Model(&models.WorkflowInstance{}).
		Where("document_id = ?", documentID).
		Pluck("COALESCE(MAX(iteration), 0)", &maxIteration); err != nil {
		return 1, err
	}
	return maxIteration + 1, nil
}

// ---------------------------------------------------------------------------
// Step Instance Operations
// ---------------------------------------------------------------------------

func (r *workflowInstanceRepository) CreateStepInstance(step *models.WorkflowStepInstance) error {
	return facades.Orm().Query().Create(step)
}

func (r *workflowInstanceRepository) FindStepInstanceByID(id string) (*models.WorkflowStepInstance, error) {
	var step models.WorkflowStepInstance
	if err := facades.Orm().Query().
		With("Step").
		With("WorkflowInstance").
		With("Actions").
		With("Actions.Actor").
		Where("id = ?", id).
		First(&step); err != nil {
		return nil, err
	}
	if step.ID == "" {
		return nil, nil
	}
	return &step, nil
}

func (r *workflowInstanceRepository) FindActiveStepForDocument(documentID string) (*models.WorkflowStepInstance, error) {
	// First find active workflow instance
	var instance models.WorkflowInstance
	if err := facades.Orm().Query().
		Where("document_id = ? AND status = ?", documentID, "active").
		First(&instance); err != nil {
		return nil, err
	}
	if instance.ID == "" {
		return nil, nil
	}

	// Find active step in this instance
	var step models.WorkflowStepInstance
	if err := facades.Orm().Query().
		With("Step").
		With("WorkflowInstance").
		With("Actions").
		With("Actions.Actor").
		Where("workflow_instance_id = ? AND status = ?", instance.ID, "active").
		First(&step); err != nil {
		return nil, err
	}
	if step.ID == "" {
		return nil, nil
	}

	return &step, nil
}

func (r *workflowInstanceRepository) FindStepsByInstanceID(instanceID string) ([]models.WorkflowStepInstance, error) {
	var steps []models.WorkflowStepInstance
	if err := facades.Orm().Query().
		With("Step").
		With("Actions").
		With("Actions.Actor").
		Where("workflow_instance_id = ?", instanceID).
		Order("step_order asc").
		Get(&steps); err != nil {
		return nil, err
	}
	return steps, nil
}

func (r *workflowInstanceRepository) UpdateStepInstance(step *models.WorkflowStepInstance) error {
	return facades.Orm().Query().Save(step)
}

// ---------------------------------------------------------------------------
// Action Operations
// ---------------------------------------------------------------------------

func (r *workflowInstanceRepository) CreateAction(action *models.WorkflowAction) error {
	return facades.Orm().Query().Create(action)
}

func (r *workflowInstanceRepository) GetActionsByStepInstance(stepInstanceID string) ([]models.WorkflowAction, error) {
	var actions []models.WorkflowAction
	if err := facades.Orm().Query().
		With("Actor").
		Where("step_instance_id = ?", stepInstanceID).
		Order("created_at asc").
		Get(&actions); err != nil {
		return nil, err
	}
	return actions, nil
}

// ---------------------------------------------------------------------------
// Delegation Operations
// ---------------------------------------------------------------------------

func (r *workflowInstanceRepository) CreateDelegation(delegation *models.WorkflowDelegation) error {
	return facades.Orm().Query().Create(delegation)
}

func (r *workflowInstanceRepository) FindActiveDelegation(stepInstanceID, userID string) (*models.WorkflowDelegation, error) {
	var delegation models.WorkflowDelegation
	if err := facades.Orm().Query().
		With("FromUser").
		With("ToUser").
		Where("step_instance_id = ? AND delegated_to = ? AND status = ?", stepInstanceID, userID, "accepted").
		First(&delegation); err != nil {
		return nil, err
	}
	if delegation.ID == "" {
		return nil, nil
	}
	return &delegation, nil
}

func (r *workflowInstanceRepository) UpdateDelegation(delegation *models.WorkflowDelegation) error {
	return facades.Orm().Query().Save(delegation)
}

// ---------------------------------------------------------------------------
// Pending Tasks
// ---------------------------------------------------------------------------

func (r *workflowInstanceRepository) GetPendingTasksForUser(
	userID string,
	positionID, departmentID, sectionID *string,
	roleIDs []string,
) ([]models.WorkflowStepInstance, error) {
	var steps []models.WorkflowStepInstance

	// Build subquery for matching assignees
	// A user matches if:
	// 1. assignee_type = 'user' AND assignee_user_id = userID
	// 2. assignee_type = 'position' AND assignee_position_id = user.positionID
	// 3. assignee_type = 'department' AND assignee_department_id = user.departmentID
	// 4. assignee_type = 'section' AND assignee_section_id = user.sectionID
	// 5. assignee_type = 'role' AND assignee_role_id IN (user.roleIDs)

	q := facades.Orm().Query().
		With("Step").
		With("WorkflowInstance").
		With("WorkflowInstance.Document").
		With("Actions").
		Where("status = ?", "active")

	// Get active step instances with their step config
	if err := q.Get(&steps); err != nil {
		return nil, err
	}

	// Filter steps where user is an assignee
	var matchingSteps []models.WorkflowStepInstance
	for _, step := range steps {
		if step.Step == nil {
			continue
		}

		matched := false
		switch step.Step.AssigneeType {
		case "user":
			if step.Step.AssigneeUserID != nil && *step.Step.AssigneeUserID == userID {
				matched = true
			}
		case "position":
			if positionID != nil && step.Step.AssigneePositionID != nil && *step.Step.AssigneePositionID == *positionID {
				matched = true
			}
		case "department":
			if departmentID != nil && step.Step.AssigneeDepartmentID != nil && *step.Step.AssigneeDepartmentID == *departmentID {
				matched = true
			}
		case "section":
			if sectionID != nil && step.Step.AssigneeSectionID != nil && *step.Step.AssigneeSectionID == *sectionID {
				matched = true
			}
		case "role":
			if step.Step.AssigneeRoleID != nil {
				for _, roleID := range roleIDs {
					if *step.Step.AssigneeRoleID == roleID {
						matched = true
						break
					}
				}
			}
		}

		if matched {
			matchingSteps = append(matchingSteps, step)
		}
	}

	// Also check for delegations
	var delegations []models.WorkflowDelegation
	if err := facades.Orm().Query().
		With("StepInstance").
		With("StepInstance.Step").
		With("StepInstance.WorkflowInstance").
		With("StepInstance.WorkflowInstance.Document").
		Where("delegated_to = ? AND status = ?", userID, "accepted").
		Get(&delegations); err == nil {
		for _, d := range delegations {
			if d.StepInstance != nil && d.StepInstance.Status == "active" {
				matchingSteps = append(matchingSteps, *d.StepInstance)
			}
		}
	}

	return matchingSteps, nil
}
