# DMS Workflow Engine v2 — Technical Design

---

## 1. Overview

Workflow Engine mengelola lifecycle dokumen dari draft hingga final.
Engine bersifat **dynamic** — admin bisa konfigurasi flow berbeda per:
- Company + Office + Document Type + Category + Department

Perubahan dari v1:
- Step assignee: user / role / department_head / section_head / position / department / section
- Reject behavior: to_creator / to_step / to_previous / cancel
- Comment wajib/opsional per action per step
- Delegation support
- Structured file storage: /{company}/{module}/{category}/{year}/{month}/

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

### 3.1 Service Structure

```
App\Services\Workflow\
├── WorkflowService.php           # Main orchestrator (public API)
├── WorkflowEngine.php            # State machine logic
├── StepResolver.php              # Resolve assignees per step
├── RejectHandler.php             # Handle reject routing
├── DelegationService.php         # Handle delegation
├── DeadlineService.php           # Calculate & track deadlines + escalation
├── NotificationDispatcher.php    # Send notifications on state change
├── SignatureService.php          # Handle signature placement
└── WorkflowActionResult.php      # Value object for action results
```

### 3.2 Core Methods

```php
class WorkflowService
{
    public function submit(Document $document, User $user, ?string $comment): WorkflowInstance;

    public function processAction(
        Document $document,
        User $user,
        string $action,          // 'approve', 'reject', 'revise', 'delegate'
        ?string $comment,
        array $options = []      // ['use_signature' => true, 'delegated_to' => 'uuid']
    ): WorkflowActionResult;

    public function resubmit(Document $document, User $user, ?string $comment): WorkflowInstance;

    public function finalize(Document $document, User $user): Document;

    public function cancel(WorkflowInstance $instance, User $user, string $reason): void;

    public function getCurrentStatus(Document $document): WorkflowStatus;

    public function getPendingTasks(User $user, ?string $officeId = null): Collection;

    public function canPerformAction(Document $document, User $user, string $action): bool;

    public function getOverdueTasks(): Collection;
}
```

### 3.3 Workflow Engine Logic

```php
class WorkflowEngine
{
    public function __construct(
        private StepResolver $stepResolver,
        private RejectHandler $rejectHandler,
        private DelegationService $delegationService,
        private DeadlineService $deadlineService,
        private NotificationDispatcher $notificationDispatcher,
    ) {}

    /**
     * Start workflow for document
     */
    public function start(Document $document): WorkflowInstance
    {
        // 1. Find matching workflow definition (most specific match)
        $workflow = $this->findWorkflow(
            $document->company_id,
            $document->office_id,
            $document->document_type_id,
            $document->category_id,
            $document->department_id
        );

        if (!$workflow) {
            throw new WorkflowException('No workflow configured for this document type/category/department');
        }

        // 2. Create workflow instance
        $instance = WorkflowInstance::create([
            'document_id' => $document->id,
            'workflow_id' => $workflow->id,
            'status' => 'active',
            'iteration' => $this->getNextIteration($document),
            'started_at' => now(),
        ]);

        // 3. Create step instances for all steps
        foreach ($workflow->steps()->orderBy('step_order')->get() as $step) {
            WorkflowStepInstance::create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => $step->id,
                'step_order' => $step->step_order,
                'status' => 'pending',
                'required_approvals' => $step->is_parallel
                    ? ($step->required_approvals ?: 999) // 0 = all
                    : 1,
            ]);
        }

        // 4. Activate first step
        $firstStep = $workflow->steps()->orderBy('step_order')->first();
        $this->activateStep($instance, $firstStep);

        // 5. Update document
        $document->update([
            'status' => 'in_review',
            'submitted_at' => $document->submitted_at ?? now(),
            'submitted_by' => auth()->id(),
        ]);

        return $instance;
    }

    /**
     * Process an action on current step
     */
    public function processAction(
        WorkflowInstance $instance,
        WorkflowStepInstance $stepInstance,
        User $user,
        string $action,
        ?string $comment,
        array $options = []
    ): WorkflowActionResult
    {
        $step = $stepInstance->workflowStep;

        // 1. Validate user is assignee
        $this->validateAssignee($stepInstance, $user);

        // 2. Validate comment requirements
        $this->validateComment($step, $action, $comment);

        // 3. Record the action
        $workflowAction = WorkflowAction::create([
            'workflow_instance_id' => $instance->id,
            'workflow_step_instance_id' => $stepInstance->id,
            'user_id' => $user->id,
            'action' => $action,
            'comment' => $comment,
            'is_comment_public' => $options['is_comment_public'] ?? true,
            'signature_used' => $options['use_signature'] ?? false,
            'signature_path' => ($options['use_signature'] ?? false) ? $user->signature_path : null,
            'delegated_to' => $options['delegated_to'] ?? null,
            'delegation_reason' => $options['delegation_reason'] ?? null,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);

        // 4. Process based on action type
        return match ($action) {
            'approve' => $this->handleApprove($instance, $stepInstance),
            'reject' => $this->handleReject($instance, $stepInstance, $comment),
            'revise' => $this->handleRevise($instance, $stepInstance, $comment),
            'delegate' => $this->handleDelegate($instance, $stepInstance, $user, $options),
            default => throw new WorkflowException("Invalid action: {$action}"),
        };
    }

    /**
     * Validate comment based on step config
     */
    private function validateComment(WorkflowStep $step, string $action, ?string $comment): void
    {
        if ($action === 'reject' && $step->reject_comment_required && empty($comment)) {
            throw new WorkflowException('Comment is required when rejecting');
        }

        if ($action === 'approve' && $step->approve_comment_required && empty($comment)) {
            throw new WorkflowException('Comment is required when approving');
        }

        if ($action === 'revise' && empty($comment)) {
            throw new WorkflowException('Comment is required when requesting revision');
        }
    }

    private function handleApprove(
        WorkflowInstance $instance,
        WorkflowStepInstance $stepInstance
    ): WorkflowActionResult
    {
        $step = $stepInstance->workflowStep;

        // Update counts
        $stepInstance->increment('approval_count');

        if ($step->is_parallel) {
            $requiredApprovals = $step->required_approvals ?: $this->getTotalAssignees($step, $instance->document);

            if ($stepInstance->approval_count < $requiredApprovals) {
                return new WorkflowActionResult(
                    action: 'approved',
                    outcome: 'waiting_more_approvals',
                    message: "Approved {$stepInstance->approval_count}/{$requiredApprovals}"
                );
            }
        }

        // Mark step as approved
        $stepInstance->update([
            'status' => 'approved',
            'completed_at' => now(),
        ]);

        // Advance to next step
        return $this->advanceToNextStep($instance);
    }

    private function advanceToNextStep(WorkflowInstance $instance): WorkflowActionResult
    {
        // Find next pending step
        $nextStepInstance = $instance->stepInstances()
            ->where('status', 'pending')
            ->orderBy('step_order')
            ->first();

        if ($nextStepInstance) {
            $this->activateStep($instance, $nextStepInstance->workflowStep);

            return new WorkflowActionResult(
                action: 'approved',
                outcome: 'next_step_activated',
                nextStep: $nextStepInstance->workflowStep->name
            );
        }

        // All steps completed
        $instance->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $instance->document->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        $this->notificationDispatcher->notifyDocumentApproved($instance->document);

        return new WorkflowActionResult(
            action: 'approved',
            outcome: 'workflow_completed'
        );
    }

    /**
     * Handle reject — route based on step config
     */
    private function handleReject(
        WorkflowInstance $instance,
        WorkflowStepInstance $stepInstance,
        string $comment
    ): WorkflowActionResult
    {
        $step = $stepInstance->workflowStep;

        // Mark current step as rejected
        $stepInstance->update([
            'status' => 'rejected',
            'completed_at' => now(),
        ]);
        $stepInstance->increment('rejection_count');

        // Route reject based on on_reject_action
        return $this->rejectHandler->handle($instance, $stepInstance, $step, $comment);
    }

    /**
     * Handle delegate
     */
    private function handleDelegate(
        WorkflowInstance $instance,
        WorkflowStepInstance $stepInstance,
        User $fromUser,
        array $options
    ): WorkflowActionResult
    {
        $delegatedTo = User::findOrFail($options['delegated_to']);

        // Update assigned_users in step instance
        $assignedUsers = $stepInstance->assigned_users ?? [];
        // Remove original user, add delegated user
        $assignedUsers = array_filter($assignedUsers, fn($u) => $u['user_id'] !== $fromUser->id);
        $assignedUsers[] = [
            'user_id' => $delegatedTo->id,
            'name' => $delegatedTo->name,
            'email' => $delegatedTo->email,
            'position' => $delegatedTo->position?->name,
            'delegated_from' => $fromUser->name,
        ];
        $stepInstance->update(['assigned_users' => array_values($assignedUsers)]);

        $this->notificationDispatcher->notifyDelegation($instance, $stepInstance, $fromUser, $delegatedTo);

        return new WorkflowActionResult(
            action: 'delegated',
            outcome: 'task_delegated',
            message: "Delegated to {$delegatedTo->name}"
        );
    }

    /**
     * Activate a step — resolve assignees, set deadline, notify
     */
    private function activateStep(WorkflowInstance $instance, WorkflowStep $step): void
    {
        $stepInstance = $instance->stepInstances()
            ->where('workflow_step_id', $step->id)
            ->first();

        // Resolve assignees
        $assignees = $this->stepResolver->resolveAssignees($step, $instance->document);

        $stepInstance->update([
            'status' => 'active',
            'started_at' => now(),
            'deadline_at' => $step->deadline_days
                ? $this->deadlineService->calculateDeadline($step->deadline_days)
                : null,
            'assigned_users' => $assignees->map(fn(User $u) => [
                'user_id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'position' => $u->position?->name,
            ])->values()->toArray(),
        ]);

        $instance->update(['current_step_id' => $step->id]);

        // Notify assignees
        $this->notificationDispatcher->notifyAssignees($assignees, $instance, $step);
    }

    /**
     * Find most specific workflow match
     * Priority: company+office+type+category+dept > company+office+type+dept > company+type > ...
     */
    private function findWorkflow(
        string $companyId,
        string $officeId,
        string $typeId,
        string $categoryId,
        string $departmentId
    ): ?Workflow
    {
        // Try most specific first, then broader
        return Workflow::where('company_id', $companyId)
            ->where('document_type_id', $typeId)
            ->where('is_active', true)
            ->orderByRaw("
                CASE
                    WHEN office_id = ? AND category_id = ? AND department_id = ? THEN 1
                    WHEN office_id = ? AND department_id = ? THEN 2
                    WHEN office_id = ? AND category_id = ? THEN 3
                    WHEN department_id = ? THEN 4
                    WHEN category_id = ? THEN 5
                    WHEN office_id = ? THEN 6
                    ELSE 7
                END
            ", [$officeId, $categoryId, $departmentId,
                $officeId, $departmentId,
                $officeId, $categoryId,
                $departmentId,
                $categoryId,
                $officeId])
            ->where(function ($q) use ($officeId, $categoryId, $departmentId) {
                $q->where(function ($q2) use ($officeId) {
                    $q2->where('office_id', $officeId)->orWhereNull('office_id');
                })->where(function ($q2) use ($categoryId) {
                    $q2->where('category_id', $categoryId)->orWhereNull('category_id');
                })->where(function ($q2) use ($departmentId) {
                    $q2->where('department_id', $departmentId)->orWhereNull('department_id');
                });
            })
            ->first();
    }
}
```

### 3.4 Reject Handler

```php
class RejectHandler
{
    public function handle(
        WorkflowInstance $instance,
        WorkflowStepInstance $currentStep,
        WorkflowStep $stepDefinition,
        string $comment
    ): WorkflowActionResult
    {
        return match ($stepDefinition->on_reject_action) {
            'to_creator' => $this->rejectToCreator($instance, $comment),
            'to_step' => $this->rejectToStep($instance, $stepDefinition, $comment),
            'to_previous' => $this->rejectToPrevious($instance, $currentStep, $comment),
            'cancel' => $this->cancelWorkflow($instance, $comment),
            default => $this->rejectToCreator($instance, $comment),
        };
    }

    /**
     * Reject → kembali ke pembuat dokumen
     */
    private function rejectToCreator(WorkflowInstance $instance, string $comment): WorkflowActionResult
    {
        $instance->update(['status' => 'revision']);

        $document = $instance->document;
        $document->update([
            'status' => 'revision',
            'revision_notes' => $comment,
            'revision_from_step_id' => $instance->current_step_id,
        ]);
        $document->increment('revision_count');

        $this->notifyCreatorRejected($document, $comment);

        return new WorkflowActionResult(
            action: 'rejected',
            outcome: 'returned_to_creator',
            message: 'Document returned to creator for revision'
        );
    }

    /**
     * Reject → kembali ke step tertentu
     * Workflow tetap active, step target di-re-activate
     */
    private function rejectToStep(
        WorkflowInstance $instance,
        WorkflowStep $stepDefinition,
        string $comment
    ): WorkflowActionResult
    {
        $targetStepId = $stepDefinition->reject_to_step_id;
        $targetStep = WorkflowStep::findOrFail($targetStepId);

        // Mark all steps after target as 'pending' (reset)
        $instance->stepInstances()
            ->whereHas('workflowStep', fn($q) => $q->where('step_order', '>=', $targetStep->step_order))
            ->where('status', '!=', 'pending')
            ->update([
                'status' => 'pending',
                'approval_count' => 0,
                'rejection_count' => 0,
                'started_at' => null,
                'completed_at' => null,
                'deadline_at' => null,
                'escalated' => false,
            ]);

        // Find and re-activate target step instance
        $targetStepInstance = $instance->stepInstances()
            ->where('workflow_step_id', $targetStepId)
            ->first();

        $targetStepInstance->update(['status' => 'returned']);

        // Re-activate the target step
        $this->activateStep($instance, $targetStep);

        // Add revision comment to document
        $instance->document->update([
            'revision_notes' => $comment,
            'revision_from_step_id' => $instance->current_step_id,
        ]);
        $instance->document->increment('revision_count');

        return new WorkflowActionResult(
            action: 'rejected',
            outcome: 'returned_to_step',
            message: "Document returned to step: {$targetStep->name}"
        );
    }

    /**
     * Reject → kembali ke step sebelumnya
     */
    private function rejectToPrevious(
        WorkflowInstance $instance,
        WorkflowStepInstance $currentStep,
        string $comment
    ): WorkflowActionResult
    {
        // Find previous step
        $previousStepInstance = $instance->stepInstances()
            ->where('step_order', '<', $currentStep->step_order)
            ->orderBy('step_order', 'desc')
            ->first();

        if (!$previousStepInstance) {
            // No previous step, fallback to creator
            return $this->rejectToCreator($instance, $comment);
        }

        $previousStep = $previousStepInstance->workflowStep;

        // Reset current and re-activate previous
        $currentStep->update([
            'status' => 'pending',
            'approval_count' => 0,
            'rejection_count' => 0,
            'started_at' => null,
            'completed_at' => null,
        ]);

        $previousStepInstance->update(['status' => 'returned']);
        $this->activateStep($instance, $previousStep);

        $instance->document->update([
            'revision_notes' => $comment,
            'revision_from_step_id' => $instance->current_step_id,
        ]);
        $instance->document->increment('revision_count');

        return new WorkflowActionResult(
            action: 'rejected',
            outcome: 'returned_to_previous',
            message: "Document returned to step: {$previousStep->name}"
        );
    }

    /**
     * Cancel workflow entirely
     */
    private function cancelWorkflow(WorkflowInstance $instance, string $comment): WorkflowActionResult
    {
        $instance->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => auth()->id(),
            'cancel_reason' => $comment,
        ]);

        $instance->document->update(['status' => 'draft']);

        return new WorkflowActionResult(
            action: 'rejected',
            outcome: 'workflow_cancelled',
            message: 'Workflow cancelled, document returned to draft'
        );
    }
}
```

### 3.5 Step Resolver (Extended)

```php
class StepResolver
{
    /**
     * Resolve who should handle this step
     */
    public function resolveAssignees(WorkflowStep $step, Document $document): Collection
    {
        $assignees = match ($step->assignee_type) {
            // Specific user
            'user' => collect([User::find($step->assignee_user_id)])->filter(),

            // All users with specific role in document's company
            'role' => User::where('company_id', $document->company_id)
                ->where('office_id', $document->office_id)
                ->whereHas('roles', fn($q) => $q->where('role_id', $step->assignee_role_id))
                ->where('is_active', true)
                ->get(),

            // Head of the document's department
            'department_head' => collect([
                $document->department?->headUser
            ])->filter(),

            // Head of the document's section
            'section_head' => collect([
                $document->section?->headUser
            ])->filter(),

            // All users with specific position in document's dept/section
            'position' => User::where('company_id', $document->company_id)
                ->where('position_id', $step->assignee_position_id)
                ->where(function ($q) use ($document) {
                    $q->where('department_id', $document->department_id);
                    if ($document->section_id) {
                        $q->orWhere('section_id', $document->section_id);
                    }
                })
                ->where('is_active', true)
                ->get(),

            // All users in specific department
            'department' => User::where('department_id', $step->assignee_department_id)
                ->where('is_active', true)
                ->get(),

            // All users in specific section
            'section' => User::where('section_id', $step->assignee_section_id)
                ->where('is_active', true)
                ->get(),

            default => collect(),
        };

        if ($assignees->isEmpty()) {
            throw new WorkflowException(
                "No assignees found for step '{$step->name}' (type: {$step->assignee_type})"
            );
        }

        return $assignees;
    }
}
```

---

## 4. Re-submit After Revision

```php
public function resubmit(Document $document, User $user, ?string $comment): WorkflowInstance
{
    if ($document->status !== 'revision') {
        throw new WorkflowException('Document is not in revision status');
    }

    // Increment version
    $document->increment('minor_version');

    // Clear revision info
    $document->update([
        'revision_notes' => null,
        'revision_from_step_id' => null,
    ]);

    // Start a NEW workflow instance (iteration incremented, old stays for history)
    return $this->start($document);
}
```

---

## 5. OnlyOffice Callback Handler

```php
class OnlyOfficeCallbackController
{
    public function handle(Request $request): JsonResponse
    {
        $data = $request->all();

        return match ($data['status'] ?? 0) {
            2, 6 => $this->saveDocument($data),   // Ready / Force save
            1, 4 => response()->json(['error' => 0]), // Being edited / Closed no changes
            default => response()->json(['error' => 0]),
        };
    }

    private function saveDocument(array $data): JsonResponse
    {
        $documentKey = $data['key'];
        $downloadUrl = $data['url'];

        $document = Document::where('onlyoffice_key', $documentKey)->firstOrFail();

        // Download from OnlyOffice
        $fileContent = Http::get($downloadUrl)->body();

        // Build structured path: {company}/{module}/{category}/{year}/{month}/{doc_number}/
        $company = $document->company;
        $category = $document->category;
        $version = $document->current_version + 1;

        $basePath = sprintf(
            '%s/documents/%s/%d/%02d/%s',
            $company->code,
            $category->code,
            now()->year,
            now()->month,
            Str::slug($document->document_number)
        );
        $filePath = "{$basePath}/v{$version}.docx";
        $fileName = "v{$version}.docx";

        Storage::put($filePath, $fileContent);

        // Create version record
        DocumentVersion::create([
            'document_id' => $document->id,
            'version_number' => $version,
            'major_version' => $document->major_version,
            'minor_version' => $document->minor_version + 1,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => strlen($fileContent),
            'file_hash' => hash('sha256', $fileContent),
            'change_type' => 'edit',
            'source' => 'editor',
            'metadata_snapshot' => $document->metadata,
            'created_by' => $data['users'][0] ?? $document->created_by,
        ]);

        // Track in file_storage
        FileStorage::create([
            'company_id' => $document->company_id,
            'file_name' => $fileName,
            'original_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => strlen($fileContent),
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'file_hash' => hash('sha256', $fileContent),
            'module' => 'documents',
            'category_code' => $category->code,
            'storage_year' => now()->year,
            'storage_month' => now()->month,
            'entity_type' => 'document_version',
            'entity_id' => $document->id,
            'uploaded_by' => $data['users'][0] ?? $document->created_by,
        ]);

        // Update document
        $document->update([
            'current_version' => $version,
            'minor_version' => $document->minor_version + 1,
            'draft_file_path' => $filePath,
            'onlyoffice_key' => $documentKey . '_v' . $version,
        ]);

        AuditLogger::log('document.edited', $document);

        return response()->json(['error' => 0]);
    }
}
```

---

## 6. Template Processing (PHPWord)

```php
class TemplateService
{
    /**
     * Generate document from template with dynamic tag resolution
     */
    public function generateFromTemplate(
        DocumentTemplate $template,
        array $metadata,
        Document $document
    ): string
    {
        $templatePath = Storage::path($template->file_path);
        $processor = new TemplateProcessor($templatePath);

        // Get tag definitions
        $tags = $template->tags()->get();

        foreach ($tags as $tag) {
            $value = $this->resolveTagValue($tag, $metadata, $document);

            if ($tag->data_type === 'image' || $tag->data_type === 'signature') {
                if ($value && file_exists($value)) {
                    $dimensions = $this->parseImageDimensions($tag->format_pattern);
                    $processor->setImageValue($tag->tag_key, [
                        'path' => $value,
                        'width' => $dimensions['width'],
                        'height' => $dimensions['height'],
                    ]);
                }
            } elseif ($tag->data_type === 'table') {
                $this->processTableTag($processor, $tag, $value);
            } else {
                $formattedValue = $this->formatValue($value, $tag);
                $processor->setValue($tag->tag_key, $formattedValue);
            }
        }

        // Build structured output path
        $company = $document->company;
        $category = $document->category;
        $outputDir = sprintf(
            '%s/documents/%s/%d/%02d/%s',
            $company->code,
            $category->code,
            now()->year,
            now()->month,
            Str::slug($document->document_number)
        );

        $outputPath = storage_path("app/{$outputDir}/v1.docx");
        Storage::makeDirectory($outputDir);
        $processor->saveAs($outputPath);

        return "{$outputDir}/v1.docx";
    }

    /**
     * Resolve tag value based on source_type
     */
    private function resolveTagValue(TemplateTag $tag, array $metadata, Document $document): mixed
    {
        if (isset($metadata[$tag->tag_key])) {
            return $metadata[$tag->tag_key];
        }

        return match ($tag->source_type) {
            'current_user' => $this->resolveCurrentUser($tag),
            'auto_generate' => $this->resolveAutoGenerate($tag, $document),
            'database' => $this->resolveFromDatabase($tag, $document),
            'parent_doc' => $this->resolveFromParentDoc($tag, $document),
            default => $tag->default_value,
        };
    }

    private function resolveCurrentUser(TemplateTag $tag): ?string
    {
        $user = auth()->user();
        $field = $tag->source_config['field'] ?? 'name';

        return match ($field) {
            'name' => $user->name,
            'email' => $user->email,
            'employee_id' => $user->employee_id,
            'position' => $user->position?->name,
            'department' => $user->department?->name,
            'section' => $user->section?->name,
            'office' => $user->office?->name,
            default => null,
        };
    }

    private function formatValue(mixed $value, TemplateTag $tag): string
    {
        if (empty($value)) return $tag->default_value ?? '';

        return match ($tag->data_type) {
            'date' => Carbon::parse($value)->translatedFormat(
                $this->convertDateFormat($tag->format_pattern ?? 'dd MMMM yyyy')
            ),
            'number' => number_format((float)$value, 2, ',', '.'),
            default => match ($tag->format_pattern ?? '') {
                'UPPER' => strtoupper($value),
                'LOWER' => strtolower($value),
                'UCFIRST' => ucfirst($value),
                default => (string) $value,
            },
        };
    }

    /**
     * Insert signatures into final document
     */
    public function insertSignatures(Document $document): string
    {
        $filePath = Storage::path($document->draft_file_path);
        $processor = new TemplateProcessor($filePath);

        $instance = $document->workflowInstances()
            ->where('status', 'completed')
            ->latest()
            ->first();

        $approvedSteps = $instance->stepInstances()
            ->where('status', 'approved')
            ->with(['actions' => fn($q) => $q->where('action', 'approve'), 'actions.user.position'])
            ->get();

        // Get signature tags from template
        $signatureTags = $document->template->tags()
            ->where('data_type', 'signature')
            ->get();

        foreach ($signatureTags as $sigTag) {
            $linkedStep = $sigTag->signature_config['linked_step'] ?? null;

            // Find the matching approved step
            $matchingStep = $approvedSteps->first(function ($si) use ($linkedStep) {
                return $si->workflowStep->step_type === $linkedStep;
            });

            if (!$matchingStep) continue;

            $approveAction = $matchingStep->actions->where('action', 'approve')->first();
            if (!$approveAction) continue;

            $user = $approveAction->user;

            // Insert signature image
            if ($user->signature_path && Storage::exists($user->signature_path)) {
                $config = $sigTag->signature_config;
                $processor->setImageValue($sigTag->tag_key, [
                    'path' => Storage::path($user->signature_path),
                    'width' => $config['width'] ?? 100,
                    'height' => $config['height'] ?? 40,
                ]);
            }

            // Replace related name/position/date tags
            $prefix = str_replace('TTD_', '', $sigTag->tag_key);
            $processor->setValue("NAMA_{$prefix}", $user->name);
            $processor->setValue("JABATAN_{$prefix}", $user->position?->name ?? '');
            $processor->setValue("TANGGAL_{$prefix}", $approveAction->created_at->translatedFormat('d F Y'));
        }

        // Save signed document
        $company = $document->company;
        $category = $document->category;
        $signedPath = sprintf(
            '%s/documents/%s/%d/%02d/%s/v%d-signed.docx',
            $company->code,
            $category->code,
            now()->year,
            now()->month,
            Str::slug($document->document_number),
            $document->current_version
        );

        Storage::makeDirectory(dirname(storage_path("app/{$signedPath}")));
        $processor->saveAs(storage_path("app/{$signedPath}"));

        return $signedPath;
    }
}
```

---

## 7. Deadline Checker (Scheduled Job)

```php
// app/Jobs/CheckDeadlines.php
// Scheduled: php artisan schedule:run (cron: every hour)

class CheckDeadlines implements ShouldQueue
{
    public function handle(): void
    {
        // 1. Warning: H-1 deadline
        $warningSteps = WorkflowStepInstance::where('status', 'active')
            ->whereNotNull('deadline_at')
            ->whereBetween('deadline_at', [now(), now()->addDay()])
            ->get();

        foreach ($warningSteps as $step) {
            NotificationService::send($step->assigned_users, 'document.deadline', $step);
        }

        // 2. Overdue
        $overdueSteps = WorkflowStepInstance::where('status', 'active')
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '<', now())
            ->where('escalated', false)
            ->get();

        foreach ($overdueSteps as $step) {
            NotificationService::send($step->assigned_users, 'document.overdue', $step);

            // 3. Check escalation
            $stepDef = $step->workflowStep;
            if ($stepDef->escalation_action && $stepDef->escalation_after_days) {
                $escalateAt = Carbon::parse($step->deadline_at)
                    ->addWeekdays($stepDef->escalation_after_days);

                if (now()->gte($escalateAt)) {
                    $this->escalate($step, $stepDef);
                }
            }
        }
    }

    private function escalate(WorkflowStepInstance $step, WorkflowStep $stepDef): void
    {
        $step->update(['escalated' => true, 'escalated_at' => now()]);

        match ($stepDef->escalation_action) {
            'notify_head' => $this->notifyDepartmentHead($step),
            'notify_admin' => $this->notifyAdminCompany($step),
            'auto_approve' => $this->autoApproveStep($step),
        };
    }
}
```

---

## 8. PDF Conversion (Go Microservice)

```go
// Same as v1, converts .docx → .pdf via OnlyOffice Conversion API or LibreOffice

type ConvertRequest struct {
    InputPath    string `json:"input_path"`
    OutputPath   string `json:"output_path"`
    OutputFormat string `json:"output_format"` // "pdf"
    Watermark    string `json:"watermark"`      // "CONTROLLED COPY", "MASTER COPY", ""
}
```

---

## 9. Audit Logger

```php
class AuditLogger
{
    public static function log(
        string $action,
        Model $entity,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): AuditLog
    {
        $user = auth()->user();

        return AuditLog::create([
            'company_id' => $user?->company_id ?? $entity->company_id ?? null,
            'office_id' => $user?->office_id ?? $entity->office_id ?? null,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'user_position' => $user?->position?->name,
            'action' => $action,
            'entity_type' => class_basename($entity),
            'entity_id' => $entity->id,
            'entity_name' => $entity->title ?? $entity->document_number ?? $entity->name ?? null,
            'description' => $description ?? self::generateDescription($action, $entity, $user),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }
}
```

---

## 10. Folder Structure (Laravel) v2

```
app/
├── Http/Controllers/
│   ├── Auth/
│   │   ├── LoginController.php
│   │   └── PasswordController.php
│   ├── CompanyController.php
│   ├── OfficeController.php            # NEW
│   ├── DepartmentController.php
│   ├── SectionController.php           # NEW
│   ├── PositionController.php          # NEW
│   ├── UserController.php
│   ├── RoleController.php
│   ├── DocumentCategoryController.php  # NEW
│   ├── DocumentTemplateController.php
│   ├── TemplateTagController.php       # NEW
│   ├── DocumentController.php
│   ├── DocumentCommentController.php
│   ├── DocumentDistributionController.php  # NEW
│   ├── WorkflowController.php
│   ├── WorkflowInstanceController.php
│   ├── OnlyOfficeController.php
│   ├── AuditLogController.php
│   ├── NotificationController.php
│   ├── DashboardController.php
│   └── DocumentNumberingController.php
├── Models/
│   ├── Company.php
│   ├── Office.php                      # NEW
│   ├── Department.php
│   ├── Section.php                     # NEW
│   ├── Position.php                    # NEW
│   ├── User.php
│   ├── Role.php
│   ├── Permission.php
│   ├── DocumentCategory.php            # NEW
│   ├── DocumentType.php
│   ├── DocumentTemplate.php
│   ├── TemplateTag.php                 # NEW
│   ├── Document.php
│   ├── DocumentVersion.php
│   ├── DocumentComment.php
│   ├── DocumentDistribution.php        # NEW
│   ├── Workflow.php
│   ├── WorkflowStep.php
│   ├── WorkflowInstance.php
│   ├── WorkflowStepInstance.php
│   ├── WorkflowAction.php
│   ├── AuditLog.php
│   ├── Notification.php
│   └── FileStorage.php
├── Services/
│   ├── Workflow/
│   │   ├── WorkflowService.php
│   │   ├── WorkflowEngine.php
│   │   ├── StepResolver.php
│   │   ├── RejectHandler.php           # NEW
│   │   ├── DelegationService.php       # NEW
│   │   ├── DeadlineService.php
│   │   └── WorkflowActionResult.php
│   ├── Document/
│   │   ├── DocumentService.php
│   │   ├── TemplateService.php
│   │   ├── TemplateTagService.php      # NEW
│   │   ├── NumberingService.php
│   │   ├── SignatureService.php
│   │   └── DistributionService.php     # NEW
│   ├── OnlyOffice/
│   │   ├── OnlyOfficeService.php
│   │   └── OnlyOfficeConfig.php
│   ├── Notification/
│   │   ├── NotificationService.php
│   │   └── EmailService.php
│   ├── Audit/
│   │   └── AuditLogger.php
│   └── FileStorageService.php
├── Jobs/
│   ├── SendEmailNotification.php
│   ├── ConvertDocumentToPdf.php
│   ├── CheckDeadlines.php
│   ├── ProcessEscalation.php           # NEW
│   └── CleanupTempFiles.php
└── ...

database/migrations/
├── 001_create_companies_table.php
├── 002_create_offices_table.php        # NEW
├── 003_create_departments_table.php
├── 004_create_sections_table.php       # NEW
├── 005_create_positions_table.php      # NEW
├── 006_create_roles_table.php
├── 007_create_users_table.php
├── 008_create_user_roles_table.php
├── 009_create_permissions_table.php
├── 010_create_role_permissions_table.php
├── 011_create_document_categories_table.php  # NEW
├── 012_create_document_types_table.php
├── 013_create_document_templates_table.php
├── 014_create_template_tags_table.php        # NEW
├── 015_create_document_numbering_table.php
├── 016_create_documents_table.php
├── 017_create_document_versions_table.php
├── 018_create_document_tags_table.php
├── 019_create_document_relations_table.php
├── 020_create_document_distributions_table.php  # NEW
├── 021_create_workflows_table.php
├── 022_create_workflow_steps_table.php
├── 023_create_workflow_instances_table.php
├── 024_create_workflow_step_instances_table.php
├── 025_create_workflow_actions_table.php
├── 026_create_document_comments_table.php
├── 027_create_audit_logs_table.php
├── 028_create_notifications_table.php
├── 029_create_notification_preferences_table.php
├── 030_create_file_storage_table.php
├── 031_create_system_settings_table.php
└── 032_create_personal_access_tokens_table.php
```

---

## 11. React Frontend Structure v2

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
│   │   ├── DistributionPanel.tsx       # NEW
│   │   ├── RejectDialog.tsx            # With on_reject_action info
│   │   ├── ApproveDialog.tsx           # With optional/required comment
│   │   ├── DelegateDialog.tsx          # NEW
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
├── organizations/                      # NEW
│   ├── OfficeListPage.tsx
│   ├── OfficeFormPage.tsx
│   ├── SectionManager.tsx
│   ├── PositionListPage.tsx
│   ├── PositionFormPage.tsx
│   ├── OrgTreeView.tsx                 # Visual org structure
│   └── organizationApi.ts
├── categories/                         # NEW
│   ├── CategoryListPage.tsx
│   ├── CategoryFormPage.tsx
│   └── categoryApi.ts
└── ...
```
