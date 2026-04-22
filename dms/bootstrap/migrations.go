package bootstrap

import (
	"github.com/goravel/framework/contracts/database/schema"

	"dms/database/migrations"
)

func Migrations() []schema.Migration {
	return []schema.Migration{
		&migrations.M20210101000001CreateJobsTable{},
		&migrations.M20250414000001CreateExtensions{},
		&migrations.M20250414000002CreateOrganizationTables{},
		&migrations.M20250414000003CreateUsersAndRbacTables{},
		&migrations.M20250414000004CreateDocumentTypesCategories{},
		&migrations.M20250414000005CreateTemplatesTables{},
		&migrations.M20250414000006CreateDocumentNumbering{},
		&migrations.M20250414000007CreateDocumentsTables{},
		&migrations.M20250414000008CreateWorkflowTables{},
		&migrations.M20250414000009CreateCommentsTable{},
		&migrations.M20250414000010CreateAuditLogsTable{},
		&migrations.M20250414000011CreateNotificationsTables{},
		&migrations.M20250414000012CreateFileStorageTable{},
		&migrations.M20250414000013CreateSystemSettingsTable{},
		&migrations.M20250414000014SeedDefaultData{},
		&migrations.M20250414000015SeedAdminUser{},
		&migrations.M20250414000016AddFulltextSearch{},
		&migrations.M20250414000017AddDocumentRelationsIndexes{},
		&migrations.M20250416000018FixWorkflowStepInstancesDeadline{},
		&migrations.M20250422000019AddClassificationToDocuments{},
	}
}
