# DMS Frontend — Implementation Plan

> Angular 20 | Standalone Components | Zoneless | Custom UI

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Project Setup | ✅ Done | 100% |
| 2. Core Module | ⏳ Pending | 0% |
| 3. SCSS Foundation | ⏳ Pending | 0% |
| 4. Layout | ⏳ Pending | 0% |
| 5. Shared UI Components | ⏳ Pending | 0% |
| 6. Feature: Auth | ⏳ Pending | 0% |
| 7. Feature: Dashboard | ⏳ Pending | 0% |
| 8. Feature: Documents | ⏳ Pending | 0% |
| 9. Feature: Others | ⏳ Pending | 0% |
| 10. Testing & Polish | ⏳ Pending | 0% |

---

## Phase 1: Project Setup ✅

- [x] Create Angular 20 project (zoneless, standalone)
- [x] Install ng-openapi-gen
- [x] Generate API SDK from backend
- [x] Update package.json with `generate-api` script

**Files Created:**
- `src/app/api/` — Generated API services & models (147 files)

---

## Phase 2: Core Module

> Auth, guards, interceptors, dan services inti

### 2.1 Auth Service
- [ ] `src/app/core/auth/auth.service.ts`
  - Login, logout, refresh token
  - User state dengan signals
  - Permission & role checking
  - Local storage persistence

### 2.2 Guards
- [ ] `src/app/core/guards/auth.guard.ts` — Protect routes, redirect to login
- [ ] `src/app/core/guards/permission.guard.ts` — Check permission dari route data
- [ ] `src/app/core/guards/guest.guard.ts` — Redirect ke dashboard jika sudah login

### 2.3 Interceptors
- [ ] `src/app/core/interceptors/auth.interceptor.ts` — Attach JWT token
- [ ] `src/app/core/interceptors/error.interceptor.ts` — Handle HTTP errors, show toast
- [ ] `src/app/core/interceptors/loading.interceptor.ts` — Global loading state

### 2.4 Services
- [ ] `src/app/core/services/notification.service.ts` — Toast notifications
- [ ] `src/app/core/services/loading.service.ts` — Global loading spinner
- [ ] `src/app/core/services/storage.service.ts` — LocalStorage wrapper

### 2.5 Config
- [ ] `src/app/core/config/app.config.ts` — App-wide providers
- [ ] `src/environments/environment.ts` — API URL, dll
- [ ] `src/environments/environment.prod.ts` — Production config

**Deliverable:** Core standalone services siap dipakai di seluruh app

---

## Phase 3: SCSS Foundation

> Variables, utilities, dan base styles

### 3.1 Variables
- [ ] `src/styles/_variables.scss`
  - Colors (primary, success, danger, warning, gray scale)
  - Spacing (compact: 4px, 8px, 12px, 16px)
  - Typography (font sizes, weights)
  - Border radius, shadows
  - Z-index layers

### 3.2 Base Styles
- [ ] `src/styles/_reset.scss` — CSS reset/normalize
- [ ] `src/styles/_typography.scss` — Headings, text styles
- [ ] `src/styles/_buttons.scss` — Button variants
- [ ] `src/styles/_forms.scss` — Input, select, textarea
- [ ] `src/styles/_tables.scss` — Table base styles

### 3.3 Utilities
- [ ] `src/styles/_utilities.scss` — Spacing, display, flex helpers
- [ ] `src/styles/_responsive.scss` — Breakpoints, media query mixins

### 3.4 Main Entry
- [ ] `src/styles/styles.scss` — Import semua partials

**Deliverable:** Consistent styling foundation

---

## Phase 4: Layout

> Sidebar, header, main layout wrapper

### 4.1 Main Layout
- [ ] `src/app/layout/main-layout/main-layout.component.ts`
  - Sidebar + Header + Content area
  - Responsive (sidebar collapse di mobile)

### 4.2 Sidebar
- [ ] `src/app/layout/sidebar/sidebar.component.ts`
  - Menu items dari config
  - Collapsible submenus
  - Active state
  - Permission-based visibility
  - Collapse/expand toggle
- [ ] `src/app/layout/sidebar/menu-config.ts` — Menu structure

### 4.3 Header
- [ ] `src/app/layout/header/header.component.ts`
  - Logo / hamburger (mobile)
  - Search (optional)
  - Notifications dropdown
  - User dropdown (profile, logout)

### 4.4 Breadcrumb
- [ ] `src/app/layout/breadcrumb/breadcrumb.component.ts`
  - Auto-generate dari route

**Deliverable:** Working layout dengan navigation

---

## Phase 5: Shared UI Components

> Reusable components untuk semua features

### 5.1 Data Table (Priority: HIGH)
- [ ] `src/app/shared/components/data-table/data-table.component.ts`
  - Server-side pagination
  - Column sorting
  - Global search (debounce)
  - Column filters
  - Row selection (checkbox)
  - Row actions (dropdown)
  - Bulk actions
  - Export CSV/Excel
  - Column visibility toggle
  - Loading skeleton
  - Empty state
  - Responsive (scroll / card mode)

### 5.2 Drawer (Priority: HIGH)
- [ ] `src/app/shared/components/drawer/drawer.component.ts`
  - Slide dari kanan
  - Backdrop + close on click
  - Header, body, footer slots
  - Animation

### 5.3 Confirm Modal
- [ ] `src/app/shared/components/confirm-modal/confirm-modal.component.ts`
- [ ] `src/app/shared/services/confirm.service.ts`
  - Service-based invocation
  - Danger/warning/info types

### 5.4 Page Header
- [ ] `src/app/shared/components/page-header/page-header.component.ts`
  - Title, subtitle
  - Action buttons slot
  - Breadcrumb integration

### 5.5 Form Controls
- [ ] `src/app/shared/components/form-field/form-field.component.ts` — Wrapper with label + error
- [ ] `src/app/shared/components/input/input.component.ts`
- [ ] `src/app/shared/components/select/select.component.ts`
- [ ] `src/app/shared/components/textarea/textarea.component.ts`
- [ ] `src/app/shared/components/datepicker/datepicker.component.ts`
- [ ] `src/app/shared/components/file-upload/file-upload.component.ts`

### 5.6 Other Components
- [ ] `src/app/shared/components/status-badge/status-badge.component.ts`
- [ ] `src/app/shared/components/avatar/avatar.component.ts`
- [ ] `src/app/shared/components/empty-state/empty-state.component.ts`
- [ ] `src/app/shared/components/loading-spinner/loading-spinner.component.ts`
- [ ] `src/app/shared/components/icon/icon.component.ts` — SVG icon wrapper

### 5.7 Directives
- [ ] `src/app/shared/directives/has-permission.directive.ts`
- [ ] `src/app/shared/directives/has-role.directive.ts`
- [ ] `src/app/shared/directives/click-outside.directive.ts`
- [ ] `src/app/shared/directives/debounce-click.directive.ts`

### 5.8 Pipes
- [ ] `src/app/shared/pipes/date-format.pipe.ts`
- [ ] `src/app/shared/pipes/currency-idr.pipe.ts`
- [ ] `src/app/shared/pipes/truncate.pipe.ts`
- [ ] `src/app/shared/pipes/file-size.pipe.ts`

**Deliverable:** Complete UI component library

---

## Phase 6: Feature — Auth

> Login, forgot password, reset password

### 6.1 Pages
- [ ] `src/app/features/auth/login/login.component.ts`
  - Email + password form
  - Remember me
  - Forgot password link
  - Redirect to dashboard on success

- [ ] `src/app/features/auth/forgot-password/forgot-password.component.ts`
  - Email input
  - Send reset link

- [ ] `src/app/features/auth/reset-password/reset-password.component.ts`
  - New password + confirm
  - Token validation

### 6.2 Routing
- [ ] `src/app/features/auth/auth.routes.ts`

**Deliverable:** Working authentication flow

---

## Phase 7: Feature — Dashboard

> Overview, stats, quick actions

### 7.1 Pages
- [ ] `src/app/features/dashboard/dashboard.component.ts`
  - Stats cards (total documents, pending review, dll)
  - Recent documents widget
  - Pending tasks widget
  - Quick actions

### 7.2 Widgets
- [ ] `src/app/features/dashboard/widgets/stats-card/stats-card.component.ts`
- [ ] `src/app/features/dashboard/widgets/recent-documents/recent-documents.component.ts`
- [ ] `src/app/features/dashboard/widgets/pending-tasks/pending-tasks.component.ts`

### 7.3 Routing
- [ ] `src/app/features/dashboard/dashboard.routes.ts`

**Deliverable:** Informative dashboard

---

## Phase 8: Feature — Documents

> CRUD dokumen, workflow actions

### 8.1 Pages
- [ ] `src/app/features/documents/document-list/document-list.component.ts`
  - Data table dengan filters
  - Tabs: Semua, Draft, Review, Final
  - Quick view drawer

- [ ] `src/app/features/documents/document-form/document-form.component.ts`
  - Add/Edit dalam drawer
  - Template selection
  - Metadata fields
  - File upload

- [ ] `src/app/features/documents/document-detail/document-detail.component.ts`
  - Full page detail (route /:id)
  - Document info
  - Version history
  - Workflow status
  - Audit logs
  - Comments

- [ ] `src/app/features/documents/document-quick-view/document-quick-view.component.ts`
  - Drawer preview
  - Basic info
  - "Lihat Detail Lengkap" button

- [ ] `src/app/features/documents/document-editor/document-editor.component.ts`
  - OnlyOffice integration
  - Save callback

### 8.2 Services
- [ ] `src/app/features/documents/services/document-state.service.ts`
  - Local state management dengan signals

### 8.3 Routing
- [ ] `src/app/features/documents/documents.routes.ts`

**Deliverable:** Complete document management

---

## Phase 9: Feature — Others

> Remaining feature modules

### 9.1 Templates
- [ ] `src/app/features/templates/template-list/`
- [ ] `src/app/features/templates/template-form/`
- [ ] `src/app/features/templates/template-detail/`
- [ ] `src/app/features/templates/templates.routes.ts`

### 9.2 Workflows
- [ ] `src/app/features/workflows/workflow-list/`
- [ ] `src/app/features/workflows/workflow-form/`
- [ ] `src/app/features/workflows/workflow-detail/`
- [ ] `src/app/features/workflows/workflows.routes.ts`

### 9.3 Users
- [ ] `src/app/features/users/user-list/`
- [ ] `src/app/features/users/user-form/`
- [ ] `src/app/features/users/user-detail/`
- [ ] `src/app/features/users/users.routes.ts`

### 9.4 Roles
- [ ] `src/app/features/roles/role-list/`
- [ ] `src/app/features/roles/role-form/`
- [ ] `src/app/features/roles/role-permission-matrix/`
- [ ] `src/app/features/roles/roles.routes.ts`

### 9.5 Organization (Companies, Offices, Departments, Sections, Positions)
- [ ] `src/app/features/organization/companies/`
- [ ] `src/app/features/organization/offices/`
- [ ] `src/app/features/organization/departments/`
- [ ] `src/app/features/organization/sections/`
- [ ] `src/app/features/organization/positions/`
- [ ] `src/app/features/organization/organization.routes.ts`

### 9.6 Categories
- [ ] `src/app/features/categories/category-list/`
- [ ] `src/app/features/categories/category-form/`
- [ ] `src/app/features/categories/categories.routes.ts`

### 9.7 Audit Logs
- [ ] `src/app/features/audit-logs/audit-log-list/`
- [ ] `src/app/features/audit-logs/audit-log-detail/`
- [ ] `src/app/features/audit-logs/audit-logs.routes.ts`

### 9.8 Notifications
- [ ] `src/app/features/notifications/notification-list/`
- [ ] `src/app/features/notifications/notification-preferences/`
- [ ] `src/app/features/notifications/notifications.routes.ts`

### 9.9 Settings
- [ ] `src/app/features/settings/settings.component.ts`
- [ ] `src/app/features/settings/settings.routes.ts`

### 9.10 Profile
- [ ] `src/app/features/profile/profile.component.ts`
- [ ] `src/app/features/profile/change-password/`
- [ ] `src/app/features/profile/signature-upload/`
- [ ] `src/app/features/profile/profile.routes.ts`

**Deliverable:** All feature modules implemented

---

## Phase 10: Testing & Polish

### 10.1 Testing
- [ ] Unit tests untuk core services
- [ ] Component tests untuk shared components
- [ ] E2E tests untuk critical flows (login, document CRUD)

### 10.2 Polish
- [ ] Error handling review
- [ ] Loading states review
- [ ] Responsive testing (mobile, tablet, desktop)
- [ ] Performance optimization
- [ ] Accessibility (a11y) check

### 10.3 Documentation
- [ ] Update README.md
- [ ] Component usage examples
- [ ] Environment setup guide

**Deliverable:** Production-ready frontend

---

## Execution Order

### Sprint 1: Foundation (Week 1)
1. Phase 2: Core Module
2. Phase 3: SCSS Foundation
3. Phase 4: Layout

### Sprint 2: Components (Week 2)
4. Phase 5: Shared UI Components

### Sprint 3: Auth & Dashboard (Week 3)
5. Phase 6: Feature — Auth
6. Phase 7: Feature — Dashboard

### Sprint 4: Documents (Week 3-4)
7. Phase 8: Feature — Documents

### Sprint 5: Other Features (Week 4-5)
8. Phase 9: Feature — Others

### Sprint 6: Polish (Week 6)
9. Phase 10: Testing & Polish

---

## Commands Reference

```bash
# Development server
ng serve --port 4200

# Generate API SDK (run when backend changes)
npm run generate-api

# Build production
ng build --configuration production

# Run tests
ng test
```

---

## File Structure Target

```
src/app/
├── api/                    # ✅ Generated
├── core/
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── config/
├── shared/
│   ├── components/
│   ├── directives/
│   └── pipes/
├── layout/
│   ├── main-layout/
│   ├── sidebar/
│   ├── header/
│   └── breadcrumb/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── documents/
│   ├── templates/
│   ├── workflows/
│   ├── users/
│   ├── roles/
│   ├── organization/
│   ├── categories/
│   ├── audit-logs/
│   ├── notifications/
│   ├── settings/
│   └── profile/
├── app.ts
├── app.routes.ts
└── app.config.ts
```

---

*Last Updated: 2026-04-15*
