package repositories

import (
	"dms/app/facades"
	"dms/app/models"
)

type SettingRepository interface {
	List(filters map[string]any) ([]models.SystemSetting, error)
	FindByID(id string) (*models.SystemSetting, error)
	FindByKey(companyID, officeID *string, key string) (*models.SystemSetting, error)
	GetByPrefix(companyID, officeID *string, prefix string) ([]models.SystemSetting, error)
	Upsert(setting *models.SystemSetting) error
	Delete(id string) error
}

type settingRepository struct{}

func NewSettingRepository() SettingRepository {
	return &settingRepository{}
}

func (r *settingRepository) FindByID(id string) (*models.SystemSetting, error) {
	var setting models.SystemSetting
	if err := facades.Orm().Query().Where("id = ?", id).First(&setting); err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *settingRepository) FindByKey(companyID, officeID *string, key string) (*models.SystemSetting, error) {
	var setting models.SystemSetting
	q := facades.Orm().Query()

	if companyID != nil && *companyID != "" {
		q = q.Where("company_id = ?", *companyID)
	} else {
		q = q.Where("company_id IS NULL")
	}
	if officeID != nil && *officeID != "" {
		q = q.Where("office_id = ?", *officeID)
	} else {
		q = q.Where("office_id IS NULL")
	}
	q = q.Where("key = ?", key)

	if err := q.First(&setting); err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *settingRepository) List(filters map[string]any) ([]models.SystemSetting, error) {
	q := facades.Orm().Query()

	if companyID, ok := filters["company_id"].(string); ok && companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if officeID, ok := filters["office_id"].(string); ok && officeID != "" {
		q = q.Where("office_id = ?", officeID)
	}
	if companyIDs, ok := filters["scope_company_ids"].([]string); ok && len(companyIDs) > 0 {
		q = q.Where("company_id IN ?", companyIDs)
	}

	var items []models.SystemSetting
	if err := q.Order("key asc").Get(&items); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *settingRepository) Upsert(setting *models.SystemSetting) error {
	// Try to find existing by unique key combo
	existing, _ := r.FindByKey(setting.CompanyID, setting.OfficeID, setting.Key)
	if existing != nil {
		setting.ID = existing.ID
		return facades.Orm().Query().Save(setting)
	}
	return facades.Orm().Query().Create(setting)
}

func (r *settingRepository) Delete(id string) error {
	_, err := facades.Orm().Query().Where("id = ?", id).Delete(&models.SystemSetting{})
	return err
}

func (r *settingRepository) GetByPrefix(companyID, officeID *string, prefix string) ([]models.SystemSetting, error) {
	q := facades.Orm().Query()

	if companyID != nil && *companyID != "" {
		q = q.Where("company_id = ?", *companyID)
	} else {
		q = q.Where("company_id IS NULL")
	}
	if officeID != nil && *officeID != "" {
		q = q.Where("office_id = ?", *officeID)
	} else {
		q = q.Where("office_id IS NULL")
	}

	var items []models.SystemSetting
	if err := q.Where("key LIKE ?", prefix+"%").Get(&items); err != nil {
		return nil, err
	}
	return items, nil
}
