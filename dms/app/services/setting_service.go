package services

import (
	"errors"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
)

type SettingService struct {
	settingRepo repositories.SettingRepository
}

func NewSettingService() *SettingService {
	return &SettingService{
		settingRepo: repositories.NewSettingRepository(),
	}
}

func (s *SettingService) List(ctx http.Context) ([]models.SystemSetting, error) {
	filters := buildFilters(ctx, []string{"company_id", "office_id"})
	return s.settingRepo.List(filters)
}

func (s *SettingService) GetByKey(companyID, officeID *string, key string) (*models.SystemSetting, error) {
	return s.settingRepo.FindByKey(companyID, officeID, key)
}

func (s *SettingService) Upsert(setting *models.SystemSetting) error {
	if setting.Key == "" {
		return errors.New("key is required")
	}
	if setting.Type == "" {
		setting.Type = "string"
	}
	return s.settingRepo.Upsert(setting)
}

func (s *SettingService) Delete(id string) error {
	if _, err := s.settingRepo.FindByID(id); err != nil {
		return errors.New("setting not found")
	}
	return s.settingRepo.Delete(id)
}

// UpsertByKeyValue creates or updates a setting by key
func (s *SettingService) UpsertByKeyValue(companyID, officeID *string, key, value, valueType string) error {
	if valueType == "" {
		valueType = "string"
	}
	setting := &models.SystemSetting{
		CompanyID: companyID,
		OfficeID:  officeID,
		Key:       key,
		Value:     value,
		Type:      valueType,
	}
	return s.settingRepo.Upsert(setting)
}
