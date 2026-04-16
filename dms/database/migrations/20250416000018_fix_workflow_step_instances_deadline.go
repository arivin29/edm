package migrations

import (
	"dms/app/facades"
)

type M20250416000018FixWorkflowStepInstancesDeadline struct{}

func (r *M20250416000018FixWorkflowStepInstancesDeadline) Signature() string {
	return "20250416000018_fix_workflow_step_instances_deadline"
}

func (r *M20250416000018FixWorkflowStepInstancesDeadline) Up() error {
	// The original migration created column as "deadline_at" but the model uses "deadline"
	// Add the "deadline" column if it doesn't exist, copying from deadline_at
	if _, err := facades.Orm().Query().Exec(`
		ALTER TABLE workflow_step_instances 
		ADD COLUMN IF NOT EXISTS deadline TIMESTAMP
	`); err != nil {
		return err
	}

	// Copy existing data from deadline_at to deadline
	if _, err := facades.Orm().Query().Exec(`
		UPDATE workflow_step_instances SET deadline = deadline_at WHERE deadline IS NULL AND deadline_at IS NOT NULL
	`); err != nil {
		return err
	}

	// Add index on deadline
	if _, err := facades.Orm().Query().Exec(`
		CREATE INDEX IF NOT EXISTS idx_wf_step_inst_deadline_col ON workflow_step_instances(deadline) WHERE status = 'active'
	`); err != nil {
		return err
	}

	return nil
}

func (r *M20250416000018FixWorkflowStepInstancesDeadline) Down() error {
	_, err := facades.Orm().Query().Exec(`ALTER TABLE workflow_step_instances DROP COLUMN IF EXISTS deadline`)
	return err
}
