package middleware

import (
	"github.com/goravel/framework/contracts/http"

	"dms/app/types"
)

// DataScope sets scope filters in context based on the user's highest role.
// super_admin      → no filter (all companies)
// admin_company    → filter by company_id
// admin_office     → filter by company_id + office_id
// default          → filter by company_id + office_id + department_id + section_id
func DataScope() http.Middleware {
	return func(ctx http.Context) {
		user := types.GetCurrentUser(ctx)
		if user == nil {
			ctx.Request().AbortWithStatusJson(http.StatusUnauthorized, http.Json{
				"error": "Unauthorized",
			})
			return
		}

		role := highestRole(user.Roles)

		switch role {
		case "super_admin":
			// nil means no filter — access to all
			ctx.WithValue("scope_company_ids", nil)
			ctx.WithValue("scope_office_ids", nil)
			ctx.WithValue("scope_department_ids", nil)
			ctx.WithValue("scope_section_ids", nil)

		case "admin_company":
			ctx.WithValue("scope_company_ids", []string{user.CompanyID})
			ctx.WithValue("scope_office_ids", nil)
			ctx.WithValue("scope_department_ids", nil)
			ctx.WithValue("scope_section_ids", nil)

		case "admin_office":
			ctx.WithValue("scope_company_ids", []string{user.CompanyID})
			ctx.WithValue("scope_office_ids", []string{user.OfficeID})
			ctx.WithValue("scope_department_ids", nil)
			ctx.WithValue("scope_section_ids", nil)

		default:
			ctx.WithValue("scope_company_ids", []string{user.CompanyID})
			ctx.WithValue("scope_office_ids", []string{user.OfficeID})

			if user.DepartmentID != nil {
				ctx.WithValue("scope_department_ids", []string{*user.DepartmentID})
			} else {
				ctx.WithValue("scope_department_ids", nil)
			}

			if user.SectionID != nil {
				ctx.WithValue("scope_section_ids", []string{*user.SectionID})
			} else {
				ctx.WithValue("scope_section_ids", nil)
			}
		}

		ctx.Request().Next()
	}
}

// highestRole returns the most privileged role from the list.
func highestRole(roles []string) string {
	priority := map[string]int{
		"super_admin":   4,
		"admin_company": 3,
		"admin_office":  2,
	}

	best := ""
	bestPriority := -1
	for _, r := range roles {
		if p, ok := priority[r]; ok && p > bestPriority {
			best = r
			bestPriority = p
		}
	}

	if best == "" {
		return "default"
	}
	return best
}
