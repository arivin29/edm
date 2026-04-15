package services

import (
	"encoding/json"
	"errors"

	"github.com/goravel/framework/contracts/http"

	"dms/app/models"
	"dms/app/repositories"
	"dms/app/types"
)

type AuditLogOptions struct {
	Action      string
	EntityType  string
	EntityID    string
	EntityName  string
	Description string
	OldValues   any
	NewValues   any
	Metadata    any
}

type AuditService interface {
	Log(ctx http.Context, opts AuditLogOptions) error
	List(filters map[string]any) ([]models.AuditLog, int64, error)
}

type auditService struct {
	auditRepo repositories.AuditRepository
	userRepo  repositories.UserRepository
}

func NewAuditService() AuditService {
	return &auditService{
		auditRepo: repositories.NewAuditRepository(),
		userRepo:  repositories.NewUserRepository(),
	}
}

func (s *auditService) Log(ctx http.Context, opts AuditLogOptions) error {
	user := types.GetCurrentUser(ctx)
	if user == nil {
		return errors.New("user context not found")
	}

	// Look up user name and email from DB
	var userName, userEmail *string
	if dbUser, err := s.userRepo.FindByID(user.ID); err == nil && dbUser != nil {
		userName = &dbUser.Name
		userEmail = &dbUser.Email
	}

	log := &models.AuditLog{
		CompanyID: &user.CompanyID,
		OfficeID:  &user.OfficeID,
		UserID:    &user.ID,
		UserName:  userName,
		UserEmail: userEmail,
		Action:    opts.Action,
		EntityType: opts.EntityType,
	}

	if opts.EntityID != "" {
		log.EntityID = &opts.EntityID
	}
	if opts.EntityName != "" {
		log.EntityName = &opts.EntityName
	}
	if opts.Description != "" {
		log.Description = &opts.Description
	}

	if opts.OldValues != nil {
		if b, err := json.Marshal(opts.OldValues); err == nil {
			s := string(b)
			log.OldValues = &s
		}
	}
	if opts.NewValues != nil {
		if b, err := json.Marshal(opts.NewValues); err == nil {
			s := string(b)
			log.NewValues = &s
		}
	}
	if opts.Metadata != nil {
		if b, err := json.Marshal(opts.Metadata); err == nil {
			s := string(b)
			log.Metadata = &s
		}
	}

	ip := ctx.Request().Ip()
	if ip != "" {
		log.IPAddress = &ip
	}
	ua := ctx.Request().Header("User-Agent")
	if ua != "" {
		log.UserAgent = &ua
	}

	return s.auditRepo.Create(log)
}

func (s *auditService) List(filters map[string]any) ([]models.AuditLog, int64, error) {
	return s.auditRepo.List(filters)
}
