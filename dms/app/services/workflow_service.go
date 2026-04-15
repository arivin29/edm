package services

import (
	"errors"
	"time"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type WorkflowService struct {
	repo repositories.WorkflowRepository
}

func NewWorkflowService() *WorkflowService {
	return &WorkflowService{
		repo: repositories.NewWorkflowRepository(),
	}
}

// ---------------------------------------------------------------------------
// Workflow CRUD
// ---------------------------------------------------------------------------

func (s *WorkflowService) List(ctx http.Context) ([]models.Workflow, map[string]any, error) {
	filters := buildFilters(ctx, []string{
		"search", "company_id", "document_type_id", "category_id", "office_id", "department_id", "is_active",
		"sort_by", "sort_dir",
	})

	// Scope to user's company
	user := types.GetCurrentUser(ctx)
	if user != nil && user.CompanyID != "" {
		filters["company_id"] = user.CompanyID
	}

	items, total, err := s.repo.List(filters)
	if err != nil {
		return nil, nil, err
	}
	return items, paginationMeta(filters, total), nil
}

func (s *WorkflowService) Show(id string) (*models.Workflow, error) {
	return s.repo.FindByIDWithSteps(id)
}

func (s *WorkflowService) Create(ctx http.Context) (*models.Workflow, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	w := models.Workflow{
		CompanyID:      user.CompanyID,
		DocumentTypeID: ctx.Request().Input("document_type_id"),
		Name:           ctx.Request().Input("name"),
		IsActive:       true,
		CreatedBy:      user.ID,
	}

	if v := ctx.Request().Input("office_id"); v != "" {
		w.OfficeID = &v
	}
	if v := ctx.Request().Input("category_id"); v != "" {
		w.CategoryID = &v
	}
	if v := ctx.Request().Input("department_id"); v != "" {
		w.DepartmentID = &v
	}
	if v := ctx.Request().Input("description"); v != "" {
		w.Description = &v
	}
	if ctx.Request().Input("is_active") == "false" || ctx.Request().Input("is_active") == "0" {
		w.IsActive = false
	}

	if err := s.repo.Create(&w); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithSteps(w.ID)
}

func (s *WorkflowService) Update(id string, ctx http.Context) (*models.Workflow, error) {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return nil, errors.New("unauthorized")
	}

	w, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if w == nil {
		return nil, errors.New("workflow not found")
	}

	data := ctx.Request().All()

	if v, ok := data["name"].(string); ok && v != "" {
		w.Name = v
	}
	if v, ok := data["document_type_id"].(string); ok && v != "" {
		w.DocumentTypeID = v
	}
	if v, ok := data["office_id"].(string); ok {
		if v == "" {
			w.OfficeID = nil
		} else {
			w.OfficeID = &v
		}
	}
	if v, ok := data["category_id"].(string); ok {
		if v == "" {
			w.CategoryID = nil
		} else {
			w.CategoryID = &v
		}
	}
	if v, ok := data["department_id"].(string); ok {
		if v == "" {
			w.DepartmentID = nil
		} else {
			w.DepartmentID = &v
		}
	}
	if v, ok := data["description"].(string); ok {
		if v == "" {
			w.Description = nil
		} else {
			w.Description = &v
		}
	}
	if v, ok := data["is_active"].(bool); ok {
		w.IsActive = v
	}

	w.UpdatedAt = time.Now()

	if err := s.repo.Update(w); err != nil {
		return nil, err
	}

	return s.repo.FindByIDWithSteps(w.ID)
}

func (s *WorkflowService) Delete(id string) error {
	w, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	if w == nil {
		return errors.New("workflow not found")
	}
	return s.repo.Delete(id)
}

// FindForDocument finds the appropriate workflow for a document
func (s *WorkflowService) FindForDocument(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (*models.Workflow, error) {
	return s.repo.FindForDocument(companyID, documentTypeID, categoryID, officeID, departmentID)
}

// ---------------------------------------------------------------------------
// Workflow Steps
// ---------------------------------------------------------------------------

func (s *WorkflowService) ListSteps(workflowID string) ([]models.WorkflowStep, error) {
	w, err := s.repo.FindByID(workflowID)
	if err != nil {
		return nil, err
	}
	if w == nil {
		return nil, errors.New("workflow not found")
	}
	return s.repo.ListSteps(workflowID)
}

func (s *WorkflowService) CreateStep(workflowID string, ctx http.Context) (*models.WorkflowStep, error) {
	w, err := s.repo.FindByID(workflowID)
	if err != nil {
		return nil, err
	}
	if w == nil {
		return nil, errors.New("workflow not found")
	}

	// Get max step_order
	steps, err := s.repo.ListSteps(workflowID)
	if err != nil {
		return nil, err
	}
	maxOrder := 0
	for _, st := range steps {
		if st.StepOrder > maxOrder {
			maxOrder = st.StepOrder
		}
	}

	step := models.WorkflowStep{
		WorkflowID:             workflowID,
		StepOrder:              maxOrder + 1,
		Name:                   ctx.Request().Input("name"),
		StepType:               ctx.Request().Input("step_type"),
		AssigneeType:           ctx.Request().Input("assignee_type"),
		IsParallel:             false,
		RequiredApprovals:      1,
		OnRejectAction:         "to_creator",
		RejectCommentRequired:  true,
		ApproveCommentRequired: false,
		CanEdit:                false,
		CanComment:             true,
		CanDelegate:            false,
	}

	// Parse optional fields
	if v := ctx.Request().Input("assignee_user_id"); v != "" {
		step.AssigneeUserID = &v
	}
	if v := ctx.Request().Input("assignee_role_id"); v != "" {
		step.AssigneeRoleID = &v
	}
	if v := ctx.Request().Input("assignee_position_id"); v != "" {
		step.AssigneePositionID = &v
	}
	if v := ctx.Request().Input("assignee_department_id"); v != "" {
		step.AssigneeDepartmentID = &v
	}
	if v := ctx.Request().Input("assignee_section_id"); v != "" {
		step.AssigneeSectionID = &v
	}
	if v := ctx.Request().Input("reject_to_step_id"); v != "" {
		step.RejectToStepID = &v
	}
	if v := ctx.Request().Input("on_reject_action"); v != "" {
		step.OnRejectAction = v
	}
	if v := ctx.Request().Input("escalation_action"); v != "" {
		step.EscalationAction = &v
	}
	if v := ctx.Request().Input("instructions"); v != "" {
		step.Instructions = &v
	}

	step.IsParallel = ctx.Request().InputBool("is_parallel")
	step.RejectCommentRequired = ctx.Request().Input("reject_comment_required") != "false"
	step.ApproveCommentRequired = ctx.Request().InputBool("approve_comment_required")
	step.CanEdit = ctx.Request().InputBool("can_edit")
	step.CanComment = ctx.Request().Input("can_comment") != "false"
	step.CanDelegate = ctx.Request().InputBool("can_delegate")

	if v := ctx.Request().InputInt("step_order"); v > 0 {
		step.StepOrder = v
	}
	if v := ctx.Request().InputInt("required_approvals"); v > 0 {
		step.RequiredApprovals = v
	}
	if v := ctx.Request().InputInt("deadline_days"); v > 0 {
		step.DeadlineDays = &v
	}
	if v := ctx.Request().InputInt("escalation_after_days"); v > 0 {
		step.EscalationAfterDays = &v
	}

	if err := s.repo.CreateStep(&step); err != nil {
		return nil, err
	}

	return &step, nil
}

func (s *WorkflowService) UpdateStep(workflowID, stepID string, ctx http.Context) (*models.WorkflowStep, error) {
	step, err := s.repo.FindStepByID(stepID)
	if err != nil {
		return nil, err
	}
	if step == nil {
		return nil, errors.New("step not found")
	}
	if step.WorkflowID != workflowID {
		return nil, errors.New("step does not belong to this workflow")
	}

	data := ctx.Request().All()

	if v, ok := data["name"].(string); ok && v != "" {
		step.Name = v
	}
	if v, ok := data["step_type"].(string); ok && v != "" {
		step.StepType = v
	}
	if v, ok := data["assignee_type"].(string); ok && v != "" {
		step.AssigneeType = v
	}
	if v, ok := data["assignee_user_id"].(string); ok {
		if v == "" {
			step.AssigneeUserID = nil
		} else {
			step.AssigneeUserID = &v
		}
	}
	if v, ok := data["assignee_role_id"].(string); ok {
		if v == "" {
			step.AssigneeRoleID = nil
		} else {
			step.AssigneeRoleID = &v
		}
	}
	if v, ok := data["assignee_position_id"].(string); ok {
		if v == "" {
			step.AssigneePositionID = nil
		} else {
			step.AssigneePositionID = &v
		}
	}
	if v, ok := data["assignee_department_id"].(string); ok {
		if v == "" {
			step.AssigneeDepartmentID = nil
		} else {
			step.AssigneeDepartmentID = &v
		}
	}
	if v, ok := data["assignee_section_id"].(string); ok {
		if v == "" {
			step.AssigneeSectionID = nil
		} else {
			step.AssigneeSectionID = &v
		}
	}
	if v, ok := data["on_reject_action"].(string); ok && v != "" {
		step.OnRejectAction = v
	}
	if v, ok := data["reject_to_step_id"].(string); ok {
		if v == "" {
			step.RejectToStepID = nil
		} else {
			step.RejectToStepID = &v
		}
	}
	if v, ok := data["escalation_action"].(string); ok {
		if v == "" {
			step.EscalationAction = nil
		} else {
			step.EscalationAction = &v
		}
	}
	if v, ok := data["instructions"].(string); ok {
		if v == "" {
			step.Instructions = nil
		} else {
			step.Instructions = &v
		}
	}
	if v, ok := data["is_parallel"].(bool); ok {
		step.IsParallel = v
	}
	if v, ok := data["reject_comment_required"].(bool); ok {
		step.RejectCommentRequired = v
	}
	if v, ok := data["approve_comment_required"].(bool); ok {
		step.ApproveCommentRequired = v
	}
	if v, ok := data["can_edit"].(bool); ok {
		step.CanEdit = v
	}
	if v, ok := data["can_comment"].(bool); ok {
		step.CanComment = v
	}
	if v, ok := data["can_delegate"].(bool); ok {
		step.CanDelegate = v
	}
	if v, ok := data["step_order"].(float64); ok && v > 0 {
		step.StepOrder = int(v)
	}
	if v, ok := data["required_approvals"].(float64); ok && v > 0 {
		step.RequiredApprovals = int(v)
	}
	if v, ok := data["deadline_days"].(float64); ok {
		if v > 0 {
			i := int(v)
			step.DeadlineDays = &i
		} else {
			step.DeadlineDays = nil
		}
	}
	if v, ok := data["escalation_after_days"].(float64); ok {
		if v > 0 {
			i := int(v)
			step.EscalationAfterDays = &i
		} else {
			step.EscalationAfterDays = nil
		}
	}

	step.UpdatedAt = time.Now()

	if err := s.repo.UpdateStep(step); err != nil {
		return nil, err
	}

	return step, nil
}

func (s *WorkflowService) DeleteStep(workflowID, stepID string) error {
	step, err := s.repo.FindStepByID(stepID)
	if err != nil {
		return err
	}
	if step == nil {
		return errors.New("step not found")
	}
	if step.WorkflowID != workflowID {
		return errors.New("step does not belong to this workflow")
	}
	return s.repo.DeleteStep(stepID)
}

func (s *WorkflowService) ReorderSteps(workflowID string, stepIDs []string) error {
	w, err := s.repo.FindByID(workflowID)
	if err != nil {
		return err
	}
	if w == nil {
		return errors.New("workflow not found")
	}
	return s.repo.ReorderSteps(workflowID, stepIDs)
}
