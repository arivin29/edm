# DMS Roles & Access Patterns

---

## 1. System Roles

| # | Role | Display Name | Scope | Deskripsi |
|---|------|-------------|-------|-----------|
| 1 | `super_admin` | Super Admin | **All Companies** | Full access seluruh sistem. Manage companies, users, settings global. |
| 2 | `admin_company` | Admin Company | **1 Company** | Admin untuk 1 perusahaan. Manage offices, departments, users, templates, workflows. |
| 3 | `admin_office` | Admin Kantor | **1 Office** | Admin untuk 1 kantor. Manage departments, sections, users di kantor tersebut. |
| 4 | `creator` | Document Creator | **Own Dept/Section** | Membuat dokumen, mengisi template, submit ke workflow. |
| 5 | `reviewer` | Reviewer | **Assigned Documents** | Me-review dokumen, memberikan comment, track changes. |
| 6 | `approver` | Approver | **Assigned Documents** | Approve/reject dokumen dalam workflow. |
| 7 | `viewer` | Viewer | **Distributed Documents** | Hanya bisa melihat dokumen final yang sudah didistribusikan. |

> **Note:** Satu user bisa punya **multiple roles**. Contoh: Manager QMS bisa jadi `creator` + `reviewer` + `approver`.

---

## 2. Permission Matrix (Role × Permission)

### 2.1 Document Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `document.create` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `document.edit` | ✅ | ✅ | ✅ | ✅ own | ✅ assigned | ❌ | ❌ |
| `document.view` | ✅ all | ✅ company | ✅ office | ✅ own+dept | ✅ assigned | ✅ assigned | ✅ distributed |
| `document.delete` | ✅ | ✅ | ✅ office | ✅ own draft | ❌ | ❌ | ❌ |
| `document.download` | ✅ | ✅ | ✅ | ✅ own | ✅ assigned | ✅ assigned | ✅ distributed |
| `document.submit` | ✅ | ✅ | ✅ | ✅ own | ❌ | ❌ | ❌ |
| `document.review` | ✅ | ✅ | ❌ | ❌ | ✅ assigned | ❌ | ❌ |
| `document.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ assigned | ❌ |
| `document.reject` | ✅ | ✅ | ❌ | ❌ | ✅ assigned | ✅ assigned | ❌ |
| `document.finalize` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ last step | ❌ |
| `document.archive` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `document.distribute` | ✅ | ✅ | ✅ | ✅ own final | ❌ | ❌ | ❌ |

### 2.2 Template Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `template.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `template.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `template.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `template.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.3 Workflow Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `workflow.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workflow.edit` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `workflow.view` | ✅ | ✅ | ✅ | ✅ own | ✅ assigned | ✅ assigned | ❌ |
| `workflow.delete` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.4 User Management Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `user.create` | ✅ | ✅ company | ✅ office | ❌ | ❌ | ❌ | ❌ |
| `user.edit` | ✅ | ✅ company | ✅ office | ❌ self | ❌ self | ❌ self | ❌ self |
| `user.view` | ✅ all | ✅ company | ✅ office | ✅ dept | ✅ dept | ✅ dept | ❌ |
| `user.delete` | ✅ | ✅ company | ✅ office | ❌ | ❌ | ❌ | ❌ |
| `user.assign_role` | ✅ | ✅ company | ✅ office | ❌ | ❌ | ❌ | ❌ |

### 2.5 Organization Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `company.create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `company.edit` | ✅ | ✅ own | ❌ | ❌ | ❌ | ❌ | ❌ |
| `company.view` | ✅ all | ✅ own | ✅ own | ✅ own | ✅ own | ✅ own | ✅ own |
| `office.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `office.edit` | ✅ | ✅ | ✅ own | ❌ | ❌ | ❌ | ❌ |
| `office.view` | ✅ all | ✅ company | ✅ own | ✅ own | ✅ own | ✅ own | ✅ own |

### 2.6 Audit & Notification Module

| Permission | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| `audit.view` | ✅ all | ✅ company | ✅ office | ✅ own docs | ✅ own actions | ✅ own actions | ❌ |
| `audit.export` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `notification.manage` | ✅ | ✅ | ✅ | ✅ self | ✅ self | ✅ self | ✅ self |

---

## 3. Data Scope Pattern

Setiap role memiliki **scope data** yang berbeda. Backend harus enforce scope ini di setiap query.

```
┌─────────────────────────────────────────────────────────────┐
│                      super_admin                             │
│  Scope: ALL companies, ALL offices, ALL data                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  admin_company                          │  │
│  │  Scope: 1 company, ALL offices in company               │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │              admin_office                         │   │  │
│  │  │  Scope: 1 office, ALL depts in office             │   │  │
│  │  │                                                   │   │  │
│  │  │  ┌─────────────────────────────────────────────┐  │   │  │
│  │  │  │  creator / reviewer / approver               │  │   │  │
│  │  │  │  Scope: own dept/section + assigned docs      │  │   │  │
│  │  │  │                                              │  │   │  │
│  │  │  │  ┌───────────────────────────────────────┐   │  │   │  │
│  │  │  │  │  viewer                                │   │  │   │  │
│  │  │  │  │  Scope: distributed docs only          │   │  │   │  │
│  │  │  │  └───────────────────────────────────────┘   │  │   │  │
│  │  │  └─────────────────────────────────────────────┘  │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Go Middleware — Data Scope

```go
// middleware/scope.go

// CompanyScopeMiddleware — inject company filter ke context
func CompanyScopeMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        user := auth.GetCurrentUser(c)

        switch {
        case user.HasRole("super_admin"):
            // No scope filter — access all companies
            c.Set("scope_company_ids", nil) // nil = all

        case user.HasRole("admin_company"):
            c.Set("scope_company_ids", []uuid.UUID{user.CompanyID})

        case user.HasRole("admin_office"):
            c.Set("scope_company_ids", []uuid.UUID{user.CompanyID})
            c.Set("scope_office_ids", []uuid.UUID{user.OfficeID})

        default:
            // creator, reviewer, approver, viewer
            c.Set("scope_company_ids", []uuid.UUID{user.CompanyID})
            c.Set("scope_office_ids", []uuid.UUID{user.OfficeID})
            c.Set("scope_department_ids", []uuid.UUID{user.DepartmentID})
            if user.SectionID != nil {
                c.Set("scope_section_ids", []uuid.UUID{*user.SectionID})
            }
        }

        c.Next()
    }
}

// ApplyScope — GORM scope helper
func ApplyScope(c *gin.Context, db *gorm.DB, table string) *gorm.DB {
    if ids, ok := c.Get("scope_company_ids"); ok && ids != nil {
        db = db.Where(table+".company_id IN ?", ids)
    }
    if ids, ok := c.Get("scope_office_ids"); ok && ids != nil {
        db = db.Where(table+".office_id IN ?", ids)
    }
    if ids, ok := c.Get("scope_department_ids"); ok && ids != nil {
        db = db.Where(table+".department_id IN ?", ids)
    }
    return db
}
```

---

## 4. Workflow Role Pattern

Bagaimana role berinteraksi dalam document lifecycle:

```
                    ┌──────────────────────────────────────────────────┐
                    │              WORKFLOW LIFECYCLE                    │
                    │                                                   │
   CREATOR          │    REVIEWER           APPROVER          SIGNER    │
   ────────         │    ────────           ────────          ──────    │
                    │                                                   │
   Create doc  ─────┤                                                   │
   Fill template    │                                                   │
   Edit in          │                                                   │
   OnlyOffice       │                                                   │
   Submit ──────────┤──► Review doc    ──────────────────────────────── │
                    │    Comment                                        │
                    │    Track changes                                  │
                    │    ├── Forward ───────► Approve/Reject             │
                    │    └── Reject ────┐     ├── Approve ────► Sign    │
                    │                   │     │                 │       │
                    │                   │     └── Reject ──┐    │       │
   ◄── Revise ──────┤◄──────────────────┘◄─────────────────┘    │       │
   Fix & resubmit   │                                           │       │
                    │                          Embed signature ─┘       │
                    │                          Generate PDF              │
                    │                          FINAL ───────────────────│
                    │                                                   │
   VIEWER           │                                                   │
   ──────           │                                                   │
   View final  ◄────┤◄── Distribute ◄── Creator/Admin                  │
   Download PDF     │                                                   │
   Acknowledge      │                                                   │
                    └──────────────────────────────────────────────────┘
```

### Step Type × Role Mapping

| Step Type | Typical Role | Can Edit Doc | Can Comment | Can Approve | Can Reject | Signature |
|-----------|-------------|:------------:|:-----------:|:-----------:|:----------:|:---------:|
| `review` | reviewer | ✅ (if configured) | ✅ | ✅ (forward) | ✅ | ❌ |
| `approve` | approver | ❌ | ✅ (optional) | ✅ | ✅ | ❌ |
| `sign` | approver (senior) | ❌ | ❌ | ✅ | ✅ | ✅ embed |
| `acknowledge` | viewer / any | ❌ | ❌ | ✅ (ack only) | ❌ | ❌ |

---

## 5. UI Visibility Pattern

### 5.1 Sidebar Navigation per Role

| Menu Item | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|-----------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| → Create New | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| → My Documents | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| → Pending Review | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| → Pending Approval | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| → All Documents | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| → Distributed to Me | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Workflows | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Organization | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| → Companies | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| → Offices | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| → Departments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| → Sections | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| → Positions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| My Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 5.2 Dashboard Widgets per Role

| Widget | super_admin | admin_company | admin_office | creator | reviewer | approver | viewer |
|--------|:-----------:|:-------------:|:------------:|:-------:|:--------:|:--------:|:------:|
| Stats Overview (all) | ✅ | ✅ company | ✅ office | ❌ | ❌ | ❌ | ❌ |
| My Documents Stats | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Pending Review Queue | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Pending Approval Queue | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Quick Actions | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Recent Documents | ✅ | ✅ | ✅ | ✅ own | ✅ assigned | ✅ assigned | ✅ distributed |
| Documents Due Review | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| SLA Performance | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| User Activity | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Health | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Go Backend — Auth & RBAC Pattern

### 6.1 Auth Middleware

```go
// middleware/auth.go

func AuthMiddleware(db *gorm.DB, jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Extract token from Authorization header
        tokenStr := extractBearerToken(c)
        if tokenStr == "" {
            c.AbortWithStatusJSON(401, ErrorResponse("Token required"))
            return
        }

        // 2. Parse & validate JWT
        claims, err := jwt.ParseToken(tokenStr, jwtSecret)
        if err != nil {
            c.AbortWithStatusJSON(401, ErrorResponse("Invalid or expired token"))
            return
        }

        // 3. Load user with roles & permissions (langsung dari DB, tanpa cache)
        user, err := loadUserWithPermissions(c, db, claims.UserID)
        if err != nil || !user.IsActive {
            c.AbortWithStatusJSON(401, ErrorResponse("User not found or inactive"))
            return
        }

        // 4. Set user in context
        c.Set("current_user", user)
        c.Set("company_id", user.CompanyID)
        c.Set("office_id", user.OfficeID)

        c.Next()
    }
}

// loadUserWithPermissions — query DB setiap request (no cache)
// Query: users → user_roles → roles → role_permissions → permissions
// Keuntungan: perubahan role/permission langsung efektif tanpa delay
func loadUserWithPermissions(ctx context.Context, db *gorm.DB, userID uuid.UUID) (*UserContext, error) {
    var user model.User
    err := db.WithContext(ctx).
        Preload("UserRoles.Role.RolePermissions.Permission").
        First(&user, "id = ? AND is_active = TRUE AND deleted_at IS NULL", userID).Error
    if err != nil {
        return nil, err
    }

    // Extract unique role names & permission names
    roleNames := make([]string, 0)
    permSet := make(map[string]bool)
    for _, ur := range user.UserRoles {
        roleNames = append(roleNames, ur.Role.Name)
        for _, rp := range ur.Role.RolePermissions {
            permSet[rp.Permission.Name] = true
        }
    }
    permissions := make([]string, 0, len(permSet))
    for p := range permSet {
        permissions = append(permissions, p)
    }

    return &UserContext{
        ID:           user.ID,
        CompanyID:    user.CompanyID,
        OfficeID:     user.OfficeID,
        DepartmentID: user.DepartmentID,
        SectionID:    user.SectionID,
        Roles:        roleNames,
        Permissions:  permissions,
        IsActive:     user.IsActive,
    }, nil
}
```

### 6.2 RBAC Middleware (Permission-Based, Fully Dynamic)

> **Prinsip:** Tidak ada `RequireRole()` — semua check berbasis **permission** yang di-mapping ke role di database. Admin bisa buat role baru + assign permissions dari UI tanpa perlu deploy ulang.

```go
// middleware/rbac.go

// RequirePermission — check if user has specific permission (dari DB via role_permissions)
func RequirePermission(permission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        user := GetCurrentUser(c)
        if !user.HasPermission(permission) {
            c.AbortWithStatusJSON(403, ErrorResponse("Insufficient permission: " + permission))
            return
        }
        c.Next()
    }
}

// RequireAny — check if user has ANY of the specified permissions
func RequireAny(permissions ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        user := GetCurrentUser(c)
        for _, p := range permissions {
            if user.HasPermission(p) {
                c.Next()
                return
            }
        }
        c.AbortWithStatusJSON(403, ErrorResponse("Insufficient permission"))
    }
}

// RequireAll — check if user has ALL of the specified permissions
func RequireAll(permissions ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        user := GetCurrentUser(c)
        for _, p := range permissions {
            if !user.HasPermission(p) {
                c.AbortWithStatusJSON(403, ErrorResponse("Insufficient permission: " + p))
                return
            }
        }
        c.Next()
    }
}

// --- Helper on UserContext ---

func (u *UserContext) HasPermission(permission string) bool {
    for _, p := range u.Permissions {
        if p == permission {
            return true
        }
    }
    return false
}

func (u *UserContext) HasRole(role string) bool {
    for _, r := range u.Roles {
        if r == role {
            return true
        }
    }
    return false
}
```

> **Kapan pakai `HasRole()` di code?**
> Hanya di **business logic** (bukan middleware), contoh:
> - `CompanyScopeMiddleware`: perlu tahu scope hierarki → cek role
> - `DocumentAccessService.CanView()`: super_admin/admin bypass → cek role
>
> Tapi **route guard** selalu pakai `RequirePermission()` — fully dynamic.

### 6.3 Route Registration Pattern (Fully Permission-Based)

> Semua route guard menggunakan `RequirePermission` — **tidak ada `RequireRole`**.
> Role hanya di-cek di business logic (scope, access control), bukan di route level.

```go
// router/router.go

func SetupRoutes(r *gin.Engine, h *handler.Handlers, cfg *config.Config) {
    api := r.Group("/api/v1")

    // ── Public (no auth) ──
    auth := api.Group("/auth")
    {
        auth.POST("/login", h.Auth.Login)
        auth.POST("/forgot-password", h.Auth.ForgotPassword)
        auth.POST("/reset-password", h.Auth.ResetPassword)
    }

    // ── Authenticated ──
    secured := api.Group("")
    secured.Use(middleware.AuthMiddleware(cfg.DB, cfg.JWTSecret))
    secured.Use(middleware.CompanyScopeMiddleware())
    {
        // Auth
        secured.POST("/auth/logout", h.Auth.Logout)
        secured.POST("/auth/refresh", h.Auth.Refresh)
        secured.GET("/auth/me", h.Auth.Me)
        secured.PUT("/auth/password", h.Auth.ChangePassword)

        // ── Documents ──
        docs := secured.Group("/documents")
        {
            docs.GET("", middleware.RequirePermission("document.view"), h.Document.List)
            docs.POST("", middleware.RequirePermission("document.create"), h.Document.Create)
            docs.GET("/:id", middleware.RequirePermission("document.view"), h.Document.Get)
            docs.PUT("/:id", middleware.RequirePermission("document.edit"), h.Document.Update)
            docs.DELETE("/:id", middleware.RequirePermission("document.delete"), h.Document.Delete)
            docs.POST("/:id/submit", middleware.RequirePermission("document.submit"), h.Document.Submit)
            docs.POST("/:id/finalize", middleware.RequirePermission("document.finalize"), h.Document.Finalize)
            docs.POST("/:id/distribute", middleware.RequirePermission("document.distribute"), h.Document.Distribute)
            docs.GET("/:id/audit-logs", middleware.RequirePermission("audit.view"), h.Document.AuditLogs)
        }

        // ── Workflow Actions (on documents) ──
        docs.POST("/:id/approve", middleware.RequirePermission("document.approve"), h.Workflow.Approve)
        docs.POST("/:id/reject", middleware.RequirePermission("document.reject"), h.Workflow.Reject)
        docs.POST("/:id/review", middleware.RequirePermission("document.review"), h.Workflow.Review)
        docs.POST("/:id/comment", middleware.RequireAny("document.review", "document.approve"), h.Workflow.Comment)
        docs.POST("/:id/delegate", middleware.RequireAny("document.review", "document.approve"), h.Workflow.Delegate)

        // ── Templates ──
        templates := secured.Group("/templates")
        {
            templates.GET("", middleware.RequirePermission("template.view"), h.Template.List)
            templates.POST("", middleware.RequirePermission("template.create"), h.Template.Create)
            templates.GET("/:id", middleware.RequirePermission("template.view"), h.Template.Get)
            templates.PUT("/:id", middleware.RequirePermission("template.edit"), h.Template.Update)
            templates.DELETE("/:id", middleware.RequirePermission("template.delete"), h.Template.Delete)
        }

        // ── Workflow Config ──
        workflows := secured.Group("/workflows")
        {
            workflows.GET("", middleware.RequirePermission("workflow.view"), h.WorkflowConfig.List)
            workflows.POST("", middleware.RequirePermission("workflow.create"), h.WorkflowConfig.Create)
            workflows.GET("/:id", middleware.RequirePermission("workflow.view"), h.WorkflowConfig.Get)
            workflows.PUT("/:id", middleware.RequirePermission("workflow.edit"), h.WorkflowConfig.Update)
            workflows.DELETE("/:id", middleware.RequirePermission("workflow.delete"), h.WorkflowConfig.Delete)
        }

        // ── Users ──
        users := secured.Group("/users")
        {
            users.GET("", middleware.RequirePermission("user.view"), h.User.List)
            users.POST("", middleware.RequirePermission("user.create"), h.User.Create)
            users.GET("/:id", middleware.RequirePermission("user.view"), h.User.Get)
            users.PUT("/:id", middleware.RequirePermission("user.edit"), h.User.Update)
            users.DELETE("/:id", middleware.RequirePermission("user.delete"), h.User.Delete)
            users.POST("/:id/assign-role", middleware.RequirePermission("user.assign_role"), h.User.AssignRole)
        }

        // ── Organization ──
        secured.GET("/companies", middleware.RequirePermission("company.view"), h.Company.List)
        secured.POST("/companies", middleware.RequirePermission("company.create"), h.Company.Create)
        secured.PUT("/companies/:id", middleware.RequirePermission("company.edit"), h.Company.Update)

        secured.GET("/offices", middleware.RequirePermission("office.view"), h.Office.List)
        secured.POST("/offices", middleware.RequirePermission("office.create"), h.Office.Create)
        secured.PUT("/offices/:id", middleware.RequirePermission("office.edit"), h.Office.Update)

        secured.GET("/departments", middleware.RequirePermission("department.view"), h.Department.List)
        secured.POST("/departments", middleware.RequirePermission("department.create"), h.Department.Create)
        secured.PUT("/departments/:id", middleware.RequirePermission("department.edit"), h.Department.Update)

        secured.GET("/sections", middleware.RequirePermission("section.view"), h.Section.List)
        secured.POST("/sections", middleware.RequirePermission("section.create"), h.Section.Create)
        secured.PUT("/sections/:id", middleware.RequirePermission("section.edit"), h.Section.Update)

        secured.GET("/positions", middleware.RequirePermission("position.view"), h.Position.List)
        secured.POST("/positions", middleware.RequirePermission("position.create"), h.Position.Create)
        secured.PUT("/positions/:id", middleware.RequirePermission("position.edit"), h.Position.Update)

        // ── Audit Log ──
        secured.GET("/audit-logs", middleware.RequirePermission("audit.view"), h.Audit.List)
        secured.GET("/audit-logs/export", middleware.RequirePermission("audit.export"), h.Audit.Export)

        // ── Notifications ──
        secured.GET("/notifications", h.Notification.List)
        secured.PUT("/notifications/:id/read", h.Notification.MarkRead)
        secured.PUT("/notifications/read-all", h.Notification.MarkAllRead)
        secured.GET("/notifications/preferences", h.Notification.GetPreferences)
        secured.PUT("/notifications/preferences", h.Notification.UpdatePreferences)

        // ── Settings ──
        secured.GET("/settings", middleware.RequirePermission("setting.view"), h.Setting.List)
        secured.PUT("/settings/:key", middleware.RequirePermission("setting.edit"), h.Setting.Update)

        // ── WebSocket ──
        secured.GET("/ws", h.WebSocket.Connect)
    }

    // ── OnlyOffice Callback (verified by HMAC secret, not JWT) ──
    api.POST("/onlyoffice/callback", middleware.VerifyOnlyOfficeToken(cfg.OnlyOfficeSecret), h.OnlyOffice.Callback)

    // ── Health Check (public) ──
    api.GET("/health", h.Health.Check)

    // ── OpenAPI Spec (public) ──
    api.GET("/openapi.json", h.OpenAPI.Spec)
}
```

---

## 7. Angular Frontend — Guard Pattern

### 7.1 Auth Guard

```typescript
// guards/auth.guard.ts

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
```

### 7.2 Role Guard

```typescript
// guards/role.guard.ts

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const user = this.authService.getCurrentUser();

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const hasRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRole) {
      this.router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  }
}
```

### 7.3 Permission Guard

```typescript
// guards/permission.guard.ts

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermissions = route.data['permissions'] as string[];
    const user = this.authService.getCurrentUser();

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const hasPermission = requiredPermissions.some(p => user.permissions.includes(p));
    if (!hasPermission) {
      this.router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  }
}
```

### 7.4 Route Configuration with Guards

```typescript
// app.routes.ts

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    canActivate: [AuthGuard],
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },

      // Documents — all authenticated users
      { path: 'documents', component: DocumentListComponent },
      {
        path: 'documents/create',
        component: DocumentCreateComponent,
        canActivate: [PermissionGuard],
        data: { permissions: ['document.create'] }
      },
      { path: 'documents/:id', component: DocumentDetailComponent },

      // Templates — admin only
      {
        path: 'templates',
        component: TemplateListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['super_admin', 'admin_company'] }
      },

      // Workflows — admin only
      {
        path: 'workflows',
        component: WorkflowListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['super_admin', 'admin_company'] }
      },

      // Organization — admin only
      {
        path: 'organization',
        canActivate: [RoleGuard],
        data: { roles: ['super_admin', 'admin_company', 'admin_office'] },
        children: [
          { path: 'companies', component: CompanyListComponent, data: { roles: ['super_admin'] } },
          { path: 'offices', component: OfficeListComponent },
          { path: 'departments', component: DepartmentListComponent },
          { path: 'sections', component: SectionListComponent },
          { path: 'positions', component: PositionListComponent },
        ]
      },

      // Users — admin only
      {
        path: 'users',
        component: UserListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['super_admin', 'admin_company', 'admin_office'] }
      },

      // Audit — admin only
      {
        path: 'audit-logs',
        component: AuditLogComponent,
        canActivate: [PermissionGuard],
        data: { permissions: ['audit.view'] }
      },

      // Profile — all users
      { path: 'profile', component: ProfileComponent },
      { path: 'notifications', component: NotificationListComponent },
    ]
  },

  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', redirectTo: 'dashboard' }
];
```

### 7.5 Permission Directive (Template)

```typescript
// directives/has-permission.directive.ts

@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective implements OnInit {
  @Input('hasPermission') permission!: string;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user.permissions.includes(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Usage in template:
// <button *hasPermission="'document.create'" (click)="createDoc()">+ New Document</button>
```

### 7.6 Role Directive (Template)

```typescript
// directives/has-role.directive.ts

@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective implements OnInit {
  @Input('hasRole') roles!: string | string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    const roleList = Array.isArray(this.roles) ? this.roles : [this.roles];
    const hasRole = roleList.some(r => user.roles.includes(r));

    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Usage in template:
// <div *hasRole="['super_admin', 'admin_company']">Admin panel content</div>
```

---

## 8. Document Access Control — Business Rules

### 8.1 Siapa Bisa Lihat Dokumen?

```
Rule 1: DRAFT         → hanya creator (pembuat) + admin
Rule 2: IN_REVIEW     → creator + assigned reviewer/approver pada step aktif + admin
Rule 3: REVISION      → creator + admin
Rule 4: APPROVED      → creator + semua yg pernah terlibat workflow + admin
Rule 5: FINAL         → sesuai distribusi (distribution list) + admin
Rule 6: OBSOLETE      → admin only (bisa restore)
Rule 7: ARCHIVED      → admin only (read-only)
```

### 8.2 Siapa Bisa Edit Dokumen?

```
Rule 1: DRAFT         → creator only (via OnlyOffice)
Rule 2: IN_REVIEW     → reviewer yang step-nya can_edit=true (via OnlyOffice)
Rule 3: REVISION      → creator only (fix revisi, via OnlyOffice)
Rule 4: APPROVED      → nobody (locked)
Rule 5: FINAL         → nobody (locked, PDF generated)
```

### 8.3 Go Implementation — Document Access Check

```go
// service/document_access.go

type DocumentAccessService struct {
    db *gorm.DB
}

func (s *DocumentAccessService) CanView(user *model.User, doc *model.Document) bool {
    // Super admin & admin company → always
    if user.HasRole("super_admin") || user.HasRole("admin_company") {
        return true
    }

    // Admin office → same office
    if user.HasRole("admin_office") && user.OfficeID == doc.OfficeID {
        return true
    }

    switch doc.Status {
    case "draft", "revision":
        return doc.CreatedBy == user.ID

    case "in_review":
        return doc.CreatedBy == user.ID || s.isAssignedToActiveStep(user.ID, doc.ID)

    case "approved":
        return doc.CreatedBy == user.ID || s.wasInvolvedInWorkflow(user.ID, doc.ID)

    case "final":
        return doc.CreatedBy == user.ID ||
            s.wasInvolvedInWorkflow(user.ID, doc.ID) ||
            s.isInDistributionList(user, doc.ID)

    case "obsolete", "archived":
        return false // admin only (handled above)
    }
    return false
}

func (s *DocumentAccessService) CanEdit(user *model.User, doc *model.Document) bool {
    if doc.Status == "draft" || doc.Status == "revision" {
        return doc.CreatedBy == user.ID
    }
    if doc.Status == "in_review" {
        return s.isAssignedToActiveStepWithEdit(user.ID, doc.ID)
    }
    return false
}
```

---

## 9. Notification Trigger Pattern

Kapan notifikasi dikirim dan ke siapa:

| Event | Trigger | Recipients | Channel |
|-------|---------|------------|---------|
| Document submitted | Creator submit | Reviewer/Approver step 1 | WebSocket + Email |
| Step forwarded | Reviewer forward | Assignees of next step | WebSocket + Email |
| Document approved | All steps done | Creator | WebSocket + Email |
| Document rejected | Reviewer/Approver reject | Creator (+ previous steps if to_step) | WebSocket + Email |
| Comment added | Any user comments | Document participants | WebSocket |
| Deadline approaching | Scheduler (1 day before) | Active step assignees | WebSocket + Email |
| Deadline passed | Scheduler (overdue) | Active step assignees + escalation target | WebSocket + Email |
| Document finalized | Creator/Admin finalize | All workflow participants | WebSocket + Email |
| Document distributed | Admin distribute | Distribution targets | WebSocket + Email |
| Delegation | Reviewer/Approver delegate | Delegated user | WebSocket + Email |

---

## 10. Seed Data — Default Role × Permission Mapping

```sql
-- ============================================================
-- ROLE × PERMISSION MAPPING (to be inserted after roles & permissions)
-- ============================================================

-- Helper: get role and permission IDs
-- In migration, use subqueries or application-level seeding

-- super_admin → ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin';

-- admin_company → all except company.create
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin_company' AND p.name != 'company.create';

-- admin_office → document (CRUD + submit + archive + distribute), user (CRUD), org view, audit view
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'admin_office'
AND p.name IN (
    'document.create', 'document.edit', 'document.view', 'document.delete',
    'document.download', 'document.submit', 'document.archive', 'document.distribute',
    'template.view',
    'workflow.view',
    'user.create', 'user.edit', 'user.view', 'user.delete', 'user.assign_role',
    'company.view', 'office.view', 'office.edit',
    'department.create', 'department.edit', 'department.view',
    'section.create', 'section.edit', 'section.view',
    'position.view',
    'audit.view',
    'notification.manage'
);

-- creator → create, edit, view, delete (own), download, submit, distribute
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'creator'
AND p.name IN (
    'document.create', 'document.edit', 'document.view', 'document.delete',
    'document.download', 'document.submit', 'document.distribute',
    'template.view',
    'workflow.view',
    'company.view', 'office.view',
    'notification.manage'
);

-- reviewer → view, download, review, reject, comment
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'reviewer'
AND p.name IN (
    'document.view', 'document.download', 'document.review', 'document.reject',
    'template.view',
    'workflow.view',
    'company.view', 'office.view',
    'notification.manage'
);

-- approver → view, download, approve, reject, finalize
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'approver'
AND p.name IN (
    'document.view', 'document.download', 'document.approve', 'document.reject',
    'document.finalize',
    'template.view',
    'workflow.view',
    'company.view', 'office.view',
    'notification.manage'
);

-- viewer → view, download only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'viewer'
AND p.name IN (
    'document.view', 'document.download',
    'company.view', 'office.view',
    'notification.manage'
);
```

---

## 11. Summary — Role Hierarchy

```
super_admin         → God mode. Semua permission, semua company.
  └── admin_company → Manage 1 company: users, templates, workflows, documents.
       └── admin_office → Manage 1 office: users, departments, documents.
            ├── creator   → Buat & kelola dokumen sendiri.
            ├── reviewer  → Review dokumen yang di-assign.
            ├── approver  → Approve/reject dokumen yang di-assign.
            └── viewer    → Lihat dokumen final yang didistribusikan.
```

**Prinsip:**
1. **Least privilege** — user hanya dapat akses minimum yang dibutuhkan
2. **Scope isolation** — data di-filter berdasarkan company → office → department → section
3. **Role composable** — 1 user bisa punya banyak role (creator + reviewer + approver)
4. **Permission granular** — setiap action punya permission sendiri
5. **Workflow-driven** — akses review/approve ditentukan oleh workflow assignment, bukan hanya role
