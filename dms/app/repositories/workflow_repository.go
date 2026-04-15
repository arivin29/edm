package repositories

import (
	"fmt"
	"sort"
	"time"

	"dms/app/facades"
	"dms/app/models"
)

type WorkflowRepository interface {
	// Workflow CRUD
	List(filters map[string]any) ([]models.Workflow, int64, error)
	FindByID(id string) (*models.Workflow, error)
	FindByIDWithSteps(id string) (*models.Workflow, error)
	FindForDocument(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (*models.Workflow, error)
	Create(w *models.Workflow) error
	Update(w *models.Workflow) error
	Delete(id string) error

	// Step operations
	ListSteps(workflowID string) ([]models.WorkflowStep, error)
	FindStepByID(id string) (*models.WorkflowStep, error)
	CreateStep(step *models.WorkflowStep) error
	UpdateStep(step *models.WorkflowStep) error
	DeleteStep(id string) error
	ReorderSteps(workflowID string, stepIDs []string) error
}

type workflowRepository struct{}

func NewWorkflowRepository() WorkflowRepository {
	return &workflowRepository{}
}

// ---------------------------------------------------------------------------
// Workflow CRUD
// ---------------------------------------------------------------------------

func (r *workflowRepository) List(filters map[string]any) ([]models.Workflow, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query().WhereNull("deleted_at")

	if v, ok := filters["company_id"].(string); ok && v != "" {
		q = q.Where("company_id = ?", v)
	}
	if v, ok := filters["document_type_id"].(string); ok && v != "" {
		q = q.Where("document_type_id = ?", v)
	}
	if v, ok := filters["category_id"].(string); ok && v != "" {
		q = q.Where("category_id = ?", v)
	}
	if v, ok := filters["office_id"].(string); ok && v != "" {
		q = q.Where("office_id = ?", v)
	}
	if v, ok := filters["department_id"].(string); ok && v != "" {
		q = q.Where("department_id = ?", v)
	}
	if v, ok := filters["is_active"].(string); ok && v != "" {
		q = q.Where("is_active = ?", v == "true" || v == "1")
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ?", like)
	}

	count, err := q.Model(&models.Workflow{}).Count()
	if err != nil {
		return nil, 0, err
	}

	sortBy := "created_at"
	sortDir := "desc"
	if v, ok := filters["sort_by"].(string); ok && v != "" {
		allowed := map[string]bool{"name": true, "created_at": true, "updated_at": true}
		if allowed[v] {
			sortBy = v
		}
	}
	if v, ok := filters["sort_dir"].(string); ok && v == "asc" {
		sortDir = "asc"
	}

	var items []models.Workflow
	if err := q.
		With("DocumentType").
		With("Category").
		With("Office").
		With("Department").
		Order(fmt.Sprintf("%s %s", sortBy, sortDir)).
		Offset(offset).
		Limit(perPage).
		Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *workflowRepository) FindByID(id string) (*models.Workflow, error) {
	var w models.Workflow
	if err := facades.Orm().Query().
		WhereNull("deleted_at").
		Where("id = ?", id).
		First(&w); err != nil {
		return nil, err
	}
	if w.ID == "" {
		return nil, nil
	}
	return &w, nil
}

func (r *workflowRepository) FindByIDWithSteps(id string) (*models.Workflow, error) {
	var w models.Workflow
	if err := facades.Orm().Query().
		With("DocumentType").
		With("Category").
		With("Office").
		With("Department").
		With("Steps").
		WhereNull("deleted_at").
		Where("id = ?", id).
		First(&w); err != nil {
		return nil, err
	}
	if w.ID == "" {
		return nil, nil
	}
	// Sort steps by step_order
	sort.Slice(w.Steps, func(i, j int) bool {
		return w.Steps[i].StepOrder < w.Steps[j].StepOrder
	})
	return &w, nil
}

func (r *workflowRepository) FindForDocument(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (*models.Workflow, error) {
	// Fallback strategy: most specific to least specific
	type attempt struct {
		catID  *string
		offID  *string
		deptID *string
	}

	attempts := []attempt{
		{categoryID, officeID, departmentID},      // 1. company + doc_type + category + office + dept
		{categoryID, officeID, nil},               // 2. company + doc_type + category + office (dept=NULL)
		{categoryID, nil, nil},                    // 3. company + doc_type + category (office=NULL, dept=NULL)
		{nil, nil, nil},                           // 4. company + doc_type (category=NULL, office=NULL, dept=NULL)
	}

	for _, a := range attempts {
		var w models.Workflow
		q := facades.Orm().Query().
			WhereNull("deleted_at").
			Where("company_id = ?", companyID).
			Where("document_type_id = ?", documentTypeID).
			Where("is_active = ?", true)

		if a.catID != nil && *a.catID != "" {
			q = q.Where("category_id = ?", *a.catID)
		} else {
			q = q.WhereNull("category_id")
		}
		if a.offID != nil && *a.offID != "" {
			q = q.Where("office_id = ?", *a.offID)
		} else {
			q = q.WhereNull("office_id")
		}
		if a.deptID != nil && *a.deptID != "" {
			q = q.Where("department_id = ?", *a.deptID)
		} else {
			q = q.WhereNull("department_id")
		}

		if err := q.First(&w); err == nil && w.ID != "" {
			return &w, nil
		}
	}

	return nil, nil
}

func (r *workflowRepository) Create(w *models.Workflow) error {
	return facades.Orm().Query().Create(w)
}

func (r *workflowRepository) Update(w *models.Workflow) error {
	return facades.Orm().Query().Save(w)
}

func (r *workflowRepository) Delete(id string) error {
	now := time.Now()
	_, err := facades.Orm().Query().Model(&models.Workflow{}).
		Where("id = ?", id).
		Update("deleted_at", now)
	return err
}

// ---------------------------------------------------------------------------
// Workflow Steps
// ---------------------------------------------------------------------------

func (r *workflowRepository) ListSteps(workflowID string) ([]models.WorkflowStep, error) {
	var steps []models.WorkflowStep
	if err := facades.Orm().Query().
		Where("workflow_id = ?", workflowID).
		Order("step_order asc").
		Get(&steps); err != nil {
		return nil, err
	}
	return steps, nil
}

func (r *workflowRepository) FindStepByID(id string) (*models.WorkflowStep, error) {
	var step models.WorkflowStep
	if err := facades.Orm().Query().Where("id = ?", id).First(&step); err != nil {
		return nil, err
	}
	if step.ID == "" {
		return nil, nil
	}
	return &step, nil
}

func (r *workflowRepository) CreateStep(step *models.WorkflowStep) error {
	return facades.Orm().Query().Create(step)
}

func (r *workflowRepository) UpdateStep(step *models.WorkflowStep) error {
	return facades.Orm().Query().Save(step)
}

func (r *workflowRepository) DeleteStep(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.WorkflowStep{})
	return err
}

func (r *workflowRepository) ReorderSteps(workflowID string, stepIDs []string) error {
	for order, stepID := range stepIDs {
		if _, err := facades.Orm().Query().Model(&models.WorkflowStep{}).
			Where("id = ? AND workflow_id = ?", stepID, workflowID).
			Update("step_order", order+1); err != nil {
			return err
		}
	}
	return nil
}
