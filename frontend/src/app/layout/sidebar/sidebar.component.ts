import { Component, signal, computed, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { MENU_ITEMS } from './menu-config';
import { environment } from '../../../environments/environment';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  queryParams?: Record<string, string>;
  permission?: string;
  children?: MenuItem[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzMenuModule, NzIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly http = inject(HttpClient);

  // Inputs
  collapsed = input<boolean>(false);

  // Outputs
  toggleCollapse = output<void>();

  // State
  menuItems = signal<MenuItem[]>(MENU_ITEMS);

  // Computed - filter menu items based on permissions
  visibleMenuItems = computed(() => {
    return this.filterMenuItems(this.menuItems());
  });

  ngOnInit() {
    this.loadDocumentTypes();
  }

  private loadDocumentTypes() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => {
        const types: any[] = res.data || [];
        const activeTypes = types.filter(t => t.is_active !== false);

        const docChildren: MenuItem[] = [
          { key: 'doc-all', label: 'Semua Dokumen', route: '/documents' }
        ];
        for (const t of activeTypes) {
          docChildren.push({
            key: `doc-type-${t.id}`,
            label: t.name,
            route: '/documents',
            queryParams: { type: t.id }
          });
        }

        const updated = this.menuItems().map(item => {
          if (item.key === 'documents') {
            return { ...item, children: docChildren };
          }
          return item;
        });
        this.menuItems.set(updated);
      },
      error: () => {}
    });
  }

  /**
   * Filter menu items based on user permissions
   */
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      if (item.permission && !this.authState.hasPermission(item.permission)) {
        return false;
      }
      if (item.children) {
        const visibleChildren = this.filterMenuItems(item.children);
        if (visibleChildren.length === 0) {
          return false;
        }
        item = { ...item, children: visibleChildren };
      }
      return true;
    });
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }
}
