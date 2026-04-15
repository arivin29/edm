# DMS Frontend — Angular 20 Technical Design

---

## 1. Project Overview

| Aspek | Nilai |
|-------|-------|
| **Framework** | Angular 20 |
| **Port** | 4200 (dev server) |
| **UI Components** | Custom (manual, responsive) — tidak pakai library |
| **State** | Services + Signals |
| **HTTP/API** | `ng-openapi-gen` (SDK dari OpenAPI JSON) |
| **Bahasa UI** | Bahasa Indonesia |
| **i18n** | Siap untuk multi-bahasa (nanti) |
| **Lokasi Project** | `/Users/arivin29macmini/Documents/DEVETEK/BMS/frontend` |

---

## 2. Design Principles

### 2.1 UI/UX Enterprise
- **Compact layout** — minim padding, minim whitespace
- **Dense tables** — banyak data per halaman
- **Light mode only** — tidak ada dark mode
- **Responsive** — berfungsi di desktop, tablet, mobile
- **Fast navigation** — breadcrumb, sidebar collapsible
- **Consistent** — pattern yang sama di semua module

### 2.2 Component Pattern
- **Tidak ada standalone component** — semua pakai NgModule
- **Lazy loading** — setiap feature module di-lazy load
- **1 component = 1 folder** — `.ts`, `.html`, `.scss`, `.spec.ts` dalam satu folder
- **Reusable shared components** — table, drawer, modal, form controls

### 2.3 Action Pattern

| Action | Komponen | Behavior |
|--------|----------|----------|
| **Add** | Drawer (kanan) | Form kosong, submit → create |
| **Edit** | Drawer (kanan) | Form prefilled, submit → update |
| **Delete** | Confirm Modal | Popup konfirmasi, confirm → delete |
| **Detail Simple** | Drawer (kanan) | Info ringkas + tombol "Lihat Detail Lengkap" |
| **Detail Full** | Router `/:id` | Page full dengan tabs, history, actions |

### 2.4 Flow Detail
```
Table List → Klik Row → Drawer "Quick View"
                         ├── Info ringkas (read-only)
                         ├── [Lihat Detail Lengkap] → navigate /:id
                         ├── [Edit] → switch ke mode edit drawer
                         └── [Close]
```

---

## 3. Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                          # Singleton services, guards, interceptors
│   │   │   ├── core.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts        # Login, logout, token management
│   │   │   │   ├── auth.guard.ts          # Route protection
│   │   │   │   └── auth.interceptor.ts    # Attach JWT to requests
│   │   │   ├── guards/
│   │   │   │   ├── permission.guard.ts    # Check permission
│   │   │   │   └── unsaved-changes.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── http-error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   └── services/
│   │   │       ├── notification.service.ts  # Toast notifications
│   │   │       ├── loading.service.ts
│   │   │       └── websocket.service.ts
│   │   │
│   │   ├── shared/                        # Shared module (exported to features)
│   │   │   ├── shared.module.ts
│   │   │   ├── components/
│   │   │   │   ├── data-table/
│   │   │   │   │   ├── data-table.component.ts
│   │   │   │   │   ├── data-table.component.html
│   │   │   │   │   ├── data-table.component.scss
│   │   │   │   │   └── data-table.types.ts
│   │   │   │   ├── drawer/
│   │   │   │   │   ├── drawer.component.ts
│   │   │   │   │   ├── drawer.component.html
│   │   │   │   │   └── drawer.component.scss
│   │   │   │   ├── confirm-modal/
│   │   │   │   │   ├── confirm-modal.component.ts
│   │   │   │   │   ├── confirm-modal.component.html
│   │   │   │   │   └── confirm-modal.component.scss
│   │   │   │   ├── page-header/
│   │   │   │   │   ├── page-header.component.ts
│   │   │   │   │   ├── page-header.component.html
│   │   │   │   │   └── page-header.component.scss
│   │   │   │   ├── breadcrumb/
│   │   │   │   ├── empty-state/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── status-badge/
│   │   │   │   ├── avatar/
│   │   │   │   ├── icon/
│   │   │   │   └── form-controls/
│   │   │   │       ├── input/
│   │   │   │       ├── select/
│   │   │   │       ├── datepicker/
│   │   │   │       ├── textarea/
│   │   │   │       ├── checkbox/
│   │   │   │       ├── radio/
│   │   │   │       ├── file-upload/
│   │   │   │       └── form-field/         # Wrapper with label, error
│   │   │   ├── directives/
│   │   │   │   ├── has-permission.directive.ts
│   │   │   │   ├── has-role.directive.ts
│   │   │   │   ├── click-outside.directive.ts
│   │   │   │   └── debounce-click.directive.ts
│   │   │   └── pipes/
│   │   │       ├── date-format.pipe.ts
│   │   │       ├── currency-idr.pipe.ts
│   │   │       ├── truncate.pipe.ts
│   │   │       ├── file-size.pipe.ts
│   │   │       └── safe-html.pipe.ts
│   │   │
│   │   ├── layout/                        # Main layout
│   │   │   ├── layout.module.ts
│   │   │   ├── main-layout/
│   │   │   │   ├── main-layout.component.ts
│   │   │   │   ├── main-layout.component.html
│   │   │   │   └── main-layout.component.scss
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   ├── sidebar.component.html
│   │   │   │   ├── sidebar.component.scss
│   │   │   │   └── menu-items.ts           # Menu config based on permissions
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── footer/
│   │   │   └── notification-dropdown/
│   │   │
│   │   ├── features/                      # Feature modules (lazy loaded)
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth-routing.module.ts
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.module.ts
│   │   │   │   ├── dashboard-routing.module.ts
│   │   │   │   ├── dashboard-page/
│   │   │   │   └── widgets/
│   │   │   │       ├── stats-card/
│   │   │   │       ├── pending-tasks/
│   │   │   │       ├── recent-documents/
│   │   │   │       └── chart-widget/
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── documents.module.ts
│   │   │   │   ├── documents-routing.module.ts
│   │   │   │   ├── document-list/
│   │   │   │   │   ├── document-list.component.ts
│   │   │   │   │   ├── document-list.component.html
│   │   │   │   │   └── document-list.component.scss
│   │   │   │   ├── document-form/          # Add + Edit (drawer)
│   │   │   │   │   ├── document-form.component.ts
│   │   │   │   │   ├── document-form.component.html
│   │   │   │   │   └── document-form.component.scss
│   │   │   │   ├── document-detail/        # Full page /:id
│   │   │   │   │   ├── document-detail.component.ts
│   │   │   │   │   ├── document-detail.component.html
│   │   │   │   │   └── document-detail.component.scss
│   │   │   │   ├── document-quick-view/    # Drawer preview
│   │   │   │   ├── document-editor/        # OnlyOffice integration
│   │   │   │   ├── document-workflow/      # Workflow status & actions
│   │   │   │   └── services/
│   │   │   │       └── document.service.ts
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── templates.module.ts
│   │   │   │   ├── templates-routing.module.ts
│   │   │   │   ├── template-list/
│   │   │   │   ├── template-form/
│   │   │   │   ├── template-detail/
│   │   │   │   └── template-tag-config/
│   │   │   │
│   │   │   ├── workflows/
│   │   │   │   ├── workflows.module.ts
│   │   │   │   ├── workflows-routing.module.ts
│   │   │   │   ├── workflow-list/
│   │   │   │   ├── workflow-form/
│   │   │   │   ├── workflow-detail/
│   │   │   │   └── workflow-step-editor/
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users-routing.module.ts
│   │   │   │   ├── user-list/
│   │   │   │   ├── user-form/
│   │   │   │   └── user-detail/
│   │   │   │
│   │   │   ├── roles/
│   │   │   │   ├── roles.module.ts
│   │   │   │   ├── roles-routing.module.ts
│   │   │   │   ├── role-list/
│   │   │   │   ├── role-form/
│   │   │   │   └── role-permission-matrix/
│   │   │   │
│   │   │   ├── organization/
│   │   │   │   ├── organization.module.ts
│   │   │   │   ├── organization-routing.module.ts
│   │   │   │   ├── companies/
│   │   │   │   │   ├── company-list/
│   │   │   │   │   ├── company-form/
│   │   │   │   │   └── company-detail/
│   │   │   │   ├── offices/
│   │   │   │   │   ├── office-list/
│   │   │   │   │   ├── office-form/
│   │   │   │   │   └── office-detail/
│   │   │   │   ├── departments/
│   │   │   │   │   ├── department-list/
│   │   │   │   │   ├── department-form/
│   │   │   │   │   └── department-detail/
│   │   │   │   ├── sections/
│   │   │   │   │   ├── section-list/
│   │   │   │   │   ├── section-form/
│   │   │   │   │   └── section-detail/
│   │   │   │   └── positions/
│   │   │   │       ├── position-list/
│   │   │   │       ├── position-form/
│   │   │   │       └── position-detail/
│   │   │   │
│   │   │   ├── categories/
│   │   │   │   ├── categories.module.ts
│   │   │   │   ├── categories-routing.module.ts
│   │   │   │   ├── category-list/
│   │   │   │   └── category-form/
│   │   │   │
│   │   │   ├── audit-logs/
│   │   │   │   ├── audit-logs.module.ts
│   │   │   │   ├── audit-logs-routing.module.ts
│   │   │   │   ├── audit-log-list/
│   │   │   │   └── audit-log-detail/
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   ├── notifications-routing.module.ts
│   │   │   │   ├── notification-list/
│   │   │   │   └── notification-preferences/
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── settings.module.ts
│   │   │   │   ├── settings-routing.module.ts
│   │   │   │   └── settings-page/
│   │   │   │
│   │   │   └── profile/
│   │   │       ├── profile.module.ts
│   │   │       ├── profile-routing.module.ts
│   │   │       ├── profile-page/
│   │   │       ├── change-password/
│   │   │       └── signature-upload/
│   │   │
│   │   ├── api/                           # Generated by ng-openapi-gen
│   │   │   ├── api.module.ts
│   │   │   ├── services/
│   │   │   │   ├── auth-api.service.ts
│   │   │   │   ├── documents-api.service.ts
│   │   │   │   ├── templates-api.service.ts
│   │   │   │   ├── workflows-api.service.ts
│   │   │   │   ├── users-api.service.ts
│   │   │   │   └── ...
│   │   │   └── models/
│   │   │       ├── user.ts
│   │   │       ├── document.ts
│   │   │       ├── template.ts
│   │   │       └── ...
│   │   │
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   └── app.component.ts
│   │
│   ├── assets/
│   │   ├── icons/                         # SVG icons
│   │   ├── images/
│   │   └── i18n/
│   │       └── id.json                    # Indonesian translations
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── styles/
│       ├── _variables.scss                # CSS variables, colors, spacing
│       ├── _typography.scss               # Font sizes, weights
│       ├── _compact.scss                  # Compact overrides
│       ├── _responsive.scss               # Media queries, breakpoints
│       ├── _forms.scss                    # Form styles
│       ├── _tables.scss                   # Table styles
│       ├── _buttons.scss                  # Button styles
│       ├── _utilities.scss                # Helper classes
│       └── styles.scss                    # Main entry point
│
├── angular.json
├── package.json
├── tsconfig.json
└── tsconfig.app.json
```

---

## 4. Shared Components Specification

### 4.1 Data Table Component

**Selector:** `app-data-table`

**Features:**
- Server-side pagination
- Column sorting (klik header, toggle asc/desc)
- Global search (debounce 300ms)
- Column filters (per kolom, type-aware: text, select, date-range)
- Extra filters (collapsible panel di atas table)
- Row selection (checkbox, select all)
- Row actions (dropdown: View, Edit, Delete, custom actions)
- Bulk actions (muncul saat ada selection)
- Export (CSV, Excel)
- Column visibility toggle
- Loading skeleton
- Empty state
- Responsive (horizontal scroll di mobile, atau card view)
- Sticky header
- Resizable columns (optional)

**Inputs:**
```typescript
@Input() columns: TableColumn[];           // Definisi kolom
@Input() data: any[];                      // Data rows
@Input() loading: boolean;
@Input() totalItems: number;               // Total untuk pagination
@Input() pageSize: number = 20;
@Input() pageSizeOptions: number[] = [10, 20, 50, 100];
@Input() showCheckbox: boolean = true;
@Input() showActions: boolean = true;
@Input() showSearch: boolean = true;
@Input() showFilters: boolean = true;
@Input() showExport: boolean = true;
@Input() showColumnToggle: boolean = true;
@Input() rowActions: RowAction[];          // Custom row actions
@Input() bulkActions: BulkAction[];        // Bulk action buttons
@Input() emptyMessage: string = 'Tidak ada data';
@Input() stickyHeader: boolean = true;
@Input() mobileMode: 'scroll' | 'card' = 'scroll';
```

**Outputs:**
```typescript
@Output() pageChange = new EventEmitter<PageEvent>();
@Output() sortChange = new EventEmitter<SortEvent>();
@Output() searchChange = new EventEmitter<string>();
@Output() filterChange = new EventEmitter<FilterEvent>();
@Output() rowClick = new EventEmitter<any>();
@Output() rowAction = new EventEmitter<{action: string, row: any}>();
@Output() selectionChange = new EventEmitter<any[]>();
@Output() bulkAction = new EventEmitter<{action: string, rows: any[]}>();
@Output() export = new EventEmitter<'csv' | 'excel'>();
```

**Column Definition:**
```typescript
interface TableColumn {
  key: string;                    // Field name di data
  label: string;                  // Header text
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'date-range' | 'number-range';
  filterOptions?: {value: any, label: string}[];  // Untuk select
  width?: string;                 // '100px', '20%'
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';      // Sticky column
  visible?: boolean;              // Default true
  template?: TemplateRef<any>;    // Custom cell template
  cellClass?: string | ((row: any) => string);
  format?: 'date' | 'datetime' | 'currency' | 'number' | 'boolean';
  formatOptions?: any;            // Date format, currency locale, etc
}

interface RowAction {
  key: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'danger' | 'warning';
  visible?: (row: any) => boolean;
  disabled?: (row: any) => boolean;
  permission?: string;            // Required permission to show
}

interface BulkAction {
  key: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'danger' | 'warning';
  confirmMessage?: string;        // Show confirm dialog if set
}
```

### 4.2 Drawer Component

**Selector:** `app-drawer`

**Features:**
- Slide dari kanan (default) atau kiri
- Backdrop dengan click-to-close (optional)
- Escape key to close
- Custom width
- Header dengan title + close button
- Footer dengan action buttons
- Body scrollable
- Nested drawer support
- Animation smooth

**Inputs:**
```typescript
@Input() visible: boolean = false;
@Input() title: string = '';
@Input() width: string = '500px';           // '500px', '50%', 'auto'
@Input() position: 'left' | 'right' = 'right';
@Input() showBackdrop: boolean = true;
@Input() closeOnBackdrop: boolean = true;
@Input() closeOnEscape: boolean = true;
@Input() showFooter: boolean = true;
@Input() loading: boolean = false;
```

**Outputs:**
```typescript
@Output() visibleChange = new EventEmitter<boolean>();
@Output() onClose = new EventEmitter<void>();
@Output() onOpen = new EventEmitter<void>();
```

**Content Projection:**
```html
<app-drawer [(visible)]="isOpen" title="Tambah Dokumen" width="600px">
  <!-- Body content -->
  <ng-container body>
    <form>...</form>
  </ng-container>
  
  <!-- Footer content (optional, custom buttons) -->
  <ng-container footer>
    <button class="btn btn-secondary" (click)="cancel()">Batal</button>
    <button class="btn btn-primary" (click)="save()">Simpan</button>
  </ng-container>
</app-drawer>
```

### 4.3 Confirm Modal Component

**Selector:** `app-confirm-modal`

**Features:**
- Centered modal
- Icon based on type (warning, danger, info, success)
- Title + message
- Cancel + Confirm buttons
- Loading state on confirm
- Keyboard support (Enter to confirm, Escape to cancel)

**Service-based Usage:**
```typescript
// confirm-modal.service.ts
@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  confirm(options: ConfirmOptions): Observable<boolean>;
  
  // Shortcuts
  delete(itemName: string): Observable<boolean>;
  warning(title: string, message: string): Observable<boolean>;
}

interface ConfirmOptions {
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  confirmText?: string;           // Default: 'Ya'
  cancelText?: string;            // Default: 'Batal'
  confirmColor?: 'primary' | 'danger';
}
```

**Usage:**
```typescript
// In component
this.confirmService.delete('Dokumen SOP-001').subscribe(confirmed => {
  if (confirmed) {
    this.documentService.delete(id).subscribe(...);
  }
});
```

### 4.4 Page Header Component

**Selector:** `app-page-header`

**Features:**
- Title + subtitle
- Breadcrumb
- Action buttons (kanan)
- Back button (optional)
- Responsive (buttons collapse ke dropdown di mobile)

**Inputs:**
```typescript
@Input() title: string;
@Input() subtitle?: string;
@Input() breadcrumbs: Breadcrumb[];
@Input() showBack: boolean = false;
@Input() backRoute?: string;
```

**Content Projection:**
```html
<app-page-header 
  title="Daftar Dokumen" 
  subtitle="Kelola semua dokumen"
  [breadcrumbs]="[{label: 'Home', route: '/'}, {label: 'Dokumen'}]">
  
  <ng-container actions>
    <button class="btn btn-primary" *hasPermission="'document.create'" (click)="add()">
      <i class="icon-plus"></i> Tambah Dokumen
    </button>
  </ng-container>
</app-page-header>
```

### 4.5 Form Field Component

**Selector:** `app-form-field`

**Features:**
- Label with required indicator
- Input slot
- Error message display
- Hint text
- Compact spacing

**Inputs:**
```typescript
@Input() label: string;
@Input() required: boolean = false;
@Input() hint?: string;
@Input() error?: string;               // Manual error
@Input() control?: AbstractControl;     // For reactive form integration
```

**Usage:**
```html
<app-form-field label="Nama Dokumen" [required]="true" [control]="form.get('name')">
  <input type="text" formControlName="name" class="form-input">
</app-form-field>
```

### 4.6 Status Badge Component

**Selector:** `app-status-badge`

**Features:**
- Color-coded badges
- Dot indicator (optional)
- Size variants

**Inputs:**
```typescript
@Input() status: string;
@Input() statusMap?: {[key: string]: {label: string, color: BadgeColor}};
@Input() size: 'sm' | 'md' = 'md';
@Input() showDot: boolean = true;

type BadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
```

**Default Status Map (Document):**
```typescript
const documentStatusMap = {
  'draft': { label: 'Draft', color: 'gray' },
  'in_review': { label: 'Dalam Review', color: 'blue' },
  'revision': { label: 'Revisi', color: 'yellow' },
  'approved': { label: 'Disetujui', color: 'green' },
  'final': { label: 'Final', color: 'green' },
  'obsolete': { label: 'Tidak Berlaku', color: 'red' },
  'archived': { label: 'Diarsipkan', color: 'purple' }
};
```

---

## 5. Layout Design

### 5.1 Main Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│ HEADER (56px)                                                   │
│ ┌──────┬────────────────────────────────────┬─────────────────┐│
│ │ Logo │  Search (global)                   │ Notif | Profile ││
│ └──────┴────────────────────────────────────┴─────────────────┘│
├────────┬───────────────────────────────────────────────────────┤
│        │                                                        │
│  S     │  CONTENT AREA                                         │
│  I     │  ┌─────────────────────────────────────────────────┐  │
│  D     │  │ Breadcrumb                                      │  │
│  E     │  ├─────────────────────────────────────────────────┤  │
│  B     │  │ Page Header                          [Actions]  │  │
│  A     │  ├─────────────────────────────────────────────────┤  │
│  R     │  │                                                 │  │
│        │  │  Page Content                                   │  │
│ (240px │  │  - Table                                        │  │
│  atau  │  │  - Forms                                        │  │
│  64px  │  │  - Cards                                        │  │
│  saat  │  │                                                 │  │
│  colla │  │                                                 │  │
│  psed) │  │                                                 │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴───────────────────────────────────────────────────────┘
```

### 5.2 Sidebar Menu Structure

```typescript
// menu-items.ts

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  route?: string;
  permission?: string;            // Required permission to show
  children?: MenuItem[];
  badge?: number | Observable<number>;  // Notification count
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'icon-home',
    route: '/dashboard'
  },
  {
    key: 'documents',
    label: 'Dokumen',
    icon: 'icon-file-text',
    permission: 'document.view',
    children: [
      { key: 'doc-create', label: 'Buat Baru', route: '/documents/create', permission: 'document.create' },
      { key: 'doc-my', label: 'Dokumen Saya', route: '/documents/my', permission: 'document.view' },
      { key: 'doc-pending-review', label: 'Perlu Review', route: '/documents/pending-review', permission: 'document.review', badge: pendingReviewCount$ },
      { key: 'doc-pending-approval', label: 'Perlu Approval', route: '/documents/pending-approval', permission: 'document.approve', badge: pendingApprovalCount$ },
      { key: 'doc-all', label: 'Semua Dokumen', route: '/documents', permission: 'document.view' }
    ]
  },
  {
    key: 'templates',
    label: 'Template',
    icon: 'icon-layout',
    route: '/templates',
    permission: 'template.view'
  },
  {
    key: 'workflows',
    label: 'Workflow',
    icon: 'icon-git-branch',
    route: '/workflows',
    permission: 'workflow.view'
  },
  {
    key: 'organization',
    label: 'Organisasi',
    icon: 'icon-building',
    permission: 'company.view',
    children: [
      { key: 'org-companies', label: 'Perusahaan', route: '/organization/companies', permission: 'company.view' },
      { key: 'org-offices', label: 'Kantor', route: '/organization/offices', permission: 'office.view' },
      { key: 'org-departments', label: 'Departemen', route: '/organization/departments', permission: 'department.view' },
      { key: 'org-sections', label: 'Seksi', route: '/organization/sections', permission: 'section.view' },
      { key: 'org-positions', label: 'Jabatan', route: '/organization/positions', permission: 'position.view' }
    ]
  },
  {
    key: 'users',
    label: 'Pengguna',
    icon: 'icon-users',
    route: '/users',
    permission: 'user.view'
  },
  {
    key: 'roles',
    label: 'Role & Permissions',
    icon: 'icon-shield',
    route: '/roles',
    permission: 'user.assign_role'
  },
  {
    key: 'categories',
    label: 'Kategori',
    icon: 'icon-folder',
    route: '/categories',
    permission: 'template.view'
  },
  {
    key: 'audit-logs',
    label: 'Audit Log',
    icon: 'icon-activity',
    route: '/audit-logs',
    permission: 'audit.view'
  },
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: 'icon-settings',
    route: '/settings',
    permission: 'setting.view'
  }
];
```

### 5.3 Responsive Breakpoints

```scss
// _responsive.scss

$breakpoints: (
  'xs': 0,        // Mobile portrait
  'sm': 576px,    // Mobile landscape
  'md': 768px,    // Tablet
  'lg': 992px,    // Desktop
  'xl': 1200px,   // Large desktop
  'xxl': 1400px   // Extra large
);

// Mixins
@mixin mobile { @media (max-width: 767px) { @content; } }
@mixin tablet { @media (min-width: 768px) and (max-width: 991px) { @content; } }
@mixin desktop { @media (min-width: 992px) { @content; } }
@mixin mobile-tablet { @media (max-width: 991px) { @content; } }

// Layout behavior
@include mobile {
  .sidebar { 
    position: fixed;
    left: -240px;  // Hidden by default
    &.open { left: 0; }
  }
  .content { margin-left: 0; }
}

@include tablet {
  .sidebar { width: 64px; }  // Collapsed, icons only
  .sidebar.expanded { width: 240px; }
}

@include desktop {
  .sidebar { width: 240px; }  // Full width
  .sidebar.collapsed { width: 64px; }
}
```

---

## 6. Styling (SCSS)

### 6.1 Variables

```scss
// _variables.scss

// Colors
$primary: #1a56db;           // Blue
$primary-light: #e1effe;
$primary-dark: #1e429f;

$success: #0e9f6e;
$success-light: #def7ec;

$warning: #c27803;
$warning-light: #fdf6b2;

$danger: #e02424;
$danger-light: #fde8e8;

$info: #3f83f8;
$info-light: #e1effe;

// Neutrals
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;

$white: #ffffff;
$black: #000000;

// Text
$text-primary: $gray-900;
$text-secondary: $gray-600;
$text-muted: $gray-400;
$text-inverse: $white;

// Background
$bg-page: $gray-50;
$bg-card: $white;
$bg-sidebar: $gray-900;
$bg-header: $white;

// Border
$border-color: $gray-200;
$border-radius: 6px;
$border-radius-sm: 4px;
$border-radius-lg: 8px;

// Compact Spacing (smaller than default)
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 24px;

// Typography
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$font-size-xs: 11px;
$font-size-sm: 12px;
$font-size-md: 13px;
$font-size-lg: 14px;
$font-size-xl: 16px;
$font-size-2xl: 18px;
$font-size-3xl: 24px;

$line-height: 1.5;
$line-height-tight: 1.25;

// Shadows
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

// Transitions
$transition-fast: 150ms ease;
$transition-normal: 200ms ease;
$transition-slow: 300ms ease;

// Z-index
$z-dropdown: 1000;
$z-sticky: 1020;
$z-fixed: 1030;
$z-modal-backdrop: 1040;
$z-modal: 1050;
$z-drawer: 1060;
$z-toast: 1070;
```

### 6.2 Compact Overrides

```scss
// _compact.scss

// Smaller form controls
.form-input,
.form-select,
.form-textarea {
  padding: 6px 10px;
  font-size: $font-size-sm;
  line-height: $line-height-tight;
  min-height: 32px;
}

// Compact buttons
.btn {
  padding: 6px 12px;
  font-size: $font-size-sm;
  line-height: $line-height-tight;
  
  &.btn-sm {
    padding: 4px 8px;
    font-size: $font-size-xs;
  }
  
  &.btn-lg {
    padding: 8px 16px;
    font-size: $font-size-md;
  }
}

// Dense table
.table {
  font-size: $font-size-sm;
  
  th, td {
    padding: 8px 12px;
    vertical-align: middle;
  }
  
  th {
    font-weight: 600;
    background: $gray-50;
    border-bottom: 2px solid $border-color;
  }
  
  &.table-dense {
    th, td {
      padding: 6px 10px;
    }
  }
}

// Compact cards
.card {
  padding: $spacing-md;
  
  .card-header {
    padding: $spacing-sm $spacing-md;
    margin: -#{$spacing-md} -#{$spacing-md} $spacing-md;
    border-bottom: 1px solid $border-color;
  }
}

// Compact drawer
.drawer-body {
  padding: $spacing-md;
}

// Compact modal
.modal-body {
  padding: $spacing-md;
}

// Compact form spacing
.form-group {
  margin-bottom: $spacing-md;
}

// Compact page header
.page-header {
  padding: $spacing-md 0;
  margin-bottom: $spacing-md;
}
```

---

## 7. Routing Configuration

### 7.1 App Routing (Lazy Load)

```typescript
// app-routing.module.ts

const routes: Routes = [
  // Public routes (no layout)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  
  // Protected routes (with layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'documents',
        loadChildren: () => import('./features/documents/documents.module').then(m => m.DocumentsModule),
        canActivate: [PermissionGuard],
        data: { permission: 'document.view' }
      },
      {
        path: 'templates',
        loadChildren: () => import('./features/templates/templates.module').then(m => m.TemplatesModule),
        canActivate: [PermissionGuard],
        data: { permission: 'template.view' }
      },
      {
        path: 'workflows',
        loadChildren: () => import('./features/workflows/workflows.module').then(m => m.WorkflowsModule),
        canActivate: [PermissionGuard],
        data: { permission: 'workflow.view' }
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule),
        canActivate: [PermissionGuard],
        data: { permission: 'user.view' }
      },
      {
        path: 'roles',
        loadChildren: () => import('./features/roles/roles.module').then(m => m.RolesModule),
        canActivate: [PermissionGuard],
        data: { permission: 'user.assign_role' }
      },
      {
        path: 'organization',
        loadChildren: () => import('./features/organization/organization.module').then(m => m.OrganizationModule),
        canActivate: [PermissionGuard],
        data: { permission: 'company.view' }
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.module').then(m => m.CategoriesModule),
        canActivate: [PermissionGuard],
        data: { permission: 'template.view' }
      },
      {
        path: 'audit-logs',
        loadChildren: () => import('./features/audit-logs/audit-logs.module').then(m => m.AuditLogsModule),
        canActivate: [PermissionGuard],
        data: { permission: 'audit.view' }
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
        canActivate: [PermissionGuard],
        data: { permission: 'setting.view' }
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule)
      }
    ]
  },
  
  // Error pages
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent }
];
```

### 7.2 Feature Module Routing Example (Documents)

```typescript
// features/documents/documents-routing.module.ts

const routes: Routes = [
  {
    path: '',
    component: DocumentListComponent
  },
  {
    path: 'create',
    component: DocumentCreateComponent,
    canActivate: [PermissionGuard],
    data: { permission: 'document.create' }
  },
  {
    path: 'my',
    component: DocumentListComponent,
    data: { filter: 'my' }
  },
  {
    path: 'pending-review',
    component: DocumentListComponent,
    data: { filter: 'pending-review' }
  },
  {
    path: 'pending-approval',
    component: DocumentListComponent,
    data: { filter: 'pending-approval' }
  },
  {
    path: ':id',
    component: DocumentDetailComponent       // Full page detail
  },
  {
    path: ':id/edit',
    component: DocumentEditorComponent,       // OnlyOffice editor
    canActivate: [PermissionGuard],
    data: { permission: 'document.edit' }
  }
];
```

---

## 8. State Management

### 8.1 Auth State (Signals)

```typescript
// core/auth/auth.service.ts

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _isAuthenticated = computed(() => !!this._token());
  private _permissions = computed(() => this._user()?.permissions ?? []);
  private _roles = computed(() => this._user()?.roles ?? []);
  
  // Public readonly
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;
  readonly permissions = this._permissions;
  readonly roles = this._roles;
  
  constructor(
    private authApi: AuthApiService,
    private router: Router
  ) {
    this.loadFromStorage();
  }
  
  login(email: string, password: string): Observable<LoginResponse> {
    return this.authApi.login({ email, password }).pipe(
      tap(response => {
        this._user.set(response.data.user);
        this._token.set(response.data.token);
        this.saveToStorage(response.data);
      })
    );
  }
  
  logout(): void {
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('auth');
    this.router.navigate(['/auth/login']);
  }
  
  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }
  
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }
  
  hasRole(role: string): boolean {
    return this._roles().includes(role);
  }
  
  private loadFromStorage(): void {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const data = JSON.parse(stored);
      this._user.set(data.user);
      this._token.set(data.token);
    }
  }
  
  private saveToStorage(data: { user: User; token: string }): void {
    localStorage.setItem('auth', JSON.stringify(data));
  }
}
```

### 8.2 Feature State (Service + Signals)

```typescript
// features/documents/services/document.service.ts

@Injectable()
export class DocumentService {
  // State signals
  private _documents = signal<Document[]>([]);
  private _loading = signal(false);
  private _totalItems = signal(0);
  private _currentParams = signal<DocumentListParams>({
    page: 1,
    pageSize: 20,
    sort: 'created_at',
    order: 'desc'
  });
  
  // Public readonly
  readonly documents = this._documents.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly currentParams = this._currentParams.asReadonly();
  
  constructor(private documentApi: DocumentsApiService) {}
  
  loadDocuments(params?: Partial<DocumentListParams>): void {
    const mergedParams = { ...this._currentParams(), ...params };
    this._currentParams.set(mergedParams);
    this._loading.set(true);
    
    this.documentApi.getDocuments(mergedParams).subscribe({
      next: (response) => {
        this._documents.set(response.data);
        this._totalItems.set(response.meta.total);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }
  
  createDocument(data: CreateDocumentRequest): Observable<Document> {
    return this.documentApi.createDocument(data).pipe(
      tap(() => this.loadDocuments()) // Refresh list
    );
  }
  
  updateDocument(id: string, data: UpdateDocumentRequest): Observable<Document> {
    return this.documentApi.updateDocument(id, data).pipe(
      tap(() => this.loadDocuments())
    );
  }
  
  deleteDocument(id: string): Observable<void> {
    return this.documentApi.deleteDocument(id).pipe(
      tap(() => this.loadDocuments())
    );
  }
}
```

---

## 9. API Integration (ng-openapi-gen)

### 9.1 Generate API SDK

**Command untuk generate API SDK:**
```bash
# Dari folder frontend/
ng-openapi-gen --input http://127.0.0.1:3000/api/v1/docs/openapi.json --output src/app/api
```

**Atau jika belum install global:**
```bash
./node_modules/.bin/ng-openapi-gen --input http://127.0.0.1:3000/api/v1/docs/openapi.json --output src/app/api
```

**Tambahkan ke package.json untuk kemudahan:**
```json
"scripts": {
  "generate-api": "ng-openapi-gen --input http://127.0.0.1:3000/api/v1/docs/openapi.json --output src/app/api"
}
```

Lalu jalankan: `npm run generate-api`

### 9.2 Generated Structure

```
src/app/api/
├── api.module.ts              # Module with providers
├── api-configuration.ts       # Base URL config
├── base-service.ts            # Base service class
├── request-builder.ts
├── strict-http-response.ts
├── services/
│   ├── auth-api.service.ts
│   ├── documents-api.service.ts
│   ├── templates-api.service.ts
│   ├── workflows-api.service.ts
│   ├── users-api.service.ts
│   ├── companies-api.service.ts
│   ├── offices-api.service.ts
│   ├── departments-api.service.ts
│   ├── sections-api.service.ts
│   ├── positions-api.service.ts
│   ├── roles-api.service.ts
│   ├── categories-api.service.ts
│   ├── audit-logs-api.service.ts
│   ├── notifications-api.service.ts
│   └── settings-api.service.ts
└── models/
    ├── user.ts
    ├── document.ts
    ├── template.ts
    ├── workflow.ts
    ├── company.ts
    ├── office.ts
    ├── department.ts
    ├── section.ts
    ├── position.ts
    ├── role.ts
    ├── permission.ts
    ├── category.ts
    ├── audit-log.ts
    ├── notification.ts
    └── ...
```

### 9.3 Module Setup

```typescript
// app.module.ts

@NgModule({
  imports: [
    ApiModule.forRoot({ rootUrl: environment.apiUrl })
  ]
})
export class AppModule { }
```

---

## 10. Commands to Generate Project

```bash
# 1. Install Angular CLI (if not installed)
npm install -g @angular/cli@20

# 2. Create project (no standalone, with routing)
ng new frontend --routing --style=scss --ssr=false --skip-tests=false

# 3. Change directory
cd frontend

# 4. Install dependencies
npm install ng-openapi-gen --save-dev

# 5. Generate API SDK (setelah backend ready)
ng-openapi-gen --input http://127.0.0.1:3000/api/v1/docs/openapi.json --output src/app/api

# 6. Generate modules
ng generate module core
ng generate module shared
ng generate module layout

# 7. Generate feature modules (lazy loaded)
ng generate module features/auth --routing
ng generate module features/dashboard --routing
ng generate module features/documents --routing
ng generate module features/templates --routing
ng generate module features/workflows --routing
ng generate module features/users --routing
ng generate module features/roles --routing
ng generate module features/organization --routing
ng generate module features/categories --routing
ng generate module features/audit-logs --routing
ng generate module features/notifications --routing
ng generate module features/settings --routing
ng generate module features/profile --routing

# 8. Serve (port 4200)
ng serve --port 4200 --open
```

---

## 11. Environment Config

```typescript
// environments/environment.ts

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  onlyOfficeUrl: 'http://localhost:8081',
  wsUrl: 'ws://localhost:8080/api/v1/ws'
};

// environments/environment.prod.ts

export const environment = {
  production: true,
  apiUrl: '/api/v1',
  onlyOfficeUrl: '/onlyoffice',
  wsUrl: 'wss://your-domain.com/api/v1/ws'
};
```

---

## 12. Summary

| Aspek | Spesifikasi |
|-------|-------------|
| Framework | Angular 20 |
| Port | 4200 |
| UI | Custom components (responsive, compact) |
| Module Pattern | NgModule (no standalone), lazy loading |
| State | Signals + Services |
| API | ng-openapi-gen |
| Styling | SCSS, variables, compact overrides |
| Bahasa | Indonesia |
| Action Pattern | Add/Edit = Drawer, Delete = Modal, Detail = Drawer (simple) + Page (full) |
| Table | Server-side pagination, sort, filter, search, export, column toggle |
| Routing | Lazy load per feature, permission guards |
| Folder | 1 component = 1 folder |

---

*Dokumen ini adalah technical design untuk Angular frontend. Implementasi akan mengikuti struktur dan pattern yang didefinisikan di sini.*
