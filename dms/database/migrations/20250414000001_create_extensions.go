package migrations

import (
	"dms/app/facades"
)

type M20250414000001CreateExtensions struct{}

func (r *M20250414000001CreateExtensions) Signature() string {
	return "20250414000001_create_extensions"
}

func (r *M20250414000001CreateExtensions) Up() error {
	if _, err := facades.Orm().Query().Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`); err != nil {
		return err
	}
	if _, err := facades.Orm().Query().Exec(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`); err != nil {
		return err
	}
	return nil
}

func (r *M20250414000001CreateExtensions) Down() error {
	return nil
}
