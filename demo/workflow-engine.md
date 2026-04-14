# DMS Workflow Engine v2 — Technical Design (Go)

---

## 1. Overview

Workflow Engine mengelola lifecycle dokumen dari draft hingga final.
Engine bersifat **dynamic** — admin bisa konfigurasi flow berbeda per:
- Company + Office + Document Type + Category + Department

### Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| HTTP Framework | **Gin** |
| ORM | **GORM** |
| Auth | **golang-jwt** |
| Background Jobs | **asynq** (Redis) |
| Scheduler | **gocron** |
| WebSocket | **gorilla/websocket** |
| DOCX Processing | **UniOffice** |
| PDF Conversion | OnlyOffice Conversion API / LibreOffice CLI |
| Email | **gomail** |
| Validation | **go-playground/validator** |
| Migration | **golang-migrate** |

---

## 2. Workflow State Machine

### Document States

```
                submit()              all steps approved       finalize()
   DRAFT ──────────────→ IN_REVIEW ──────────────────→ APPROVED ──────────→ FINAL
     ↑                       │                             │
     │                       │ reject(to_creator)          │ new revision
     │                       ▼                             ▼
     ├──────────────── REVISION ◄──────────────────────────┘
     │                       ↑
     │                       │ reject(to_step/to_previous)
     │                       │ (workflow stays active, step returned)
     │
     │  obsolete()                      archive()
     └──────────→ OBSOLETE          FINAL ──────→ ARCHIVED

   reject(cancel)
   IN_REVIEW ──────→ DRAFT (workflow cancelled)
```

### Step Instance States

```
PENDING ──→ ACTIVE ──→ APPROVED  ──→ (next step)
                   ├──→ REJECTED  ──→ (depends on on_reject_action)
                   ├──→ SKIPPED   ──→ (admin skip)
                   └──→ RETURNED  ──→ (step re-activated after reject from later step)
```

---

## 3. Engine Components

### 3.1 Package Structure

```
internal/
├── workflow/
│   ├── service.go              # Main orchestrator (public API)
│   ├── engine.go               # State machine logic
│   ├── step_resolver.go        # Resolve assignees per step
│   ├── reject_handler.go       # Handle reject routing
│   ├── delegation.go           # Handle delegation
│   ├── deadline.go             # Calculate & track deadlines + escalation
│   ├── result.go               # Value object for action results
│   └── errors.go               # Custom workflow errors
```

### 3.2 Core Interface

```go
package workflow

import (
    "context"
    "github.com/google/uuid"
)

// WorkflowService is the public API for the workflow engine
type WorkflowService struct {
    engine       *WorkflowEngine
    db           *gorm.DB
    notifier     NotificationDispatcher
    auditLogger  AuditLogger
}

func NewWorkflowService(db *gorm.DB, notifier NotificationDispatcher, auditLogger AuditLogger) *WorkflowService {
    return &WorkflowService{
        engine: NewWorkflowEngine(db, notifier),
        db:     db,
        notifier:    notifier,
        auditLogger: auditLogger,
    }
}

func (s *WorkflowService) Submit(ctx context.Context, doc *Document, user *User, comment string) (*WorkflowInstance, error) {
    return s.engine.Start(ctx, doc, user, comment)
}

func (s *WorkflowService) ProcessAction(ctx context.Context, doc *Document, user *User, action string, comment string, opts ActionOptions) (*ActionResult, error) {
    return s.engine.ProcessAction(ctx, doc, user, action, comment, opts)
}

func (s *WorkflowService) Resubmit(ctx context.Context, doc *Document, user *User, comment string) (*WorkflowInstance, error) {
    return s.engine.Resubmit(ctx, doc, user, comment)
}

func (s *WorkflowService) Finalize(ctx context.Context, doc *Document, user *User) (*Document, error) {
    // handled by document service
    return nil, nil
}

func (s *WorkflowService) GetPendingTasks(ctx context.Context, userID uuid.UUID, officeID *uuid.UUID) ([]PendingTask, error) {
    // query logic
    return nil, nil
}

func (s *WorkflowService) CanPerformAction(ctx context.Context, doc *Document, user *User, action string) bool {
    // permission check logic
    return false
}

// ActionOptions holds optional parameters for workflow actions
type ActionOptions struct {
    UseSignature     bool      `json:"use_signature"`
    DelegatedTo      *uuid.UUID `json:"delegated_to,omitempty"`
    DelegationReason string    `json:"delegation_reason,omitempty"`
    IsCommentPublic  bool      `json:"is_comment_public"`
}

// ActionResult represents the outcome of a workflow action
type ActionResult struct {
    Action   string `json:"action"`
    Outcome  string `json:"outcome"`
    Message  string `json:"message"`
    NextStep string `json:"next_step,omitempty"`
}
```

### 3.3 Workflow Engine Logic

```go
package workflow

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type WorkflowEngine struct {
    db           *gorm.DB
    stepResolver *StepResolver
    rejectHandler *RejectHandler
    delegation   *DelegationService
    deadline     *DeadlineService
    notifier     NotificationDispatcher
}

func NewWorkflowEngine(db *gorm.DB, notifier NotificationDispatcher) *WorkflowEngine {
    return &WorkflowEngine{
        db:            db,
        stepResolver:  NewStepResolver(db),
        rejectHandler: NewRejectHandler(db, notifier),
        delegation:    NewDelegationService(db, notifier),
        deadline:      NewDeadlineService(db),
        notifier:      notifier,
    }
}

// Start initiates a workflow for a document
func (e *WorkflowEngine) Start(ctx context.Context, doc *Document, user *User, comment string) (*WorkflowInstance, error) {
    // 1. Find matching workflow definition (most specific match)
    wf, err := e.findWorkflow(doc.CompanyID, doc.OfficeID, doc.DocumentTypeID, doc.CategoryID, doc.DepartmentID)
    if err != nil {
        return nil, fmt.Errorf("no workflow configured for this document: %w", err)
    }

    var instance *WorkflowInstance

    // Use transaction to ensure consistency
    err = e.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // 2. Create workflow instance
        iteration := e.getNextIteration(tx, doc.ID)
        instance = &WorkflowInstance{
            ID:          uuid.New(),
            DocumentID:  doc.ID,
            WorkflowID:  wf.ID,
            Status:      "active",
            Iteration:   iteration,
            StartedAt:   timePtr(time.Now()),
        }
        if err := tx.Create(instance).Error; err != nil {
            return err
        }

        // 3. Get workflow steps ordered
        var steps []WorkflowStep
        if err := tx.Where("workflow_id = ?", wf.ID).Order("step_order ASC").Find(&steps).Error; err != nil {
            return err
        }

        // 4. Create step instances for all steps
        for _, step := range steps {
            requiredApprovals := 1
            if step.IsParallel {
                requiredApprovals = step.RequiredApprovals
                if requiredApprovals == 0 {
                    requiredApprovals = 999 // 0 = all must approve
                }
            }

            stepInstance := &WorkflowStepInstance{
                ID:                 uuid.New(),
                WorkflowInstanceID: instance.ID,
                WorkflowStepID:     step.ID,
                StepOrder:          step.StepOrder,
                Status:             "pending",
                RequiredApprovals:  requiredApprovals,
            }
            if err := tx.Create(stepInstance).Error; err != nil {
                return err
            }
        }

        // 5. Activate first step
        if len(steps) > 0 {
            if err := e.activateStep(ctx, tx, instance, &steps[0], doc); err != nil {
                return err
            }
        }

        // 6. Update document status
        now := time.Now()
        updates := map[string]interface{}{
            "status":       "in_review",
            "submitted_by": user.ID,
        }
        if doc.SubmittedAt == nil {
            updates["submitted_at"] = now
        }
        return tx.Model(doc).Updates(updates).Error
    })

    if err != nil {
        return nil, err
    }

    return instance, nil
}

// ProcessAction handles approve/reject/revise/delegate on current step
func (e *WorkflowEngine) ProcessAction(
    ctx context.Context,
    doc *Document,
    user *User,
    action string,
    comment string,
    opts ActionOptions,
) (*ActionResult, error) {
    // Get active workflow instance
    var instance WorkflowInstance
    if err := e.db.Where("document_id = ? AND status = ?", doc.ID, "active").
        First(&instance).Error; err != nil {
        return nil, fmt.Errorf("no active workflow for document: %w", err)
    }

    // Get active step instance
    var stepInstance WorkflowStepInstance
    if err := e.db.Where("workflow_instance_id = ? AND status = ?", instance.ID, "active").
        First(&stepInstance).Error; err != nil {
        return nil, fmt.Errorf("no active step found: %w", err)
    }

    // Load workflow step definition
    var step WorkflowStep
    if err := e.db.First(&step, stepInstance.WorkflowStepID).Error; err != nil {
        return nil, err
    }

    // 1. Validate user is assignee
    if err := e.validateAssignee(&stepInstance, user); err != nil {
        return nil, err
    }

    // 2. Validate comment requirements
    if err := e.validateComment(&step, action, comment); err != nil {
        return nil, err
    }

    var result *ActionResult

    err := e.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        // 3. Record the action
        wfAction := &WorkflowAction{
            ID:                     uuid.New(),
            WorkflowInstanceID:     instance.ID,
            WorkflowStepInstanceID: stepInstance.ID,
            UserID:                 user.ID,
            Action:                 action,
            Comment:                stringPtr(comment),
            IsCommentPublic:        opts.IsCommentPublic,
            SignatureUsed:          opts.UseSignature,
            DelegatedTo:            opts.DelegatedTo,
            DelegationReason:       stringPtr(opts.DelegationReason),
            IPAddress:              getIPFromCtx(ctx),
            UserAgent:              getUserAgentFromCtx(ctx),
        }
        if opts.UseSignature && user.SignaturePath != "" {
            wfAction.SignaturePath = stringPtr(user.SignaturePath)
        }
        if err := tx.Create(wfAction).Error; err != nil {
            return err
        }

        // 4. Process based on action type
        var err error
        switch action {
        case "approve":
            result, err = e.handleApprove(ctx, tx, &instance, &stepInstance, &step, doc)
        case "reject":
            result, err = e.handleReject(ctx, tx, &instance, &stepInstance, &step, comment)
        case "revise":
            result, err = e.handleRevise(ctx, tx, &instance, &stepInstance, comment)
        case "delegate":
            result, err = e.handleDelegate(ctx, tx, &instance, &stepInstance, user, opts)
        default:
            return fmt.Errorf("invalid action: %s", action)
        }
        return err
    })

    if err != nil {
        return nil, err
    }

    return result, nil
}

// validateComment checks comment is provided when required by step config
func (e *WorkflowEngine) validateComment(step *WorkflowStep, action string, comment string) error {
    switch {
    case action == "reject" && step.RejectCommentRequired && comment == "":
        return ErrCommentRequired("comment is required when rejecting")
    case action == "approve" && step.ApproveCommentRequired && comment == "":
        return ErrCommentRequired("comment is required when approving")
    case action == "revise" && comment == "":
        return ErrCommentRequired("comment is required when requesting revision")
    }
    return nil
}

// handleApprove processes approval action
func (e *WorkflowEngine) handleApprove(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    stepInst *WorkflowStepInstance,
    step *WorkflowStep,
    doc *Document,
) (*ActionResult, error) {
    // Update approval count
    stepInst.ApprovalCount++
    if err := tx.Model(stepInst).Update("approval_count", stepInst.ApprovalCount).Error; err != nil {
        return nil, err
    }

    // Check parallel approval
    if step.IsParallel {
        requiredApprovals := step.RequiredApprovals
        if requiredApprovals == 0 {
            // 0 = all assignees must approve
            total, err := e.getTotalAssignees(tx, step, doc)
            if err != nil {
                return nil, err
            }
            requiredApprovals = total
        }

        if stepInst.ApprovalCount < requiredApprovals {
            return &ActionResult{
                Action:  "approved",
                Outcome: "waiting_more_approvals",
                Message: fmt.Sprintf("Approved %d/%d", stepInst.ApprovalCount, requiredApprovals),
            }, nil
        }
    }

    // Mark step as approved
    now := time.Now()
    if err := tx.Model(stepInst).Updates(map[string]interface{}{
        "status":       "approved",
        "completed_at": now,
    }).Error; err != nil {
        return nil, err
    }

    // Advance to next step
    return e.advanceToNextStep(ctx, tx, instance, doc)
}

// advanceToNextStep finds and activates the next pending step
func (e *WorkflowEngine) advanceToNextStep(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    doc *Document,
) (*ActionResult, error) {
    // Find next pending step instance
    var nextStepInst WorkflowStepInstance
    err := tx.Where("workflow_instance_id = ? AND status = ?", instance.ID, "pending").
        Order("step_order ASC").
        First(&nextStepInst).Error

    if err == nil {
        // Load step definition
        var nextStep WorkflowStep
        if err := tx.First(&nextStep, nextStepInst.WorkflowStepID).Error; err != nil {
            return nil, err
        }

        if err := e.activateStep(ctx, tx, instance, &nextStep, doc); err != nil {
            return nil, err
        }

        return &ActionResult{
            Action:   "approved",
            Outcome:  "next_step_activated",
            NextStep: nextStep.Name,
        }, nil
    }

    // All steps completed
    now := time.Now()
    if err := tx.Model(instance).Updates(map[string]interface{}{
        "status":       "completed",
        "completed_at": now,
    }).Error; err != nil {
        return nil, err
    }

    if err := tx.Model(doc).Updates(map[string]interface{}{
        "status":      "approved",
        "approved_at": now,
    }).Error; err != nil {
        return nil, err
    }

    go e.notifier.NotifyDocumentApproved(ctx, doc)

    return &ActionResult{
        Action:  "approved",
        Outcome: "workflow_completed",
    }, nil
}

// handleReject routes rejection based on step config
func (e *WorkflowEngine) handleReject(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    stepInst *WorkflowStepInstance,
    step *WorkflowStep,
    comment string,
) (*ActionResult, error) {
    // Mark current step as rejected
    now := time.Now()
    if err := tx.Model(stepInst).Updates(map[string]interface{}{
        "status":           "rejected",
        "completed_at":     now,
        "rejection_count":  gorm.Expr("rejection_count + 1"),
    }).Error; err != nil {
        return nil, err
    }

    // Route reject based on on_reject_action
    return e.rejectHandler.Handle(ctx, tx, instance, stepInst, step, comment)
}

// handleDelegate transfers task to another user
func (e *WorkflowEngine) handleDelegate(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    stepInst *WorkflowStepInstance,
    fromUser *User,
    opts ActionOptions,
) (*ActionResult, error) {
    if opts.DelegatedTo == nil {
        return nil, fmt.Errorf("delegated_to is required")
    }

    var delegatedTo User
    if err := tx.Preload("Position").First(&delegatedTo, opts.DelegatedTo).Error; err != nil {
        return nil, fmt.Errorf("delegated user not found: %w", err)
    }

    // Update assigned_users JSONB — remove original, add delegate
    assignedUsers := stepInst.AssignedUsers
    filtered := make([]AssignedUser, 0)
    for _, u := range assignedUsers {
        if u.UserID != fromUser.ID {
            filtered = append(filtered, u)
        }
    }

    positionName := ""
    if delegatedTo.Position != nil {
        positionName = delegatedTo.Position.Name
    }

    filtered = append(filtered, AssignedUser{
        UserID:        delegatedTo.ID,
        Name:          delegatedTo.Name,
        Email:         delegatedTo.Email,
        Position:      positionName,
        DelegatedFrom: fromUser.Name,
    })

    if err := tx.Model(stepInst).Update("assigned_users", filtered).Error; err != nil {
        return nil, err
    }

    go e.notifier.NotifyDelegation(ctx, instance, stepInst, fromUser, &delegatedTo)

    return &ActionResult{
        Action:  "delegated",
        Outcome: "task_delegated",
        Message: fmt.Sprintf("Delegated to %s", delegatedTo.Name),
    }, nil
}

// activateStep resolves assignees, sets deadline, notifies
func (e *WorkflowEngine) activateStep(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    step *WorkflowStep,
    doc *Document,
) error {
    // Get step instance
    var stepInst WorkflowStepInstance
    if err := tx.Where("workflow_instance_id = ? AND workflow_step_id = ?", instance.ID, step.ID).
        First(&stepInst).Error; err != nil {
        return err
    }

    // Resolve assignees
    assignees, err := e.stepResolver.ResolveAssignees(ctx, tx, step, doc)
    if err != nil {
        return err
    }

    // Build assigned_users JSONB
    assignedUsers := make([]AssignedUser, len(assignees))
    for i, u := range assignees {
        posName := ""
        if u.Position != nil {
            posName = u.Position.Name
        }
        assignedUsers[i] = AssignedUser{
            UserID:   u.ID,
            Name:     u.Name,
            Email:    u.Email,
            Position: posName,
        }
    }

    // Calculate deadline
    var deadlineAt *time.Time
    if step.DeadlineDays > 0 {
        dl := e.deadline.CalculateDeadline(step.DeadlineDays)
        deadlineAt = &dl
    }

    now := time.Now()
    if err := tx.Model(&stepInst).Updates(map[string]interface{}{
        "status":         "active",
        "started_at":     now,
        "deadline_at":    deadlineAt,
        "assigned_users": assignedUsers,
    }).Error; err != nil {
        return err
    }

    // Update current step in instance
    if err := tx.Model(instance).Update("current_step_id", step.ID).Error; err != nil {
        return err
    }

    // Notify assignees
    go e.notifier.NotifyAssignees(ctx, assignees, instance, step)

    return nil
}

// findWorkflow finds the most specific workflow match
func (e *WorkflowEngine) findWorkflow(
    companyID, officeID, typeID, categoryID, departmentID uuid.UUID,
) (*Workflow, error) {
    var wf Workflow
    err := e.db.Where("company_id = ? AND document_type_id = ? AND is_active = ?", companyID, typeID, true).
        Where("(office_id = ? OR office_id IS NULL)", officeID).
        Where("(category_id = ? OR category_id IS NULL)", categoryID).
        Where("(department_id = ? OR department_id IS NULL)", departmentID).
        Order(`
            CASE
                WHEN office_id IS NOT NULL AND category_id IS NOT NULL AND department_id IS NOT NULL THEN 1
                WHEN office_id IS NOT NULL AND department_id IS NOT NULL THEN 2
                WHEN office_id IS NOT NULL AND category_id IS NOT NULL THEN 3
                WHEN department_id IS NOT NULL THEN 4
                WHEN category_id IS NOT NULL THEN 5
                WHEN office_id IS NOT NULL THEN 6
                ELSE 7
            END
        `).
        First(&wf).Error

    if err != nil {
        return nil, err
    }
    return &wf, nil
}

// getNextIteration returns the next iteration number for a document
func (e *WorkflowEngine) getNextIteration(tx *gorm.DB, docID uuid.UUID) int {
    var count int64
    tx.Model(&WorkflowInstance{}).Where("document_id = ?", docID).Count(&count)
    return int(count) + 1
}

// Resubmit creates a new workflow after revision
func (e *WorkflowEngine) Resubmit(ctx context.Context, doc *Document, user *User, comment string) (*WorkflowInstance, error) {
    if doc.Status != "revision" {
        return nil, fmt.Errorf("document is not in revision status")
    }

    // Clear revision info and increment version
    if err := e.db.Model(doc).Updates(map[string]interface{}{
        "minor_version":         gorm.Expr("minor_version + 1"),
        "revision_notes":        nil,
        "revision_from_step_id": nil,
    }).Error; err != nil {
        return nil, err
    }

    // Start a NEW workflow instance (iteration incremented, old stays for history)
    return e.Start(ctx, doc, user, comment)
}
```

### 3.4 Reject Handler

```go
package workflow

import (
    "context"
    "fmt"
    "time"

    "gorm.io/gorm"
)

type RejectHandler struct {
    db       *gorm.DB
    notifier NotificationDispatcher
}

func NewRejectHandler(db *gorm.DB, notifier NotificationDispatcher) *RejectHandler {
    return &RejectHandler{db: db, notifier: notifier}
}

// Handle routes reject based on step config
func (h *RejectHandler) Handle(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    currentStep *WorkflowStepInstance,
    stepDef *WorkflowStep,
    comment string,
) (*ActionResult, error) {
    switch stepDef.OnRejectAction {
    case "to_creator":
        return h.rejectToCreator(ctx, tx, instance, comment)
    case "to_step":
        return h.rejectToStep(ctx, tx, instance, stepDef, comment)
    case "to_previous":
        return h.rejectToPrevious(ctx, tx, instance, currentStep, comment)
    case "cancel":
        return h.cancelWorkflow(ctx, tx, instance, comment)
    default:
        return h.rejectToCreator(ctx, tx, instance, comment)
    }
}

// rejectToCreator returns document to creator for revision
func (h *RejectHandler) rejectToCreator(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    comment string,
) (*ActionResult, error) {
    if err := tx.Model(instance).Update("status", "revision").Error; err != nil {
        return nil, err
    }

    var doc Document
    if err := tx.First(&doc, instance.DocumentID).Error; err != nil {
        return nil, err
    }

    if err := tx.Model(&doc).Updates(map[string]interface{}{
        "status":                "revision",
        "revision_notes":        comment,
        "revision_from_step_id": instance.CurrentStepID,
        "revision_count":        gorm.Expr("revision_count + 1"),
    }).Error; err != nil {
        return nil, err
    }

    go h.notifier.NotifyCreatorRejected(ctx, &doc, comment)

    return &ActionResult{
        Action:  "rejected",
        Outcome: "returned_to_creator",
        Message: "Document returned to creator for revision",
    }, nil
}

// rejectToStep returns document to a specific step
func (h *RejectHandler) rejectToStep(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    stepDef *WorkflowStep,
    comment string,
) (*ActionResult, error) {
    if stepDef.RejectToStepID == nil {
        return h.rejectToCreator(ctx, tx, instance, comment)
    }

    var targetStep WorkflowStep
    if err := tx.First(&targetStep, stepDef.RejectToStepID).Error; err != nil {
        return nil, fmt.Errorf("reject target step not found: %w", err)
    }

    // Reset all steps from target onward
    if err := tx.Model(&WorkflowStepInstance{}).
        Where("workflow_instance_id = ?", instance.ID).
        Where("step_order >= ?", targetStep.StepOrder).
        Where("status != ?", "pending").
        Updates(map[string]interface{}{
            "status":           "pending",
            "approval_count":   0,
            "rejection_count":  0,
            "started_at":       nil,
            "completed_at":     nil,
            "deadline_at":      nil,
            "escalated":        false,
        }).Error; err != nil {
        return nil, err
    }

    // Mark target step as returned
    if err := tx.Model(&WorkflowStepInstance{}).
        Where("workflow_instance_id = ? AND workflow_step_id = ?", instance.ID, targetStep.ID).
        Update("status", "returned").Error; err != nil {
        return nil, err
    }

    // Update document revision info
    var doc Document
    if err := tx.First(&doc, instance.DocumentID).Error; err != nil {
        return nil, err
    }

    if err := tx.Model(&doc).Updates(map[string]interface{}{
        "revision_notes":        comment,
        "revision_from_step_id": instance.CurrentStepID,
        "revision_count":        gorm.Expr("revision_count + 1"),
    }).Error; err != nil {
        return nil, err
    }

    return &ActionResult{
        Action:  "rejected",
        Outcome: "returned_to_step",
        Message: fmt.Sprintf("Document returned to step: %s", targetStep.Name),
    }, nil
}

// rejectToPrevious returns document to the previous step
func (h *RejectHandler) rejectToPrevious(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    currentStep *WorkflowStepInstance,
    comment string,
) (*ActionResult, error) {
    // Find previous step
    var prevStepInst WorkflowStepInstance
    err := tx.Where("workflow_instance_id = ? AND step_order < ?", instance.ID, currentStep.StepOrder).
        Order("step_order DESC").
        First(&prevStepInst).Error

    if err != nil {
        // No previous step — fallback to creator
        return h.rejectToCreator(ctx, tx, instance, comment)
    }

    var prevStep WorkflowStep
    if err := tx.First(&prevStep, prevStepInst.WorkflowStepID).Error; err != nil {
        return nil, err
    }

    // Reset current step
    if err := tx.Model(currentStep).Updates(map[string]interface{}{
        "status":          "pending",
        "approval_count":  0,
        "rejection_count": 0,
        "started_at":      nil,
        "completed_at":    nil,
    }).Error; err != nil {
        return nil, err
    }

    // Mark previous step as returned
    if err := tx.Model(&prevStepInst).Update("status", "returned").Error; err != nil {
        return nil, err
    }

    // Update document revision info
    var doc Document
    if err := tx.First(&doc, instance.DocumentID).Error; err != nil {
        return nil, err
    }

    if err := tx.Model(&doc).Updates(map[string]interface{}{
        "revision_notes":        comment,
        "revision_from_step_id": instance.CurrentStepID,
        "revision_count":        gorm.Expr("revision_count + 1"),
    }).Error; err != nil {
        return nil, err
    }

    return &ActionResult{
        Action:  "rejected",
        Outcome: "returned_to_previous",
        Message: fmt.Sprintf("Document returned to step: %s", prevStep.Name),
    }, nil
}

// cancelWorkflow cancels the workflow entirely
func (h *RejectHandler) cancelWorkflow(
    ctx context.Context,
    tx *gorm.DB,
    instance *WorkflowInstance,
    comment string,
) (*ActionResult, error) {
    now := time.Now()
    userID := getUserIDFromCtx(ctx)

    if err := tx.Model(instance).Updates(map[string]interface{}{
        "status":        "cancelled",
        "cancelled_at":  now,
        "cancelled_by":  userID,
        "cancel_reason": comment,
    }).Error; err != nil {
        return nil, err
    }

    if err := tx.Model(&Document{}).Where("id = ?", instance.DocumentID).
        Update("status", "draft").Error; err != nil {
        return nil, err
    }

    return &ActionResult{
        Action:  "rejected",
        Outcome: "workflow_cancelled",
        Message: "Workflow cancelled, document returned to draft",
    }, nil
}
```

### 3.5 Step Resolver

```go
package workflow

import (
    "context"
    "fmt"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type StepResolver struct {
    db *gorm.DB
}

func NewStepResolver(db *gorm.DB) *StepResolver {
    return &StepResolver{db: db}
}

// ResolveAssignees determines who should handle this step
func (r *StepResolver) ResolveAssignees(
    ctx context.Context,
    tx *gorm.DB,
    step *WorkflowStep,
    doc *Document,
) ([]User, error) {
    var assignees []User

    switch step.AssigneeType {
    case "user":
        // Specific user
        var user User
        if err := tx.Preload("Position").First(&user, step.AssigneeUserID).Error; err != nil {
            return nil, err
        }
        assignees = []User{user}

    case "role":
        // All users with specific role in document's company + office
        if err := tx.Preload("Position").
            Joins("JOIN user_roles ON user_roles.user_id = users.id").
            Where("users.company_id = ? AND users.office_id = ?", doc.CompanyID, doc.OfficeID).
            Where("user_roles.role_id = ?", step.AssigneeRoleID).
            Where("users.is_active = ?", true).
            Find(&assignees).Error; err != nil {
            return nil, err
        }

    case "department_head":
        // Head of the document's department
        var dept Department
        if err := tx.First(&dept, doc.DepartmentID).Error; err != nil {
            return nil, err
        }
        if dept.HeadUserID != nil {
            var user User
            if err := tx.Preload("Position").First(&user, dept.HeadUserID).Error; err != nil {
                return nil, err
            }
            assignees = []User{user}
        }

    case "section_head":
        // Head of the document's section
        if doc.SectionID != nil {
            var section Section
            if err := tx.First(&section, doc.SectionID).Error; err != nil {
                return nil, err
            }
            if section.HeadUserID != nil {
                var user User
                if err := tx.Preload("Position").First(&user, section.HeadUserID).Error; err != nil {
                    return nil, err
                }
                assignees = []User{user}
            }
        }

    case "position":
        // All users with specific position in document's dept/section
        query := tx.Preload("Position").
            Where("company_id = ? AND position_id = ? AND is_active = ?",
                doc.CompanyID, step.AssigneePositionID, true).
            Where("department_id = ?", doc.DepartmentID)

        if doc.SectionID != nil {
            query = query.Or("section_id = ? AND position_id = ? AND is_active = ?",
                doc.SectionID, step.AssigneePositionID, true)
        }

        if err := query.Find(&assignees).Error; err != nil {
            return nil, err
        }

    case "department":
        // All users in specific department
        if err := tx.Preload("Position").
            Where("department_id = ? AND is_active = ?", step.AssigneeDepartmentID, true).
            Find(&assignees).Error; err != nil {
            return nil, err
        }

    case "section":
        // All users in specific section
        if err := tx.Preload("Position").
            Where("section_id = ? AND is_active = ?", step.AssigneeSectionID, true).
            Find(&assignees).Error; err != nil {
            return nil, err
        }

    default:
        return nil, fmt.Errorf("unknown assignee type: %s", step.AssigneeType)
    }

    if len(assignees) == 0 {
        return nil, fmt.Errorf("no assignees found for step '%s' (type: %s)", step.Name, step.AssigneeType)
    }

    return assignees, nil
}
```

---

## 4. OnlyOffice Callback Handler

```go
package handler

import (
    "crypto/sha256"
    "fmt"
    "io"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type OnlyOfficeHandler struct {
    db          *gorm.DB
    storagePath string
    auditLogger *AuditLogger
}

func NewOnlyOfficeHandler(db *gorm.DB, storagePath string, auditLogger *AuditLogger) *OnlyOfficeHandler {
    return &OnlyOfficeHandler{db: db, storagePath: storagePath, auditLogger: auditLogger}
}

// CallbackRequest represents the OnlyOffice callback payload
type CallbackRequest struct {
    Key    string   `json:"key"`
    Status int      `json:"status"`
    URL    string   `json:"url"`
    Users  []string `json:"users"`
}

// HandleCallback processes OnlyOffice save/close events
func (h *OnlyOfficeHandler) HandleCallback(c *gin.Context) {
    var req CallbackRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusOK, gin.H{"error": 0})
        return
    }

    switch req.Status {
    case 2, 6: // Ready for saving / Force save
        if err := h.saveDocument(c, &req); err != nil {
            c.JSON(http.StatusOK, gin.H{"error": 1})
            return
        }
    }

    c.JSON(http.StatusOK, gin.H{"error": 0})
}

func (h *OnlyOfficeHandler) saveDocument(c *gin.Context, req *CallbackRequest) error {
    // Find document by OnlyOffice key
    var doc Document
    if err := h.db.Preload("Company").Preload("Category").
        Where("onlyoffice_key = ?", req.Key).First(&doc).Error; err != nil {
        return err
    }

    // Download file from OnlyOffice
    resp, err := http.Get(req.URL)
    if err != nil {
        return fmt.Errorf("failed to download from OnlyOffice: %w", err)
    }
    defer resp.Body.Close()

    fileContent, err := io.ReadAll(resp.Body)
    if err != nil {
        return err
    }

    // Build structured path using folder_name (sanitized document_number)
    version := doc.CurrentVersion + 1
    basePath := fmt.Sprintf("%s/documents/%s/%d/%02d/%s",
        doc.Company.Code,
        doc.Category.Code,
        time.Now().Year(),
        int(time.Now().Month()),
        doc.FolderName, // already sanitized when document number was generated
    )
    filePath := fmt.Sprintf("%s/v%d.docx", basePath, version)
    fileName := fmt.Sprintf("v%d.docx", version)
    fileHash := fmt.Sprintf("%x", sha256.Sum256(fileContent))

    // Ensure directory exists & write file
    fullPath := fmt.Sprintf("%s/%s", h.storagePath, filePath)
    if err := ensureDirAndWrite(fullPath, fileContent); err != nil {
        return err
    }

    // Determine user who saved
    createdBy := doc.CreatedBy
    if len(req.Users) > 0 {
        if uid, err := uuid.Parse(req.Users[0]); err == nil {
            createdBy = uid
        }
    }

    // Transaction: create version + update document
    return h.db.Transaction(func(tx *gorm.DB) error {
        // Create version record
        docVersion := &DocumentVersion{
            ID:               uuid.New(),
            DocumentID:       doc.ID,
            VersionNumber:    version,
            MajorVersion:     doc.MajorVersion,
            MinorVersion:     doc.MinorVersion + 1,
            FilePath:         filePath,
            FileName:         fileName,
            FileSize:         int64(len(fileContent)),
            FileHash:         fileHash,
            ChangeType:       "edit",
            Source:           "editor",
            MetadataSnapshot: doc.Metadata,
            CreatedBy:        createdBy,
        }
        if err := tx.Create(docVersion).Error; err != nil {
            return err
        }

        // Track in file_storage
        fileStorage := &FileStorage{
            ID:            uuid.New(),
            CompanyID:     doc.CompanyID,
            FileName:      fileName,
            OriginalName:  fileName,
            FilePath:      filePath,
            FileSize:      int64(len(fileContent)),
            MimeType:      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            FileHash:      fileHash,
            Module:        "documents",
            CategoryCode:  doc.Category.Code,
            StorageYear:   time.Now().Year(),
            StorageMonth:  int(time.Now().Month()),
            EntityType:    "document_version",
            EntityID:      doc.ID,
            UploadedBy:    createdBy,
        }
        if err := tx.Create(fileStorage).Error; err != nil {
            return err
        }

        // Update document
        newKey := fmt.Sprintf("%s_v%d", req.Key, version)
        if err := tx.Model(&doc).Updates(map[string]interface{}{
            "current_version":  version,
            "minor_version":    doc.MinorVersion + 1,
            "draft_file_path":  filePath,
            "onlyoffice_key":   newKey,
        }).Error; err != nil {
            return err
        }

        h.auditLogger.Log(c, "document.edited", "Document", doc.ID, doc.DocumentNumber, nil, nil)
        return nil
    })
}
```

---

## 5. Template Processing (UniOffice)

```go
package document

import (
    "context"
    "fmt"
    "os"
    "path/filepath"
    "strings"
    "time"

    "github.com/google/uuid"
    "github.com/unidoc/unioffice/document"
    "github.com/unidoc/unioffice/measurement"
    "github.com/unidoc/unioffice/common"
    "gorm.io/gorm"
)

type TemplateService struct {
    db          *gorm.DB
    storagePath string
}

func NewTemplateService(db *gorm.DB, storagePath string) *TemplateService {
    return &TemplateService{db: db, storagePath: storagePath}
}

// GenerateFromTemplate creates a document from template with dynamic tag resolution
func (s *TemplateService) GenerateFromTemplate(
    ctx context.Context,
    template *DocumentTemplate,
    metadata map[string]interface{},
    doc *Document,
) (string, error) {
    templatePath := filepath.Join(s.storagePath, template.FilePath)

    // Open template .docx
    docFile, err := document.Open(templatePath)
    if err != nil {
        return "", fmt.Errorf("failed to open template: %w", err)
    }
    defer docFile.Close()

    // Get tag definitions from DB
    var tags []TemplateTag
    if err := s.db.Where("template_id = ?", template.ID).Find(&tags).Error; err != nil {
        return "", err
    }

    // Process each tag
    for _, tag := range tags {
        value := s.resolveTagValue(ctx, &tag, metadata, doc)

        if tag.DataType == "image" || tag.DataType == "signature" {
            if strVal, ok := value.(string); ok && strVal != "" {
                s.replaceImageTag(docFile, tag.TagKey, strVal, tag.FormatPattern)
            }
        } else if tag.DataType == "table" {
            // Table processing — iterate rows
            s.processTableTag(docFile, &tag, value)
        } else {
            // Text replacement — search and replace in all paragraphs
            formattedValue := s.formatValue(value, &tag)
            replaceTagInDocument(docFile, "${"+tag.TagKey+"}", formattedValue)
        }
    }

    // Build structured output path
    company := doc.Company
    category := doc.Category
    outputDir := fmt.Sprintf("%s/documents/%s/%d/%02d/%s",
        company.Code,
        category.Code,
        time.Now().Year(),
        int(time.Now().Month()),
        doc.FolderName, // sanitized from document_number
    )

    fullOutputDir := filepath.Join(s.storagePath, outputDir)
    if err := os.MkdirAll(fullOutputDir, 0755); err != nil {
        return "", err
    }

    outputPath := filepath.Join(fullOutputDir, "v1.docx")
    if err := docFile.SaveToFile(outputPath); err != nil {
        return "", fmt.Errorf("failed to save document: %w", err)
    }

    return outputDir + "/v1.docx", nil
}

// replaceImageTag inserts an image at the tag location
func (s *TemplateService) replaceImageTag(docFile *document.Document, tagKey string, imagePath string, formatPattern string) {
    width, height := parseImageDimensions(formatPattern, 100, 40) // default 100x40mm

    imgRef, err := common.ImageFromFile(imagePath)
    if err != nil {
        return
    }

    imgData, err := docFile.AddImage(imgRef)
    if err != nil {
        return
    }

    // Find paragraph containing the tag and replace with image
    for _, para := range docFile.Paragraphs() {
        for _, run := range para.Runs() {
            text := run.Text()
            if strings.Contains(text, "${"+tagKey+"}") {
                run.Clear()
                inlineDrawing, _ := run.AddDrawingInline(imgData)
                inlineDrawing.SetSize(
                    measurement.Millimeter*measurement.Distance(width),
                    measurement.Millimeter*measurement.Distance(height),
                )
            }
        }
    }
}

// replaceTagInDocument finds ${TAG} in all paragraphs and replaces with value
func replaceTagInDocument(docFile *document.Document, tag string, value string) {
    for _, para := range docFile.Paragraphs() {
        for _, run := range para.Runs() {
            text := run.Text()
            if strings.Contains(text, tag) {
                run.ClearContent()
                run.AddText(strings.ReplaceAll(text, tag, value))
            }
        }
    }

    // Also check headers & footers
    for _, section := range docFile.Sections() {
        for _, hdr := range section.Headers() {
            for _, para := range hdr.Paragraphs() {
                for _, run := range para.Runs() {
                    text := run.Text()
                    if strings.Contains(text, tag) {
                        run.ClearContent()
                        run.AddText(strings.ReplaceAll(text, tag, value))
                    }
                }
            }
        }
    }
}

// resolveTagValue resolves tag value based on source_type
func (s *TemplateService) resolveTagValue(
    ctx context.Context,
    tag *TemplateTag,
    metadata map[string]interface{},
    doc *Document,
) interface{} {
    // Check if metadata has explicit value
    if val, ok := metadata[tag.TagKey]; ok {
        return val
    }

    switch tag.SourceType {
    case "current_user":
        return s.resolveCurrentUser(ctx, tag)
    case "auto_generate":
        return s.resolveAutoGenerate(tag, doc)
    case "database":
        return s.resolveFromDatabase(tag, doc)
    case "parent_doc":
        return s.resolveFromParentDoc(tag, doc)
    default:
        return tag.DefaultValue
    }
}

// resolveCurrentUser gets field from current user context
func (s *TemplateService) resolveCurrentUser(ctx context.Context, tag *TemplateTag) string {
    user := getUserFromCtx(ctx)
    if user == nil {
        return ""
    }

    field := "name"
    if config := tag.SourceConfig; config != nil {
        if f, ok := config["field"].(string); ok {
            field = f
        }
    }

    switch field {
    case "name":
        return user.Name
    case "email":
        return user.Email
    case "employee_id":
        return user.EmployeeID
    case "position":
        if user.Position != nil {
            return user.Position.Name
        }
    case "department":
        if user.Department != nil {
            return user.Department.Name
        }
    case "section":
        if user.Section != nil {
            return user.Section.Name
        }
    case "office":
        if user.Office != nil {
            return user.Office.Name
        }
    }
    return ""
}

// formatValue converts value based on tag data_type & format_pattern
func (s *TemplateService) formatValue(value interface{}, tag *TemplateTag) string {
    if value == nil {
        if tag.DefaultValue != "" {
            return tag.DefaultValue
        }
        return ""
    }

    strVal := fmt.Sprintf("%v", value)
    if strVal == "" {
        return tag.DefaultValue
    }

    switch tag.DataType {
    case "date":
        t, err := time.Parse(time.RFC3339, strVal)
        if err == nil {
            format := tag.FormatPattern
            if format == "" {
                format = "02 January 2006"
            }
            return t.Format(convertDateFormat(format))
        }
    case "number":
        // number formatting handled by frontend display
    }

    switch tag.FormatPattern {
    case "UPPER":
        return strings.ToUpper(strVal)
    case "LOWER":
        return strings.ToLower(strVal)
    case "UCFIRST":
        if len(strVal) > 0 {
            return strings.ToUpper(strVal[:1]) + strVal[1:]
        }
    }

    return strVal
}

// InsertSignatures inserts approval signatures into final document
func (s *TemplateService) InsertSignatures(ctx context.Context, doc *Document) (string, error) {
    filePath := filepath.Join(s.storagePath, doc.DraftFilePath)

    docFile, err := document.Open(filePath)
    if err != nil {
        return "", fmt.Errorf("failed to open document: %w", err)
    }
    defer docFile.Close()

    // Get completed workflow instance
    var instance WorkflowInstance
    if err := s.db.Where("document_id = ? AND status = ?", doc.ID, "completed").
        Order("created_at DESC").First(&instance).Error; err != nil {
        return "", err
    }

    // Get approved step instances with actions
    var stepInstances []WorkflowStepInstance
    if err := s.db.Where("workflow_instance_id = ? AND status = ?", instance.ID, "approved").
        Find(&stepInstances).Error; err != nil {
        return "", err
    }

    // Get signature tags from template
    var signatureTags []TemplateTag
    if err := s.db.Where("template_id = ? AND data_type = ?", doc.TemplateID, "signature").
        Find(&signatureTags).Error; err != nil {
        return "", err
    }

    for _, sigTag := range signatureTags {
        linkedStep := ""
        if config := sigTag.SignatureConfig; config != nil {
            if ls, ok := config["linked_step"].(string); ok {
                linkedStep = ls
            }
        }

        // Find matching approved step
        var matchingStep *WorkflowStepInstance
        for i := range stepInstances {
            var stepDef WorkflowStep
            if err := s.db.First(&stepDef, stepInstances[i].WorkflowStepID).Error; err != nil {
                continue
            }
            if stepDef.StepType == linkedStep {
                matchingStep = &stepInstances[i]
                break
            }
        }
        if matchingStep == nil {
            continue
        }

        // Get approve action for this step
        var approveAction WorkflowAction
        if err := s.db.Where("workflow_step_instance_id = ? AND action = ?", matchingStep.ID, "approve").
            First(&approveAction).Error; err != nil {
            continue
        }

        // Get user with position
        var user User
        if err := s.db.Preload("Position").First(&user, approveAction.UserID).Error; err != nil {
            continue
        }

        // Insert signature image
        if user.SignaturePath != "" {
            sigFullPath := filepath.Join(s.storagePath, user.SignaturePath)
            if _, err := os.Stat(sigFullPath); err == nil {
                width, height := 100, 40
                if config := sigTag.SignatureConfig; config != nil {
                    if w, ok := config["width"].(float64); ok {
                        width = int(w)
                    }
                    if h, ok := config["height"].(float64); ok {
                        height = int(h)
                    }
                }
                s.replaceImageTag(docFile, sigTag.TagKey, sigFullPath, fmt.Sprintf("%dx%d", width, height))
            }
        }

        // Replace related name/position/date tags
        prefix := strings.TrimPrefix(sigTag.TagKey, "TTD_")
        positionName := ""
        if user.Position != nil {
            positionName = user.Position.Name
        }
        replaceTagInDocument(docFile, "${NAMA_"+prefix+"}", user.Name)
        replaceTagInDocument(docFile, "${JABATAN_"+prefix+"}", positionName)
        replaceTagInDocument(docFile, "${TANGGAL_"+prefix+"}", approveAction.CreatedAt.Format("02 January 2006"))
    }

    // Save signed document
    signedPath := fmt.Sprintf("%s/documents/%s/%d/%02d/%s/v%d-signed.docx",
        doc.Company.Code,
        doc.Category.Code,
        time.Now().Year(),
        int(time.Now().Month()),
        doc.FolderName, // sanitized from document_number
        doc.CurrentVersion,
    )

    fullSignedPath := filepath.Join(s.storagePath, signedPath)
    if err := os.MkdirAll(filepath.Dir(fullSignedPath), 0755); err != nil {
        return "", err
    }

    if err := docFile.SaveToFile(fullSignedPath); err != nil {
        return "", fmt.Errorf("failed to save signed document: %w", err)
    }

    return signedPath, nil
}
```

---

## 6. Deadline Checker (Scheduled Job)

```go
package jobs

import (
    "context"
    "log"
    "time"

    "github.com/go-co-op/gocron/v2"
    "gorm.io/gorm"
)

type DeadlineChecker struct {
    db       *gorm.DB
    notifier NotificationDispatcher
}

func NewDeadlineChecker(db *gorm.DB, notifier NotificationDispatcher) *DeadlineChecker {
    return &DeadlineChecker{db: db, notifier: notifier}
}

// RegisterSchedule registers deadline check jobs with gocron
func (d *DeadlineChecker) RegisterSchedule(scheduler gocron.Scheduler) {
    // Run every hour
    scheduler.NewJob(
        gocron.CronJob("0 * * * *", false),
        gocron.NewTask(d.CheckAll),
    )
}

// CheckAll runs all deadline checks
func (d *DeadlineChecker) CheckAll() {
    ctx := context.Background()

    d.checkWarnings(ctx)
    d.checkOverdue(ctx)
}

// checkWarnings sends H-1 deadline warnings
func (d *DeadlineChecker) checkWarnings(ctx context.Context) {
    var warningSteps []WorkflowStepInstance
    now := time.Now()
    tomorrow := now.Add(24 * time.Hour)

    if err := d.db.Where("status = ? AND deadline_at IS NOT NULL", "active").
        Where("deadline_at BETWEEN ? AND ?", now, tomorrow).
        Find(&warningSteps).Error; err != nil {
        log.Printf("error checking warnings: %v", err)
        return
    }

    for _, step := range warningSteps {
        d.notifier.NotifyDeadlineWarning(ctx, &step)
    }
}

// checkOverdue processes overdue steps + escalation
func (d *DeadlineChecker) checkOverdue(ctx context.Context) {
    var overdueSteps []WorkflowStepInstance

    if err := d.db.Where("status = ? AND deadline_at IS NOT NULL AND deadline_at < ? AND escalated = ?",
        "active", time.Now(), false).
        Find(&overdueSteps).Error; err != nil {
        log.Printf("error checking overdue: %v", err)
        return
    }

    for _, step := range overdueSteps {
        d.notifier.NotifyOverdue(ctx, &step)

        // Check escalation
        var stepDef WorkflowStep
        if err := d.db.First(&stepDef, step.WorkflowStepID).Error; err != nil {
            continue
        }

        if stepDef.EscalationAction != "" && stepDef.EscalationAfterDays > 0 {
            escalateAt := step.DeadlineAt.AddDate(0, 0, stepDef.EscalationAfterDays)
            if time.Now().After(escalateAt) {
                d.escalate(ctx, &step, &stepDef)
            }
        }
    }
}

// escalate performs escalation action
func (d *DeadlineChecker) escalate(ctx context.Context, step *WorkflowStepInstance, stepDef *WorkflowStep) {
    now := time.Now()
    d.db.Model(step).Updates(map[string]interface{}{
        "escalated":    true,
        "escalated_at": now,
    })

    switch stepDef.EscalationAction {
    case "notify_head":
        d.notifier.NotifyDepartmentHead(ctx, step)
    case "notify_admin":
        d.notifier.NotifyAdminCompany(ctx, step)
    case "auto_approve":
        d.autoApproveStep(ctx, step)
    }
}

func (d *DeadlineChecker) autoApproveStep(ctx context.Context, step *WorkflowStepInstance) {
    now := time.Now()
    d.db.Model(step).Updates(map[string]interface{}{
        "status":       "approved",
        "completed_at": now,
    })
    log.Printf("auto-approved step %s due to escalation", step.ID)
}
```

---

## 7. PDF Conversion

```go
package document

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
)

type PDFConverter struct {
    onlyOfficeURL string // e.g. "http://onlyoffice:8000"
    storagePath   string
}

func NewPDFConverter(onlyOfficeURL string, storagePath string) *PDFConverter {
    return &PDFConverter{onlyOfficeURL: onlyOfficeURL, storagePath: storagePath}
}

// ConvertRequest for OnlyOffice Conversion API
type ConvertRequest struct {
    Async      bool   `json:"async"`
    FileType   string `json:"filetype"`
    Key        string `json:"key"`
    OutputType string `json:"outputtype"`
    Title      string `json:"title"`
    URL        string `json:"url"`
}

// ConvertToPDF converts .docx to .pdf via OnlyOffice Conversion API
func (c *PDFConverter) ConvertToPDF(inputURL string, outputPath string, key string) error {
    reqBody := ConvertRequest{
        Async:      false,
        FileType:   "docx",
        Key:        key,
        OutputType: "pdf",
        Title:      "document.pdf",
        URL:        inputURL,
    }

    body, _ := json.Marshal(reqBody)
    resp, err := http.Post(
        c.onlyOfficeURL+"/ConvertService.ashx",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return fmt.Errorf("conversion request failed: %w", err)
    }
    defer resp.Body.Close()

    // Parse response and download converted PDF
    var result struct {
        FileURL string `json:"fileUrl"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return err
    }

    // Download PDF
    pdfResp, err := http.Get(result.FileURL)
    if err != nil {
        return err
    }
    defer pdfResp.Body.Close()

    // Write to output path
    fullPath := filepath.Join(c.storagePath, outputPath)
    if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
        return err
    }

    f, err := os.Create(fullPath)
    if err != nil {
        return err
    }
    defer f.Close()

    _, err = io.Copy(f, pdfResp.Body)
    return err
}
```

---

## 8. Audit Logger

```go
package audit

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type AuditLogger struct {
    db *gorm.DB
}

func NewAuditLogger(db *gorm.DB) *AuditLogger {
    return &AuditLogger{db: db}
}

// Log creates an audit trail entry
func (l *AuditLogger) Log(
    c *gin.Context,
    action string,
    entityType string,
    entityID uuid.UUID,
    entityName string,
    oldValues map[string]interface{},
    newValues map[string]interface{},
) {
    user := getUserFromContext(c)

    entry := &AuditLog{
        ID:           uuid.New(),
        Action:       action,
        EntityType:   entityType,
        EntityID:     entityID,
        EntityName:   entityName,
        OldValues:    oldValues,
        NewValues:    newValues,
        IPAddress:    c.ClientIP(),
        UserAgent:    c.Request.UserAgent(),
        CreatedAt:    time.Now(),
    }

    if user != nil {
        entry.CompanyID = &user.CompanyID
        entry.OfficeID = &user.OfficeID
        entry.UserID = &user.ID
        entry.UserName = user.Name
        entry.UserEmail = user.Email
        if user.Position != nil {
            entry.UserPosition = user.Position.Name
        }
        entry.Description = generateDescription(action, entityName, user.Name)
    }

    // Non-blocking: log in goroutine
    go func() {
        if err := l.db.Create(entry).Error; err != nil {
            // Fall back to standard logger
            fmt.Printf("audit log error: %v\n", err)
        }
    }()
}

func generateDescription(action string, entityName string, userName string) string {
    switch action {
    case "document.created":
        return fmt.Sprintf("%s created document %s", userName, entityName)
    case "document.edited":
        return fmt.Sprintf("%s edited document %s", userName, entityName)
    case "document.approved":
        return fmt.Sprintf("%s approved document %s", userName, entityName)
    case "document.rejected":
        return fmt.Sprintf("%s rejected document %s", userName, entityName)
    case "document.finalized":
        return fmt.Sprintf("%s finalized document %s", userName, entityName)
    default:
        return fmt.Sprintf("%s performed %s on %s", userName, action, entityName)
    }
}
```

---

## 9. Project Structure (Go Backend)

```
backend/
├── cmd/
│   └── server/
│       └── main.go                     # Entry point, wire dependencies, start server
├── internal/
│   ├── config/
│   │   └── config.go                   # App config (env vars, YAML)
│   ├── middleware/
│   │   ├── auth.go                     # JWT authentication middleware
│   │   ├── rbac.go                     # Permission check middleware
│   │   ├── cors.go                     # CORS config
│   │   └── logger.go                   # Request logging
│   ├── handler/                        # HTTP handlers (Gin)
│   │   ├── auth.go                     # Login, refresh, logout
│   │   ├── user.go                     # User CRUD
│   │   ├── company.go
│   │   ├── office.go
│   │   ├── department.go
│   │   ├── section.go
│   │   ├── position.go
│   │   ├── role.go
│   │   ├── document_category.go
│   │   ├── document_template.go
│   │   ├── template_tag.go
│   │   ├── document.go
│   │   ├── document_comment.go
│   │   ├── document_distribution.go
│   │   ├── document_numbering.go
│   │   ├── workflow.go
│   │   ├── workflow_instance.go
│   │   ├── onlyoffice.go              # OnlyOffice callback
│   │   ├── audit_log.go
│   │   ├── notification.go
│   │   ├── dashboard.go
│   │   └── websocket.go               # WebSocket connections
│   ├── model/                          # GORM models
│   │   ├── company.go
│   │   ├── office.go
│   │   ├── department.go
│   │   ├── section.go
│   │   ├── position.go
│   │   ├── user.go
│   │   ├── role.go
│   │   ├── permission.go
│   │   ├── document_category.go
│   │   ├── document_type.go
│   │   ├── document_template.go
│   │   ├── template_tag.go
│   │   ├── document.go
│   │   ├── document_version.go
│   │   ├── document_comment.go
│   │   ├── document_distribution.go
│   │   ├── document_numbering.go
│   │   ├── workflow.go
│   │   ├── workflow_step.go
│   │   ├── workflow_instance.go
│   │   ├── workflow_step_instance.go
│   │   ├── workflow_action.go
│   │   ├── audit_log.go
│   │   ├── notification.go
│   │   └── file_storage.go
│   ├── service/                        # Business logic
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── document_service.go
│   │   ├── template_service.go
│   │   ├── numbering_service.go
│   │   ├── signature_service.go
│   │   ├── distribution_service.go
│   │   ├── onlyoffice_service.go
│   │   ├── notification_service.go
│   │   ├── email_service.go
│   │   ├── file_storage_service.go
│   │   └── dashboard_service.go
│   ├── workflow/                       # Workflow engine (separate domain)
│   │   ├── service.go
│   │   ├── engine.go
│   │   ├── step_resolver.go
│   │   ├── reject_handler.go
│   │   ├── delegation.go
│   │   ├── deadline.go
│   │   ├── result.go
│   │   └── errors.go
│   ├── audit/
│   │   └── logger.go
│   ├── websocket/
│   │   ├── hub.go                      # Connection hub
│   │   └── client.go                   # Client handler
│   └── jobs/                           # Background jobs (asynq)
│       ├── send_email.go
│       ├── convert_pdf.go
│       ├── check_deadlines.go
│       ├── process_escalation.go
│       └── cleanup_temp.go
├── migrations/                         # golang-migrate SQL files
│   ├── 001_create_companies.up.sql
│   ├── 001_create_companies.down.sql
│   ├── 002_create_offices.up.sql
│   ├── ...
│   └── 032_create_file_storage.up.sql
├── pkg/                                # Shared utilities
│   ├── jwt/
│   │   └── jwt.go
│   ├── validator/
│   │   └── validator.go
│   └── helpers/
│       ├── slug.go                     # folder_name sanitizer
│       ├── roman.go                    # Roman numeral converter
│       └── pagination.go
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 10. React Frontend Structure (Unchanged)

```
src/features/
├── auth/
├── dashboard/
├── documents/
│   ├── DocumentListPage.tsx
│   ├── DocumentDetailPage.tsx
│   ├── DocumentCreatePage.tsx          # Dynamic form from template_tags
│   ├── DocumentEditorPage.tsx
│   ├── components/
│   │   ├── DynamicMetadataForm.tsx     # Form generated from template tags
│   │   ├── TagFieldRenderer.tsx        # Render field per data_type
│   │   ├── DynamicTableField.tsx       # Render data_type = 'table'
│   │   ├── DistributionPanel.tsx
│   │   ├── RejectDialog.tsx            # With on_reject_action info
│   │   ├── ApproveDialog.tsx           # With optional/required comment
│   │   ├── DelegateDialog.tsx
│   │   └── ...
├── templates/
│   ├── components/
│   │   ├── TagConfigForm.tsx           # Full tag configuration form
│   │   ├── TagSourceConfig.tsx         # Source type config per tag
│   │   ├── TableColumnConfig.tsx       # Config for table data_type
│   │   ├── SignatureConfig.tsx         # Config for signature data_type
│   │   └── ...
├── workflows/
│   ├── components/
│   │   ├── StepEditor.tsx              # Full step config
│   │   ├── AssigneeSelector.tsx        # Select assignee type + target
│   │   ├── RejectBehaviorConfig.tsx    # on_reject_action config
│   │   └── ...
├── organizations/
│   ├── OfficeListPage.tsx
│   ├── OfficeFormPage.tsx
│   ├── SectionManager.tsx
│   ├── PositionListPage.tsx
│   ├── PositionFormPage.tsx
│   ├── OrgTreeView.tsx                 # Visual org structure
│   └── organizationApi.ts
├── categories/
│   ├── CategoryListPage.tsx
│   ├── CategoryFormPage.tsx
│   └── categoryApi.ts
└── ...
```

---

## 11. Key Dependencies (go.mod)

```go
module github.com/arivin29/edm

go 1.22

require (
    github.com/gin-gonic/gin v1.10.0         // HTTP framework
    gorm.io/gorm v1.26.0                      // ORM
    gorm.io/driver/postgres v1.5.0            // PostgreSQL driver
    github.com/golang-jwt/jwt/v5 v5.2.0       // JWT auth
    github.com/google/uuid v1.6.0             // UUID generation
    github.com/unidoc/unioffice/v2 v2.9.0     // DOCX processing (template + image)
    github.com/hibiken/asynq v0.25.0          // Background job queue (Redis)
    github.com/go-co-op/gocron/v2 v2.12.0    // Scheduler (deadline checker)
    github.com/gorilla/websocket v1.5.3       // WebSocket (real-time notifications)
    github.com/go-gomail/gomail v0.0.0        // Email sending
    github.com/go-playground/validator/v10 v10.22.0 // Input validation
    github.com/golang-migrate/migrate/v4 v4.18.0 // DB migrations
    github.com/redis/go-redis/v9 v9.7.0       // Redis client
    golang.org/x/crypto v0.28.0               // Password hashing (bcrypt)
)
```
