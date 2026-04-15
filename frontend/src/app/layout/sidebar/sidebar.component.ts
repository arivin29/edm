import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { MENU_ITEMS } from './menu-config';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authState = inject(AuthStateService);

  // Inputs
  collapsed = input<boolean>(false);

  // Outputs
  toggleCollapse = output<void>();

  // State
  expandedMenus = signal<Set<string>>(new Set());
  menuItems = signal<MenuItem[]>(MENU_ITEMS);

  // Computed - filter menu items based on permissions
  visibleMenuItems = computed(() => {
    return this.filterMenuItems(this.menuItems());
  });

  /**
   * Filter menu items based on user permissions
   */
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      // Check permission
      if (item.permission && !this.authState.hasPermission(item.permission)) {
        return false;
      }

      // Filter children if exists
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

  /**
   * Toggle submenu expansion
   */
  toggleMenu(key: string): void {
    this.expandedMenus.update(set => {
      const newSet = new Set(set);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  /**
   * Check if menu is expanded
   */
  isExpanded(key: string): boolean {
    return this.expandedMenus().has(key);
  }

  /**
   * Check if menu has children
   */
  hasChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }

  /**
   * Handle menu item click
   */
  onMenuClick(item: MenuItem, event: Event): void {
    if (this.hasChildren(item)) {
      event.preventDefault();
      this.toggleMenu(item.key);
    }
  }
}
