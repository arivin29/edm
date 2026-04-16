package services

import (
	"errors"
	"sort"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

// PendingTask represents a pending approval task for a user
type PendingTask struct {
	StepInstance *models.WorkflowStepInstance `json:"step_instance"`
	Document     *models.Document             `json:"document"`
	StepName     string                       `json:"step_name"`
	Deadline     *time.Time                   `json:"deadline"`
	IsDelegated  bool                         `json:"is_delegated"`
}

// WorkflowStatus represents the current workflow status for a document
type WorkflowStatus struct {
	Instance    *models.WorkflowInstance       `json:"instance"`
	CurrentStep *models.WorkflowStepInstance   `json:"current_step"`
	Steps       []models.WorkflowStepInstance  `json:"steps"`
	CanApprove  bool                           `json:"can_approve"`
	CanReject   bool                           `json:"can_reject"`
	CanDelegate bool                           `json:"can_delegate"`

	// Preview: matched workflow template (shown when no active instance)
	IsPreview      bool                  `json:"is_preview"`
	PreviewSteps   []models.WorkflowStep `json:"preview_steps,omitempty"`
	WorkflowName   string                `json:"workflow_name,omitempty"`
	WorkflowID     string                `json:"workflow_id,omitempty"`
}

type WorkflowActionService struct {
	instanceRepo repositories.WorkflowInstanceRepository
	workflowRepo repositories.WorkflowRepository
	docRepo      repositories.DocumentRepository
	userRepo     repositories.UserRepository
}

func NewWorkflowActionService() *WorkflowActionService {
	return &WorkflowActionService{
		instanceRepo: repositories.NewWorkflowInstanceRepository(),
		workflowRepo: repositories.NewWorkflowRepository(),
		docRepo:      repositories.NewDocumentRepository(),
		userRepo:     repositories.NewUserRepository(),
	}
}

// ---------------------------------------------------------------------------
// Submit - Start workflow for a document
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) Submit(documentID string, ctx http.Context) (*models.WorkflowInstance, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Get document
	doc, err := s.docRepo.FindByIDWithRelations(documentID)
	if err != nil {
		return nil, err
	}
	if doc == nil {
		return nil, errors.New("document not found")
	}

	// Check document status - must be draft or revision
	if doc.Status != "draft" && doc.Status != "revision" {
		return nil, errors.New("document must be in draft or revision status to submit")
	}

	// Check for active workflow instance
	existingInstance, _ := s.instanceRepo.FindActiveInstance(documentID)
	if existingInstance != nil {
		return nil, errors.New("document already has an active workflow")
	}

	// Find appropriate workflow for this document
	workflow, err := s.workflowRepo.FindForDocument(
		doc.CompanyID,
		doc.DocumentTypeID,
		&doc.CategoryID,
		&doc.OfficeID,
		&doc.DepartmentID,
	)
	if err != nil {
		return nil, err
	}
	if workflow == nil {
		return nil, errors.New("no workflow configured for this document type")
	}

	// Get workflow with steps
	workflow, err = s.workflowRepo.FindByIDWithSteps(workflow.ID)
	if err != nil {
		return nil, err
	}
	if len(workflow.Steps) == 0 {
		return nil, errors.New("workflow has no steps configured")
	}

	// Get next iteration number
	iteration, err := s.instanceRepo.GetNextIteration(documentID)
	if err != nil {
		iteration = 1
	}

	// Create workflow instance
	now := time.Now()
	instance := &models.WorkflowInstance{
		DocumentID: documentID,
		WorkflowID: workflow.ID,
		Status:     "active",
		Iteration:  iteration,
		StartedAt:  &now,
	}

	if err := s.instanceRepo.CreateInstance(instance); err != nil {
		return nil, err
	}

	// Create step instances
	for _, step := range workflow.Steps {
		var deadline *time.Time
		if step.DeadlineDays != nil && *step.DeadlineDays > 0 {
			d := now.AddDate(0, 0, *step.DeadlineDays)
			deadline = &d
		}

		stepInstance := &models.WorkflowStepInstance{
			WorkflowInstanceID: instance.ID,
			WorkflowStepID:     step.ID,
			StepOrder:          step.StepOrder,
			Status:             "pending",
			Deadline:           deadline,
			RequiredApprovals:  step.RequiredApprovals,
			CurrentApprovals:   0,
		}

		if err := s.instanceRepo.CreateStepInstance(stepInstance); err != nil {
			return nil, err
		}
	}

	// Activate first step
	steps, err := s.instanceRepo.FindStepsByInstanceID(instance.ID)
	if err != nil {
		return nil, err
	}
	if len(steps) > 0 {
		sort.Slice(steps, func(i, j int) bool {
			return steps[i].StepOrder < steps[j].StepOrder
		})
		steps[0].Status = "active"
		steps[0].ActivatedAt = &now
		if err := s.instanceRepo.UpdateStepInstance(&steps[0]); err != nil {
			return nil, err
		}
	}

	// Update document status
	doc.Status = "in_review"
	doc.SubmittedAt = &now
	doc.SubmittedBy = &user.ID
	if err := s.docRepo.Update(doc); err != nil {
		return nil, err
	}

	// Return instance with steps
	return s.instanceRepo.FindInstanceWithSteps(instance.ID)
}

// ---------------------------------------------------------------------------
// ProcessAction - Process approve/reject action
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) ProcessAction(documentID, actionType string, ctx http.Context) (*models.WorkflowStepInstance, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Validate action type
	if actionType != "approve" && actionType != "reject" {
		return nil, errors.New("invalid action type")
	}

	// Find active step for document
	stepInstance, err := s.instanceRepo.FindActiveStepForDocument(documentID)
	if err != nil {
		return nil, err
	}
	if stepInstance == nil {
		return nil, errors.New("no active workflow step found")
	}

	// Check if user can perform action on this step
	canPerform, err := s.canUserActOnStep(user, stepInstance)
	if err != nil {
		return nil, err
	}
	if !canPerform {
		return nil, errors.New("you are not authorized to perform this action")
	}

	// Get comment from request
	comment := ctx.Request().Input("comment")
	signature := ctx.Request().Input("signature_image")

	// Check if comment is required
	if stepInstance.Step != nil {
		if actionType == "reject" && stepInstance.Step.RejectCommentRequired && comment == "" {
			return nil, errors.New("comment is required for rejection")
		}
		if actionType == "approve" && stepInstance.Step.ApproveCommentRequired && comment == "" {
			return nil, errors.New("comment is required for approval")
		}
	}

	// Create action record
	action := &models.WorkflowAction{
		WorkflowInstanceID: stepInstance.WorkflowInstanceID,
		StepInstanceID:     stepInstance.ID,
		ActorID:            user.ID,
		ActionType:         actionType,
		IsPublic:           true,
		CreatedAt:          time.Now(),
	}
	if comment != "" {
		action.Comment = &comment
	}
	if signature != "" {
		action.SignatureImage = &signature
	}

	if err := s.instanceRepo.CreateAction(action); err != nil {
		return nil, err
	}

	// Process the action
	if actionType == "approve" {
		return s.processApproval(stepInstance, user)
	}
	return s.processRejection(stepInstance, user, comment)
}

func (s *WorkflowActionService) processApproval(stepInstance *models.WorkflowStepInstance, user *types.UserContext) (*models.WorkflowStepInstance, error) {
	now := time.Now()

	// Increment approval count
	stepInstance.CurrentApprovals++

	// Check if we have enough approvals
	if stepInstance.CurrentApprovals >= stepInstance.RequiredApprovals {
		stepInstance.Status = "approved"
		stepInstance.CompletedAt = &now

		if err := s.instanceRepo.UpdateStepInstance(stepInstance); err != nil {
			return nil, err
		}

		// Get the workflow instance
		instance, err := s.instanceRepo.FindInstanceWithSteps(stepInstance.WorkflowInstanceID)
		if err != nil {
			return nil, err
		}

		// Find next step
		var nextStep *models.WorkflowStepInstance
		sort.Slice(instance.Steps, func(i, j int) bool {
			return instance.Steps[i].StepOrder < instance.Steps[j].StepOrder
		})

		for i := range instance.Steps {
			if instance.Steps[i].StepOrder > stepInstance.StepOrder && instance.Steps[i].Status == "pending" {
				nextStep = &instance.Steps[i]
				break
			}
		}

		if nextStep != nil {
			// Activate next step
			nextStep.Status = "active"
			nextStep.ActivatedAt = &now
			if err := s.instanceRepo.UpdateStepInstance(nextStep); err != nil {
				return nil, err
			}
		} else {
			// No more steps - workflow is complete
			instance.Status = "completed"
			instance.CompletedAt = &now
			if err := s.instanceRepo.UpdateInstance(instance); err != nil {
				return nil, err
			}

			// Update document status to approved
			doc, err := s.docRepo.FindByID(instance.DocumentID)
			if err != nil {
				return nil, err
			}
			if doc != nil {
				doc.Status = "approved"
				doc.ApprovedAt = &now
				if err := s.docRepo.Update(doc); err != nil {
					return nil, err
				}
			}
		}
	} else {
		// Still need more approvals
		if err := s.instanceRepo.UpdateStepInstance(stepInstance); err != nil {
			return nil, err
		}
	}

	return s.instanceRepo.FindStepInstanceByID(stepInstance.ID)
}

func (s *WorkflowActionService) processRejection(stepInstance *models.WorkflowStepInstance, user *types.UserContext, comment string) (*models.WorkflowStepInstance, error) {
	now := time.Now()

	stepInstance.Status = "rejected"
	stepInstance.CompletedAt = &now

	if err := s.instanceRepo.UpdateStepInstance(stepInstance); err != nil {
		return nil, err
	}

	// Get the workflow instance
	instance, err := s.instanceRepo.FindInstanceWithSteps(stepInstance.WorkflowInstanceID)
	if err != nil {
		return nil, err
	}

	// Get step configuration
	step := stepInstance.Step
	if step == nil {
		step, _ = s.workflowRepo.FindStepByID(stepInstance.WorkflowStepID)
	}

	onRejectAction := "to_creator"
	if step != nil {
		onRejectAction = step.OnRejectAction
	}

	// Handle based on on_reject_action
	switch onRejectAction {
	case "to_creator":
		// Cancel workflow and set document to revision
		instance.Status = "cancelled"
		instance.CancelledAt = &now
		if err := s.instanceRepo.UpdateInstance(instance); err != nil {
			return nil, err
		}

		doc, err := s.docRepo.FindByID(instance.DocumentID)
		if err != nil {
			return nil, err
		}
		if doc != nil {
			doc.Status = "revision"
			doc.RevisionFromStepID = &stepInstance.WorkflowStepID
			if comment != "" {
				doc.RevisionNotes = &comment
			}
			doc.RevisionCount++
			if err := s.docRepo.Update(doc); err != nil {
				return nil, err
			}
		}

	case "to_previous":
		// Find and activate previous step
		sort.Slice(instance.Steps, func(i, j int) bool {
			return instance.Steps[i].StepOrder < instance.Steps[j].StepOrder
		})

		var prevStep *models.WorkflowStepInstance
		for i := len(instance.Steps) - 1; i >= 0; i-- {
			if instance.Steps[i].StepOrder < stepInstance.StepOrder {
				prevStep = &instance.Steps[i]
				break
			}
		}

		if prevStep != nil {
			prevStep.Status = "active"
			prevStep.ActivatedAt = &now
			prevStep.CompletedAt = nil
			prevStep.CurrentApprovals = 0
			if err := s.instanceRepo.UpdateStepInstance(prevStep); err != nil {
				return nil, err
			}
		} else {
			// No previous step, fallback to_creator behavior
			instance.Status = "cancelled"
			instance.CancelledAt = &now
			if err := s.instanceRepo.UpdateInstance(instance); err != nil {
				return nil, err
			}

			doc, err := s.docRepo.FindByID(instance.DocumentID)
			if err != nil {
				return nil, err
			}
			if doc != nil {
				doc.Status = "revision"
				doc.RevisionFromStepID = &stepInstance.WorkflowStepID
				if comment != "" {
					doc.RevisionNotes = &comment
				}
				doc.RevisionCount++
				if err := s.docRepo.Update(doc); err != nil {
					return nil, err
				}
			}
		}

	case "to_step":
		// Activate specific step
		if step != nil && step.RejectToStepID != nil {
			for i := range instance.Steps {
				if instance.Steps[i].WorkflowStepID == *step.RejectToStepID {
					instance.Steps[i].Status = "active"
					instance.Steps[i].ActivatedAt = &now
					instance.Steps[i].CompletedAt = nil
					instance.Steps[i].CurrentApprovals = 0
					if err := s.instanceRepo.UpdateStepInstance(&instance.Steps[i]); err != nil {
						return nil, err
					}
					break
				}
			}
		}

	case "cancel":
		// Cancel workflow and reset document to draft
		instance.Status = "cancelled"
		instance.CancelledAt = &now
		if err := s.instanceRepo.UpdateInstance(instance); err != nil {
			return nil, err
		}

		doc, err := s.docRepo.FindByID(instance.DocumentID)
		if err != nil {
			return nil, err
		}
		if doc != nil {
			doc.Status = "draft"
			if err := s.docRepo.Update(doc); err != nil {
				return nil, err
			}
		}
	}

	return s.instanceRepo.FindStepInstanceByID(stepInstance.ID)
}

// ---------------------------------------------------------------------------
// Delegate - Delegate step to another user
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) Delegate(documentID string, ctx http.Context) (*models.WorkflowDelegation, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	delegateToID := ctx.Request().Input("delegate_to")
	reason := ctx.Request().Input("reason")

	if delegateToID == "" {
		return nil, errors.New("delegate_to is required")
	}

	// Find active step for document
	stepInstance, err := s.instanceRepo.FindActiveStepForDocument(documentID)
	if err != nil {
		return nil, err
	}
	if stepInstance == nil {
		return nil, errors.New("no active workflow step found")
	}

	// Check if user can delegate this step
	canPerform, err := s.canUserActOnStep(user, stepInstance)
	if err != nil {
		return nil, err
	}
	if !canPerform {
		return nil, errors.New("you are not authorized to delegate this step")
	}

	// Check if step allows delegation
	if stepInstance.Step != nil && !stepInstance.Step.CanDelegate {
		return nil, errors.New("delegation is not allowed for this step")
	}

	// Verify delegate user exists
	delegateUser, err := s.userRepo.FindByID(delegateToID)
	if err != nil || delegateUser == nil {
		return nil, errors.New("delegate user not found")
	}

	// Create delegation
	now := time.Now()
	delegation := &models.WorkflowDelegation{
		StepInstanceID: stepInstance.ID,
		DelegatedFrom:  user.ID,
		DelegatedTo:    delegateToID,
		Status:         "accepted", // Auto-accept for now
		CreatedAt:      now,
		RespondedAt:    &now,
	}
	if reason != "" {
		delegation.Reason = &reason
	}

	if err := s.instanceRepo.CreateDelegation(delegation); err != nil {
		return nil, err
	}

	// Create action record
	action := &models.WorkflowAction{
		WorkflowInstanceID: stepInstance.WorkflowInstanceID,
		StepInstanceID:     stepInstance.ID,
		ActorID:            user.ID,
		ActionType:         "delegate",
		IsPublic:           true,
		CreatedAt:          now,
	}
	comment := "Delegated to user: " + delegateUser.Name
	if reason != "" {
		comment += " - " + reason
	}
	action.Comment = &comment

	if err := s.instanceRepo.CreateAction(action); err != nil {
		return nil, err
	}

	return delegation, nil
}

// ---------------------------------------------------------------------------
// GetWorkflowStatus - Get current workflow status for a document
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) GetWorkflowStatus(documentID string, ctx http.Context) (*WorkflowStatus, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Find active workflow instance
	instance, err := s.instanceRepo.FindActiveInstance(documentID)
	if err != nil {
		return nil, err
	}
	if instance == nil {
		// No active instance — try to find matching workflow template for preview
		doc, docErr := s.docRepo.FindByIDWithRelations(documentID)
		if docErr == nil && doc != nil {
			workflow, wfErr := s.workflowRepo.FindForDocument(
				doc.CompanyID,
				doc.DocumentTypeID,
				&doc.CategoryID,
				&doc.OfficeID,
				&doc.DepartmentID,
			)
			if wfErr == nil && workflow != nil {
				wfWithSteps, _ := s.workflowRepo.FindByIDWithSteps(workflow.ID)
				if wfWithSteps != nil && len(wfWithSteps.Steps) > 0 {
					sort.Slice(wfWithSteps.Steps, func(i, j int) bool {
						return wfWithSteps.Steps[i].StepOrder < wfWithSteps.Steps[j].StepOrder
					})
					return &WorkflowStatus{
						IsPreview:    true,
						PreviewSteps: wfWithSteps.Steps,
						WorkflowName: wfWithSteps.Name,
						WorkflowID:   wfWithSteps.ID,
						CanApprove:   false,
						CanReject:    false,
						CanDelegate:  false,
					}, nil
				}
			}
		}

		return &WorkflowStatus{
			Instance:    nil,
			CurrentStep: nil,
			Steps:       nil,
			CanApprove:  false,
			CanReject:   false,
			CanDelegate: false,
		}, nil
	}

	// Get instance with steps
	instance, err = s.instanceRepo.FindInstanceWithSteps(instance.ID)
	if err != nil {
		return nil, err
	}

	// Find current step
	var currentStep *models.WorkflowStepInstance
	for i := range instance.Steps {
		if instance.Steps[i].Status == "active" {
			currentStep = &instance.Steps[i]
			break
		}
	}

	// Check user permissions
	canApprove := false
	canReject := false
	canDelegate := false

	if currentStep != nil {
		canPerform, _ := s.canUserActOnStep(user, currentStep)
		canApprove = canPerform
		canReject = canPerform
		if currentStep.Step != nil {
			canDelegate = canPerform && currentStep.Step.CanDelegate
		}
	}

	return &WorkflowStatus{
		Instance:    instance,
		CurrentStep: currentStep,
		Steps:       instance.Steps,
		CanApprove:  canApprove,
		CanReject:   canReject,
		CanDelegate: canDelegate,
	}, nil
}

// ---------------------------------------------------------------------------
// GetPendingTasks - Get pending approval tasks for current user
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) GetPendingTasks(ctx http.Context) ([]PendingTask, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	// Get user's roles
	fullUser, err := s.userRepo.FindByIDWithRoles(user.ID)
	if err != nil {
		return nil, err
	}

	var roleIDs []string
	if fullUser != nil {
		for _, role := range fullUser.Roles {
			roleIDs = append(roleIDs, role.ID)
		}
	}

	// Get pending tasks
	steps, err := s.instanceRepo.GetPendingTasksForUser(
		user.ID,
		nil, // positionID - would need to get from user
		user.DepartmentID,
		user.SectionID,
		roleIDs,
	)
	if err != nil {
		return nil, err
	}

	// Convert to PendingTask
	var tasks []PendingTask
	for _, step := range steps {
		task := PendingTask{
			StepInstance: &step,
			Deadline:     step.Deadline,
			IsDelegated:  false,
		}

		if step.Step != nil {
			task.StepName = step.Step.Name
		}

		if step.WorkflowInstance != nil && step.WorkflowInstance.Document != nil {
			task.Document = step.WorkflowInstance.Document
		}

		tasks = append(tasks, task)
	}

	return tasks, nil
}

// ---------------------------------------------------------------------------
// CanPerformAction - Check if user can perform action on document
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) CanPerformAction(documentID, action string, ctx http.Context) bool {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return false
	}

	stepInstance, err := s.instanceRepo.FindActiveStepForDocument(documentID)
	if err != nil || stepInstance == nil {
		return false
	}

	canPerform, _ := s.canUserActOnStep(user, stepInstance)
	return canPerform
}

// ---------------------------------------------------------------------------
// AddComment - Add a comment to current step
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) AddComment(documentID string, ctx http.Context) (*models.WorkflowAction, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	comment := ctx.Request().Input("comment")
	if comment == "" {
		return nil, errors.New("comment is required")
	}

	isPublic := ctx.Request().Input("is_public") != "false"

	// Find active step for document
	stepInstance, err := s.instanceRepo.FindActiveStepForDocument(documentID)
	if err != nil {
		return nil, err
	}
	if stepInstance == nil {
		return nil, errors.New("no active workflow step found")
	}

	// Check if step allows comments
	if stepInstance.Step != nil && !stepInstance.Step.CanComment {
		return nil, errors.New("comments are not allowed for this step")
	}

	// Create action record
	action := &models.WorkflowAction{
		WorkflowInstanceID: stepInstance.WorkflowInstanceID,
		StepInstanceID:     stepInstance.ID,
		ActorID:            user.ID,
		ActionType:         "comment",
		Comment:            &comment,
		IsPublic:           isPublic,
		CreatedAt:          time.Now(),
	}

	if err := s.instanceRepo.CreateAction(action); err != nil {
		return nil, err
	}

	return action, nil
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) canUserActOnStep(user *types.UserContext, stepInstance *models.WorkflowStepInstance) (bool, error) {
	if stepInstance == nil || stepInstance.Step == nil {
		return false, nil
	}

	// Super admin can act on any step
	if user.HasRole("super_admin") {
		return true, nil
	}

	step := stepInstance.Step

	// Check based on assignee type
	switch step.AssigneeType {
	case "user":
		if step.AssigneeUserID != nil && *step.AssigneeUserID == user.ID {
			return true, nil
		}
	case "position":
		// Would need to get user's position to check
		// For now, check via user repository
		fullUser, err := s.userRepo.FindByID(user.ID)
		if err != nil {
			return false, err
		}
		if fullUser != nil && fullUser.PositionID != nil && step.AssigneePositionID != nil {
			if *fullUser.PositionID == *step.AssigneePositionID {
				return true, nil
			}
		}
	case "department":
		if user.DepartmentID != nil && step.AssigneeDepartmentID != nil {
			if *user.DepartmentID == *step.AssigneeDepartmentID {
				return true, nil
			}
		}
	case "section":
		if user.SectionID != nil && step.AssigneeSectionID != nil {
			if *user.SectionID == *step.AssigneeSectionID {
				return true, nil
			}
		}
	case "role":
		if step.AssigneeRoleID != nil {
			// Get user's roles
			fullUser, err := s.userRepo.FindByIDWithRoles(user.ID)
			if err != nil {
				return false, err
			}
			if fullUser != nil {
				for _, role := range fullUser.Roles {
					if role.ID == *step.AssigneeRoleID {
						return true, nil
					}
				}
			}
		}
	}

	// Check for delegation
	delegation, _ := s.instanceRepo.FindActiveDelegation(stepInstance.ID, user.ID)
	if delegation != nil {
		return true, nil
	}

	return false, nil
}

// ---------------------------------------------------------------------------
// PreviewWorkflowForCreate - Preview workflow for document creation form
// ---------------------------------------------------------------------------

func (s *WorkflowActionService) PreviewWorkflowForCreate(companyID, documentTypeID, categoryID, officeID, departmentID string) (*WorkflowStatus, error) {
	var catPtr, offPtr, deptPtr *string
	if categoryID != "" {
		catPtr = &categoryID
	}
	if officeID != "" {
		offPtr = &officeID
	}
	if departmentID != "" {
		deptPtr = &departmentID
	}

	workflow, err := s.workflowRepo.FindForDocument(companyID, documentTypeID, catPtr, offPtr, deptPtr)
	if err != nil {
		return nil, err
	}

	if workflow == nil {
		return &WorkflowStatus{
			IsPreview: true,
		}, nil
	}

	wfWithSteps, err := s.workflowRepo.FindByIDWithSteps(workflow.ID)
	if err != nil {
		return nil, err
	}

	var previewSteps []models.WorkflowStep
	if wfWithSteps != nil && len(wfWithSteps.Steps) > 0 {
		previewSteps = wfWithSteps.Steps
		sort.Slice(previewSteps, func(i, j int) bool {
			return previewSteps[i].StepOrder < previewSteps[j].StepOrder
		})
	}

	return &WorkflowStatus{
		IsPreview:    true,
		PreviewSteps: previewSteps,
		WorkflowName: workflow.Name,
		WorkflowID:   workflow.ID,
	}, nil
}
