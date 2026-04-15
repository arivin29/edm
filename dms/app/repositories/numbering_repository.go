package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type NumberingRepository interface {
	List(filters map[string]any) ([]models.DocumentNumbering, int64, error)
	FindByID(id string) (*models.DocumentNumbering, error)
	FindConfig(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (*models.DocumentNumbering, error)
	Create(dn *models.DocumentNumbering) error
	Update(dn *models.DocumentNumbering) error
	Delete(id string) error
	IncrementSequence(id string) (int, error)
	ResetSequence(id string) error
}

type numberingRepository struct{}

func NewNumberingRepository() NumberingRepository {
	return &numberingRepository{}
}

func (r *numberingRepository) List(filters map[string]any) ([]models.DocumentNumbering, int64, error) {
	page, perPage := paginationFromFilters(filters)
	offset := (page - 1) * perPage

	q := facades.Orm().Query()

	if companyID, ok := filters["company_id"].(string); ok && companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if documentTypeID, ok := filters["document_type_id"].(string); ok && documentTypeID != "" {
		q = q.Where("document_type_id = ?", documentTypeID)
	}

	count, err := q.Model(&models.DocumentNumbering{}).Count()
	if err != nil {
		return nil, 0, err
	}

	var items []models.DocumentNumbering
	if err := q.Order("created_at desc").Offset(offset).Limit(perPage).Get(&items); err != nil {
		return nil, 0, err
	}

	return items, count, nil
}

func (r *numberingRepository) FindByID(id string) (*models.DocumentNumbering, error) {
	var dn models.DocumentNumbering
	if err := facades.Orm().Query().Where("id = ?", id).First(&dn); err != nil {
		return nil, err
	}
	return &dn, nil
}

func (r *numberingRepository) FindConfig(companyID, documentTypeID string, categoryID, officeID, departmentID *string) (*models.DocumentNumbering, error) {
	// Fallback strategy: most specific to least specific
	type attempt struct {
		catID  *string
		offID  *string
		deptID *string
	}

	attempts := []attempt{
		{categoryID, officeID, departmentID},
		{categoryID, officeID, nil},
		{categoryID, nil, nil},
		{nil, nil, nil},
	}

	for _, a := range attempts {
		var dn models.DocumentNumbering
		q := facades.Orm().Query().
			Where("company_id = ?", companyID).
			Where("document_type_id = ?", documentTypeID)

		if a.catID != nil && *a.catID != "" {
			q = q.Where("category_id = ?", *a.catID)
		} else {
			q = q.Where("category_id IS NULL")
		}
		if a.offID != nil && *a.offID != "" {
			q = q.Where("office_id = ?", *a.offID)
		} else {
			q = q.Where("office_id IS NULL")
		}
		if a.deptID != nil && *a.deptID != "" {
			q = q.Where("department_id = ?", *a.deptID)
		} else {
			q = q.Where("department_id IS NULL")
		}

		if err := q.First(&dn); err == nil && dn.ID != "" {
			return &dn, nil
		}
	}

	return nil, nil
}

func (r *numberingRepository) Create(dn *models.DocumentNumbering) error {
	return facades.Orm().Query().Create(dn)
}

func (r *numberingRepository) Update(dn *models.DocumentNumbering) error {
	return facades.Orm().Query().Save(dn)
}

func (r *numberingRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.DocumentNumbering{})
	return err
}

func (r *numberingRepository) IncrementSequence(id string) (int, error) {
	var result struct {
		CurrentSequence int `gorm:"column:current_sequence"`
	}
	if err := facades.Orm().Query().Raw(
		"UPDATE document_numbering SET current_sequence = current_sequence + 1, updated_at = NOW() WHERE id = ? RETURNING current_sequence", id,
	).Scan(&result); err != nil {
		return 0, err
	}
	return result.CurrentSequence, nil
}

func (r *numberingRepository) ResetSequence(id string) error {
	_, err := facades.Orm().Query().Exec(
		"UPDATE document_numbering SET current_sequence = 0, last_reset_at = NOW(), updated_at = NOW() WHERE id = ?", id,
	)
	return err
}
