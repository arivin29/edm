package migrations

import (
	"dms/app/facades"
)

type M20250423000020AddOcrTextToFileStorage struct{}

func (m *M20250423000020AddOcrTextToFileStorage) Signature() string {
	return "20250423000020_add_ocr_text_to_file_storage"
}

func (m *M20250423000020AddOcrTextToFileStorage) Up() error {
	_, err := facades.Orm().Query().Exec(
		`ALTER TABLE file_storage ADD COLUMN IF NOT EXISTS ocr_text TEXT`)
	return err
}

func (m *M20250423000020AddOcrTextToFileStorage) Down() error {
	_, err := facades.Orm().Query().Exec(
		`ALTER TABLE file_storage DROP COLUMN IF EXISTS ocr_text`)
	return err
}
